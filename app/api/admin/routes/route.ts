import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: routes, error } = await supabase
      .from('routes')
      .select(`
        id,
        route_number,
        route_name,
        start_location,
        end_location,
        total_capacity,
        fare,
        departure_time,
        arrival_time,
        status,
        driver_id,
        vehicle_id
      `)
      .order('route_number');

    if (error) {
      console.error('Error fetching routes:', error);
      return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
    }

    // Transform database fields to camelCase to match interface
    const transformedRoutes = routes?.map(route => ({
      id: route.id,
      routeNumber: route.route_number,
      routeName: route.route_name,
      startLocation: route.start_location,
      endLocation: route.end_location,
      totalCapacity: route.total_capacity,
      fare: route.fare,
      departureTime: route.departure_time,
      arrivalTime: route.arrival_time,
      status: route.status,
      driverId: route.driver_id,
      vehicleId: route.vehicle_id
    })) || [];

    return NextResponse.json(transformedRoutes);
  } catch (error) {
    console.error('Error in routes API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 