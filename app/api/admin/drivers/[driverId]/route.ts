import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

// GET - Get single driver
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const { driverId } = await params;
    
    const drivers = await DatabaseService.getDrivers();
    const driver = drivers.find(d => d.id === driverId);
    
    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: driver
    });

  } catch (error) {
    console.error('Driver fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update driver
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const { driverId } = await params;
    const driverData = await request.json();

    // Validate required fields
    if (!driverData.name || !driverData.licenseNumber || !driverData.phone) {
      return NextResponse.json(
        { error: 'Name, license number, and phone are required' },
        { status: 400 }
      );
    }

    // Update driver using DatabaseService
    const updatedDriver = await DatabaseService.updateDriver(driverId, driverData);

    return NextResponse.json({
      success: true,
      data: updatedDriver,
      message: 'Driver updated successfully'
    });

  } catch (error: any) {
    console.error('Driver update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update driver' },
      { status: 500 }
    );
  }
}

// DELETE - Delete driver
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const { driverId } = await params;

    // Delete driver using DatabaseService
    const result = await DatabaseService.deleteDriver(driverId);

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error: any) {
    console.error('Driver delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete driver' },
      { status: 500 }
    );
  }
}







