from fastapi.testclient import TestClient
from src.app import app, activities
import uuid

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Check an example activity is present
    assert "Chess Club" in data


def test_signup_and_unregister_cycle():
    activity_name = "Chess Club"
    # use a unique email to avoid collisions
    test_email = f"test+{uuid.uuid4().hex[:8]}@example.com"

    # Ensure email not already present
    assert test_email not in activities[activity_name]["participants"]

    # Sign up (send email as query param so special chars are encoded correctly)
    signup = client.post(f"/activities/{activity_name}/signup", params={"email": test_email})
    assert signup.status_code == 200
    assert "Signed up" in signup.json().get("message", "")

    # Verify via GET /activities
    all_acts = client.get("/activities")
    assert signup.status_code == 200
    assert test_email in all_acts.json()[activity_name]["participants"]

    # Unregister (use params to avoid encoding issues)
    unreg = client.post(f"/activities/{activity_name}/unregister", params={"email": test_email})
    assert unreg.status_code == 200
    assert "Unregistered" in unreg.json().get("message", "")

    # Verify removal
    all_acts2 = client.get("/activities")
    assert test_email not in all_acts2.json()[activity_name]["participants"]
