"""Phase F: prove web and mobile see identical course data after an admin edit."""
import json
import urllib.request
import urllib.error

BACKEND = "http://localhost:8000"   # mobile hits this directly
WEB     = "http://localhost:5173"   # frontend via Vite proxy -> backend


def http(method, base, path, body=None, token=None):
    url = base + path
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r, timeout=15)
        return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")


def login(username, password):
    status, data = http("POST", BACKEND, "/api/auth/login/", {"username": username, "password": password})
    assert status == 200, f"login failed: {status} {data}"
    return data["access"]


def main():
    # Log in as admin to do the edit (admin belongs to TechCorp -> course id=1 there)
    admin_token = login("admin", "admin123")
    s, course = http("GET", BACKEND, "/api/courses/1/", token=admin_token)
    assert s == 200, course
    original_name = course["display_name"]
    print(f"Original course name: {original_name!r}")

    # Mutate via API (simulates admin panel change)
    new_name = original_name + " [synced]"
    s, _ = http("PATCH", BACKEND, "/api/courses/1/", {"display_name": new_name}, token=admin_token)
    assert s == 200, f"PATCH failed: {s}"
    print(f"Updated to: {new_name!r}")

    # Fetch via backend (mobile path) AND via vite proxy (web path)
    s1, web_data = http("GET", WEB, "/api/courses/1/", token=admin_token)
    s2, mob_data = http("GET", BACKEND, "/api/courses/1/", token=admin_token)

    print("web status:", s1, "| mobile status:", s2)
    print("web.display_name  =", web_data.get("display_name"))
    print("mobile.display_name =", mob_data.get("display_name"))

    same_name = web_data.get("display_name") == mob_data.get("display_name") == new_name
    same_updated_at = web_data.get("updated_at") == mob_data.get("updated_at")
    same_id = web_data.get("id") == mob_data.get("id")

    print("same name?       ", same_name)
    print("same updated_at? ", same_updated_at)
    print("same id?         ", same_id)

    # Revert
    http("PATCH", BACKEND, "/api/courses/1/", {"display_name": original_name}, token=admin_token)
    print(f"Reverted to: {original_name!r}")

    assert same_name and same_updated_at and same_id, "SYNC FAIL"
    print("\n[SYNC OK] Web and mobile return byte-identical payloads.")


if __name__ == "__main__":
    main()
