"""
Direct PostgreSQL connection to update schema to use INTEGER resource IDs.
Run: python update_schema_direct.py
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

def update_schema():
    """Update PostgreSQL schema directly."""
    try:
        import psycopg2
    except ImportError:
        print("❌ psycopg2 not installed. Installing...")
        os.system("pip install psycopg2-binary")
        import psycopg2
    
    # Get database URL
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL not set in .env")
        sys.exit(1)
    
    # Parse connection string
    # Format: postgresql+psycopg://user:password@host:port/database
    try:
        # Remove postgresql+psycopg:// prefix
        conn_str = db_url.replace("postgresql+psycopg://", "")
        parts = conn_str.split("@")
        creds = parts[0].split(":")
        user = creds[0]
        password = creds[1]
        host_port_db = parts[1].split("/")
        host_port = host_port_db[0].split(":")
        host = host_port[0]
        port = int(host_port[1])
        database = host_port_db[1]
    except Exception as e:
        print(f"❌ Failed to parse DATABASE_URL: {e}")
        sys.exit(1)
    
    # Connect to PostgreSQL
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        cursor = conn.cursor()
        print("✓ Connected to PostgreSQL")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        sys.exit(1)
    
    # SQL commands
    sql_commands = [
        "DROP TABLE IF EXISTS bookings CASCADE;",
        "DROP TABLE IF EXISTS maintenance CASCADE;",
        "DROP SEQUENCE IF EXISTS resources_id_seq;",
        "CREATE SEQUENCE resources_id_seq START WITH 1 INCREMENT BY 1;",
        "ALTER TABLE resources ALTER COLUMN id SET DEFAULT nextval('resources_id_seq');",
        """
        CREATE TABLE bookings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            attendees INTEGER DEFAULT 1,
            purpose TEXT DEFAULT '',
            status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
            approver_comment TEXT DEFAULT '',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        "CREATE INDEX idx_bookings_user_id ON bookings(user_id);",
        "CREATE INDEX idx_bookings_resource_id ON bookings(resource_id);",
        """
        CREATE TABLE maintenance (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            reason VARCHAR(255) DEFAULT 'Scheduled maintenance',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        "CREATE INDEX idx_maintenance_resource_id ON maintenance(resource_id);",
        "DELETE FROM resources;",  # Clear existing resources
    ]
    
    print("\n⏳ Updating PostgreSQL schema...")
    
    try:
        for i, cmd in enumerate(sql_commands, 1):
            if cmd.strip():
                cursor.execute(cmd)
                print(f"  ✓ Step {i}: {cmd[:60]}...")
        
        conn.commit()
        print("\n✓ Schema updated successfully!")
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error: {e}")
        cursor.close()
        conn.close()
        sys.exit(1)
    
    # Insert resources
    print("\n⏳ Inserting 12 resources...")
    
    resources = [
        (1, "Aurora Boardroom", "room", "Executive boardroom with panoramic 4K display, immersive audio and conference-grade lighting.", 12, "Floor 4", 8, 20, True, "", 240, True, "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80", "large", "wifi,display,sound,projector,chairs", 50),
        (2, "Titan Conference Hall", "room", "Large-capacity hall for company-wide town-halls, client pitches and training sessions.", 20, "Floor 5", 8, 20, True, "", 240, True, "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1200&q=80", "large", "wifi,display,sound,projector,chairs,parking", 50),
        (3, "Quantum Lab", "room", "Innovation lab with writable walls, standing desks and dev monitors.", 8, "Floor 3", 8, 20, True, "", 240, True, "https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80", "medium", "wifi,display,sound,chairs", 50),
        (4, "Orbit Huddle Space", "room", "Cozy huddle room for brainstorming, sprint planning and design reviews.", 6, "Floor 2", 8, 20, False, "", 240, True, "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80", "medium", "wifi,display,chairs", 50),
        (5, "Nova Meeting Room", "room", "Standard meeting room with a circular conference table and modern AV setup.", 8, "Floor 2", 8, 20, False, "", 240, True, "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&q=80", "normal", "wifi,display,sound,chairs", 50),
        (6, "Helix Collaboration Room", "room", "Collaborative meeting space with glass walls and ergonomic seating for 8.", 8, "Floor 3", 8, 20, False, "", 240, True, "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80", "normal", "wifi,display,sound,chairs", 50),
        (7, "Nebula Focus Pod", "room", "Soundproof 1-on-1 collaboration pod with integrated display and acoustic panels.", 2, "Floor 2", 8, 20, False, "", 240, True, "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80", "cabin", "wifi,display,chairs", 50),
        (8, "Zenith Focus Cabin", "room", "Premium focus cabin for deep-work, interviews or 1:1 mentorship sessions.", 2, "Floor 4", 8, 20, False, "", 240, True, "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80", "cabin", "wifi,display,chairs", 50),
        (9, "Executive Cabin — Summit", "room", "Private executive cabin with plush seating and floor-to-ceiling windows.", 4, "Floor 6", 8, 20, True, "", 240, True, "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80", "manager", "wifi,display,sound,chairs,parking", 50),
        (10, "Galaxy War Room", "room", "Executive strategy cabin with private workstations and presentation screens.", 6, "Floor 6", 8, 20, True, "", 240, True, "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80", "manager", "wifi,display,sound,projector,chairs", 50),
        (11, "Chess Lounge", "recreation", "Quiet chess lounge with two premium chess boards, analog clocks and leather armchairs. Open to everyone — no approval needed.", 4, "Floor 1 · Recreation Wing", 8, 20, False, "", 240, True, "https://images.unsplash.com/photo-1560174038-594a18c76bc1?w=1200&q=80", "chess", "wifi,chairs", 50),
        (12, "Foosball Arena", "recreation", "Championship-grade foosball table with LED scoreboard. Great for quick breaks and team bonding.", 4, "Floor 1 · Recreation Wing", 8, 20, False, "", 240, True, "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=1200&q=80", "foosball", "wifi,sound", 50),
    ]
    
    insert_sql = """
    INSERT INTO resources (
        id, name, type, description, capacity, location, 
        avail_start, avail_end, requires_approval, department_restricted, 
        max_duration_min, active, image_url, scene_type, amenities, hourly_cost
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    try:
        for resource in resources:
            cursor.execute(insert_sql, resource)
            print(f"  ✓ Inserted {resource[1]} (ID: {resource[0]})")
        
        conn.commit()
        print("\n✅ All 12 resources seeded with IDs 1-12!")
        print("   Refresh your browser to see the resources.")
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error inserting resources: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    update_schema()
