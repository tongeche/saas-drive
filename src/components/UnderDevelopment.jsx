import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTools, 
  faClock, 
  faBell, 
  faCheck, 
  faArrowLeft,
  faRocket,
  faCode,
  faLightbulb,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

export default function UnderDevelopment({ 
  featureName = "Feature", 
  description = "This feature is coming soon!",
  estimatedDays = 7,
  featureType = "general",
  backLink = "/app"
}) {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [countdown, setCountdown] = useState({
    days: estimatedDays,
    hours: Math.floor(Math.random() * 24),
    minutes: Math.floor(Math.random() * 60),
    seconds: Math.floor(Math.random() * 60)
  });

  // Feature-specific configurations
  const featureConfigs = {
    invoices: {
      icon: faRocket,
      title: "Advanced Invoice Management",
      subtitle: "Professional invoicing with smart automation",
      description: "We're building an advanced invoice management system with automatic payment reminders, recurring invoices, and detailed analytics.",
      features: [
        "Automated payment reminders",
        "Recurring invoice templates", 
        "Advanced reporting and analytics",
        "Multi-currency support",
        "Client payment portals"
      ],
      color: "blue"
    },
    reports: {
      icon: faLightbulb,
      title: "Business Intelligence Reports",
      subtitle: "Insights that drive your business forward",
      description: "Comprehensive reporting dashboard with real-time analytics, custom report builder, and predictive insights.",
      features: [
        "Real-time financial dashboards",
        "Custom report builder",
        "Predictive analytics",
        "Export to multiple formats",
        "Automated report scheduling"
      ],
      color: "purple"
    },
    inventory: {
      icon: faCode,
      title: "Inventory Management",
      subtitle: "Complete control over your products and services",
      description: "Advanced inventory tracking with low-stock alerts, batch management, and integrated barcode scanning.",
      features: [
        "Real-time stock tracking",
        "Low-stock notifications",
        "Barcode scanning integration",
        "Batch and serial number tracking",
        "Supplier management"
      ],
      color: "green"
    },
    customers: {
      icon: faStar,
      title: "Customer Relationship Management",
      subtitle: "Build stronger relationships with your clients",
      description: "Complete CRM solution with communication tracking, lead management, and customer insights.",
      features: [
        "Communication history tracking",
        "Lead management pipeline",
        "Customer segmentation",
        "Automated follow-ups",
        "Customer satisfaction surveys"
      ],
      color: "orange"
    },
    general: {
      icon: faTools,
      title: featureName,
      subtitle: "Coming soon to Finovo",
      description: description,
      features: [
        "Modern, intuitive interface",
        "Mobile-friendly design",
        "Real-time updates",
        "Secure data handling",
        "Expert support"
      ],
      color: "gray"
    }
  };

  const config = featureConfigs[featureType] || featureConfigs.general;

  // Countdown timer effect
  useEffect(() => {
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
          newDays = 0;
          newHours = 0;
          newMinutes = 0;
          newSeconds = 0;
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
  }, []);

  const handleNotifyMe = (e) => {
    e.preventDefault();
    if (email) {
      // Here you would typically save the email to your backend
      console.log('Saving notification request for:', email);
      setIsSubscribed(true);
      setEmail('');
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-500',
        bgLight: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      purple: {
        bg: 'bg-purple-500',
        bgLight: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        button: 'bg-purple-600 hover:bg-purple-700'
      },
      green: {
        bg: 'bg-green-500',
        bgLight: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200',
        button: 'bg-green-600 hover:bg-green-700'
      },
      orange: {
        bg: 'bg-orange-500',
        bgLight: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-200',
        button: 'bg-orange-600 hover:bg-orange-700'
      },
      gray: {
        bg: 'bg-gray-500',
        bgLight: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
        button: 'bg-gray-600 hover:bg-gray-700'
      }
    };
    return colors[color] || colors.gray;
  };

  const colorClasses = getColorClasses(config.color);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              to={backLink}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="text-sm text-gray-500">
              Finovo Business Suite
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${colorClasses.bgLight}`}>
            <FontAwesomeIcon icon={config.icon} className={`w-10 h-10 ${colorClasses.text}`} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {config.title}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {config.subtitle}
          </p>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            {config.description}
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Estimated Launch Time
            </h2>
            <p className="text-gray-600">
              We're working hard to bring you this feature!
            </p>
          </div>
          
          <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <div className={`${colorClasses.bg} text-white rounded-lg p-4 mb-2`}>
                <div className="text-3xl font-bold">{countdown.days}</div>
              </div>
              <div className="text-sm text-gray-600">Days</div>
            </div>
            <div className="text-center">
              <div className={`${colorClasses.bg} text-white rounded-lg p-4 mb-2`}>
                <div className="text-3xl font-bold">{countdown.hours}</div>
              </div>
              <div className="text-sm text-gray-600">Hours</div>
            </div>
            <div className="text-center">
              <div className={`${colorClasses.bg} text-white rounded-lg p-4 mb-2`}>
                <div className="text-3xl font-bold">{countdown.minutes}</div>
              </div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
            <div className="text-center">
              <div className={`${colorClasses.bg} text-white rounded-lg p-4 mb-2`}>
                <div className="text-3xl font-bold">{countdown.seconds}</div>
              </div>
              <div className="text-sm text-gray-600">Seconds</div>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            What's Coming
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {config.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <FontAwesomeIcon icon={faCheck} className={`w-5 h-5 ${colorClasses.text}`} />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Signup */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {!isSubscribed ? (
            <>
              <FontAwesomeIcon icon={faBell} className={`w-12 h-12 ${colorClasses.text} mb-4`} />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Get Notified When It's Ready
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to know when this feature launches. We'll send you an email as soon as it's available.
              </p>
              <form onSubmit={handleNotifyMe} className="max-w-md mx-auto">
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: config.color === 'blue' ? '#3B82F6' : '#6B7280' }}
                    required
                  />
                  <button
                    type="submit"
                    className={`px-6 py-3 text-white font-medium rounded-lg transition-colors ${colorClasses.button}`}
                  >
                    Notify Me
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faCheck} className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                You're All Set!
              </h3>
              <p className="text-gray-600">
                We'll notify you as soon as this feature is ready. Thank you for your patience!
              </p>
            </>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
            <FontAwesomeIcon icon={faCode} className="w-4 h-4" />
            <span>Development Progress</span>
          </div>
          <div className="max-w-md mx-auto">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${colorClasses.bg}`}
                style={{ width: `${Math.max(20, Math.min(95, 100 - (countdown.days / estimatedDays) * 100))}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {Math.max(20, Math.min(95, 100 - (countdown.days / estimatedDays) * 100)).toFixed(0)}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Have questions or feedback about this upcoming feature?
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link 
                to="/app/settings"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                Contact Support
              </Link>
              <span className="text-gray-300">|</span>
              <Link 
                to="/app"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
          <div className="text-center mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              © 2025 Finovo Business Suite. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
