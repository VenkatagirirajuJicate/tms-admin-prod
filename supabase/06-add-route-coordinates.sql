-- Route Coordinates Migration for Live Tracking
-- Run this migration to add latitude/longitude fields to existing routes table

-- Add coordinate fields to routes table
ALTER TABLE routes ADD COLUMN IF NOT EXISTS start_latitude DECIMAL(10,8);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS start_longitude DECIMAL(11,8);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS end_latitude DECIMAL(10,8);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS end_longitude DECIMAL(11,8);

-- Add indexes for coordinate-based queries (live tracking performance)
CREATE INDEX IF NOT EXISTS idx_routes_start_coordinates ON routes(start_latitude, start_longitude);
CREATE INDEX IF NOT EXISTS idx_routes_end_coordinates ON routes(end_latitude, end_longitude);
CREATE INDEX IF NOT EXISTS idx_routes_coordinates_combined ON routes(start_latitude, start_longitude, end_latitude, end_longitude);

-- Add helpful comments for documentation
COMMENT ON COLUMN routes.start_latitude IS 'Latitude coordinate of route starting point for live tracking maps';
COMMENT ON COLUMN routes.start_longitude IS 'Longitude coordinate of route starting point for live tracking maps';
COMMENT ON COLUMN routes.end_latitude IS 'Latitude coordinate of route destination point for live tracking maps';
COMMENT ON COLUMN routes.end_longitude IS 'Longitude coordinate of route destination point for live tracking maps';
