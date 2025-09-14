import React from 'react';
import UnderDevelopment from '../components/UnderDevelopment';

export default function CRMUnderDevelopment() {
  return (
    <UnderDevelopment
      featureName="Customer Relationship Management"
      description="Advanced CRM with lead tracking, communication history, and customer insights."
      estimatedDays={6}
      featureType="customers"
      backLink="/app"
    />
  );
}
