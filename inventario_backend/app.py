from flask import Flask
from flask_cors import CORS
from controllers.inventario_controller import inventario_bp

app = Flask(__name__)
CORS(app, 
     resources={r"/api/*": {"origins": "http://localhost:3000"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
app.register_blueprint(inventario_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
