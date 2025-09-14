# Under Development Module Documentation

This module provides a comprehensive system for handling features that are still under development. It includes full-page components, inline banners, and hooks for managing feature flags.

## Components

### 1. UnderDevelopment (Full Page)
A complete page component for features that aren't ready yet.

```jsx
import UnderDevelopment from '../components/UnderDevelopment';

<UnderDevelopment
  featureName="Advanced Reports"
  description="Comprehensive analytics dashboard with real-time insights"
  estimatedDays={5}
  featureType="reports" // reports, inventory, customers, invoices, general
  backLink="/app"
/>
```

**Props:**
- `featureName`: Name of the feature
- `description`: Brief description of what's coming
- `estimatedDays`: Number of days until estimated completion (max 10)
- `featureType`: Type of feature (affects styling and content)
- `backLink`: Where to go when user clicks back

### 2. ComingSoonBanner (Inline)
A banner component that can be embedded in existing pages.

```jsx
import ComingSoonBanner from '../components/ComingSoonBanner';

// Full banner
<ComingSoonBanner
  featureName="Export to Excel"
  estimatedDays={3}
  onDismiss={() => setBannerVisible(false)}
/>

// Compact banner
<ComingSoonBanner
  featureName="Advanced Filters"
  estimatedDays={2}
  compact={true}
/>
```

**Props:**
- `featureName`: Name of the feature
- `estimatedDays`: Days until completion
- `onDismiss`: Callback when banner is dismissed
- `compact`: Boolean for compact version

## Hooks

### useUnderDevelopment
A hook for managing feature development state.

```jsx
import { useUnderDevelopment, FEATURE_FLAGS } from '../hooks/useUnderDevelopment';

const { isUnderDevelopment, countdown, setIsUnderDevelopment } = useUnderDevelopment(
  'Advanced Reports',
  7,
  true // isDevelopment flag
);

if (isUnderDevelopment) {
  return <UnderDevelopment ... />;
}
```

## Feature Flags

Predefined feature flags in `FEATURE_FLAGS`:

- `ADVANCED_REPORTS`: Business analytics (5 days)
- `INVENTORY_MANAGEMENT`: Stock management (8 days)
- `CRM_ADVANCED`: Advanced CRM (6 days)
- `MULTI_CURRENCY`: Currency support (4 days)
- `AUTOMATED_WORKFLOWS`: Process automation (9 days)
- `MOBILE_APP`: Mobile application (15 days - special case)
- `API_INTEGRATIONS`: Third-party integrations (7 days)
- `ADVANCED_ANALYTICS`: Predictive analytics (12 days - special case)

## Usage Examples

### 1. Replace an entire page
```jsx
// In your route component
import UnderDevelopment from '../components/UnderDevelopment';

export default function ReportsPage() {
  return (
    <UnderDevelopment
      featureType="reports"
      estimatedDays={5}
      backLink="/app"
    />
  );
}
```

### 2. Add to existing page
```jsx
import ComingSoonBanner from '../components/ComingSoonBanner';

export default function ExistingPage() {
  return (
    <div>
      <ComingSoonBanner
        featureName="Advanced Search"
        estimatedDays={4}
        compact={true}
      />
      {/* Rest of your page content */}
    </div>
  );
}
```

### 3. Conditional rendering
```jsx
import { useUnderDevelopment, isFeatureEnabled } from '../hooks/useUnderDevelopment';

export default function ConditionalPage() {
  const { isUnderDevelopment } = useUnderDevelopment('Feature Name', 7, !isFeatureEnabled('ADVANCED_REPORTS'));
  
  if (isUnderDevelopment) {
    return <UnderDevelopment featureType="reports" />;
  }
  
  return <YourActualComponent />;
}
```

## Navigation Integration

To add under development pages to navigation:

1. Create the page component:
```jsx
// src/app/FeatureUnderDevelopment.jsx
import UnderDevelopment from '../components/UnderDevelopment';

export default function FeatureUnderDevelopment() {
  return (
    <UnderDevelopment
      featureType="inventory"
      estimatedDays={8}
    />
  );
}
```

2. Add route in `main.jsx`:
```jsx
import FeatureUnderDevelopment from "./app/FeatureUnderDevelopment.jsx";

// In routes:
<Route path="feature" element={<FeatureUnderDevelopment />} />
```

3. Update navigation in `AppShell.jsx`:
```jsx
<button onClick={() => nav("/app/feature")}>
  Feature Name
</button>
```

## Styling

The components use Tailwind CSS and are designed to match the existing Finovo design system:
- Primary color: `#4D7969` (Finovo green)
- Color schemes for different feature types
- Responsive design for mobile/desktop
- Consistent with existing UI patterns

## Email Notifications

The components include email signup functionality. Currently logs to console, but can be connected to your backend:

```jsx
// In your backend integration
const handleNotifyMe = async (email, featureName) => {
  await fetch('/api/feature-notifications', {
    method: 'POST',
    body: JSON.stringify({ email, feature: featureName })
  });
};
```

## Countdown Logic

- Countdowns are automatically managed
- When countdown reaches 0, `isUnderDevelopment` becomes false
- Realistic random starting times for hours/minutes/seconds
- Maximum recommended: 10 days per feature
