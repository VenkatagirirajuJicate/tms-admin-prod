'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { routesData } from '@/data/admin-data';

const AddStudentModal = ({ isOpen, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    studentName: '',
    rollNumber: '',
    email: '',
    mobile: '',
    department: '',
    program: '',
    boardingPoint: '',
    allocatedRoute: '',
    transportStatus: 'active',
    paymentStatus: 'current'
  });

  const [errors, setErrors] = useState<any>({});

  const departments = [
    'Computer Science',
    'Electronics and Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Information Technology'
  ];

  const programs = [
    'Bachelor of Technology',
    'Master of Technology',
    'Bachelor of Engineering',
    'Master of Engineering'
  ];

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.studentName.trim()) newErrors.studentName = 'Student name is required';
    if (!formData.rollNumber.trim()) newErrors.rollNumber = 'Roll number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    else if (!/^\+?[1-9]\d{9,14}$/.test(formData.mobile)) newErrors.mobile = 'Invalid mobile format';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.program) newErrors.program = 'Program is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const newStudent = {
        id: `student_${Date.now()}`,
        studentName: formData.studentName,
        rollNumber: formData.rollNumber,
        email: formData.email,
        mobile: formData.mobile,
        department: { id: 'dept_new', departmentName: formData.department },
        program: { id: 'prog_new', programName: formData.program, degreeName: 'B.Tech' },
        institution: { id: 'inst_1', name: 'JKKN College of Engineering' },
        transportProfile: formData.allocatedRoute ? {
          id: `tp_${Date.now()}`,
          studentId: `student_${Date.now()}`,
          allocatedRoutes: [formData.allocatedRoute],
          boardingPoint: formData.boardingPoint,
          transportStatus: formData.transportStatus as any,
          paymentStatus: formData.paymentStatus as any,
          totalFines: 0,
          outstandingAmount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        } : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      onSave(newStudent);
      setFormData({
        studentName: '',
        rollNumber: '',
        email: '',
        mobile: '',
        department: '',
        program: '',
        boardingPoint: '',
        allocatedRoute: '',
        transportStatus: 'active',
        paymentStatus: 'current'
      });
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className={`input ${errors.studentName ? 'border-red-500' : ''}`}
                placeholder="Enter student name"
              />
              {errors.studentName && <p className="text-red-500 text-xs mt-1">{errors.studentName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number *</label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                className={`input ${errors.rollNumber ? 'border-red-500' : ''}`}
                placeholder="Enter roll number"
              />
              {errors.rollNumber && <p className="text-red-500 text-xs mt-1">{errors.rollNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter email address"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className={`input ${errors.mobile ? 'border-red-500' : ''}`}
                placeholder="+91 9876543210"
              />
              {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={`input ${errors.department ? 'border-red-500' : ''}`}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
              <select
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                className={`input ${errors.program ? 'border-red-500' : ''}`}
              >
                <option value="">Select Program</option>
                {programs.map(program => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
              {errors.program && <p className="text-red-500 text-xs mt-1">{errors.program}</p>}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transport Information (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Route</label>
                <select
                  value={formData.allocatedRoute}
                  onChange={(e) => setFormData({ ...formData, allocatedRoute: e.target.value })}
                  className="input"
                >
                  <option value="">No transport required</option>
                  {routesData.map(route => (
                    <option key={route.id} value={route.id}>
                      {route.routeNumber} - {route.routeName}
                    </option>
                  ))}
                </select>
              </div>

              {formData.allocatedRoute && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Boarding Point</label>
                    <input
                      type="text"
                      value={formData.boardingPoint}
                      onChange={(e) => setFormData({ ...formData, boardingPoint: e.target.value })}
                      className="input"
                      placeholder="Enter boarding point"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transport Status</label>
                    <select
                      value={formData.transportStatus}
                      onChange={(e) => setFormData({ ...formData, transportStatus: e.target.value })}
                      className="input"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                      className="input"
                    >
                      <option value="current">Current</option>
                      <option value="overdue">Overdue</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              Add Student
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddStudentModal; 