import requests

r = requests.get('http://127.0.0.1:8000/api/resources')
print('status', r.status_code)
print('body', r.text[:2000])
