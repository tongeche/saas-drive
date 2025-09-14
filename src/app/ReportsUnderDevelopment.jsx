import React from 'react';
import UnderDevelopment from '../components/UnderDevelopment';

export default function ReportsUnderDevelopment() {
  return (
    <UnderDevelopment
      featureName="Business Reports & Analytics"
      description="Advanced reporting dashboard with real-time insights and custom report generation."
      estimatedDays={5}
      featureType="reports"
      backLink="/app"
    />
  );
}
