import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching drivers:', error);
      return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
    }

    // Transform database fields to camelCase to match interface
    const transformedDrivers = drivers?.map(driver => ({
      id: driver.id,
      name: driver.name,
      licenseNumber: driver.license_number,
      phone: driver.phone,
      email: driver.email,
      experienceYears: driver.experience_years,
      rating: driver.rating,
      totalTrips: driver.total_trips,
      status: driver.status,
      address: driver.address,
      emergencyContactName: driver.emergency_contact_name,
      emergencyContactPhone: driver.emergency_contact_phone,
      licenseExpiry: driver.license_expiry,
      medicalCertificateExpiry: driver.medical_certificate_expiry,
      createdAt: driver.created_at,
      updatedAt: driver.updated_at
    })) || [];

    return NextResponse.json(transformedDrivers, { status: 200 });
  } catch (error) {
    console.error('Error in drivers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 