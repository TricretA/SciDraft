-- SciDraft Database Schema Migration
-- Creates all tables, relationships, and initial setup as per Full_Database.txt

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'lecturer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_plan AS ENUM ('free', 'one_time', 'pack', 'semester');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subject_type AS ENUM ('Biology', 'Chemistry', 'Physics');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('draft_limited', 'full_report', 'exported', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE export_format AS ENUM ('pdf', 'docx');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('mpesa', 'stripe');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE support_status AS ENUM ('open', 'in_progress', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('system', 'payment', 'manual', 'reminder');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- TABLE: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role user_role NOT NULL DEFAULT 'student',
    active_plan user_plan NOT NULL DEFAULT 'free',
    expires_at TIMESTAMP WITH TIME ZONE,
    preferred_mpesa_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- TABLE: units
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    subject subject_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: practicals
CREATE TABLE practicals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: manual_templates
CREATE TABLE manual_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practical_id UUID NOT NULL REFERENCES practicals(id) ON DELETE CASCADE,
    manual_url TEXT NOT NULL,
    manual_hash TEXT NOT NULL,
    parsed_text JSONB NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: manual_versions
CREATE TABLE manual_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manual_template_id UUID NOT NULL REFERENCES manual_templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    manual_url TEXT NOT NULL,
    parsed_text JSONB NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    practical_id UUID NOT NULL REFERENCES practicals(id),
    manual_id UUID REFERENCES manual_templates(id),
    title TEXT NOT NULL,
    results_json JSONB,
    draft_json JSONB,
    status report_status NOT NULL DEFAULT 'draft_limited',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: report_drawings
CREATE TABLE report_drawings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: exports
CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    format export_format NOT NULL,
    url TEXT NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: feedback
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: prompts
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: admin_logs
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: support_requests
CREATE TABLE support_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issue TEXT NOT NULL,
    status support_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_units_subject ON units(subject);
CREATE INDEX idx_practicals_unit_id ON practicals(unit_id);
CREATE INDEX idx_manual_templates_practical_id ON manual_templates(practical_id);
CREATE INDEX idx_manual_templates_hash ON manual_templates(manual_hash);
CREATE INDEX idx_manual_templates_approved ON manual_templates(approved);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_practical_id ON reports(practical_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_report_drawings_report_id ON report_drawings(report_id);
CREATE INDEX idx_exports_report_id ON exports(report_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_feedback_report_id ON feedback(report_id);
CREATE INDEX idx_prompts_name ON prompts(name);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_timestamp ON admin_logs(timestamp);
CREATE INDEX idx_support_requests_user_id ON support_requests(user_id);
CREATE INDEX idx_support_requests_status ON support_requests(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE practicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('manuals', 'manuals', false),
('drawings', 'drawings', false),
('exports', 'exports', false);

-- Grant basic permissions to anon and authenticated roles
GRANT SELECT ON units TO anon, authenticated;
GRANT SELECT ON practicals TO anon, authenticated;
GRANT SELECT ON manual_templates TO anon, authenticated;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON reports TO authenticated;
GRANT ALL PRIVILEGES ON report_drawings TO authenticated;
GRANT ALL PRIVILEGES ON exports TO authenticated;
GRANT ALL PRIVILEGES ON payments TO authenticated;
GRANT ALL PRIVILEGES ON feedback TO authenticated;
GRANT ALL PRIVILEGES ON support_requests TO authenticated;
GRANT ALL PRIVILEGES ON notifications TO authenticated;
GRANT ALL PRIVILEGES ON manual_versions TO authenticated;
GRANT SELECT ON prompts TO authenticated;
GRANT SELECT ON admin_logs TO authenticated;

-- Insert initial data
-- Create default admin user (will be updated with real auth)
INSERT INTO users (id, email, name, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@scidraft.com', 'System Admin', 'admin');

-- Insert sample subjects and units
INSERT INTO units (code, name, subject) VALUES 
('BIOL 200', 'General Biology II', 'Biology'),
('CHEM 101', 'General Chemistry I', 'Chemistry'),
('PHYS 150', 'General Physics I', 'Physics');

-- Insert default prompts for each subject
INSERT INTO prompts (name, prompt_text, version, created_by) VALUES 
('biology-v1', 'You are an expert biology lab report assistant. Generate structured lab reports based on the provided manual and student results. Focus on biological processes, observations, and scientific accuracy.', 1, '00000000-0000-0000-0000-000000000001'),
('chemistry-v1', 'You are an expert chemistry lab report assistant. Generate structured lab reports based on the provided manual and student results. Focus on chemical reactions, calculations, and safety protocols.', 1, '00000000-0000-0000-0000-000000000001'),
('physics-v1', 'You are an expert physics lab report assistant. Generate structured lab reports based on the provided manual and student results. Focus on measurements, calculations, and physical principles.', 1, '00000000-0000-0000-0000-000000000001');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_manual_templates_updated_at BEFORE UPDATE ON manual_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_requests_updated_at BEFORE UPDATE ON support_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();