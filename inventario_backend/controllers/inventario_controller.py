from flask import Blueprint, jsonify
from db import get_connection
from services.eoq_service import *

inventario_bp = Blueprint('inventario', __name__)

@inventario_bp.route('/api/inventario/<product_id>', methods=['GET'])
def obtener_producto(product_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
   
    cursor.execute("""
        SELECT p.Product_ID, p.Unit_Price, p.Product_Name, i.Stock_Quantity, i.Sales_Volume,
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

    demanda_anual = row['Sales_Volume'] * 12
    demanda_diaria = row['Sales_Volume'] / 30
    h = row['Unit_Price'] * (row['Holding_Cost_Percentage'] / 100)

    eoq = calcular_eoq(demanda_anual, row['Order_Cost'], h)
    stock_seguro = calcular_stock_seguridad(demanda_diaria)
    pro = calcular_pro(demanda_diaria, row['Lead_Time'], stock_seguro)
    alerta = generar_alerta(row['Stock_Quantity'], pro, eoq)

    return jsonify({
        "producto": row,
        "eoq": eoq,
        "stock_seguridad": stock_seguro,
        "pro": pro,
        "alerta": alerta
    })
