'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  MapPin,
  Clock,
  Users,
  Car,
  UserCheck,
  Edit,
  Trash2,
  Eye,
  MapPin as RouteIcon,
  Star,
  AlertCircle,
  Navigation,
  Activity,
  X,
  Save,
  Loader2,
  Wifi,
  WifiOff,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DatabaseService } from '@/lib/database';

const RouteCard = ({ route, onEdit, onDelete, onView, onLiveTrack, userRole }: any) => {
  const canEdit = ['super_admin', 'transport_manager'].includes(userRole);
  const canDelete = userRole === 'super_admin';
  const canManage = ['super_admin', 'transport_manager'].includes(userRole);
  const canTrack = ['super_admin', 'transport_manager', 'driver_supervisor'].includes(userRole);
  
  const occupancyPercentage = route.current_passengers ? (route.current_passengers / route.total_capacity) * 100 : 0;
  const hasGPSCoordinates = route.start_latitude && route.start_longitude;
  const isLiveTrackingEnabled = hasGPSCoordinates && route.status === 'active';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            route.status === 'active' ? 'bg-green-100' : 
            route.status === 'maintenance' ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <RouteIcon className={`w-6 h-6 ${
              route.status === 'active' ? 'text-green-600' : 
              route.status === 'maintenance' ? 'text-yellow-600' : 'text-red-600'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{route.route_number}</h3>
            <p className="text-sm text-gray-600">{route.route_name}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
            route.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : route.status === 'maintenance'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {route.status}
          </span>
          {hasGPSCoordinates && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              GPS Enabled
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{route.route_stops?.length || 0} stops</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{route.duration}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Navigation className="w-4 h-4" />
          <span>{route.distance} km</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Activity className="w-4 h-4" />
          <span>₹{route.fare}</span>
        </div>
      </div>

      {canManage && (
        <div className="border-t border-gray-100 pt-4 mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <div className="flex items-center justify-between mb-1">
              <span>Driver: {route.drivers?.name || 'Not Assigned'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Vehicle: {route.vehicles?.registration_number || 'Not Assigned'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Occupancy</span>
          <span>{route.current_passengers || 0}/{route.total_capacity}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              occupancyPercentage > 90 ? 'bg-red-500' :
              occupancyPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${occupancyPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* GPS Status and Live Tracking Info */}
      {hasGPSCoordinates && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Live Tracking Ready</span>
            </div>
            <span className="text-xs text-green-600">GPS Coordinates Available</span>
          </div>
          <div className="mt-2 text-xs text-green-700">
            Start: {route.start_latitude?.toFixed(4)}, {route.start_longitude?.toFixed(4)}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={() => onView(route)}
            className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit(route)}
              className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(route)}
              className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
        
        {/* Live Tracking Button */}
        {canTrack && isLiveTrackingEnabled && (
          <button
            onClick={() => onLiveTrack(route)}
            className="w-full bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Navigation className="w-4 h-4" />
            <span>Live Track Vehicle</span>
          </button>
        )}
        
        {/* GPS Setup Required */}
        {!hasGPSCoordinates && canEdit && (
          <div className="w-full bg-orange-50 text-orange-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-2">
            <WifiOff className="w-4 h-4" />
            <span>GPS Setup Required</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const RoutesPage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('transport_manager'); // Default role

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const routesData = await DatabaseService.getRoutes();
        setRoutes(routesData);
      } catch (err) {
        console.error('Error fetching routes:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch routes');
        toast.error('Failed to load routes');
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  const handleEdit = (route: any) => {
    toast.info('Edit functionality coming soon');
  };

  const handleDelete = (route: any) => {
    toast.info('Delete functionality coming soon');
  };

  const handleView = (route: any) => {
    toast.info('View details functionality coming soon');
  };

  const handleLiveTrack = (route: any) => {
    toast.info('Live tracking functionality coming soon');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading routes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Routes</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Routes Management</h1>
        <p className="text-gray-600">Manage transport routes and their configurations</p>
      </div>

      {routes.length === 0 ? (
        <div className="text-center py-12">
          <RouteIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Routes Found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first transport route.</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add Route
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route: any) => (
            <RouteCard
              key={route.id}
              route={route}
              userRole={userRole}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onLiveTrack={handleLiveTrack}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoutesPage; 