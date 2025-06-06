import math

def calcular_eoq(demanda_anual, costo_pedido, costo_mantenimiento):
    return round(math.sqrt((2 * demanda_anual * costo_pedido) / costo_mantenimiento), 2)

def calcular_stock_seguridad(demanda_diaria, dias_seguridad=3):
    return round(demanda_diaria * dias_seguridad)

def calcular_pro(demanda_diaria, lead_time, stock_seguridad):
    return round((demanda_diaria * lead_time) + stock_seguridad)

def generar_alerta(stock_actual, punto_reorden, eoq):
    if stock_actual <= punto_reorden:
        return {"alerta": True, "cantidad_sugerida": eoq}
    return {"alerta": False, "cantidad_sugerida": 0}
