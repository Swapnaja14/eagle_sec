"""
Check if department column exists in courses_course table
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from django.db import connection

# Check table structure
with connection.cursor() as cursor:
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'courses_course'
        ORDER BY ordinal_position;
    """)
    
    print("Columns in courses_course table:")
    print("-" * 50)
    for row in cursor.fetchall():
        print(f"{row[0]:<30} {row[1]}")
    
    # Check if department exists
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'courses_course' 
        AND column_name = 'department';
    """)
    
    result = cursor.fetchone()
    print("\n" + "=" * 50)
    if result:
        print("✓ Department column EXISTS")
    else:
        print("✗ Department column DOES NOT EXIST")
        print("\nNeed to add the column manually or run migrations")
