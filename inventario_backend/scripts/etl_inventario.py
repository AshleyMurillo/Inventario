import pandas as pd
import mysql.connector

# Conexión a MySQL
conn = mysql.connector.connect(
    host="localhost",
    user="Ash",
    password="admin.4",
    database="InventarioAbarrotes"
)
cursor = conn.cursor()

# Cargar el archivo Excel
df = pd.read_excel("Grocery_Inventory_and_Sales_Dataset.xlsx")

df = df.fillna(value=pd.NA)  # para pandas 1.0+
df = df.where(pd.notnull(df), None)  # convierte NaN a None (aceptado por MySQL)


# Cargar Proveedores (evita duplicados)
proveedores = df[['Supplier_ID', 'Supplier_Name']].drop_duplicates()
for _, row in proveedores.iterrows():
    cursor.execute("""
        INSERT IGNORE INTO Proveedores (Supplier_ID, Supplier_Name)
        VALUES (%s, %s)
    """, (row['Supplier_ID'], row['Supplier_Name']))

# Cargar Productos
for _, row in df.iterrows():
    cursor.execute("""
        INSERT IGNORE INTO Productos (Product_ID, Product_Name, Catagory, Supplier_ID, Unit_Price, Status)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        row['Product_ID'], row['Product_Name'], row['Catagory'], row['Supplier_ID'],
        row['Unit_Price'], row['Status']
    ))

# Cargar Inventario
for _, row in df.iterrows():
    cursor.execute("""
        INSERT IGNORE INTO Inventario (
            Product_ID, Stock_Quantity, Reorder_Level, Reorder_Quantity,
            Date_Received, Last_Order_Date, Expiration_Date,
            Warehouse_Location, Sales_Volume, Inventory_Turnover_Rate
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        row['Product_ID'], row['Stock_Quantity'], row['Reorder_Level'],
        row['Reorder_Quantity'], row['Date_Received'], row['Last_Order_Date'],
        row['Expiration_Date'], row['Warehouse_Location'], row['Sales_Volume'],
        row['Inventory_Turnover_Rate']
    ))



#PARTE LOGISTICA 

# Calcular campos logísticos desde el DataFrame original (df)
logistica_df = df.copy()

# 1. Calcular Order_Cost
logistica_df["Order_Cost"] = logistica_df["Reorder_Quantity"] * logistica_df["Unit_Price"] * 0.05

# 2. Holding_Cost_Percentage
def calcular_holding_pct(cat):
    if isinstance(cat, str) and ("fruit" in cat.lower() or "vegetable" in cat.lower()):
        return 20.0
    return 10.0

logistica_df["Holding_Cost_Percentage"] = logistica_df["Catagory"].apply(calcular_holding_pct)

# 3. Lead Time
logistica_df["Lead_Time"] = (
    pd.to_datetime(logistica_df["Date_Received"]) -
    pd.to_datetime(logistica_df["Last_Order_Date"])
).dt.days.fillna(1).clip(lower=1)

# 4. Demand_Std_Dev
logistica_df["Daily_Demand"] = logistica_df["Sales_Volume"] / 30
logistica_df["Demand_Std_Dev"] = (logistica_df["Daily_Demand"] * 0.30).round(2)

# 5. Extraer solo lo necesario
logistica_final = logistica_df[[
    "Product_ID",
    "Order_Cost",
    "Holding_Cost_Percentage",
    "Lead_Time",
    "Demand_Std_Dev"
]]


    # Recorrer el DataFrame y cargar todos los datos calculados en la tabla Logistica
for _, row in logistica_final.iterrows():
    try:
        cursor.execute("""
            INSERT IGNORE INTO Logistica (
                Product_ID,
                Order_Cost,
                Holding_Cost_Percentage,
                Lead_Time,
                Demand_Std_Dev
            ) VALUES (%s, %s, %s, %s, %s)
        """, (
            row["Product_ID"],
            float(row["Order_Cost"]),
            float(row["Holding_Cost_Percentage"]),
            int(row["Lead_Time"]),
            float(row["Demand_Std_Dev"])
        ))
    except Exception as e:
        print(f"Error al insertar producto {row['Product_ID']}: {e}")




conn.commit()
cursor.close()
conn.close()

print("Carga completa.")
