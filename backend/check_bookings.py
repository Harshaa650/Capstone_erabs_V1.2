from supabase_client import get_supabase_service

supabase = get_supabase_service()

# Get booking counts by status
bookings = supabase.table('bookings').select('id,status,start_time,purpose').execute()
print(f'\n✅ Total bookings: {len(bookings.data)}')

# Count by status
status_counts = {}
for b in bookings.data:
    status = b['status']
    status_counts[status] = status_counts.get(status, 0) + 1

print('\n📊 Bookings by status:')
for status, count in sorted(status_counts.items()):
    print(f'   {status}: {count}')

# Show a few sample bookings
print('\n📋 Sample bookings:')
for b in bookings.data[:5]:
    print(f'   - {b["purpose"]}: {b["start_time"]} ({b["status"]})')
