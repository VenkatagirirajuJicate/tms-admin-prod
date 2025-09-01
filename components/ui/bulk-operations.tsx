'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Edit3, 
  Download, 
  Upload,
  X,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

import toast from 'react-hot-toast';

export interface BulkOperationItem {
  id: string;
  [key: string]: any;
}

interface BulkOperationsProps {
  items: BulkOperationItem[];
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onBulkDelete?: (selectedIds: string[]) => Promise<void>;
  onBulkEdit?: (selectedIds: string[]) => void;
  onBulkExport?: (selectedIds: string[]) => void;
  itemTypeName: string; // e.g., "routes", "vehicles", "drivers"
  renderItem: (item: BulkOperationItem, isSelected: boolean, onToggle: () => void) => React.ReactNode;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  items,
  selectedItems,
  onSelectionChange,
  onBulkDelete,
  onBulkEdit,
  onBulkExport,
  itemTypeName,
  renderItem
}) => {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAllSelected = selectedItems.length === items.length && items.length > 0;
  const isSomeSelected = selectedItems.length > 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  };

  const handleToggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedItems.length === 0) return;

    setIsProcessing(true);
    try {
      await onBulkDelete(selectedItems);
      onSelectionChange([]);
      setIsDeleteConfirmOpen(false);
      toast.success(`Successfully deleted ${selectedItems.length} ${itemTypeName}`);
    } catch (error: any) {
      toast.error(`Failed to delete ${itemTypeName}: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkEdit = () => {
    if (!onBulkEdit || selectedItems.length === 0) return;
    onBulkEdit(selectedItems);
  };

  const handleBulkExport = () => {
    if (!onBulkExport || selectedItems.length === 0) return;
    onBulkExport(selectedItems);
  };

  return (
    <div className="space-y-4">
      {/* Bulk Operations Bar */}
      <AnimatePresence>
        {isSomeSelected && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedItems.length} {itemTypeName} selected
                </span>
                <button
                  onClick={() => onSelectionChange([])}
                  className="btn-secondary h-8"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Selection
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                {onBulkEdit && (
                  <button
                    onClick={handleBulkEdit}
                    className="btn-secondary h-8"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit Selected
                  </button>
                )}
                
                {onBulkExport && (
                  <button
                    onClick={handleBulkExport}
                    className="btn-secondary h-8"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </button>
                )}
                
                {onBulkDelete && (
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="btn-secondary h-8 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select All Checkbox */}
      {items.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : isSomeSelected ? (
              <div className="h-4 w-4 bg-blue-600 border rounded flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-sm" />
              </div>
            ) : (
              <Square className="h-4 w-4 text-gray-400" />
            )}
            <span>
              {isAllSelected
                ? `All ${items.length} ${itemTypeName} selected`
                : isSomeSelected
                ? `${selectedItems.length} of ${items.length} selected`
                : `Select all ${items.length} ${itemTypeName}`
              }
            </span>
          </button>
          
          {isSomeSelected && (
            <span className="text-xs text-gray-500">
              Click items to select/deselect individually
            </span>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="relative">
            {renderItem(
              item,
              selectedItems.includes(item.id),
              () => handleToggleItem(item.id)
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Confirm Bulk Delete
                </h3>
                
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to delete {selectedItems.length} {itemTypeName}? 
                  This action cannot be undone.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    disabled={isProcessing}
                    className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isProcessing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors duration-150 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 mr-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete {selectedItems.length} {itemTypeName}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper hook for managing bulk operations state
export const useBulkOperations = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSelectionChange = (newSelection: string[]) => {
    setSelectedItems(newSelection);
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const isSelected = (itemId: string) => {
    return selectedItems.includes(itemId);
  };

  return {
    selectedItems,
    handleSelectionChange,
    clearSelection,
    isSelected,
  };
};

export default BulkOperations;


