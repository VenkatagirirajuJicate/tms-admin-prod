import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { request_id, route_id, stop_id, admin_notes } = await request.json();

    // Validate input
    if (!request_id || !route_id || !stop_id) {
      return NextResponse.json(
        { error: 'Request ID, route ID, and stop ID are required' },
        { status: 400 }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the enrollment request
    const { data: enrollmentRequest, error: requestError } = await supabaseAdmin
      .from('transport_enrollment_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (requestError || !enrollmentRequest) {
      return NextResponse.json(
        { error: 'Enrollment request not found' },
        { status: 404 }
      );
    }

    // Check if request is still pending
    if (enrollmentRequest.request_status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      );
    }

    // Get the student record
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', enrollmentRequest.student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Fetch comprehensive student data from external API
    console.log('🔍 Fetching comprehensive student data from external API...');
    const apiKey = 'jk_5483dc7eb7f1b7cd730a274ec61765cc_mcka9lzk';
    
    const response = await fetch('https://my.jkkn.ac.in/api/api-management/students', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch from external API:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch student data from external system' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const students = data.data || data.students || [];
    
    // Find student by email or mobile with new schema
    const foundStudent = students.find((extStudent: any) => {
      const emailMatch = extStudent.student_email?.toLowerCase() === student.email?.toLowerCase() ||
                         extStudent.college_email?.toLowerCase() === student.email?.toLowerCase();
      const mobileMatch = student.mobile && (
        extStudent.student_mobile === student.mobile ||
        extStudent.father_mobile === student.mobile ||
        extStudent.mother_mobile === student.mobile
      );
      return emailMatch || mobileMatch;
    });

    if (!foundStudent) {
      console.error('Student not found in external API');
      return NextResponse.json(
        { error: 'Student not found in external system' },
        { status: 404 }
      );
    }

    const fullStudentName = foundStudent.first_name && foundStudent.last_name 
      ? `${foundStudent.first_name} ${foundStudent.last_name}`.trim()
      : foundStudent.first_name || 'Unknown Student';
    console.log('✅ Found student in external API:', fullStudentName);

    // Verify route and stop still exist and are valid
    const { data: route, error: routeError } = await supabaseAdmin
      .from('routes')
      .select('id, route_number, route_name, status, total_capacity, current_passengers')
      .eq('id', route_id)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: 'Selected route not found' },
        { status: 404 }
      );
    }

    if (route.status !== 'active') {
      return NextResponse.json(
        { error: 'Selected route is not active' },
        { status: 400 }
      );
    }

    // Check if route has capacity
    if (route.current_passengers >= route.total_capacity) {
      return NextResponse.json(
        { error: 'Route is at full capacity' },
        { status: 400 }
      );
    }

    const { data: stop, error: stopError } = await supabaseAdmin
      .from('route_stops')
      .select('id, stop_name, route_id')
      .eq('id', stop_id)
      .eq('route_id', route_id)
      .single();

    if (stopError || !stop) {
      return NextResponse.json(
        { error: 'Selected stop not found or does not belong to the route' },
        { status: 404 }
      );
    }

    // Get admin user ID
    let adminId = request.headers.get('X-Admin-ID');
    if (!adminId) {
      adminId = '00000000-0000-0000-0000-000000000000'; // System admin UUID
    }

    // Update student record with comprehensive data from external API
    console.log('🔍 Updating student record with comprehensive external data...');
    
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .rpc('update_comprehensive_student_data', {
        p_student_id: enrollmentRequest.student_id,
        p_external_data: foundStudent,
        p_external_student_id: foundStudent.id,
                  p_external_roll_number: foundStudent.roll_number,
          p_department_name: foundStudent.department?.department_name || 'Unknown Department',
          p_institution_name: foundStudent.institution?.name || 'Unknown Institution',
          p_program_name: foundStudent.program?.program_name || '',
          p_degree_name: foundStudent.degree?.degree_name || '',
        p_father_name: foundStudent.father_name,
        p_mother_name: foundStudent.mother_name,
        p_parent_mobile: foundStudent.father_mobile || foundStudent.mother_mobile,
        p_date_of_birth: foundStudent.date_of_birth ? foundStudent.date_of_birth : null,
        p_gender: foundStudent.gender,
        p_emergency_contact_name: foundStudent.father_name || foundStudent.mother_name,
        p_emergency_contact_phone: foundStudent.father_mobile || foundStudent.mother_mobile,
        p_address_street: foundStudent.permanent_address_street,
        p_address_district: foundStudent.permanent_address_district,
        p_address_state: foundStudent.permanent_address_state,
        p_address_pin_code: foundStudent.permanent_address_pin_code,
        p_is_profile_complete: foundStudent.is_profile_complete || false,
        p_auth_source: 'external_api'
      });

    if (updateError) {
      console.error('Error updating student with comprehensive data:', updateError);
      return NextResponse.json(
        { error: 'Failed to update student record with comprehensive data' },
        { status: 500 }
      );
    }

    console.log('✅ Student comprehensive data updated successfully');

    // Use the database function to approve the request
    const { data: result, error: approvalError } = await supabaseAdmin
      .rpc('approve_transport_enrollment_request', {
        p_request_id: request_id,
        p_approver_id: adminId,
        p_route_id: route_id,
        p_stop_id: stop_id,
        p_admin_notes: admin_notes
      });

    if (approvalError) {
      console.error('Error approving enrollment request:', approvalError);
      return NextResponse.json(
        { error: 'Failed to approve enrollment request' },
        { status: 500 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to approve enrollment request' },
        { status: 500 }
      );
    }

    // Update student with transport assignment details
    const { error: transportUpdateError } = await supabaseAdmin
      .from('students')
      .update({
        allocated_route_id: route_id,
        boarding_point: stop.stop_name,
        transport_status: 'active',
        payment_status: 'current',
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentRequest.student_id);

    if (transportUpdateError) {
      console.error('Error updating student transport details:', transportUpdateError);
      // Don't fail the approval, just log the error
    }

    // Update route current passenger count
    await supabaseAdmin
      .from('routes')
      .update({
        current_passengers: (route.current_passengers || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', route_id);

    // Send notification to student
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          title: 'Transport Enrollment Approved! 🎉',
          message: `Congratulations! Your transport enrollment for route ${route.route_number} has been approved. You can now start booking trips.`,
          type: 'success',
          category: 'enrollment',
          target_audience: 'students',
          specific_users: [enrollmentRequest.student_id],
          is_active: true,
          actionable: true,
          primary_action: {
            text: 'View Route Details',
            url: '/dashboard/routes'
          },
          tags: ['enrollment', 'transport'],
          metadata: {
            route_id: route_id,
            route_number: route.route_number,
            stop_name: stop.stop_name,
            approval_date: new Date().toISOString(),
            admin_notes: admin_notes
          },
          created_at: new Date().toISOString()
        });
    } catch (notificationError) {
      console.error('Failed to send approval notification:', notificationError);
      // Don't fail the approval if notification fails
    }

    console.log('✅ Enrollment request approved successfully with comprehensive data storage');

    return NextResponse.json({
      success: true,
      message: 'Enrollment request approved successfully',
      request_id: request_id,
      student_data_updated: true,
      comprehensive_data_stored: true
    });

  } catch (error: any) {
    console.error('Error in approve enrollment request API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 