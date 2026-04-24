"""Quick script to check what's in your Supabase database."""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

print("=" * 60)
print("📊 SUPABASE DATA SUMMARY")
print("=" * 60)

# Count records in each table
tables = ["departments", "users", "resources", "bookings", "maintenance", "audit_logs", "chat_messages"]

for table in tables:
    try:
        result = supabase.table(table).select("*", count="exact").execute()
        print(f"✅ {table:20} {result.count:5} records")
    except Exception as e:
        print(f"❌ {table:20} Error: {e}")

print("\n" + "=" * 60)
print("📋 BOOKING STATUS BREAKDOWN")
print("=" * 60)

# Booking status breakdown
statuses = ["pending", "approved", "rejected", "cancelled", "completed"]
for status in statuses:
    result = supabase.table("bookings").select("*", count="exact").eq("status", status).execute()
    print(f"   {status:15} {result.count:5} bookings")

print("\n" + "=" * 60)
print("👥 USER ROLES")
print("=" * 60)

# User roles
roles = ["admin", "manager", "employee"]
for role in roles:
    result = supabase.table("users").select("*", count="exact").eq("role", role).execute()
    print(f"   {role:15} {result.count:5} users")

print("\n" + "=" * 60)
print("🏢 RESOURCES BY TYPE")
print("=" * 60)

# Resources by type
types = ["room", "recreation", "vehicle"]
for rtype in types:
    result = supabase.table("resources").select("*", count="exact").eq("type", rtype).execute()
    print(f"   {rtype:15} {result.count:5} resources")

print("\n" + "=" * 60)
print("✅ All data is stored in Supabase!")
print("=" * 60)
