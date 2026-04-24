"""
Test script to verify AI Assistant functionality with Supabase.
This script tests the complete workflow: search -> check availability -> book
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_ai_search_resources(token, groq_key):
    """Test AI searching for resources"""
    print("\n" + "="*60)
    print("TEST 1: AI Search for Chess Lounge")
    print("="*60)
    
    response = requests.post(
        f"{BASE_URL}/api/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "Find the chess lounge",
            "groq_api_key": groq_key
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        reply = data.get("reply", "")
        print(f"✅ AI Response:\n{reply}\n")
        
        # Check if search was successful
        if "Found" in reply and "resource" in reply.lower():
            print("✅ Search function working!")
            return True
        else:
            print("⚠️  Search might not have executed properly")
            return False
    else:
        print(f"❌ Request failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False


def test_ai_check_availability(token, groq_key):
    """Test AI checking availability"""
    print("\n" + "="*60)
    print("TEST 2: AI Check Chess Lounge Availability")
    print("="*60)
    
    # Use tomorrow's date
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    response = requests.post(
        f"{BASE_URL}/api/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": f"Is the chess lounge available on {tomorrow} at 2 PM for 4 people?",
            "groq_api_key": groq_key
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        reply = data.get("reply", "")
        print(f"✅ AI Response:\n{reply}\n")
        
        # Check if availability check was successful
        if "available" in reply.lower() or "✅" in reply or "❌" in reply:
            print("✅ Availability check working!")
            return True
        else:
            print("⚠️  Availability check might not have executed properly")
            return False
    else:
        print(f"❌ Request failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False


def test_ai_create_booking(token, groq_key):
    """Test AI creating a booking"""
    print("\n" + "="*60)
    print("TEST 3: AI Create Booking")
    print("="*60)
    
    # Use tomorrow's date
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    response = requests.post(
        f"{BASE_URL}/api/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": f"Book the chess lounge on {tomorrow} from 2 PM to 4 PM for 4 people for a team meeting",
            "groq_api_key": groq_key
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        reply = data.get("reply", "")
        print(f"✅ AI Response:\n{reply}\n")
        
        # Check if booking was successful
        if "Booking created" in reply or "booking id" in reply.lower():
            print("✅ Booking creation working!")
            return True
        else:
            print("⚠️  Booking might not have been created")
            return False
    else:
        print(f"❌ Request failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False


def test_ai_get_bookings(token, groq_key):
    """Test AI retrieving user's bookings"""
    print("\n" + "="*60)
    print("TEST 4: AI Get My Bookings")
    print("="*60)
    
    response = requests.post(
        f"{BASE_URL}/api/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": "Show me my bookings",
            "groq_api_key": groq_key
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        reply = data.get("reply", "")
        print(f"✅ AI Response:\n{reply}\n")
        
        # Check if bookings were retrieved
        if "booking" in reply.lower():
            print("✅ Get bookings working!")
            return True
        else:
            print("⚠️  Bookings retrieval might not have executed properly")
            return False
    else:
        print(f"❌ Request failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False


def main():
    print("="*60)
    print("ERABS AI Assistant - Comprehensive Test Suite")
    print("="*60)
    print("\nThis script will test:")
    print("1. Resource search functionality")
    print("2. Availability checking")
    print("3. Booking creation")
    print("4. Booking retrieval")
    print("\n" + "="*60)
    
    # Get credentials
    print("\nPlease provide test credentials:")
    email = input("Email (default: admin@erabs.com): ").strip() or "admin@erabs.com"
    password = input("Password (default: admin123): ").strip() or "admin123"
    groq_key = input("Groq API Key: ").strip()
    
    if not groq_key:
        print("\n❌ Groq API key is required!")
        return
    
    # Login
    print("\n" + "="*60)
    print("Logging in...")
    print("="*60)
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": email, "password": password}
    )
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    token = response.json().get("access_token")
    user = response.json().get("user")
    print(f"✅ Logged in as: {user.get('name')} ({user.get('role')})")
    
    # Run tests
    results = {
        "search": test_ai_search_resources(token, groq_key),
        "availability": test_ai_check_availability(token, groq_key),
        "booking": test_ai_create_booking(token, groq_key),
        "get_bookings": test_ai_get_bookings(token, groq_key)
    }
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.upper()}: {status}")
    
    total = len(results)
    passed = sum(results.values())
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! AI Assistant is fully functional!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the output above.")
    
    print("="*60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
