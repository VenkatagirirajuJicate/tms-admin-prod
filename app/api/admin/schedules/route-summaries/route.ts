import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get all active routes
    const { data: routes, error: routesError } = await supabaseAdmin
      .from('routes')
      .select('*')
      .eq('status', 'active')
      .order('route_number');

    if (routesError) {
      throw routesError;
    }

    const routeSummaries = await Promise.all(
      routes.map(async (route: any) => {
        // Get next upcoming trip for this route (prioritize schedules with bookings)
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');
        
        const { data: allUpcomingTrips } = await supabaseAdmin
          .from('schedules')
          .select(`
            *,
            admin_scheduling_enabled,
            booking_enabled,
            booking_deadline,
            scheduling_instructions
          `)
          .eq('route_id', route.id)
          .gte('schedule_date', todayStr)
          .in('status', ['scheduled', 'in_progress'])
          .order('schedule_date', { ascending: true })
          .order('departure_time', { ascending: true });

        // Prioritize schedules with bookings, then by date/time
        const nextTrip = allUpcomingTrips?.find((trip: any) => trip.booked_seats > 0) || allUpcomingTrips?.[0] || null;

        // Get monthly statistics
        const currentMonth = new Date();
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const firstDayStr = firstDayOfMonth.getFullYear() + '-' + 
                          String(firstDayOfMonth.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(firstDayOfMonth.getDate()).padStart(2, '0');
        
        const lastDayStr = lastDayOfMonth.getFullYear() + '-' + 
                         String(lastDayOfMonth.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(lastDayOfMonth.getDate()).padStart(2, '0');

        const { data: monthlySchedules } = await supabaseAdmin
          .from('schedules')
          .select('*')
          .eq('route_id', route.id)
          .gte('schedule_date', firstDayStr)
          .lte('schedule_date', lastDayStr);

        const { data: monthlyBookings } = await supabaseAdmin
          .from('bookings')
          .select('*')
          .eq('route_id', route.id)
          .gte('trip_date', firstDayStr)
          .lte('trip_date', lastDayStr)
          .eq('status', 'confirmed');

        return {
          route: {
            id: route.id,
            routeNumber: route.route_number,
            routeName: route.route_name,
            startLocation: route.start_location,
            endLocation: route.end_location,
            fare: route.fare,
            totalCapacity: route.total_capacity
          },
          nextTrip: nextTrip ? {
            id: nextTrip.id,
            scheduleDate: nextTrip.schedule_date,
            departureTime: nextTrip.departure_time,
            arrivalTime: nextTrip.arrival_time,
            availableSeats: nextTrip.available_seats,
            bookedSeats: nextTrip.booked_seats,
            status: nextTrip.status,
            admin_scheduling_enabled: nextTrip.admin_scheduling_enabled || false,
            booking_enabled: nextTrip.booking_enabled || false,
            booking_deadline: nextTrip.booking_deadline || null,
            scheduling_instructions: nextTrip.scheduling_instructions || null
          } : null,
          totalSchedulesThisMonth: monthlySchedules?.length || 0,
          totalBookingsThisMonth: monthlyBookings?.length || 0
        };
      })
    );

    // Sort routes by booking activity (routes with bookings first)
    const sortedSummaries = routeSummaries.sort((a, b) => {
      // Routes with next trips first
      if (a.nextTrip && !b.nextTrip) return -1;
      if (!a.nextTrip && b.nextTrip) return 1;
      
      // Routes with more bookings first
      if (a.totalBookingsThisMonth !== b.totalBookingsThisMonth) {
        return b.totalBookingsThisMonth - a.totalBookingsThisMonth;
      }
      
      // Routes with more schedules first
      if (a.totalSchedulesThisMonth !== b.totalSchedulesThisMonth) {
        return b.totalSchedulesThisMonth - a.totalSchedulesThisMonth;
      }
      
      // Finally sort by route number
      return a.route.routeNumber.localeCompare(b.route.routeNumber);
    });

    return NextResponse.json(sortedSummaries);
  } catch (error) {
    console.error('Error fetching route summaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route summaries' },
      { status: 500 }
    );
  }
} 