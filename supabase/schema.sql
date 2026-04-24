-- ERABS Supabase Database Schema
-- This file defines all tables, relationships, and initial data for the ERABS system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with manager-employee mapping
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Self-referential for manager-employee mapping
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    capacity INTEGER DEFAULT 1,
    location VARCHAR(255) DEFAULT 'HQ',
    avail_start INTEGER DEFAULT 8,
    avail_end INTEGER DEFAULT 20,
    requires_approval BOOLEAN DEFAULT FALSE,
    department_restricted UUID REFERENCES departments(id) ON DELETE SET NULL,
    max_duration_min INTEGER DEFAULT 240,
    active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500) DEFAULT '',
    scene_type VARCHAR(50) DEFAULT 'normal',
    amenities VARCHAR(500) DEFAULT 'wifi,display,sound,chairs',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    attendees INTEGER DEFAULT 1,
    purpose TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    approver_comment TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance table
CREATE TABLE maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(255) DEFAULT 'Scheduled maintenance',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID,
    details TEXT DEFAULT '',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_scene_type ON resources(scene_type);
CREATE INDEX idx_resources_active ON resources(active);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_resource_id ON bookings(resource_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_maintenance_resource_id ON maintenance(resource_id);
CREATE INDEX idx_maintenance_start_time ON maintenance(start_time);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial departments
INSERT INTO departments (name, description) VALUES
('IT', 'Information Technology Department'),
('Engineering', 'Engineering and Development'),
('HR', 'Human Resources'),
('Finance', 'Finance and Accounting'),
('Marketing', 'Marketing and Sales'),
('Operations', 'Operations and Facilities'),
('General', 'General Purpose')
ON CONFLICT (name) DO NOTHING;

-- Insert initial users (passwords will be hashed by the application)
-- These are placeholder records - actual password hashing should be done by the backend
INSERT INTO users (email, name, hashed_password, role, department_id) VALUES
('admin@erabs.io', 'Ada Admin', 'PLACEHOLDER_HASH', 'admin', (SELECT id FROM departments WHERE name = 'IT')),
('manager@erabs.io', 'Max Manager', 'PLACEHOLDER_HASH', 'manager', (SELECT id FROM departments WHERE name = 'Engineering')),
('employee@erabs.io', 'Eve Employee', 'PLACEHOLDER_HASH', 'employee', (SELECT id FROM departments WHERE name = 'Engineering'))
ON CONFLICT (email) DO NOTHING;

-- Set manager for employee (employee reports to manager)
UPDATE users 
SET manager_id = (SELECT id FROM users WHERE email = 'manager@erabs.io')
WHERE email = 'employee@erabs.io';

-- Insert initial resources
INSERT INTO resources (name, type, description, capacity, location, requires_approval, scene_type, amenities, image_url) VALUES
('Aurora Boardroom', 'room', 'Executive boardroom with panoramic 4K display, immersive audio and conference-grade lighting.', 12, 'Floor 4', TRUE, 'large', 'wifi,display,sound,projector,chairs', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80'),
('Titan Conference Hall', 'room', 'Large-capacity hall for company-wide town-halls, client pitches and training sessions.', 20, 'Floor 5', TRUE, 'large', 'wifi,display,sound,projector,chairs,parking', 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1200&q=80'),
('Quantum Lab', 'room', 'Innovation lab with writable walls, standing desks and dev monitors.', 8, 'Floor 3', TRUE, 'medium', 120, 'wifi,display,sound,chairs', 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80'),
('Orbit Huddle Space', 'room', 'Cozy huddle room for brainstorming, sprint planning and design reviews.', 6, 'Floor 2', FALSE, 'medium', 80, 'wifi,display,chairs', 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80'),
('Nova Meeting Room', 'room', 'Standard meeting room with a circular conference table and modern AV setup.', 8, 'Floor 2', FALSE, 'normal', 90, 'wifi,display,sound,chairs', 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&q=80'),
('Helix Collaboration Room', 'room', 'Collaborative meeting space with glass walls and ergonomic seating for 8.', 8, 'Floor 3', FALSE, 'normal', 90, 'wifi,display,sound,chairs', 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80'),
('Nebula Focus Pod', 'room', 'Soundproof 1-on-1 collaboration pod with integrated display and acoustic panels.', 2, 'Floor 2', FALSE, 'cabin', 40, 'wifi,display,chairs', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80'),
('Zenith Focus Cabin', 'room', 'Premium focus cabin for deep-work, interviews or 1:1 mentorship sessions.', 2, 'Floor 4', FALSE, 'cabin', 50, 'wifi,display,chairs', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80'),
('Executive Cabin — Summit', 'room', 'Private executive cabin with plush seating and floor-to-ceiling windows.', 4, 'Floor 6', TRUE, 'manager', 200, 'wifi,display,sound,chairs,parking', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80'),
('Galaxy War Room', 'room', 'Executive strategy cabin with private workstations and presentation screens.', 6, 'Floor 6', TRUE, 'manager', 220, 'wifi,display,sound,projector,chairs', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80'),
('Chess Lounge', 'recreation', 'Quiet chess lounge with two premium chess boards, analog clocks and leather armchairs. Open to everyone — no approval needed.', 4, 'Floor 1 · Recreation Wing', FALSE, 'chess', 20, 'wifi,chairs', 'https://images.unsplash.com/photo-1560174038-594a18c76bc1?w=1200&q=80'),
('Foosball Arena', 'recreation', 'Championship-grade foosball table with LED scoreboard. Great for quick breaks and team bonding.', 4, 'Floor 1 · Recreation Wing', FALSE, 'foosball', 20, 'wifi,sound', 'https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=1200&q=80')
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can update any user" ON users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Resources policies
CREATE POLICY "Anyone can view active resources" ON resources FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage resources" ON resources FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Managers can view department bookings" ON bookings FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id::text = auth.uid()::text 
        AND u.role IN ('manager', 'admin')
    )
);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (user_id::text = auth.uid()::text);
CREATE POLICY "Managers can approve bookings" ON bookings FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id::text = auth.uid()::text 
        AND u.role IN ('manager', 'admin')
    )
);

-- Maintenance policies
CREATE POLICY "Anyone can view maintenance" ON maintenance FOR SELECT USING (true);
CREATE POLICY "Admins can manage maintenance" ON maintenance FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- Chat messages policies
CREATE POLICY "Users can view own messages" ON chat_messages FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can insert own messages" ON chat_messages FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
CREATE POLICY "Users can delete own messages" ON chat_messages FOR DELETE USING (user_id::text = auth.uid()::text);

-- Departments policies
CREATE POLICY "Anyone can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON departments FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);
