// CRM Library - Client Relationship Management utilities
// Handles client data, activities, communications, and analytics

import supabase from './supabase.js';

// Client Management
export async function getCRMClients(tenantId, filters = {}) {
  try {
    let query = supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.tier) {
      query = query.eq('tier', filters.tier);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate revenue and invoice count for each client separately
    const clientsWithRevenue = await Promise.all(
      (data || []).map(async (client) => {
        // Get invoice totals for this client
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('total')
          .eq('client_id', client.id)
          .eq('tenant_id', tenantId);

        const totalRevenue = (invoiceData || []).reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalInvoices = (invoiceData || []).length;

        return {
          ...client,
          total_invoices: totalInvoices,
          total_revenue: totalRevenue,
          tags: client.tags || [],
          satisfaction_score: client.satisfaction_score || 7,
          payment_terms: client.payment_terms || 30,
          preferred_contact: client.preferred_contact || 'email'
        };
      })
    );

    return clientsWithRevenue;
  } catch (error) {
    console.error('Error fetching CRM clients:', error);
    throw error;
  }
}

// Client Activities Management
export async function getClientActivities(clientId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching client activities:', error);
    throw error;
  }
}

export async function createClientActivity(activityData) {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .insert(activityData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating client activity:', error);
    throw error;
  }
}

export async function updateClientActivity(activityId, updates) {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .update(updates)
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating client activity:', error);
    throw error;
  }
}

export async function deleteClientActivity(activityId) {
  try {
    const { error } = await supabase
      .from('client_activities')
      .delete()
      .eq('id', activityId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting client activity:', error);
    throw error;
  }
}

// Client Communications
export async function getClientCommunications(clientId) {
  try {
    const { data, error } = await supabase
      .from('client_communications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching client communications:', error);
    throw error;
  }
}

export async function createClientCommunication(communicationData) {
  try {
    const { data, error } = await supabase
      .from('client_communications')
      .insert(communicationData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating client communication:', error);
    throw error;
  }
}

// Client Notes Management
export async function getClientNotes(tenantId, clientId) {
  try {
    const { data, error } = await supabase
      .from('client_notes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching client notes:', error);
    throw error;
  }
}

export async function createClientNote(tenantId, noteData) {
  try {
    const { data, error } = await supabase
      .from('client_notes')
      .insert({
        tenant_id: tenantId,
        ...noteData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating client note:', error);
    throw error;
  }
}

export async function updateClientNote(noteId, updates) {
  try {
    const { data, error } = await supabase
      .from('client_notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating client note:', error);
    throw error;
  }
}

export async function deleteClientNote(noteId) {
  try {
    const { error } = await supabase
      .from('client_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting client note:', error);
    throw error;
  }
}

// Client Tags Management
export async function addClientTag(clientId, tag) {
  try {
    // Get current tags
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('tags')
      .eq('id', clientId)
      .single();

    if (fetchError) throw fetchError;

    const currentTags = client.tags || [];
    const newTags = [...new Set([...currentTags, tag])]; // Remove duplicates

    const { data, error } = await supabase
      .from('clients')
      .update({ tags: newTags })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding client tag:', error);
    throw error;
  }
}

export async function removeClientTag(clientId, tag) {
  try {
    // Get current tags
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('tags')
      .eq('id', clientId)
      .single();

    if (fetchError) throw fetchError;

    const currentTags = client.tags || [];
    const newTags = currentTags.filter(t => t !== tag);

    const { data, error } = await supabase
      .from('clients')
      .update({ tags: newTags })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error removing client tag:', error);
    throw error;
  }
}

// Client Analytics
export async function getCRMAnalytics(tenantId) {
  try {
    // Get all clients for tenant
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId);

    if (clientsError) throw clientsError;

    // Get total revenue
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('total, created_at, client_id')
      .eq('tenant_id', tenantId);

    if (invoicesError) throw invoicesError;

    // Calculate analytics
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'active').length;
    const prospectClients = clients.filter(c => c.status === 'prospect').length;
    const totalRevenue = (invoices || []).reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    // Average satisfaction score
    const satisfactionScores = clients
      .filter(c => c.satisfaction_score)
      .map(c => c.satisfaction_score);
    const avgSatisfaction = satisfactionScores.length > 0 
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length 
      : 0;

    // Revenue by month (last 12 months)
    const revenueByMonth = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthRevenue = (invoices || [])
        .filter(inv => {
          const invDate = new Date(inv.created_at);
          return invDate >= monthStart && invDate <= monthEnd;
        })
        .reduce((sum, inv) => sum + (inv.total || 0), 0);

      revenueByMonth.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        revenue: monthRevenue
      });
    }

    // Top clients by revenue
    const clientRevenue = {};
    (invoices || []).forEach(inv => {
      if (inv.client_id) {
        clientRevenue[inv.client_id] = (clientRevenue[inv.client_id] || 0) + (inv.total || 0);
      }
    });

    const topClients = Object.entries(clientRevenue)
      .map(([clientId, revenue]) => {
        const client = clients.find(c => c.id === parseInt(clientId));
        return client ? { ...client, revenue } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      total_clients: totalClients,
      active_clients: activeClients,
      prospect_clients: prospectClients,
      total_revenue: totalRevenue,
      avg_satisfaction: Math.round(avgSatisfaction * 10) / 10,
      revenueByMonth,
      topClients,
      clientGrowth: calculateClientGrowth(clients),
      recentActivities: await getRecentActivities(tenantId)
    };
  } catch (error) {
    console.error('Error fetching CRM analytics:', error);
    throw error;
  }
}

// Helper function to calculate client growth
function calculateClientGrowth(clients) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const lastMonthClients = clients.filter(c => {
    const createdAt = new Date(c.created_at);
    return createdAt >= lastMonth && createdAt < thisMonth;
  }).length;

  const thisMonthClients = clients.filter(c => {
    const createdAt = new Date(c.created_at);
    return createdAt >= thisMonth;
  }).length;

  const growth = lastMonthClients > 0 
    ? ((thisMonthClients - lastMonthClients) / lastMonthClients) * 100 
    : 0;

  return {
    lastMonth: lastMonthClients,
    thisMonth: thisMonthClients,
    growthPercentage: Math.round(growth * 10) / 10
  };
}

// Get recent activities across all clients for a tenant
async function getRecentActivities(tenantId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .select(`
        *,
        client:clients(name, email)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}

// Get recent communications across all clients for a tenant
export async function getRecentCommunications(tenantId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('client_communications')
      .select(`
        *,
        client:clients(name, email, company)
      `)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent communications:', error);
    return [];
  }
}

// Client Status Management
export async function updateClientStatus(tenantId, clientId, status) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;

    // Log status change as activity
    await createClientActivity({
      tenant_id: tenantId,
      client_id: clientId,
      type: 'status_change',
      title: `Status changed to ${status}`,
      description: `Client status updated to ${status}`,
      date: new Date().toISOString(),
      outcome: 'completed'
    });

    return data;
  } catch (error) {
    console.error('Error updating client status:', error);
    throw error;
  }
}

// Client Tier Management
export async function updateClientTier(tenantId, clientId, tier) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ 
        tier,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;

    // Log tier change as activity
    await createClientActivity({
      tenant_id: tenantId,
      client_id: clientId,
      type: 'tier_change',
      title: `Tier changed to ${tier}`,
      description: `Client tier updated to ${tier}`,
      date: new Date().toISOString(),
      outcome: 'completed'
    });

    return data;
  } catch (error) {
    console.error('Error updating client tier:', error);
    throw error;
  }
}

// Client Satisfaction Management
export async function updateClientSatisfaction(tenantId, clientId, score, feedback = null) {
  try {
    const updates = { 
      satisfaction_score: score,
      updated_at: new Date().toISOString()
    };

    if (feedback) {
      updates.satisfaction_feedback = feedback;
    }

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;

    // Log satisfaction update as activity
    await createClientActivity({
      tenant_id: tenantId,
      client_id: clientId,
      type: 'satisfaction_update',
      title: `Satisfaction score updated to ${score}/10`,
      description: feedback ? `Score: ${score}/10. Feedback: ${feedback}` : `Satisfaction score updated to ${score}/10`,
      date: new Date().toISOString(),
      outcome: 'completed'
    });

    return data;
  } catch (error) {
    console.error('Error updating client satisfaction:', error);
    throw error;
  }
}

// Client Follow-up Reminders
export async function createFollowUpReminder(tenantId, clientId, reminderData) {
  try {
    const { data, error } = await supabase
      .from('client_reminders')
      .insert({
        tenant_id: tenantId,
        client_id: clientId,
        ...reminderData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating follow-up reminder:', error);
    throw error;
  }
}

export async function getClientReminders(clientId) {
  try {
    const { data, error } = await supabase
      .from('client_reminders')
      .select('*')
      .eq('client_id', clientId)
      .eq('completed', false)
      .order('reminder_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching client reminders:', error);
    throw error;
  }
}

// Client Search and Filtering
export function filterClients(clients, filters) {
  let filtered = [...clients];

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(client =>
      client.name.toLowerCase().includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm) ||
      (client.company && client.company.toLowerCase().includes(searchTerm)) ||
      (client.tags && client.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }

  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(client => client.status === filters.status);
  }

  if (filters.tier && filters.tier !== 'all') {
    filtered = filtered.filter(client => client.tier === filters.tier);
  }

  if (filters.satisfactionMin) {
    filtered = filtered.filter(client => 
      (client.satisfaction_score || 0) >= filters.satisfactionMin
    );
  }

  if (filters.revenueMin) {
    filtered = filtered.filter(client => 
      (client.total_revenue || 0) >= filters.revenueMin
    );
  }

  return filtered;
}

// CRM Dashboard Data
export async function getCRMDashboardData(tenantId) {
  try {
    const [analytics, recentClients, upcomingReminders] = await Promise.all([
      getCRMAnalytics(tenantId),
      getRecentClients(tenantId, 5),
      getUpcomingReminders(tenantId, 10)
    ]);

    return {
      analytics,
      recentClients,
      upcomingReminders
    };
  } catch (error) {
    console.error('Error fetching CRM dashboard data:', error);
    throw error;
  }
}

// Helper functions
async function getRecentClients(tenantId, limit = 5) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent clients:', error);
    return [];
  }
}

async function getUpcomingReminders(tenantId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('client_reminders')
      .select(`
        *,
        client:clients(name, email)
      `)
      .eq('tenant_id', tenantId)
      .eq('completed', false)
      .gte('reminder_date', new Date().toISOString())
      .order('reminder_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error);
    return [];
  }
}

// Activity Types
export const ACTIVITY_TYPES = {
  CALL: 'call',
  EMAIL: 'email',
  MEETING: 'meeting',
  NOTE: 'note',
  TASK: 'task',
  STATUS_CHANGE: 'status_change',
  TIER_CHANGE: 'tier_change',
  SATISFACTION_UPDATE: 'satisfaction_update'
};

// Client Statuses
export const CLIENT_STATUSES = {
  ACTIVE: 'active',
  PROSPECT: 'prospect',
  INACTIVE: 'inactive',
  LEAD: 'lead'
};

// Client Tiers
export const CLIENT_TIERS = {
  PREMIUM: 'premium',
  STANDARD: 'standard',
  BASIC: 'basic'
};

// Communication Preferences
export const COMMUNICATION_PREFERENCES = {
  EMAIL: 'email',
  PHONE: 'phone',
  SMS: 'sms',
  WHATSAPP: 'whatsapp'
};

export default {
  getCRMClients,
  getClientActivities,
  createClientActivity,
  updateClientActivity,
  deleteClientActivity,
  getClientCommunications,
  createClientCommunication,
  getRecentCommunications,
  getClientNotes,
  createClientNote,
  updateClientNote,
  deleteClientNote,
  addClientTag,
  removeClientTag,
  getCRMAnalytics,
  updateClientStatus,
  updateClientTier,
  updateClientSatisfaction,
  createFollowUpReminder,
  getClientReminders,
  filterClients,
  getCRMDashboardData,
  ACTIVITY_TYPES,
  CLIENT_STATUSES,
  CLIENT_TIERS,
  COMMUNICATION_PREFERENCES
};
