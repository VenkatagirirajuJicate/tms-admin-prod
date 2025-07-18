-- Row Level Security (RLS) Policies for TMS Application
-- This ensures data security between students and admin users

-- Enable RLS on all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_route_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_transport_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_route_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create helper functions for RLS (using public schema)
CREATE OR REPLACE FUNCTION get_current_user_id() 
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_role() 
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'anon'
  )::text;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = get_current_user_id() 
    AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if current user is student
CREATE OR REPLACE FUNCTION is_student() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM students 
    WHERE id = get_current_user_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if current user is driver
CREATE OR REPLACE FUNCTION is_driver() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM drivers 
    WHERE id = get_current_user_id() 
    AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check user's admin permissions
CREATE OR REPLACE FUNCTION user_has_permission(module_name TEXT, action_name TEXT) 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_permissions ap
    JOIN admin_users au ON au.id = ap.admin_user_id
    WHERE au.id = get_current_user_id() 
    AND au.is_active = true
    AND (ap.module = module_name OR ap.module = 'all')
    AND action_name = ANY(ap.actions)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- STUDENTS POLICIES
CREATE POLICY "Admins can view all students" ON students
  FOR SELECT USING (is_admin());

CREATE POLICY "Authorized admins can manage students" ON students
  FOR ALL USING (user_has_permission('students', 'create'));

CREATE POLICY "Students can view their own profile" ON students
  FOR SELECT USING (id = get_current_user_id());

-- ROUTES POLICIES
CREATE POLICY "Everyone can view active routes" ON routes
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can view all routes" ON routes
  FOR SELECT USING (is_admin());

-- BOOKINGS POLICIES
CREATE POLICY "Students can view their own bookings" ON bookings
  FOR SELECT USING (student_id = get_current_user_id());

CREATE POLICY "Students can create their own bookings" ON bookings
  FOR INSERT WITH CHECK (student_id = get_current_user_id());

-- PAYMENTS POLICIES
CREATE POLICY "Students can view their own payments" ON payments
  FOR SELECT USING (student_id = get_current_user_id());

-- NOTIFICATIONS POLICIES
CREATE POLICY "Students can view notifications targeted to them" ON notifications
  FOR SELECT USING (
    is_active = true AND
    (target_audience IN ('all', 'students') OR 
     get_current_user_id() = ANY(specific_users))
  );

-- GRIEVANCES POLICIES
CREATE POLICY "Students can view their own grievances" ON grievances
  FOR SELECT USING (student_id = get_current_user_id());

CREATE POLICY "Students can create grievances" ON grievances
  FOR INSERT WITH CHECK (student_id = get_current_user_id());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
