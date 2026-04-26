"""ERABS - Enterprise Resource Allocation & Booking System (FastAPI backend). v1.2"""
import os
import json
import random
import hashlib
import secrets
import bcrypt
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import (create_engine, Column, Integer, String, DateTime, Boolean,
                        ForeignKey, Text, func)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, Session
from pydantic import BaseModel
import jwt
from dotenv import load_dotenv

load_dotenv()

# Import database abstraction layer
from database import db as database

USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() == "true"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./erabs.db")
SECRET_KEY = os.getenv("SECRET_KEY", "erabs-dev-secret-change-me")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
ALGORITHM = "HS256"
TOKEN_EXP_MIN = 60 * 24

# Timezone configuration - IST (Indian Standard Time)
IST = timezone(timedelta(hours=5, minutes=30))

# Helper function to get current time in IST
def now_ist():
    """Get current datetime in IST timezone"""
    return datetime.now(IST)

# Import models from database
from database import User, Resource, Booking, Maintenance, AuditLog, ChatMessage, Base, engine, SessionLocal

oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class _Pwd:
    @staticmethod
    def hash(pw: str) -> str:
        salt = secrets.token_bytes(16)
        dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, 200_000)
        return f"pbkdf2$200000${salt.hex()}${dk.hex()}"

    @staticmethod
    def verify(pw: str, stored: str) -> bool:
        try:
            _, iters, salt_hex, hash_hex = stored.split("$")
            dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), bytes.fromhex(salt_hex), int(iters))
            return secrets.compare_digest(dk.hex(), hash_hex)
        except Exception:
            return False


pwd = _Pwd()


# ============ Models ============
# Models imported from database.py


# ============ Schemas ============
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    department: Optional[str] = None  # Make optional for Supabase compatibility
    department_id: Optional[str] = None  # Add department_id for Supabase

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: str = "employee"
    department: str = "General"


class UserRegisterWithDepartment(BaseModel):
    email: str
    name: str
    password: str
    role: str = "employee"
    department_id: Optional[str] = None
    manager_id: Optional[str] = None


class ResourceIn(BaseModel):
    name: str
    type: str
    description: str = ""
    location: str = ""
    capacity: int = 10
    department_restricted: Optional[str] = ""
    max_duration_min: int = 240
    active: bool = True
    image_url: str = ""
    scene_type: str = "normal"
    amenities: str = "wifi,display,sound,chairs"


class ResourceOut(ResourceIn):
    id: str

    class Config:
        from_attributes = True


class BookingIn(BaseModel):
    resource_id: str
    start_time: datetime
    end_time: datetime
    attendees: int = 1
    purpose: str = ""


class MaintenanceIn(BaseModel):
    resource_id: str
    start_time: datetime
    end_time: datetime
    reason: str = ""


class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None
    groq_api_key: Optional[str] = None  # Allow dynamic API key


class ApiKeyValidation(BaseModel):
    api_key: str


# ============ Helpers ============
def get_db():
    if USE_SUPABASE:
        # When using Supabase, we don't need SQLAlchemy sessions
        # Return None and endpoints should use database abstraction layer
        yield None
    else:
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()


def create_token(uid: int):
    exp = now_ist() + timedelta(minutes=TOKEN_EXP_MIN)
    return jwt.encode({"sub": str(uid), "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)


def current_user(token: str = Depends(oauth2)) -> Dict:
    err = HTTPException(401, "Invalid credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
    except (jwt.PyJWTError, TypeError, ValueError):
        raise err
    u = database.get_user_by_id(uid)
    if not u:
        raise err
    return u


def require_role(*roles):
    def dep(u: Dict = Depends(current_user)):
        user_role = u.role if hasattr(u, "role") else u.get("role")
        if user_role not in roles:
            raise HTTPException(403, f"Requires role: {roles}")
        return u
    return dep


def audit(db: Any, actor_id: str, action: str, entity: str, entity_id: str, details: str = ""):
    database.create_audit_log({
        "actor_id": str(actor_id),
        "action": action,
        "entity": entity,
        "entity_id": str(entity_id),
        "details": details,
        "timestamp": now_ist()
    })


def _naive(dt: datetime) -> datetime:
    """Convert to IST wall-clock time, then strip tz so comparisons work correctly.
    
    Supabase stores everything as UTC. We convert to IST (UTC+5:30) first so that
    avail-window checks (e.g. 08:00–20:00) compare against the correct local hour.
    """
    if dt.tzinfo is not None:
        # Convert to IST, then strip tz
        return dt.astimezone(IST).replace(tzinfo=None)
    # Already naive — assume it's already IST wall-clock (sent by frontend with +05:30)
    return dt


def current_bookable_minute() -> datetime:
    """Current IST wall-clock minute used by date/time inputs."""
    return _naive(now_ist()).replace(second=0, microsecond=0)


def serialize_booking(b: Dict) -> dict:
    return {
        "id": b.get("id"),
        "user_id": b.get("user_id"),
        "resource_id": b.get("resource_id"),
        "start_time": str(b.get("start_time")),
        "end_time": str(b.get("end_time")),
        "attendees": b.get("attendees"),
        "purpose": b.get("purpose"),
        "status": b.get("status"),
        "approver_comment": b.get("approver_comment"),
        "created_at": b.get("created_at"),
        "user_name": b.get("user_name"),
        "resource_name": b.get("resource_name"),
        "resource_image_url": b.get("resource_image_url"),
        "resource_scene_type": b.get("resource_scene_type"),
        "resource_type": b.get("resource_type"),
    }


def detect_conflict(resource_id: str, start: datetime, end: datetime,
                    attendees: int, exclude_id: Optional[str] = None) -> Optional[str]:
    res = database.get_resource_by_id(resource_id)
    if not res or not res.get("active"):
        return "Resource not available"
    
    # Add 5-minute buffer after each booking
    BUFFER_MINUTES = 5
    
    s = _naive(start)
    e = _naive(end)
    if s >= e:
        return "End time must be after start time"
    if s < current_bookable_minute():
        return "Cannot book dates or times in the past"
    
    avail_start = res.get("avail_start", 8)
    avail_end = res.get("avail_end", 20)
    
    if s.hour < avail_start:
        return f"Start before booking window ({avail_start}:00 – {avail_end}:00)"
    if e.hour > avail_end or (e.hour == avail_end and e.minute > 0):
        return f"End after booking window ({avail_start}:00 – {avail_end}:00)"
    
    dur = (e - s).total_seconds() / 60
    max_dur = res.get("max_duration_min", 240)
    if dur > max_dur:
        return f"Exceeds max duration ({max_dur} min)"
    
    # Check maintenance
    maints = database.get_maintenance()
    for m in maints:
        if str(m.get("resource_id")) == str(resource_id):
            m_start = _naive(m.get("start_time")) if isinstance(m.get("start_time"), datetime) else _naive(datetime.fromisoformat(m.get("start_time")))
            m_end = _naive(m.get("end_time")) if isinstance(m.get("end_time"), datetime) else _naive(datetime.fromisoformat(m.get("end_time")))
            # Add buffer to maintenance end time
            m_end_with_buffer = m_end + timedelta(minutes=BUFFER_MINUTES)
            if m_start < e and m_end_with_buffer > s:
                return f"Resource under maintenance: {m.get('reason')}"

    # Check bookings with proper overlap detection
    bks = database.get_bookings({"resource_id": resource_id})
    overlaps = []
    for bk in bks:
        if bk.get("status") not in (["pending", "approved"]):
            continue
        if exclude_id and str(bk.get("id")) == str(exclude_id):
            continue
        
        bk_start = bk.get("start_time")
        if not isinstance(bk_start, datetime):
            bk_start = datetime.fromisoformat(bk_start)
        bk_start = _naive(bk_start)  # Make timezone-naive for comparison
        
        bk_end = bk.get("end_time")
        if not isinstance(bk_end, datetime):
            bk_end = datetime.fromisoformat(bk_end)
        bk_end = _naive(bk_end)  # Make timezone-naive for comparison
        
        # Add 5-minute buffer after existing booking
        bk_end_with_buffer = bk_end + timedelta(minutes=BUFFER_MINUTES)
        
        # Check for ANY overlap (including buffer)
        # Booking overlaps if:
        # - New booking starts before existing ends (with buffer) AND
        # - New booking ends after existing starts
        if s < bk_end_with_buffer and e > bk_start:
            overlaps.append(bk)
    
    capacity = res.get("capacity", 1)
    if capacity > 1:
        used = sum(bk.get("attendees", 1) for bk in overlaps)
        if used + attendees > capacity:
            return f"Capacity exceeded ({used}/{capacity} used)"
    elif overlaps:
        # Show when the slot becomes available (after buffer)
        next_available = overlaps[0].get("end_time")
        if isinstance(next_available, str):
            next_available = datetime.fromisoformat(next_available)
        next_available = _naive(next_available) + timedelta(minutes=BUFFER_MINUTES)
        return f"Time slot already booked (available from {next_available.strftime('%I:%M %p')})"
    
    return None


# ============ Seed data ============
SEED_RESOURCES = [
    dict(name="Aurora Boardroom", type="room", capacity=12, location="Floor 4",
         description="Executive boardroom with panoramic 4K display, immersive audio and conference-grade lighting.",
         requires_approval=True, scene_type="large",
         amenities="wifi,display,sound,projector,chairs",
         image_url="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80"),
    dict(name="Titan Conference Hall", type="room", capacity=20, location="Floor 5",
         description="Large-capacity hall for company-wide town-halls, client pitches and training sessions.",
         requires_approval=True, scene_type="large",
         amenities="wifi,display,sound,projector,chairs,parking",
         image_url="https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1200&q=80"),
    dict(name="Quantum Lab", type="room", capacity=8, location="Floor 3",
         description="Innovation lab with writable walls, standing desks and dev monitors.",
         requires_approval=True, scene_type="medium",
         amenities="wifi,display,sound,chairs",
         image_url="https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80"),
    dict(name="Orbit Huddle Space", type="room", capacity=6, location="Floor 2",
         description="Cozy huddle room for brainstorming, sprint planning and design reviews.",
         requires_approval=False, scene_type="medium",
         amenities="wifi,display,chairs",
         image_url="https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80"),
    dict(name="Nova Meeting Room", type="room", capacity=8, location="Floor 2",
         description="Standard meeting room with a circular conference table and modern AV setup.",
         requires_approval=False, scene_type="normal",
         amenities="wifi,display,sound,chairs",
         image_url="https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&q=80"),
    dict(name="Helix Collaboration Room", type="room", capacity=8, location="Floor 3",
         description="Collaborative meeting space with glass walls and ergonomic seating for 8.",
         requires_approval=False, scene_type="normal",
         amenities="wifi,display,sound,chairs",
         image_url="https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80"),
    dict(name="Nebula Focus Pod", type="room", capacity=2, location="Floor 2",
         description="Soundproof 1-on-1 collaboration pod with integrated display and acoustic panels.",
         requires_approval=False, scene_type="cabin",
         amenities="wifi,display,chairs",
         image_url="https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80"),
    dict(name="Zenith Focus Cabin", type="room", capacity=2, location="Floor 4",
         description="Premium focus cabin for deep-work, interviews or 1:1 mentorship sessions.",
         requires_approval=False, scene_type="cabin",
         amenities="wifi,display,chairs",
         image_url="https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80"),
    dict(name="Executive Cabin — Summit", type="room", capacity=4, location="Floor 6",
         description="Private executive cabin with plush seating and floor-to-ceiling windows.",
         requires_approval=True, scene_type="manager",
         amenities="wifi,display,sound,chairs,parking",
         image_url="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80"),
    dict(name="Galaxy War Room", type="room", capacity=6, location="Floor 6",
         description="Executive strategy cabin with private workstations and presentation screens.",
         requires_approval=True, scene_type="manager",
         amenities="wifi,display,sound,projector,chairs",
         image_url="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80"),
    dict(name="Chess Lounge", type="recreation", capacity=4, location="Floor 1 · Recreation Wing",
         description="Quiet chess lounge with two premium chess boards, analog clocks and leather armchairs. Open to everyone — no approval needed.",
         requires_approval=False, scene_type="chess",
         amenities="wifi,chairs",
         image_url="https://images.unsplash.com/photo-1560174038-594a18c76bc1?w=1200&q=80"),
    dict(name="Foosball Arena", type="recreation", capacity=4, location="Floor 1 · Recreation Wing",
         description="Championship-grade foosball table with LED scoreboard. Great for quick breaks and team bonding.",
         requires_approval=False, scene_type="foosball",
         amenities="wifi,sound",
         image_url="https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=1200&q=80"),
]


def _seed_past_bookings(db: Session):
    """Create realistic booking history across users for analytics & My Bookings."""
    users = {u.email: u for u in db.query(User).all()}
    resources = db.query(Resource).filter(Resource.active == True).all()
    if not users or not resources:
        return

    rand = random.Random(42)
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    # Past 30 days: create ~90 bookings distributed across users & rooms
    statuses_past = ["approved", "approved", "approved", "cancelled", "completed"]
    for _ in range(90):
        day_offset = rand.randint(1, 30)
        hour = rand.choice([8, 9, 10, 11, 13, 14, 15, 16, 17, 18])
        dur_h = rand.choice([1, 1, 1, 2, 2, 3])
        user = rand.choice(list(users.values()))
        res = rand.choice(resources)
        if dur_h * 60 > res.max_duration_min:
            dur_h = max(1, res.max_duration_min // 60)
        start = now - timedelta(days=day_offset, hours=(now.hour - hour))
        end = start + timedelta(hours=dur_h)
        att = min(res.capacity, rand.randint(1, max(1, res.capacity)))
        status = rand.choice(statuses_past)
        db.add(Booking(
            user_id=user.id, resource_id=res.id,
            start_time=start, end_time=end,
            attendees=att,
            purpose=rand.choice([
                "Sprint planning", "Client sync", "Design review", "1:1 meeting",
                "Team standup", "Hackathon", "Retro", "Chess tournament",
                "Foosball match", "Workshop", "Interview",
            ]),
            status=status,
            created_at=start - timedelta(days=rand.randint(0, 3)),
        ))

    # A handful of PENDING approvals for managers/admins to action
    for i in range(8):
        user = rand.choice(list(users.values()))
        res = rand.choice([r for r in resources if r.requires_approval])
        day_offset = rand.randint(1, 14)
        hour = rand.choice([9, 10, 11, 14, 15, 16])
        start = now + timedelta(days=day_offset, hours=(hour - now.hour))
        end = start + timedelta(hours=rand.choice([1, 2]))
        db.add(Booking(
            user_id=user.id, resource_id=res.id,
            start_time=start, end_time=end,
            attendees=min(res.capacity, rand.randint(2, 6)),
            purpose=rand.choice([
                "Quarterly review", "Customer onboarding", "Board presentation",
                "Training session", "Strategy offsite",
            ]),
            status="pending",
        ))

    # A few UPCOMING approved bookings
    for _ in range(12):
        user = rand.choice(list(users.values()))
        res = rand.choice(resources)
        day_offset = rand.randint(0, 7)
        hour = rand.choice([9, 10, 11, 14, 15, 16])
        start = now + timedelta(days=day_offset, hours=(hour - now.hour))
        end = start + timedelta(hours=1)
        db.add(Booking(
            user_id=user.id, resource_id=res.id,
            start_time=start, end_time=end,
            attendees=min(res.capacity, rand.randint(1, res.capacity)),
            purpose=rand.choice(["Team sync", "Demo", "Review", "Chess match", "Focus block"]),
            status="approved",
        ))


# ============ Lifespan ============
@asynccontextmanager
async def lifespan(app: FastAPI):
    if not USE_SUPABASE:
        Base.metadata.create_all(engine)
        db = SessionLocal()
        if db.query(User).count() == 0:
            db.add_all([
                User(email="admin@erabs.io", name="Ada Admin", role="admin",
                     department="IT", hashed_password=pwd.hash("admin123")),
                User(email="manager@erabs.io", name="Max Manager", role="manager",
                     department="Engineering", hashed_password=pwd.hash("manager123")),
                User(email="employee@erabs.io", name="Eve Employee", role="employee",
                     department="Engineering", hashed_password=pwd.hash("employee123")),
            ])
            db.commit()
        if db.query(Resource).count() == 0:
            for r in SEED_RESOURCES:
                db.add(Resource(**r))
            db.commit()
        if db.query(Booking).count() == 0:
            _seed_past_bookings(db)
            db.commit()
        db.close()
    yield


app = FastAPI(title="ERABS API", version="1.2.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])


# ============ Auth ============
@app.post("/api/auth/register", response_model=UserOut)
def register(u: UserCreate):
    if database.get_user_by_email(u.email):
        raise HTTPException(400, "Email already registered")
    
    user_data = {
        "email": u.email,
        "name": u.name,
        "role": u.role,
        "department": u.department,
        "hashed_password": bcrypt.hashpw(u.password.encode('utf-8'), bcrypt.gensalt()).decode()
    }
    user = database.create_user(user_data)
    return user


@app.post("/api/auth/register-with-department")
def register_with_department(u: UserRegisterWithDepartment):
    """Register a new user with department and manager assignment (for Supabase)."""
    # Check if email already exists
    existing_user = database.get_user_by_email(u.email)
    if existing_user:
        raise HTTPException(400, "Email already registered")
    
    # If department_id is provided, validate it exists
    if u.department_id:
        if database.use_supabase:
            from supabase_client import get_supabase_service
            supabase = get_supabase_service()
            dept_check = supabase.table("departments").select("*").eq("id", u.department_id).execute()
            if not dept_check.data:
                raise HTTPException(400, "Invalid department")
        # For SQLite, we just store the department name
    
    # If role is employee and no manager_id provided, auto-assign based on department
    manager_id = u.manager_id
    if u.role == "employee" and not manager_id and u.department_id and database.use_supabase:
        from supabase_client import get_supabase_service
        supabase = get_supabase_service()
        # Find a manager in the same department
        manager_result = supabase.table("users").select("*").eq("role", "manager").eq("department_id", u.department_id).execute()
        if manager_result.data:
            manager_id = manager_result.data[0]["id"]
    
    user_data = {
        "email": u.email,
        "name": u.name,
        "hashed_password": bcrypt.hashpw(u.password.encode('utf-8'), bcrypt.gensalt()).decode(),
        "role": u.role,
        "is_active": True,
    }
    
    if database.use_supabase:
        user_data["department_id"] = u.department_id
        if manager_id:
            user_data["manager_id"] = manager_id
    else:
        # For SQLite, use department name
        dept_name = "General"
        if u.department_id:
            # Try to get department name from ID
            depts = database.get_departments()
            for dept in depts:
                if str(dept.get("id")) == str(u.department_id):
                    dept_name = dept["name"]
                    break
        user_data["department"] = dept_name
    
    created_user = database.create_user(user_data)
    
    return {
        "id": created_user["id"],
        "email": created_user["email"],
        "name": created_user["name"],
        "role": created_user["role"],
        "department": created_user.get("department") or created_user.get("department_id"),
        "manager_id": manager_id,
    }


@app.get("/api/departments")
def get_departments():
    """Get all departments."""
    return database.get_departments()


@app.get("/api/managers")
def get_managers(department_id: Optional[str] = None):
    """Get all managers, optionally filtered by department."""
    if database.use_supabase:
        from supabase_client import get_supabase_service
        supabase = get_supabase_service()
        query = supabase.table("users").select("*").eq("role", "manager")
        if department_id:
            query = query.eq("department_id", department_id)
        result = query.execute()
        
        # Include department name in response
        managers = []
        for manager in result.data:
            dept_name = None
            if manager.get("department_id"):
                dept_result = supabase.table("departments").select("name").eq("id", manager["department_id"]).execute()
                if dept_result.data:
                    dept_name = dept_result.data[0]["name"]
            
            managers.append({
                "id": manager["id"],
                "email": manager["email"],
                "name": manager["name"],
                "role": manager["role"],
                "department_id": manager.get("department_id"),
                "department": dept_name,
            })
        return managers
    else:
        # For SQLite, return all users with manager role
        users = database.get_all_users()
        managers = [u for u in users if u["role"] == "manager"]
        return managers


@app.post("/api/auth/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = database.get_user_by_email(form.username)
    if not user:
        raise HTTPException(401, "Invalid email or password")
    
    # Verify password using bcrypt directly
    hashed_password = user.get("hashed_password", "")
    if not bcrypt.checkpw(form.password.encode('utf-8'), hashed_password.encode('utf-8')):
        raise HTTPException(401, "Invalid email or password")
    
    return {
        "access_token": create_token(user.get("id")),
        "token_type": "bearer",
        "user": {"id": user.get("id"), "email": user.get("email"), "name": user.get("name"),
                 "role": user.get("role"), "department": user.get("department") or user.get("department_id")},
    }


@app.get("/api/auth/me", response_model=UserOut)
def me(u: User = Depends(current_user)):
    # If using Supabase and user has department_id, fetch department name
    if USE_SUPABASE and u.get("department_id") and not u.get("department"):
        try:
            from supabase_client import get_supabase_service
            supabase = get_supabase_service()
            dept_result = supabase.table("departments").select("name").eq("id", u["department_id"]).execute()
            if dept_result.data:
                u["department"] = dept_result.data[0]["name"]
        except Exception:
            pass  # If department lookup fails, continue without it
    
    return u


# ============ Resources ============
@app.get("/api/resources", response_model=List[ResourceOut])
def list_resources(
    type: Optional[str] = Query(None),
    scene_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    filters = {"active": True}
    if type:
        filters["type"] = type
    if scene_type:
        filters["scene_type"] = scene_type
    if search:
        filters["search"] = search
    resources = database.get_resources(filters)
    return resources


@app.get("/api/resources/{rid}", response_model=ResourceOut)
def get_resource(rid: str):
    r = database.get_resource_by_id(rid)
    if not r:
        raise HTTPException(404, "Resource not found")
    return r


@app.post("/api/resources", response_model=ResourceOut)
def create_resource(r: ResourceIn, u: Dict = Depends(require_role("admin"))):
    res = database.create_resource(r.model_dump())
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")
    audit(None, u_id, "create", "resource", res.get("id"), r.name)
    return res


@app.put("/api/resources/{rid}", response_model=ResourceOut)
def update_resource(rid: str, r: ResourceIn, u: Dict = Depends(require_role("admin"))):
    res = database.update_resource(rid, r.model_dump())
    if not res:
        raise HTTPException(404, "Not found")
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")
    audit(None, u_id, "update", "resource", rid, r.name)
    return res


@app.delete("/api/resources/{rid}")
def delete_resource(rid: str, u: Dict = Depends(require_role("admin"))):
    ok = database.delete_resource(rid)
    if not ok:
        raise HTTPException(404, "Not found")
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")
    audit(None, u_id, "deactivate", "resource", rid)
    return {"ok": True}


# ============ Bookings ============
@app.post("/api/bookings/validate")
def validate_booking(b: BookingIn, u: Dict = Depends(current_user)):
    err = detect_conflict(b.resource_id, b.start_time, b.end_time, b.attendees)
    return {"ok": err is None, "reason": err}


@app.post("/api/bookings")
def create_booking(b: BookingIn, u: Dict = Depends(current_user)):
    # Validate booking is not in the past
    current_time = current_bookable_minute()
    booking_start = _naive(b.start_time)
    
    if booking_start < current_time:
        raise HTTPException(400, "Cannot create bookings in the past")
    
    # Validate start time is before end time
    if _naive(b.start_time) >= _naive(b.end_time):
        raise HTTPException(400, "Start time must be before end time")
    
    err = detect_conflict(b.resource_id, b.start_time, b.end_time, b.attendees)
    if err:
        raise HTTPException(400, err)
    
    res = database.get_resource_by_id(b.resource_id)
    if not res:
        raise HTTPException(404, "Resource not found")
        
    status_val = "pending" if res.get("requires_approval") else "approved"
    
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")

    # Store as IST-aware datetimes so Supabase converts to UTC correctly.
    # Do NOT strip tz here — _naive() is only for comparisons, not storage.
    def _to_ist(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=IST)
        return dt.astimezone(IST)

    bk_data = {
        "user_id": u_id,
        "resource_id": b.resource_id,
        "start_time": _to_ist(b.start_time),
        "end_time": _to_ist(b.end_time),
        "attendees": b.attendees,
        "purpose": b.purpose,
        "status": status_val,
        "created_at": now_ist()
    }
    
    bk = database.create_booking(bk_data)
    audit(None, u_id, "create", "booking", bk.get("id"), f"{res.get('name')} {b.start_time}")
    return serialize_booking(bk)


@app.get("/api/bookings")
def list_bookings(scope: str = "mine", u: Dict = Depends(current_user)):
    u_role = u.get("role") if isinstance(u, dict) else getattr(u, "role")
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")
    
    filters = {}
    if scope == "mine":
        filters["user_id"] = u_id
    elif scope == "pending":
        if u_role not in ("manager", "admin"):
            raise HTTPException(403, "Forbidden")
        filters["status"] = "pending"
    elif scope == "all":
        if u_role != "admin":
            raise HTTPException(403, "Forbidden")
    
    bks = database.get_bookings(filters)
    return [serialize_booking(b) for b in bks]


@app.get("/api/bookings/resource/{rid}")
def list_resource_bookings(rid: str, u: Dict = Depends(current_user)):
    now = now_ist()
    bks = database.get_bookings({"resource_id": rid})
    
    # Filter for future active bookings manually (could be optimized in DB)
    upcoming = []
    for b in bks:
        if b.get("status") in (["pending", "approved"]):
            b_end = b.get("end_time")
            if not isinstance(b_end, datetime):
                b_end = datetime.fromisoformat(b_end)
            # Make both timezone-aware for comparison
            if b_end.tzinfo is None:
                b_end = b_end.replace(tzinfo=timezone.utc)
            if b_end >= now:
                upcoming.append(serialize_booking(b))
    
    return sorted(upcoming, key=lambda x: x["start_time"])


@app.post("/api/bookings/{bid}/approve")
def approve(bid: str, comment: str = "", u: Dict = Depends(require_role("manager", "admin"))):
    bk = database.get_booking_by_id(bid)
    if not bk:
        raise HTTPException(404, "Not found")
    if bk.get("status") != "pending":
        raise HTTPException(400, "Not pending")
    
    updated = database.update_booking(bid, {"status": "approved", "approver_comment": comment})
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")
    audit(None, u_id, "approve", "booking", bid, comment)
    return serialize_booking(updated)


@app.post("/api/bookings/{bid}/reject")
def reject(bid: str, comment: str = "", u: Dict = Depends(require_role("manager", "admin"))):
    bk = database.get_booking_by_id(bid)
    if not bk:
        raise HTTPException(404, "Not found")
    if bk.get("status") != "pending":
        raise HTTPException(400, "Not pending")
    
    updated = database.update_booking(bid, {"status": "rejected", "approver_comment": comment})
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")
    audit(None, u_id, "reject", "booking", bid, comment)
    return serialize_booking(updated)


@app.post("/api/bookings/{bid}/cancel")
def cancel(bid: str, u: Dict = Depends(current_user)):
    bk = database.get_booking_by_id(bid)
    if not bk:
        raise HTTPException(404, "Not found")
    
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")
    u_role = u.get("role") if isinstance(u, dict) else getattr(u, "role")
    
    if str(bk.get("user_id")) != str(u_id) and u_role not in ("admin", "manager"):
        raise HTTPException(403, "Forbidden")
        
    status = bk.get("status")
    if status in ("cancelled", "rejected", "completed"):
        raise HTTPException(400, f"Cannot cancel ({status})")
        
    updated = database.update_booking(bid, {"status": "cancelled"})
    audit(None, u_id, "cancel", "booking", bid)
    return serialize_booking(updated)


# ============ Maintenance ============
@app.get("/api/maintenance")
def list_maint(u: Dict = Depends(current_user)):
    return database.get_maintenance()


@app.post("/api/maintenance")
def create_maint(m: MaintenanceIn, u: Dict = Depends(require_role("admin"))):
    mb_data = m.model_dump()
    mb = database.create_maintenance(mb_data)
    
    # Auto-cancel overlaps
    bks = database.get_bookings({"resource_id": m.resource_id, "status": "approved"})
    cancelled_count = 0
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")
    
    for b in bks:
        b_start = b.get("start_time")
        if not isinstance(b_start, datetime): b_start = datetime.fromisoformat(b_start)
        b_end = b.get("end_time")
        if not isinstance(b_end, datetime): b_end = datetime.fromisoformat(b_end)
        
        if b_start < m.end_time and b_end > m.start_time:
            database.update_booking(b.get("id"), {
                "status": "cancelled", 
                "approver_comment": f"Auto-cancelled: maintenance ({m.reason})"
            })
            audit(None, u_id, "auto-cancel", "booking", b.get("id"), "maintenance overlap")
            cancelled_count += 1
            
    audit(None, u_id, "create", "maintenance", mb.get("id"), m.reason)
    return {"id": mb.get("id"), "cancelled": cancelled_count}


@app.delete("/api/maintenance/{mid}")
def del_maint(mid: str, u: Dict = Depends(require_role("admin"))):
    ok = database.delete_maintenance(mid)
    if not ok:
        raise HTTPException(404, "Not found")
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")
    audit(None, u_id, "delete", "maintenance", mid)
    return {"ok": True}


# ============ Analytics ============
@app.get("/api/analytics/summary")
def summary(u: Dict = Depends(current_user)):
    total = database.count_bookings()
    pending = database.count_bookings({"status": "pending"})
    active_res = database.count_resources({"active": True})
    
    now = now_ist()
    # Simple counting for upcoming
    all_bks = database.get_bookings({"status": "approved"})
    upcoming = 0
    for b in all_bks:
        b_start = b.get("start_time")
        if not isinstance(b_start, datetime):
            b_start = datetime.fromisoformat(b_start)
        # Make both timezone-aware for comparison
        if b_start.tzinfo is None:
            b_start = b_start.replace(tzinfo=timezone.utc)
        if b_start >= now:
            upcoming += 1
            
    by_dept = {}
    for b in database.get_bookings():
        if b.get("status") in (["approved", "pending"]):
            # In Supabase mode, we might need a join to get department name if it's not and-flattened
            # For now, handle what's available
            dep = b.get("department") or b.get("user_department") or "Unknown"
            by_dept[dep] = by_dept.get(dep, 0) + 1
            
    by_type = {}
    all_res = database.get_resources()
    for r in all_res:
        cnt = len([bk for bk in database.get_bookings({"resource_id": r.get("id"), "status": "approved"})])
        by_type[r.get("type")] = by_type.get(r.get("type"), 0) + cnt
        
    trend = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        cnt = 0
        for b in all_bks:
            b_start = b.get("start_time")
            if not isinstance(b_start, datetime):
                b_start = datetime.fromisoformat(b_start)
            # Make timezone-aware for comparison
            if b_start.tzinfo is None:
                b_start = b_start.replace(tzinfo=timezone.utc)
            if b_start >= day_start and b_start < day_end:
                cnt += 1
        trend.append({"date": day_start.strftime("%a"), "count": cnt})
        
    return {
        "total_bookings": total,
        "pending_approvals": pending,
        "active_resources": active_res,
        "upcoming": upcoming,
        "conflicts_detected": 0,
        "by_department": [{"name": k, "value": v} for k, v in by_dept.items()],
        "by_type": [{"name": k, "value": v} for k, v in by_type.items()],
        "trend": trend,
    }


@app.get("/api/analytics/utilization")
def utilization(
    u: Dict = Depends(current_user),
    scope: str = Query("mine", regex="^(mine|all)$"),
    days: int = Query(30, ge=1, le=180),
):
    """Rich utilization analytics (Supabase-compatible).
    - `mine`: stats for the current user's own bookings (always available).
    - `all` : org-wide stats (manager / admin only).
    Returns: peak hours, heatmap, idle resources, cost of unused assets.
    """
    u_role = u.get("role") if isinstance(u, dict) else getattr(u, "role")
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")

    if scope == "all" and u_role not in ("manager", "admin"):
        raise HTTPException(403, "Forbidden")

    # Fetch bookings via abstraction layer
    filters = {"status_in": ["approved", "completed", "pending"]}
    if scope == "mine":
        filters["user_id"] = u_id

    all_bks = database.get_bookings(filters if scope == "mine" else {"status_in": ["approved", "completed", "pending"]})
    if scope == "mine":
        all_bks = [b for b in all_bks if str(b.get("user_id")) == str(u_id)]

    since = datetime.utcnow() - timedelta(days=days)
    bookings_list = []
    for b in all_bks:
        b_start = b.get("start_time")
        if b_start is None:
            continue
        if not isinstance(b_start, datetime):
            try:
                b_start = datetime.fromisoformat(str(b_start).replace("Z", "+00:00"))
            except Exception:
                continue
        if _naive(b_start) >= _naive(since):
            b["_start_dt"] = b_start
            bookings_list.append(b)

    # Peak hours (8..20)
    hours = {h: 0 for h in range(8, 21)}
    for b in bookings_list:
        h = _naive(b["_start_dt"]).hour
        if h in hours:
            hours[h] += 1
    peak_hours = [{"hour": f"{h:02d}:00", "count": v} for h, v in hours.items()]
    top_hour = max(peak_hours, key=lambda x: x["count"]) if peak_hours else None

    # Heatmap (weekday × hour)
    heat = [[0] * 13 for _ in range(7)]  # 8..20 = 13 slots
    for b in bookings_list:
        s = _naive(b["_start_dt"])
        hi = s.hour - 8
        if 0 <= hi < 13:
            heat[s.weekday()][hi] += 1

    # Day of week
    dow_map = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    dow = {d: 0 for d in dow_map}
    for b in bookings_list:
        dow[dow_map[_naive(b["_start_dt"]).weekday()]] += 1
    by_dow = [{"day": d, "count": dow[d]} for d in dow_map]

    # Per-resource utilization
    resources_list = database.get_resources()
    window_hours = max(1, days * 12)  # 12 bookable hrs/day
    per_res = []
    for r in resources_list:
        r_id = str(r.get("id"))
        rb = [b for b in bookings_list if str(b.get("resource_id")) == r_id]
        hours_used = 0.0
        for b in rb:
            b_start = b["_start_dt"]
            b_end = b.get("end_time")
            if b_end is None:
                continue
            if not isinstance(b_end, datetime):
                try:
                    b_end = datetime.fromisoformat(str(b_end).replace("Z", "+00:00"))
                except Exception:
                    continue
            hours_used += max(0.0, (_naive(b_end) - _naive(b_start)).total_seconds() / 3600.0)
        util_pct = round(min(100.0, (hours_used / window_hours) * 100.0), 1)
        idle_hours = round(max(0.0, window_hours - hours_used), 1)
        per_res.append({
            "id": r.get("id"),
            "name": r.get("name"),
            "type": r.get("type"),
            "scene_type": r.get("scene_type"),
            "bookings": len(rb),
            "hours_used": round(hours_used, 1),
            "utilization_pct": util_pct,
            "idle_hours": idle_hours,
        })

    idle_resources = [r for r in per_res if r["utilization_pct"] < 15]

    return {
        "scope": scope,
        "days": days,
        "total_bookings": len(bookings_list),
        "total_hours_used": round(sum(r["hours_used"] for r in per_res), 1),
        "peak_hour": top_hour,
        "peak_hours": peak_hours,
        "by_day_of_week": by_dow,
        "heatmap": heat,
        "per_resource": sorted(per_res, key=lambda x: -x["utilization_pct"]),
        "idle_resources": sorted(idle_resources, key=lambda x: -x["idle_hours"])[:10],
    }



@app.get("/api/analytics/availability")
def availability(
    start: datetime = Query(...),
    end: datetime = Query(...),
    attendees: int = Query(1, ge=1),
    u: Dict = Depends(current_user),
):
    """Return resources that are available for a given slot."""
    results = []
    for r in database.get_resources({"active": True}):
        if r.get("capacity", 0) < attendees:
            continue
        err = detect_conflict(r.get("id"), start, end, attendees)
        if not err:
            results.append({
                "id": r.get("id"), "name": r.get("name"), "type": r.get("type"),
                "scene_type": r.get("scene_type"), "capacity": r.get("capacity"),
                "location": r.get("location"),
                "requires_approval": r.get("requires_approval"),
            })
    return {"slot": {"start": start, "end": end, "attendees": attendees},
            "available": results, "count": len(results)}


@app.get("/api/audit")
def audit_logs(u: Dict = Depends(require_role("admin"))):
    return database.get_audit_logs(200)


# ============ AI Function Execution ============
async def execute_ai_function(function_name: str, function_args: dict, user_id: str, user_role: str, user: Dict) -> dict:
    """Execute AI function calls and return results."""
    try:
        if function_name == "search_resources":
            # Search for resources by name, type, or other criteria
            search_term = function_args.get("search", "").lower()
            resource_type = function_args.get("type")
            
            filters = {"active": True}
            if resource_type:
                filters["type"] = resource_type
            
            resources = database.get_resources(filters)
            
            # Filter by search term if provided
            if search_term:
                resources = [
                    r for r in resources
                    if search_term in r.get("name", "").lower() 
                    or search_term in r.get("description", "").lower()
                    or search_term in r.get("type", "").lower()
                ]
            
            return {
                "success": True,
                "resources": [
                    {
                        "id": r.get("id"),
                        "name": r.get("name"),
                        "type": r.get("type"),
                        "capacity": r.get("capacity"),
                        "location": r.get("location"),
                        "requires_approval": r.get("requires_approval"),
                        "amenities": r.get("amenities")
                    }
                    for r in resources[:10]
                ]
            }
        
        elif function_name == "get_resource_details":
            # Get detailed information about a specific resource
            resource_id = function_args.get("resource_id")
            
            res = database.get_resource_by_id(resource_id)
            if not res:
                return {"success": False, "error": "Resource not found"}
            
            return {
                "success": True,
                "resource": {
                    "id": res.get("id"),
                    "name": res.get("name"),
                    "type": res.get("type"),
                    "description": res.get("description"),
                    "capacity": res.get("capacity"),
                    "location": res.get("location"),
                    "requires_approval": res.get("requires_approval"),
                    "amenities": res.get("amenities"),
                    "avail_start": res.get("avail_start"),
                    "avail_end": res.get("avail_end"),
                    "max_duration_min": res.get("max_duration_min")
                }
            }
        
        elif function_name == "create_booking":
            # Validate and create booking
            resource_id = function_args.get("resource_id")
            start_time = datetime.fromisoformat(function_args.get("start_time"))
            end_time = datetime.fromisoformat(function_args.get("end_time"))
            attendees = function_args.get("attendees")
            purpose = function_args.get("purpose", "")
            
            # Validate booking is not in the past
            current_time = current_bookable_minute()
            booking_start = _naive(start_time)
            
            if booking_start < current_time:
                return {"success": False, "error": "Cannot create bookings in the past"}
            
            # Validate start time is before end time
            if _naive(start_time) >= _naive(end_time):
                return {"success": False, "error": "Start time must be before end time"}
            
            # Check for conflicts
            conflict = detect_conflict(resource_id, start_time, end_time, attendees)
            if conflict:
                return {"success": False, "error": conflict}
            
            # Create booking — store as IST-aware so Supabase converts to UTC correctly
            def _to_ist(dt):
                if dt.tzinfo is None:
                    return dt.replace(tzinfo=IST)
                return dt.astimezone(IST)

            res = database.get_resource_by_id(resource_id)
            status_val = "pending" if res.get("requires_approval") else "approved"
            
            bk_data = {
                "user_id": user_id,
                "resource_id": resource_id,
                "start_time": _to_ist(start_time),
                "end_time": _to_ist(end_time),
                "attendees": attendees,
                "purpose": purpose,
                "status": status_val,
                "created_at": now_ist()
            }
            
            bk = database.create_booking(bk_data)
            audit(None, user_id, "create", "booking", bk.get("id"), f"AI: {res.get('name')} {start_time}")
            
            return {
                "success": True,
                "booking_id": bk.get("id"),
                "status": status_val,
                "resource_name": res.get("name"),
                "requires_approval": res.get("requires_approval")
            }
        
        elif function_name == "check_availability":
            resource_id = function_args.get("resource_id")
            start_time_str = function_args.get("start_time")
            end_time_str = function_args.get("end_time")
            attendees = function_args.get("attendees", 1)
            
            # Parse times
            start_time = datetime.fromisoformat(start_time_str)
            end_time = datetime.fromisoformat(end_time_str)
            
            # Check if requested slot is available
            conflict = detect_conflict(resource_id, start_time, end_time, attendees)
            
            # Get resource details
            res = database.get_resource_by_id(resource_id)
            if not res:
                return {"success": False, "error": "Resource not found"}
            
            result = {
                "success": True,
                "available": conflict is None,
                "reason": conflict if conflict else "Available",
                "requested_start": start_time_str,
                "requested_end": end_time_str,
                "resource_name": res.get("name"),
                "resource_hours": f"{res.get('avail_start', 8)}:00 - {res.get('avail_end', 20)}:00"
            }
            
            # If not available, suggest alternative time slots
            if conflict:
                # Find available slots on the same day
                date = start_time.date()
                duration_minutes = int((end_time - start_time).total_seconds() / 60)
                
                available_slots = []
                avail_start = res.get("avail_start", 8)
                avail_end = res.get("avail_end", 20)
                
                # Check slots every 30 minutes
                for hour in range(avail_start, avail_end):
                    for minute in [0, 30]:
                        slot_start = datetime.combine(date, datetime.min.time()).replace(
                            hour=hour, minute=minute, tzinfo=None
                        )
                        slot_end = slot_start + timedelta(minutes=duration_minutes)
                        
                        # Skip if slot ends after business hours
                        if slot_end.hour > avail_end or (slot_end.hour == avail_end and slot_end.minute > 0):
                            continue
                        
                        # Check if this slot is available
                        slot_conflict = detect_conflict(resource_id, slot_start, slot_end, attendees)
                        if not slot_conflict:
                            available_slots.append({
                                "start": slot_start.strftime("%Y-%m-%d %H:%M"),
                                "end": slot_end.strftime("%Y-%m-%d %H:%M"),
                                "start_time": slot_start.strftime("%I:%M %p"),
                                "end_time": slot_end.strftime("%I:%M %p")
                            })
                        
                        # Limit to 5 suggestions
                        if len(available_slots) >= 5:
                            break
                    if len(available_slots) >= 5:
                        break
                
                result["alternative_slots"] = available_slots
            
            return result
        
        elif function_name == "get_available_slots":
            # Get all available time slots for a resource on a specific date
            resource_id = function_args.get("resource_id")
            date_str = function_args.get("date")  # Format: "2026-04-24"
            duration_minutes = function_args.get("duration_minutes", 60)
            attendees = function_args.get("attendees", 1)
            
            # Optional: time range filtering
            start_time_str = function_args.get("start_time")  # Format: "12:00" or "14:00"
            end_time_str = function_args.get("end_time")  # Format: "15:00" or "17:00"
            
            # Parse date
            date = datetime.fromisoformat(date_str).date()
            
            # Get resource details
            res = database.get_resource_by_id(resource_id)
            if not res:
                return {"success": False, "error": "Resource not found"}
            
            # Resource business hours
            resource_start = res.get("avail_start", 8)
            resource_end = res.get("avail_end", 20)
            
            # Determine search range
            if start_time_str and end_time_str:
                # User specified time range
                search_start_hour, search_start_minute = map(int, start_time_str.split(":"))
                search_end_hour, search_end_minute = map(int, end_time_str.split(":"))
                
                # Ensure search range is within business hours
                search_start_hour = max(search_start_hour, resource_start)
                search_end_hour = min(search_end_hour, resource_end)
            else:
                # Use full business hours
                search_start_hour = resource_start
                search_start_minute = 0
                search_end_hour = resource_end
                search_end_minute = 0
            
            available_slots = []
            
            # Generate slots every 30 minutes within the search range
            current_hour = search_start_hour
            current_minute = search_start_minute
            
            while True:
                # Create slot start time
                slot_start = datetime.combine(date, datetime.min.time()).replace(
                    hour=current_hour, minute=current_minute, tzinfo=None
                )
                slot_end = slot_start + timedelta(minutes=duration_minutes)
                
                # Check if slot end exceeds search range
                if end_time_str:
                    search_end_time = datetime.combine(date, datetime.min.time()).replace(
                        hour=search_end_hour, minute=search_end_minute, tzinfo=None
                    )
                    if slot_end > search_end_time:
                        break
                
                # Check if slot end exceeds business hours
                if slot_end.hour > resource_end or (slot_end.hour == resource_end and slot_end.minute > 0):
                    break
                
                # Check if this slot is available (no conflicts)
                conflict = detect_conflict(resource_id, slot_start, slot_end, attendees)
                if not conflict:
                    available_slots.append({
                        "start": slot_start.strftime("%Y-%m-%d %H:%M"),
                        "end": slot_end.strftime("%Y-%m-%d %H:%M"),
                        "start_time": slot_start.strftime("%I:%M %p"),
                        "end_time": slot_end.strftime("%I:%M %p")
                    })
                
                # Move to next 30-minute slot
                current_minute += 30
                if current_minute >= 60:
                    current_minute = 0
                    current_hour += 1
                
                # Stop if we've exceeded the search range
                if current_hour > search_end_hour:
                    break
                if current_hour == search_end_hour and current_minute >= search_end_minute:
                    break
            
            time_range_info = ""
            if start_time_str and end_time_str:
                time_range_info = f" between {start_time_str} and {end_time_str}"
            
            return {
                "success": True,
                "resource_name": res.get("name"),
                "date": date_str,
                "duration_minutes": duration_minutes,
                "time_range": time_range_info,
                "available_slots": available_slots,
                "total_slots": len(available_slots),
                "business_hours": f"{resource_start}:00 - {resource_end}:00"
            }
        
        elif function_name == "get_my_bookings":
            bookings = database.get_bookings({"user_id": user_id})
            return {
                "success": True,
                "bookings": [
                    {
                        "id": b.get("id"),
                        "resource_name": b.get("resource_name"),
                        "start_time": str(b.get("start_time")),
                        "end_time": str(b.get("end_time")),
                        "status": b.get("status"),
                        "attendees": b.get("attendees"),
                        "purpose": b.get("purpose")
                    }
                    for b in bookings[:10]  # Limit to 10 most recent
                ]
            }
        
        elif function_name == "cancel_booking":
            booking_id = function_args.get("booking_id")
            bk = database.get_booking_by_id(booking_id)
            
            if not bk:
                return {"success": False, "error": "Booking not found"}
            
            if str(bk.get("user_id")) != str(user_id) and user_role not in ("admin", "manager"):
                return {"success": False, "error": "Not authorized to cancel this booking"}
            
            if bk.get("status") in ("cancelled", "rejected", "completed"):
                return {"success": False, "error": f"Cannot cancel ({bk.get('status')})"}
            
            updated = database.update_booking(booking_id, {"status": "cancelled"})
            audit(None, user_id, "cancel", "booking", booking_id, "AI")
            
            return {"success": True, "message": "Booking cancelled successfully"}
        
        elif function_name == "get_pending_approvals":
            if user_role not in ("manager", "admin"):
                return {"success": False, "error": "Not authorized"}
            
            bookings = database.get_bookings({"status": "pending"})
            return {
                "success": True,
                "pending_approvals": [
                    {
                        "id": b.get("id"),
                        "user_name": b.get("user_name"),
                        "resource_name": b.get("resource_name"),
                        "start_time": str(b.get("start_time")),
                        "end_time": str(b.get("end_time")),
                        "attendees": b.get("attendees"),
                        "purpose": b.get("purpose"),
                        "created_at": str(b.get("created_at"))
                    }
                    for b in bookings[:20]
                ]
            }
        
        elif function_name == "approve_booking":
            if user_role not in ("manager", "admin"):
                return {"success": False, "error": "Not authorized"}
            
            booking_id = function_args.get("booking_id")
            comment = function_args.get("comment", "")
            
            bk = database.get_booking_by_id(booking_id)
            if not bk:
                return {"success": False, "error": "Booking not found"}
            
            if bk.get("status") != "pending":
                return {"success": False, "error": "Booking is not pending"}
            
            updated = database.update_booking(booking_id, {"status": "approved", "approver_comment": comment})
            audit(None, user_id, "approve", "booking", booking_id, f"AI: {comment}")
            
            return {"success": True, "message": "Booking approved"}
        
        elif function_name == "reject_booking":
            if user_role not in ("manager", "admin"):
                return {"success": False, "error": "Not authorized"}
            
            booking_id = function_args.get("booking_id")
            comment = function_args.get("comment", "")
            
            bk = database.get_booking_by_id(booking_id)
            if not bk:
                return {"success": False, "error": "Booking not found"}
            
            if bk.get("status") != "pending":
                return {"success": False, "error": "Booking is not pending"}
            
            updated = database.update_booking(booking_id, {"status": "rejected", "approver_comment": comment})
            audit(None, user_id, "reject", "booking", booking_id, f"AI: {comment}")
            
            return {"success": True, "message": "Booking rejected"}
        
        elif function_name == "schedule_maintenance":
            if user_role not in ("manager", "admin"):
                return {"success": False, "error": "Not authorized"}
            
            resource_id = function_args.get("resource_id")
            start_time = datetime.fromisoformat(function_args.get("start_time"))
            end_time = datetime.fromisoformat(function_args.get("end_time"))
            reason = function_args.get("reason")
            
            maint_data = {
                "resource_id": resource_id,
                "start_time": start_time,
                "end_time": end_time,
                "reason": reason
            }
            
            maint = database.create_maintenance(maint_data)
            audit(None, user_id, "create", "maintenance", maint.get("id"), f"AI: {reason}")
            
            return {"success": True, "maintenance_id": maint.get("id"), "message": "Maintenance scheduled"}
        
        elif function_name == "get_analytics_summary":
            if user_role not in ("manager", "admin"):
                return {"success": False, "error": "Not authorized"}
            
            total = database.count_bookings()
            pending = database.count_bookings({"status": "pending"})
            active_res = database.count_resources({"active": True})
            
            return {
                "success": True,
                "total_bookings": total,
                "pending_approvals": pending,
                "active_resources": active_res,
                "message": "Analytics data retrieved"
            }
        
        else:
            return {"success": False, "error": f"Unknown function: {function_name}"}
    
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============ AI Assistant ============
@app.post("/api/ai/chat")
async def ai_chat(body: ChatIn, u: Dict = Depends(current_user)):
    # Use dynamic API key from request, or fall back to environment variable
    api_key = body.groq_api_key or GROQ_API_KEY
    
    if not api_key:
        raise HTTPException(400, "Groq API key is required. Please provide your API key.")

    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")
    u_name = u.get("name") if isinstance(u, dict) else getattr(u, "name")
    u_role = u.get("role") if isinstance(u, dict) else getattr(u, "role")
    
    session_id = body.session_id or f"user-{u_id}-default"
    
    # Persist user message
    database.create_chat_message({
        "user_id": u_id, 
        "session_id": session_id, 
        "role": "user", 
        "content": body.message,
        "timestamp": now_ist()
    })

    resources_list = database.get_resources({"active": True})
    
    res_lines = "\n".join([
        f"- id={r.get('id')} | {r.get('name')} | type={r.get('type')} | scene={r.get('scene_type')} | "
        f"cap={r.get('capacity')} | loc={r.get('location')} | hours={r.get('avail_start')}-{r.get('avail_end')} | "
        f"approval={'yes' if r.get('requires_approval') else 'no'} | "
        f"amenities={r.get('amenities')}"
        for r in resources_list
    ])
    
    role_hint = {
        "admin": "You have ADMIN privileges - you can manage resources, maintenance, and approve bookings.",
        "manager": "You have MANAGER privileges - you can approve bookings and schedule maintenance.",
        "employee": "You are an employee - you can create bookings and view your bookings.",
    }.get(u_role, "")
    
    # Build action capabilities description
    actions_desc = """
== AVAILABLE ACTIONS ==
You can perform these actions by responding with JSON in this format:

ACTION: search_resources
{
  "action": "search_resources",
  "search": "chess lounge",
  "type": "meeting_room"
}
Note: Use this to find resources by name. The search field is optional but recommended.

ACTION: get_resource_details
{
  "action": "get_resource_details",
  "resource_id": "resource-uuid"
}
Note: Use this to get full details about a specific resource.

ACTION: get_available_slots
{
  "action": "get_available_slots",
  "resource_id": "resource-uuid",
  "date": "2026-04-24",
  "duration_minutes": 60,
  "attendees": 4,
  "start_time": "12:00",
  "end_time": "15:00"
}
Note: Use this to get ALL available time slots for a resource on a specific date.
- duration_minutes: How long each slot should be (e.g., 60 for 1 hour, 180 for 3 hours)
- start_time and end_time are OPTIONAL - use them to filter slots within a specific time range
- Example: "from 12pm to 3pm" → start_time="12:00", end_time="15:00"
- If start_time/end_time not provided, shows all slots during business hours
Returns a list of available time slots with start and end times.

ACTION: check_availability
{
  "action": "check_availability",
  "resource_id": "resource-uuid",
  "start_time": "2026-04-24T14:00:00",
  "end_time": "2026-04-24T16:00:00",
  "attendees": 6
}
Note: Use this to check if a SPECIFIC time slot is available.
If not available, it will suggest alternative time slots.
ALWAYS search for the resource first to get its ID.

ACTION: create_booking
{
  "action": "create_booking",
  "resource_id": "resource-uuid",
  "start_time": "2026-04-24T14:00:00+05:30",
  "end_time": "2026-04-24T16:00:00+05:30",
  "attendees": 6,
  "purpose": "Team meeting"
}
Note: Always use IST timezone offset +05:30 in datetime strings. When the user explicitly requests a room booking or reservation and has provided sufficient details, perform the booking immediately.
Do not stop at a recommendation if the request is clear; create the booking when possible, or ask only for missing scheduling details.

ACTION: get_my_bookings
{
  "action": "get_my_bookings"
}

ACTION: cancel_booking
{
  "action": "cancel_booking",
  "booking_id": "booking-uuid"
}
"""
    
    if u_role in ("manager", "admin"):
        actions_desc += """
ACTION: get_pending_approvals
{
  "action": "get_pending_approvals"
}

ACTION: approve_booking
{
  "action": "approve_booking",
  "booking_id": "booking-uuid",
  "comment": "Approved for client meeting"
}

ACTION: reject_booking
{
  "action": "reject_booking",
  "booking_id": "booking-uuid",
  "comment": "Insufficient notice"
}

ACTION: schedule_maintenance
{
  "action": "schedule_maintenance",
  "resource_id": "resource-uuid",
  "start_time": "2026-04-24T08:00:00",
  "end_time": "2026-04-24T17:00:00",
  "reason": "Cleaning and maintenance"
}

ACTION: get_analytics_summary
{
  "action": "get_analytics_summary"
}
"""
    
    # Get current date and time in IST for AI context
    current_ist = now_ist()
    current_date_str = current_ist.strftime("%Y-%m-%d")
    current_time_str = current_ist.strftime("%I:%M %p")
    current_day_str = current_ist.strftime("%A")
    
    system_prompt = (
        f"You are ERABS AI Assistant with ACTION capabilities. "
        f"Current user: {u_name}, role={u_role}. {role_hint}\n\n"
        f"== CURRENT DATE & TIME (IST) ==\n"
        f"Today: {current_day_str}, {current_date_str}\n"
        f"Current time: {current_time_str}\n"
        f"Timezone: IST (Indian Standard Time, UTC+5:30)\n\n"
        "== RESOURCE CATALOGUE ==\n" + res_lines + "\n\n"
        + actions_desc + "\n\n"
        "== RESPONSE FORMAT ==\n"
        "- Use a formal, professional tone in all assistant replies.\n"
        "- Avoid slang, emojis, and casual phrasing.\n"
        "- Prefer full sentences, clear structure, and concise paragraphs.\n"
        "- Use headings, bullet points, or numbered lists when presenting results.\n"
        "- If an action is required, include exactly one JSON object with the action details.\n"
        "- Place action JSON after a brief formal summary when possible.\n"
        "- Example format:\n"
        "  Response: <formal summary>\n"
        "  {\"action\": \"...\", ...}\n\n"
        "== WORKFLOW ==\n"
        "1. PARSE USER CONSTRAINTS from their message:\n"
        "   - Room/resource name (e.g., 'chess lounge', 'boardroom')\n"
        "   - Date (e.g., 'tomorrow', 'Friday', '2026-04-24')\n"
        "   - Time (e.g., '2 PM', '14:00', 'afternoon')\n"
        "   - Duration (e.g., '2 hours', '1 hour', if not specified assume 1 hour)\n"
        "   - Number of attendees (e.g., '5 people', '10 attendees')\n"
        "   - Purpose (e.g., 'team meeting', 'client presentation')\n\n"
        "2. SEARCH FOR RESOURCE:\n"
        "   - Use search_resources to find the resource by name\n"
        "   - Extract the resource_id from search results\n\n"
        "3. HANDLE AVAILABILITY QUERIES:\n"
        "   - If user asks 'when is it available' or 'show me available times':\n"
        "     Use get_available_slots to show ALL available time slots\n"
        "   - If user specifies a TIME RANGE (e.g., 'from 12pm to 3pm', 'between 2pm and 5pm'):\n"
        "     Use get_available_slots with start_time and end_time parameters\n"
        "     Example: 'from 12pm to 3pm' → start_time='12:00', end_time='15:00'\n"
        "     Example: 'between 2pm and 5pm' → start_time='14:00', end_time='17:00'\n"
        "   - If user specifies a SPECIFIC time (e.g., 'at 2 PM'):\n"
        "     Use check_availability to check that specific time\n"
        "   - If slot is not available, suggest alternative times from the response\n\n"
        "4. CREATE BOOKINGS:\n"
        "   - When the user explicitly requests a booking or reservation, perform the booking action whenever enough details are available.\n"
        "   - Always check availability first\n"
        "   - If available, create the booking\n"
        "   - If not available, suggest alternatives and ask user to choose\n\n"
        "5. RESPOND NATURALLY:\n"
        "   - Explain what you're doing\n"
        "   - Show available time slots clearly\n"
        "   - Provide helpful suggestions\n"
        "   - Confirm bookings with details\n\n"
        "CRITICAL RULES:\n"
        "- ALWAYS search for resources first to get their IDs\n"
        "- PARSE dates and times from user's natural language\n"
        "- Use TODAY'S DATE from the context above when user says 'today'\n"
        "- Calculate 'tomorrow' as the day after today's date\n"
        "- When user specifies TIME RANGE (e.g., 'from 12pm to 3pm'):\n"
        "  * Convert to 24-hour format: 12pm=12:00, 3pm=15:00\n"
        "  * Use start_time and end_time parameters in get_available_slots\n"
        "  * Calculate duration from the range (3pm - 12pm = 3 hours = 180 minutes)\n"
        "- If user doesn't specify duration, assume 1 hour\n"
        "- If user doesn't specify attendees, assume 1 person\n"
        "- Show available time slots when requested\n"
        "- Suggest alternatives when requested slot is unavailable\n\n"
        "IMPORTANT: When you want to perform an action, include the JSON in your response.\n"
        "You can include both conversational text AND action JSON.\n"
        "Example: 'Let me search for that room. {\"action\": \"search_resources\", \"search\": \"chess lounge\"}'\n\n"
        "Be helpful, formal, and professional."
    )

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        
        # Get chat history for context
        history = database.get_chat_history(u_id, session_id, limit=10)
        
        # Build messages array
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add recent history (excluding the message we just saved)
        for msg in history[:-1]:
            messages.append({
                "role": msg.get("role"),
                "content": msg.get("content")
            })
        
        # Add current message
        messages.append({"role": "user", "content": body.message})
        
        # Call Groq API (without tools - using JSON parsing instead)
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1024,
        )
        
        resp_text = chat_completion.choices[0].message.content
        
        # Check if response contains action JSON
        action_result = None
        action_name = None
        if "{" in resp_text and "\"action\":" in resp_text:
            try:
                # Extract JSON from response
                import re
                json_match = re.search(r'\{[^{}]*"action"[^{}]*\}', resp_text)
                if json_match:
                    action_json = json.loads(json_match.group())
                    action_name = action_json.get("action")
                    
                    # Execute the action
                    action_result = await execute_ai_function(
                        action_name, action_json, u_id, u_role, u
                    )
                    
                    # Remove JSON from response text
                    resp_text = resp_text.replace(json_match.group(), "").strip()
                    
                    # Add action result to response
                    if action_result.get("success"):
                        if action_name == "search_resources":
                            resources = action_result.get("resources", [])
                            if resources:
                                resp_text += f"\nFound {len(resources)} resource(s):"
                                for r in resources[:5]:
                                    resp_text += f"\n- {r['name']} (ID: {r['id']}) | Type: {r['type']} | Capacity: {r['capacity']}"
                            else:
                                resp_text += "\nNo resources found matching your search."
                        elif action_name == "get_resource_details":
                            resource = action_result.get("resource", {})
                            resp_text += f"\nResource Details:"
                            resp_text += f"\nName: {resource.get('name')}"
                            resp_text += f"\nType: {resource.get('type')}"
                            resp_text += f"\nCapacity: {resource.get('capacity')}"
                            resp_text += f"\nLocation: {resource.get('location')}"
                            resp_text += f"\nHours: {resource.get('avail_start')}:00 - {resource.get('avail_end')}:00"
                            resp_text += f"\nAmenities: {resource.get('amenities')}"
                        elif action_name == "create_booking":
                            resp_text += f"\nBooking created successfully."
                            resp_text += f"\nBooking ID: {action_result.get('booking_id')}"
                            resp_text += f"\nStatus: {action_result.get('status')}"
                        elif action_name == "check_availability":
                            if action_result.get("available"):
                                resp_text += f"\nThe {action_result.get('resource_name')} is available."
                                resp_text += f"\nTime: {action_result.get('requested_start')} to {action_result.get('requested_end')}"
                            else:
                                resp_text += f"\nNot available: {action_result.get('reason')}"
                                
                                # Show alternative slots if available
                                alt_slots = action_result.get("alternative_slots", [])
                                if alt_slots:
                                    resp_text += f"\nAlternative time slots available:"
                                    for i, slot in enumerate(alt_slots[:5], 1):
                                        resp_text += f"\n{i}. {slot['start_time']} - {slot['end_time']}"
                                    resp_text += "\n\nWould you like to book one of these times instead?"
                        elif action_name == "get_available_slots":
                            slots = action_result.get("available_slots", [])
                            resource_name = action_result.get("resource_name")
                            date = action_result.get("date")
                            duration = action_result.get("duration_minutes")
                            time_range = action_result.get("time_range", "")
                            
                            if slots:
                                resp_text += f"\nAvailable time slots for {resource_name} on {date}{time_range}"
                                resp_text += f"\nDuration: {duration} minutes each\n"
                                for i, slot in enumerate(slots[:10], 1):
                                    resp_text += f"{i}. {slot['start_time']} - {slot['end_time']}\n"
                                
                                if len(slots) > 10:
                                    resp_text += f"... and {len(slots) - 10} more slots available"
                                
                                resp_text += f"\nTotal: {len(slots)} available slots"
                                resp_text += f"\nBusiness hours: {action_result.get('business_hours')}"
                            else:
                                resp_text += f"\nNo available slots found for {resource_name} on {date}{time_range}"
                                resp_text += f"\nBusiness hours: {action_result.get('business_hours')}"
                        elif action_name == "cancel_booking":
                            resp_text += "\nBooking cancelled successfully."
                        elif action_name == "approve_booking":
                            resp_text += "\nBooking approved."
                        elif action_name == "reject_booking":
                            resp_text += "\nBooking rejected."
                        elif action_name == "schedule_maintenance":
                            resp_text += f"\nMaintenance scheduled."
                            resp_text += f"\nMaintenance ID: {action_result.get('maintenance_id')}"
                        elif action_name == "get_my_bookings":
                            bookings = action_result.get("bookings", [])
                            if bookings:
                                resp_text += f"\nYou have {len(bookings)} booking(s):"
                                for b in bookings[:5]:
                                    resp_text += f"\n- {b['resource_name']}: {b['start_time']} ({b['status']})"
                            else:
                                resp_text += "\nYou have no bookings."
                        elif action_name == "get_pending_approvals":
                            approvals = action_result.get("pending_approvals", [])
                            if approvals:
                                resp_text += f"\nPending approvals: {len(approvals)}"
                                for a in approvals[:5]:
                                    resp_text += f"\n- {a['user_name']} - {a['resource_name']}: {a['start_time']} (ID: {a['id']})"
                            else:
                                resp_text += "\nNo pending approvals."
                        elif action_name == "get_analytics_summary":
                            resp_text += f"\nAnalytics Summary:"
                            resp_text += f"\nTotal bookings: {action_result.get('total_bookings')}"
                            resp_text += f"\nPending approvals: {action_result.get('pending_approvals')}"
                            resp_text += f"\nActive resources: {action_result.get('active_resources')}"
                    else:
                        resp_text += f"\nError: {action_result.get('error')}"
            except Exception as e:
                # If JSON parsing fails, just return the text response
                pass
        
    except Exception as e:
        error_msg = str(e)
        if "invalid_api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            raise HTTPException(401, "Invalid Groq API key. Please check your API key and try again.")
        raise HTTPException(500, f"AI error: {error_msg[:200]}")

    # Save AI response to chat history
    database.create_chat_message({
        "user_id": u_id, 
        "session_id": session_id, 
        "role": "assistant", 
        "content": resp_text,
        "timestamp": now_ist()
    })

    return {
        "session_id": session_id,
        "reply": resp_text,
        "role": "assistant",
        "action": action_name,
        "action_result": action_result,
    }


class ApiKeyValidation(BaseModel):
    api_key: str


@app.post("/api/ai/validate-key")
async def validate_groq_key(body: ApiKeyValidation, u: Dict = Depends(current_user)):
    """Validate a Groq API key by making a test request."""
    try:
        from groq import Groq
        client = Groq(api_key=body.api_key)
        
        # Make a minimal test request
        client.chat.completions.create(
            messages=[{"role": "user", "content": "Hi"}],
            model="llama-3.3-70b-versatile",
            max_tokens=10,
        )
        
        return {"valid": True, "message": "API key is valid"}
    except Exception as e:
        error_msg = str(e)
        if "invalid_api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            return {"valid": False, "message": "Invalid API key"}
        return {"valid": False, "message": f"Validation error: {error_msg[:100]}"}


@app.get("/api/ai/history")
def ai_history(session_id: Optional[str] = None, u: Dict = Depends(current_user)):
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")
    sid = session_id or f"user-{u_id}-default"
    msgs = database.get_chat_history(u_id, sid)
    return {"session_id": sid, "messages": msgs}


@app.delete("/api/ai/history")
def ai_clear_history(session_id: Optional[str] = None, u: Dict = Depends(current_user)):
    u_id = u.get("id") if isinstance(u, dict) else getattr(u, "id")
    sid = session_id or f"user-{u_id}-default"
    database.delete_chat_history(u_id, sid)
    return {"ok": True}


@app.get("/api/")
def root():
    return {"name": "ERABS API", "status": "ok", "version": "1.2.0"}
