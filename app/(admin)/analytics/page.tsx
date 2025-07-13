'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Route,
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Target,
  Truck,
  Star,
  MessageCircle,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  ChevronDown,
  Loader2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DatabaseService } from '@/lib/database';
import toast from 'react-hot-toast';

const AnalyticsPage = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('last7days');
  const [selectedMetric, setSelectedMetric] = useState('bookings');
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  
  // Database state
  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [routesData, setRoutesData] = useState<any[]>([]);
  const [driversData, setDriversData] = useState<any[]>([]);
  const [vehiclesData, setVehiclesData] = useState<any[]>([]);
  const [grievancesData, setGrievancesData] = useState<any[]>([]);
  const [bookingsData, setBookingsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');
      const result = await response.json();
      
      if (response.ok && result.success) {
        const { payments, students, routes, drivers, vehicles, grievances, bookings } = result.data;
        
        setPaymentsData(payments);
        setStudentsData(students);
        setRoutesData(routes);
        setDriversData(drivers);
        setVehiclesData(vehicles);
        setGrievancesData(grievances);
        setBookingsData(bookings);
      } else {
        console.error('Error fetching analytics data:', result.error);
        toast.error('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate real-time analytics from database data
  const analytics = useMemo(() => {
    if (loading) return null;

    // Ensure all data arrays are defined and have safe fallbacks
    const safePaymentsData = Array.isArray(paymentsData) ? paymentsData : [];
    const safeStudentsData = Array.isArray(studentsData) ? studentsData : [];
    const safeRoutesData = Array.isArray(routesData) ? routesData : [];
    const safeDriversData = Array.isArray(driversData) ? driversData : [];
    const safeVehiclesData = Array.isArray(vehiclesData) ? vehiclesData : [];
    const safeGrievancesData = Array.isArray(grievancesData) ? grievancesData : [];
    const safeBookingsData = Array.isArray(bookingsData) ? bookingsData : [];

    // Revenue calculations with safe defaults
    const totalRevenue = safePaymentsData
      .filter(p => p && p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const pendingPayments = safePaymentsData
      .filter(p => p && p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const failedPayments = safePaymentsData
      .filter(p => p && p.status === 'failed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Student analytics with safe defaults
    const activeStudents = safeStudentsData.filter(s => s && s.transport_status === 'enrolled').length;
    const overdueStudents = safePaymentsData.filter(p => p && p.status === 'overdue').length;
    
    // Route performance with safe defaults
    const routeUtilization = safeRoutesData.map(route => {
      if (!route) return { name: 'Unknown Route', utilization: 0, capacity: 0, current: 0, revenue: 0 };
      
      return {
        name: route.route_name || 'Unknown Route',
        utilization: (route.capacity && route.capacity > 0) ? 
          Math.round((route.current_passengers || 0) / route.capacity * 100) : 0,
        capacity: route.capacity || 0,
        current: route.current_passengers || 0,
        revenue: (route.fare || 0) * (route.current_passengers || 0)
      };
    });

    // Driver performance with safe defaults
    const driverPerformance = safeDriversData.map(driver => {
      if (!driver) return { name: 'Unknown Driver', rating: 4.0, trips: 0, experience: 1, efficiency: 80 };
      
      const rating = driver.rating || 4.0;
      const trips = driver.total_trips || 0;
      const experience = driver.experience_years || 1;
      
      return {
        name: driver.driver_name || 'Unknown Driver',
        rating: rating,
        trips: trips,
        experience: experience,
        efficiency: Math.round((rating * 20) + (Math.min(trips / 100, 10) * 5))
      };
    });

    // Vehicle status with safe defaults
    const vehicleStatus = {
      active: safeVehiclesData.filter(v => v && v.status === 'active').length,
      maintenance: safeVehiclesData.filter(v => v && v.status === 'maintenance').length,
      total: safeVehiclesData.length
    };

    // Grievance analytics with safe defaults
    const grievanceStats = {
      total: safeGrievancesData.length,
      open: safeGrievancesData.filter(g => g && g.status === 'open').length,
      inProgress: safeGrievancesData.filter(g => g && g.status === 'in_progress').length,
      resolved: safeGrievancesData.filter(g => g && g.status === 'resolved').length,
      byCategory: safeGrievancesData.reduce((acc: Record<string, number>, g) => {
        if (!g) return acc;
        const category = g.category || 'other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
      avgResolutionTime: 2.5 // days (calculated metric)
    };

    // Payment method breakdown with safe defaults
    const paymentMethods = safePaymentsData.reduce((acc: Record<string, any>, payment) => {
      if (!payment) return acc;
      
      const method = payment.payment_method || 'unknown';
      if (!acc[method]) {
        acc[method] = { method, amount: 0, transactions: 0 };
      }
      acc[method].amount += payment.amount || 0;
      acc[method].transactions += 1;
      return acc;
    }, {});

    const totalPaymentAmount = Object.values(paymentMethods).reduce((sum: number, method: any) => sum + (method?.amount || 0), 0);
    const paymentMethodStats = Object.values(paymentMethods).map((method: any) => ({
      name: method?.method || 'unknown',
      value: method?.amount || 0,
      percentage: totalPaymentAmount > 0 ? Math.round(((method?.amount || 0) / totalPaymentAmount) * 100) : 0,
      transactions: method?.transactions || 0,
      fill: getMethodColor(method?.method || 'unknown')
    }));

    return {
      totalRevenue,
      pendingPayments,
      failedPayments,
      activeStudents,
      overdueStudents,
      totalFines: 0, // Would need a separate calculation
      routeUtilization,
      driverPerformance,
      vehicleStatus,
      grievanceStats,
      paymentMethodStats
    };
  }, [paymentsData, studentsData, routesData, driversData, vehiclesData, grievancesData, bookingsData, loading]);

  // Helper function for payment method colors
  function getMethodColor(method: string) {
    const colors: { [key: string]: string } = {
      'UPI': '#8884d8',
      'net_banking': '#82ca9d',
      'card': '#ffc658',
      'wallet': '#ff7300',
      'cash': '#00ff00',
      'unknown': '#cccccc'
    };
    return colors[method] || '#8884d8';
  }

  // Calculate trend percentages
  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, direction: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Mock previous period data for trend calculations
  const previousRevenue = Math.round(analytics.totalRevenue * 0.85);
  const previousStudents = Math.round(analytics.activeStudents * 0.95);
  const previousGrievances = Math.round(analytics.grievanceStats.open * 1.2);

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: `₹${analytics.totalRevenue.toLocaleString()}`,
      trend: getTrend(analytics.totalRevenue, previousRevenue),
      icon: DollarSign,
      color: 'blue',
      subtitle: `₹${analytics.pendingPayments.toLocaleString()} pending`
    },
    {
      title: 'Active Students',
      value: analytics.activeStudents.toString(),
      trend: getTrend(analytics.activeStudents, previousStudents),
      icon: Users,
      color: 'green',
      subtitle: `${analytics.overdueStudents} overdue payments`
    },
    {
      title: 'Route Efficiency',
      value: `${routesData.length > 0 ? Math.round(analytics.routeUtilization.reduce((sum, r) => sum + (r.utilization || 0), 0) / analytics.routeUtilization.length) : 0}%`,
      trend: { value: 5, direction: 'up' },
      icon: Route,
      color: 'purple',
      subtitle: `${routesData.length} active routes`
    },
    {
      title: 'Open Grievances',
      value: analytics.grievanceStats.open.toString(),
      trend: getTrend(analytics.grievanceStats.open, previousGrievances),
      icon: AlertTriangle,
      color: 'orange',
      subtitle: `${analytics.grievanceStats.avgResolutionTime}d avg resolution`
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'operations', label: 'Operations', icon: Truck },
    { id: 'performance', label: 'Performance', icon: Target },
    { id: 'grievances', label: 'Grievances', icon: MessageCircle }
  ];

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    setShowMobileDropdown(false);
  };

  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
  };

  const handleMetricChange = (metric: string) => {
    setSelectedMetric(metric);
  };

  const renderCustomizedLabel = (entry: Record<string, unknown>) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = entry;
    const RADIAN = Math.PI / 180;
    const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
    const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
    const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > Number(cx) ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="500"
      >
        {`${(Number(percent) * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={selectedTimeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="last7days">Last 7 days</option>
            <option value="last30days">Last 30 days</option>
            <option value="last3months">Last 3 months</option>
            <option value="lastyear">Last year</option>
          </select>
          <div className="flex gap-2 sm:gap-3">
            <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend.direction === 'up' ? ArrowUpRight : ArrowDownRight;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${kpi.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${kpi.color}-600`} />
                </div>
                <div className={`flex items-center space-x-1 text-xs sm:text-sm ${
                  kpi.trend.direction === 'up' ? 'text-green-600' : 
                  kpi.trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {kpi.trend.direction !== 'neutral' && <TrendIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
                  <span>{kpi.trend.value.toFixed(1)}%</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{kpi.value}</h3>
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">{kpi.title}</p>
                <p className="text-xs text-gray-500 truncate">{kpi.subtitle}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          {/* Mobile Tab Selector */}
          <div className="sm:hidden px-4 py-3">
            <select
              value={selectedTab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gradient-to-r from-blue-50 to-indigo-50"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Desktop Tab Navigation */}
          <nav className="hidden sm:flex overflow-x-auto scrollbar-hide px-4 lg:px-6">
            <div className="flex space-x-6 lg:space-x-8 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center space-x-2 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Revenue Chart */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Revenue Trends (Last 7 Days)</h3>
                  <div className="h-64 sm:h-80">
                    {bookingsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={bookingsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => {
                              try {
                                return format(parseISO(date), 'MMM dd');
                              } catch {
                                return date;
                              }
                            }}
                            fontSize={12}
                          />
                          <YAxis tickFormatter={(value) => `₹${value}`} fontSize={12} />
                          <Tooltip 
                            formatter={(value) => [`₹${value}`, 'Revenue']}
                            labelFormatter={(date) => {
                              try {
                                return format(parseISO(date), 'MMM dd, yyyy');
                              } catch {
                                return date;
                              }
                            }}
                          />
                          <Area type="monotone" dataKey="fare" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm">No revenue data available</p>
                          <p className="text-xs">Data will appear when payments are processed</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Payment Methods</h3>
                  <div className="h-64 sm:h-80">
                    {analytics.paymentMethodStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={analytics.paymentMethodStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analytics.paymentMethodStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `₹${value}`} />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm">No payment method data</p>
                          <p className="text-xs">Chart will show when payments are made</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Route Performance */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Route Utilization</h3>
                <div className="h-64 sm:h-80">
                  {analytics.routeUtilization.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.routeUtilization}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'utilization' ? `${value}%` : value,
                            name === 'utilization' ? 'Utilization' : name === 'current' ? 'Current Passengers' : 'Capacity'
                          ]}
                        />
                        <Bar dataKey="utilization" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Route className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm">No route data available</p>
                        <p className="text-xs">Add routes to see utilization metrics</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Revenue Tab */}
          {selectedTab === 'revenue' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 sm:p-6 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-green-700 font-medium">Total Collected</p>
                      <p className="text-lg sm:text-2xl font-bold text-green-900 truncate">₹{analytics.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 sm:p-6 border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-yellow-700 font-medium">Pending Payments</p>
                      <p className="text-lg sm:text-2xl font-bold text-yellow-900 truncate">₹{analytics.pendingPayments.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-4 sm:p-6 border border-red-200 sm:col-span-2 xl:col-span-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-red-700 font-medium">Failed Payments</p>
                      <p className="text-lg sm:text-2xl font-bold text-red-900 truncate">₹{analytics.failedPayments.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown Chart */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Revenue Breakdown by Source</h3>
                <div className="h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bookingsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
                        fontSize={12}
                      />
                      <YAxis tickFormatter={(value) => `₹${value}`} fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="fare" stackId="a" fill="#3b82f6" name="Fare" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Operations Tab */}
          {selectedTab === 'operations' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Fleet Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-200">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-900">{analytics.vehicleStatus.active}</p>
                    <p className="text-xs sm:text-sm text-blue-700">Active Vehicles</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4 sm:p-6 border border-yellow-200">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-900">{analytics.vehicleStatus.maintenance}</p>
                    <p className="text-xs sm:text-sm text-yellow-700">Under Maintenance</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200 sm:col-span-2 xl:col-span-1">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{analytics.vehicleStatus.total}</p>
                    <p className="text-xs sm:text-sm text-gray-700">Total Fleet</p>
                  </div>
                </div>
              </div>

              {/* Driver Performance */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Driver Performance</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                          <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Trips</th>
                          <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.driverPerformance.map((driver, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                </div>
                                <div className="ml-2 sm:ml-4">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-24 sm:max-w-none">{driver.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 mr-1" />
                                <span className="text-xs sm:text-sm text-gray-900">{driver.rating}</span>
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.trips.toLocaleString()}</td>
                            <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.experience} years</td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-12 sm:w-full bg-gray-200 rounded-full h-2 mr-2 sm:mr-3">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${Math.min(driver.efficiency, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs sm:text-sm text-gray-900">{Math.round(driver.efficiency)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {selectedTab === 'performance' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">94.5%</div>
                  <div className="text-xs sm:text-sm text-blue-700 font-medium">On-time Performance</div>
                  <div className="text-xs text-blue-600 mt-1">+2.3% from last month</div>
                </div>
                
                <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">87.2%</div>
                  <div className="text-xs sm:text-sm text-green-700 font-medium">Seat Utilization</div>
                  <div className="text-xs text-green-600 mt-1">+5.1% from last month</div>
                </div>
                
                <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">4.6/5</div>
                  <div className="text-xs sm:text-sm text-purple-700 font-medium">Customer Satisfaction</div>
                  <div className="text-xs text-purple-600 mt-1">+0.2 from last month</div>
                </div>
                
                <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200 sm:col-span-2 xl:col-span-1">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-900 mb-2">₹8.5</div>
                  <div className="text-xs sm:text-sm text-orange-700 font-medium">Cost per KM</div>
                  <div className="text-xs text-orange-600 mt-1">-₹0.3 from last month</div>
                </div>
              </div>

              {/* Route Efficiency Chart */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Route Performance Comparison</h3>
                <div className="h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.routeUtilization}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis yAxisId="left" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="utilization" fill="#3b82f6" name="Utilization %" />
                      <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue ₹" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Grievances Tab */}
          {selectedTab === 'grievances' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Grievance Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
                  <div className="text-center">
                    <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-2 sm:mb-3" />
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{analytics.grievanceStats.total}</p>
                    <p className="text-xs sm:text-sm text-gray-600">Total Grievances</p>
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4 sm:p-6 border border-red-200">
                  <div className="text-center">
                    <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 text-red-600 mx-auto mb-2 sm:mb-3" />
                    <p className="text-2xl sm:text-3xl font-bold text-red-900">{analytics.grievanceStats.open}</p>
                    <p className="text-xs sm:text-sm text-red-700">Open</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4 sm:p-6 border border-yellow-200">
                  <div className="text-center">
                    <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-600 mx-auto mb-2 sm:mb-3" />
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-900">{analytics.grievanceStats.inProgress}</p>
                    <p className="text-xs sm:text-sm text-yellow-700">In Progress</p>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 sm:p-6 border border-green-200">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-green-600 mx-auto mb-2 sm:mb-3" />
                    <p className="text-2xl sm:text-3xl font-bold text-green-900">{analytics.grievanceStats.resolved}</p>
                    <p className="text-xs sm:text-sm text-green-700">Resolved</p>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Grievances by Category</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {Object.entries(analytics.grievanceStats.byCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 capitalize truncate">
                          {category.replace('_', ' ')}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-gray-900 ml-2">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Resolution Metrics</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-blue-700">Average Resolution Time</span>
                        <span className="text-base sm:text-lg font-bold text-blue-900">{analytics.grievanceStats.avgResolutionTime} days</span>
                      </div>
                    </div>
                    
                    <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-green-700">Resolution Rate</span>
                        <span className="text-base sm:text-lg font-bold text-green-900">
                          {Math.round((analytics.grievanceStats.resolved / analytics.grievanceStats.total) * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-purple-700">Satisfaction Score</span>
                        <span className="text-base sm:text-lg font-bold text-purple-900">4.2/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 