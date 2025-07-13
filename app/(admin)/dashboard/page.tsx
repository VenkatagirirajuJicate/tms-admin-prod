'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users,
  Route,
  Car,
  UserCheck,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Bell,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DatabaseService } from '@/lib/database';
import { DashboardStats } from '@/types';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  loading?: boolean;
}

const StatCard = ({ title, value, change, icon: Icon, color, loading }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {loading ? (
          <div className="flex items-center mt-1">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Loading...</span>
          </div>
        ) : (
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        )}
        {change !== undefined && !loading && (
          <div className="flex items-center mt-2">
            <TrendingUp className={`w-4 h-4 mr-1 ${change > 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

const DashboardPage = () => {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('adminUser');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [stats, activities, alerts, metrics] = await Promise.all([
          DatabaseService.getDashboardStats(),
          DatabaseService.getRecentActivities(5),
          DatabaseService.getCriticalAlerts(),
          DatabaseService.getPerformanceMetrics()
        ]);

        setDashboardStats(stats);
        setRecentActivities(activities);
        setCriticalAlerts(alerts);
        setPerformanceMetrics(metrics);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchStudentsData();
  }, []);

  // Fetch students data from both local database and external API
  const fetchStudentsData = async () => {
    try {
      setStudentsLoading(true);
      
      // Fetch from both sources in parallel
      const [localDbStudents, externalApiStudents] = await Promise.all([
        fetch('/api/admin/students').then(res => res.json()).then(data => data.data || []),
        fetchExternalStudents()
      ]);
      
      // Process local database students (enrolled in transport)
      const localStudents = Array.isArray(localDbStudents) ? localDbStudents : [];
      
      // Transform local students to match display format
      const transformedEnrolledStudents = localStudents.map(localStudent => ({
        id: localStudent.id,
        student_name: localStudent.student_name,
        roll_number: localStudent.roll_number,
        email: localStudent.email,
        department_name: localStudent.department_name || 'Unknown Department',
        institution_name: localStudent.institution_name || 'Unknown Institution',
        transport_status: localStudent.transport_status,
        payment_status: localStudent.payment_status,
        external_id: localStudent.external_id,
        _enrollmentStatus: 'enrolled'
      }));

      // Process external API students
      const externalStudents = Array.isArray(externalApiStudents) ? externalApiStudents : [];
      
      // Filter out students who are already enrolled
      const enrolledExternalIds = new Set(localStudents.map(s => s.external_id).filter(Boolean));
      const enrolledEmails = new Set(localStudents.map(s => s.email).filter(Boolean));
      
      const availableExternalStudents = externalStudents
        .filter(externalStudent => {
          const isEnrolledById = enrolledExternalIds.has(externalStudent.id?.toString());
          const isEnrolledByEmail = enrolledEmails.has(externalStudent.student_email);
          return !isEnrolledById && !isEnrolledByEmail;
        })
        .slice(0, 10); // Limit to 10 for dashboard display

      // Transform available students to match display format
      const transformedAvailableStudents = availableExternalStudents.map(externalStudent => ({
        id: `external_${externalStudent.id}`,
        student_name: externalStudent.student_name,
        roll_number: externalStudent.roll_number,
        email: externalStudent.student_email,
        department_name: typeof externalStudent.department === 'object' 
          ? (externalStudent.department?.departmentName || externalStudent.department?.department_name || 'Unknown Department')
          : (externalStudent.department || 'Unknown Department'),
        institution_name: typeof externalStudent.institution === 'object'
          ? (externalStudent.institution?.name || 'Unknown Institution')
          : (externalStudent.institution || 'Unknown Institution'),
        external_id: externalStudent.id,
        _enrollmentStatus: 'available'
      }));

      setEnrolledStudents(transformedEnrolledStudents);
      setAvailableStudents(transformedAvailableStudents);
      
    } catch (error) {
      console.error('Error fetching students data for dashboard:', error);
      setEnrolledStudents([]);
      setAvailableStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Helper function to fetch students from external API via proxy
  const fetchExternalStudents = async () => {
    try {
      console.log('🔍 Dashboard: Fetching from external JKKN API via proxy...');
      
      const response = await fetch('/api/external-students', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Dashboard: API Proxy Response Status:', response.status);

      if (!response.ok) {
        console.error('❌ Dashboard: API Proxy error:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Proxy error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('📊 Dashboard: API Proxy Response Structure:', Object.keys(data));
      console.log('📊 Dashboard: Full API Proxy Response:', data);
      
      // Handle response format from proxy
      const students = data.data || [];
      console.log(`✅ Dashboard: Found ${students.length} students from external API via proxy`);
      
      if (students.length > 0) {
        console.log('📋 Dashboard: Sample student structure from proxy:', Object.keys(students[0]));
        console.log('📋 Dashboard: Sample student data from proxy:', students[0]);
      }
      
      return students;
    } catch (error) {
      console.error('❌ Dashboard: Error fetching from external API via proxy:', error);
      return [];
    }
  };

  const getStatsForRole = (userRole: string, stats: DashboardStats) => {
    // Provide default values to prevent undefined errors
    const safeStats = {
      ...stats,
      totalStudents: stats?.totalStudents || 0,
      activeRoutes: stats?.activeRoutes || 0,
      totalDrivers: stats?.totalDrivers || 0,
      totalVehicles: stats?.totalVehicles || 0,
      todayRevenue: stats?.todayRevenue || 0,
      pendingGrievances: stats?.pendingGrievances || 0
    };

    const allStats = [
      { 
        title: 'Total Students', 
        value: safeStats.totalStudents.toLocaleString(), 
        change: 12, 
        icon: Users, 
        color: 'bg-blue-500' 
      },
      { 
        title: 'Active Routes', 
        value: safeStats.activeRoutes.toString(), 
        change: 8, 
        icon: Route, 
        color: 'bg-green-500' 
      },
      { 
        title: 'Total Drivers', 
        value: safeStats.totalDrivers.toString(), 
        change: 4, 
        icon: UserCheck, 
        color: 'bg-purple-500' 
      },
      { 
        title: 'Vehicles', 
        value: safeStats.totalVehicles.toString(), 
        change: 0, 
        icon: Car, 
        color: 'bg-orange-500' 
      },
      { 
        title: 'Today Revenue', 
        value: `₹${safeStats.todayRevenue.toLocaleString()}`, 
        change: 15, 
        icon: DollarSign, 
        color: 'bg-emerald-500' 
      },
      { 
        title: 'Pending Issues', 
        value: safeStats.pendingGrievances.toString(), 
        change: -20, 
        icon: AlertTriangle, 
        color: 'bg-red-500' 
      }
    ];

    // Filter stats based on role permissions
    return allStats.filter(stat => {
      switch (userRole) {
        case 'super_admin':
          return true; // All stats including revenue
        case 'transport_manager':
          return ['Active Routes', 'Total Drivers', 'Vehicles', 'Pending Issues'].includes(stat.title);
        case 'finance_admin':
          return ['Total Students', 'Today Revenue', 'Pending Issues'].includes(stat.title);
        case 'operations_admin':
          return ['Total Students', 'Active Routes', 'Pending Issues'].includes(stat.title);
        case 'data_entry':
          return ['Total Students', 'Pending Issues'].includes(stat.title);
        default:
          return false;
      }
    });
  };

  const getActivitiesForRole = (userRole: string, activities: any[]) => {
    // Filter activities based on role
    return activities.filter(activity => {
      switch (userRole) {
        case 'super_admin':
          return true; // All activities
        case 'transport_manager':
          return activity.type !== 'payment'; // No payment activities
        case 'finance_admin':
          return ['payment', 'booking'].includes(activity.type);
        case 'operations_admin':
          return ['booking', 'grievance'].includes(activity.type);
        case 'data_entry':
          return activity.type === 'booking';
        default:
          return false;
      }
    });
  };

  const stats = dashboardStats && user ? getStatsForRole(user.role, dashboardStats) : [];
  const filteredActivities = user ? getActivitiesForRole(user.role, recentActivities) : [];

  const getRoleWelcomeMessage = (userRole: string, userName: string) => {
    switch (userRole) {
      case 'super_admin':
        return `Welcome back, ${userName}! You have full system access and control.`;
      case 'transport_manager':
        return `Welcome back, ${userName}! Manage routes, drivers, and vehicles efficiently.`;
      case 'finance_admin':
        return `Welcome back, ${userName}! Handle payment operations and financial tracking.`;
      case 'operations_admin':
        return `Welcome back, ${userName}! Manage bookings, grievances, and notifications.`;
      case 'data_entry':
        return `Welcome back, ${userName}! Manage student data and booking records.`;
      default:
        return `Welcome back, ${userName}!`;
    }
  };

  const getQuickActionsForRole = (userRole: string) => {
    const allActions = [
      { 
        name: 'Add Route', 
        icon: Route, 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-50 hover:bg-blue-100',
        roles: ['super_admin', 'transport_manager'],
        action: () => router.push('/routes')
      },
      { 
        name: 'Add Driver', 
        icon: UserCheck, 
        color: 'text-green-600', 
        bgColor: 'bg-green-50 hover:bg-green-100',
        roles: ['super_admin', 'transport_manager'],
        action: () => router.push('/drivers')
      },
      { 
        name: 'Add Vehicle', 
        icon: Car, 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-50 hover:bg-orange-100',
        roles: ['super_admin', 'transport_manager'],
        action: () => router.push('/vehicles')
      },
      { 
        name: 'Add Student', 
        icon: Users, 
        color: 'text-purple-600', 
        bgColor: 'bg-purple-50 hover:bg-purple-100',
        roles: ['super_admin', 'data_entry'],
        action: () => router.push('/students')
      },
      { 
        name: 'Send Notice', 
        icon: Bell, 
        color: 'text-red-600', 
        bgColor: 'bg-red-50 hover:bg-red-100',
        roles: ['super_admin', 'operations_admin'],
        action: () => router.push('/notifications')
      },
      { 
        name: 'View Analytics', 
        icon: TrendingUp, 
        color: 'text-indigo-600', 
        bgColor: 'bg-indigo-50 hover:bg-indigo-100',
        roles: ['super_admin', 'transport_manager', 'finance_admin'],
        action: () => router.push('/analytics')
      }
    ];

    return allActions.filter(action => action.roles.includes(userRole));
  };

  const quickActions = user ? getQuickActionsForRole(user.role) : [];

  const handleQuickAction = (action: { name: string; action: () => void }) => {
    toast.success(`Navigating to ${action.name}...`);
    action.action();
  };

  const handleAlertClick = (alertAction: string) => {
    switch (alertAction) {
      case 'vehicles':
        router.push('/vehicles');
        break;
      case 'routes':
        router.push('/routes');
        break;
      case 'payments':
        router.push('/payments');
        break;
      default:
        break;
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons = {
      Calendar,
      DollarSign,
      AlertTriangle,
      CheckCircle,
      Bell
    };
    return icons[iconName as keyof typeof icons] || Bell;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">
          {user?.role.replace('_', ' ').toUpperCase()} Dashboard
        </h1>
        <p className="text-blue-100">
          {user ? getRoleWelcomeMessage(user.role, user.name) : 'Loading...'}
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <span className="text-sm">Today&apos;s Date</span>
            <p className="text-lg font-semibold mt-1">{new Date().toLocaleDateString()}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <span className="text-sm">System Status</span>
            <p className="text-lg font-semibold mt-1">Operational</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <span className="text-sm">Your Role</span>
            <p className="text-lg font-semibold mt-1 capitalize">{user?.role.replace('_', ' ')}</p>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} loading={loading} />
        ))}
      </div>

      {/* Critical Alerts & Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${criticalAlerts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className={`text-sm font-medium ${criticalAlerts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {loading ? 'Loading...' : criticalAlerts.length > 0 ? `${criticalAlerts.length} Active` : 'All Clear'}
            </span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : criticalAlerts.length > 0 ? (
          <div className="space-y-3">
            {criticalAlerts.map((alert) => (
              <div 
                key={alert.id}
                onClick={() => handleAlertClick(alert.action)}
                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  alert.severity === 'high' 
                    ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                    : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                }`}
          >
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                  alert.severity === 'high' ? 'text-red-600' : 'text-orange-600'
                }`} />
            <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    alert.severity === 'high' ? 'text-red-800' : 'text-orange-800'
                  }`}>{alert.message}</p>
                  <p className={`text-xs ${
                    alert.severity === 'high' ? 'text-red-600' : 'text-orange-600'
                  }`}>{alert.details}</p>
                </div>
                <ArrowRight className={`w-4 h-4 ${
                  alert.severity === 'high' ? 'text-red-600' : 'text-orange-600'
                }`} />
            </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <p className="font-medium text-gray-900 mb-1">No Critical Alerts</p>
            <p className="text-sm">System is running smoothly. All operations are normal.</p>
          </div>
        )}
      </motion.div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Performance</h3>
          {loading || !performanceMetrics ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">On-time Performance</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${performanceMetrics.onTimePerformance}%` }}
                    ></div>
                </div>
                  <span className="text-sm font-medium text-green-600">
                    {performanceMetrics.onTimePerformance}%
                  </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Route Utilization</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${performanceMetrics.routeUtilization}%` }}
                    ></div>
                </div>
                  <span className="text-sm font-medium text-blue-600">
                    {performanceMetrics.routeUtilization}%
                  </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Collection</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${performanceMetrics.paymentCollection}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-purple-600">
                    {performanceMetrics.paymentCollection}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Status</h3>
          {loading || !dashboardStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
                <p className="text-2xl font-bold text-green-900">{dashboardStats.activeRoutes}</p>
              <p className="text-xs text-green-700">Active Routes</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Car className="w-4 h-4 text-blue-600" />
              </div>
                <p className="text-2xl font-bold text-blue-900">{dashboardStats.totalVehicles}</p>
                <p className="text-xs text-blue-700">Vehicles Available</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
                <p className="text-2xl font-bold text-purple-900">{dashboardStats.todayBookings}</p>
                <p className="text-xs text-purple-700">Today Bookings</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Bell className="w-4 h-4 text-orange-600" />
              </div>
                <p className="text-2xl font-bold text-orange-900">{dashboardStats.pendingGrievances}</p>
              <p className="text-xs text-orange-700">Pending Issues</p>
            </div>
          </div>
          )}
        </motion.div>
      </div>

      {/* Students Overview Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Students Overview</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Enrolled ({enrolledStudents.length})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Available ({availableStudents.length})</span>
            </div>
            <button
              onClick={() => router.push('/students')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {studentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading students...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrolled Students */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-800">Enrolled in Transport</h4>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {enrolledStudents.length} Students
                </span>
              </div>
              
              {enrolledStudents.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {enrolledStudents.slice(0, 6).map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.student_name}</p>
                          <p className="text-xs text-gray-600">{student.roll_number} • {student.department_name}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          Enrolled
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          student.transport_status === 'active' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {student.transport_status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {enrolledStudents.length > 6 && (
                    <div className="text-center py-2">
                      <button
                        onClick={() => router.push('/students?enrollment=enrolled')}
                        className="text-sm text-green-600 hover:text-green-800 font-medium"
                      >
                        View {enrolledStudents.length - 6} more enrolled students
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No Enrolled Students</p>
                  <p className="text-xs">Students will appear here after enrolling in transport</p>
                </div>
              )}
            </div>

            {/* Available Students */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-800">Available for Enrollment</h4>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                  {availableStudents.length} Students
                </span>
              </div>
              
              {availableStudents.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {availableStudents.slice(0, 6).map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.student_name}</p>
                          <p className="text-xs text-gray-600">{student.roll_number} • {student.department_name}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                          Not Enrolled
                        </span>
                        <button
                          onClick={() => router.push('/students')}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded-md transition-colors"
                        >
                          Enroll
                        </button>
                      </div>
                    </div>
                  ))}
                  {availableStudents.length > 6 && (
                    <div className="text-center py-2">
                      <button
                        onClick={() => router.push('/students?enrollment=available')}
                        className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                      >
                        View {availableStudents.length - 6} more available students
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No Available Students</p>
                  <p className="text-xs">All students from external database are enrolled</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Action Button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total: {enrolledStudents.length + availableStudents.length} students 
              ({enrolledStudents.length} enrolled, {availableStudents.length} available)
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/students')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Manage Students</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickAction(action)}
              className={`p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all ${action.bgColor}`}
            >
              <action.icon className={`w-6 h-6 ${action.color} mx-auto mb-2`} />
              <span className={`text-sm font-medium ${action.color} block`}>{action.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          <div className="text-sm text-gray-500">Last 24 hours</div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredActivities.length > 0 ? (
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => {
              const IconComponent = getIconComponent(activity.icon);
              return (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${activity.bgColor}`}>
                    <IconComponent className={`w-4 h-4 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="font-medium text-gray-900 mb-1">No Recent Activities</p>
            <p className="text-sm">Activities will appear here as they occur</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardPage; 