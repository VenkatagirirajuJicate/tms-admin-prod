'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon,
  Clock,
  Bus,
  Users,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Eye,
  X,
  User,
  Phone,
  Mail,
  CreditCard,
  Download,
  CalendarDays,
  ArrowRight,
  Settings,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import EnhancedGlobalCalendar from '@/components/enhanced-global-calendar';
import ScheduleBookingControlModal from '@/components/schedule-booking-control-modal';

interface RouteScheduleSummary {
  route: {
    id: string;
    routeNumber: string;
    routeName: string;
    startLocation: string;
    endLocation: string;
    fare: number;
    totalCapacity: number;
  };
  nextTrip: {
    id: string;
    scheduleDate: string;
    departureTime: string;
    arrivalTime: string;
    availableSeats: number;
    bookedSeats: number;
    status: string;
    admin_scheduling_enabled?: boolean;
    booking_enabled?: boolean;
    booking_deadline?: string;
    scheduling_instructions?: string;
  } | null;
  totalSchedulesThisMonth: number;
  totalBookingsThisMonth: number;
}

interface CalendarDay {
  date: Date;
  bookingCount: number;
  schedules: Array<{
    id: string;
    departureTime: string;
    arrivalTime: string;
    bookedSeats: number;
    availableSeats: number;
  }>;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface PassengerBooking {
  id: string;
  studentName: string;
  rollNumber: string;
  email: string;
  mobile: string;
  seatNumber: string;
  boardingStop: string;
  paymentStatus: string;
  bookingDate: string;
  scheduleTime: string;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: RouteScheduleSummary['route'];
}

interface PassengerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  passengers: PassengerBooking[];
  date: string;
  route: RouteScheduleSummary['route'];
}

const PassengerListModal: React.FC<PassengerListModalProps> = ({ 
  isOpen, 
  onClose, 
  passengers, 
  date, 
  route 
}) => {
  if (!isOpen) return null;

  const exportPassengerList = () => {
    const csvContent = [
      ['Student Name', 'Roll Number', 'Email', 'Mobile', 'Seat', 'Boarding Stop', 'Payment Status'].join(','),
      ...passengers.map(p => [
        p.studentName,
        p.rollNumber,
        p.email,
        p.mobile,
        p.seatNumber || 'TBD',
        p.boardingStop,
        p.paymentStatus
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passengers-${route.routeNumber}-${date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
                <h2 className="text-xl font-bold text-gray-900">
                  Passenger List - {new Date(date).toLocaleDateString()}
                </h2>
                <p className="text-sm text-gray-600">
                  Route {route.routeNumber}: {route.routeName}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportPassengerList}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {passengers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Passengers</h3>
                <p className="text-gray-600">No bookings found for this date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {passengers.length} Passenger{passengers.length !== 1 ? 's' : ''} Booked
                  </h3>
                  <div className="text-sm text-gray-600">
                    Total Revenue: ₹{passengers.filter(p => p.paymentStatus === 'paid').length * route.fare}
                  </div>
                </div>

                <div className="grid gap-4">
                  {passengers.map((passenger, passengerIndex) => (
                    <div
                      key={`${passenger.id}-${passengerIndex}`}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{passenger.studentName}</h4>
                            <p className="text-sm text-gray-600">{passenger.rollNumber}</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <p className="text-xs text-gray-500">{passenger.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{passenger.mobile}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{passenger.boardingStop}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Bus className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Seat: {passenger.seatNumber || 'TBD'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{passenger.scheduleTime}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              passenger.paymentStatus === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {passenger.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Booked: {new Date(passenger.bookingDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, route }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<CalendarDay | null>(null);
  const [passengers, setPassengers] = useState<PassengerBooking[]>([]);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCalendarData();
    }
  }, [isOpen, currentDate, route.id]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      // Generate calendar days for the current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      const days: CalendarDay[] = [];
      const today = new Date();

      // Fetch schedules for this route for the month
      const startDateStr = firstDay.getFullYear() + '-' + 
                          String(firstDay.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(firstDay.getDate()).padStart(2, '0');
      
      const endDateStr = lastDay.getFullYear() + '-' + 
                        String(lastDay.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(lastDay.getDate()).padStart(2, '0');

      const response = await fetch('/api/admin/schedules/route-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: route.id,
          startDate: startDateStr,
          endDate: endDateStr
        })
      });

      const scheduleData = await response.json();

      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dateString = date.getFullYear() + '-' + 
                         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(date.getDate()).padStart(2, '0');
        const daySchedules = scheduleData.filter((s: any) => s.schedule_date === dateString);
        const bookingCount = daySchedules.reduce((sum: number, s: any) => sum + s.booked_seats, 0);

        days.push({
          date,
          bookingCount,
          schedules: daySchedules.map((s: any) => ({
            id: s.id,
            departureTime: s.departure_time,
            arrivalTime: s.arrival_time,
            bookedSeats: s.booked_seats,
            availableSeats: s.available_seats
          })),
          isCurrentMonth: date.getMonth() === month,
          isToday: date.toDateString() === today.toDateString()
        });
      }

      setCalendarData(days);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = async (day: CalendarDay) => {
    if (day.bookingCount === 0) return;

    setSelectedDate(day);
    setLoading(true);

    try {
      const dateStr = day.date.getFullYear() + '-' + 
                     String(day.date.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(day.date.getDate()).padStart(2, '0');

      const response = await fetch('/api/admin/schedules/passengers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: route.id,
          date: dateStr
        })
      });

      const passengerData = await response.json();
      setPassengers(passengerData);
      setShowPassengerModal(true);
    } catch (error) {
      console.error('Error loading passengers:', error);
      toast.error('Failed to load passenger data');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
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
                  <h2 className="text-xl font-bold text-gray-900">
                    Route {route.routeNumber} - Schedule Calendar
                  </h2>
                  <p className="text-sm text-gray-600">{route.routeName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
                  <div key={`header-${day}-${dayIndex}`} className="p-3 text-center text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarData.map((day, index) => {
                  const dayKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}-${index}`;
                  return (
                    <button
                      key={dayKey}
                      onClick={() => handleDateClick(day)}
                      disabled={day.bookingCount === 0}
                      className={`
                        p-3 text-center text-sm rounded-lg transition-all duration-200 min-h-[60px] flex flex-col items-center justify-center
                        ${day.isCurrentMonth ? 'opacity-100' : 'opacity-30'}
                        ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                        ${day.bookingCount > 0 
                          ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer border border-blue-200' 
                          : 'bg-gray-50 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="font-medium">{day.date.getDate()}</div>
                      {day.bookingCount > 0 && (
                        <div className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full mt-1">
                          {day.bookingCount}
                        </div>
                      )}
                      {day.schedules.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {day.schedules.length} trip{day.schedules.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                  <span>Has Bookings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-50 rounded"></div>
                  <span>No Bookings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <PassengerListModal
        isOpen={showPassengerModal}
        onClose={() => setShowPassengerModal(false)}
        passengers={passengers}
        date={selectedDate ? (selectedDate.date.getFullYear() + '-' + 
                            String(selectedDate.date.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(selectedDate.date.getDate()).padStart(2, '0')) : ''}
        route={route}
      />
    </>
  );
};

const RouteScheduleCard: React.FC<{ routeSummary: RouteScheduleSummary }> = ({ routeSummary }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const { route, nextTrip, totalSchedulesThisMonth, totalBookingsThisMonth } = routeSummary;

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const isBookingEnabled = nextTrip?.admin_scheduling_enabled && nextTrip?.booking_enabled;
  const isBookingExpired = nextTrip?.booking_deadline && new Date() > new Date(nextTrip.booking_deadline);
  const isFutureTrip = nextTrip && new Date(nextTrip.scheduleDate) > new Date();

  const handleBookingControlClick = () => {
    if (nextTrip && isFutureTrip) {
      setSelectedSchedule({
        id: nextTrip.id,
        route_id: route.id,
        route_name: route.routeName,
        schedule_date: nextTrip.scheduleDate,
        departure_time: nextTrip.departureTime,
        arrival_time: nextTrip.arrivalTime,
        available_seats: nextTrip.availableSeats,
        booked_seats: nextTrip.bookedSeats,
        total_seats: nextTrip.availableSeats + nextTrip.bookedSeats,
        admin_scheduling_enabled: nextTrip.admin_scheduling_enabled || false,
        booking_enabled: nextTrip.booking_enabled || false,
        booking_deadline: nextTrip.booking_deadline || '',
        scheduling_instructions: nextTrip.scheduling_instructions || ''
      });
      setShowBookingModal(true);
    }
  };

  const handleBookingUpdate = async (scheduleId: string, updates: any) => {
    try {
      const response = await fetch('/api/admin/schedules/booking-controls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: scheduleId,
          ...updates
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking controls');
      }

      // Refresh the route summaries to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error updating booking controls:', error);
      throw error;
    }
  };

  const renderBookingStatus = () => {
    if (!nextTrip || !isFutureTrip) {
      return (
        <div className="flex items-center space-x-2 text-gray-500 text-sm">
          <XCircle className="w-4 h-4" />
          <span>No future trips or past trip</span>
        </div>
      );
    }

    if (isBookingExpired) {
      return (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <XCircle className="w-4 h-4" />
          <span>Booking deadline passed</span>
        </div>
      );
    }

    if (isBookingEnabled) {
      return (
        <div className="flex items-center space-x-2 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Booking enabled</span>
        </div>
      );
    }

    if (nextTrip.admin_scheduling_enabled && !nextTrip.booking_enabled) {
      return (
        <div className="flex items-center space-x-2 text-orange-600 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Approved but not active</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm">
        <XCircle className="w-4 h-4" />
        <span>Booking not enabled</span>
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">{route.routeNumber}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{route.routeName}</h3>
              <p className="text-sm text-gray-600">
                {route.startLocation} → {route.endLocation}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Capacity</div>
            <div className="text-lg font-bold text-gray-900">{route.totalCapacity}</div>
          </div>
        </div>

        {/* Next Trip Info */}
        {nextTrip ? (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-900">Next Trip</h4>
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  nextTrip.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                  nextTrip.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {nextTrip.status}
                </div>
                {isFutureTrip && (
                  <button
                    onClick={handleBookingControlClick}
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                    title="Manage booking controls"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="flex items-center space-x-1 text-blue-700">
                  <CalendarDays className="w-4 h-4" />
                  <span>Date</span>
                </div>
                <div className="font-medium text-blue-900">{formatDate(nextTrip.scheduleDate)}</div>
              </div>
              <div>
                <div className="flex items-center space-x-1 text-blue-700">
                  <Clock className="w-4 h-4" />
                  <span>Time</span>
                </div>
                <div className="font-medium text-blue-900">
                  {formatTime(nextTrip.departureTime)} - {formatTime(nextTrip.arrivalTime)}
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1 text-blue-700">
                  <Users className="w-4 h-4" />
                  <span>Bookings</span>
                </div>
                <div className="font-medium text-blue-900">
                  {nextTrip.bookedSeats}/{nextTrip.bookedSeats + nextTrip.availableSeats}
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1 text-blue-700">
                  <Bus className="w-4 h-4" />
                  <span>Available</span>
                </div>
                <div className="font-medium text-blue-900">{nextTrip.availableSeats}</div>
              </div>
            </div>

            {/* Booking Status */}
            <div className="mt-3 p-2 bg-white rounded border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Booking Status:</span>
                </div>
                {renderBookingStatus()}
              </div>
              {nextTrip.booking_deadline && (
                <div className="text-xs text-gray-600 mt-1">
                  Deadline: {new Date(nextTrip.booking_deadline).toLocaleString()}
                </div>
              )}
            </div>

            {/* Seat Availability Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-blue-700 mb-1">
                <span>Seat Occupancy</span>
                <span>{Math.round((nextTrip.bookedSeats / (nextTrip.bookedSeats + nextTrip.availableSeats)) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(nextTrip.bookedSeats / (nextTrip.bookedSeats + nextTrip.availableSeats)) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
            <CalendarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No upcoming trips scheduled</p>
          </div>
        )}

        {/* Monthly Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{totalSchedulesThisMonth}</div>
            <div className="text-xs text-gray-500">Schedules This Month</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{totalBookingsThisMonth}</div>
            <div className="text-xs text-gray-500">Total Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">₹{totalBookingsThisMonth * route.fare}</div>
            <div className="text-xs text-gray-500">Revenue</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => setShowCalendar(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>View Calendar & Passengers</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          {nextTrip && isFutureTrip && (
            <button
              onClick={handleBookingControlClick}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>Manage Booking Controls</span>
            </button>
          )}
        </div>
      </motion.div>

      <CalendarModal
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        route={route}
      />

      {selectedSchedule && (
        <ScheduleBookingControlModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          schedule={selectedSchedule}
          onUpdate={handleBookingUpdate}
        />
      )}
    </>
  );
};

export default function SchedulesPage() {
  const [routeSummaries, setRouteSummaries] = useState<RouteScheduleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGlobalCalendar, setShowGlobalCalendar] = useState(false);

  useEffect(() => {
    loadRouteSchedules();
  }, []);

  const loadRouteSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/schedules/route-summaries');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setRouteSummaries(data);
      } else {
        console.error('API returned non-array data:', data);
        setRouteSummaries([]);
        toast.error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error loading route schedules:', error);
      setRouteSummaries([]); // Ensure it's always an array
      toast.error('Failed to load route schedules');
    } finally {
      setLoading(false);
    }
  };



  const filteredRoutes = (Array.isArray(routeSummaries) ? routeSummaries : []).filter(route =>
    route.route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.route.routeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.route.startLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.route.endLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-64 bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Schedules</h1>
          <p className="text-gray-600">Manage schedules and view passenger bookings by route</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={() => setShowGlobalCalendar(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Global Calendar</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Route Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRoutes.length > 0 ? (
          filteredRoutes.map((routeSummary, routeIndex) => (
            <RouteScheduleCard
              key={`${routeSummary.route.id}-${routeIndex}`}
              routeSummary={routeSummary}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Routes Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search' : 'No route schedules available'}
            </p>
          </div>
        )}
      </div>

      {/* Global Calendar Modal */}
      <EnhancedGlobalCalendar
        isOpen={showGlobalCalendar}
        onClose={() => setShowGlobalCalendar(false)}
      />
    </div>
  );
}
