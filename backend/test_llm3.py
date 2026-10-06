import requests
import json
resp = requests.get("https://openrouter.ai/api/v1/models").json()
free_models = [m['id'] for m in resp['data'] if 'free' in m['id']]
print(free_models)
