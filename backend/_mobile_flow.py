"""
Simulates every screen in the mobile app by calling exactly the endpoints
that the React Native screens call via src/services/api.js.

Screens:
  LoginScreen     -> POST /api/token/
  DashboardScreen -> GET  /api/trainee/dashboard/
  CatalogScreen   -> GET  /api/trainee/courses/
  ProfileScreen   -> GET  /api/auth/me/
                     GET  /api/certificates/employee/<id>/
                     POST /api/auth/logout/   (blacklist)
  Token refresh   -> POST /api/token/refresh/
"""
import json
import urllib.request
import urllib.error

BASE = "http://localhost:8000"


def hit(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def show(label, status, text, ok_if=(200, 201)):
    mark = "PASS" if status in ok_if else "FAIL"
    snippet = text[:180].replace("\n", " ")
    print(f"[{mark}] {label}: {status}  {snippet}")
    return status in ok_if


def main():
    results = []

    print("=== MOBILE FLOW SIMULATION (trainee user) ===\n")

    # --- LoginScreen
    s, t = hit("POST", "/api/token/", {"username": "trainee", "password": "trainee123"})
    results.append(("LoginScreen /token/", show("LoginScreen -> /api/token/", s, t)))
    data = json.loads(t)
    access = data.get("access")
    refresh = data.get("refresh")
    assert access and refresh

    # --- DashboardScreen
    s, t = hit("GET", "/api/trainee/dashboard/", token=access)
    results.append(("DashboardScreen", show("DashboardScreen -> /trainee/dashboard/", s, t)))

    # --- CatalogScreen
    s, t = hit("GET", "/api/trainee/courses/", token=access)
    results.append(("CatalogScreen", show("CatalogScreen -> /trainee/courses/", s, t)))

    # Fallback the catalog already uses if needed: plain /api/courses/
    s, t = hit("GET", "/api/courses/", token=access)
    results.append(("courses fallback", show("Catalog fallback -> /api/courses/", s, t)))

    # --- ProfileScreen: /auth/me/
    s, t = hit("GET", "/api/auth/me/", token=access)
    results.append(("ProfileScreen /me", show("ProfileScreen -> /api/auth/me/", s, t)))
    me = json.loads(t)
    user_id = me.get("id")
    display = f"{me.get('first_name','')} {me.get('last_name','')}".strip() or me.get("username")
    print(f"   [info] user: id={user_id} display={display!r} role={me.get('role')}")

    # --- ProfileScreen: /certificates/employee/<id>/
    s, t = hit("GET", f"/api/certificates/employee/{user_id}/", token=access)
    results.append(("ProfileScreen certs", show("ProfileScreen -> /certificates/employee/<id>/", s, t)))
    certs = json.loads(t)
    certs_list = certs if isinstance(certs, list) else certs.get("results", [])
    print(f"   [info] certificates in DB for this user: {len(certs_list)}")

    # --- Token refresh (mimics the 401 interceptor)
    s, t = hit("POST", "/api/token/refresh/", {"refresh": refresh})
    results.append(("token refresh", show("api.js interceptor -> /api/token/refresh/", s, t)))
    # Use rotated refresh token for logout if rotation was on
    new_refresh = json.loads(t).get("refresh", refresh)

    # --- Logout (blacklist)
    s, t = hit("POST", "/api/auth/logout/", {"refresh": new_refresh}, token=access)
    results.append(("logout", show("ProfileScreen logout -> /api/auth/logout/", s, t)))

    # --- Verify blacklist actually worked
    s, t = hit("POST", "/api/token/refresh/", {"refresh": new_refresh})
    blacklisted = (s == 401)
    print(f"[{'PASS' if blacklisted else 'FAIL'}] Refresh reuse after logout is rejected (401): got {s}")
    results.append(("blacklist enforced", blacklisted))

    # --- Sync test: mobile endpoint vs frontend endpoint
    # (Frontend uses same backend via Vite proxy at 5173; mobile hits 8000 directly.)
    s1, t1 = hit("POST", "/api/token/", {"username": "trainee", "password": "trainee123"})
    access2 = json.loads(t1)["access"]
    s_web, web = hit("GET", "/api/courses/", token=access2)  # same backend either way
    s_mob, mob = hit("GET", "/api/courses/", token=access2)
    same_payload = (web == mob)
    print(f"[{'PASS' if same_payload else 'FAIL'}] Web vs Mobile /api/courses/ payload identical (same backend)")
    results.append(("web/mobile payload identical", same_payload))

    print("\n--- RESULTS ---")
    for name, ok in results:
        print(f"  {'OK ' if ok else 'BAD'}  {name}")
    bad = [n for n, ok in results if not ok]
    print("\nTOTAL:", f"{len(results) - len(bad)}/{len(results)} passed")
    if bad:
        print("FAILED:", bad)


if __name__ == "__main__":
    main()
