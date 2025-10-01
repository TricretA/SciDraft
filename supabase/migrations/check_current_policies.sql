-- Check current RLS policies on users and profiles tables
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'profiles') 
ORDER BY tablename, policyname;

-- Check table permissions
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'profiles')
    AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY table_name, grantee;

-- Check if trigger exists and is enabled
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema,
    trigger_catalog,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check function permissions
SELECT 
    routine_name,
    routine_schema,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';