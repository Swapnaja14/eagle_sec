"""Phase G live test: create course -> assign to trainee -> complete -> get certificate."""
import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000"


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
        r = urllib.request.urlopen(req, timeout=15)
        raw = r.read().decode()
        status_code = r.status
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        status_code = e.code
    try:
        return status_code, json.loads(raw or "{}")
    except Exception:
        print(f"   raw response ({status_code}):", raw[:400])
        return status_code, {"_raw": raw}


def login(u, p):
    s, d = hit("POST", "/api/auth/login/", {"username": u, "password": p})
    assert s == 200, d
    return d["access"], d["user"]


def main():
    # Trainer logs in and creates a course in Demo Organization
    instr_tok, instr = login("instructor", "instructor123")
    print("Instructor logged in:", instr["username"], "tenant:", instr.get("tenant", {}).get("slug"))

    # Create a course as instructor
    s, course = hit("POST", "/api/courses/", {
        "display_name": "Mobile-Built Demo Course",
        "description": "Course created from the mobile app flow test.",
        "status": "active",
        "compliance_taxonomy": "ISO 27001",
        "skills_taxonomy": "Threat Analysis",
    }, token=instr_tok)
    print(f"[{s}] Create course ->", course.get("id"), course.get("display_name"))
    assert s == 201, course
    course_id = course["id"]

    # Look up trainee user id (same tenant)
    s, emps = hit("GET", "/api/auth/employees/", token=instr_tok)
    trainee = next((e for e in emps if e["username"] == "trainee"), None)
    assert trainee, f"no trainee found. got: {emps[:3]}"
    trainee_id = trainee["id"]
    print("Trainee id:", trainee_id)

    # Create assignment
    s, assign = hit("POST", "/api/assignments/", {
        "trainee": trainee_id,
        "course": course_id,
        "notes": "Assigned from mobile-flow test",
    }, token=instr_tok)
    print(f"[{s}] Create assignment ->", assign.get("id"), "status=", assign.get("status"))
    assert s in (200, 201), assign
    assign_id = assign["id"]

    # Trainee logs in and sees the assignment
    trainee_tok, _ = login("trainee", "trainee123")
    s, mine = hit("GET", "/api/assignments/mine/", token=trainee_tok)
    mine_list = mine if isinstance(mine, list) else mine.get("results", [])
    print(f"[{s}] Trainee sees {len(mine_list)} assignment(s)")
    assert any(a["id"] == assign_id for a in mine_list), "new assignment not in trainee list"

    # Trainee marks assignment complete -> certificate auto-issued
    s, done = hit("POST", f"/api/assignments/{assign_id}/complete/", token=trainee_tok)
    print(f"[{s}] Complete + auto-issue cert")
    assert s == 200, done
    cert = done["certificate"]
    print("   cert id:", cert["id"], "file_path:", cert["file_path"])
    print("   download_url:", cert["download_url"])
    assert cert["file_path"], "certificate has no file path"

    # Trainee lists their certificates
    s, certs = hit("GET", f"/api/certificates/employee/{trainee_id}/", token=trainee_tok)
    certs_list = certs if isinstance(certs, list) else certs.get("results", [])
    print(f"[{s}] Trainee's certificate count: {len(certs_list)}")
    assert any(c["id"] == cert["id"] for c in certs_list)

    # Download the PDF (must be 200 and content-type pdf)
    req = urllib.request.Request(cert["download_url"], headers={"Authorization": f"Bearer {trainee_tok}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        size = len(r.read())
        ctype = r.headers.get("Content-Type", "")
    print(f"   PDF download: size={size} bytes, type={ctype}")
    assert "pdf" in ctype.lower() and size > 500

    print("\nALL OK — assign-then-certificate flow works end-to-end.")


if __name__ == "__main__":
    main()
