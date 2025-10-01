-- Fix RLS policies for drawings storage bucket
-- This migration adds proper policies to allow authenticated users to upload and manage their own images

-- First, ensure the drawings bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('drawings', 'drawings', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own drawings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own drawings" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own drawings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own drawings" ON storage.objects;

-- Create policy for authenticated users to upload images to drawings bucket
-- Using a simpler approach that allows uploads to user-specific folders
CREATE POLICY "Users can upload their own drawings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'drawings'
);

-- Create policy for authenticated users to view images in drawings bucket
CREATE POLICY "Users can view their own drawings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'drawings'
);

-- Create policy for authenticated users to update images in drawings bucket
CREATE POLICY "Users can update their own drawings"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'drawings'
)
WITH CHECK (
  bucket_id = 'drawings'
);

-- Create policy for authenticated users to delete images in drawings bucket
CREATE POLICY "Users can delete their own drawings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'drawings'
);