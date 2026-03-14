-- Supabase Database Schema for EduNova

-- Ensure the UUID extension is enabled (should be by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- We will use Supabase Auth for the core 'users' table, 
-- but we create a public 'profiles' table to join with our app data.
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Documents Table (Metadata for uploaded PDFs)
CREATE TABLE public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat Sessions Table
CREATE TABLE public.chat_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Messages Table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS) properly for a Hackathon
-- Note: For a hackathon MVP where you are the only one testing, you can leave these permissive.
-- If you want it completely secure, uncomment the policies below.

-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view their own profile." ON profiles FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- CREATE POLICY "Users can manage their documents." ON documents FOR ALL USING (auth.uid() = user_id);
-- CREATE POLICY "Users can manage their chat sessions." ON chat_sessions FOR ALL USING (auth.uid() = user_id);

-- -- Messages belong to a chat session, which belongs to a user
-- CREATE POLICY "Users can manage messages in their sessions" ON messages FOR ALL USING (
--   EXISTS (
--     SELECT 1 FROM chat_sessions
--     WHERE chat_sessions.id = messages.chat_session_id
--     AND chat_sessions.user_id = auth.uid()
--   )
-- );

-- Automatically create a profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
