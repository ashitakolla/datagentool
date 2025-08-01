import requests
import pandas as pd
import io
import json

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_CSV = """date,value
2023-01-01,100
2023-01-02,110
2023-01-03,120
2023-01-04,115
2023-01-05,125
"""

def test_health_check():
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print("-" * 50)

def test_generate_data():
    print("Testing data generation...")
    data = {
        "prompt": "Generate 10 rows of sales data with date, product, and amount",
        "dataset_type": "tabular",
        "row_count": 10
    }
    response = requests.post(f"{BASE_URL}/api/generate", data=data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Generated {result['row_count']} rows with columns: {', '.join(result['columns'])}")
        # Display first 5 rows
        df = pd.read_csv(io.StringIO(result['data']))
        print("\nPreview:")
        print(df.head().to_string(index=False))
    else:
        print(f"Error: {response.text}")
    print("-" * 50)

def test_predict_data():
    print("Testing data prediction...")
    # Create a test file
    test_file = io.BytesIO(TEST_CSV.encode())
    test_file.name = "test_data.csv"
    
    # Make prediction request
    files = {
        'file': (test_file.name, test_file, 'text/csv')
    }
    data = {
        'column': 'value',
        'steps': '3',
        'time_column': 'date'
    }
    
    response = requests.post(
        f"{BASE_URL}/api/predict",
        files=files,
        data=data
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Prediction for column: {result['column']}")
        print(f"Number of predictions: {len(result['predictions'])}")
        print("\nPredictions:")
        # Pretty print the predictions
        print(json.dumps(result['predictions'], indent=2))
    else:
        print(f"Error: {response.text}")
    print("-" * 50)

if __name__ == "__main__":
    print("=" * 50)
    print("Testing DataGen API Endpoints")
    print("=" * 50)
    print()
    
    test_health_check()
    test_generate_data()
    test_predict_data()
    
    print("\nTesting complete!")
