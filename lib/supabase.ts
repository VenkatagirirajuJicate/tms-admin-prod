import { createClient } from '@supabase/supabase-js';
// Note: Type definitions would be generated from your Supabase schema
// For now, using any to avoid import errors until types are generated
type Database = any;

// Lazy client creation to avoid environment variable loading issues
let _supabase: any = null;
let _supabaseAdmin: any = null;

function getSupabaseClient() {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(`Missing Supabase environment variables. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`);
}

    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
  }
  
  return _supabase;
}

function getSupabaseAdminClient() {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase admin environment variables');
    }
    
    _supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
    });
  }
  
  return _supabaseAdmin;
}

// Export the lazy clients
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    return getSupabaseClient()[prop];
  }
});

export const supabaseAdmin = new Proxy({} as any, {
  get(target, prop) {
    return getSupabaseAdminClient()[prop];
  }
});

// Helper functions for common operations
export const supabaseHelpers = {
  // Admin authentication
  async signInAdmin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Verify user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    
    if (adminError || !adminUser) {
      await supabase.auth.signOut();
      throw new Error('User is not an authorized admin');
    }
    
    return { user: data.user, adminProfile: adminUser };
  },

  // Student authentication
  async signInStudent(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Get student profile
    const { data: studentProfile, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        department:departments(*),
        program:programs(*),
        institution:institutions(*),
        transport_profile:student_transport_profiles(*)
      `)
      .eq('email', email)
      .single();
    
    if (studentError || !studentProfile) {
      await supabase.auth.signOut();
      throw new Error('Student profile not found');
    }
    
    return { user: data.user, studentProfile };
  },

  // Get admin permissions
  async getAdminPermissions(adminUserId: string) {
    const { data, error } = await supabase
      .from('admin_permissions')
      .select('module, actions')
      .eq('admin_user_id', adminUserId);
    
    if (error) throw error;
    return data;
  },

  // Get student dashboard data
  async getStudentDashboard(studentId: string) {
    const [profileResult, bookingsResult, paymentsResult, notificationsResult] = await Promise.all([
      // Student profile with transport info
      supabase
        .from('students')
        .select(`
          *,
          department:departments(department_name),
          program:programs(program_name, degree_name),
          transport_profile:student_transport_profiles(*),
          route_allocations:student_route_allocations!inner(
            route:routes(route_name, route_number, fare)
          )
        `)
        .eq('id', studentId)
        .single(),
      
      // Recent bookings
      supabase
        .from('bookings')
        .select(`
          *,
          route:routes(route_name, route_number),
          schedule:schedules(departure_time, arrival_time)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Payment history
      supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Notifications
      supabase
        .from('notifications')
        .select('*')
        .or(`target_audience.eq.all,target_audience.eq.students,specific_users.cs.{${studentId}}`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    return {
      profile: profileResult.data,
      bookings: bookingsResult.data || [],
      payments: paymentsResult.data || [],
      notifications: notificationsResult.data || []
    };
  },

  // Get admin dashboard stats
  async getAdminDashboardStats() {
    const [studentsResult, routesResult, driversResult, vehiclesResult, bookingsResult, paymentsResult] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('routes').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('trip_date', new Date().toISOString().split('T')[0]),
      supabase.from('payments').select('amount').gte('created_at', new Date().toISOString().split('T')[0])
    ]);

    const todayRevenue = paymentsResult.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

    return {
      totalStudents: studentsResult.count || 0,
      activeRoutes: routesResult.count || 0,
      activeDrivers: driversResult.count || 0,
      activeVehicles: vehiclesResult.count || 0,
      todayBookings: bookingsResult.count || 0,
      todayRevenue
    };
  },

  // Create notification
  async createNotification(notification: {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    category?: 'transport' | 'payment' | 'system' | 'emergency';
    target_audience?: 'all' | 'students' | 'drivers' | 'admins';
    specific_users?: string[];
    scheduled_at?: string;
    expires_at?: string;
    created_by: string;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Submit grievance
  async submitGrievance(grievance: {
    student_id: string;
    route_id?: string;
    driver_name?: string;
    category: 'complaint' | 'suggestion' | 'compliment' | 'technical_issue';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    subject: string;
    description: string;
  }) {
    const { data, error } = await supabase
      .from('grievances')
      .insert(grievance)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Book a trip
  async bookTrip(booking: {
    student_id: string;
    route_id: string;
    schedule_id: string;
    trip_date: string;
    boarding_stop: string;
    amount: number;
    special_requirements?: string;
  }) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Process payment
  async processPayment(payment: {
    student_id: string;
    booking_id?: string;
    amount: number;
    payment_type: 'trip_fare' | 'fine' | 'semester_fee' | 'registration';
    payment_method: 'cash' | 'upi' | 'card' | 'net_banking' | 'wallet';
    transaction_id?: string;
    description?: string;
    processed_by?: string;
  }) {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Type exports for convenience
export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = typeof supabaseAdmin; 