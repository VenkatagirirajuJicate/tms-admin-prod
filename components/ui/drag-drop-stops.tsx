'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronUp,
  ChevronDown,
  MapPin, 
  Clock, 
  Edit, 
  Trash2, 
  Star,
  Navigation
} from 'lucide-react';

export interface DragDropStop {
  id?: string;
  stop_name: string;
  stop_time: string;
  sequence_order: number;
  latitude?: number;
  longitude?: number;
  is_major_stop: boolean;
}

interface StopItemProps {
  stop: DragDropStop;
  index: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onToggleMajor: (index: number) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const StopItem: React.FC<StopItemProps> = ({
  stop,
  index,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onToggleMajor,
  canMoveUp,
  canMoveDown
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-center space-x-4">
        {/* Move Controls */}
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => onMoveUp(index)}
            disabled={!canMoveUp}
            className={`p-1 rounded transition-colors ${
              canMoveUp 
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' 
                : 'text-gray-200 cursor-not-allowed'
            }`}
            title="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={!canMoveDown}
            className={`p-1 rounded transition-colors ${
              canMoveDown 
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' 
                : 'text-gray-200 cursor-not-allowed'
            }`}
            title="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Sequence Number */}
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
          {stop.sequence_order}
        </div>

        {/* Stop Details */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{stop.stop_name}</h4>
            {stop.is_major_stop && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{stop.stop_time}</span>
            </div>
            
            {stop.latitude && stop.longitude && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span className="text-xs">
                  {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleMajor(index)}
            className={`p-1 rounded transition-colors ${
              stop.is_major_stop
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-yellow-500'
            }`}
            title={stop.is_major_stop ? 'Remove from major stops' : 'Mark as major stop'}
          >
            <Star className={`h-4 w-4 ${stop.is_major_stop ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={() => onEdit(index)}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            title="Edit stop"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete(index)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete stop"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface DragDropStopsProps {
  stops: DragDropStop[];
  onReorder: (newStops: DragDropStop[]) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onToggleMajor: (index: number) => void;
  isEditable?: boolean;
}

const DragDropStops: React.FC<DragDropStopsProps> = ({
  stops,
  onReorder,
  onEdit,
  onDelete,
  onToggleMajor,
  isEditable = true
}) => {
  const moveStopUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      
      const newStops = [...stops];
      const stopToMove = newStops[index];
      const stopToSwap = newStops[index - 1];
      
      // Swap the stops
      newStops[index] = stopToSwap;
      newStops[index - 1] = stopToMove;
      
      // Update sequence orders
      const reorderedStops = newStops.map((stop, idx) => ({
        ...stop,
        sequence_order: idx + 1
      }));
      
      onReorder(reorderedStops);
    },
    [stops, onReorder]
  );

  const moveStopDown = useCallback(
    (index: number) => {
      if (index === stops.length - 1) return;
      
      const newStops = [...stops];
      const stopToMove = newStops[index];
      const stopToSwap = newStops[index + 1];
      
      // Swap the stops
      newStops[index] = stopToSwap;
      newStops[index + 1] = stopToMove;
      
      // Update sequence orders
      const reorderedStops = newStops.map((stop, idx) => ({
        ...stop,
        sequence_order: idx + 1
      }));
      
      onReorder(reorderedStops);
    },
    [stops, onReorder]
  );

  if (!isEditable) {
    return (
      <div className="space-y-3">
        {stops.map((stop, index) => (
          <div key={index} className="bg-gray-50 border rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                {stop.sequence_order}
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900">{stop.stop_name}</h4>
                  {stop.is_major_stop && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{stop.stop_time}</span>
                  </div>
                  
                  {stop.latitude && stop.longitude && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs">
                        {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stops.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-2">No stops added yet</p>
          <p className="text-sm text-gray-400">Add stops to create your route</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Route Stops ({stops.length})
            </h3>
            <div className="text-sm text-gray-500">
              Use arrows to reorder stops
            </div>
          </div>
          
          <div className="space-y-3">
            {stops.map((stop, index) => (
              <StopItem
                key={`${stop.id || index}-${stop.sequence_order}`}
                index={index}
                stop={stop}
                onMoveUp={moveStopUp}
                onMoveDown={moveStopDown}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleMajor={onToggleMajor}
                canMoveUp={index > 0}
                canMoveDown={index < stops.length - 1}
              />
            ))}
          </div>
          
          {stops.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Route Summary</p>
                  <p>
                    {stops.length} stops • {stops.filter(s => s.is_major_stop).length} major stops
                  </p>
                  <p>
                    From <strong>{stops[0]?.stop_name}</strong> to <strong>{stops[stops.length - 1]?.stop_name}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DragDropStops;


