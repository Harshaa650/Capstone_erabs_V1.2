from dotenv import load_dotenv
from supabase_client import supabase_config

load_dotenv()

supabase = supabase_config.service_client
resources = supabase.table('resources').select('id, name').limit(1).execute()
if resources.data:
    r = resources.data[0]
    print(f'Resource ID: {r["id"]}')
    print(f'Resource ID type: {type(r["id"]).__name__}')
    print(f'Resource name: {r["name"]}')
else:
    print('No resources found')
