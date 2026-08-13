import urllib.request, urllib.parse, json

try:
    login_data = urllib.parse.urlencode({'username': 'candidate@test.com', 'password': 'test123'}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_data)
    resp = urllib.request.urlopen(req)
    token = json.loads(resp.read().decode('utf-8'))['access_token']

    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    payload = json.dumps({'source_code': 'print("Hello World")', 'language': 'python', 'stdin': ''}).encode('utf-8')
    req2 = urllib.request.Request('http://127.0.0.1:8000/api/v1/practice/run', data=payload, headers=headers)
    resp2 = urllib.request.urlopen(req2)
    print(resp2.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode('utf-8')}")
