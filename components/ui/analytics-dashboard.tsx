'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Car,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  Fuel,
  Navigation
} from 'lucide-react';

interface AnalyticsData {
  routeUtilization: Array<{
    route: string;
    capacity: number;
    utilization: number;
    revenue: number;
  }>;
  vehiclePerformance: Array<{
    vehicle: string;
    trips: number;
    distance: number;
    fuelEfficiency: number;
    maintenance: number;
  }>;
  revenueData: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  passengerTrends: Array<{
    date: string;
    total: number;
    new: number;
    returning: number;
  }>;
  maintenanceAlerts: Array<{
    vehicle: string;
    type: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, changeLabel, icon, color }) => {
  const isPositiveChange = change && change > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-sm ${
            isPositiveChange ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isPositiveChange ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{Math.abs(change)}%</span>
            {changeLabel && <span className="text-xs opacity-75">{changeLabel}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isOpen, onClose }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    if (isOpen) {
      fetchAnalyticsData();
    }
  }, [isOpen, dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // In a real application, this would fetch from your analytics API
      // For demo purposes, we'll use mock data
      const mockData: AnalyticsData = {
        routeUtilization: [
          { route: 'Route A1', capacity: 50, utilization: 85, revenue: 15420 },
          { route: 'Route B2', capacity: 40, utilization: 92, revenue: 18300 },
          { route: 'Route C3', capacity: 35, utilization: 78, revenue: 12850 },
          { route: 'Route D4', capacity: 45, utilization: 88, revenue: 16700 },
          { route: 'Route E5', capacity: 30, utilization: 95, revenue: 14200 }
        ],
        vehiclePerformance: [
          { vehicle: 'MH01AB1234', trips: 145, distance: 2850, fuelEfficiency: 12.5, maintenance: 3 },
          { vehicle: 'MH01CD5678', trips: 132, distance: 2640, fuelEfficiency: 11.8, maintenance: 2 },
          { vehicle: 'MH01EF9012', trips: 156, distance: 3120, fuelEfficiency: 13.2, maintenance: 1 },
          { vehicle: 'MH01GH3456', trips: 128, distance: 2560, fuelEfficiency: 12.0, maintenance: 4 }
        ],
        revenueData: [
          { month: 'Jan', revenue: 85000, expenses: 45000, profit: 40000 },
          { month: 'Feb', revenue: 92000, expenses: 48000, profit: 44000 },
          { month: 'Mar', revenue: 88000, expenses: 46000, profit: 42000 },
          { month: 'Apr', revenue: 96000, expenses: 50000, profit: 46000 },
          { month: 'May', revenue: 102000, expenses: 52000, profit: 50000 },
          { month: 'Jun', revenue: 108000, expenses: 54000, profit: 54000 }
        ],
        passengerTrends: [
          { date: '2024-01', total: 1250, new: 125, returning: 1125 },
          { date: '2024-02', total: 1320, new: 145, returning: 1175 },
          { date: '2024-03', total: 1280, new: 130, returning: 1150 },
          { date: '2024-04', total: 1420, new: 165, returning: 1255 },
          { date: '2024-05', total: 1380, new: 155, returning: 1225 },
          { date: '2024-06', total: 1450, new: 175, returning: 1275 }
        ],
        maintenanceAlerts: [
          { vehicle: 'MH01AB1234', type: 'Oil Change', dueDate: '2024-01-15', priority: 'medium' },
          { vehicle: 'MH01CD5678', type: 'Brake Service', dueDate: '2024-01-10', priority: 'high' },
          { vehicle: 'MH01EF9012', type: 'Tire Rotation', dueDate: '2024-01-20', priority: 'low' },
          { vehicle: 'MH01GH3456', type: 'Engine Service', dueDate: '2024-01-08', priority: 'high' }
        ]
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = (data: AnalyticsData) => {
    const totalRoutes = data.routeUtilization.length;
    const avgUtilization = Math.round(
      data.routeUtilization.reduce((sum, route) => sum + route.utilization, 0) / totalRoutes
    );
    const totalRevenue = data.revenueData.reduce((sum, month) => sum + month.revenue, 0);
    const totalPassengers = data.passengerTrends.reduce((sum, trend) => sum + trend.total, 0);
    const avgFuelEfficiency = (
      data.vehiclePerformance.reduce((sum, vehicle) => sum + vehicle.fuelEfficiency, 0) /
      data.vehiclePerformance.length
    ).toFixed(1);

    return {
      totalRoutes,
      avgUtilization,
      totalRevenue,
      totalPassengers,
      avgFuelEfficiency,
      maintenanceAlerts: data.maintenanceAlerts.filter(alert => alert.priority === 'high').length
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
              <p className="text-sm text-gray-500">Transportation Management System Insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[85vh]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Activity className="h-8 w-8 text-blue-600" />
              </motion.div>
            </div>
          ) : analyticsData ? (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {(() => {
                  const kpis = calculateKPIs(analyticsData);
                  return [
                    <KPICard
                      key="routes"
                      title="Active Routes"
                      value={kpis.totalRoutes}
                      change={8}
                      changeLabel="vs last month"
                      icon={<Route className="h-5 w-5 text-white" />}
                      color="bg-blue-500"
                    />,
                    <KPICard
                      key="utilization"
                      title="Avg Utilization"
                      value={`${kpis.avgUtilization}%`}
                      change={3}
                      icon={<Users className="h-5 w-5 text-white" />}
                      color="bg-green-500"
                    />,
                    <KPICard
                      key="revenue"
                      title="Total Revenue"
                      value={`₹${(kpis.totalRevenue / 1000).toFixed(0)}K`}
                      change={12}
                      icon={<DollarSign className="h-5 w-5 text-white" />}
                      color="bg-purple-500"
                    />,
                    <KPICard
                      key="passengers"
                      title="Total Passengers"
                      value={kpis.totalPassengers.toLocaleString()}
                      change={5}
                      icon={<Users className="h-5 w-5 text-white" />}
                      color="bg-orange-500"
                    />,
                    <KPICard
                      key="efficiency"
                      title="Fuel Efficiency"
                      value={`${kpis.avgFuelEfficiency} km/l`}
                      change={-2}
                      icon={<Fuel className="h-5 w-5 text-white" />}
                      color="bg-cyan-500"
                    />,
                    <KPICard
                      key="maintenance"
                      title="Maintenance Alerts"
                      value={kpis.maintenanceAlerts}
                      icon={<AlertTriangle className="h-5 w-5 text-white" />}
                      color="bg-red-500"
                    />
                  ];
                })()}
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Route Utilization */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Utilization</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.routeUtilization}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="route" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Utilization']} />
                      <Bar dataKey="utilization" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Revenue Trend */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, '']} />
                      <Area type="monotone" dataKey="profit" stackId="1" stroke="#10B981" fill="#10B981" />
                      <Area type="monotone" dataKey="expenses" stackId="1" stroke="#EF4444" fill="#EF4444" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vehicle Performance */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.vehiclePerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vehicle" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="trips" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="fuelEfficiency" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Passenger Trends */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Passenger Trends</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.passengerTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="new" stackId="a" fill="#10B981" />
                      <Bar dataKey="returning" stackId="a" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Maintenance Alerts */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Alerts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {analyticsData.maintenanceAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.priority === 'high'
                          ? 'border-red-500 bg-red-50'
                          : alert.priority === 'medium'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{alert.vehicle}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : alert.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {alert.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{alert.type}</p>
                      <p className="text-xs text-gray-500 mt-1">Due: {alert.dueDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-500">Unable to load analytics data. Please try again later.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;





