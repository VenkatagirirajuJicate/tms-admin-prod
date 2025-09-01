// Validation utilities for TMS Admin application

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

export interface RouteStop {
  stop_name: string;
  stop_time: string;
  sequence_order: number;
  latitude?: number;
  longitude?: number;
}

/**
 * Validate GPS coordinates format and range
 */
export const validateGPSCoordinates = (lat: string | number, lng: string | number): ValidationResult => {
  const errors: string[] = [];
  
  // Convert to numbers if they're strings
  const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
  const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;
  
  // Check if conversion was successful
  if (isNaN(latitude) || isNaN(longitude)) {
    errors.push('GPS coordinates must be valid numbers');
    return { isValid: false, errors };
  }
  
  // Validate latitude range (-90 to 90)
  if (latitude < -90 || latitude > 90) {
    errors.push('Latitude must be between -90 and 90 degrees');
  }
  
  // Validate longitude range (-180 to 180)
  if (longitude < -180 || longitude > 180) {
    errors.push('Longitude must be between -180 and 180 degrees');
  }
  
  // Check precision (reasonable for transportation purposes)
  const latStr = latitude.toString();
  const lngStr = longitude.toString();
  const latDecimals = latStr.includes('.') ? latStr.split('.')[1].length : 0;
  const lngDecimals = lngStr.includes('.') ? lngStr.split('.')[1].length : 0;
  
  if (latDecimals > 8 || lngDecimals > 8) {
    errors.push('GPS coordinates should not exceed 8 decimal places');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate time format (HH:MM or HH:MM:SS)
 */
export const validateTimeFormat = (time: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!time || time.trim() === '') {
    errors.push('Time is required');
    return { isValid: false, errors };
  }
  
  // Regular expression for HH:MM or HH:MM:SS format
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
  
  if (!timeRegex.test(time.trim())) {
    errors.push('Time must be in HH:MM or HH:MM:SS format (e.g., 09:30 or 14:45:30)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Convert time string to minutes for comparison
 */
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
  return hours * 60 + minutes;
};

/**
 * Validate chronological order of route stops
 */
export const validateStopTimeSequence = (
  stops: RouteStop[],
  departureTime: string,
  arrivalTime: string
): ValidationResult => {
  const errors: string[] = [];
  
  if (!stops || stops.length === 0) {
    return { isValid: true, errors: [] }; // No stops to validate
  }
  
  // Validate departure and arrival time format first
  const departureValidation = validateTimeFormat(departureTime);
  const arrivalValidation = validateTimeFormat(arrivalTime);
  
  if (!departureValidation.isValid) {
    errors.push(...departureValidation.errors.map(e => `Departure time: ${e}`));
  }
  
  if (!arrivalValidation.isValid) {
    errors.push(...arrivalValidation.errors.map(e => `Arrival time: ${e}`));
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Sort stops by sequence order
  const sortedStops = [...stops].sort((a, b) => a.sequence_order - b.sequence_order);
  
  // Validate each stop time format
  for (const stop of sortedStops) {
    const timeValidation = validateTimeFormat(stop.stop_time);
    if (!timeValidation.isValid) {
      errors.push(`Stop "${stop.stop_name}": ${timeValidation.errors[0]}`);
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Convert times to minutes for comparison
  const departureMinutes = timeToMinutes(departureTime);
  const arrivalMinutes = timeToMinutes(arrivalTime);
  
  // Check if departure is before arrival
  if (departureMinutes >= arrivalMinutes) {
    errors.push('Departure time must be before arrival time');
  }
  
  // Validate stop times are in chronological order and within route timeframe
  let previousStopMinutes = departureMinutes;
  
  for (let i = 0; i < sortedStops.length; i++) {
    const stop = sortedStops[i];
    const stopMinutes = timeToMinutes(stop.stop_time);
    
    // Check if stop time is after departure time
    if (stopMinutes <= departureMinutes) {
      errors.push(`Stop "${stop.stop_name}" time (${stop.stop_time}) must be after departure time (${departureTime})`);
    }
    
    // Check if stop time is before arrival time
    if (stopMinutes >= arrivalMinutes) {
      errors.push(`Stop "${stop.stop_name}" time (${stop.stop_time}) must be before arrival time (${arrivalTime})`);
    }
    
    // Check if this stop is after the previous stop
    if (i > 0 && stopMinutes <= previousStopMinutes) {
      const previousStop = sortedStops[i - 1];
      errors.push(`Stop "${stop.stop_name}" time (${stop.stop_time}) must be after previous stop "${previousStop.stop_name}" time (${previousStop.stop_time})`);
    }
    
    previousStopMinutes = stopMinutes;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate route number format and uniqueness
 */
export const validateRouteNumber = (
  routeNumber: string,
  existingRouteNumbers: string[] = [],
  currentRouteId?: string
): ValidationResult => {
  const errors: string[] = [];
  
  if (!routeNumber || routeNumber.trim() === '') {
    errors.push('Route number is required');
    return { isValid: false, errors };
  }
  
  const trimmedRouteNumber = routeNumber.trim();
  
  // Format validation (alphanumeric, may include hyphens and underscores)
  const routeNumberRegex = /^[A-Za-z0-9_-]+$/;
  if (!routeNumberRegex.test(trimmedRouteNumber)) {
    errors.push('Route number can only contain letters, numbers, hyphens, and underscores');
  }
  
  // Length validation
  if (trimmedRouteNumber.length < 1 || trimmedRouteNumber.length > 50) {
    errors.push('Route number must be between 1 and 50 characters');
  }
  
  // Uniqueness validation (excluding current route if editing)
  const duplicateExists = existingRouteNumbers.some(existing => 
    existing.toLowerCase() === trimmedRouteNumber.toLowerCase()
  );
  
  if (duplicateExists) {
    errors.push('This route number is already in use');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate vehicle registration number format
 */
export const validateRegistrationNumber = (registrationNumber: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!registrationNumber || registrationNumber.trim() === '') {
    errors.push('Registration number is required');
    return { isValid: false, errors };
  }
  
  const trimmedRegNumber = registrationNumber.trim().toUpperCase();
  
  // Indian vehicle registration format: XX-XX-XXXX or XX-XX-XX-XXXX
  // Allow international formats as well (flexible)
  const regNumberRegex = /^[A-Z0-9]{2,3}[-\s]?[A-Z0-9]{1,4}[-\s]?[A-Z0-9]{1,6}$/;
  
  if (!regNumberRegex.test(trimmedRegNumber)) {
    errors.push('Invalid registration number format (e.g., MH-01-AB-1234)');
  }
  
  // Length validation
  if (trimmedRegNumber.length < 4 || trimmedRegNumber.length > 15) {
    errors.push('Registration number must be between 4 and 15 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate driver license number format
 */
export const validateLicenseNumber = (licenseNumber: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!licenseNumber || licenseNumber.trim() === '') {
    errors.push('License number is required');
    return { isValid: false, errors };
  }
  
  const trimmedLicense = licenseNumber.trim();
  
  // Indian driving license format: STATE-YYYY-XXXXXXX (flexible for international formats)
  const licenseRegex = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$|^[A-Z0-9-]{8,20}$/;
  
  if (trimmedLicense.length < 8 || trimmedLicense.length > 20) {
    errors.push('License number must be between 8 and 20 characters');
  }
  
  // Allow alphanumeric characters, hyphens for flexibility
  const flexibleRegex = /^[A-Za-z0-9-]+$/;
  if (!flexibleRegex.test(trimmedLicense)) {
    errors.push('License number can only contain letters, numbers, and hyphens');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phoneNumber: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!phoneNumber || phoneNumber.trim() === '') {
    errors.push('Phone number is required');
    return { isValid: false, errors };
  }
  
  const trimmedPhone = phoneNumber.trim().replace(/\s/g, '');
  
  // Indian mobile number format: +91-XXXXXXXXXX or XXXXXXXXXX
  // International format: +XX-XXXXXXXXXX
  const phoneRegex = /^(\+\d{1,3}[-.]?)?\d{10,15}$/;
  
  if (!phoneRegex.test(trimmedPhone)) {
    errors.push('Invalid phone number format (e.g., +91-9876543210 or 9876543210)');
  }
  
  // Length validation (excluding country code symbols)
  const digitsOnly = trimmedPhone.replace(/[^\d]/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    errors.push('Phone number must contain 10-15 digits');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email || email.trim() === '') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  const trimmedEmail = email.trim();
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Invalid email format (e.g., user@example.com)');
  }
  
  // Length validation
  if (trimmedEmail.length > 254) {
    errors.push('Email address is too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Comprehensive route validation
 */
export const validateRouteData = (
  routeData: any,
  stops: RouteStop[],
  existingRouteNumbers: string[] = []
): ValidationResult => {
  const errors: string[] = [];
  
  // Validate route number
  const routeNumberValidation = validateRouteNumber(
    routeData.route_number,
    existingRouteNumbers,
    routeData.id
  );
  if (!routeNumberValidation.isValid) {
    errors.push(...routeNumberValidation.errors);
  }
  
  // Validate GPS coordinates if provided
  if (routeData.start_latitude && routeData.start_longitude) {
    const startGPSValidation = validateGPSCoordinates(
      routeData.start_latitude,
      routeData.start_longitude
    );
    if (!startGPSValidation.isValid) {
      errors.push(...startGPSValidation.errors.map(e => `Start location: ${e}`));
    }
  }
  
  if (routeData.end_latitude && routeData.end_longitude) {
    const endGPSValidation = validateGPSCoordinates(
      routeData.end_latitude,
      routeData.end_longitude
    );
    if (!endGPSValidation.isValid) {
      errors.push(...endGPSValidation.errors.map(e => `End location: ${e}`));
    }
  }
  
  // Validate stop time sequence
  if (stops && stops.length > 0) {
    const stopTimeValidation = validateStopTimeSequence(
      stops,
      routeData.departure_time,
      routeData.arrival_time
    );
    if (!stopTimeValidation.isValid) {
      errors.push(...stopTimeValidation.errors);
    }
    
    // Validate GPS coordinates for stops
    stops.forEach((stop, index) => {
      if (stop.latitude && stop.longitude) {
        const stopGPSValidation = validateGPSCoordinates(stop.latitude, stop.longitude);
        if (!stopGPSValidation.isValid) {
          errors.push(...stopGPSValidation.errors.map(e => `Stop ${index + 1} (${stop.stop_name}): ${e}`));
        }
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};





