import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { request_id, rejection_reason, admin_notes } = await request.json();

    // Validate input
    if (!request_id || !rejection_reason || !rejection_reason.trim()) {
      return NextResponse.json(
        { error: 'Request ID and rejection reason are required' },
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

    // Get the student record to fetch their email for external API lookup
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

    // Optionally fetch comprehensive student data from external API for complete record keeping
    console.log('🔍 Fetching comprehensive student data from external API for rejection record...');
    const apiKey = 'jk_5483dc7eb7f1b7cd730a274ec61765cc_mcka9lzk';
    
    let foundStudent = null;
    try {
      const response = await fetch('https://my.jkkn.ac.in/api/api-management/students', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const students = data.data || data.students || [];
        
        // Find student by email or mobile with new schema
        foundStudent = students.find((extStudent: any) => {
          const emailMatch = extStudent.student_email?.toLowerCase() === student.email?.toLowerCase() ||
                             extStudent.college_email?.toLowerCase() === student.email?.toLowerCase();
          const mobileMatch = student.mobile && (
            extStudent.student_mobile === student.mobile ||
            extStudent.father_mobile === student.mobile ||
            extStudent.mother_mobile === student.mobile
          );
          return emailMatch || mobileMatch;
        });

        if (foundStudent) {
          const fullStudentName = foundStudent.first_name && foundStudent.last_name 
          ? `${foundStudent.first_name} ${foundStudent.last_name}`.trim()
          : foundStudent.first_name || 'Unknown Student';
        console.log('✅ Found student in external API for rejection record:', fullStudentName);
          
          // Update student record with basic comprehensive data (for future reference)
          const basicStudentData = {
            student_name: foundStudent.student_name || foundStudent.name,
            roll_number: foundStudent.roll_number || foundStudent.student_id,
            email: foundStudent.student_email || foundStudent.college_email || student.email,
            mobile: foundStudent.student_mobile || foundStudent.father_mobile || foundStudent.mother_mobile || student.mobile,
            external_student_id: foundStudent.id,
            external_roll_number: foundStudent.roll_number,
            external_data: foundStudent,
            auth_source: 'external_api',
            enrollment_status: 'rejected',
            // Basic contact information for future reference
            father_name: foundStudent.father_name,
            mother_name: foundStudent.mother_name,
            parent_mobile: foundStudent.father_mobile || foundStudent.mother_mobile,
            emergency_contact_name: foundStudent.father_name || foundStudent.mother_name,
            emergency_contact_phone: foundStudent.father_mobile || foundStudent.mother_mobile,
            // System timestamps
            updated_at: new Date().toISOString()
          };

          // Update student with basic comprehensive data
          await supabaseAdmin
            .from('students')
            .update(basicStudentData)
            .eq('id', enrollmentRequest.student_id);
        }
      }
    } catch (apiError) {
      console.error('Error fetching from external API (non-critical for rejection):', apiError);
      // Continue with rejection even if external API fails
    }

    // Get admin user ID
    let adminId = request.headers.get('X-Admin-ID');
    if (!adminId) {
      adminId = '00000000-0000-0000-0000-000000000000'; // System admin UUID
    }

    // Use the database function to reject the request
    const { data: result, error: rejectionError } = await supabaseAdmin
      .rpc('reject_transport_enrollment_request', {
        p_request_id: request_id,
        p_approver_id: adminId,
        p_rejection_reason: rejection_reason.trim(),
        p_admin_notes: admin_notes?.trim() || null
      });

    if (rejectionError) {
      console.error('Error rejecting enrollment request:', rejectionError);
      return NextResponse.json(
        { error: 'Failed to reject enrollment request' },
        { status: 500 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to reject enrollment request' },
        { status: 500 }
      );
    }

    // Send notification to student
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          title: 'Transport Enrollment Update',
          message: `Your transport enrollment request has been reviewed. Please check the details and feel free to submit a new request if needed.`,
          type: 'warning',
          category: 'enrollment',
          target_audience: 'students',
          specific_users: [enrollmentRequest.student_id],
          is_active: true,
          actionable: true,
          primary_action: {
            text: 'Submit New Request',
            url: '/dashboard'
          },
          tags: ['enrollment', 'transport'],
          metadata: {
            rejection_reason: rejection_reason,
            admin_notes: admin_notes,
            rejection_date: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });
    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError);
      // Don't fail the rejection if notification fails
    }

    console.log('✅ Enrollment request rejected successfully with comprehensive data handling');

    return NextResponse.json({
      success: true,
      message: 'Enrollment request rejected successfully',
      request_id: request_id,
      student_data_updated: foundStudent !== null
    });

  } catch (error: any) {
    console.error('Error in reject enrollment request API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 