import mysql.connector
import os
#from dotenv import load_dotenv
from typing import Optional, List, Any, Tuple, cast, Dict, Sequence

#load_dotenv()  # Load environment variables from .env file

def get_db_connection() -> Optional[mysql.connector.connection.MySQLConnection]:
    """Establish a connection to the MySQL database."""
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='vishal',
            password='',
            database='collage'  # Replace with your actual database name
        )
        print("Database connection established.")
        return cast(mysql.connector.connection.MySQLConnection, connection)
    except mysql.connector.Error as err:
        print("Error:", err)
        return None
    
def execute_query(query: str, params: Optional[Tuple] = None) -> Optional[Sequence[Dict[str, Any]]]:
    """Execute a SQL query on the database."""
    connection = get_db_connection()
    if connection is None:
        return None

    cursor = None
    try:
        # Use dictionary=True for SELECT queries to get results as dicts
        is_select = query.strip().lower().startswith("select")
        cursor = connection.cursor(dictionary=is_select)
        
        result = None
        cursor.execute(query, params or ())
        if is_select:
            result = cursor.fetchall()
        else:
            connection.commit()
        return cast(Optional[Sequence[Dict[str, Any]]], result)
    except mysql.connector.Error as err:
        print("Error:", err)
        return None
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def _column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table."""
    cursor.execute(f"SHOW COLUMNS FROM {table_name} LIKE '{column_name}'")
    return cursor.fetchone() is not None

def create_or_update_tables():
    connection = get_db_connection()
    if not connection:
        print("Could not connect to database to create/update tables.")
        return
    cursor = connection.cursor()

    # Create all required tables
    table_queries = [
        # Students
        '''CREATE TABLE IF NOT EXISTS STUDENT (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            age INT NOT NULL,
            department VARCHAR(255) NOT NULL,
            image_path TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )''',
        # Staff
        '''CREATE TABLE IF NOT EXISTS STAFF (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(255) NOT NULL,
            department VARCHAR(255) NOT NULL,
            image_path TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )''',
        # Unknown Faces
        '''CREATE TABLE IF NOT EXISTS UNKNOWN_FACES (
            id INT AUTO_INCREMENT PRIMARY KEY,
            image_path VARCHAR(255),
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            confidence FLOAT
        )''',
        # Chat Logs
        '''CREATE TABLE IF NOT EXISTS CHAT_LOGS (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sender VARCHAR(50),
            receiver VARCHAR(50),
            message TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )''',
        # College Info
        '''CREATE TABLE IF NOT EXISTS COLLEGE_INFO (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category VARCHAR(50),
            content TEXT
        )''',
        # Recognition Logs
        '''CREATE TABLE IF NOT EXISTS RECOGNITION_LOGS (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            type VARCHAR(50),
            confidence FLOAT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            image_path VARCHAR(255)
        )'''
    ]
    for query in table_queries:
        cursor.execute(query)
    connection.commit()
    cursor.close()
    connection.close()

# Utility functions for chat log and college info

def log_chat(sender: str, receiver: str, message: str):
    connection = get_db_connection()
    if not connection:
        return
    cursor = connection.cursor()
    cursor.execute(
        "INSERT INTO CHAT_LOGS (sender, receiver, message) VALUES (%s, %s, %s)",
        (sender, receiver, message)
    )
    connection.commit()
    cursor.close()
    connection.close()

def log_unknown_face(image_path: str, confidence: float):
    connection = get_db_connection()
    if not connection:
        return
    cursor = connection.cursor()
    cursor.execute(
        "INSERT INTO UNKNOWN_FACES (image_path, confidence) VALUES (%s, %s)",
        (image_path, confidence)
    )
    connection.commit()
    cursor.close()
    connection.close()

def fetch_college_info(category: str) -> str:
    connection = get_db_connection()
    if not connection:
        return "Sorry, I don't have that information."
    cursor = connection.cursor(dictionary=True)
    cursor.execute(
        "SELECT content FROM COLLEGE_INFO WHERE category LIKE %s LIMIT 1",
        (f"%{category}%",)
    )
    result = cursor.fetchone()
    cursor.close()
    connection.close()
    return result['content'] if result else "Sorry, I don't have that information."

def fetch_college_info_db() -> list:
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM COLLEGE_INFO")
    result = cursor.fetchall()
    cursor.close()
    connection.close()
    return result

def add_college_info(category: str, content: str):
    connection = get_db_connection()
    if not connection:
        return
    cursor = connection.cursor()
    cursor.execute(
        "INSERT INTO COLLEGE_INFO (category, content) VALUES (%s, %s)",
        (category, content)
    )
    connection.commit()
    cursor.close()
    connection.close()

def update_college_info(info_id: int, category: str, content: str):
    connection = get_db_connection()
    if not connection:
        return
    cursor = connection.cursor()
    cursor.execute(
        "UPDATE COLLEGE_INFO SET category=%s, content=%s WHERE id=%s",
        (category, content, info_id)
    )
    connection.commit()
    cursor.close()
    connection.close()

def delete_college_info(info_id: int):
    connection = get_db_connection()
    if not connection:
        return
    cursor = connection.cursor()
    cursor.execute("DELETE FROM COLLEGE_INFO WHERE id=%s", (info_id,))
    connection.commit()
    cursor.close()
    connection.close()

def log_recognition(name: str, type_: str, confidence: float, image_path: str = None, unknown_id: int = None):
    connection = get_db_connection()
    if not connection:
        return
    cursor = connection.cursor()
    cursor.execute(
        "INSERT INTO RECOGNITION_LOGS (name, type, confidence, image_path) VALUES (%s, %s, %s, %s)",
        (name, type_, confidence, image_path)
    )
    connection.commit()
    cursor.close()
    connection.close()

def fetch_chat_logs(limit: int = 20) -> list:
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM CHAT_LOGS ORDER BY id DESC LIMIT %s", (limit,)
    )
    result = cursor.fetchall()
    cursor.close()
    connection.close()
    return result

def fetch_students_info() -> list:
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT name, age, department FROM STUDENT")
    result = cursor.fetchall()
    cursor.close()
    connection.close()
    return result

def fetch_staff_info() -> list:
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT name, role, department FROM STAFF")
    result = cursor.fetchall()
    cursor.close()
    connection.close()
    return result

if __name__ == "__main__":
    create_or_update_tables()
    print("Tables created/updated successfully.")

