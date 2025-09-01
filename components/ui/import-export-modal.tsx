'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  FileSpreadsheet,
  Database,
  Users,
  Car,
  Route,
  Loader2
} from 'lucide-react';
import { Button } from './button';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataType: 'routes' | 'vehicles' | 'drivers' | 'students';
  data?: any[];
  onImport?: (importedData: any[]) => Promise<void>;
}

interface ImportResult {
  success: number;
  errors: string[];
  data: any[];
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  dataType,
  data = [],
  onImport
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDataTypeConfig = () => {
    switch (dataType) {
      case 'routes':
        return {
          name: 'Routes',
          icon: Route,
          color: 'bg-blue-500',
          sampleHeaders: ['route_number', 'route_name', 'start_location', 'end_location', 'departure_time', 'arrival_time', 'total_capacity', 'fare'],
          requiredFields: ['route_number', 'route_name', 'start_location', 'end_location', 'departure_time', 'arrival_time', 'total_capacity', 'fare']
        };
      case 'vehicles':
        return {
          name: 'Vehicles',
          icon: Car,
          color: 'bg-green-500',
          sampleHeaders: ['registration_number', 'model', 'capacity', 'fuel_type', 'status', 'insurance_expiry', 'fitness_expiry'],
          requiredFields: ['registration_number', 'model', 'capacity']
        };
      case 'drivers':
        return {
          name: 'Drivers',
          icon: Users,
          color: 'bg-purple-500',
          sampleHeaders: ['name', 'license_number', 'phone', 'email', 'experience_years', 'status'],
          requiredFields: ['name', 'license_number', 'phone']
        };
      case 'students':
        return {
          name: 'Students',
          icon: Users,
          color: 'bg-orange-500',
          sampleHeaders: ['student_name', 'roll_number', 'email', 'mobile', 'department_name', 'academic_year', 'semester'],
          requiredFields: ['student_name', 'roll_number', 'email', 'mobile']
        };
      default:
        return {
          name: 'Data',
          icon: Database,
          color: 'bg-gray-500',
          sampleHeaders: [],
          requiredFields: []
        };
    }
  };

  const config = getDataTypeConfig();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const validateImportData = (data: any[]): ImportResult => {
    const result: ImportResult = {
      success: 0,
      errors: [],
      data: []
    };

    if (!data || data.length === 0) {
      result.errors.push('No data found in file');
      return result;
    }

    // Check headers
    const headers = Object.keys(data[0]);
    const missingRequiredFields = config.requiredFields.filter(field => !headers.includes(field));
    
    if (missingRequiredFields.length > 0) {
      result.errors.push(`Missing required fields: ${missingRequiredFields.join(', ')}`);
      return result;
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowNumber = index + 1;
      let rowValid = true;

      // Check required fields
      config.requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          result.errors.push(`Row ${rowNumber}: Missing required field '${field}'`);
          rowValid = false;
        }
      });

      // Data type specific validations
      if (dataType === 'vehicles' && row.capacity && isNaN(parseInt(row.capacity))) {
        result.errors.push(`Row ${rowNumber}: Invalid capacity value`);
        rowValid = false;
      }

      if (dataType === 'routes' && row.total_capacity && isNaN(parseInt(row.total_capacity))) {
        result.errors.push(`Row ${rowNumber}: Invalid total_capacity value`);
        rowValid = false;
      }

      if (dataType === 'routes' && row.fare && isNaN(parseFloat(row.fare))) {
        result.errors.push(`Row ${rowNumber}: Invalid fare value`);
        rowValid = false;
      }

      // Email validation
      if (row.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          result.errors.push(`Row ${rowNumber}: Invalid email format`);
          rowValid = false;
        }
      }

      // Phone validation
      if (row.phone || row.mobile) {
        const phoneValue = row.phone || row.mobile;
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(phoneValue)) {
          result.errors.push(`Row ${rowNumber}: Invalid phone number format`);
          rowValid = false;
        }
      }

      if (rowValid) {
        result.data.push(row);
        result.success++;
      }
    });

    return result;
  };

  const handleImportProcess = async () => {
    if (!importFile || !onImport) return;

    setIsProcessing(true);
    try {
      const fileExtension = importFile.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        // Parse CSV
        Papa.parse(importFile, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            const validationResult = validateImportData(results.data as any[]);
            setImportResult(validationResult);

            if (validationResult.data.length > 0 && validationResult.errors.length === 0) {
              try {
                await onImport(validationResult.data);
                toast.success(`Successfully imported ${validationResult.success} ${config.name.toLowerCase()}`);
                setTimeout(() => {
                  onClose();
                }, 2000);
              } catch (error: any) {
                toast.error(`Import failed: ${error.message}`);
              }
            }
            setIsProcessing(false);
          },
          error: (error) => {
            toast.error(`CSV parsing error: ${error.message}`);
            setIsProcessing(false);
          }
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const arrayBuffer = await importFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const validationResult = validateImportData(jsonData);
        setImportResult(validationResult);

        if (validationResult.data.length > 0 && validationResult.errors.length === 0) {
          try {
            await onImport(validationResult.data);
            toast.success(`Successfully imported ${validationResult.success} ${config.name.toLowerCase()}`);
            setTimeout(() => {
              onClose();
            }, 2000);
          } catch (error: any) {
            toast.error(`Import failed: ${error.message}`);
          }
        }
        setIsProcessing(false);
      } else {
        toast.error('Unsupported file format. Please use CSV or Excel files.');
        setIsProcessing(false);
      }
    } catch (error: any) {
      toast.error(`Import error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = config.sampleHeaders;
    const exportData = data.map(item => {
      const row: any = {};
      headers.forEach(header => {
        row[header] = item[header] || '';
      });
      return row;
    });

    if (exportFormat === 'csv') {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${dataType}_export.csv`);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, config.name);
      XLSX.writeFile(workbook, `${dataType}_export.xlsx`);
    }

    toast.success(`${config.name} exported successfully`);
  };

  const downloadTemplate = () => {
    const templateData = [{}];
    config.sampleHeaders.forEach(header => {
      templateData[0][header] = `Sample ${header}`;
    });

    if (exportFormat === 'csv') {
      const csv = Papa.unparse(templateData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${dataType}_template.csv`);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${config.name} Template`);
      XLSX.writeFile(workbook, `${dataType}_template.xlsx`);
    }

    toast.success('Template downloaded successfully');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${config.color} rounded-lg`}>
              <config.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Import/Export {config.name}</h2>
              <p className="text-sm text-gray-500">Import from or export to CSV/Excel files</p>
            </div>
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

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'export'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Download className="h-4 w-4 inline mr-2" />
              Export Data
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'import'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Import Data
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Export {config.name}</h3>
                <p className="text-gray-600 mb-4">
                  Export your {config.name.toLowerCase()} data to CSV or Excel format.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Format
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="exportFormat"
                          value="csv"
                          checked={exportFormat === 'csv'}
                          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'xlsx')}
                          className="mr-2"
                        />
                        <FileText className="h-4 w-4 mr-1" />
                        CSV
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="exportFormat"
                          value="xlsx"
                          checked={exportFormat === 'xlsx'}
                          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'xlsx')}
                          className="mr-2"
                        />
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        Excel
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Export will include: {data.length} records with fields: {config.sampleHeaders.join(', ')}
                    </p>
                  </div>

                  <Button
                    onClick={handleExport}
                    disabled={!data || data.length === 0}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export {config.name}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Import {config.name}</h3>
                <p className="text-gray-600 mb-4">
                  Import {config.name.toLowerCase()} data from CSV or Excel files.
                </p>

                <div className="space-y-4">
                  {/* Download Template */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Download Template</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Download a template file to ensure your data is formatted correctly.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download {exportFormat.toUpperCase()} Template
                    </Button>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select File to Import
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {importFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {importFile.name}
                      </p>
                    )}
                  </div>

                  {/* Required Fields Info */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Required Fields</h4>
                    <p className="text-sm text-yellow-700">
                      {config.requiredFields.join(', ')}
                    </p>
                  </div>

                  {/* Import Button */}
                  <Button
                    onClick={handleImportProcess}
                    disabled={!importFile || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isProcessing ? 'Processing...' : 'Import Data'}
                  </Button>
                </div>
              </div>

              {/* Import Results */}
              {importResult && (
                <div className="mt-6">
                  <div className={`p-4 rounded-lg border ${
                    importResult.errors.length === 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center mb-3">
                      {importResult.errors.length === 0 ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <h4 className={`font-medium ${
                        importResult.errors.length === 0 ? 'text-green-900' : 'text-red-900'
                      }`}>
                        Import Results
                      </h4>
                    </div>

                    <div className={`text-sm ${
                      importResult.errors.length === 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {importResult.errors.length === 0 ? (
                        <p>Successfully validated {importResult.success} records. Ready to import!</p>
                      ) : (
                        <div>
                          <p>Found {importResult.errors.length} error(s):</p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            {importResult.errors.slice(0, 10).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importResult.errors.length > 10 && (
                              <li>...and {importResult.errors.length - 10} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ImportExportModal;





