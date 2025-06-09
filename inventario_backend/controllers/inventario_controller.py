from flask import Blueprint, jsonify, request
from db import get_connection
from datetime import datetime
from services.eoq_service import (
    calcular_eoq,
    calcular_stock_seguridad,
    calcular_pro,
    generar_alerta
)


from services.eoq_service import (
    calcular_eoq,
    calcular_stock_seguridad,
    calcular_pro,
    generar_alerta
)

inventario_bp = Blueprint('inventario', __name__)


#ENDPOINT Total de productos activos
@inventario_bp.route('/api/inventario/activos', methods=['GET'])
def contar_productos_activos():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) AS total FROM Productos WHERE Status = 'Active'")
    total = cursor.fetchone()[0]
    cursor.close()
    conn.close()

    return jsonify({"total_activos": total})


#ENDPOINT Productos vencidos
@inventario_bp.route('/api/inventario/vencidos', methods=['GET'])
def productos_vencidos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Obtener la fecha de hoy en formato YYYY-MM-DD
    hoy = datetime.now().date()

    cursor.execute("""
        SELECT 
        p.Product_ID AS id,
        p.Product_Name AS nombre,
        i.Expiration_Date AS fechaVencimiento,
        COALESCE(p.Catagory, 'Sin categoría') AS categoria
    FROM Productos p
    JOIN Inventario i ON p.Product_ID = i.Product_ID
    WHERE i.Expiration_Date < %s
""", (hoy,))

    vencidos = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(vencidos)


#ENDPOINT Porductos con bajo inventario
@inventario_bp.route('/api/inventario/bajo-stock', methods=['GET'])
def productos_bajo_stock():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
       SELECT 
        p.Product_ID AS id,
        p.Product_Name AS nombre,
        i.Stock_Quantity AS existencias,
        COALESCE(p.Catagory, 'Sin categoría') AS categoria
    FROM Productos p
    JOIN Inventario i ON p.Product_ID = i.Product_ID
    WHERE i.Stock_Quantity <= i.Reorder_Level
""")

    bajos = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(bajos)



#ENDPOINT PANTALLA 2
@inventario_bp.route('/api/inventario/con-eoq', methods=['GET'])
def productos_con_eoq():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT p.Product_Name, p.Unit_Price,
               i.Stock_Quantity, i.Sales_Volume,
               l.Order_Cost, l.Holding_Cost_Percentage
        FROM Productos p
        JOIN Inventario i ON p.Product_ID = i.Product_ID
        JOIN Logistica l ON p.Product_ID = l.Product_ID
    """)

    resultados = []
    for row in cursor.fetchall():
        try:
            demanda_anual = row['Sales_Volume'] * 12
            order_cost = row['Order_Cost']
            holding_cost = row['Unit_Price'] * (row['Holding_Cost_Percentage'] / 100)

            eoq = calcular_eoq(demanda_anual, order_cost, holding_cost)

            resultados.append({
                "Product_Name": row['Product_Name'],
                "Stock_Quantity": row['Stock_Quantity'],
                "EOQ": eoq
            })
        except Exception as e:
            print(f"Error en producto {row['Product_Name']}: {e}")

    cursor.close()
    conn.close()

    return jsonify(resultados)


#ENDPOINT DETALLES DEL PRODUCTO
@inventario_bp.route('/api/inventario/detalles/<product_id>', methods=['GET'])
def detalles_producto(product_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT p.Product_ID, p.Unit_Price, p.Status,
               i.Stock_Quantity, i.Sales_Volume,
               l.Order_Cost, l.Holding_Cost_Percentage, l.Lead_Time
        FROM Productos p
        JOIN Inventario i ON p.Product_ID = i.Product_ID
        JOIN Logistica l ON p.Product_ID = l.Product_ID
        WHERE p.Product_ID = %s
    """, (product_id,))
    
    row = cursor.fetchone()

    if not row:
        cursor.close()
        conn.close()
        return jsonify({"error": "Producto no encontrado"}), 404

    try:
        # Calcular métricas
        demanda_anual = row['Sales_Volume'] * 12
        demanda_diaria = row['Sales_Volume'] / 30
        h = row['Unit_Price'] * (row['Holding_Cost_Percentage'] / 100)

        eoq = calcular_eoq(demanda_anual, row['Order_Cost'], h)
        stock_seguro = calcular_stock_seguridad(demanda_diaria)
        pro = calcular_pro(demanda_diaria, row['Lead_Time'], stock_seguro)
        alerta = generar_alerta(row['Stock_Quantity'], pro, eoq)

        # Insertar o actualizar en tabla Calculos
        cursor.execute("""
            INSERT INTO Calculos (
                Product_ID, Annual_Demand, Daily_Demand,
                EOQ, Safety_Stock, PRO, Suggested_Order, Restock_Alert
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                Annual_Demand = VALUES(Annual_Demand),
                Daily_Demand = VALUES(Daily_Demand),
                EOQ = VALUES(EOQ),
                Safety_Stock = VALUES(Safety_Stock),
                PRO = VALUES(PRO),
                Suggested_Order = VALUES(Suggested_Order),
                Restock_Alert = VALUES(Restock_Alert)
        """, (
            row['Product_ID'],
            demanda_anual,
            round(demanda_diaria, 2),
            eoq,
            stock_seguro,
            pro,
            alerta["cantidad_sugerida"],
            alerta["alerta"]
        ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
  
            "Stock actual": row['Stock_Quantity'],
            "EOQ": eoq,
            "Stock seguro": stock_seguro,
            "PRO": pro,
            "Pedido sugerido": alerta["cantidad_sugerida"],
            "Estado": row["Status"]
        })

    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({
            "error": "Error al calcular métricas del producto",
            "detalle": str(e)
        }), 500
