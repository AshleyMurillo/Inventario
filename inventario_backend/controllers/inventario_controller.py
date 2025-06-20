from flask import Blueprint, jsonify, request
from db import get_connection
from datetime import datetime, timedelta
from services.eoq_service import (
    calcular_eoq,
    calcular_stock_seguridad,
    calcular_pro,
    generar_alerta
)

inventario_bp = Blueprint('inventario', __name__)


# ENDPOINT Total de productos activos
@inventario_bp.route('/api/inventario/activos', methods=['GET'])
def contar_productos_activos():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) AS total FROM Productos WHERE Status = 'Active'")
    total = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return jsonify({"total_activos": total})


# ENDPOINT Productos vencidos
@inventario_bp.route('/api/inventario/vencidos', methods=['GET'])
def productos_vencidos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
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


# ENDPOINT Productos con bajo inventario
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


# ENDPOINT Inventario con EOQ (tabla principal)
@inventario_bp.route('/api/inventario/con-eoq', methods=['GET'])
def productos_con_eoq():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT p.Product_ID, p.Product_Name, p.Unit_Price,
               i.Stock_Quantity, i.Sales_Volume,
               l.Order_Cost, l.Holding_Cost_Percentage, l.Lead_Time
        FROM Productos p
        JOIN Inventario i ON p.Product_ID = i.Product_ID
        JOIN Logistica l ON p.Product_ID = l.Product_ID
    """)

    resultados = []
    for row in cursor.fetchall():
        try:
            demanda_anual = row['Sales_Volume'] * 12
            demanda_diaria = row['Sales_Volume'] / 30
            order_cost = row['Order_Cost']
            holding_cost = row['Unit_Price'] * (row['Holding_Cost_Percentage'] / 100)

            eoq = calcular_eoq(demanda_anual, order_cost, holding_cost)
            stock_seguro = calcular_stock_seguridad(demanda_diaria)
            pro = calcular_pro(demanda_diaria, row['Lead_Time'], stock_seguro)

            resultados.append({
                "Product_ID": row['Product_ID'],
                "Product_Name": row['Product_Name'],
                "Stock_Quantity": row['Stock_Quantity'],
                "Sales_Volume": row['Sales_Volume'],
                "Lead_Time": row['Lead_Time'],
                "EOQ": round(eoq),
                "Stock_Seguro": round(stock_seguro),
                "PRO": round(pro)
            })
        except Exception as e:
            print(f"Error en producto {row['Product_Name']}: {e}")
            resultados.append({
                "Product_ID": row['Product_ID'],
                "Product_Name": row['Product_Name'],
                "Stock_Quantity": row['Stock_Quantity'],
                "Sales_Volume": row['Sales_Volume'] or 0,
                "Lead_Time": row['Lead_Time'] or 7,
                "EOQ": 0,
                "Stock_Seguro": 0,
                "PRO": 0
            })

    cursor.close()
    conn.close()
    return jsonify(resultados)

# ENDPOINT Detalles de producto 
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
        demanda_anual = row['Sales_Volume'] * 12
        demanda_diaria = row['Sales_Volume'] / 30
        h = row['Unit_Price'] * (row['Holding_Cost_Percentage'] / 100)

        eoq = calcular_eoq(demanda_anual, row['Order_Cost'], h)
        stock_seguro = calcular_stock_seguridad(demanda_diaria)
        pro = calcular_pro(demanda_diaria, row['Lead_Time'], stock_seguro)
        alerta = generar_alerta(row['Stock_Quantity'], pro, eoq)

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



#Endpoint obtener lista de proveedores
@inventario_bp.route('/api/proveedores', methods=['GET'])
def obtener_proveedores():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT Supplier_ID, Supplier_Name FROM Proveedores")
    proveedores = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(proveedores)


#Endpoint listar todos los productos disponibles
@inventario_bp.route('/api/inventario', methods=['GET'])
def listar_productos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT p.Product_ID, p.Product_Name
        FROM Productos p
        WHERE p.Status = 'Active'
    """)
    productos = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(productos)




# Endpoint obtener stock de un producto por ID
@inventario_bp.route('/api/inventario/<product_id>', methods=['GET'])
def obtener_stock_producto(product_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT p.Product_ID, p.Product_Name, i.Stock_Quantity
        FROM Productos p
        JOIN Inventario i ON p.Product_ID = i.Product_ID
        WHERE p.Product_ID = %s
    """, (product_id,))
    
    producto = cursor.fetchone()
    cursor.close()
    conn.close()

    if not producto:
        return jsonify({"error": "Producto no encontrado"}), 404

    return jsonify({"producto": producto})



#Endpoint agregar nuevo pedido

@inventario_bp.route('/api/pedidos', methods=['POST'])
def registrar_pedido_manual():
    data = request.get_json()
    supplier_id = data.get("Supplier_ID")
    product_id = data.get("Product_ID")
    cantidad = data.get("Cantidad")

    if not all([supplier_id, product_id, cantidad]):
        return jsonify({"error": "Faltan datos requeridos"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # 1. Verificar que el producto exista y esté activo
    cursor.execute("""
        SELECT p.Status, i.Stock_Quantity, l.Lead_Time
        FROM Productos p
        JOIN Inventario i ON p.Product_ID = i.Product_ID
        JOIN Logistica l ON p.Product_ID = l.Product_ID
        WHERE p.Product_ID = %s AND p.Supplier_ID = %s
    """, (product_id, supplier_id))
    
    result = cursor.fetchone()

    if not result:
        cursor.close()
        conn.close()
        return jsonify({"error": "Producto o proveedor no encontrado: Revisar la lista de productos que trae ese proveedor"}), 404

    if result["Status"] == "Discontinued":
        cursor.close()
        conn.close()
        return jsonify({"error": "Este producto ha sido descontinuado"}), 400

    stock_actual = result["Stock_Quantity"]
    lead_time = result["Lead_Time"]
    fecha_pedido = datetime.today().date()
    fecha_entrega = fecha_pedido + timedelta(days=lead_time)

    # Calcular fecha de expiración (30 días después de entrega estimada)
    fecha_expiracion = fecha_entrega + timedelta(days=30)

    # 2. Actualizar la fecha de último pedido y expiración
    cursor.execute("""
        UPDATE Inventario
        SET Last_Order_Date = %s,
                   Date_Received= %s ,
            Expiration_Date = %s
        WHERE Product_ID = %s
    """, (fecha_pedido, fecha_entrega, fecha_expiracion, product_id))

    # 3. Cambiar estado a 'Backordered'
    cursor.execute("""
        UPDATE Productos
        SET Status = 'Backordered'
        WHERE Product_ID = %s
    """, (product_id,))

    # 4. Si hoy es igual a la fecha estimada de entrega, actualizar a recibido y activo
    if fecha_entrega == datetime.today().date():
        cursor.execute("""
            UPDATE Inventario
            SET Date_Received = %s
            WHERE Product_ID = %s
        """, (fecha_entrega, product_id))

        cursor.execute("""
            UPDATE Productos
            SET Status = 'Active'
            WHERE Product_ID = %s
        """, (product_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "mensaje": "Pedido registrado correctamente",
        "Product_ID": product_id,
        "Supplier_ID": supplier_id,
        "Cantidad_Solicitada": cantidad,
        "Stock_Actual": stock_actual,
        "Fecha_Entrega_Estimada": str(fecha_entrega),
        "Nueva_Fecha_Expiracion": str(fecha_expiracion),
        "Nuevo_Estado": "Active" if fecha_entrega <=datetime.today().date() else "Backordered"
    }), 200


#Endpoint simular promociones
@inventario_bp.route('/api/inventario/simular-promocion/<product_id>', methods=['POST'])
def simular_promocion(product_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Validar que se recibió el JSON
        if not request.json:
            return jsonify({"error": "No se recibió datos JSON"}), 400
            
        data = request.json
        aumento_porcentual = data.get('porcentaje_promocion')

        # Validar el porcentaje
        if aumento_porcentual is None:
            return jsonify({"error": "Debe enviar el porcentaje_promocion en el cuerpo JSON"}), 400
            
        # Convertir a float y validar rango
        try:
            aumento_porcentual = float(aumento_porcentual)
            if aumento_porcentual <= 0 or aumento_porcentual > 100:
                return jsonify({"error": "El porcentaje debe estar entre 1 y 100"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "El porcentaje_promocion debe ser un número válido"}), 400

        print(f"Simulando promoción para producto: {product_id} con {aumento_porcentual}%")

        # Buscar el producto
        cursor.execute("""
            SELECT p.Product_ID, p.Product_Name, p.Unit_Price,
                   i.Stock_Quantity, i.Sales_Volume,
                   l.Order_Cost, l.Holding_Cost_Percentage
            FROM Productos p
            JOIN Inventario i ON p.Product_ID = i.Product_ID
            JOIN Logistica l ON p.Product_ID = l.Product_ID
            WHERE p.Product_ID = %s
        """, (product_id,))

        row = cursor.fetchone()
        if not row:
            return jsonify({"error": f"Producto con ID {product_id} no encontrado"}), 404

        # Validar que los datos necesarios no sean None o 0
        required_fields = ['Sales_Volume', 'Order_Cost', 'Unit_Price', 'Holding_Cost_Percentage']
        for field in required_fields:
            if row[field] is None or row[field] == 0:
                return jsonify({
                    "error": f"El producto no tiene datos válidos para {field}",
                    "detalle": f"Valor actual: {row[field]}"
                }), 400

        # Cálculos base
        demanda_actual = float(row['Sales_Volume']) * 12
        order_cost = float(row['Order_Cost'])
        holding_cost = float(row['Unit_Price']) * (float(row['Holding_Cost_Percentage']) / 100)

        # Validar que los valores calculados sean válidos
        if demanda_actual <= 0:
            return jsonify({"error": "La demanda anual debe ser mayor a 0"}), 400
        if order_cost <= 0:
            return jsonify({"error": "El costo de pedido debe ser mayor a 0"}), 400
        if holding_cost <= 0:
            return jsonify({"error": "El costo de almacenamiento debe ser mayor a 0"}), 400

        # Calcular EOQ actual
        try:
            eoq_actual = calcular_eoq(demanda_actual, order_cost, holding_cost)
        except Exception as e:
            return jsonify({
                "error": "Error al calcular EOQ actual",
                "detalle": str(e)
            }), 500

        # Simulación con promoción
        nueva_demanda = demanda_actual * (1 + aumento_porcentual / 100)
        
        try:
            eoq_promocion = calcular_eoq(nueva_demanda, order_cost, holding_cost)
        except Exception as e:
            return jsonify({
                "error": "Error al calcular EOQ con promoción",
                "detalle": str(e)
            }), 500

        # Preparar respuesta con valores redondeados
        resultado = {
            "Producto": row['Product_Name'],
            "Demanda Anual Actual": round(demanda_actual),
            "EOQ Actual": round(eoq_actual),
            "Demanda Anual Simulada": round(nueva_demanda),
            "EOQ con Promoción": round(eoq_promocion),
            "Diferencia EOQ": round(eoq_promocion - eoq_actual)
        }
        
        return jsonify(resultado)

    except Exception as e:
        return jsonify({
            "error": "Error interno del servidor",
            "detalle": str(e),
            "tipo": type(e)._name_
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()