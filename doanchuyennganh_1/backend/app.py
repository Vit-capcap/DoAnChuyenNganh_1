# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import mysql.connector

# app = Flask(__name__)
# CORS(app)

# db = mysql.connector.connect(
#     host="localhost",
#     user="root",
#     password="12345678",
#     database="studentdb"
# )

# # Lấy danh sách sinh viên
# @app.route("/students", methods=["GET"])
# def get_students():
#     cursor = db.cursor(dictionary=True)
#     cursor.execute("SELECT * FROM students")
#     result = cursor.fetchall()
#     return jsonify(result)

# # Thêm sinh viên
# @app.route("/students", methods=["POST"])
# def add_student():

#     data = request.json

#     name = data["name"]
#     email = data["email"]
#     phone = data["phone"]

#     cursor = db.cursor()

#     sql = """
#         INSERT INTO students(name,email,phone)
#         VALUES(%s,%s,%s)
#     """

#     values = (name, email, phone)

#     cursor.execute(sql, values)
#     db.commit()

#     return jsonify({
#         "message": "Thêm thành công"
#     })

# if __name__ == "__main__":
#     app.run(debug=True)


from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

students = [
    {
        "id": 1,
        "name": "Nguyen Van A",
        "email": "a@gmail.com",
        "phone": "0123456789"
    },
    {
        "id": 2,
        "name": "Tran Van B",
        "email": "b@gmail.com",
        "phone": "0987654321"
    }
]

@app.route('/login', methods=['POST'])
def login():

    data = request.json

    username = data['username']
    password = data['password']

    if username == 'admin' and password == '123':
        return jsonify({
            'success': True,
            'message': 'Đăng nhập thành công'
        })

    return jsonify({
        'success': False,
        'message': 'Sai tài khoản hoặc mật khẩu'
    })

@app.route('/students', methods=['GET'])
def get_students():
    return jsonify(students)

if __name__ == '__main__':
    app.run(debug=True)