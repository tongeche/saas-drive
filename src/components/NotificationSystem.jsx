import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationTriangle, 
  faInfoCircle, 
  faTimes,
  faBell,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

export function NotificationToast({ type = 'info', message, isVisible, onClose, autoClose = true, duration = 5000 }) {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  if (!isVisible) return null;

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: faCheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600'
        };
      case 'error':
        return {
          icon: faExclamationTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          icon: faExclamationTriangle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600'
        };
      case 'loading':
        return {
          icon: faSpinner,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
      default:
        return {
          icon: faInfoCircle,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg transform transition-all duration-300 ease-in-out`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FontAwesomeIcon 
              icon={config.icon} 
              className={`w-5 h-5 ${config.iconColor} ${type === 'loading' ? 'animate-spin' : ''}`} 
            />
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${config.textColor}`}>
              {message}
            </p>
          </div>
          {type !== 'loading' && (
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={onClose}
                className={`inline-flex ${config.textColor} hover:opacity-75 focus:outline-none`}
              >
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status, size = 'sm' }) {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return { 
          text: 'Approved', 
          bgColor: 'bg-green-100', 
          textColor: 'text-green-800',
          icon: faCheckCircle 
        };
      case 'pending':
        return { 
          text: 'Pending', 
          bgColor: 'bg-yellow-100', 
          textColor: 'text-yellow-800',
          icon: faBell 
        };
      case 'rejected':
        return { 
          text: 'Rejected', 
          bgColor: 'bg-red-100', 
          textColor: 'text-red-800',
          icon: faExclamationTriangle 
        };
      default:
        return { 
          text: status || 'Unknown', 
          bgColor: 'bg-gray-100', 
          textColor: 'text-gray-800',
          icon: faInfoCircle 
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClass = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
  const iconSize = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClass} font-medium rounded-full ${config.bgColor} ${config.textColor}`}>
      <FontAwesomeIcon icon={config.icon} className={iconSize} />
      {config.text}
    </span>
  );
}

export function LoadingSpinner({ size = 'md', message = 'Loading...' }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }[size];

  return (
    <div className="flex items-center justify-center gap-3 p-4">
      <FontAwesomeIcon 
        icon={faSpinner} 
        className={`${sizeClass} text-blue-600 animate-spin`} 
      />
      {message && (
        <span className="text-gray-600 text-sm font-medium">{message}</span>
      )}
    </div>
  );
}

export function EmptyState({ 
  icon = faInfoCircle, 
  title = 'No data found', 
  description = 'There are no items to display.',
  actionButton = null 
}) {
  return (
    <div className="text-center py-12 px-4">
      <FontAwesomeIcon 
        icon={icon} 
        className="w-12 h-12 text-gray-400 mx-auto mb-4" 
      />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      {actionButton && (
        <div>{actionButton}</div>
      )}
    </div>
  );
}

// Hook for managing notifications
export function useNotification() {
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message, options = {}) => {
    setNotification({
      type,
      message,
      isVisible: true,
      id: Date.now(),
      ...options
    });
  };

  const hideNotification = () => {
    setNotification(prev => prev ? { ...prev, isVisible: false } : null);
  };

  const showSuccess = (message, options) => showNotification('success', message, options);
  const showError = (message, options) => showNotification('error', message, options);
  const showWarning = (message, options) => showNotification('warning', message, options);
  const showInfo = (message, options) => showNotification('info', message, options);
  const showLoading = (message, options) => showNotification('loading', message, { autoClose: false, ...options });

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };
}
