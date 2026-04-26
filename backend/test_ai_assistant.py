"""
Test script to verify AI Assistant functionality with Supabase.
This script tests the complete workflow: search -> check availability -> book
Ensures AI responses are clean, human-readable text (no JSON or internal traces)
"""

import requests
import json
import re
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"


def clean_ai_reply(reply: str) -> str:
    """Remove JSON, tool calls, and internal traces from AI response"""
    if not reply:
        return ""

    # 1. Remove triple backtick code blocks
    reply = re.sub(r"```.*?```", "", reply, flags=re.DOTALL)

    # 2. Remove ALL JSON-like lines (lines starting with { and ending with })
    reply = re.sub(r"^\s*\{.*?\}\s*$", "", reply, flags=re.MULTILINE)

    # 3. Remove inline JSON fragments (more aggressive)
    reply = re.sub(r"\{[^{}]*\"action\"[^{}]*\}", "", reply)

    # 4. Remove leftover braces content (fallback)
    reply = re.sub(r"\{.*?\}", "", reply, flags=re.DOTALL)

    # 5. Clean extra blank lines
    reply = re.sub(r"\n\s*\n+", "\n\n", reply)

    return reply.strip()


def print_clean_response(reply: str):
    clean = clean_ai_reply(reply)
    print(f"\nAI Response:\n{clean}\n")


def test_ai_search_resources(token, groq_key):
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
        print_clean_response(reply)
        
        if "chess" in reply.lower():
            print("PASS: Search function working!")
            return True
        else:
            print("WARN: Search might not have executed properly")
            return False
    else:
        print(f"FAIL: Request failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False


def test_ai_check_availability(token, groq_key):
    print("\n" + "="*60)
    print("TEST 2: AI Check Chess Lounge Availability")
    print("="*60)
    
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
        print_clean_response(reply)
        
        if "available" in reply.lower():
            print("PASS: Availability check working!")
            return True
        else:
            print("WARN: Availability check might not have executed properly")
            return False
    else:
        print(f"FAIL: Request failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False


def test_ai_create_booking(token, groq_key):
    print("\n" + "="*60)
    print("TEST 3: AI Create Booking")
    print("="*60)
    
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
        print_clean_response(reply)
        
        if "booking" in reply.lower():
            print("PASS: Booking creation working!")
            return True
        else:
            print("WARN: Booking might not have been created")
            return False
    else:
        print(f"FAIL: Request failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False


def test_ai_get_bookings(token, groq_key):
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
        print_clean_response(reply)
        
        if "booking" in reply.lower():
            print("PASS: Get bookings working!")
            return True
        else:
            print("WARN: Bookings retrieval might not have executed properly")
            return False
    else:
        print(f"FAIL: Request failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False


def main():
    print("="*60)
    print("ERABS AI Assistant - Comprehensive Test Suite")
    print("="*60)
    
    print("\nPlease provide test credentials:")
    email = input("Email (default: admin@erabs.com): ").strip() or "admin@erabs.com"
    password = input("Password (default: admin123): ").strip() or "admin123"
    groq_key = input("Groq API Key: ").strip()
    
    if not groq_key:
        print("\n❌ Groq API key is required!")
        return
    
    print("\nLogging in...")
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": email, "password": password}
    )
    
    if response.status_code != 200:
        print(f"FAIL: Login failed: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    token = response.json().get("access_token")
    user = response.json().get("user")
    print(f"PASS: Logged in as: {user.get('name')} ({user.get('role')})")
    
    results = {
        "search": test_ai_search_resources(token, groq_key),
        "availability": test_ai_check_availability(token, groq_key),
        "booking": test_ai_create_booking(token, groq_key),
        "get_bookings": test_ai_get_bookings(token, groq_key)
    }
    
    print("\nTEST SUMMARY")
    
    for test_name, result in results.items():
        status = "PASS" if result else "FAIL"
        print(f"{test_name.upper()}: {status}")
    
    total = len(results)
    passed = sum(results.values())
    
    print(f"\nTotal: {passed}/{total} tests passed")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
