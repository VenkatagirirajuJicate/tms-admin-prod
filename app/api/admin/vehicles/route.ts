import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('registration_number', { ascending: true });

    if (error) {
      console.error('Error fetching vehicles:', error);
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
    }

    // Transform database fields to camelCase to match interface
    const transformedVehicles = vehicles?.map(vehicle => ({
      id: vehicle.id,
      registrationNumber: vehicle.registration_number,
      model: vehicle.model,
      capacity: vehicle.capacity,
      fuelType: vehicle.fuel_type,
      insuranceExpiry: vehicle.insurance_expiry,
      fitnessExpiry: vehicle.fitness_expiry,
      lastMaintenance: vehicle.last_maintenance,
      nextMaintenance: vehicle.next_maintenance,
      status: vehicle.status,
      assignedRouteId: vehicle.assigned_route_id,
      mileage: vehicle.mileage,
      purchaseDate: vehicle.purchase_date,
      chassisNumber: vehicle.chassis_number,
      engineNumber: vehicle.engine_number,
      createdAt: vehicle.created_at,
      updatedAt: vehicle.updated_at
    })) || [];

    return NextResponse.json(transformedVehicles, { status: 200 });
  } catch (error) {
    console.error('Error in vehicles API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 