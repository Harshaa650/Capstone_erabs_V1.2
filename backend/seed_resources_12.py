"""
Update Supabase resources using existing backend database connection.
Run: python seed_resources_12.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from database import Database

load_dotenv()

def seed_resources():
    """Seed 12 resources."""
    db = Database()
    
    if not db.use_supabase:
        print("❌ This script requires Supabase. Set USE_SUPABASE=true in .env")
        return
    
    print("⏳ Clearing existing resources...")
    try:
        db.supabase.table("resources").delete().neq("id", -1).execute()
        print("  ✓ Cleared existing resources")
    except Exception as e:
        print(f"  Note: {e}")
    
    resources = [
        {"name": "Aurora Boardroom", "type": "room", "capacity": 12, "location": "Floor 4",
         "description": "Executive boardroom with panoramic 4K display, immersive audio and conference-grade lighting.",
         "requires_approval": True, "scene_type": "large", "active": True, "avail_start": 8, "avail_end": 20,
         "amenities": "wifi,display,sound,projector,chairs", "max_duration_min": 240,
         "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80"},
        {"name": "Titan Conference Hall", "type": "room", "capacity": 20, "location": "Floor 5",
         "description": "Large-capacity hall for company-wide town-halls, client pitches and training sessions.",
         "requires_approval": True, "scene_type": "large", "active": True, "avail_start": 8, "avail_end": 20,
         "amenities": "wifi,display,sound,projector,chairs,parking", "max_duration_min": 240,
         "image_url": "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1200&q=80"},
        {"name": "Quantum Lab", "type": "room", "capacity": 8, "location": "Floor 3",
         "description": "Innovation lab with writable walls, standing desks and dev monitors.",
         "requires_approval": True, "scene_type": "medium", "active": True, "avail_start": 8, "avail_end": 20,
         "amenities": "wifi,display,sound,chairs", "max_duration_min": 240,
         "image_url": "https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80"},
        {"name": "Orbit Huddle Space", "type": "room", "capacity": 6, "location": "Floor 2",
         "description": "Cozy huddle room for brainstorming, sprint planning and design reviews.",
         "requires_approval": False, "scene_type": "medium", "active": True, "avail_start": 8, "avail_end": 20,
         "amenities": "wifi,display,chairs", "max_duration_min": 240,
         "image_url": "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80"},
        {"name": "Nova Meeting Room", "type": "room", "capacity": 8, "location": "Floor 2",
         "description": "Standard meeting room with a circular conference table and modern AV setup.",
         "requires_approval": False, "scene_type": "normal", "active": True, "avail_start": 8, "avail_end": 20,
         "amenities": "wifi,display,sound,chairs", "max_duration_min": 240,
         "image_url": "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&q=80"},
        {"name": "Helix Collaboration Room", "type": "room", "capacity": 8, "location": "Floor 3",
         "description": "Collaborative meeting space with glass walls and ergonomic seating for 8.",
         "requires_approval": False, "scene_type": "normal", "active": True, "avail_start": 8, "avail_end": 20,
         "amenities": "wifi,display,sound,chairs", "max_duration_min": 240,
         "image_url": "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80"},
        {"name": "Nebula Focus Pod", "type": "room", "capacity": 2, "location": "Floor 2",
         "description": "Soundproof 1-on-1 collaboration pod with integrated display and acoustic panels.",
         "requires_approval": False, "scene_type": "cabin", "active": True, "avail_start": 8, "avail_end": 20,
         "amenities": "wifi,display,chairs", "max_duration_min": 240,
         "image_url": "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80"},
        {"name": "Zenith Focus Cabin", "type": "room", "capacity": 2, "location": "Floor 4",
         "description": "Premium focus cabin for deep-work, interviews or 1:1 mentorship sessions.",
         "requires_approval": False, "scene_type": "cabin", "active": True, "avail_start": 8, "avail_end": 20,
         "amenities": "wifi,display,chairs", "max_duration_min": 240,
         "image_url": "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80"},
        {"name": "Executive Cabin — Summit", "type": "room", "capacity": 4, "location": "Floor 6",
         "description": "Private executive cabin with plush seating and floor-to-ceiling windows.",
         "requires_approval": True, "scene_type": "manager", "active": True, "avail_start": 8, "avail_end": 20,
         "amenities": "wifi,display,sound,chairs,parking", "max_duration_min": 240,
         "image_url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80"},
        {"name": "Galaxy War Room", "type": "room", "capacity": 6, "location": "Floor 6",
         "description": "Executive strategy cabin with private workstations and presentation screens.",
         "requires_approval": True, "scene_type": "manager", "active": True, "avail_start": 8, "avail_end": 20,
         "amenities": "wifi,display,sound,projector,chairs", "max_duration_min": 240,
         "image_url": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80"},
        {"name": "Chess Lounge", "type": "recreation", "capacity": 4, "location": "Floor 1 · Recreation Wing",
         "description": "Quiet chess lounge with two premium chess boards, analog clocks and leather armchairs. Open to everyone — no approval needed.",
         "requires_approval": False, "scene_type": "chess", "active": True, "avail_start": 8, "avail_end": 20,
         "amenities": "wifi,chairs", "max_duration_min": 240,
         "image_url": "https://images.unsplash.com/photo-1560174038-594a18c76bc1?w=1200&q=80"},
        {"name": "Foosball Arena", "type": "recreation", "capacity": 4, "location": "Floor 1 · Recreation Wing",
         "description": "Championship-grade foosball table with LED scoreboard. Great for quick breaks and team bonding.",
         "requires_approval": False, "scene_type": "foosball", "active": True, "avail_start": 8, "avail_end": 20,
         "amenities": "wifi,sound", "max_duration_min": 240,
         "image_url": "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=1200&q=80"},
    ]
    
    print("\n⏳ Seeding 12 resources...")
    failed = 0
    for resource in resources:
        try:
            result = db.supabase.table("resources").insert(resource).execute()
            inserted_id = result.data[0]['id'] if result.data else 'unknown'
            print(f"  ✓ {resource['name']} (ID: {inserted_id})")
        except Exception as e:
            print(f"  ❌ {resource['name']}: {str(e)}")
            failed += 1
    
    if failed == 0:
        print("\n✅ Successfully seeded all 12 resources!")
        print("   Resources have been auto-assigned IDs by the database")
        print("   Refresh your browser to see the changes")
    else:
        print(f"\n⚠️  {failed} resources failed to insert")

if __name__ == "__main__":
    seed_resources()
