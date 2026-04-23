"""
Clear dashboard cache to fix caching issue
This will clear all cached dashboard data so fresh data is served
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from django.core.cache import cache

def clear_dashboard_cache():
    print("Clearing dashboard cache...")
    
    # Clear all cache keys that start with 'dashboard'
    try:
        # Get all cache keys (this depends on your cache backend)
        if hasattr(cache, 'keys'):
            # Redis backend supports keys()
            dashboard_keys = cache.keys('dashboard:*')
            if dashboard_keys:
                cache.delete_many(dashboard_keys)
                print(f"Cleared {len(dashboard_keys)} dashboard cache keys")
            else:
                print("No dashboard cache keys found")
        else:
            # For other backends, clear everything
            cache.clear()
            print("Cleared all cache (backend doesn't support selective clearing)")
        
        print("Dashboard cache cleared successfully!")
        print("Please refresh your browser to see the updated data.")
        
    except Exception as e:
        print(f"Error clearing cache: {e}")

if __name__ == '__main__':
    clear_dashboard_cache()
