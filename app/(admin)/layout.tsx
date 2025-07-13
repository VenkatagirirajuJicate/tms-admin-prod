'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Route,
  Users,
  Car,
  Calendar,
  CreditCard,
  Bell,
  MessageCircle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bus,
  UserCheck,
  Shield,
  ClipboardList
} from 'lucide-react';
import { AdminUser, UserRole } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/error-boundary';
import AssignmentNotification from '@/components/assignment-notification';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  useEffect(() => {
    const validateAndSetUser = () => {
      const userData = localStorage.getItem('adminUser');
      
      if (!userData) {
        router.push('/login');
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        
        // Check if the parsed data has the required fields
        if (!parsedUser.id || !parsedUser.email || !parsedUser.role || !parsedUser.name) {
          localStorage.removeItem('adminUser');
          toast.error('Invalid session data. Please login again.');
          router.push('/login');
          return;
        }
        
        // For database-authenticated users, we just need to verify the data structure
        // Create a user object in the expected format
        const validUser: AdminUser = {
          id: parsedUser.id,
          name: parsedUser.name,
          email: parsedUser.email,
          role: parsedUser.role as UserRole,
          avatar: '/api/placeholder/40/40', // Default avatar
          permissions: [], // Permissions will be handled by role-based access
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date()
        };
        
          setUser(validUser);
      } catch {
        localStorage.removeItem('adminUser');
        toast.error('Invalid session data. Please login again.');
        router.push('/login');
      }
    };

    validateAndSetUser();
  }, [router]);

  const allNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'transport_manager', 'finance_admin', 'operations_admin', 'data_entry'] },
    { name: 'Routes', href: '/routes', icon: Route, roles: ['super_admin', 'transport_manager'] },
    { name: 'Students', href: '/students', icon: Users, roles: ['super_admin', 'data_entry', 'finance_admin', 'operations_admin'] },
    { name: 'Enrollment Requests', href: '/enrollment-requests', icon: ClipboardList, roles: ['super_admin', 'transport_manager'] },
    { name: 'Drivers', href: '/drivers', icon: UserCheck, roles: ['super_admin', 'transport_manager'] },
    { name: 'Vehicles', href: '/vehicles', icon: Car, roles: ['super_admin', 'transport_manager'] },
    { name: 'Schedules', href: '/schedules', icon: Calendar, roles: ['super_admin', 'transport_manager'] },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['super_admin', 'finance_admin'] },
    { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['super_admin', 'operations_admin'] },
    { name: 'Grievances', href: '/grievances', icon: MessageCircle, roles: ['super_admin', 'operations_admin'] },
    { name: 'My Grievances', href: '/my-grievances', icon: UserCheck, roles: ['super_admin', 'transport_manager', 'finance_admin', 'operations_admin', 'data_entry'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['super_admin', 'transport_manager', 'finance_admin', 'operations_admin'] },
    { name: 'Authorize', href: '/authorize', icon: Shield, roles: ['super_admin'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['super_admin'] }
  ];

  const navigation = allNavigation
    .filter(item => user && item.roles.includes(user.role))
    .map(item => ({
      ...item,
      current: pathname === item.href || pathname.startsWith(item.href + '/')
    }));

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-right" />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Always Fixed */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}>
        {/* Sidebar Header - Fixed */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">TMS Admin</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile - Fixed */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{user.name.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role.replace('_', ' ').toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto" role="navigation" aria-label="Main navigation">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    item.current
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  aria-current={item.current ? 'page' : undefined}
                  aria-label={`Navigate to ${item.name}`}
                >
                  <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} aria-hidden="true" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </div>
        </nav>

        {/* Logout Button - Fixed at Bottom */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Fixed Navbar */}
        <div className="fixed top-0 right-0 left-0 lg:left-64 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {/* TMS Branding and User Type */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center lg:hidden">
                    <Bus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">TMS</h1>
                    <p className="text-xs text-gray-500 hidden sm:block">{user.role.replace('_', ' ').toUpperCase()}</p>
                  </div>
                </div>
                
                {/* Page Title */}
                <div className="hidden sm:block">
                  <span className="text-gray-300">|</span>
                  <span className="ml-3 text-sm font-medium text-gray-700 capitalize">
                    {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Assignment Notifications */}
              {user && <AssignmentNotification adminId={user.id} />}
              
              {/* System Status */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Operational</span>
              </div>
              
              {/* Mobile User Info & Logout */}
              <div className="lg:hidden flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">{user.name.charAt(0)}</span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-24">{user.name}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              
              {/* Desktop User Info */}
              <div className="hidden lg:flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">{user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role.replace('_', ' ').toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content with independent scrolling */}
        <main className="flex-1 overflow-y-auto pt-16 bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8 min-h-full">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 