
import React, { useEffect } from 'react';
import { X, Footprints } from 'lucide-react';

interface NotificationToastProps {
  title: string;
  message: string;
  onDismiss: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ title, message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000); // Auto-dismiss after 8 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-5 right-5 w-full max-w-sm bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-slide-in-right z-50">
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.5s ease-out forwards; }
      `}</style>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Footprints className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-bold text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onDismiss}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
