from supabase_client import get_supabase_service

supabase = get_supabase_service()
res = supabase.table('resources').select('id,name').execute()
print(f'Found {len(res.data)} resources')
for r in res.data:
    print(f'  {r["id"]}: {r["name"]}')
