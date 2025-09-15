import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { 
  listItems, 
  deleteItem, 
  updateItem, 
  getItemCategories 
} from "../lib/items";

export default function ManageItems() {
  const { tenant } = useOutletContext() || {};
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Load items and categories
  useEffect(() => {
    if (!tenant?.id) return;
    loadItems();
    loadCategories();
  }, [tenant?.id, showInactive, selectedCategory]);

  async function loadItems() {
    try {
      setLoading(true);
      setError("");
      const data = await listItems(tenant.id, {
        active_only: !showInactive,
        category: selectedCategory || undefined
      });
      setItems(data);
    } catch (err) {
      setError(`Failed to load items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      if (!tenant?.id) return;
      const data = await getItemCategories(tenant.id);
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  // Filter items based on search term
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle item deletion
  async function handleDelete(itemId, itemName) {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;
    
    try {
      await deleteItem(itemId, true); // soft delete
      await loadItems();
      setSelectedItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    } catch (err) {
      setError(`Failed to delete item: ${err.message}`);
    }
  }

  // Handle item activation/deactivation
  async function handleToggleActive(itemId, isActive) {
    try {
      await updateItem(itemId, { is_active: !isActive });
      await loadItems();
    } catch (err) {
      setError(`Failed to update item: ${err.message}`);
    }
  }

  // Handle inline editing
  function startEdit(item) {
    setEditingId(item.id);
    setEditData({
      name: item.name,
      description: item.description || "",
      unit_of_measurement: item.unit_of_measurement,
      default_price: item.default_price,
      tax_rate: item.tax_rate,
      category: item.category || "",
      sku: item.sku || "",
      is_service: item.is_service || false
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({});
  }

  async function saveEdit() {
    try {
      await updateItem(editingId, editData);
      setEditingId(null);
      setEditData({});
      await loadItems();
    } catch (err) {
      setError(`Failed to update item: ${err.message}`);
    }
  }

  // Handle bulk operations
  function toggleSelectAll() {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  }

  function toggleSelectItem(itemId) {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  async function handleBulkDelete() {
    if (selectedItems.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} selected items?`)) return;
    
    try {
      await Promise.all([...selectedItems].map(id => deleteItem(id, true)));
      await loadItems();
      setSelectedItems(new Set());
    } catch (err) {
      setError(`Failed to delete items: ${err.message}`);
    }
  }

  async function handleBulkToggleActive(activate) {
    if (selectedItems.size === 0) return;
    
    try {
      await Promise.all([...selectedItems].map(id => updateItem(id, { is_active: activate })));
      await loadItems();
      setSelectedItems(new Set());
    } catch (err) {
      setError(`Failed to update items: ${err.message}`);
    }
  }

  if (!tenant) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Please select a tenant to manage items.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Items</h1>
            <p className="text-gray-600">Manage your product and service catalog</p>
          </div>
          <Link 
            to="/app/items/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Item
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show inactive items</span>
              </label>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadItems}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-medium">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkToggleActive(true)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkToggleActive(false)}
                  className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                >
                  Deactivate
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory ? "Try adjusting your filters" : "Get started by adding your first item"}
          </p>
          <Link 
            to="/app/items/new"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Item
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${!item.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          placeholder="Item name"
                        />
                        <textarea
                          value={editData.description}
                          onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          placeholder="Description"
                          rows="2"
                        />
                        {item.sku && (
                          <input
                            type="text"
                            value={editData.sku}
                            onChange={(e) => setEditData(prev => ({ ...prev, sku: e.target.value }))}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            placeholder="SKU"
                          />
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500">{item.description}</div>
                        )}
                        {item.sku && (
                          <div className="text-xs text-gray-400">SKU: {item.sku}</div>
                        )}
                        {item.is_service && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                            Service
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editData.category}
                        onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="Category"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {item.category || <span className="text-gray-400">No category</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editData.default_price}
                        onChange={(e) => setEditData(prev => ({ ...prev, default_price: parseFloat(e.target.value) || 0 }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="Price"
                        step="0.01"
                        min="0"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {new Intl.NumberFormat('en-US', { 
                          style: 'currency', 
                          currency: 'USD' 
                        }).format(item.default_price || 0)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <select
                        value={editData.unit_of_measurement}
                        onChange={(e) => setEditData(prev => ({ ...prev, unit_of_measurement: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="each">Each</option>
                        <option value="hour">Hour</option>
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="kg">Kilogram</option>
                        <option value="lbs">Pounds</option>
                        <option value="liter">Liter</option>
                        <option value="gallon">Gallon</option>
                        <option value="meter">Meter</option>
                        <option value="foot">Foot</option>
                        <option value="piece">Piece</option>
                        <option value="box">Box</option>
                        <option value="pack">Pack</option>
                      </select>
                    ) : (
                      <div className="text-sm text-gray-900 capitalize">
                        {item.unit_of_measurement || 'each'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-600 text-white px-2 py-1 rounded text-sm hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(item.id, item.is_active)}
                          className={`text-sm ${
                            item.is_active 
                              ? 'text-yellow-600 hover:text-yellow-700' 
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {item.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{items.length}</div>
          <div className="text-sm text-gray-500">Total Items</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {items.filter(item => item.is_active).length}
          </div>
          <div className="text-sm text-gray-500">Active Items</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
          <div className="text-sm text-gray-500">Categories</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {items.filter(item => item.is_service).length}
          </div>
          <div className="text-sm text-gray-500">Services</div>
        </div>
      </div>
    </div>
  );
}