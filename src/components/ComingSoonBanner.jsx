import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTools, 
  faClock, 
  faBell, 
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

export default function ComingSoonBanner({ 
  featureName, 
  estimatedDays = 7, 
  onDismiss,
  compact = false 
}) {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleNotifyMe = (e) => {
    e.preventDefault();
    if (email) {
      // Save email notification request
      console.log('Notification request for:', email, 'Feature:', featureName);
      setIsSubscribed(true);
      setEmail('');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!isVisible) return null;

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faTools} className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{featureName} is coming soon!</h3>
              <p className="text-sm text-gray-600">Estimated: {estimatedDays} days</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faTools} className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{featureName}</h3>
            <p className="text-sm text-gray-600">Feature under development</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-orange-600" />
          <span className="text-sm font-medium text-gray-700">
            Estimated completion: {estimatedDays} days
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${Math.max(10, 100 - (estimatedDays * 10))}%` }}
          ></div>
        </div>
      </div>

      {!isSubscribed ? (
        <form onSubmit={handleNotifyMe} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Get notified when ready"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FontAwesomeIcon icon={faBell} className="w-4 h-4 mr-1" />
            Notify Me
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2 text-green-600">
          <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
          <span className="text-sm font-medium">You'll be notified when this feature is ready!</span>
        </div>
      )}
    </div>
  );
}
