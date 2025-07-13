import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create Supabase admin client (server-side only)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch routes from database
    const { data: routes, error } = await supabase
      .from('routes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch routes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: routes || [],
      count: routes?.length || 0
    });

  } catch (error) {
    console.error('Routes API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action, routeId, routeData, stops } = await request.json();

    if (action === 'getRouteStops') {
      return await getRouteStops(routeId);
    }

    if (action === 'addRoute') {
      return await addRoute(routeData, stops);
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Routes API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getRouteStops(routeId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: stops, error } = await supabase
      .from('route_stops')
      .select('*')
      .eq('route_id', routeId)
      .order('stop_order', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch route stops' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stops || []
    });

  } catch (error) {
    console.error('Error fetching route stops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route stops' },
      { status: 500 }
    );
  }
}

async function addRoute(routeData: any, stops: any[]) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert the route
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .insert([routeData])
      .select()
      .single();

    if (routeError) {
      console.error('Database error adding route:', routeError);
      return NextResponse.json(
        { error: 'Failed to add route' },
        { status: 500 }
      );
    }

    // Insert route stops if provided
    if (stops && stops.length > 0) {
      const stopsWithRouteId = stops.map(stop => ({
        ...stop,
        route_id: route.id
      }));

      const { error: stopsError } = await supabase
        .from('route_stops')
        .insert(stopsWithRouteId);

      if (stopsError) {
        console.error('Database error adding route stops:', stopsError);
        // If stops insertion fails, we might want to rollback the route
        // For now, we'll just log the error
      }
    }

    return NextResponse.json({
      success: true,
      data: route
    });

  } catch (error) {
    console.error('Error adding route:', error);
    return NextResponse.json(
      { error: 'Failed to add route' },
      { status: 500 }
    );
  }
} 