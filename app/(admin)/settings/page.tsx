'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  Shield,
  Database,
  Bell,
  Mail,
  Key,
  Globe,
  Server,
  HardDrive,
  Save,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Users,
  Bus,
  Calendar,
  Clock,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import SchedulingConfigManager, { defaultSchedulingSettings } from '../../../lib/scheduling-config';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  // Load settings from API on component mount
  React.useEffect(() => {
    loadSchedulingSettings();
    
    // Check URL params to set active tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const validTabs = ['general', 'users', 'scheduling', 'payments', 'notifications', 'security', 'system', 'backup'];
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const loadSchedulingSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSchedulingSettings(data.settings);
      } else {
        console.error('Failed to load settings:', response.statusText);
        // Fall back to default settings
        setSchedulingSettings(defaultSchedulingSettings);
        toast.error('Failed to load settings, using defaults');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSchedulingSettings(defaultSchedulingSettings);
      toast.error('Failed to load settings, using defaults');
    }
  };

  const [schedulingSettings, setSchedulingSettings] = useState(defaultSchedulingSettings);

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'scheduling', name: 'Scheduling', icon: Bus },
    { id: 'payments', name: 'Payments', icon: DollarSign },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'api', name: 'API Settings', icon: Globe },
    { id: 'appearance', name: 'Appearance', icon: Settings },
    { id: 'system', name: 'System', icon: Server },
    { id: 'logs', name: 'Audit Logs', icon: Clock },
    { id: 'backup', name: 'Backup & Restore', icon: Database }
  ];

  const handleSaveSettings = async (section: string) => {
    if (section === 'Scheduling') {
      try {
        const response = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ settings: schedulingSettings }),
        });

        if (response.ok) {
          const data = await response.json();
          toast.success('Scheduling settings saved successfully!');
          console.log('Settings saved:', data);
        } else {
          const errorData = await response.json();
          toast.error(`Failed to save scheduling settings: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error saving scheduling settings:', error);
        toast.error('Failed to save scheduling settings. Please try again.');
      }
    } else {
      toast.success(`${section} settings saved successfully!`);
    }
  };

  const renderSchedulingSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduling Settings</h3>
        <div className="space-y-6">
          {/* Booking Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Booking Configuration</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enable Booking Time Window
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableBookingTimeWindow"
                    checked={schedulingSettings.enableBookingTimeWindow}
                    onChange={(e) => setSchedulingSettings({...schedulingSettings, enableBookingTimeWindow: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableBookingTimeWindow" className="ml-2 text-sm text-gray-600">
                    Restrict booking to specific time window
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Cutoff Time
                </label>
                <select
                  value={schedulingSettings.bookingWindowEndHour}
                  onChange={(e) => setSchedulingSettings({...schedulingSettings, bookingWindowEndHour: parseInt(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-600 mt-1">
                  Students cannot book after this time on the day before the trip
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Window (Days Before)
                </label>
                <input
                  type="number"
                  value={schedulingSettings.bookingWindowDaysBefore}
                  onChange={(e) => setSchedulingSettings({...schedulingSettings, bookingWindowDaysBefore: parseInt(e.target.value)})}
                  min="1"
                  max="7"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Number of days before the trip when booking deadline applies
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-notify Passengers
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoNotifyPassengers"
                    checked={schedulingSettings.autoNotifyPassengers}
                    onChange={(e) => setSchedulingSettings({...schedulingSettings, autoNotifyPassengers: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoNotifyPassengers" className="ml-2 text-sm text-gray-600">
                    Send notifications to passengers automatically
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Hours
              </label>
              <div className="space-y-2">
                {[24, 12, 6, 2, 1].map((hour) => (
                  <div key={hour} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`reminder-${hour}`}
                      checked={schedulingSettings.sendReminderHours.includes(hour)}
                      onChange={(e) => {
                        const newHours = e.target.checked
                          ? [...schedulingSettings.sendReminderHours, hour].sort((a, b) => b - a)
                          : schedulingSettings.sendReminderHours.filter(h => h !== hour);
                        setSchedulingSettings(prev => ({ ...prev, sendReminderHours: newHours }));
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`reminder-${hour}`} className="ml-2 text-sm text-gray-600">
                      {hour} hours before trip
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800 mb-1">Current Booking Policy:</p>
                  <ul className="text-yellow-700 space-y-1 text-sm">
                    <li>• Students can book trips anytime after admin approval</li>
                    <li>• Booking deadline: {schedulingSettings.bookingWindowEndHour === 0 ? '12:00 AM' : 
                       schedulingSettings.bookingWindowEndHour < 12 ? `${schedulingSettings.bookingWindowEndHour}:00 AM` : 
                       schedulingSettings.bookingWindowEndHour === 12 ? '12:00 PM' : 
                       `${schedulingSettings.bookingWindowEndHour-12}:00 PM`} the day before the trip</li>
                    <li>• Each schedule must be individually approved by admin</li>
                    <li>• No booking allowed on the same day as the trip</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <button 
          onClick={() => handleSaveSettings('Scheduling')}
          className="btn-primary flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Scheduling Settings</span>
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <div className="text-center py-8">General settings will be implemented here</div>;
      case 'users':
        return <div className="text-center py-8">User management will be implemented here</div>;
      case 'scheduling':
        return renderSchedulingSettings();
      case 'payments':
        return <div className="text-center py-8">Payment settings will be implemented here</div>;
      case 'notifications':
        return <div className="text-center py-8">Notification settings will be implemented here</div>;
      case 'security':
        return <div className="text-center py-8">Security settings will be implemented here</div>;
      case 'api':
        return <div className="text-center py-8">API settings will be implemented here</div>;
      case 'appearance':
        return <div className="text-center py-8">Appearance settings will be implemented here</div>;
      case 'system':
        return <div className="text-center py-8">System settings will be implemented here</div>;
      case 'logs':
        return <div className="text-center py-8">Audit logs will be implemented here</div>;
      case 'backup':
        return <div className="text-center py-8">Backup & restore will be implemented here</div>;
      default:
        return <div className="text-center py-8">Invalid tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your system preferences and configurations</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 py-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;


