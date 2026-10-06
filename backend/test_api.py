import requests
import json

BASE_URL = "http://localhost:8000/api"

def print_result(name, response):
    print(f"\n{'='*40}")
    print(f"TEST: {name}")
    print(f"Status: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)
    print(f"{'='*40}")

def run_tests():
    print("Starting API Tests...\n")

    # 1. Test Dashboard
    res = requests.get(f"{BASE_URL}/dashboard")
    print_result("GET /dashboard", res)

    # 2. Test Calculation (Transport)
    calc_payload = {
        "category": "transport",
        "amount": 150,
        "unit": "km",
        "detail": "Driving to the hackathon"
    }
    res = requests.post(f"{BASE_URL}/calculate", json=calc_payload)
    print_result("POST /calculate (Transport)", res)

    # 3. Test AI Recommendations
    res = requests.get(f"{BASE_URL}/ai/recommendations")
    print_result("GET /ai/recommendations", res)

    # 4. Test AI Prediction
    predict_payload = {
        "prompt": "I am flying from New York to London next week for a conference.",
        "category": "transport"
    }
    res = requests.post(f"{BASE_URL}/ai/predict", json=predict_payload)
    print_result("POST /ai/predict", res)

if __name__ == "__main__":
    run_tests()
