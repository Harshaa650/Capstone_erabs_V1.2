"""
Check Supabase schema and attempt to get resources.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from supabase_client import supabase_config

load_dotenv()

try:
    supabase = supabase_config.service_client
    
    print("⏳ Checking resources table...")
    resources = supabase.table("resources").select("id, name").execute()
    print(f"\n✓ Found {len(resources.data)} resources")
    for r in resources.data[:3]:
        print(f"  - ID: {r['id']}, Name: {r['name']}")
    if len(resources.data) > 3:
        print(f"  ... and {len(resources.data) - 3} more")
    
    # Check the table structure
    print("\n⏳ Checking table structure...")
    result = supabase.query("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'resources'
        LIMIT 5
    """)
    print("Resources table columns:")
    # This might not work, so let's just try getting one resource with all fields
    
    print("\nTrying to get full resource details...")
    one_resource = supabase.table("resources").select("*").limit(1).execute()
    if one_resource.data:
        res = one_resource.data[0]
        print(f"First resource: {res['name']}")
        print(f"  ID type: {type(res['id'])}")
        print(f"  ID value: {res['id']}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nThis is expected if you haven't run the Supabase schema update yet.")
