import json
import os

from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, jsonify
from flask_cors import CORS

from utils import *

load_dotenv()

# Initialize Flask App 
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Establish database connection 
server = os.getenv('DB_HOST')
database = os.getenv('DB_NAME')
username = os.getenv('DB_USER')
password = os.getenv('DB_PWD')

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 18 for SQL Server};SERVER=' + server + ';DATABASE=' + database + ';ENCRYPT=yes;UID=' + username + ';PWD=' + password + ";TrustServerCertificate=yes")

cursor = conn.cursor()


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        return redirect('/')
    else:
        return render_template('index.html')


@app.route('/api/extract-excel', methods=['POST'])
def extract():
    metadata = request.form.get('metadata')
    uploaded_file = request.files['file']
    df, df_dd, rows_not_working = extract_data(uploaded_file)
    df_json = df.to_json(orient='records')

    return jsonify({"data": df_json})  # return relevant data as a json object


@app.route('/api/get-tables', methods=['GET'])
def get_tables():
    schema, attributes = get_table_schema(conn)
    return jsonify({'tables': schema, 'attr': attributes})


@app.route('/api/read-data/<table_name>', methods=['GET'])
def read_data_api(table_name):
    data = read_data(conn, table_name)
    return jsonify({"data": data})


@app.route('/api/write-data/<table_name>', methods=['POST'])
# input data from client, message returned
def write_data_api(table_name):
    data = pd.read_json(request.json["data"])
    message = write_data(conn, table_name, data)
    return jsonify({"message": message})


if __name__ == '__main__':
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.run(debug=True)
