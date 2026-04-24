"""Quick test script to verify all endpoints are working."""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_login():
    """Test login endpoint."""
    print("🔐 Testing login...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={
            "username": "employee@erabs.io",
            "password": "employee123"
        }
    )
    if response.status_code == 200:
        print("✅ Login successful!")
        return response.json()["access_token"]
    else:
        print(f"❌ Login failed: {response.status_code}")
        return None

def test_resources(token):
    """Test resources endpoint."""
    print("\n🏢 Testing resources...")
    response = requests.get(
        f"{BASE_URL}/resources",
        headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code == 200:
        resources = response.json()
        print(f"✅ Resources loaded: {len(resources)} resources found")
        return True
    else:
        print(f"❌ Resources failed: {response.status_code}")
        return False

def test_bookings(token):
    """Test bookings endpoint."""
    print("\n📅 Testing bookings...")
    response = requests.get(
        f"{BASE_URL}/bookings?scope=mine",
        headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code == 200:
        bookings = response.json()
        print(f"✅ Bookings loaded: {len(bookings)} bookings found")
        return True
    else:
        print(f"❌ Bookings failed: {response.status_code}")
        return False

def test_analytics(token):
    """Test analytics endpoint."""
    print("\n📊 Testing analytics...")
    response = requests.get(
        f"{BASE_URL}/analytics/summary",
        headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Analytics loaded:")
        print(f"   - Total bookings: {data['total_bookings']}")
        print(f"   - Active resources: {data['active_resources']}")
        print(f"   - Pending approvals: {data['pending_approvals']}")
        return True
    else:
        print(f"❌ Analytics failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def test_api_key_validation(token, api_key=None):
    """Test API key validation endpoint."""
    print("\n🔑 Testing API key validation...")
    
    if not api_key:
        print("⚠️  No API key provided, skipping validation test")
        print("   To test: python test_endpoints.py YOUR_GROQ_API_KEY")
        return None
    
    response = requests.post(
        f"{BASE_URL}/ai/validate-key",
        headers={"Authorization": f"Bearer {token}"},
        json={"api_key": api_key}
    )
    
    if response.status_code == 200:
        result = response.json()
        if result.get("valid"):
            print(f"✅ API key is valid!")
        else:
            print(f"❌ API key is invalid: {result.get('message')}")
        return result.get("valid")
    else:
        print(f"❌ Validation endpoint failed: {response.status_code}")
        return False

def main():
    """Run all tests."""
    import sys
    
    print("=" * 60)
    print("🧪 ERABS API ENDPOINT TESTS")
    print("=" * 60)
    
    # Get API key from command line if provided
    groq_api_key = sys.argv[1] if len(sys.argv) > 1 else None
    
    # Test login
    token = test_login()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        return
    
    # Test all endpoints
    results = {
        "resources": test_resources(token),
        "bookings": test_bookings(token),
        "analytics": test_analytics(token),
    }
    
    # Test API key validation if provided
    if groq_api_key:
        results["api_key_validation"] = test_api_key_validation(token, groq_api_key)
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL" if result is False else "⚠️  SKIP"
        print(f"{status} - {test_name}")
    
    all_passed = all(r for r in results.values() if r is not None)
    
    if all_passed:
        print("\n🎉 All tests passed!")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
    
    print("\n💡 Tip: To test API key validation, run:")
    print("   python test_endpoints.py YOUR_GROQ_API_KEY")
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to backend!")
        print("   Make sure the backend is running:")
        print("   cd backend && uvicorn main:app --reload --port 8000")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
