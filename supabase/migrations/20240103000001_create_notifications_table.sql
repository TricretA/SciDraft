-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT,
  type TEXT NOT NULL CHECK (type IN ('signup', 'login', 'draft', 'report', 'payment_success', 'payment_failed', 'password_change', 'system')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all notifications" ON notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() 
      AND admins.role IN ('Super Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() 
      AND admins.role IN ('Super Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can update notifications" ON notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() 
      AND admins.role IN ('Super Admin', 'Admin')
    )
  );

CREATE POLICY "Admins can delete notifications" ON notifications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid() 
      AND admins.role IN ('Super Admin', 'Admin')
    )
  );

-- Grant permissions to authenticated role
GRANT ALL PRIVILEGES ON notifications TO authenticated;
GRANT ALL PRIVILEGES ON notifications TO anon;

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();