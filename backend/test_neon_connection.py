#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "learnsphere.settings")
sys.path.insert(0, os.path.dirname(__file__))

django.setup()

from django.db import connection
from django.apps import apps

# Test connection
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    print("✓ Successfully connected to Neon database!")
    print(f"\nDatabase Details:")
    print(f"  Database Name: {connection.settings_dict['NAME']}")
    print(f"  Host: {connection.settings_dict['HOST']}")
    print(f"  User: {connection.settings_dict['USER']}")
    print(f"  Engine: {connection.settings_dict['ENGINE']}")
    
    # Count tables
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        """)
        table_count = cursor.fetchone()[0]
    print(f"\n✓ Total Tables: {table_count}")
    
    # List all tables
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        tables = cursor.fetchall()
    
    if tables:
        print(f"\nTables in Neon database:")
        for table in tables:
            print(f"  - {table[0]}")
    
except Exception as e:
    print(f"✗ Connection failed: {e}")
    sys.exit(1)
