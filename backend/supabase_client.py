"""Supabase client configuration for ERABS backend."""
import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseConfig:
    """Supabase configuration and client management."""
    
    def __init__(self):
        self.supabase_url: Optional[str] = os.getenv("SUPABASE_URL")
        self.supabase_key: Optional[str] = os.getenv("SUPABASE_KEY")
        self.supabase_service_role_key: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self._client: Optional[Client] = None
        self._service_client: Optional[Client] = None
        
    @property
    def is_configured(self) -> bool:
        """Check if Supabase is properly configured."""
        return bool(self.supabase_url and self.supabase_key)
    
    @property
    def client(self) -> Client:
        """Get Supabase client with anon key."""
        if not self.is_configured:
            raise ValueError("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env")
        
        if self._client is None:
            self._client = create_client(self.supabase_url, self.supabase_key)
        
        return self._client
    
    @property
    def service_client(self) -> Client:
        """Get Supabase client with service role key (bypasses RLS)."""
        if not self.supabase_url or not self.supabase_service_role_key:
            raise ValueError("Supabase service role is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
        
        if self._service_client is None:
            self._service_client = create_client(self.supabase_url, self.supabase_service_role_key)
        
        return self._service_client


# Global Supabase config instance
supabase_config = SupabaseConfig()


def get_supabase() -> Client:
    """Get Supabase client instance."""
    return supabase_config.client


def get_supabase_service() -> Client:
    """Get Supabase service role client instance."""
    return supabase_config.service_client
