from flask import Flask
from controllers.inventario_controller import inventario_bp

app = Flask(__name__)
app.register_blueprint(inventario_bp)

if __name__ == '__main__':
    app.run(debug=True)
