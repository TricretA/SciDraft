-- Create Storage buckets for SciDraft

-- Insert storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('manuals', 'manuals', false, 52428800, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']), -- 50MB limit for PDF/DOCX
  ('drawings', 'drawings', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']), -- 10MB limit for images
  ('exports', 'exports', false, 52428800, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']) -- 50MB limit for exported files
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for manuals bucket
CREATE POLICY "Users can view their own manuals" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'manuals' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own manuals" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'manuals' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own manuals" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'manuals' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own manuals" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'manuals' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for drawings bucket
CREATE POLICY "Users can view their own drawings" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'drawings' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own drawings" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'drawings' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own drawings" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'drawings' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own drawings" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'drawings' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for exports bucket
CREATE POLICY "Users can view their own exports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exports' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own exports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exports' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own exports" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'exports' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own exports" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exports' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin policies - admins can access all files
CREATE POLICY "Admins can view all manuals" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'manuals' AND 
    public.is_admin()
  );

CREATE POLICY "Admins can view all drawings" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'drawings' AND 
    public.is_admin()
  );

CREATE POLICY "Admins can view all exports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exports' AND 
    public.is_admin()
  );

-- Teacher policies - teachers can view all student files (simplified for now)
CREATE POLICY "Teachers can view student manuals" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'manuals' AND 
    public.is_teacher()
  );

CREATE POLICY "Teachers can view student drawings" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'drawings' AND 
    public.is_teacher()
  );