# Update Supabase Schema to Use Integer Resource IDs

Run these SQL commands in your Supabase SQL Editor:

## Step 1: Drop dependent tables
```sql
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS maintenance CASCADE;
```

## Step 2: Modify resources table to use INTEGER IDs
```sql
ALTER TABLE resources 
  ALTER COLUMN id SET DEFAULT nextval('resources_id_seq');
  
-- Or if the sequence doesn't exist, create and set it:
CREATE SEQUENCE IF NOT EXISTS resources_id_seq START WITH 1;
ALTER TABLE resources 
  ALTER COLUMN id SET DEFAULT nextval('resources_id_seq');
```

## Step 3: Recreate bookings table with INTEGER resource_id
```sql
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

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_resource_id ON bookings(resource_id);
```

## Step 4: Recreate maintenance table with INTEGER resource_id
```sql
CREATE TABLE maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(255) DEFAULT 'Scheduled maintenance',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_maintenance_resource_id ON maintenance(resource_id);
```

## After running the SQL:

1. Clear all existing resources:
```sql
DELETE FROM resources;
```

2. Then run this Python command to seed the 12 resources:
```bash
python update_schema_supabase.py
```

The resources will be auto-assigned IDs 1-12!
