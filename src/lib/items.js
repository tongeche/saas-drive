import supabase from './supabase';

/**
 * Create a new item for a tenant
 */
export async function createItem(tenant_id, itemData) {
  if (!tenant_id) throw new Error("Missing tenant_id");
  
  const payload = {
    tenant_id,
    name: itemData.name || '',
    description: itemData.description || null,
    unit: itemData.unit || 'each',
    unit_price: Number(itemData.unit_price) || 0,
    tax_rate: Number(itemData.tax_rate) || 0,
    category: itemData.category || null,
    sku: itemData.sku || null,
    is_active: itemData.is_active !== undefined ? itemData.is_active : true
  };
  
  const { data, error } = await supabase
    .from('items')
    .insert(payload)
    .select('*')
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * List all items for a tenant
 */
export async function listItems(tenant_id, options = {}) {
  if (!tenant_id) throw new Error("Missing tenant_id");
  
  let query = supabase
    .from('items')
    .select('*')
    .eq('tenant_id', tenant_id);
    
  if (options.active_only !== false) {
    query = query.eq('is_active', true);
  }
  
  if (options.category) {
    query = query.eq('category', options.category);
  }
  
  query = query.order('name');
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get a single item
 */
export async function getItem(item_id) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', item_id)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Update an item
 */
export async function updateItem(item_id, updates) {
  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', item_id)
    .select('*')
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Delete an item (soft delete by setting is_active = false)
 */
export async function deleteItem(item_id, soft = true) {
  if (soft) {
    return updateItem(item_id, { is_active: false });
  } else {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', item_id);
      
    if (error) throw error;
    return true;
  }
}

/**
 * Get unique categories for a tenant
 */
export async function getItemCategories(tenant_id) {
  if (!tenant_id) throw new Error("Missing tenant_id");
  
  const { data, error } = await supabase
    .from('items')
    .select('category')
    .eq('tenant_id', tenant_id)
    .eq('is_active', true)
    .not('category', 'is', null);
    
  if (error) throw error;
  
  // Get unique categories
  const categories = [...new Set((data || []).map(item => item.category))];
  return categories.filter(Boolean).sort();
}
