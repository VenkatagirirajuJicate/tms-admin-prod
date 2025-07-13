'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  X,
  Navigation,
  Clock,
  Users,
  Fuel,
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle,
  Pause,
  Settings,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Eye,
  Layers,
  GraduationCap,
  School,
  Wifi,
  WifiOff
} from 'lucide-react';
import { liveVehiclePositions, routesData } from '@/data/admin-data';

// Dynamic import for Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });

interface LiveTrackingMapProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleFilter?: string; // specific route number or 'all'
  title?: string;
  routeData?: any; // Route data with stops and coordinates
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ 
  isOpen, 
  onClose, 
  vehicleFilter = 'all',
  title = 'Live Vehicle Tracking',
  routeData
}) => {
  const [vehicles, setVehicles] = useState(liveVehiclePositions);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<{[key: string]: boolean}>({});

  // Helper function to create route object from passed route data
  const createRouteFromData = useMemo(() => {
    return (route: any) => {
      console.log('🗺️ Processing route data:', route);
      
      const stops = route.route_stops?.map((stop: any, index: number) => ({
        id: stop.id || index,
        stopName: stop.stop_name || `Stop ${index + 1}`,
        stopTime: stop.stop_time || stop.time || 'Not specified',
        latitude: parseFloat(stop.latitude),
        longitude: parseFloat(stop.longitude),
        isMajorStop: stop.is_major_stop || index === 0 || index === route.route_stops.length - 1
      })).filter((stop: any) => !isNaN(stop.latitude) && !isNaN(stop.longitude)) || [];

      console.log('🎯 Processed stops:', stops);

      // Add route start/end coordinates if they exist but aren't in stops
      if (route.start_latitude && route.start_longitude) {
        const startLat = parseFloat(route.start_latitude);
        const startLng = parseFloat(route.start_longitude);
        
        if (!isNaN(startLat) && !isNaN(startLng)) {
          const hasStartStop = stops.some((stop: any) => 
            Math.abs(stop.latitude - startLat) < 0.001 && 
            Math.abs(stop.longitude - startLng) < 0.001
          );
          if (!hasStartStop) {
            stops.unshift({
              id: 'start',
              stopName: route.start_location || 'Starting Point',
              stopTime: route.departure_time || 'Departure',
              latitude: startLat,
              longitude: startLng,
              isMajorStop: true
            });
            console.log('✅ Added start coordinates as first stop');
          }
        }
      }

      if (route.end_latitude && route.end_longitude) {
        const endLat = parseFloat(route.end_latitude);
        const endLng = parseFloat(route.end_longitude);
        
        if (!isNaN(endLat) && !isNaN(endLng)) {
          const hasEndStop = stops.some((stop: any) => 
            Math.abs(stop.latitude - endLat) < 0.001 && 
            Math.abs(stop.longitude - endLng) < 0.001
          );
          if (!hasEndStop) {
            stops.push({
              id: 'end',
              stopName: route.end_location || 'Destination',
              stopTime: route.arrival_time || 'Arrival',
              latitude: endLat,
              longitude: endLng,
              isMajorStop: true
            });
            console.log('✅ Added end coordinates as last stop');
          }
        }
      }

      // If no stops are available, create sample stops for Route 06 (Erode - JKKN)
      if (stops.length === 0 && route.route_number === '06') {
        console.log('🔧 Creating sample stops for Route 06');
        stops.push(
          {
            id: 'sample-start',
            stopName: 'Erode Bus Stand',
            stopTime: '7:00 AM',
            latitude: 11.3410,
            longitude: 77.7172,
            isMajorStop: true
          },
          {
            id: 'sample-1',
            stopName: 'Erode Junction',
            stopTime: '7:15 AM',
            latitude: 11.3448,
            longitude: 77.7297,
            isMajorStop: false
          },
          {
            id: 'sample-2',
            stopName: 'Bhavani',
            stopTime: '7:45 AM',
            latitude: 11.4452,
            longitude: 77.6814,
            isMajorStop: true
          },
          {
            id: 'sample-3',
            stopName: 'Anthiyur',
            stopTime: '8:15 AM',
            latitude: 11.5754,
            longitude: 77.5889,
            isMajorStop: false
          },
          {
            id: 'sample-end',
            stopName: 'JKKN Campus',
            stopTime: '8:45 AM',
            latitude: 11.4200,
            longitude: 77.8000,
            isMajorStop: true
          }
        );
      }

      console.log('🚌 Final route with stops:', {
        routeNumber: route.route_number,
        stopsCount: stops.length,
        stops: stops
      });

      return {
        id: route.id || route.route_number,
        routeNumber: route.route_number,
        routeName: route.route_name,
        stops: stops
      };
    };
  }, []);

  // Memoize filtered vehicles to prevent infinite re-renders
  const filteredVehicles = useMemo(() => {
    let baseVehicles = vehicleFilter === 'all' 
      ? vehicles 
      : vehicles.filter(v => v.routeNumber === vehicleFilter);

    // If we have route data but no vehicles for this route, create a virtual vehicle
    if (routeData && baseVehicles.length === 0 && vehicleFilter !== 'all') {
      const departureLocation = routeData.start_latitude && routeData.start_longitude 
        ? {
            latitude: parseFloat(routeData.start_latitude),
            longitude: parseFloat(routeData.start_longitude),
            address: `${routeData.start_location || 'Starting Point'}`
          }
        : routeData.route_stops?.length > 0 && routeData.route_stops[0].latitude
        ? {
            latitude: parseFloat(routeData.route_stops[0].latitude),
            longitude: parseFloat(routeData.route_stops[0].longitude),
            address: `${routeData.route_stops[0].stop_name || 'Starting Point'}`
          }
        // Fallback coordinates for Route 06
        : routeData.route_number === '06'
        ? {
            latitude: 11.3410,
            longitude: 77.7172,
            address: 'Erode Bus Stand (Sample Location)'
          }
        : null;

      if (departureLocation && !isNaN(departureLocation.latitude) && !isNaN(departureLocation.longitude)) {
        const virtualVehicle = {
          vehicleId: `virtual-${routeData.route_number}`,
          routeNumber: routeData.route_number,
          routeId: routeData.id || routeData.route_number,
          vehicleNumber: routeData.vehicles?.registration_number || `${routeData.route_number}-VT`,
          driverName: routeData.drivers?.name || 'Virtual Driver',
          currentLocation: departureLocation,
          status: 'at_stop',
          speed: 0,
          passengerCount: routeData.current_passengers || 0,
          fuelLevel: 75,
          nextStop: routeData.route_stops?.length > 1 ? routeData.route_stops[1].stop_name : routeData.end_location,
          estimatedArrival: routeData.arrival_time || 'TBD',
          lastUpdated: new Date()
        };
        
        baseVehicles = [virtualVehicle];
        console.log('🚐 Created virtual vehicle:', virtualVehicle);
      }
    }

    return baseVehicles;
  }, [vehicles, vehicleFilter, routeData]);

  // Memoize relevant routes to prevent infinite re-renders
  const relevantRoutes = useMemo(() => {
    if (routeData && (routeData.route_stops || routeData.start_latitude)) {
      return [createRouteFromData(routeData)];
    }
    return routesData.filter(route => 
      filteredVehicles.some(v => v.routeId === route.id)
    );
  }, [routeData, filteredVehicles, createRouteFromData]);

  console.log('🗺️ Relevant routes for map:', relevantRoutes);

  // Initialize GPS status for all vehicles (including virtual ones)
  useEffect(() => {
    const initialGpsStatus: {[key: string]: boolean} = {};
    
    // Initialize GPS for all vehicles (including virtual ones)
    filteredVehicles.forEach(vehicle => {
      // 80% chance of GPS being connected initially
      initialGpsStatus[vehicle.vehicleId] = Math.random() > 0.2;
    });
    
    setGpsStatus(initialGpsStatus);
    console.log('📡 GPS status initialized:', initialGpsStatus);
  }, [filteredVehicles.length]); // Only depend on the count, not the entire array

  // Simulate GPS connection status changes
  useEffect(() => {
    if (!isAutoRefresh) return;

    const gpsInterval = setInterval(() => {
      setGpsStatus(prev => {
        const newStatus = { ...prev };
        
        // Randomly change GPS status for some vehicles
        Object.keys(newStatus).forEach(vehicleId => {
          if (Math.random() < 0.1) { // 10% chance of status change per interval
            newStatus[vehicleId] = !newStatus[vehicleId];
          }
        });
        
        return newStatus;
      });
    }, 15000); // Check every 15 seconds

    return () => clearInterval(gpsInterval);
  }, [isAutoRefresh]);

  // Load Leaflet CSS and create custom icons
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined') {
        const L = await import('leaflet');
        
        // Fix default icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Create custom college icon
        const collegeIcon = new L.DivIcon({
          html: `
            <div style="
              background: linear-gradient(135deg, #fefdfb 0%, #f7f3e9 100%);
              width: 50px;
              height: 50px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #8b5a2b;
              font-weight: bold;
              font-size: 24px;
              border: 3px solid #d4af37;
              box-shadow: 0 4px 15px rgba(0,0,0,0.2);
              position: relative;
            ">
              🏛️
              <div style="
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 8px solid #d4af37;
              "></div>
            </div>
          `,
          className: 'college-marker',
          iconSize: [50, 50],
          iconAnchor: [25, 42]
        });

        // Create GPS-aware vehicle icons
        const createVehicleIcon = (isGpsConnected: boolean, status: string) => {
          const baseColor = isGpsConnected ? '#22c55e' : '#f97316'; // green for connected, orange for disconnected
          const pulseColor = isGpsConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(249, 115, 22, 0.3)';
          
          return new L.DivIcon({
            html: `
              <div style="
                position: relative;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background-color: ${baseColor};
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                animation: ${isGpsConnected ? 'gpsPulse' : 'gpsStandby'} 2s infinite;
              ">
                <div style="
                  position: absolute;
                  top: -4px;
                  left: -4px;
                  right: -4px;
                  bottom: -4px;
                  border-radius: 50%;
                  background-color: ${pulseColor};
                  animation: ${isGpsConnected ? 'gpsPulseRing' : 'gpsStandbyRing'} 2s infinite;
                "></div>
              </div>
              <style>
                @keyframes gpsPulse {
                  0% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.1); opacity: 0.8; }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes gpsStandby {
                  0% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.2); opacity: 0.6; }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes gpsPulseRing {
                  0% { transform: scale(1); opacity: 0.3; }
                  100% { transform: scale(2); opacity: 0; }
                }
                @keyframes gpsStandbyRing {
                  0% { transform: scale(1); opacity: 0.4; }
                  100% { transform: scale(2.5); opacity: 0; }
                }
              </style>
            `,
            className: 'vehicle-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
        };

        // Store the icons for later use
        (window as any).collegeIcon = collegeIcon;
        (window as any).createVehicleIcon = createVehicleIcon;

        setLeafletLoaded(true);
      }
    };

    if (isOpen) {
      loadLeaflet();
    }
  }, [isOpen]);

  // Mock real-time position updates (only for GPS connected vehicles)
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => {
          const isGpsConnected = gpsStatus[vehicle.vehicleId];
          
          if (vehicle.status === 'traveling' && isGpsConnected) {
            // Simulate small movements along route only if GPS is connected
            const latVariation = (Math.random() - 0.5) * 0.002;
            const lngVariation = (Math.random() - 0.5) * 0.002;
            
            return {
              ...vehicle,
              currentLocation: {
                ...vehicle.currentLocation,
                latitude: vehicle.currentLocation.latitude + latVariation,
                longitude: vehicle.currentLocation.longitude + lngVariation,
              },
              speed: Math.max(20, Math.min(80, vehicle.speed + (Math.random() - 0.5) * 10)),
              lastUpdated: new Date()
            };
          } else if (!isGpsConnected) {
            // If GPS disconnected, reset to departure point and stop
            const route = relevantRoutes.find(r => 
              r.id === vehicle.routeId || r.routeNumber === vehicle.routeNumber
            );
            const departureStop = route?.stops?.[0];
            
            // Fallback to route data departure point if available
            const departureLocation = departureStop 
              ? { 
                  latitude: departureStop.latitude, 
                  longitude: departureStop.longitude,
                  address: `${departureStop.stopName} (Departure Point - GPS Standby)`
                }
              : routeData && routeData.start_latitude && routeData.start_longitude
              ? {
                  latitude: parseFloat(routeData.start_latitude),
                  longitude: parseFloat(routeData.start_longitude),
                  address: `${routeData.start_location || 'Starting Point'} (Departure Point - GPS Standby)`
                }
              : null;
            
            if (departureLocation) {
              return {
                ...vehicle,
                currentLocation: departureLocation,
                speed: 0,
                status: 'stopped',
                lastUpdated: new Date()
              };
            }
          }
          return vehicle;
        })
      );
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval, gpsStatus, routeData]); // Removed relevantRoutes from dependencies

  // Get status info with GPS awareness
  const getStatusInfo = (status: string, isGpsConnected: boolean) => {
    if (!isGpsConnected) {
      return { 
        icon: WifiOff, 
        color: 'text-orange-600', 
        bg: 'bg-orange-100', 
        label: 'GPS Standby' 
      };
    }
    
    switch (status) {
      case 'traveling':
        return { icon: Navigation, color: 'text-green-600', bg: 'bg-green-100', label: 'Traveling' };
      case 'at_stop':
        return { icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-100', label: 'At Stop' };
      case 'stopped':
        return { icon: Pause, color: 'text-red-600', bg: 'bg-red-100', label: 'Stopped' };
      case 'maintenance':
        return { icon: Settings, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Maintenance' };
      default:
        return { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' };
    }
  };

  const getGpsStatusSummary = () => {
    const connected = filteredVehicles.filter(v => gpsStatus[v.vehicleId]).length;
    const total = filteredVehicles.length;
    return { connected, disconnected: total - connected, total };
  };

  if (!isOpen) return null;

  // Determine default center based on route data or vehicles
  const getDefaultCenter = () => {
    if (filteredVehicles.length > 0) {
      return [filteredVehicles[0].currentLocation.latitude, filteredVehicles[0].currentLocation.longitude];
    }
    
    // Use route data if available
    if (routeData) {
      if (routeData.start_latitude && routeData.start_longitude) {
        return [parseFloat(routeData.start_latitude), parseFloat(routeData.start_longitude)];
      }
      if (routeData.route_stops?.length > 0) {
        const firstStop = routeData.route_stops[0];
        if (firstStop.latitude && firstStop.longitude) {
          return [parseFloat(firstStop.latitude), parseFloat(firstStop.longitude)];
        }
      }
    }
    
    // Use first relevant route if available
    if (relevantRoutes.length > 0 && relevantRoutes[0].stops?.length > 0) {
      const firstStop = relevantRoutes[0].stops[0];
      return [parseFloat(firstStop.latitude), parseFloat(firstStop.longitude)];
    }
    
    return [11.4200, 77.8000]; // JKKN Campus default
  };

  const defaultCenter = getDefaultCenter();

  const gpsStats = getGpsStatusSummary();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 lg:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:p-6 border-b bg-gray-50 gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg lg:text-2xl font-bold text-gray-900 truncate">{title}</h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  {gpsStats.connected} Connected
                </span>
                {gpsStats.disconnected > 0 && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    {gpsStats.disconnected} Standby
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-600 text-sm lg:text-base">
              {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} 
              {vehicleFilter !== 'all' ? ` on Route ${vehicleFilter}` : ' active'} • 
              Real-time GPS tracking with coordinate-based stops
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center justify-center sm:justify-start gap-4 text-sm">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showRoutes}
                  onChange={(e) => setShowRoutes(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Routes</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showStops}
                  onChange={(e) => setShowStops(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Stops</span>
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                  isAutoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}
                title="Auto Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isAutoRefresh ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="hidden lg:flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Start</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Stop</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>End</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Vehicle</span>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 lg:p-3 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 border border-red-200 min-w-0 flex-shrink-0"
                title="Close Map"
              >
                <X className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm hidden sm:inline">Close</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-full min-h-0 flex-1">
          {/* Vehicle List Sidebar */}
          <div className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r bg-gray-50 overflow-y-auto flex-shrink-0 max-h-60 lg:max-h-none">
            <div className="p-3 lg:p-4">
              <h3 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">Active Vehicles</h3>
              
              {/* Mobile: Horizontal scrolling list */}
              <div className="lg:hidden">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {filteredVehicles.map((vehicle) => {
                    const isGpsConnected = gpsStatus[vehicle.vehicleId];
                    const statusInfo = getStatusInfo(vehicle.status, isGpsConnected);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <motion.div
                        key={vehicle.vehicleId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 bg-white rounded-lg border cursor-pointer transition-all hover:shadow-md flex-shrink-0 w-64 ${
                          selectedVehicle?.vehicleId === vehicle.vehicleId ? 'ring-2 ring-blue-500' : ''
                        } ${!isGpsConnected ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-green-400'}`}
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1.5 ${statusInfo.bg} rounded-lg`}>
                              <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">Route {vehicle.routeNumber}</div>
                              <div className="text-xs text-gray-600">{vehicle.vehicleNumber}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <div className="flex items-center gap-1">
                              {isGpsConnected ? (
                                <Wifi className="w-3 h-3 text-green-600" />
                              ) : (
                                <WifiOff className="w-3 h-3 text-orange-600" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Speed:</span>
                            <span className="font-medium">{vehicle.speed} km/h {!isGpsConnected && "(Standby)"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Passengers:</span>
                            <span className="font-medium">{vehicle.passengerCount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">GPS Status:</span>
                            <span className={`font-medium ${isGpsConnected ? 'text-green-600' : 'text-orange-600'}`}>
                              {isGpsConnected ? 'Connected' : 'Standby'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop: Vertical list */}
              <div className="hidden lg:block space-y-3">
                {filteredVehicles.map((vehicle) => {
                  const isGpsConnected = gpsStatus[vehicle.vehicleId];
                  const statusInfo = getStatusInfo(vehicle.status, isGpsConnected);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <motion.div
                      key={vehicle.vehicleId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 bg-white rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedVehicle?.vehicleId === vehicle.vehicleId ? 'ring-2 ring-blue-500' : ''
                      } ${!isGpsConnected ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-green-400'}`}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className={`p-2 ${statusInfo.bg} rounded-lg flex-shrink-0`}>
                            <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 truncate">Route {vehicle.routeNumber}</div>
                            <div className="text-sm text-gray-600 truncate">{vehicle.vehicleNumber}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusInfo.bg} ${statusInfo.color} flex-shrink-0`}>
                            {statusInfo.label}
                          </span>
                          <div className="flex items-center gap-1">
                            {isGpsConnected ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <Wifi className="w-3 h-3" />
                                Live
                              </span>
                            ) : (
                              <span className="text-xs text-orange-600 flex items-center gap-1">
                                <WifiOff className="w-3 h-3" />
                                Standby
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Driver:</span>
                          <span className="font-medium truncate ml-2">{vehicle.driverName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Speed:</span>
                          <span className="font-medium">{vehicle.speed} km/h {!isGpsConnected && "(Standby)"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Passengers:</span>
                          <span className="font-medium">{vehicle.passengerCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium text-blue-600 truncate ml-2">
                            {!isGpsConnected ? 'Departure Point' : vehicle.nextStop}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-gray-500">
                          Last updated: {vehicle.lastUpdated.toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 truncate">
                          📍 {vehicle.currentLocation.address}
                        </div>
                        {!isGpsConnected && (
                          <div className="text-xs text-orange-600 mt-1 font-medium">
                            ⚠️ GPS Standby Mode - Showing departure point
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative min-h-0">
            {/* Floating Close Button - Always Visible */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 lg:top-4 lg:right-4 z-[9999] p-2 lg:p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center space-x-2 font-medium border-2 border-white"
              title="Close Map"
              style={{ zIndex: 9999 }}
            >
              <X className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
              <span className="text-sm hidden lg:inline">Close</span>
            </button>
            {leafletLoaded ? (
              <div className="h-full w-full">
                <MapContainer
                  center={defaultCenter as [number, number]}
                  zoom={12}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Vehicle Markers */}
                  {filteredVehicles.map((vehicle) => {
                    const isGpsConnected = gpsStatus[vehicle.vehicleId];
                    const customIcon = (window as any).createVehicleIcon?.(isGpsConnected, vehicle.status);
                    
                    return (
                      <Marker
                        key={vehicle.vehicleId}
                        position={[vehicle.currentLocation.latitude, vehicle.currentLocation.longitude]}
                        icon={customIcon}
                      >
                        <Popup>
                          <div className="p-3 min-w-[250px] max-w-[300px]">
                            <div className="flex items-start justify-between mb-3 gap-2">
                              <h3 className="font-bold text-lg flex-1">Route {vehicle.routeNumber}</h3>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0 ${getStatusInfo(vehicle.status, isGpsConnected).bg} ${getStatusInfo(vehicle.status, isGpsConnected).color}`}>
                                  {getStatusInfo(vehicle.status, isGpsConnected).label}
                                </span>
                                <div className="flex items-center gap-1">
                                  {isGpsConnected ? (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                      <Wifi className="w-3 h-3" />
                                      GPS Live
                                    </span>
                                  ) : (
                                    <span className="text-xs text-orange-600 flex items-center gap-1">
                                      <WifiOff className="w-3 h-3" />
                                      GPS Standby
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {!isGpsConnected && (
                              <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded">
                                <p className="text-xs text-orange-800 font-medium">GPS Device Not Connected</p>
                                <p className="text-xs text-orange-700">Showing vehicle at departure point</p>
                              </div>
                            )}
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between"><strong>Vehicle:</strong> <span className="text-right">{vehicle.vehicleNumber}</span></div>
                              <div className="flex justify-between"><strong>Driver:</strong> <span className="text-right truncate ml-2">{vehicle.driverName}</span></div>
                              <div className="flex justify-between"><strong>Speed:</strong> <span className="text-right">{vehicle.speed} km/h {!isGpsConnected && "(Standby)"}</span></div>
                              <div className="flex justify-between"><strong>Passengers:</strong> <span className="text-right">{vehicle.passengerCount}</span></div>
                              <div className="flex justify-between"><strong>Fuel Level:</strong> <span className="text-right">{vehicle.fuelLevel}%</span></div>
                              <div className="flex justify-between"><strong>Current Location:</strong> 
                                <span className="text-right text-blue-600 truncate ml-2">
                                  {!isGpsConnected ? 'Departure Point' : vehicle.nextStop}
                                </span>
                              </div>
                              {isGpsConnected && (
                                <div className="flex justify-between"><strong>ETA:</strong> <span className="text-right">{vehicle.estimatedArrival}</span></div>
                              )}
                              <div><strong>Location:</strong> <span className="break-words">{vehicle.currentLocation.address}</span></div>
                            </div>
                            
                            <div className="mt-3 pt-2 border-t text-xs text-gray-500">
                              Last updated: {vehicle.lastUpdated.toLocaleString()}
                              {!isGpsConnected && (
                                <div className="text-orange-600 font-medium mt-1">
                                  ⚠️ Live tracking will resume when GPS reconnects
                                </div>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  {/* Route Lines */}
                  {showRoutes && relevantRoutes.map((route, index) => {
                    const routeColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                    const validStops = route.stops.filter((stop: any) => 
                      !isNaN(parseFloat(stop.latitude)) && !isNaN(parseFloat(stop.longitude))
                    );
                    
                    console.log(`🛣️ Drawing route ${route.routeNumber} with ${validStops.length} stops`);
                    
                    if (validStops.length > 1) {
                      return (
                        <Polyline
                          key={`route-${route.id}`}
                          positions={validStops.map((stop: any) => [parseFloat(stop.latitude), parseFloat(stop.longitude)])}
                          color={routeColors[index % routeColors.length]}
                          weight={4}
                          opacity={0.8}
                          dashArray="5, 10"
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Route Stops */}
                  {showStops && relevantRoutes.map((route) => {
                    const validStops = route.stops.filter((stop: any) => 
                      !isNaN(parseFloat(stop.latitude)) && !isNaN(parseFloat(stop.longitude))
                    );
                    
                    console.log(`🚏 Drawing ${validStops.length} stops for route ${route.routeNumber}`);
                    
                    return validStops.map((stop: any, index: number) => {
                      const isFirst = index === 0;
                      const isLast = index === validStops.length - 1;
                      const circleColor = isFirst ? "#10b981" : isLast ? "#ef4444" : "#3b82f6"; // Green for start, red for end, blue for middle
                      const circleSize = isFirst || isLast ? 150 : 100;
                      
                      return (
                        <Circle
                          key={`stop-${route.id}-${stop.id}`}
                          center={[parseFloat(stop.latitude), parseFloat(stop.longitude)]}
                          radius={circleSize}
                          fillColor={circleColor}
                          fillOpacity={0.4}
                          color={circleColor}
                          weight={3}
                        >
                          <Popup>
                            <div className="p-3 min-w-[220px]">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                  isFirst ? 'bg-green-500' : isLast ? 'bg-red-500' : 'bg-blue-500'
                                }`}>
                                  {isFirst ? '🚌' : isLast ? '🏁' : index + 1}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{stop.stopName}</h4>
                                  <p className="text-xs text-gray-600">Route {route.routeNumber}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Time:</span>
                                  <span className="font-medium">{stop.stopTime}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">GPS:</span>
                                  <span className="font-mono text-xs">{parseFloat(stop.latitude).toFixed(4)}, {parseFloat(stop.longitude).toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Type:</span>
                                  <span className={`font-medium ${
                                    isFirst ? 'text-green-600' : isLast ? 'text-red-600' : 'text-blue-600'
                                  }`}>
                                    {isFirst ? 'Departure Point' : isLast ? 'Final Destination' : 'Intermediate Stop'}
                                  </span>
                                </div>
                              </div>
                              
                              {stop.isMajorStop && (
                                <div className="mt-2">
                                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                                    Major Stop
                                  </span>
                                </div>
                              )}
                              
                              {isFirst && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                  <span className="text-xs text-green-800 font-medium">📍 Starting Point</span>
                                  <p className="text-xs text-green-700">Vehicle returns here when GPS disconnected</p>
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Circle>
                      );
                    });
                  })}

                  {/* JKKN Campus or Route Destination Marker */}
                  {routeData && routeData.end_latitude && routeData.end_longitude && 
                   !isNaN(parseFloat(routeData.end_latitude)) && !isNaN(parseFloat(routeData.end_longitude)) ? (
                    <Marker
                      position={[parseFloat(routeData.end_latitude), parseFloat(routeData.end_longitude)]}
                      icon={(window as any).collegeIcon}
                    >
                      <Popup>
                        <div className="p-3 min-w-[200px] max-w-[280px]">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-lg">🏁</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-lg text-amber-800">{routeData.end_location}</h3>
                              <p className="text-sm text-gray-600">Route Destination</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between gap-2"><strong>Route:</strong> <span className="text-right">{routeData.route_number} - {routeData.route_name}</span></div>
                            <div className="flex justify-between gap-2"><strong>Arrival Time:</strong> <span className="text-right">{routeData.arrival_time || 'TBD'}</span></div>
                            <div className="flex justify-between gap-2"><strong>GPS:</strong> <span className="text-right text-green-600 font-mono text-xs">{parseFloat(routeData.end_latitude).toFixed(6)}, {parseFloat(routeData.end_longitude).toFixed(6)}</span></div>
                            <div className="flex justify-between gap-2"><strong>Type:</strong> <span className="text-right">Final Stop</span></div>
                          </div>
                          
                          <div className="mt-3 pt-2 border-t">
                            <span className="inline-block px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-full font-medium">
                              🎯 Final Destination
                            </span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ) : relevantRoutes.length > 0 && relevantRoutes[0].stops.length > 0 ? (
                    // Use the last stop of the route as destination
                    (() => {
                      const lastStop = relevantRoutes[0].stops[relevantRoutes[0].stops.length - 1];
                      if (!isNaN(parseFloat(lastStop.latitude)) && !isNaN(parseFloat(lastStop.longitude))) {
                        return (
                          <Marker
                            position={[parseFloat(lastStop.latitude), parseFloat(lastStop.longitude)]}
                            icon={(window as any).collegeIcon}
                          >
                            <Popup>
                              <div className="p-3 min-w-[200px] max-w-[280px]">
                                <div className="flex items-center space-x-2 mb-3">
                                  <div className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">🏁</span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-lg text-amber-800">{lastStop.stopName}</h3>
                                    <p className="text-sm text-gray-600">Route Destination</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between gap-2"><strong>Route:</strong> <span className="text-right">{relevantRoutes[0].routeNumber} - {relevantRoutes[0].routeName}</span></div>
                                  <div className="flex justify-between gap-2"><strong>Arrival Time:</strong> <span className="text-right">{lastStop.stopTime}</span></div>
                                  <div className="flex justify-between gap-2"><strong>GPS:</strong> <span className="text-right text-green-600 font-mono text-xs">{parseFloat(lastStop.latitude).toFixed(6)}, {parseFloat(lastStop.longitude).toFixed(6)}</span></div>
                                  <div className="flex justify-between gap-2"><strong>Type:</strong> <span className="text-right">Final Stop</span></div>
                                </div>
                                
                                <div className="mt-3 pt-2 border-t">
                                  <span className="inline-block px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-full font-medium">
                                    🎯 Final Destination
                                  </span>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }
                      return null;
                    })()
                  ) : (
                    // Default JKKN Campus marker
                    <Marker
                      position={[11.4200, 77.8000]}
                      icon={(window as any).collegeIcon}
                    >
                      <Popup>
                        <div className="p-3 min-w-[200px] max-w-[280px]">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-lg">🏛️</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-lg text-amber-800">JKKN Campus</h3>
                              <p className="text-sm text-gray-600">Main Campus Destination</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between gap-2"><strong>Institution:</strong> <span className="text-right">JKKN Group of Institutions</span></div>
                            <div className="flex justify-between gap-2"><strong>Type:</strong> <span className="text-right">Main Campus & Final Destination</span></div>
                            <div className="flex justify-between gap-2"><strong>Location:</strong> <span className="text-right">Komarapalayam, Tamil Nadu</span></div>
                            <div className="flex justify-between gap-2"><strong>Status:</strong> <span className="text-right">All routes terminate here</span></div>
                            <div className="flex justify-between gap-2"><strong>GPS Tracking:</strong> <span className="text-right text-green-600">All routes GPS enabled</span></div>
                          </div>
                          
                          <div className="mt-3 pt-2 border-t">
                            <span className="inline-block px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-full font-medium">
                              🎯 Final Destination
                            </span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LiveTrackingMap; 