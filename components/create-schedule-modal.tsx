'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Calendar,
  Clock,
  Users,
  Bus,
  User,
  CheckCircle,
  AlertCircle,
  Plus,
  CheckSquare,
  Square
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateForDatabase, getMinimumScheduleDate, canAdminEnableScheduleForDate, getSchedulingRestrictionMessage } from '@/lib/date-utils';

interface Route {
  id: string;
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
  total_capacity: number;
  departure_time: string;
  arrival_time: string;
  driver_id?: string;
  vehicle_id?: string;
  status?: string;
}

interface Driver {
  id: string;
  name: string;
  status: string;
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  capacity: number;
  status: string;
}

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onScheduleCreated: () => void;
}

export default function CreateScheduleModal({ 
  isOpen, 
  onClose, 
  selectedDate,
  onScheduleCreated 
}: CreateScheduleModalProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState<'single' | 'multiple'>('single');
  const [customTimes, setCustomTimes] = useState<{ [key: string]: { departureTime: string; arrivalTime: string } }>({});

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [routesRes, driversRes, vehiclesRes] = await Promise.all([
        fetch('/api/admin/routes'),
        fetch('/api/admin/drivers'),
        fetch('/api/admin/vehicles')
      ]);

      // Check if all responses are successful
      if (!routesRes.ok || !driversRes.ok || !vehiclesRes.ok) {
        throw new Error('One or more API calls failed');
      }

      const [routesResult, driversResult, vehiclesResult] = await Promise.all([
        routesRes.json(),
        driversRes.json(),
        vehiclesRes.json()
      ]);

      // Extract data from structured API responses
      const routesData = routesResult.success ? routesResult.data || [] : [];
      const driversData = driversResult.success ? driversResult.data || [] : [];
      const vehiclesData = vehiclesResult.success ? vehiclesResult.data || [] : [];

      // Ensure data is arrays before filtering
      const validRoutesData = Array.isArray(routesData) ? routesData : [];
      const validDriversData = Array.isArray(driversData) ? driversData : [];
      const validVehiclesData = Array.isArray(vehiclesData) ? vehiclesData : [];

      // Filter active items (routes might not have status field, so check if it exists)
      setRoutes(validRoutesData.filter((r: any) => !r.status || r.status === 'active'));
      setDrivers(validDriversData.filter((d: any) => !d.status || d.status === 'active'));
      setVehicles(validVehiclesData.filter((v: any) => !v.status || v.status === 'active'));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
      // Set empty arrays as fallback
      setRoutes([]);
      setDrivers([]);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelection = (routeId: string) => {
    setSelectedRoutes(prev => {
      if (prev.includes(routeId)) {
        return prev.filter(id => id !== routeId);
      } else {
        return [...prev, routeId];
      }
    });
  };

  const handleSelectAll = () => {
    const allRouteIds = routes.map(route => route.id);
    setSelectedRoutes(allRouteIds);
    toast.success(`Selected all ${allRouteIds.length} routes`);
  };

  const handleDeselectAll = () => {
    setSelectedRoutes([]);
    toast.success('Deselected all routes');
  };

  const handleTimeChange = (routeId: string, field: 'departureTime' | 'arrivalTime', value: string) => {
    setCustomTimes(prev => ({
      ...prev,
      [routeId]: {
        ...prev[routeId],
        [field]: value
      }
    }));
  };

  const createSchedules = async () => {
    if (!selectedDate || selectedRoutes.length === 0) {
      toast.error('Please select at least one route');
      return;
    }

    // Validate date for admin scheduling
    const dateValidation = canAdminEnableScheduleForDate(selectedDate);
    if (!dateValidation.canEnable) {
      toast.error(dateValidation.reason || 'Cannot create schedules for this date');
      return;
    }

    setCreating(true);
    try {
      const scheduleData = selectedRoutes.map(routeId => {
        const route = routes.find(r => r.id === routeId);
        if (!route) return null;

        const customTime = customTimes[routeId];
        return {
          routeId,
          scheduleDate: formatDateForDatabase(selectedDate),
          departureTime: customTime?.departureTime || route.departure_time,
          arrivalTime: customTime?.arrivalTime || route.arrival_time,
          availableSeats: route.total_capacity,
          driverId: route.driver_id,
          vehicleId: route.vehicle_id,
          status: 'scheduled'
        };
      }).filter(Boolean);

      const response = await fetch('/api/admin/schedules/create-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: scheduleData })
      });

      if (!response.ok) {
        throw new Error('Failed to create schedules');
      }

      const result = await response.json();
      toast.success(`Successfully created ${result.created} schedule(s)`);
      onScheduleCreated();
      onClose();
    } catch (error) {
      console.error('Error creating schedules:', error);
      toast.error('Failed to create schedules');
    } finally {
      setCreating(false);
    }
  };

  const allSelected = routes.length > 0 && selectedRoutes.length === routes.length;
  const someSelected = selectedRoutes.length > 0 && selectedRoutes.length < routes.length;

  if (!isOpen || !selectedDate) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Schedules</h2>
                <p className="text-sm text-gray-600">
                  Enable booking for {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading routes...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Route Selection */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Select Routes to Enable</h3>
                    
                    {/* Select All/Deselect All Controls */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={allSelected ? handleDeselectAll : handleSelectAll}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                            allSelected 
                              ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' 
                              : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          {allSelected ? (
                            <>
                              <CheckSquare className="w-4 h-4" />
                              <span>Deselect All</span>
                            </>
                          ) : (
                            <>
                              <Square className="w-4 h-4" />
                              <span>Select All</span>
                            </>
                          )}
                        </button>
                        
                        {selectedRoutes.length > 0 && (
                          <span className="text-sm text-gray-600">
                            {selectedRoutes.length} of {routes.length} selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {routes.map(route => (
                      <div
                        key={route.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedRoutes.includes(route.id)
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleRouteSelection(route.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{route.route_number}</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{route.route_name}</h4>
                              <p className="text-sm text-gray-600">{route.start_location} → {route.end_location}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {selectedRoutes.includes(route.id) ? (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{route.departure_time} - {route.arrival_time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{route.total_capacity} seats</span>
                          </div>
                        </div>

                        {/* Custom Times */}
                        {selectedRoutes.includes(route.id) && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-2">Custom Times (Optional)</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Departure Time</label>
                                <input
                                  type="time"
                                  value={customTimes[route.id]?.departureTime || route.departure_time}
                                  onChange={(e) => handleTimeChange(route.id, 'departureTime', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Arrival Time</label>
                                <input
                                  type="time"
                                  value={customTimes[route.id]?.arrivalTime || route.arrival_time}
                                  onChange={(e) => handleTimeChange(route.id, 'arrivalTime', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                {selectedRoutes.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Schedule Summary</h4>
                    </div>
                    <p className="text-sm text-blue-800">
                      {selectedRoutes.length} route{selectedRoutes.length !== 1 ? 's' : ''} will be enabled for booking on{' '}
                      {selectedDate.toLocaleDateString()}
                    </p>
                    <div className="mt-2 text-sm text-blue-700">
                      Total capacity: {selectedRoutes.reduce((sum, routeId) => {
                        const route = routes.find(r => r.id === routeId);
                        return sum + (route?.total_capacity || 0);
                      }, 0)} seats
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedRoutes.length} route{selectedRoutes.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createSchedules}
                  disabled={creating || selectedRoutes.length === 0}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Schedules</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 