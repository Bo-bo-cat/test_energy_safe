import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import pymongo 
import requests

app = Flask(__name__)
CORS(app) # Дозволяємо фронтенду на Next.js робити запити

client = pymongo.MongoClient(os.getenv("MONGO_URI"))
db = client["EnergySafeDB"]
collection = db["devices"]

@app.route('/api/devices', methods=['GET'])
def get_devices():
    devices = list(collection.find({}, {'_id': 0}))
    return jsonify(devices)

@app.route('/api/search_icecat')
def search_icecat():
    query = request.args.get('name')
    params = {"UserName": os.getenv("ICECAT_USER"), "Language": "uk", "FullTextQuery": query}
    try:
        res = requests.get("https://live.icecat.biz/api/", params=params, timeout=5)
        data = res.json()
        if "data" in data and data['data']:
            info = data['data']['GeneralInfo']
            return jsonify({"category": info['Category']['Name']['Value'], "brand": info.get('Brand', 'Невідомо')})
    except: pass
    return jsonify({"error": "Not found"})

@app.route('/api/add_device', methods=['POST'])
def add_device():
    data = request.json
    collection.insert_one(data)
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)