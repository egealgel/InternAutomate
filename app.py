from flask import Flask
from flask_cors import CORS

from database.db import init_db
from routes.api import bp as api_bp

app = Flask(__name__)
app.secret_key = "intern-automate-secret-key"
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(api_bp)


@app.before_request
def setup():
    init_db()


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5001)
