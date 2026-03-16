import  sqlite3

conn = sqlite3.connect('local.sqlite')
cursor = conn.cursor()
cursor.execute("SELECT * FROM items")
print(cursor.fetchall())
conn.close()
