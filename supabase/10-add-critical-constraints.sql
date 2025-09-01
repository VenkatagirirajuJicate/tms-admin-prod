-- ================================================
-- TMS Admin Application - Critical Database Constraints
-- Migration: 10-add-critical-constraints.sql
-- Purpose: Add missing constraints, validations, and indexes
-- ================================================

-- Add unique constraint for route numbers (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_route_number') THEN
        ALTER TABLE routes ADD CONSTRAINT unique_route_number UNIQUE (route_number);
        RAISE NOTICE 'Added unique constraint for route_number';
    ELSE
        RAISE NOTICE 'Unique constraint for route_number already exists';
    END IF;
END $$;

-- Add GPS coordinate validation constraints for routes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_start_coordinates') THEN
        ALTER TABLE routes ADD CONSTRAINT valid_start_coordinates 
        CHECK (
            (start_latitude IS NULL OR (start_latitude >= -90 AND start_latitude <= 90)) AND
            (start_longitude IS NULL OR (start_longitude >= -180 AND start_longitude <= 180))
        );
        RAISE NOTICE 'Added GPS validation constraint for start coordinates';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_end_coordinates') THEN
        ALTER TABLE routes ADD CONSTRAINT valid_end_coordinates 
        CHECK (
            (end_latitude IS NULL OR (end_latitude >= -90 AND end_latitude <= 90)) AND
            (end_longitude IS NULL OR (end_longitude >= -180 AND end_longitude <= 180))
        );
        RAISE NOTICE 'Added GPS validation constraint for end coordinates';
    END IF;
END $$;

-- Add GPS coordinate validation constraints for route_stops
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_stop_coordinates') THEN
        ALTER TABLE route_stops ADD CONSTRAINT valid_stop_coordinates 
        CHECK (
            (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)) AND
            (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
        );
        RAISE NOTICE 'Added GPS validation constraint for stop coordinates';
    END IF;
END $$;

-- Add time validation constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_route_times') THEN
        ALTER TABLE routes ADD CONSTRAINT valid_route_times 
        CHECK (departure_time < arrival_time);
        RAISE NOTICE 'Added time validation constraint for routes';
    END IF;
END $$;

-- Add capacity validation constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_route_capacity') THEN
        ALTER TABLE routes ADD CONSTRAINT valid_route_capacity 
        CHECK (
            total_capacity > 0 AND 
            current_passengers >= 0 AND 
            current_passengers <= total_capacity
        );
        RAISE NOTICE 'Added capacity validation constraint for routes';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_vehicle_capacity') THEN
        ALTER TABLE vehicles ADD CONSTRAINT valid_vehicle_capacity 
        CHECK (capacity > 0);
        RAISE NOTICE 'Added capacity validation constraint for vehicles';
    END IF;
END $$;

-- Add sequence order validation for route stops
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_sequence_order') THEN
        ALTER TABLE route_stops ADD CONSTRAINT valid_sequence_order 
        CHECK (sequence_order > 0);
        RAISE NOTICE 'Added sequence order validation constraint for route stops';
    END IF;
END $$;

-- Add unique constraint for sequence order per route
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_route_sequence') THEN
        ALTER TABLE route_stops ADD CONSTRAINT unique_route_sequence 
        UNIQUE (route_id, sequence_order);
        RAISE NOTICE 'Added unique sequence order constraint per route';
    END IF;
END $$;

-- Ensure CASCADE DELETE for route_stops (if not already set)
DO $$ 
BEGIN
    -- Check if the foreign key exists and has the correct cascade behavior
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.referential_constraints rc
        JOIN information_schema.key_column_usage kcu
        ON rc.constraint_name = kcu.constraint_name
        WHERE rc.constraint_name = 'route_stops_route_id_fkey'
        AND rc.delete_rule = 'CASCADE'
    ) THEN
        -- Drop existing constraint if exists
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'route_stops_route_id_fkey') THEN
            ALTER TABLE route_stops DROP CONSTRAINT route_stops_route_id_fkey;
        END IF;
        
        -- Add new constraint with CASCADE DELETE
        ALTER TABLE route_stops ADD CONSTRAINT route_stops_route_id_fkey 
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;
        RAISE NOTICE 'Updated route_stops foreign key with CASCADE DELETE';
    ELSE
        RAISE NOTICE 'CASCADE DELETE for route_stops already configured';
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_driver_id ON routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_id ON routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_sequence ON route_stops(route_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_students_allocated_route ON students(allocated_route_id);

-- Add function to validate stop times are in sequence
CREATE OR REPLACE FUNCTION validate_stop_time_sequence()
RETURNS TRIGGER AS $$
DECLARE
    route_departure_time TIME;
    route_arrival_time TIME;
    prev_stop_time TIME;
    next_stop_time TIME;
BEGIN
    -- Get route departure and arrival times
    SELECT departure_time, arrival_time INTO route_departure_time, route_arrival_time
    FROM routes WHERE id = NEW.route_id;
    
    -- Check if stop time is within route timeframe
    IF NEW.stop_time <= route_departure_time THEN
        RAISE EXCEPTION 'Stop time must be after route departure time';
    END IF;
    
    IF NEW.stop_time >= route_arrival_time THEN
        RAISE EXCEPTION 'Stop time must be before route arrival time';
    END IF;
    
    -- Check if stop time is after previous stop
    SELECT stop_time INTO prev_stop_time
    FROM route_stops 
    WHERE route_id = NEW.route_id 
    AND sequence_order = NEW.sequence_order - 1;
    
    IF prev_stop_time IS NOT NULL AND NEW.stop_time <= prev_stop_time THEN
        RAISE EXCEPTION 'Stop time must be after previous stop time';
    END IF;
    
    -- Check if stop time is before next stop
    SELECT stop_time INTO next_stop_time
    FROM route_stops 
    WHERE route_id = NEW.route_id 
    AND sequence_order = NEW.sequence_order + 1;
    
    IF next_stop_time IS NOT NULL AND NEW.stop_time >= next_stop_time THEN
        RAISE EXCEPTION 'Stop time must be before next stop time';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stop time validation
DROP TRIGGER IF EXISTS trg_validate_stop_time_sequence ON route_stops;
CREATE TRIGGER trg_validate_stop_time_sequence
    BEFORE INSERT OR UPDATE ON route_stops
    FOR EACH ROW EXECUTE FUNCTION validate_stop_time_sequence();

-- Add function to automatically update route capacity based on current passengers
CREATE OR REPLACE FUNCTION update_route_passenger_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment current passengers
        UPDATE routes 
        SET current_passengers = COALESCE(current_passengers, 0) + 1
        WHERE id = NEW.allocated_route_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle route change
        IF OLD.allocated_route_id IS DISTINCT FROM NEW.allocated_route_id THEN
            -- Decrement from old route
            IF OLD.allocated_route_id IS NOT NULL THEN
                UPDATE routes 
                SET current_passengers = GREATEST(COALESCE(current_passengers, 0) - 1, 0)
                WHERE id = OLD.allocated_route_id;
            END IF;
            -- Increment to new route
            IF NEW.allocated_route_id IS NOT NULL THEN
                UPDATE routes 
                SET current_passengers = COALESCE(current_passengers, 0) + 1
                WHERE id = NEW.allocated_route_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement current passengers
        IF OLD.allocated_route_id IS NOT NULL THEN
            UPDATE routes 
            SET current_passengers = GREATEST(COALESCE(current_passengers, 0) - 1, 0)
            WHERE id = OLD.allocated_route_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic passenger count updates
DROP TRIGGER IF EXISTS trg_update_route_passenger_count ON students;
CREATE TRIGGER trg_update_route_passenger_count
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW EXECUTE FUNCTION update_route_passenger_count();

-- Add validation function for vehicle maintenance dates
CREATE OR REPLACE FUNCTION validate_vehicle_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Check insurance expiry is in the future (for new vehicles)
    IF TG_OP = 'INSERT' AND NEW.insurance_expiry IS NOT NULL AND NEW.insurance_expiry < CURRENT_DATE THEN
        RAISE EXCEPTION 'Insurance expiry date cannot be in the past for new vehicles';
    END IF;
    
    -- Check fitness expiry is in the future (for new vehicles)
    IF TG_OP = 'INSERT' AND NEW.fitness_expiry IS NOT NULL AND NEW.fitness_expiry < CURRENT_DATE THEN
        RAISE EXCEPTION 'Fitness certificate expiry date cannot be in the past for new vehicles';
    END IF;
    
    -- Check maintenance dates are logical
    IF NEW.last_maintenance IS NOT NULL AND NEW.next_maintenance IS NOT NULL 
       AND NEW.next_maintenance <= NEW.last_maintenance THEN
        RAISE EXCEPTION 'Next maintenance date must be after last maintenance date';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vehicle date validation
DROP TRIGGER IF EXISTS trg_validate_vehicle_dates ON vehicles;
CREATE TRIGGER trg_validate_vehicle_dates
    BEFORE INSERT OR UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION validate_vehicle_dates();

-- Add data integrity checks and cleanup
DO $$ 
BEGIN
    -- Clean up any invalid current_passengers counts
    UPDATE routes 
    SET current_passengers = COALESCE((
        SELECT COUNT(*) 
        FROM students 
        WHERE allocated_route_id = routes.id
    ), 0)
    WHERE current_passengers IS NULL OR current_passengers < 0;
    
    RAISE NOTICE 'Cleaned up route passenger counts';
END $$;

RAISE NOTICE '=== Critical Database Constraints Migration Complete ===';
RAISE NOTICE 'Added:';
RAISE NOTICE '- Unique constraints for route numbers';
RAISE NOTICE '- GPS coordinate validation';
RAISE NOTICE '- Time sequence validation';
RAISE NOTICE '- Capacity validation';
RAISE NOTICE '- Performance indexes';
RAISE NOTICE '- Automatic passenger count triggers';
RAISE NOTICE '- Vehicle maintenance date validation';
RAISE NOTICE '- Enhanced referential integrity';





