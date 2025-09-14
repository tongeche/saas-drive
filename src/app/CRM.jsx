// CRM System for Client Relationship Management
// Advanced client management with communication tracking and analytics

import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  getCRMClients,
  getClientActivities,
  getClientCommunications,
  getCRMAnalytics,
  createClientActivity,
  updateClientSatisfaction,
  createClientNote,
  getClientNotes
} from '../lib/crm.js';
import {
  faUsers,
  faUserPlus,
  faPhone,
  faEnvelope,
  faCalendarAlt,
  faHistory,
  faChartLine,
  faEye,
  faEdit,
  faTrash,
  faTags,
  faBuilding,
  faStickyNote,
  faMapMarkerAlt,
  faSearch,
  faFilter,
  faStar,
  faHandshake,
  faMoneyBillWave,
  faFileInvoice,
  faReceipt,
  faComments,
  faPlus,
  faClock,
  faCheckCircle,
  faExclamationTriangle,
  faUserCheck,
  faUserTimes,
  faBell,
  faArrowUp,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';

export default function CRM() {
  const { tenant } = useOutletContext() || {};
  
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [mainActiveTab, setMainActiveTab] = useState('clients');
  const [showNewActivityModal, setShowNewActivityModal] = useState(false);
  const [error, setError] = useState('');

  // CRM Data
  const [activities, setActivities] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    if (tenant?.slug) {
      loadCRMData();
    }
  }, [tenant?.slug, selectedStatus, selectedTier, searchTerm]);

  useEffect(() => {
    filterClients();
  }, [clients]);

  const loadCRMData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!tenant?.id) {
        setError('No tenant found');
        return;
      }

      // Load clients with filters
      const filters = {
        status: selectedStatus !== 'all' ? selectedStatus : null,
        tier: selectedTier !== 'all' ? selectedTier : null,
        search: searchTerm || null
      };

      const clientsData = await getCRMClients(tenant.id, filters);
      setClients(clientsData);

      // Load analytics
      const analyticsData = await getCRMAnalytics(tenant.id);
      setAnalytics(analyticsData);

      // If a client is selected, load their activities and communications
      if (selectedClient) {
        const [activitiesData, communicationsData] = await Promise.all([
          getClientActivities(selectedClient.id),
          getClientCommunications(selectedClient.id)
        ]);
        setActivities(activitiesData);
        setCommunications(communicationsData);
      }

    } catch (err) {
      console.error('Error loading CRM data:', err);
      setError('Failed to load CRM data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = [...clients];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.company?.toLowerCase().includes(term) ||
        client.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(client => client.status === selectedStatus);
    }

    // Tier filter
    if (selectedTier !== 'all') {
      filtered = filtered.filter(client => client.tier === selectedTier);
    }

    setFilteredClients(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active', icon: faCheckCircle },
      prospect: { color: 'bg-blue-100 text-blue-800', label: 'Prospect', icon: faUserCheck },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive', icon: faUserTimes },
      lead: { color: 'bg-yellow-100 text-yellow-800', label: 'Lead', icon: faExclamationTriangle }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <FontAwesomeIcon icon={config.icon} className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getTierBadge = (tier) => {
    const tierConfig = {
      premium: { color: 'bg-purple-100 text-purple-800', label: 'Premium' },
      standard: { color: 'bg-blue-100 text-blue-800', label: 'Standard' },
      basic: { color: 'bg-gray-100 text-gray-800', label: 'Basic' }
    };
    
    const config = tierConfig[tier] || tierConfig.basic;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount, currency = 'KES') => {
    if (currency === 'KES') {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getClientActivitiesFiltered = (clientId) => {
    return activities.filter(activity => activity.client_id === clientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getActivityIcon = (type) => {
    const icons = {
      call: faPhone,
      email: faEnvelope,
      meeting: faUsers,
      note: faStickyNote,
      task: faClock
    };
    return icons[type] || faStickyNote;
  };

  const getSatisfactionColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Handler functions for database operations
  const handleCreateActivity = async (activityData) => {
    try {
      if (!tenant?.id || !selectedClient?.id) return;
      
      const newActivity = await createClientActivity({
        tenant_id: tenant.id,
        ...activityData,
        client_id: selectedClient.id
      });
      
      // Reload activities for the selected client
      const updatedActivities = await getClientActivities(selectedClient.id);
      setActivities(updatedActivities);
      
      setShowNewActivityModal(false);
    } catch (error) {
      console.error('Error creating activity:', error);
      setError('Failed to create activity: ' + error.message);
    }
  };

  const handleUpdateClientSatisfaction = async (clientId, score, feedback) => {
    try {
      if (!tenant?.id) return;
      
      await updateClientSatisfaction(tenant.id, clientId, score, feedback);
      
      // Reload clients to reflect changes
      loadCRMData();
    } catch (error) {
      console.error('Error updating satisfaction:', error);
      setError('Failed to update satisfaction score: ' + error.message);
    }
  };

  const handleCreateNote = async (noteData) => {
    try {
      if (!tenant?.id || !selectedClient?.id) return;
      
      await createClientNote(tenant.id, {
        ...noteData,
        client_id: selectedClient.id
      });
      
      // Reload client data if notes are displayed
      loadCRMData();
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Failed to create note: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <FontAwesomeIcon icon={faUsers} className="w-12 h-12 text-gray-400 mb-4" />
          <div className="text-gray-600">Loading CRM data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-blue-600" />
              Customer Relationship Management
            </h1>
            <p className="text-gray-600 mt-1">Manage client relationships, track communications, and grow your business</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/app/clients/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
              Add Client
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_clients || 0}</p>
            </div>
            <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-green-600">{analytics.active_clients || 0}</p>
            </div>
            <FontAwesomeIcon icon={faUserCheck} className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(analytics.total_revenue || 0, 'KES')}
              </p>
            </div>
            <FontAwesomeIcon icon={faMoneyBillWave} className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Satisfaction</p>
              <p className="text-2xl font-bold text-yellow-600">{analytics.avg_satisfaction || 0}/10</p>
            </div>
            <FontAwesomeIcon icon={faStar} className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'clients', label: 'Clients', icon: faUsers },
              { id: 'activities', label: 'Activities', icon: faHistory },
              { id: 'analytics', label: 'Analytics', icon: faChartLine }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMainActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  mainActiveTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Clients Tab */}
      {mainActiveTab === 'clients' && (
        <>
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search clients..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="prospect">Prospect</option>
              <option value="inactive">Inactive</option>
              <option value="lead">Lead</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tier</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tiers</option>
              <option value="premium">Premium</option>
              <option value="standard">Standard</option>
              <option value="basic">Basic</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
                setSelectedTier('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Clients Grid/List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                {client.company && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <FontAwesomeIcon icon={faBuilding} className="w-3 h-3" />
                    {client.company}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {getStatusBadge(client.status)}
                {getTierBadge(client.tier)}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FontAwesomeIcon icon={faPhone} className="w-4 h-4" />
                <span>{client.phone}</span>
              </div>
              {client.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4" />
                  <span className="truncate">{client.address}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(client.total_revenue, client.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Invoices</p>
                <p className="text-sm font-semibold text-gray-900">{client.total_invoices}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faStar} className={`w-4 h-4 ${getSatisfactionColor(client.satisfaction_score)}`} />
                <span className="text-sm font-medium">{client.satisfaction_score}/10</span>
              </div>
              <div className="text-xs text-gray-500">
                Last contact: {client.last_contact_date ? formatDate(client.last_contact_date) : 'Never'}
              </div>
            </div>

            {client.tags && client.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {client.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <FontAwesomeIcon icon={faTags} className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedClient(client)}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <FontAwesomeIcon icon={faEye} className="w-4 h-4 mr-2" />
                View Details
              </button>
              <Link
                to={`/app/clients/${client.id}/edit`}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faUsers} className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedStatus !== 'all' || selectedTier !== 'all' 
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding your first client.'
            }
          </p>
          <Link
            to="/app/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
            Add Your First Client
          </Link>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          activities={getClientActivitiesFiltered(selectedClient.id)}
          onClose={() => setSelectedClient(null)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          formatTime={formatTime}
          getActivityIcon={getActivityIcon}
          getSatisfactionColor={getSatisfactionColor}
        />
      )}
        </>
      )}

      {/* Activities Tab */}
      {mainActiveTab === 'activities' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {activities.slice(0, 10).map(activity => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${getSatisfactionColor(activity.type)}`}>
                  <FontAwesomeIcon icon={getActivityIcon(activity.type)} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(activity.created_at)} at {formatTime(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {mainActiveTab === 'analytics' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h3>
          <p className="text-gray-600">Advanced analytics and reporting features coming soon.</p>
        </div>
      )}
    </div>
  );
}

// Client Detail Modal Component
function ClientDetailModal({ 
  client, 
  activities, 
  onClose, 
  formatCurrency, 
  formatDate, 
  formatTime, 
  getActivityIcon,
  getSatisfactionColor 
}) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
            <p className="text-gray-600">{client.company}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: faEye },
              { id: 'activities', label: 'Activities', icon: faHistory },
              { id: 'analytics', label: 'Analytics', icon: faChartLine }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{client.address}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Preferred Contact:</span>
                      <span className="text-sm font-medium capitalize">{client.preferred_contact}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payment Terms:</span>
                      <span className="text-sm font-medium">{client.payment_terms} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Client Since:</span>
                      <span className="text-sm font-medium">{formatDate(client.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">Total Revenue</p>
                        <p className="text-xl font-bold text-blue-900">
                          {formatCurrency(client.total_revenue, client.currency)}
                        </p>
                      </div>
                      <FontAwesomeIcon icon={faMoneyBillWave} className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600">Total Invoices</p>
                        <p className="text-xl font-bold text-green-900">{client.total_invoices}</p>
                      </div>
                      <FontAwesomeIcon icon={faFileInvoice} className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600">Satisfaction</p>
                        <p className={`text-xl font-bold ${getSatisfactionColor(client.satisfaction_score)}`}>
                          {client.satisfaction_score}/10
                        </p>
                      </div>
                      <FontAwesomeIcon icon={faStar} className={`w-8 h-8 ${getSatisfactionColor(client.satisfaction_score)}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {client.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{client.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                  Add Activity
                </button>
              </div>

              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={getActivityIcon(activity.type)} className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{activity.title}</h4>
                            <span className="text-xs text-gray-500">
                              {formatDate(activity.date)} at {formatTime(activity.date)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                          {activity.duration && (
                            <p className="text-xs text-gray-500">Duration: {activity.duration} minutes</p>
                          )}
                          {activity.next_action && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                              <p className="text-xs text-yellow-800">
                                <strong>Next Action:</strong> {activity.next_action}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FontAwesomeIcon icon={faHistory} className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-600">No activities recorded yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Client Analytics</h3>
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faChartLine} className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-600">Analytics dashboard coming soon</p>
                <p className="text-sm text-gray-500">Track client engagement, revenue trends, and relationship health</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Link
                to={`/app/invoices/new?client=${client.id}`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <FontAwesomeIcon icon={faFileInvoice} className="w-4 h-4 mr-2" />
                Create Invoice
              </Link>
              <Link
                to={`/app/receipts/new?client=${client.id}`}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 mr-2" />
                Add Receipt
              </Link>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
