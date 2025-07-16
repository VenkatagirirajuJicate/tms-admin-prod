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

    // Fetch drivers from database
    const { data: rawDrivers, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch drivers' },
        { status: 500 }
      );
    }

    // Transform data to match frontend expectations
    const drivers = (rawDrivers || []).map(driver => ({
      id: driver.id,
      driver_name: driver.name || 'Unknown Driver', // Schema uses 'name' not 'driver_name'
      phone_number: driver.phone || 'N/A', // Schema uses 'phone' not 'phone_number'
      email: driver.email || 'N/A',
      license_number: driver.license_number || 'N/A',
      experience_years: driver.experience_years || 0,
      rating: driver.rating || 4.0,
      status: driver.status || 'active',
      created_at: driver.created_at,
      updated_at: driver.updated_at,
      // Default relationship fields
      routes: null,
      vehicles: null,
      total_trips: driver.total_trips || 0
    }));

    return NextResponse.json({ 
      success: true, 
      data: drivers,
      count: drivers.length
    });

  } catch (error) {
    console.error('Drivers API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 