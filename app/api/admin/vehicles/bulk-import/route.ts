import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    if (dateStr.includes('.')) {
      // Format: dd.mm.yyyy (e.g., "03.04.2026")
      const [day, month, year] = dateStr.split('.');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else if (dateStr.includes('/')) {
      // Format: mm/yyyy (e.g., "2/2005") or dd/mm/yyyy
      const parts = dateStr.split('/');
      if (parts.length === 2) {
        // mm/yyyy format
        const [month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-01`;
      } else if (parts.length === 3) {
        // dd/mm/yyyy format
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } else if (dateStr.includes('-')) {
      // Format: Aug-24, Month-Year
      if (dateStr.toLowerCase().includes('aug')) {
        const year = `20${dateStr.split('-')[1]}`;
        return `${year}-08-01`;
      }
    } else if (dateStr.match(/^\d{4}$/)) {
      // Just year (e.g., "2007")
      return `${dateStr}-01-01`;
    } else if (dateStr.toLowerCase().startsWith('aug')) {
      // Format: Aug24 or AugXX
      const yearPart = dateStr.substring(3);
      const year = yearPart.length === 2 ? `20${yearPart}` : yearPart;
      return `${year}-08-01`;
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

// Helper function to parse fuel type
function parseFuelType(fuelType: string): 'diesel' | 'petrol' | 'electric' | 'cng' {
  const normalized = fuelType.toLowerCase().trim();
  switch (normalized) {
    case 'diesel':
      return 'diesel';
    case 'petrol':
    case 'gasoline':
      return 'petrol';
    case 'electric':
      return 'electric';
    case 'cng':
      return 'cng';
    default:
      return 'diesel'; // Default fallback
  }
}

export async function POST(request: NextRequest) {
  try {
    const { vehicles } = await request.json();

    if (!vehicles || !Array.isArray(vehicles)) {
      return NextResponse.json(
        { error: 'Invalid vehicle data. Expected array of vehicles.' },
        { status: 400 }
      );
    }

    console.log(`🚗 Processing ${vehicles.length} vehicles for bulk import`);

    const processedVehicles = vehicles.map((vehicle: any, index: number) => {
      try {
        // Handle the data entry error where registration number is a date
        let registrationNumber = vehicle.registrationNumber;
        if (registrationNumber && registrationNumber.includes('.') && registrationNumber.split('.').length === 3) {
          console.warn(`Warning: Registration number appears to be a date: ${registrationNumber} at index ${index}`);
          registrationNumber = null; // Let it be empty for manual correction
        }

        const processed = {
          registration_number: normalizeText(registrationNumber),
          model: normalizeText(vehicle.vehicleModel) || 'BUS',
          capacity: parseInt(vehicle.seatingCapacity) || 60,
          fuel_type: parseFuelType(vehicle.fuelType || 'DIESEL'),
          chassis_number: normalizeText(vehicle.chassisNumber),
          engine_number: normalizeText(vehicle.engineNumber),
          registration_year: normalizeText(vehicle.regYear),
          insurance_expiry: parseDate(vehicle.insuranceExpiryDate),
          permit_expiry: parseDate(vehicle.permit),
          fitness_expiry: parseDate(vehicle.fitnessExpiry),
          status: 'active' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log(`✅ Processed vehicle ${index + 1}: ${processed.registration_number || 'NO_REG'} - ${processed.model}`);
        return processed;
      } catch (error) {
        console.error(`❌ Error processing vehicle at index ${index}:`, error);
        throw new Error(`Failed to process vehicle at index ${index}: ${error.message}`);
      }
    });

    // Insert vehicles into database
    console.log('💾 Inserting vehicles into database...');
    const { data: insertedVehicles, error: insertError } = await supabase
      .from('vehicles')
      .insert(processedVehicles)
      .select();

    if (insertError) {
      console.error('❌ Database insertion error:', insertError);
      return NextResponse.json(
        { 
          error: 'Failed to insert vehicles', 
          details: insertError.message,
          code: insertError.code 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully inserted ${insertedVehicles?.length || 0} vehicles`);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedVehicles?.length || 0} vehicles`,
      inserted_count: insertedVehicles?.length || 0,
      vehicles: insertedVehicles
    });

  } catch (error) {
    console.error('❌ Bulk import error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}







