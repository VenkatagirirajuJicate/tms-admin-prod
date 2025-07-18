-- Seed Data for TMS Application
-- Insert sample institution
INSERT INTO institutions (id, name, address, contact_email, contact_phone) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'ABC University', '123 University Road, City Center', 'admin@abcuniversity.edu', '+1-234-567-8900');

-- Insert sample departments
INSERT INTO departments (id, institution_id, department_name) VALUES
('123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174000', 'Computer Science & Engineering'),
('123e4567-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174000', 'Mechanical Engineering'),
('123e4567-e89b-12d3-a456-426614174003', '123e4567-e89b-12d3-a456-426614174000', 'Business Administration');

-- Insert sample admin users
INSERT INTO admin_users (id, name, email, role, is_active) VALUES
('123e4567-e89b-12d3-a456-426614174100', 'John Smith', 'admin@tms.com', 'super_admin', true),
('123e4567-e89b-12d3-a456-426614174101', 'Sarah Johnson', 'transport@tms.com', 'transport_manager', true);
