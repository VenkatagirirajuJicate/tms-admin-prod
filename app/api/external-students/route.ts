import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Proxy: Fetching from external JKKN API...');
    
    const apiKey = 'jk_5483dc7eb7f1b7cd730a274ec61765cc_mcka9lzk';
    
    const response = await fetch('https://myadmin.jkkn.ac.in/api/api-management/students', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('📡 API Proxy: External API Response Status:', response.status);

    if (!response.ok) {
      console.error('❌ API Proxy: External API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `External API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📊 API Proxy: API Response Structure:', Object.keys(data));
    
    // Handle different response formats
    const students = data.data || data.students || [];
    console.log(`✅ API Proxy: Found ${students.length} students from external API`);
    
    if (students.length > 0) {
      console.log('📋 API Proxy: Sample student structure:', Object.keys(students[0]));
      
      // Check mobile data availability
      let fatherMobileCount = 0;
      let motherMobileCount = 0;
      let studentMobileCount = 0;
      
      students.forEach((student: any) => {
        if (student.father_mobile && student.father_mobile.trim() !== '') fatherMobileCount++;
        if (student.mother_mobile && student.mother_mobile.trim() !== '') motherMobileCount++;
        if (student.student_mobile && student.student_mobile.trim() !== '') studentMobileCount++;
      });
      
      console.log(`📱 API Proxy: Mobile data availability:`);
      console.log(`   Students with father mobile: ${fatherMobileCount}/${students.length}`);
      console.log(`   Students with mother mobile: ${motherMobileCount}/${students.length}`);
      console.log(`   Students with own mobile: ${studentMobileCount}/${students.length}`);
      
      // Show a few sample students with mobile data
      console.log('📱 API Proxy: Sample students with mobile data:');
      students.slice(0, 3).forEach((student: any, index: number) => {
        console.log(`   ${index + 1}. ${student.student_name || 'N/A'}`);
        console.log(`      Father: ${student.father_name || 'N/A'} (${student.father_mobile || 'No mobile'})`);
        console.log(`      Mother: ${student.mother_name || 'N/A'} (${student.mother_mobile || 'No mobile'})`);
        console.log(`      Student: ${student.student_mobile || 'No mobile'}`);
        console.log('      ---');
      });
    }

    // Return the students data
    return NextResponse.json({
      success: true,
      data: students,
      count: students.length
    });

  } catch (error) {
    console.error('❌ API Proxy: Error fetching from external API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch external students', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 API Proxy: Searching for student with email: ${email}`);
    
    const apiKey = 'jk_5483dc7eb7f1b7cd730a274ec61765cc_mcka9lzk';
    
    const response = await fetch('https://myadmin.jkkn.ac.in/api/api-management/students', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error('❌ API Proxy: External API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `External API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const students = data.data || data.students || [];
    
    // Search for student by email (both student_email and college_email)
    const foundStudent = students.find((student: any) => 
      student.student_email?.toLowerCase() === email.toLowerCase() ||
      student.college_email?.toLowerCase() === email.toLowerCase()
    );

    if (foundStudent) {
      console.log(`✅ API Proxy: Found student with email ${email}`);
      console.log('🔍 API Proxy: Student mobile data:', {
        father_name: foundStudent.father_name,
        father_mobile: foundStudent.father_mobile,
        mother_name: foundStudent.mother_name,
        mother_mobile: foundStudent.mother_mobile,
        student_mobile: foundStudent.student_mobile
      });
      console.log('🔍 API Proxy: ALL student fields:', Object.keys(foundStudent));
      console.log('🔍 API Proxy: Complete student object:', foundStudent);
      return NextResponse.json({
        success: true,
        data: foundStudent
      });
    } else {
      console.log(`❌ API Proxy: No student found with email ${email}`);
      return NextResponse.json(
        { error: 'Student not found with the provided email' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('❌ API Proxy: Error searching for student:', error);
    return NextResponse.json(
      { error: 'Failed to search for student', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 