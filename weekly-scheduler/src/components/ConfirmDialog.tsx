import React from 'react';
import { IoIosWarning } from "react-icons/io";

interface ConfirmDialogProps {
  isOpen: Boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, 
  message, 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  const WarningIcon = IoIosWarning as React.ComponentType<{ size?: number }>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-96">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl text-yellow-500">
            <WarningIcon size={25} />
          </span>
          <h2 className="text-xl font-bold text-gray-800">
            Confirm Action
          </h2>
        </div>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;