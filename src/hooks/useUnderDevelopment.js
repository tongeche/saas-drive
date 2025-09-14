import { useState, useEffect } from 'react';

/**
 * Hook to check if a feature is under development
 * @param {string} featureName - Name of the feature
 * @param {number} estimatedDays - Days until completion
 * @param {boolean} isDevelopment - Override for development mode
 */
export function useUnderDevelopment(featureName, estimatedDays = 7, isDevelopment = true) {
  const [isUnderDevelopment, setIsUnderDevelopment] = useState(isDevelopment);
  const [countdown, setCountdown] = useState({
    days: estimatedDays,
    hours: Math.floor(Math.random() * 24),
    minutes: Math.floor(Math.random() * 60),
    seconds: Math.floor(Math.random() * 60)
  });

  useEffect(() => {
    // In production, you might check a feature flag API
    // For now, we'll use the isDevelopment parameter
    setIsUnderDevelopment(isDevelopment);
  }, [isDevelopment]);

  useEffect(() => {
    if (!isUnderDevelopment) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        let newSeconds = prev.seconds - 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;
        let newDays = prev.days;

        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes = prev.minutes - 1;
        }
        if (newMinutes < 0) {
          newMinutes = 59;
          newHours = prev.hours - 1;
        }
        if (newHours < 0) {
          newHours = 23;
          newDays = prev.days - 1;
        }
        if (newDays < 0) {
          // Feature is "ready"
          setIsUnderDevelopment(false);
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
          days: newDays,
          hours: newHours,
          minutes: newMinutes,
          seconds: newSeconds
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isUnderDevelopment]);

  return {
    isUnderDevelopment,
    countdown,
    setIsUnderDevelopment
  };
}

/**
 * Feature flags for different parts of the application
 */
export const FEATURE_FLAGS = {
  ADVANCED_REPORTS: {
    name: "Advanced Business Reports",
    days: 5,
    enabled: false
  },
  INVENTORY_MANAGEMENT: {
    name: "Inventory Management", 
    days: 8,
    enabled: false
  },
  CRM_ADVANCED: {
    name: "Advanced CRM Features",
    days: 6,
    enabled: false
  },
  MULTI_CURRENCY: {
    name: "Multi-Currency Support",
    days: 4,
    enabled: false
  },
  AUTOMATED_WORKFLOWS: {
    name: "Automated Workflows",
    days: 9,
    enabled: false
  },
  MOBILE_APP: {
    name: "Mobile Application",
    days: 15,
    enabled: false
  },
  API_INTEGRATIONS: {
    name: "Third-party Integrations",
    days: 7,
    enabled: false
  },
  ADVANCED_ANALYTICS: {
    name: "Predictive Analytics",
    days: 12,
    enabled: false
  }
};

/**
 * Check if a specific feature is enabled
 * @param {string} featureKey - Key from FEATURE_FLAGS
 */
export function isFeatureEnabled(featureKey) {
  return FEATURE_FLAGS[featureKey]?.enabled || false;
}

/**
 * Get feature info
 * @param {string} featureKey - Key from FEATURE_FLAGS  
 */
export function getFeatureInfo(featureKey) {
  return FEATURE_FLAGS[featureKey] || null;
}
