"""
seed_supabase.py — Seeds past booking history into Supabase for analytics & My Bookings demo data.
Run this once: python seed_supabase.py
"""
import os
import random
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
if not url or not key:
    raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env")

supabase = create_client(url, key)


def main():
    # ── Fetch existing data ──────────────────────────────────────────
    users_res = supabase.table("users").select("id,email,role").execute()
    resources_res = supabase.table("resources").select("id,name,type,requires_approval,capacity,max_duration_min,hourly_cost").execute()
    bookings_count = supabase.table("bookings").select("id", count="exact").execute()

    users = users_res.data
    resources = resources_res.data
    existing_booking_count = bookings_count.count or 0

    if not users:
        print("❌ No users found. Register some users first via the app.")
        return
    if not resources:
        print("❌ No resources found. They should have been seeded at startup.")
        return

    print(f"✅ Found {len(users)} users and {len(resources)} resources.")
    print(f"ℹ️  Existing bookings: {existing_booking_count}")

    if existing_booking_count >= 90:
        print("✅ Seed data already present. Skipping.")
        return

    rand = random.Random(42)
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)

    purposes = [
        "Sprint planning", "Client sync", "Design review", "1:1 meeting",
        "Team standup", "Hackathon", "Retro", "Chess tournament",
        "Foosball match", "Workshop", "Interview", "Strategy session",
        "Quarterly business review", "Product demo", "Onboarding session",
    ]

    bookings_to_insert = []

    # ── 90 past bookings (last 30 days) ──────────────────────────────
    statuses_past = ["approved", "approved", "approved", "cancelled", "completed"]
    for _ in range(90):
        day_offset = rand.randint(1, 30)
        hour = rand.choice([8, 9, 10, 11, 13, 14, 15, 16, 17, 18])
        dur_h = rand.choice([1, 1, 1, 2, 2, 3])
        user = rand.choice(users)
        res = rand.choice(resources)

        max_dur_h = (res.get("max_duration_min") or 240) // 60
        if dur_h > max_dur_h:
            dur_h = max(1, max_dur_h)

        start = (now - timedelta(days=day_offset)).replace(hour=hour, minute=0, second=0, microsecond=0)
        end = start + timedelta(hours=dur_h)
        cap = res.get("capacity") or 4
        att = rand.randint(1, max(1, cap))

        bookings_to_insert.append({
            "user_id": user["id"],
            "resource_id": res["id"],
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "attendees": att,
            "purpose": rand.choice(purposes),
            "status": rand.choice(statuses_past),
            "approver_comment": "",
        })

    # ── 8 pending future bookings (for managers to action) ──────────
    approval_resources = [r for r in resources if r.get("requires_approval")]
    if not approval_resources:
        approval_resources = resources  # fallback

    for i in range(8):
        user = rand.choice(users)
        res = rand.choice(approval_resources)
        day_offset = rand.randint(1, 14)
        hour = rand.choice([9, 10, 11, 14, 15, 16])
        start = (now + timedelta(days=day_offset)).replace(hour=hour, minute=0, second=0, microsecond=0)
        end = start + timedelta(hours=rand.choice([1, 2]))
        cap = res.get("capacity") or 4
        att = min(cap, rand.randint(2, 6))

        bookings_to_insert.append({
            "user_id": user["id"],
            "resource_id": res["id"],
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "attendees": att,
            "purpose": rand.choice([
                "Quarterly review", "Customer onboarding", "Board presentation",
                "Training session", "Strategy offsite",
            ]),
            "status": "pending",
            "approver_comment": "",
        })

    # ── 12 upcoming approved bookings ────────────────────────────────
    for _ in range(12):
        user = rand.choice(users)
        res = rand.choice(resources)
        day_offset = rand.randint(0, 7)
        hour = rand.choice([9, 10, 11, 14, 15, 16])
        start = (now + timedelta(days=day_offset)).replace(hour=hour, minute=0, second=0, microsecond=0)
        end = start + timedelta(hours=1)
        cap = res.get("capacity") or 4
        att = min(cap, rand.randint(1, cap))

        bookings_to_insert.append({
            "user_id": user["id"],
            "resource_id": res["id"],
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "attendees": att,
            "purpose": rand.choice(["Team sync", "Demo", "Review", "Chess match", "Focus block"]),
            "status": "approved",
            "approver_comment": "",
        })

    # ── Insert in batches of 50 ──────────────────────────────────────
    print(f"⏳ Inserting {len(bookings_to_insert)} bookings...")
    batch_size = 50
    inserted = 0
    for i in range(0, len(bookings_to_insert), batch_size):
        batch = bookings_to_insert[i:i + batch_size]
        try:
            result = supabase.table("bookings").insert(batch).execute()
            inserted += len(result.data)
        except Exception as e:
            print(f"  ⚠️  Batch {i//batch_size + 1} error: {e}")

    print(f"✅ Seeded {inserted} bookings successfully!")
    print("🎯 Analytics page should now show real data.")


if __name__ == "__main__":
    main()
