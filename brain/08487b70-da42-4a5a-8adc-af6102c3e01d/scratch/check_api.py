import requests

LOGIN_URL = "http://127.0.0.1:8000/api/v1/auth/login"
INVITES_URL = "http://127.0.0.1:8000/api/v1/assessments/candidate/invitations"

# Step 1: Login
try:
    print("Logging in...")
    login_res = requests.post(LOGIN_URL, data={
        "username": "reddyvarun969@gmail.com",
        "password": "candidate123"
    })
    print("Login response code:", login_res.status_code)
    login_data = login_res.json()
    token = login_data.get("access_token")
    print("Access token retrieved:", token is not None)
    
    if token:
        # Step 2: Get invitations
        headers = {"Authorization": f"Bearer {token}"}
        inv_res = requests.get(INVITES_URL, headers=headers)
        print("Invitations response code:", inv_res.status_code)
        print("Invitations list payload:")
        print(inv_res.json())
except Exception as e:
    print("Error connecting to server:", e)
