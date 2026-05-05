import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()
cursor.execute("""
SELECT table_schema, table_name FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;
""")

tables = cursor.fetchall()
print('Tables found in Neon:')
for schema, table in tables:
    print(f'  - {schema}.{table}')
print(f'\nTotal: {len(tables)} tables')
