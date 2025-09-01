import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to parse time string to time format
function parseTime(timeStr: string): string {
  if (!timeStr || timeStr.toLowerCase() === 'no' || timeStr.toLowerCase() === 'na') {
    return '00:00';
  }
  
  // Handle formats like "07:20", "08:55", etc.
  if (timeStr.includes(':')) {
    return timeStr.trim();
  }
  
  return '00:00';
}

// Helper function to parse distance
function parseDistance(distanceStr: string): number {
  if (!distanceStr) return 0;
  
  // Extract numbers from strings like "40 KM", "47", etc.
  const match = distanceStr.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

// Helper function to normalize text fields
function normalizeText(text: string): string | null {
  if (!text || text.toLowerCase() === 'na' || text.toLowerCase() === 'no') {
    return null;
  }
  return text.trim();
}

// Helper function to parse latitude/longitude
function parseCoordinate(coordStr: string): number | null {
  if (!coordStr) return null;
  
  // Handle formats like "11.4452° N", "77.7307° E", or just "11.4452"
  const match = coordStr.match(/(\d+\.\d+)/);
  return match ? parseFloat(match[1]) : null;
}

export async function POST(request: NextRequest) {
  try {
    const { routes } = await request.json();

    if (!routes || !Array.isArray(routes)) {
      return NextResponse.json(
        { error: 'Invalid route data. Expected array of routes.' },
        { status: 400 }
      );
    }

    console.log(`🛣️ Processing ${routes.length} routes for bulk import`);

    // Get all drivers and vehicles for mapping
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, name');

    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, registration_number, capacity');

    if (driversError || vehiclesError) {
      console.error('Error fetching drivers/vehicles:', driversError || vehiclesError);
      return NextResponse.json(
        { error: 'Failed to fetch drivers and vehicles for mapping' },
        { status: 500 }
      );
    }

    // Create mapping objects for quick lookup
    const driverMap = new Map();
    drivers?.forEach(driver => {
      driverMap.set(driver.name.toUpperCase(), driver.id);
    });

    const vehicleMap = new Map();
    vehicles?.forEach(vehicle => {
      vehicleMap.set(vehicle.registration_number, { id: vehicle.id, capacity: vehicle.capacity });
    });

    let successfulDriverAssignments = 0;
    let failedDriverAssignments = 0;
    let successfulVehicleAssignments = 0;
    let failedVehicleAssignments = 0;

    const processedRoutes = routes.map((route: any, index: number) => {
      try {
        // Map driver
        const driverName = route.assignedDriverMapped || route.assignedDriver;
        const driverId = driverName ? driverMap.get(driverName.toUpperCase()) : null;
        
        if (driverName && driverId) {
          successfulDriverAssignments++;
          console.log(`✅ Driver matched: ${driverName} -> ${driverId}`);
        } else if (driverName) {
          failedDriverAssignments++;
          console.warn(`⚠️ Driver not found: ${driverName}`);
        }

        // Map vehicle
        const vehicleReg = route.assignedVehicleMapped || route.assignedVehicle;
        const vehicleInfo = vehicleReg ? vehicleMap.get(vehicleReg) : null;
        const vehicleId = vehicleInfo?.id || null;
        const vehicleCapacity = vehicleInfo?.capacity || 60; // Default capacity
        
        if (vehicleReg && vehicleId) {
          successfulVehicleAssignments++;
          console.log(`✅ Vehicle matched: ${vehicleReg} -> ${vehicleId}`);
        } else if (vehicleReg) {
          failedVehicleAssignments++;
          console.warn(`⚠️ Vehicle not found: ${vehicleReg}`);
        }

        const processed = {
          route_number: route.routeNumber,
          route_name: route.routeName,
          start_location: route.startLocation,
          end_location: route.endLocation,
          departure_time: parseTime(route.morningDeparture),
          arrival_time: parseTime(route.morningArrival),
          distance: parseDistance(route.distance),
          duration: normalizeText(route.duration) || '1 HOUR',
          total_capacity: vehicleCapacity,
          current_passengers: 0,
          status: 'active' as const,
          driver_id: driverId,
          vehicle_id: vehicleId,
          fare: parseFloat(route.fare) || 5000,
          start_latitude: parseCoordinate(route.startLatitude),
          start_longitude: parseCoordinate(route.startLongitude),
          end_latitude: parseCoordinate(route.endLatitude),
          end_longitude: parseCoordinate(route.endLongitude),
          live_tracking_enabled: true,
          tracking_interval: 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log(`✅ Processed route ${index + 1}: ${processed.route_number} - ${processed.route_name}`);
        return processed;
      } catch (error) {
        console.error(`❌ Error processing route at index ${index}:`, error);
        throw new Error(`Failed to process route at index ${index}: ${error.message}`);
      }
    });

    // Insert routes into database
    console.log('💾 Inserting routes into database...');
    const { data: insertedRoutes, error: insertError } = await supabase
      .from('routes')
      .insert(processedRoutes)
      .select();

    if (insertError) {
      console.error('❌ Database insertion error:', insertError);
      return NextResponse.json(
        { 
          error: 'Failed to insert routes', 
          details: insertError.message,
          code: insertError.code 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully inserted ${insertedRoutes?.length || 0} routes`);

    // Update driver assignments
    if (insertedRoutes) {
      console.log('🔄 Updating driver route assignments...');
      for (const route of insertedRoutes) {
        if (route.driver_id) {
          await supabase
            .from('drivers')
            .update({ assigned_route_id: route.id })
            .eq('id', route.driver_id);
        }
      }

      console.log('🔄 Updating vehicle route assignments...');
      for (const route of insertedRoutes) {
        if (route.vehicle_id) {
          await supabase
            .from('vehicles')
            .update({ assigned_route_id: route.id })
            .eq('id', route.vehicle_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedRoutes?.length || 0} routes`,
      inserted_count: insertedRoutes?.length || 0,
      routes: insertedRoutes,
      assignment_info: {
        successful_driver_assignments: successfulDriverAssignments,
        failed_driver_assignments: failedDriverAssignments,
        successful_vehicle_assignments: successfulVehicleAssignments,
        failed_vehicle_assignments: failedVehicleAssignments,
        total_drivers_available: drivers?.length || 0,
        total_vehicles_available: vehicles?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Bulk route import error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}







