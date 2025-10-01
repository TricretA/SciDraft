-- Verify the actual draft content in the database
-- Check the most recent draft to see if it contains valid JSON

SELECT 
  id,
  session_id,
  user_id,
  status,
  created_at,
  updated_at,
  CASE 
    WHEN draft IS NULL THEN 'NULL'
    WHEN draft = '' THEN 'EMPTY_STRING'
    WHEN LENGTH(draft) = 0 THEN 'ZERO_LENGTH'
    ELSE 'LENGTH_' || LENGTH(draft)
  END as draft_status,
  LEFT(draft, 200) as draft_preview,
  -- Try to validate if it's valid JSON
  CASE 
    WHEN draft IS NULL THEN 'NULL'
    WHEN draft = '' THEN 'EMPTY'
    ELSE 
      CASE 
        WHEN draft::json IS NOT NULL THEN 'VALID_JSON'
        ELSE 'INVALID_JSON'
      END
  END as json_validation
FROM drafts 
WHERE session_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY updated_at DESC
LIMIT 1;

-- Also check if we can parse the JSON and extract keys
SELECT 
  session_id,
  json_object_keys(draft::json) as draft_keys
FROM drafts 
WHERE session_id = '550e8400-e29b-41d4-a716-446655440000'
  AND draft IS NOT NULL 
  AND draft != ''
LIMIT 1;