import bcrypt
from supabase_client import get_supabase_service

# Generate password hashes
admin_hash = bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode()
manager_hash = bcrypt.hashpw(b'manager123', bcrypt.gensalt()).decode()
employee_hash = bcrypt.hashpw(b'employee123', bcrypt.gensalt()).decode()

print("Generated hashes:")
print(f"admin123: {admin_hash}")
print(f"manager123: {manager_hash}")
print(f"employee123: {employee_hash}")

# Update Supabase
client = get_supabase_service()

client.table('users').update({'hashed_password': admin_hash}).eq('email', 'admin@erabs.io').execute()
client.table('users').update({'hashed_password': manager_hash}).eq('email', 'manager@erabs.io').execute()
client.table('users').update({'hashed_password': employee_hash}).eq('email', 'employee@erabs.io').execute()

print("Password hashes updated in Supabase")
