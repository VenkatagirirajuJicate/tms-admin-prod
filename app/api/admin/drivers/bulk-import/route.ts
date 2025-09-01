import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to parse dates in various formats
function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.toLowerCase() === 'no' || dateStr.toLowerCase() === 'na') {
    return null;
  }

  try {
    // Handle various date formats
    if (dateStr.includes('/')) {
      // Format: dd/mm/yyyy (e.g., "06/01/2005") or dd / mm / yyyy
      const cleaned = dateStr.replace(/\s+/g, ''); // Remove all spaces
      const parts = cleaned.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    return null;
  } catch (error) {
    console.warn(`Could not parse date: ${dateStr}`, error);
    return null;
  }
}

// Helper function to normalize text fields
function normalizeText(text: string): string | null {
  if (!text || text.toLowerCase() === 'na' || text.toLowerCase() === 'no') {
    return null;
  }
  return text.trim();
}

// Helper function to normalize phone numbers
function normalizePhone(phone: string): string | null {
  if (!phone || phone.toLowerCase() === 'na') {
    return null;
  }
  // Remove any non-digit characters and ensure it starts with country code if needed
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`; // Add India country code
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  return cleaned;
}

// Helper function to generate license number if not provided
function generateLicenseNumber(name: string, routeNumber: string): string {
  const namePrefix = name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `DL-${namePrefix}-${routeNumber}-${timestamp}`;
}

// Helper function to generate password hash
async function generatePasswordHash(name: string): Promise<string> {
  // Generate a simple password based on first name + "123"
  const firstName = name.split('.').pop()?.split(' ')[0]?.toLowerCase() || 'driver';
  const password = `${firstName}123`;
  return await bcrypt.hash(password, 10);
}

export async function POST(request: NextRequest) {
  try {
    const { drivers } = await request.json();

    if (!drivers || !Array.isArray(drivers)) {
      return NextResponse.json(
        { error: 'Invalid driver data. Expected array of drivers.' },
        { status: 400 }
      );
    }

    console.log(`👨‍💼 Processing ${drivers.length} drivers for bulk import`);

    // First, let's check if we need to match route numbers to route IDs
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select('id, route_number, name');

    if (routesError) {
      console.warn('Could not fetch routes for matching:', routesError);
    }

    const routeMap = new Map();
    if (routes) {
      routes.forEach(route => {
        if (route.route_number) {
          routeMap.set(route.route_number.toString(), route.id);
        }
      });
    }

    const processedDrivers = await Promise.all(drivers.map(async (driver: any, index: number) => {
      try {
        const routeNumber = driver.routeNumber?.toString();
        const assignedRouteId = routeMap.get(routeNumber) || null;

        if (routeNumber && !assignedRouteId) {
          console.warn(`Route number ${routeNumber} not found for driver ${driver.fullName}`);
        }

        const processed = {
          name: normalizeText(driver.fullName),
          license_number: generateLicenseNumber(driver.fullName || 'Unknown', routeNumber || '0'),
          phone: normalizePhone(driver.phoneNumber),
          email: normalizeText(driver.emailAddress)?.toLowerCase(),
          password_hash: await generatePasswordHash(driver.fullName || 'driver'),
          date_of_joining: parseDate(driver.dateOfJoining),
          vehicle_type: normalizeText(driver.vehicle)?.toUpperCase() || 'BUS',
          assigned_route_id: assignedRouteId,
          experience_years: 0, // Will be calculated based on joining date later
          rating: 0.00,
          total_trips: 0,
          status: 'active' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Calculate experience years if we have joining date
        if (processed.date_of_joining) {
          const joiningDate = new Date(processed.date_of_joining);
          const now = new Date();
          const experienceYears = Math.floor((now.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
          processed.experience_years = Math.max(0, experienceYears);
        }

        console.log(`✅ Processed driver ${index + 1}: ${processed.name} - Route ${routeNumber}`);
        return processed;
      } catch (error) {
        console.error(`❌ Error processing driver at index ${index}:`, error);
        throw new Error(`Failed to process driver at index ${index}: ${error.message}`);
      }
    }));

    // Insert drivers into database
    console.log('💾 Inserting drivers into database...');
    const { data: insertedDrivers, error: insertError } = await supabase
      .from('drivers')
      .insert(processedDrivers)
      .select();

    if (insertError) {
      console.error('❌ Database insertion error:', insertError);
      return NextResponse.json(
        { 
          error: 'Failed to insert drivers', 
          details: insertError.message,
          code: insertError.code 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully inserted ${insertedDrivers?.length || 0} drivers`);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedDrivers?.length || 0} drivers`,
      inserted_count: insertedDrivers?.length || 0,
      drivers: insertedDrivers,
      route_mapping_info: {
        total_routes_available: routes?.length || 0,
        drivers_with_routes: processedDrivers.filter(d => d.assigned_route_id).length,
        drivers_without_routes: processedDrivers.filter(d => !d.assigned_route_id).length
      }
    });

  } catch (error) {
    console.error('❌ Bulk driver import error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}







