import supabase from './supabase.js';

// Get all cashflow transactions for a tenant
export async function getCashflowTransactions(tenantId, filters = {}) {
  try {
    let query = supabase
      .from('cashflow')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('transaction_date', { ascending: false });

    // Apply filters
    if (filters.type) {
      query = query.eq('transaction_type', filters.type);
    }
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('transaction_date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching cashflow transactions:', error);
    throw error;
  }
}

// Create a new cashflow transaction
export async function createCashflowTransaction(transaction) {
  try {
    const { data, error } = await supabase
      .from('cashflow')
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating cashflow transaction:', error);
    throw error;
  }
}

// Update a cashflow transaction
export async function updateCashflowTransaction(id, updates) {
  try {
    const { data, error } = await supabase
      .from('cashflow')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating cashflow transaction:', error);
    throw error;
  }
}

// Delete a cashflow transaction
export async function deleteCashflowTransaction(id) {
  try {
    const { error } = await supabase
      .from('cashflow')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting cashflow transaction:', error);
    throw error;
  }
}

// Get cashflow summary for a tenant
export async function getCashflowSummary(tenantId, period = 'month') {
  try {
    const { data, error } = await supabase
      .from('cashflow_monthly_summary')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('month', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching cashflow summary:', error);
    throw error;
  }
}

// Get cashflow balance (total cash in - total cash out)
export async function getCashflowBalance(tenantId, currency = 'EUR') {
  try {
    const { data, error } = await supabase
      .from('cashflow')
      .select('transaction_type, amount')
      .eq('tenant_id', tenantId)
      .eq('currency', currency);

    if (error) throw error;

    const balance = data.reduce((acc, transaction) => {
      if (transaction.transaction_type === 'cash_in') {
        return acc + parseFloat(transaction.amount);
      } else {
        return acc - parseFloat(transaction.amount);
      }
    }, 0);

    return balance;
  } catch (error) {
    console.error('Error calculating cashflow balance:', error);
    throw error;
  }
}

// Get cashflow categories (distinct categories used)
export async function getCashflowCategories(tenantId) {
  try {
    const { data, error } = await supabase
      .from('cashflow')
      .select('category')
      .eq('tenant_id', tenantId)
      .not('category', 'is', null);

    if (error) throw error;

    // Extract unique categories
    const categories = [...new Set(data.map(item => item.category))].filter(Boolean);
    return categories;
  } catch (error) {
    console.error('Error fetching cashflow categories:', error);
    throw error;
  }
}

// Common cashflow categories
export const defaultCashflowCategories = {
  cash_in: [
    'Sales Revenue',
    'Service Income',
    'Investment',
    'Loan Received',
    'Refund Received',
    'Interest Earned',
    'Other Income'
  ],
  cash_out: [
    'Office Supplies',
    'Marketing',
    'Travel',
    'Utilities',
    'Rent',
    'Salaries',
    'Equipment',
    'Insurance',
    'Taxes',
    'Loan Payment',
    'Other Expenses'
  ]
};
