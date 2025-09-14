import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import ComingSoonBanner from '../components/ComingSoonBanner';
import { useUnderDevelopment, FEATURE_FLAGS } from '../hooks/useUnderDevelopment';

export default function ExamplePageWithComingSoon() {
  const { tenant } = useOutletContext() || {};
  const [showBanner, setShowBanner] = useState(true);
  
  // Example of using the hook
  const { isUnderDevelopment, countdown } = useUnderDevelopment(
    FEATURE_FLAGS.ADVANCED_REPORTS.name,
    FEATURE_FLAGS.ADVANCED_REPORTS.days,
    !FEATURE_FLAGS.ADVANCED_REPORTS.enabled
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sample Page</h1>
      
      {/* Example: Full Under Development Check */}
      {isUnderDevelopment ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Advanced Reports Coming Soon
          </h2>
          <p className="text-gray-600 mb-4">
            This feature is currently under development.
          </p>
          <div className="text-2xl font-bold text-blue-600">
            {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
          </div>
        </div>
      ) : (
        <>
          {/* Example: Banner for specific feature */}
          {showBanner && (
            <ComingSoonBanner
              featureName="Advanced Analytics Dashboard"
              estimatedDays={3}
              onDismiss={() => setShowBanner(false)}
            />
          )}

          {/* Example: Compact banner */}
          <ComingSoonBanner
            featureName="Export to Excel"
            estimatedDays={2}
            compact={true}
          />

          {/* Regular page content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Current Features
            </h2>
            <p className="text-gray-600">
              This is an example of how to integrate coming soon banners into existing pages.
            </p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Feature 1</h3>
                <p className="text-sm text-gray-600">This feature is available</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Feature 2</h3>
                <p className="text-sm text-gray-600">This feature is available</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
