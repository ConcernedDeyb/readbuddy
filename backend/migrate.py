import sqlite3

def apply_migrations():
    conn = sqlite3.connect('readbuddy.db')
    try:
        conn.execute('ALTER TABLE students ADD COLUMN is_archived BOOLEAN DEFAULT 0')
        print("Added is_archived to students")
    except Exception as e:
        print(f"Students table migration error (might already exist): {e}")

    try:
        conn.execute('ALTER TABLE passages ADD COLUMN is_archived BOOLEAN DEFAULT 0')
        print("Added is_archived to passages")
    except Exception as e:
        print(f"Passages table migration error (might already exist): {e}")

    conn.commit()
    conn.close()

if __name__ == '__main__':
    apply_migrations()
