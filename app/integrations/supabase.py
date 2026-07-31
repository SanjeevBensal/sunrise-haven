from supabase import create_client, Client
from app.config import settings

# Create a single instance of the Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)