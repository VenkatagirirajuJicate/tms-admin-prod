'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLngExpression, LeafletMouseEvent, Icon } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Navigation, CheckCircle, X } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import toast from 'react-hot-toast';

// Fix for Leaflet default marker icons in Next.js
import 'leaflet/dist/leaflet.css';

// Create custom marker icons
const createCustomIcon = (color: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 7.8 12.5 28.5 12.5 28.5S25 20.3 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
      <circle cx="12.5" cy="12.5" r="6" fill="white"/>
    </svg>
  `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const defaultIcon = createCustomIcon('#3B82F6'); // Blue
const startIcon = createCustomIcon('#10B981'); // Green  
const endIcon = createCustomIcon('#EF4444'); // Red
const stopIcon = createCustomIcon('#F59E0B'); // Orange

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  initialLocation?: { lat: number; lng: number };
  title?: string;
  type?: 'default' | 'start' | 'end' | 'stop';
}

interface LocationMarkerProps {
  position: LatLngExpression | null;
  onLocationChange: (latlng: LatLngExpression) => void;
  type: 'default' | 'start' | 'end' | 'stop';
}

// Component to handle map clicks and marker placement
const LocationMarker: React.FC<LocationMarkerProps> = ({ position, onLocationChange, type }) => {
  const map = useMapEvents({
    click(e: LeafletMouseEvent) {
      onLocationChange([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  const getIcon = () => {
    switch (type) {
      case 'start': return startIcon;
      case 'end': return endIcon;
      case 'stop': return stopIcon;
      default: return defaultIcon;
    }
  };

  return position ? (
    <Marker position={position} icon={getIcon()} />
  ) : null;
};

const MapPicker: React.FC<MapPickerProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation,
  title = "Select Location",
  type = 'default'
}) => {
  // Default to a central location (Pune, India - good for Indian transport systems)
  const defaultCenter: LatLngExpression = [18.5204, 73.8567];
  
  const [position, setPosition] = useState<LatLngExpression | null>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [coordinates, setCoordinates] = useState({
    lat: initialLocation?.lat || '',
    lng: initialLocation?.lng || ''
  });

  // Update coordinates when position changes
  useEffect(() => {
    if (position) {
      const [lat, lng] = Array.isArray(position) ? position : [position.lat, position.lng];
      setCoordinates({
        lat: lat.toFixed(6),
        lng: lng.toFixed(6)
      });
    }
  }, [position]);

  // Handle manual coordinate input
  const handleCoordinateChange = (field: 'lat' | 'lng', value: string) => {
    setCoordinates(prev => ({ ...prev, [field]: value }));
    
    // Update position if both coordinates are valid
    const lat = field === 'lat' ? parseFloat(value) : parseFloat(coordinates.lat);
    const lng = field === 'lng' ? parseFloat(value) : parseFloat(coordinates.lng);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      setPosition([lat, lng]);
    }
  };

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsGeocoding(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
          toast.success('Current location obtained');
          setIsGeocoding(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Failed to get current location');
          setIsGeocoding(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  }, []);

  // Simple geocoding (in a real app, you'd use a proper geocoding service)
  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsGeocoding(true);
    try {
      // This is a basic implementation - in production, use Google Geocoding API or similar
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const results = await response.json();
      
      if (results && results.length > 0) {
        const { lat, lon } = results[0];
        setPosition([parseFloat(lat), parseFloat(lon)]);
        toast.success('Location found');
      } else {
        toast.error('Location not found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Search failed');
    } finally {
      setIsGeocoding(false);
    }
  }, [searchQuery]);

  const handleConfirm = () => {
    if (!position) {
      toast.error('Please select a location on the map');
      return;
    }

    const [lat, lng] = Array.isArray(position) ? position : [position.lat, position.lng];
    onLocationSelect({ lat, lng });
    onClose();
  };

  const getIconColor = () => {
    switch (type) {
      case 'start': return 'text-green-600';
      case 'end': return 'text-red-600';
      case 'stop': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'start': return 'Start Location';
      case 'end': return 'End Location';
      case 'stop': return 'Stop Location';
      default: return 'Location';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className={`h-5 w-5 ${getIconColor()}`} />
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <span className="text-sm text-gray-500">- {getTypeLabel()}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search and Controls */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>Search Location</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter city, address, or landmark"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                  />
                  <Button
                    onClick={searchLocation}
                    disabled={isGeocoding}
                    variant="outline"
                  >
                    {isGeocoding ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Search className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Current Location */}
              <div className="space-y-2">
                <Label>Quick Actions</Label>
                <Button
                  onClick={getCurrentLocation}
                  disabled={isGeocoding}
                  variant="outline"
                  className="w-full"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Use Current Location
                </Button>
              </div>
            </div>

            {/* Manual Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="18.520430"
                  value={coordinates.lat}
                  onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="73.856743"
                  value={coordinates.lng}
                  onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="relative" style={{ height: '400px' }}>
            {typeof window !== 'undefined' && (
              <MapContainer
                center={position || defaultCenter}
                zoom={position ? 15 : 10}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker 
                  position={position} 
                  onLocationChange={setPosition} 
                  type={type}
                />
              </MapContainer>
            )}
            
            {/* Instructions Overlay */}
            <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-md">
              <p className="text-sm text-gray-600">
                <strong>Click on the map</strong> to select a location
              </p>
              {position && (
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Location selected
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {position ? (
                <span>
                  Selected: {coordinates.lat}, {coordinates.lng}
                </span>
              ) : (
                <span>No location selected</span>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!position}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Location
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MapPicker;





