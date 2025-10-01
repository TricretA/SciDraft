-- Update admins table with specific administrator credentials
-- This migration adds the three admin accounts with properly hashed passwords

-- First, let's ensure we have the bcrypt extension for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clear any existing admin data to avoid conflicts
TRUNCATE TABLE "public"."admins" RESTART IDENTITY CASCADE;

-- Insert the three admin accounts with hashed passwords
-- Note: Using crypt() function with bcrypt algorithm for secure password hashing
INSERT INTO "public"."admins" 
("id", "name", "email", "role", "phone_number", "password_hash", "created_at") 
VALUES 
(
  '0319368a-49eb-44cb-a2db-89d2dc761f53', 
  'Vanessa', 
  'vanessa@scidraft.com', 
  'Vanessa', -- Using name as role per constraint
  '0796484962', 
  crypt('Vanessa@Sci Draft12', gen_salt('bf', 12)), -- Bcrypt hash with cost factor 12
  '2025-01-21 08:31:48.458338+00'
),
(
  '11ee2c71-f420-48fe-8c71-b28994f75e20', 
  'Shem', 
  'shem@scidraft.com', 
  'Shem', -- Using name as role per constraint
  '0715372561', 
  crypt('Shem@Sci Draft12', gen_salt('bf', 12)), -- Bcrypt hash with cost factor 12
  '2025-01-21 08:31:48.458338+00'
),
(
  '9b8ca816-5264-4d2e-ad59-2b17663d5d02', 
  'Wazimu', 
  'wazimu@scidraft.com', 
  'Wazimu', -- Using name as role per constraint
  '0790295408', 
  crypt('Bonnke@Sci Draft12', gen_salt('bf', 12)), -- Bcrypt hash with cost factor 12
  '2025-01-21 08:31:48.458338+00'
);

-- Verify the insertion
SELECT id, name, email, role, phone_number, created_at 
FROM "public"."admins" 
ORDER BY created_at;

-- Grant necessary permissions to roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."admins" TO authenticated;
GRANT SELECT ON "public"."admins" TO anon;

-- Add comment for documentation
COMMENT ON TABLE "public"."admins" IS 'Administrator accounts with secure bcrypt password hashing';