# test_api.py
import requests
import os

BASE_URL = "http://localhost:8000"

def test_health():
    print("Testing /health...")
    resp = requests.get(f"{BASE_URL}/health")
    print(resp.status_code, resp.json())

def test_model_info():
    print("\nTesting /model/info...")
    resp = requests.get(f"{BASE_URL}/model/info")
    print(resp.status_code, resp.json())

def test_predict():
    print("\nTesting /predict...")
    data = {
        "Gender": "Male",
        "Married": "Yes",
        "Dependents": "0",
        "Education": "Graduate",
        "Self_Employed": "No",
        "ApplicantIncome": 5000,
        "CoapplicantIncome": 0,
        "LoanAmount": 150,
        "Loan_Amount_Term": 360,
        "Credit_History": 1.0,
        "Property_Area": "Urban"
    }
    resp = requests.post(f"{BASE_URL}/predict", json=data)
    print(resp.status_code, resp.json())

def test_drift_run():
    print("\nTesting /drift/run...")
    file_path = "data/production/production_drifted.csv"
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f, "text/csv")}
        resp = requests.post(f"{BASE_URL}/drift/run", files=files)
    print(resp.status_code, resp.json())

def test_list_reports():
    print("\nTesting /drift/reports...")
    resp = requests.get(f"{BASE_URL}/drift/reports")
    print(resp.status_code, resp.json())

def test_latest_report():
    print("\nTesting /drift/latest...")
    resp = requests.get(f"{BASE_URL}/drift/latest")
    print(resp.status_code, resp.json())

if __name__ == "__main__":
    try:
        test_health()
        test_model_info()
        test_predict()
        test_drift_run()
        test_list_reports()
        test_latest_report()
    except Exception as e:
        print(f"Test failed: {e}")
