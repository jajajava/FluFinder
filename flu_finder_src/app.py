import sys
import socket
import os

# Add the parent directory to sys.path so Python recognizes flu_finder_src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# THIS SECTION IS FOR LOCAL; download_csv() DEPRECATED IN FAVOR OF get_db()
# from flu_finder_src.utils.data_fetcher import download_csv
# download_csv()


from flask import Flask, jsonify
from flask_cors import CORS
from flu_finder_src.routes.api import api_bp

def create_app():
    app = Flask(__name__)

    # Enable CORS for all routes with proper configuration
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5020",
                "http://127.0.0.1:5020",
                "https://flufinder.onrender.com"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    # Register blueprints
    app.register_blueprint(api_bp)

    # Add error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500

    return app

# Creates the app immediately. Gunicorn needs this to run
# Gunicorn is the preferred Flask WSGI server, the production server (we were on a temporary development server before)
app = create_app()

# Gets a random port that's available
# Note: couldn't get this working (html wouldn't know what port it's on)
def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5020))
    # port = get_free_port()
    # print(f"CONNECTED ON PORT {port}")
    app.run(debug=True, host="0.0.0.0", port=port)