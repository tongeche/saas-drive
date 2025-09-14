import React from 'react';
import UnderDevelopment from '../components/UnderDevelopment';

export default function InventoryUnderDevelopment() {
  return (
    <UnderDevelopment
      featureName="Inventory Management"
      description="Complete inventory tracking with stock management, barcode scanning, and supplier integration."
      estimatedDays={8}
      featureType="inventory"
      backLink="/app"
    />
  );
}
