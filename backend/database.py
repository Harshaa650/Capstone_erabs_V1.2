"""
Database abstraction layer supporting both SQLite and Supabase.
This module provides a unified interface for database operations.
"""
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, ForeignKey, Text, func
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, Session
from supabase_client import supabase_config
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./erabs.db")
USE_SUPABASE = supabase_config.is_configured and os.getenv("USE_SUPABASE", "false").lower() == "true"

# SQLAlchemy setup (for SQLite fallback)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


# SQLAlchemy Models (for SQLite)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="employee")
    department = Column(String, default="General")
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    bookings = relationship("Booking", back_populates="user", foreign_keys="Booking.user_id")


class Resource(Base):
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


class Booking(Base):
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
    user = relationship("User", back_populates="bookings", foreign_keys=[user_id])
    resource = relationship("Resource")


class Maintenance(Base):
    __tablename__ = "maintenance"
    id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, ForeignKey("resources.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    reason = Column(String, default="Scheduled maintenance")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    actor_id = Column(Integer)
    action = Column(String)
    entity = Column(String)
    entity_id = Column(Integer)
    details = Column(Text, default="")
    timestamp = Column(DateTime, default=lambda: datetime.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(String, index=True)
    role = Column(String)
    content = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.now())


class Database:
    """Unified database interface supporting both SQLite and Supabase."""
    
    def __init__(self):
        self.use_supabase = USE_SUPABASE
        if self.use_supabase:
            from supabase_client import get_supabase_service
            self.supabase = get_supabase_service()
        else:
            self.supabase = None
    
    def get_session(self):
        """Get SQLAlchemy session (for SQLite)."""
        if self.use_supabase:
            return None
        return SessionLocal()
    
    # User operations
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email."""
        if self.use_supabase:
            result = self.supabase.table("users").select("*").eq("email", email).execute()
            return result.data[0] if result.data else None
        else:
            session = self.get_session()
            user = session.query(User).filter(User.email == email).first()
            session.close()
            if user:
                return {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "hashed_password": user.hashed_password,
                    "role": user.role,
                    "department": user.department,
                }
            return None
    
    def get_user_by_id(self, user_id: Any) -> Optional[Dict]:
        """Get user by ID."""
        if self.use_supabase:
            result = self.supabase.table("users").select("*").eq("id", str(user_id)).execute()
            return result.data[0] if result.data else None
        else:
            session = self.get_session()
            user = session.query(User).get(user_id)
            session.close()
            if user:
                return {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "hashed_password": user.hashed_password,
                    "role": user.role,
                    "department": user.department,
                }
            return None
    
    def create_user(self, user_data: Dict) -> Dict:
        """Create a new user."""
        if self.use_supabase:
            result = self.supabase.table("users").insert(user_data).execute()
            return result.data[0]
        else:
            session = self.get_session()
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                hashed_password=user_data["hashed_password"],
                role=user_data.get("role", "employee"),
                department=user_data.get("department", "General"),
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            result = {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "department": user.department,
            }
            session.close()
            return result
    
    def get_all_users(self) -> List[Dict]:
        """Get all users."""
        if self.use_supabase:
            result = self.supabase.table("users").select("*").execute()
            return result.data
        else:
            session = self.get_session()
            users = session.query(User).all()
            result = [
                {
                    "id": u.id,
                    "email": u.email,
                    "name": u.name,
                    "role": u.role,
                    "department": u.department,
                }
                for u in users
            ]
            session.close()
            return result
    
    # Department operations
    def get_departments(self) -> List[Dict]:
        """Get all departments."""
        if self.use_supabase:
            result = self.supabase.table("departments").select("*").execute()
            return result.data
        else:
            # For SQLite, return hardcoded departments
            return [
                {"id": 1, "name": "IT", "description": "Information Technology Department"},
                {"id": 2, "name": "Engineering", "description": "Engineering and Development"},
                {"id": 3, "name": "HR", "description": "Human Resources"},
                {"id": 4, "name": "Finance", "description": "Finance and Accounting"},
                {"id": 5, "name": "Marketing", "description": "Marketing and Sales"},
                {"id": 6, "name": "Operations", "description": "Operations and Facilities"},
                {"id": 7, "name": "General", "description": "General Purpose"},
            ]
    
    def get_department_by_name(self, name: str) -> Optional[Dict]:
        """Get department by name."""
        if self.use_supabase:
            result = self.supabase.table("departments").select("*").eq("name", name).execute()
            return result.data[0] if result.data else None
        else:
            depts = self.get_departments()
            for dept in depts:
                if dept["name"] == name:
                    return dept
            return None
    
    # Resource operations
    def get_resources(self, filters: Dict = None) -> List[Dict]:
        """Get resources with optional filters."""
        if self.use_supabase:
            query = self.supabase.table("resources").select("*")
            
            if filters:
                if "type" in filters:
                    query = query.eq("type", filters["type"])
                if "scene_type" in filters:
                    query = query.eq("scene_type", filters["scene_type"])
                if "active" in filters:
                    query = query.eq("active", filters["active"])
            
            result = query.execute()
            resources = result.data
            
            # Apply search filter if provided
            if filters and "search" in filters:
                search = filters["search"].lower()
                resources = [
                    r for r in resources
                    if search in r["name"].lower() or search in r["description"].lower() or search in r["location"].lower()
                ]
            
            return resources
        else:
            session = self.get_session()
            query = session.query(Resource)
            
            if filters:
                if "type" in filters:
                    query = query.filter(Resource.type == filters["type"])
                if "scene_type" in filters:
                    query = query.filter(Resource.scene_type == filters["scene_type"])
                if "active" in filters:
                    query = query.filter(Resource.active == filters["active"])
                if "search" in filters:
                    search = f"%{filters['search'].lower()}%"
                    query = query.filter(
                        (Resource.name.ilike(search)) | 
                        (Resource.description.ilike(search)) | 
                        (Resource.location.ilike(search))
                    )
            
            resources = query.all()
            result = [
                {
                    "id": r.id,
                    "name": r.name,
                    "type": r.type,
                    "description": r.description,
                    "capacity": r.capacity,
                    "location": r.location,
                    "avail_start": r.avail_start,
                    "avail_end": r.avail_end,
                    "requires_approval": r.requires_approval,
                    "department_restricted": r.department_restricted,
                    "max_duration_min": r.max_duration_min,
                    "active": r.active,
                    "image_url": r.image_url,
                    "scene_type": r.scene_type,
                    "amenities": r.amenities,
                    "hourly_cost": r.hourly_cost,
                }
                for r in resources
            ]
            session.close()
            return result
    
    def get_resource_by_id(self, resource_id: Any) -> Optional[Dict]:
        """Get resource by ID."""
        if self.use_supabase:
            result = self.supabase.table("resources").select("*").eq("id", str(resource_id)).execute()
            return result.data[0] if result.data else None
        else:
            session = self.get_session()
            resource = session.query(Resource).get(resource_id)
            session.close()
            if resource:
                return {
                    "id": resource.id,
                    "name": resource.name,
                    "type": resource.type,
                    "description": resource.description,
                    "capacity": resource.capacity,
                    "location": resource.location,
                    "avail_start": resource.avail_start,
                    "avail_end": resource.avail_end,
                    "requires_approval": resource.requires_approval,
                    "department_restricted": resource.department_restricted,
                    "max_duration_min": resource.max_duration_min,
                    "active": resource.active,
                    "image_url": resource.image_url,
                    "scene_type": resource.scene_type,
                    "amenities": resource.amenities,
                    "hourly_cost": resource.hourly_cost,
                }
            return None
    
    def create_resource(self, resource_data: Dict) -> Dict:
        """Create a new resource."""
        if self.use_supabase:
            result = self.supabase.table("resources").insert(resource_data).execute()
            return result.data[0]
        else:
            session = self.get_session()
            resource = Resource(**resource_data)
            session.add(resource)
            session.commit()
            session.refresh(resource)
            result = {
                "id": resource.id,
                "name": resource.name,
                "type": resource.type,
                "description": resource.description,
                "capacity": resource.capacity,
                "location": resource.location,
                "avail_start": resource.avail_start,
                "avail_end": resource.avail_end,
                "requires_approval": resource.requires_approval,
                "department_restricted": resource.department_restricted,
                "max_duration_min": resource.max_duration_min,
                "active": resource.active,
                "image_url": resource.image_url,
                "scene_type": resource.scene_type,
                "amenities": resource.amenities,
                "hourly_cost": resource.hourly_cost,
            }
            session.close()
            return result
    
    def delete_resource(self, resource_id: Any) -> bool:
        """Deactivate a resource."""
        if self.use_supabase:
            self.supabase.table("resources").update({"active": False}).eq("id", str(resource_id)).execute()
            return True
        else:
            session = self.get_session()
            resource = session.query(Resource).get(resource_id)
            if resource:
                resource.active = False
                session.commit()
                session.close()
                return True
            session.close()
            return False

    def update_resource(self, resource_id: Any, updates: Dict) -> Optional[Dict]:
        """Update a resource."""
        if self.use_supabase:
            result = self.supabase.table("resources").update(updates).eq("id", str(resource_id)).execute()
            return result.data[0] if result.data else None
        else:
            session = self.get_session()
            resource = session.query(Resource).get(resource_id)
            if resource:
                for key, value in updates.items():
                    if hasattr(resource, key):
                        setattr(resource, key, value)
                session.commit()
                session.refresh(resource)
                result = {
                    "id": resource.id,
                    "name": resource.name,
                    "type": resource.type,
                    "description": resource.description,
                    "capacity": resource.capacity,
                    "location": resource.location,
                    "avail_start": resource.avail_start,
                    "avail_end": resource.avail_end,
                    "requires_approval": resource.requires_approval,
                    "department_restricted": resource.department_restricted,
                    "max_duration_min": resource.max_duration_min,
                    "active": resource.active,
                    "image_url": resource.image_url,
                    "scene_type": resource.scene_type,
                    "amenities": resource.amenities,
                    "hourly_cost": resource.hourly_cost,
                }
                session.close()
                return result
            session.close()
            return None

    # Booking operations
    def create_booking(self, booking_data: Dict) -> Dict:
        """Create a new booking."""
        if self.use_supabase:
            # Basic validation of data types for Supabase
            if isinstance(booking_data.get("start_time"), datetime):
                booking_data["start_time"] = booking_data["start_time"].isoformat()
            if isinstance(booking_data.get("end_time"), datetime):
                booking_data["end_time"] = booking_data["end_time"].isoformat()
            if isinstance(booking_data.get("created_at"), datetime):
                booking_data["created_at"] = booking_data["created_at"].isoformat()
            
            result = self.supabase.table("bookings").insert(booking_data).execute()
            return result.data[0]
        else:
            session = self.get_session()
            booking = Booking(**booking_data)
            session.add(booking)
            session.commit()
            session.refresh(booking)
            result = {
                "id": booking.id,
                "user_id": booking.user_id,
                "resource_id": booking.resource_id,
                "start_time": booking.start_time,
                "end_time": booking.end_time,
                "attendees": booking.attendees,
                "purpose": booking.purpose,
                "status": booking.status,
                "approver_comment": booking.approver_comment,
                "created_at": booking.created_at,
            }
            session.close()
            return result
    
    def get_bookings(self, filters: Dict = None) -> List[Dict]:
        """Get bookings with optional filters, joining with resources for name/image."""
        if self.use_supabase:
            # Check if we need to use !inner join for filtering by joined table
            user_join = "user:user_id"
            if filters and ("department" in filters or "department_id" in filters or "manager_id" in filters):
                user_join = "user:user_id!inner"
                
            query = self.supabase.table("bookings").select(
                f"*, resource:resource_id(name, image_url, scene_type, type), {user_join}(name, department_id, manager_id, role)"
            )

            
            if filters:
                if "user_id" in filters:
                    query = query.eq("user_id", str(filters["user_id"]))
                if "status" in filters:
                    query = query.eq("status", filters["status"])
                if "status_in" in filters:
                    query = query.in_("status", filters["status_in"])
                if "department" in filters:
                    query = query.eq("user.department_id", filters["department"])
                if "department_id" in filters:
                    query = query.eq("user.department_id", filters["department_id"])
            
            query = query.order("created_at", desc=True)
            result = query.execute()
            # Flatten nested resource data
            for b in result.data:
                if "resource" in b and b["resource"]:
                    b["resource_name"] = b["resource"].get("name")
                    b["resource_image_url"] = b["resource"].get("image_url")
                    b["resource_scene_type"] = b["resource"].get("scene_type")
                    b["resource_type"] = b["resource"].get("type")
                if "user" in b and b["user"]:
                    b["user_name"] = b["user"].get("name")
                    b["user_department"] = b["user"].get("department") or b["user"].get("department_id")
                    b["user_department_id"] = b["user"].get("department_id")
                    b["user_manager_id"] = b["user"].get("manager_id")
                    b["user_role"] = b["user"].get("role")
            return result.data
        else:
            session = self.get_session()
            query = session.query(Booking)
            
            if filters:
                if "user_id" in filters:
                    query = query.filter(Booking.user_id == filters["user_id"])
                if "status" in filters:
                    query = query.filter(Booking.status == filters["status"])
                if "department" in filters:
                    query = query.join(User).filter(User.department == filters["department"])
                elif "manager_id" in filters:
                    query = query.join(User).filter(User.manager_id == filters["manager_id"])

            
            query = query.order_by(Booking.created_at.desc())
            bookings = query.all()
            result = []
            for b in bookings:
                res = session.query(Resource).get(b.resource_id) if b.resource_id else None
                result.append({
                    "id": b.id,
                    "user_id": b.user_id,
                    "resource_id": b.resource_id,
                    "start_time": b.start_time,
                    "end_time": b.end_time,
                    "attendees": b.attendees,
                    "purpose": b.purpose,
                    "status": b.status,
                    "approver_comment": b.approver_comment,
                    "created_at": b.created_at,
                    "user_name": b.user.name if b.user else None,
                    "user_department": b.user.department if b.user else None,
                    "user_manager_id": b.user.manager_id if b.user else None,
                    "user_role": b.user.role if b.user else None,
                    "resource_name": res.name if res else None,
                    "resource_image_url": res.image_url if res else None,
                    "resource_scene_type": res.scene_type if res else None,
                    "resource_type": res.type if res else None,
                })
            session.close()
            return result
    
    def update_booking(self, booking_id: Any, updates: Dict) -> Optional[Dict]:
        """Update a booking."""
        if self.use_supabase:
            result = self.supabase.table("bookings").update(updates).eq("id", str(booking_id)).execute()
            return result.data[0] if result.data else None
        else:
            session = self.get_session()
            booking = session.query(Booking).get(booking_id)
            if booking:
                for key, value in updates.items():
                    setattr(booking, key, value)
                session.commit()
                session.refresh(booking)
                result = {
                    "id": booking.id,
                    "user_id": booking.user_id,
                    "resource_id": booking.resource_id,
                    "start_time": booking.start_time,
                    "end_time": booking.end_time,
                    "attendees": booking.attendees,
                    "purpose": booking.purpose,
                    "status": booking.status,
                    "approver_comment": booking.approver_comment,
                    "created_at": booking.created_at,
                }
                session.close()
                return result
            session.close()
            return None

    def get_booking_by_id(self, booking_id: Any) -> Optional[Dict]:
        """Get booking by ID."""
        if self.use_supabase:
            result = self.supabase.table("bookings").select("*, user:user_id(name), resource:resource_id(name)").eq("id", str(booking_id)).execute()
            if result.data:
                bk = result.data[0]
                # Flatten joined data for compatibility
                if "user" in bk and bk["user"]:
                    bk["user_name"] = bk["user"]["name"]
                if "resource" in bk and bk["resource"]:
                    bk["resource_name"] = bk["resource"]["name"]
                return bk
            return None
        else:
            session = self.get_session()
            booking = session.query(Booking).get(booking_id)
            if booking:
                result = {
                    "id": booking.id,
                    "user_id": booking.user_id,
                    "resource_id": booking.resource_id,
                    "start_time": booking.start_time,
                    "end_time": booking.end_time,
                    "attendees": booking.attendees,
                    "purpose": booking.purpose,
                    "status": booking.status,
                    "approver_comment": booking.approver_comment,
                    "created_at": booking.created_at,
                    "user_name": booking.user.name if booking.user else None,
                    "resource_name": booking.resource.name if booking.resource else None,
                }
                session.close()
                return result
            session.close()
            return None

    # Maintenance operations
    def get_maintenance(self) -> List[Dict]:
        """Get all maintenance records."""
        if self.use_supabase:
            result = self.supabase.table("maintenance").select("*").execute()
            return result.data
        else:
            session = self.get_session()
            maint = session.query(Maintenance).all()
            result = [
                {
                    "id": m.id,
                    "resource_id": m.resource_id,
                    "start_time": m.start_time,
                    "end_time": m.end_time,
                    "reason": m.reason,
                }
                for m in maint
            ]
            session.close()
            return result

    def create_maintenance(self, data: Dict) -> Dict:
        """Create a maintenance record."""
        if self.use_supabase:
            if isinstance(data.get("start_time"), datetime):
                data["start_time"] = data["start_time"].isoformat()
            if isinstance(data.get("end_time"), datetime):
                data["end_time"] = data["end_time"].isoformat()
            result = self.supabase.table("maintenance").insert(data).execute()
            return result.data[0]
        else:
            session = self.get_session()
            mb = Maintenance(**data)
            session.add(mb)
            session.commit()
            session.refresh(mb)
            result = {
                "id": mb.id,
                "resource_id": mb.resource_id,
                "start_time": mb.start_time,
                "end_time": mb.end_time,
                "reason": mb.reason,
            }
            session.close()
            return result

    def delete_maintenance(self, mid: Any) -> bool:
        """Delete a maintenance record."""
        if self.use_supabase:
            self.supabase.table("maintenance").delete().eq("id", str(mid)).execute()
            return True
        else:
            session = self.get_session()
            mb = session.query(Maintenance).get(mid)
            if mb:
                session.delete(mb)
                session.commit()
                session.close()
                return True
            session.close()
            return False

    # Audit log operations
    def create_audit_log(self, data: Dict) -> None:
        """Create an audit log entry."""
        if self.use_supabase:
            if isinstance(data.get("timestamp"), datetime):
                data["timestamp"] = data["timestamp"].isoformat()
            self.supabase.table("audit_logs").insert(data).execute()
        else:
            session = self.get_session()
            log = AuditLog(**data)
            session.add(log)
            session.commit()
            session.close()

    def get_audit_logs(self, limit: int = 200, user_id: Optional[str] = None, department_id: Optional[str] = None) -> List[Dict]:
        """Get audit logs."""
        if self.use_supabase:
            query = self.supabase.table("audit_logs").select("*, users!inner(name, role, department_id)")
            if user_id:
                query = query.eq("actor_id", user_id)
            if department_id:
                query = query.eq("users.department_id", department_id)
                
            result = query.order("timestamp", desc=True).limit(limit).execute()
            
            mapped_logs = []
            for lg in result.data:
                user_info = lg.get("users", {})
                mapped_logs.append({
                    "id": lg.get("id"),
                    "user_id": lg.get("actor_id"),
                    "user_role": user_info.get("role", "unknown"),
                    "user_name": user_info.get("name", "Unknown"),
                    "action": lg.get("action"),
                    "target_id": lg.get("entity_id"),
                    "timestamp": lg.get("timestamp"),
                    "details": lg.get("details"),
                    "entity": lg.get("entity")
                })
            return mapped_logs
        else:
            session = self.get_session()
            query = session.query(AuditLog, User).outerjoin(User, AuditLog.actor_id == User.id)
            
            if user_id:
                query = query.filter(AuditLog.actor_id == user_id)
            if department_id:
                query = query.filter(User.department_id == department_id)
                
            logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
            
            result = [
                {
                    "id": lg.id,
                    "user_id": lg.actor_id,
                    "user_role": user.role if user else "unknown",
                    "user_name": user.name if user else "Unknown",
                    "action": lg.action,
                    "target_id": lg.entity_id,
                    "timestamp": lg.timestamp.isoformat() if isinstance(lg.timestamp, datetime) else lg.timestamp,
                    "details": lg.details,
                    "entity": lg.entity
                }
                for lg, user in logs
            ]
            session.close()
            return result

    # Chat operations
    def create_chat_message(self, data: Dict) -> None:
        """Create a chat message."""
        if self.use_supabase:
            if isinstance(data.get("timestamp"), datetime):
                data["timestamp"] = data["timestamp"].isoformat()
            self.supabase.table("chat_messages").insert(data).execute()
        else:
            session = self.get_session()
            msg = ChatMessage(**data)
            session.add(msg)
            session.commit()
            session.close()

    def get_chat_history(self, user_id: Any, session_id: str, limit: int = 200) -> List[Dict]:
        """Get chat history."""
        if self.use_supabase:
            result = self.supabase.table("chat_messages").select("*").eq("user_id", str(user_id)).eq("session_id", session_id).order("timestamp").limit(limit).execute()
            return result.data
        else:
            session = self.get_session()
            msgs = session.query(ChatMessage).filter(
                ChatMessage.user_id == user_id,
                ChatMessage.session_id == session_id
            ).order_by(ChatMessage.timestamp).limit(limit).all()
            result = [
                {
                    "role": m.role,
                    "content": m.content,
                    "timestamp": m.timestamp,
                }
                for m in msgs
            ]
            session.close()
            return result

    def delete_chat_history(self, user_id: Any, session_id: str) -> None:
        """Delete chat history."""
        if self.use_supabase:
            self.supabase.table("chat_messages").delete().eq("user_id", str(user_id)).eq("session_id", session_id).execute()
        else:
            session = self.get_session()
            session.query(ChatMessage).filter(
                ChatMessage.user_id == user_id,
                ChatMessage.session_id == session_id
            ).delete()
            session.commit()
            session.close()

    def count_bookings(self, filters: Dict = None) -> int:
        """Count bookings."""
        if self.use_supabase:
            query = self.supabase.table("bookings").select("*", count="exact")
            if filters:
                if "status" in filters:
                    query = query.eq("status", filters["status"])
            result = query.execute()
            return result.count
        else:
            session = self.get_session()
            query = session.query(Booking)
            if filters:
                if "status" in filters:
                    query = query.filter(Booking.status == filters["status"])
            count = query.count()
            session.close()
            return count

    def count_resources(self, filters: Dict = None) -> int:
        """Count resources."""
        if self.use_supabase:
            query = self.supabase.table("resources").select("*", count="exact")
            if filters:
                if "active" in filters:
                    query = query.eq("active", filters["active"])
            result = query.execute()
            return result.count
        else:
            session = self.get_session()
            query = session.query(Resource)
            if filters:
                if "active" in filters:
                    query = query.filter(Resource.active == filters["active"])
            count = query.count()
            session.close()
            return count


# Global database instance
db = Database()
