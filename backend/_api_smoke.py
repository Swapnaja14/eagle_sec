"""Phase B smoke test: verify auth + courses + password hash + logout blacklist."""
import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000"


def req(method, path, body=None, token=None, expect=None):
    url = BASE + path
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r, timeout=15)
        status = resp.status
        text = resp.read().decode()
    except urllib.error.HTTPError as e:
        status = e.code
        text = e.read().decode()
    ok = (expect is None) or (status == expect)
    mark = "OK " if ok else "FAIL"
    snippet = text[:200].replace("\n", " ")
    print(f"[{mark}] {method} {path} -> {status}  {snippet}")
    try:
        return status, json.loads(text) if text else {}
    except Exception:
        return status, {}


def main():
    print("=== 1. Protected route without token (expect 401) ===")
    req("GET", "/api/courses/", expect=401)

    print("\n=== 2. Login wrong password (expect 401) ===")
    req("POST", "/api/auth/login/", {"username": "admin", "password": "WRONG"}, expect=401)

    print("\n=== 3. Login correct (expect 200) ===")
    s, data = req("POST", "/api/auth/login/", {"username": "admin", "password": "admin123"}, expect=200)
    access = data.get("access")
    refresh = data.get("refresh")
    print("   access?", bool(access), "refresh?", bool(refresh), "user?", "user" in data)
    assert access and refresh, "Login did not return tokens"

    print("\n=== 4. /api/auth/me/ with token (expect 200) ===")
    req("GET", "/api/auth/me/", token=access, expect=200)

    print("\n=== 5. /api/courses/ with token (expect 200, count>=10) ===")
    s, data = req("GET", "/api/courses/", token=access, expect=200)
    count = data.get("count") if isinstance(data, dict) else None
    print("   count:", count)

    print("\n=== 6. /api/courses/1/ detail (expect 200 or 404) ===")
    req("GET", "/api/courses/1/", token=access)

    print("\n=== 7. DB: verify password is hashed ===")
    import os, django
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "learnsphere.settings")
    django.setup()
    from django.contrib.auth import get_user_model
    u = get_user_model().objects.get(username="admin")
    hashed = u.password
    print(f"   admin.password[:30] = {hashed[:30]}...  (len={len(hashed)})")
    assert hashed.startswith(("pbkdf2_", "argon2", "bcrypt")), "Password not hashed!"
    print("   [OK] password is hashed")

    print("\n=== 8. Logout blacklists refresh ===")
    req("POST", "/api/auth/logout/", {"refresh": refresh}, token=access, expect=200)

    print("\n=== 9. Reuse blacklisted refresh (expect 401) ===")
    req("POST", "/api/token/refresh/", {"refresh": refresh}, expect=401)

    print("\n=== 10. Register new user (expect 201) ===")
    import random
    uname = f"qa_user_{random.randint(10000, 99999)}"
    req("POST", "/api/auth/register/", {
        "username": uname,
        "email": f"{uname}@ex.com",
        "password": "StrongPass123!",
        "confirm_password": "StrongPass123!",
        "first_name": "QA",
        "last_name": "User",
        "role": "trainee",
    }, expect=201)

    print("\nDONE")


if __name__ == "__main__":
    main()
