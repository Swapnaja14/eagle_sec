"""
Quick database setup script for LearnSphere.
Run with: python setup_db.py

This creates the PostgreSQL database and user if they don't exist.
Requires psycopg2 and PostgreSQL to be running.
"""
import subprocess
import sys


def run_psql(command, dbname='postgres', user='postgres', password=''):
    """Run a psql command."""
    env_cmd = f'set PGPASSWORD={password}& ' if password else ''
    full_cmd = f'{env_cmd}psql -U {user} -d {dbname} -c "{command}"'
    result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True)
    return result


def main():
    print("LearnSphere Database Setup")
    print("=" * 40)
    
    pg_password = input("Enter your PostgreSQL 'postgres' user password (press Enter if none): ").strip()
    
    # Try to create database
    print("\nCreating database 'learnsphere_db'...")
    result = run_psql("CREATE DATABASE learnsphere_db;", password=pg_password)
    if 'already exists' in result.stderr or 'already exists' in result.stdout:
        print("    Database already exists.")
    elif result.returncode == 0:
        print("   Database created!")
    else:
        print(f"   Error: {result.stderr}")
        print("\n   Try running manually in psql:")
        print("   CREATE DATABASE learnsphere_db;")
    
    # Update .env file
    print(f"\nUpdating .env with your password...")
    env_content = f"""SECRET_KEY=learnsphere-dev-secret-key-change-in-production-2024
DEBUG=True
DB_NAME=learnsphere_db
DB_USER=postgres
DB_PASSWORD={pg_password}
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
"""
    with open('.env', 'w') as f:
        f.write(env_content)
    print("   .env updated!")
    
    print("\nRunning Django migrations...")
    result = subprocess.run([sys.executable, 'manage.py', 'migrate'], capture_output=True, text=True)
    if result.returncode == 0:
        print("   Migrations complete!")
    else:
        print(f"   Migration error:\n{result.stderr}")
        return
    
    print("\nRunning seed data...")
    result = subprocess.run([sys.executable, 'seed_data.py'], capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(f"   Seed error:\n{result.stderr}")
        return
    
    print("\nSetup complete! Run the backend with:")
    print("   python manage.py runserver")


if __name__ == '__main__':
    main()
