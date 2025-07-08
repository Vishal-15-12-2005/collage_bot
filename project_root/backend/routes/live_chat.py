from flask import Blueprint, jsonify, request
from mysql_connection import fetch_chat_logs

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/api/live_chat', methods=['GET'])
def get_live_chat():
    limit = int(request.args.get("limit", 20))  # Optional limit param
    logs = fetch_chat_logs(limit)
    return jsonify(logs)


