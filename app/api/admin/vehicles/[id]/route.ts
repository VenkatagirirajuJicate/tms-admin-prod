import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

// GET - Get single vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const vehicles = await DatabaseService.getVehicles();
    const vehicle = vehicles.find(v => v.id === id);
    
    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vehicle
    });

  } catch (error) {
    console.error('Vehicle fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vehicleData = await request.json();

    // Validate required fields
    if (!vehicleData.registrationNumber || !vehicleData.model || !vehicleData.capacity) {
      return NextResponse.json(
        { error: 'Registration number, model, and capacity are required' },
        { status: 400 }
      );
    }

    // Update vehicle using DatabaseService
    const updatedVehicle = await DatabaseService.updateVehicle(id, vehicleData);

    return NextResponse.json({
      success: true,
      data: updatedVehicle,
      message: 'Vehicle updated successfully'
    });

  } catch (error: any) {
    console.error('Vehicle update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update vehicle' },
      { status: 500 }
    );
  }
}

// DELETE - Delete vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete vehicle using DatabaseService
    const result = await DatabaseService.deleteVehicle(id);

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error: any) {
    console.error('Vehicle delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete vehicle' },
      { status: 500 }
    );
  }
}





