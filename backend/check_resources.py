from database import db

# Check all resources requires_approval flag
resources = db.supabase.table('resources').select('name, requires_approval').execute().data
print("=== Resource Approval Settings ===")
for r in resources:
    flag = r['requires_approval']
    print(f"  {r['name']}: requires_approval = {flag}")

# Count how many are False
false_count = sum(1 for r in resources if not r['requires_approval'])
print(f"\n{false_count} out of {len(resources)} resources do NOT require approval")
