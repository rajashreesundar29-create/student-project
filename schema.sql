-- ====================================================================
-- 1. Create "students" Table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    department TEXT NOT NULL,
    year INTEGER NOT NULL,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ====================================================================
-- 2. Enable Row Level Security (RLS) on students
-- ====================================================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 3. Create RLS Policies for students table
-- ====================================================================

-- Policy: Authenticated users can insert their own student records
CREATE POLICY "Users can insert their own students" 
ON public.students 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can view their own student records
CREATE POLICY "Users can view their own students" 
ON public.students 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Authenticated users can update their own student records
CREATE POLICY "Users can update their own students" 
ON public.students 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can delete their own student records
CREATE POLICY "Users can delete their own students" 
ON public.students 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Index for optimizing user-specific lookups
CREATE INDEX IF NOT EXISTS students_user_id_idx ON public.students(user_id);

-- ====================================================================
-- 4. Setup Storage Bucket (SQL instructions or initialization)
-- ====================================================================
-- Note: In Supabase, you can create a bucket from the Dashboard, or via SQL:
-- Insert bucket definition if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-images', 'student-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage (storage.objects)
-- Allowing authenticated users to manage files in their user folder within 'student-images'
CREATE POLICY "Allow authenticated uploads"
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'student-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated read"
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
    bucket_id = 'student-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated updates"
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'student-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated delete"
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'student-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
