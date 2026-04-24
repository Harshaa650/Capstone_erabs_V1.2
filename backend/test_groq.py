"""Quick test script to verify Groq API integration."""
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

def test_groq():
    """Test Groq API with a simple request."""
    api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key:
        print("❌ GROQ_API_KEY not found in .env")
        print("ℹ️  You can still use the dynamic API key feature in the app")
        return
    
    print("🔍 Testing Groq API...")
    print(f"📝 API Key: {api_key[:10]}...{api_key[-4:]}")
    
    try:
        client = Groq(api_key=api_key)
        
        print("⏳ Sending test message...")
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Respond in one sentence."
                },
                {
                    "role": "user",
                    "content": "Say hello and confirm you're working!"
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=100,
        )
        
        reply = response.choices[0].message.content
        print(f"✅ Success! Response: {reply}")
        print(f"📊 Model: {response.model}")
        print(f"⚡ Tokens used: {response.usage.total_tokens}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if "invalid_api_key" in str(e).lower():
            print("💡 Tip: Check your API key at https://console.groq.com")

if __name__ == "__main__":
    test_groq()
