import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

response = client.post(
    "/api/v1/auth/login",
    data={"username": "candidate@test.com", "password": "test123"}
)
token = response.json()["access_token"]

try:
    resp = client.post(
        "/api/v1/practice/run",
        json={"source_code": "print(1)", "language": "python", "stdin": ""},
        headers={"Authorization": f"Bearer {token}"}
    )
    print(resp.status_code)
    print(resp.json())
except Exception as e:
    import traceback
    traceback.print_exc()
