import React from 'react'

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onEdit, onCancel }) => {
    if(!isOpen) return null;    
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg w-80 p-6">
            <h2 className="text-xl font-bold mb-2">{title || "Confirm"}</h2>
            <p className="mb-4">{message || "Are you sure?"}</p>

            <div className="flex justify-end space-x-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                >
                    Cancel
                </button>

                <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-gray-600 transition-colors"
                >Confirm</button>
            </div>
        </div>
    </div>
  );
};

export default ConfirmDialog