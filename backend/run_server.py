"""
Simple script to run the Django development server
This bypasses migration issues by using the existing database
"""
import os
import sys

# Add local packages to path
local_packages = os.path.expandvars(r'%LOCALAPPDATA%\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\site-packages')
if os.path.exists(local_packages):
    sys.path.insert(0, local_packages)

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Run the server without checking migrations
    sys.argv = ['manage.py', 'runserver', '--noreload']
    execute_from_command_line(sys.argv)
