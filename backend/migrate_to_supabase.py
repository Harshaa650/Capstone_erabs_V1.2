"""
Migration script to transfer data from SQLite to Supabase.
Run this script after setting up your Supabase project.
"""
import os
import sys
import hashlib
import secrets
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory to path to import main
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from supabase_client import get_supabase_service

load_dotenv()

# SQLite connection
SQLITE_URL = os.getenv("DATABASE_URL", "sqlite:///./erabs.db")
sqlite_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=sqlite_engine, autoflush=False, autocommit=False)
Base = declarative_base()


# Define SQLite models to match existing schema
class SQLiteUser(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="employee")
    department = Column(String, default="General")


class SQLiteResource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    type = Column(String)
    description = Column(Text, default="")
    capacity = Column(Integer, default=1)
    location = Column(String, default="HQ")
    avail_start = Column(Integer, default=8)
    avail_end = Column(Integer, default=20)
    requires_approval = Column(Boolean, default=False)
    department_restricted = Column(String, default="")
    max_duration_min = Column(Integer, default=240)
    active = Column(Boolean, default=True)
    image_url = Column(String, default="")
    scene_type = Column(String, default="normal")
    amenities = Column(String, default="wifi,display,sound,chairs")
    hourly_cost = Column(Integer, default=50)


class SQLiteBooking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    resource_id = Column(Integer, ForeignKey("resources.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    attendees = Column(Integer, default=1)
    purpose = Column(Text, default="")
    status = Column(String, default="pending")
    approver_comment = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now())


class SQLiteMaintenance(Base):
    __tablename__ = "maintenance"
    id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, ForeignKey("resources.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    reason = Column(String, default="Scheduled maintenance")


class SQLiteAuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    actor_id = Column(Integer)
    action = Column(String)
    entity = Column(String)
    entity_id = Column(Integer)
    details = Column(Text, default="")
    timestamp = Column(DateTime, default=lambda: datetime.now())


class SQLiteChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(String, index=True)
    role = Column(String)
    content = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.now())


def migrate_departments(supabase):
    """Migrate departments from hardcoded values."""
    print("Migrating departments...")
    
    departments = [
        {"name": "IT", "description": "Information Technology Department"},
        {"name": "Engineering", "description": "Engineering and Development"},
        {"name": "HR", "description": "Human Resources"},
        {"name": "Finance", "description": "Finance and Accounting"},
        {"name": "Marketing", "description": "Marketing and Sales"},
        {"name": "Operations", "description": "Operations and Facilities"},
        {"name": "General", "description": "General Purpose"},
    ]
    
    # Get existing departments to avoid duplicates
    existing = supabase.table("departments").select("name").execute()
    existing_names = {d["name"] for d in existing.data}
    
    for dept in departments:
        if dept["name"] not in existing_names:
            supabase.table("departments").insert(dept).execute()
            print(f"  Created department: {dept['name']}")
        else:
            print(f"  Department already exists: {dept['name']}")
    
    # Create department name to ID mapping
    result = supabase.table("departments").select("id, name").execute()
    return {d["name"]: d["id"] for d in result.data}


def migrate_users(db: Session, supabase, dept_map: dict):
    """Migrate users from SQLite to Supabase."""
    print("Migrating users...")
    
    users = db.query(SQLiteUser).all()
    user_id_map = {}  # SQLite ID -> Supabase UUID
    
    # Get existing users
    existing = supabase.table("users").select("email").execute()
    existing_emails = {u["email"] for u in existing.data}
    
    for user in users:
        if user.email in existing_emails:
            # Get existing user's UUID
            result = supabase.table("users").select("id").eq("email", user.email).execute()
            if result.data:
                user_id_map[user.id] = result.data[0]["id"]
                print(f"  User already exists: {user.email}")
            continue
        
        dept_id = dept_map.get(user.department, dept_map.get("General"))
        
        user_data = {
            "email": user.email,
            "name": user.name,
            "hashed_password": user.hashed_password,
            "role": user.role,
            "department_id": dept_id,
            "is_active": True,
        }
        
        result = supabase.table("users").insert(user_data).execute()
        user_id_map[user.id] = result.data[0]["id"]
        print(f"  Migrated user: {user.email}")
    
    return user_id_map


def migrate_resources(db: Session, supabase, dept_map: dict):
    """Migrate resources from SQLite to Supabase."""
    print("Migrating resources...")
    
    resources = db.query(SQLiteResource).all()
    resource_id_map = {}  # SQLite ID -> Supabase UUID
    
    # Get existing resources
    existing = supabase.table("resources").select("name").execute()
    existing_names = {r["name"] for r in existing.data}
    
    for resource in resources:
        if resource.name in existing_names:
            result = supabase.table("resources").select("id").eq("name", resource.name).execute()
            if result.data:
                resource_id_map[resource.id] = result.data[0]["id"]
                print(f"  Resource already exists: {resource.name}")
            continue
        
        dept_id = None
        if resource.department_restricted:
            dept_id = dept_map.get(resource.department_restricted)
        
        resource_data = {
            "name": resource.name,
            "type": resource.type,
            "description": resource.description,
            "capacity": resource.capacity,
            "location": resource.location,
            "avail_start": resource.avail_start,
            "avail_end": resource.avail_end,
            "requires_approval": resource.requires_approval,
            "department_restricted": dept_id,
            "max_duration_min": resource.max_duration_min,
            "active": resource.active,
            "image_url": resource.image_url,
            "scene_type": resource.scene_type,
            "amenities": resource.amenities,
            "hourly_cost": resource.hourly_cost,
        }
        
        result = supabase.table("resources").insert(resource_data).execute()
        resource_id_map[resource.id] = result.data[0]["id"]
        print(f"  Migrated resource: {resource.name}")
    
    return resource_id_map


def migrate_bookings(db: Session, supabase, user_id_map: dict, resource_id_map: dict):
    """Migrate bookings from SQLite to Supabase."""
    print("Migrating bookings...")
    
    bookings = db.query(SQLiteBooking).all()
    
    for booking in bookings:
        if booking.user_id not in user_id_map or booking.resource_id not in resource_id_map:
            print(f"  Skipping booking {booking.id}: missing user or resource")
            continue
        
        booking_data = {
            "user_id": user_id_map[booking.user_id],
            "resource_id": resource_id_map[booking.resource_id],
            "start_time": booking.start_time.isoformat(),
            "end_time": booking.end_time.isoformat(),
            "attendees": booking.attendees,
            "purpose": booking.purpose,
            "status": booking.status,
            "approver_comment": booking.approver_comment,
            "created_at": booking.created_at.isoformat() if booking.created_at else None,
        }
        
        supabase.table("bookings").insert(booking_data).execute()
        print(f"  Migrated booking {booking.id}")
    
    print(f"  Total bookings migrated: {len(bookings)}")


def migrate_maintenance(db: Session, supabase, resource_id_map: dict):
    """Migrate maintenance records from SQLite to Supabase."""
    print("Migrating maintenance records...")
    
    maintenance_records = db.query(SQLiteMaintenance).all()
    
    for maint in maintenance_records:
        if maint.resource_id not in resource_id_map:
            print(f"  Skipping maintenance {maint.id}: missing resource")
            continue
        
        maint_data = {
            "resource_id": resource_id_map[maint.resource_id],
            "start_time": maint.start_time.isoformat(),
            "end_time": maint.end_time.isoformat(),
            "reason": maint.reason,
            "created_at": datetime.now().isoformat(),
        }
        
        supabase.table("maintenance").insert(maint_data).execute()
        print(f"  Migrated maintenance {maint.id}")
    
    print(f"  Total maintenance records migrated: {len(maintenance_records)}")


def migrate_audit_logs(db: Session, supabase, user_id_map: dict):
    """Migrate audit logs from SQLite to Supabase."""
    print("Migrating audit logs...")
    
    logs = db.query(SQLiteAuditLog).all()
    
    for log in logs:
        actor_id = user_id_map.get(log.actor_id) if log.actor_id else None
        
        log_data = {
            "actor_id": actor_id,
            "action": log.action,
            "entity": log.entity,
            "entity_id": str(log.entity_id) if log.entity_id else None,
            "details": log.details,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        }
        
        supabase.table("audit_logs").insert(log_data).execute()
        print(f"  Migrated audit log {log.id}")
    
    print(f"  Total audit logs migrated: {len(logs)}")


def migrate_chat_messages(db: Session, supabase, user_id_map: dict):
    """Migrate chat messages from SQLite to Supabase."""
    print("Migrating chat messages...")
    
    messages = db.query(SQLiteChatMessage).all()
    
    for msg in messages:
        if msg.user_id not in user_id_map:
            print(f"  Skipping chat message {msg.id}: missing user")
            continue
        
        msg_data = {
            "user_id": user_id_map[msg.user_id],
            "session_id": msg.session_id,
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
        }
        
        supabase.table("chat_messages").insert(msg_data).execute()
        print(f"  Migrated chat message {msg.id}")
    
    print(f"  Total chat messages migrated: {len(messages)}")


def setup_manager_relationships(supabase, user_id_map: dict):
    """Set up manager-employee relationships based on departments."""
    print("Setting up manager-employee relationships...")
    
    # Get all managers
    managers = supabase.table("users").select("*").eq("role", "manager").execute()
    
    for manager in managers.data:
        manager_dept_id = manager.get("department_id")
        if not manager_dept_id:
            continue
        
        # Find employees in the same department without a manager
        employees = supabase.table("users").select("*").eq("role", "employee").eq("department_id", manager_dept_id).is_("manager_id", "null").execute()
        
        for employee in employees.data:
            supabase.table("users").update({"manager_id": manager["id"]}).eq("id", employee["id"]).execute()
            print(f"  Assigned {employee['name']} to manager {manager['name']}")


def main():
    """Main migration function."""
    print("=" * 60)
    print("ERABS SQLite to Supabase Migration")
    print("=" * 60)
    
    # Check if Supabase is configured
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
        print("ERROR: Supabase is not configured.")
        print("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
        sys.exit(1)
    
    try:
        supabase = get_supabase_service()
        print("✓ Connected to Supabase")
    except Exception as e:
        print(f"ERROR: Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    # Connect to SQLite
    try:
        db = SessionLocal()
        print("✓ Connected to SQLite")
    except Exception as e:
        print(f"ERROR: Failed to connect to SQLite: {e}")
        sys.exit(1)
    
    try:
        # Run migrations in order
        dept_map = migrate_departments(supabase)
        user_id_map = migrate_users(db, supabase, dept_map)
        resource_id_map = migrate_resources(db, supabase, dept_map)
        migrate_bookings(db, supabase, user_id_map, resource_id_map)
        migrate_maintenance(db, supabase, resource_id_map)
        migrate_audit_logs(db, supabase, user_id_map)
        migrate_chat_messages(db, supabase, user_id_map)
        setup_manager_relationships(supabase, user_id_map)
        
        print("\n" + "=" * 60)
        print("✓ Migration completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nERROR: Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
