-- Inspect recent drafts data to debug null content issue
-- This will help us see what's actually stored in the drafts table

-- First, let's see the raw data
SELECT 
    id,
    session_id,
    user_id,
    CASE 
        WHEN draft IS NULL THEN 'NULL'
        WHEN draft = '' THEN 'EMPTY_STRING'
        WHEN LENGTH(draft) = 0 THEN 'ZERO_LENGTH'
        ELSE CONCAT('LENGTH_', LENGTH(draft))
    END as draft_status,
    CASE 
        WHEN draft IS NOT NULL AND LENGTH(draft) > 0 THEN LEFT(draft, 200)
        ELSE 'NO_CONTENT'
    END as draft_preview,
    status,
    created_at,
    updated_at
FROM drafts 
WHERE session_id = '550e8400-e29b-41d4-a716-446655440000'
OR created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Also check if there are any permission issues
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'drafts'
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;