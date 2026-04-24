"""
Test script to verify the fixes are working correctly.
Run this after starting the backend server.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_login():
    """Test login endpoint"""
    print("\n1. Testing login...")
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={
            "username": "admin@erabs.com",  # Replace with actual test user
            "password": "admin123"  # Replace with actual password
        }
    )
    
    if response.status_code == 200:
        print("✅ Login successful")
        data = response.json()
        token = data.get("access_token")
        user = data.get("user")
        print(f"   User: {user.get('name')} ({user.get('role')})")
        print(f"   Department: {user.get('department') or user.get('department_id')}")
        return token
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None


def test_auth_me(token):
    """Test /api/auth/me endpoint"""
    print("\n2. Testing /api/auth/me...")
    response = requests.get(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        print("✅ /api/auth/me successful")
        user = response.json()
        print(f"   User: {user.get('name')} ({user.get('role')})")
        print(f"   Department: {user.get('department')}")
        print(f"   Department ID: {user.get('department_id')}")
        return True
    else:
        print(f"❌ /api/auth/me failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False


def test_resources(token):
    """Test resources endpoint"""
    print("\n3. Testing /api/resources...")
    response = requests.get(
        f"{BASE_URL}/api/resources",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        resources = response.json()
        print(f"✅ Resources loaded: {len(resources)} resources")
        if resources:
            print(f"   First resource: {resources[0].get('name')}")
        return True
    else:
        print(f"❌ Resources failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False


def test_ai_chat(token, groq_api_key):
    """Test AI chat endpoint"""
    print("\n4. Testing /api/ai/chat...")
    response = requests.post(
        f"{BASE_URL}/api/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "Hello! Can you help me book a room?",
            "groq_api_key": groq_api_key
        }
    )
    
    if response.status_code == 200:
        print("✅ AI chat successful")
        data = response.json()
        print(f"   Reply: {data.get('reply')[:100]}...")
        return True
    else:
        print(f"❌ AI chat failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False


def main():
    print("=" * 60)
    print("ERABS Backend Fixes - Test Suite")
    print("=" * 60)
    print("\nMake sure the backend server is running:")
    print("  cd backend")
    print("  .venv\\Scripts\\Activate.ps1")
    print("  uvicorn main:app --reload")
    print("\n" + "=" * 60)
    
    # Test login
    token = test_login()
    if not token:
        print("\n❌ Cannot proceed without valid token")
        return
    
    # Test auth/me
    test_auth_me(token)
    
    # Test resources
    test_resources(token)
    
    # Test AI chat (optional - requires Groq API key)
    groq_key = input("\n5. Enter Groq API key to test AI chat (or press Enter to skip): ").strip()
    if groq_key:
        test_ai_chat(token, groq_key)
    else:
        print("\n⏭️  Skipping AI chat test")
    
    print("\n" + "=" * 60)
    print("Test suite complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
