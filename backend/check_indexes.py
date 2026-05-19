"""
Check indexes on courses_course table
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from django.db import connection

# Check indexes
with connection.cursor() as cursor:
    cursor.execute("""
        SELECT 
            indexname,
            indexdef
        FROM pg_indexes 
        WHERE tablename = 'courses_course'
        ORDER BY indexname;
    """)
    
    print("Indexes on courses_course table:")
    print("=" * 80)
    for row in cursor.fetchall():
        print(f"\nIndex: {row[0]}")
        print(f"Definition: {row[1]}")
    
    # Check for department-related indexes
    cursor.execute("""
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'courses_course' 
        AND indexdef LIKE '%department%';
    """)
    
    dept_indexes = cursor.fetchall()
    print("\n" + "=" * 80)
    print(f"Department-related indexes: {len(dept_indexes)}")
    for idx in dept_indexes:
        print(f"  ✓ {idx[0]}")
