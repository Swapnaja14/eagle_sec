"""
Seed script to create sample sites and clients for SessionSchedulerPage
This creates realistic data to replace mock data in the frontend
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnsphere.settings')
django.setup()

from accounts.models import Tenant, Site, Client

def create_sample_sites_and_clients():
    print("Creating sample sites and clients...")
    
    # Get the default tenant (or create one if needed)
    tenant, created = Tenant.objects.get_or_create(
        slug='default',
        defaults={'name': 'Default Organization'}
    )
    
    if created:
        print(f"Created new tenant: {tenant.name}")
    else:
        print(f"Using existing tenant: {tenant.name}")
    
    # Create sample clients
    clients_data = [
        {
            'name': 'TechCorp Solutions',
            'contact_email': 'admin@techcorp.com',
            'contact_phone': '+1-555-0101',
            'industry': 'Technology'
        },
        {
            'name': 'Global Finance Inc',
            'contact_email': 'training@globalfinance.com',
            'contact_phone': '+1-555-0102',
            'industry': 'Finance'
        },
        {
            'name': 'Healthcare Plus',
            'contact_email': 'hr@healthcareplus.com',
            'contact_phone': '+1-555-0103',
            'industry': 'Healthcare'
        },
        {
            'name': 'Retail Dynamics',
            'contact_email': 'learning@retaildynamics.com',
            'contact_phone': '+1-555-0104',
            'industry': 'Retail'
        },
        {
            'name': 'Manufacturing Pro',
            'contact_email': 'safety@manufacturingpro.com',
            'contact_phone': '+1-555-0105',
            'industry': 'Manufacturing'
        }
    ]
    
    created_clients = []
    for client_data in clients_data:
        client, created = Client.objects.get_or_create(
            tenant=tenant,
            name=client_data['name'],
            defaults=client_data
        )
        created_clients.append(client)
        if created:
            print(f"Created client: {client.name}")
        else:
            print(f"Client already exists: {client.name}")
    
    # Create sample sites for each client
    sites_data = [
        # TechCorp Solutions sites
        {
            'client_name': 'TechCorp Solutions',
            'name': 'Headquarters - San Francisco',
            'address': '123 Tech Street, Suite 100',
            'city': 'San Francisco',
            'state': 'CA',
            'country': 'USA',
            'postal_code': '94105'
        },
        {
            'client_name': 'TechCorp Solutions',
            'name': 'Engineering Hub - Austin',
            'address': '456 Innovation Blvd',
            'city': 'Austin',
            'state': 'TX',
            'country': 'USA',
            'postal_code': '78701'
        },
        # Global Finance Inc sites
        {
            'client_name': 'Global Finance Inc',
            'name': 'Main Office - New York',
            'address': '789 Wall Street, Floor 15',
            'city': 'New York',
            'state': 'NY',
            'country': 'USA',
            'postal_code': '10005'
        },
        {
            'client_name': 'Global Finance Inc',
            'name': 'Regional Office - Chicago',
            'address': '321 Financial Plaza',
            'city': 'Chicago',
            'state': 'IL',
            'country': 'USA',
            'postal_code': '60601'
        },
        # Healthcare Plus sites
        {
            'client_name': 'Healthcare Plus',
            'name': 'Central Hospital',
            'address': '555 Medical Center Drive',
            'city': 'Boston',
            'state': 'MA',
            'country': 'USA',
            'postal_code': '02115'
        },
        {
            'client_name': 'Healthcare Plus',
            'name': 'West Clinic',
            'address': '777 Health Way',
            'city': 'Los Angeles',
            'state': 'CA',
            'country': 'USA',
            'postal_code': '90024'
        },
        # Retail Dynamics sites
        {
            'client_name': 'Retail Dynamics',
            'name': 'Corporate Office',
            'address': '999 Commerce Street',
            'city': 'Seattle',
            'state': 'WA',
            'country': 'USA',
            'postal_code': '98101'
        },
        {
            'client_name': 'Retail Dynamics',
            'name': 'Distribution Center',
            'address': '111 Logistics Road',
            'city': 'Dallas',
            'state': 'TX',
            'country': 'USA',
            'postal_code': '75201'
        },
        # Manufacturing Pro sites
        {
            'client_name': 'Manufacturing Pro',
            'name': 'Main Plant',
            'address': '333 Industrial Avenue',
            'city': 'Detroit',
            'state': 'MI',
            'country': 'USA',
            'postal_code': '48201'
        },
        {
            'client_name': 'Manufacturing Pro',
            'name': 'Warehouse Facility',
            'address': '555 Storage Lane',
            'city': 'Houston',
            'state': 'TX',
            'country': 'USA',
            'postal_code': '77001'
        }
    ]
    
    created_sites = []
    for site_data in sites_data:
        # Find the client
        client = next((c for c in created_clients if c.name == site_data['client_name']), None)
        if not client:
            print(f"Warning: Client '{site_data['client_name']}' not found, skipping site '{site_data['name']}'")
            continue
        
        site, created = Site.objects.get_or_create(
            tenant=tenant,
            name=site_data['name'],
            defaults={
                'client': client,
                'address': site_data['address'],
                'city': site_data['city'],
                'state': site_data['state'],
                'country': site_data['country'],
                'postal_code': site_data['postal_code']
            }
        )
        created_sites.append(site)
        if created:
            print(f"Created site: {site.name}")
        else:
            print(f"Site already exists: {site.name}")
    
    print(f"\nSummary:")
    print(f"Created {len(created_clients)} clients")
    print(f"Created {len(created_sites)} sites")
    print(f"All sites and clients are now available for the SessionSchedulerPage!")

if __name__ == '__main__':
    create_sample_sites_and_clients()
