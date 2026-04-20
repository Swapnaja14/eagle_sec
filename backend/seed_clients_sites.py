"""
Seeds Clients and Sites linked to the SecureGuard tenant.
Run: python seed_clients_sites.py
"""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "learnsphere.settings")
django.setup()

from accounts.models import Tenant, Client, Site

tenant = Tenant.objects.get(slug="secureguard")

# Clear existing
Site.objects.filter(tenant=tenant).delete()
Client.objects.filter(tenant=tenant).delete()

CLIENTS = [
    ("SecureGuard India",  "contact@secureguard.in",  "Security"),
    ("Sapphire Security",  "info@sapphiresec.com",    "Security"),
    ("RapidShield Corp",   "ops@rapidshield.com",     "Security"),
]

clients = []
for name, email, industry in CLIENTS:
    c = Client.objects.create(
        tenant=tenant, name=name,
        contact_email=email, industry=industry, is_active=True,
    )
    clients.append(c)

SITES = [
    (clients[0], "Mumbai HQ",           "Andheri East, Mumbai",     "Mumbai",    "Maharashtra"),
    (clients[0], "Delhi Office",         "Connaught Place, Delhi",   "Delhi",     "Delhi"),
    (clients[0], "Pune Campus",          "Hinjewadi, Pune",          "Pune",      "Maharashtra"),
    (clients[1], "Bangalore Tech Park",  "Whitefield, Bangalore",    "Bangalore", "Karnataka"),
    (clients[1], "Hyderabad Zone",       "HITEC City, Hyderabad",    "Hyderabad", "Telangana"),
    (clients[2], "Chennai Hub",          "Anna Nagar, Chennai",      "Chennai",   "Tamil Nadu"),
    (clients[2], "Kolkata Branch",       "Salt Lake, Kolkata",       "Kolkata",   "West Bengal"),
]

for client, name, address, city, state in SITES:
    Site.objects.create(
        tenant=tenant, client=client, name=name,
        address=address, city=city, state=state,
        country="India", is_active=True,
    )

print("Clients: {}".format(Client.objects.filter(tenant=tenant).count()))
print("Sites:   {}".format(Site.objects.filter(tenant=tenant).count()))
for s in Site.objects.filter(tenant=tenant).select_related("client"):
    print("  {} -> {}".format(s.client.name, s.name))
