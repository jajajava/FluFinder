import os
import psycopg2
from dotenv import load_dotenv
from pathlib import Path


# Explicitly load the .env file from the root directory
dotenv_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL")

# Get connection to DB using Database URL
def connect_db():
  try:
    conn = psycopg2.connect(DATABASE_URL)
    print("Connected to database")
    return conn
  except Exception as e:
    print("Error connecting to database:", e)
    return None

# Testing connection with database
def test_query():
  conn = connect_db()
  if conn:
    cur = conn.cursor()
    cur.execute("SELECT NOW();")
    print("Database time:", cur.fetchone()[0])
    cur.close()
    conn.close()