"""
Update Supabase to add resources with IDs 1-12.
Run this script: python update_schema_supabase.py
"""
import os
from dotenv import load_dotenv

load_dotenv()

def get_supabase_service():
    """Get Supabase service client."""
    from supabase import create_client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
    return create_client(url, key)

def update_schema():
    """Add resources to Supabase."""
    supabase = get_supabase_service()
    
    print("⏳ Seeding resources with IDs 1-12...")
    
    resources = [
        {"id": 1, "name": "Aurora Boardroom", "type": "room", "capacity": 12, "location": "Floor 4",
         "description": "Executive boardroom with panoramic 4K display, immersive audio and conference-grade lighting.",
         "requires_approval": True, "scene_type": "large", "active": True,
         "amenities": "wifi,display,sound,projector,chairs",
         "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80"},
        {"id": 2, "name": "Titan Conference Hall", "type": "room", "capacity": 20, "location": "Floor 5",
         "description": "Large-capacity hall for company-wide town-halls, client pitches and training sessions.",
         "requires_approval": True, "scene_type": "large", "active": True,
         "amenities": "wifi,display,sound,projector,chairs,parking",
         "image_url": "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1200&q=80"},
        {"id": 3, "name": "Quantum Lab", "type": "room", "capacity": 8, "location": "Floor 3",
         "description": "Innovation lab with writable walls, standing desks and dev monitors.",
         "requires_approval": True, "scene_type": "medium", "active": True,
         "amenities": "wifi,display,sound,chairs",
         "image_url": "https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80"},
        {"id": 4, "name": "Orbit Huddle Space", "type": "room", "capacity": 6, "location": "Floor 2",
         "description": "Cozy huddle room for brainstorming, sprint planning and design reviews.",
         "requires_approval": False, "scene_type": "medium", "active": True,
         "amenities": "wifi,display,chairs",
         "image_url": "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80"},
        {"id": 5, "name": "Nova Meeting Room", "type": "room", "capacity": 8, "location": "Floor 2",
         "description": "Standard meeting room with a circular conference table and modern AV setup.",
         "requires_approval": False, "scene_type": "normal", "active": True,
         "amenities": "wifi,display,sound,chairs",
         "image_url": "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&q=80"},
        {"id": 6, "name": "Helix Collaboration Room", "type": "room", "capacity": 8, "location": "Floor 3",
         "description": "Collaborative meeting space with glass walls and ergonomic seating for 8.",
         "requires_approval": False, "scene_type": "normal", "active": True,
         "amenities": "wifi,display,sound,chairs",
         "image_url": "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80"},
        {"id": 7, "name": "Nebula Focus Pod", "type": "room", "capacity": 2, "location": "Floor 2",
         "description": "Soundproof 1-on-1 collaboration pod with integrated display and acoustic panels.",
         "requires_approval": False, "scene_type": "cabin", "active": True,
         "amenities": "wifi,display,chairs",
         "image_url": "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80"},
        {"id": 8, "name": "Zenith Focus Cabin", "type": "room", "capacity": 2, "location": "Floor 4",
         "description": "Premium focus cabin for deep-work, interviews or 1:1 mentorship sessions.",
         "requires_approval": False, "scene_type": "cabin", "active": True,
         "amenities": "wifi,display,chairs",
         "image_url": "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80"},
        {"id": 9, "name": "Executive Cabin — Summit", "type": "room", "capacity": 4, "location": "Floor 6",
         "description": "Private executive cabin with plush seating and floor-to-ceiling windows.",
         "requires_approval": True, "scene_type": "manager", "active": True,
         "amenities": "wifi,display,sound,chairs,parking",
         "image_url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80"},
        {"id": 10, "name": "Galaxy War Room", "type": "room", "capacity": 6, "location": "Floor 6",
         "description": "Executive strategy cabin with private workstations and presentation screens.",
         "requires_approval": True, "scene_type": "manager", "active": True,
         "amenities": "wifi,display,sound,projector,chairs",
         "image_url": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80"},
        {"id": 11, "name": "Chess Lounge", "type": "recreation", "capacity": 4, "location": "Floor 1 · Recreation Wing",
         "description": "Quiet chess lounge with two premium chess boards, analog clocks and leather armchairs. Open to everyone — no approval needed.",
         "requires_approval": False, "scene_type": "chess", "active": True,
         "amenities": "wifi,chairs",
         "image_url": "https://images.unsplash.com/photo-1560174038-594a18c76bc1?w=1200&q=80"},
        {"id": 12, "name": "Foosball Arena", "type": "recreation", "capacity": 4, "location": "Floor 1 · Recreation Wing",
         "description": "Championship-grade foosball table with LED scoreboard. Great for quick breaks and team bonding.",
         "requires_approval": False, "scene_type": "foosball", "active": True,
         "amenities": "wifi,sound",
         "image_url": "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=1200&q=80"},
    ]
    
    # Clear existing resources
    try:
        response = supabase.table("resources").select("id").execute()
        if response.data:
            print(f"  Found {len(response.data)} existing resources, clearing...")
            supabase.table("resources").delete().neq("id", -1).execute()
            print("  ✓ Cleared existing resources")
    except Exception as e:
        print(f"  Note: {str(e)}")
    
    # Insert new resources
    failed = 0
    for resource in resources:
        try:
            supabase.table("resources").insert(resource).execute()
            print(f"  ✓ Inserted {resource['name']} (ID: {resource['id']})")
        except Exception as e:
            print(f"  ⚠️  Failed to insert {resource['name']}: {str(e)}")
            failed += 1
    
    if failed == 0:
        print("\n✅ All resources seeded! IDs 1-12")
    else:
        print(f"\n⚠️  {failed} resources failed to insert")
    print("   Refresh your browser to see the changes.")

if __name__ == "__main__":
    update_schema()
