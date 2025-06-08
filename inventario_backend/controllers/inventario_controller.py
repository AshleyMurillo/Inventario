from flask import Blueprint, jsonify, request
from db import get_connection
from datetime import datetime
from services.eoq_service import (
    calcular_eoq,
    calcular_stock_seguridad,
    calcular_pro,
    generar_alerta
)

inventario_bp = Blueprint('inventario', __name__)

@inventario_bp.route('/api/inventario/<product_id>', methods=['GET'])
def obtener_producto(product_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT p.Product_ID, p.Product_Name, p.Unit_Price,
               i.Stock_Quantity, i.Sales_Volume,
               l.Order_Cost, l.Holding_Cost_Percentage, l.Lead_Time
        FROM Productos p
        JOIN Inventario i ON p.Product_ID = i.Product_ID
        JOIN Logistica l ON p.Product_ID = l.Product_ID
        WHERE p.Product_ID = %s
    """, (product_id,))
    
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        return jsonify({"error": "Producto no encontrado"}), 404

    try:
        demanda_anual = row['Sales_Volume'] * 12
        demanda_diaria = row['Sales_Volume'] / 30
        h = row['Unit_Price'] * (row['Holding_Cost_Percentage'] / 100)

        eoq = calcular_eoq(demanda_anual, row['Order_Cost'], h)
        stock_seguro = calcular_stock_seguridad(demanda_diaria)
        pro = calcular_pro(demanda_diaria, row['Lead_Time'], stock_seguro)
        alerta = generar_alerta(row['Stock_Quantity'], pro, eoq)

    except KeyError as e:
        return jsonify({
            "error": f"Falta el campo esperado: {e.args[0]}",
            "detalle": "Verifica el SELECT SQL o la estructura de la tabla."
        }), 400
    except Exception as e:
        return jsonify({
            "error": "Error al procesar el producto",
            "detalle": str(e)
        }), 400

    return jsonify({
        "producto": row,
        "eoq": eoq,
        "stock_seguridad": stock_seguro,
        "pro": pro,
        "alerta": alerta
    })



#Total de productos activos
@inventario_bp.route('/api/inventario/activos', methods=['GET'])
def contar_productos_activos():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM Productos WHERE Status = 'Active'")
    total = cursor.fetchone()[0]
    cursor.close()
    conn.close()

    return jsonify({"total_activos": total})


#Productos vencidos
@inventario_bp.route('/api/inventario/vencidos', methods=['GET'])
def productos_vencidos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Obtener la fecha de hoy en formato YYYY-MM-DD
    hoy = datetime.now().date()

    cursor.execute("""
        SELECT p.Product_Name, i.Expiration_Date
        FROM Productos p
        JOIN Inventario i ON p.Product_ID = i.Product_ID
        WHERE i.Expiration_Date < %s
    """, (hoy,))

    vencidos = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(vencidos)


#Porductos con bajo inventario
@inventario_bp.route('/api/inventario/bajo-stock', methods=['GET'])
def productos_bajo_stock():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT p.Product_Name, i.Stock_Quantity
        FROM Productos p
        JOIN Inventario i ON p.Product_ID = i.Product_ID
        WHERE i.Stock_Quantity <= i.Reorder_Level
    """)

    bajos = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(bajos)
