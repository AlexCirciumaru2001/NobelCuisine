import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MenuItem } from '../types';
import { Plus, Edit, Trash2, X, Clock, AlertTriangle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  display_name: string;
}

export default function AdminPanel() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [showDeleted, setShowDeleted] = useState(false);
  const [categories] = useState<Category[]>([
    { id: 'starter', name: 'Starter', display_name: 'Starter' },
    { id: 'carne', name: 'Carne', display_name: 'Carne' },
    { id: 'din-gradina', name: 'Din Grădină', display_name: 'Din Grădină' },
    { id: 'supe-creme', name: 'Supe și Creme', display_name: 'Supe și Creme' },
    { id: 'copii', name: 'Pentru Cei Mici', display_name: 'Pentru Cei Mici' },
    { id: 'fainoase', name: 'Făinoase', display_name: 'Făinoase' },
    { id: 'dulce', name: 'Dulce', display_name: 'Dulce' }
  ]);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'starter',
    image_url: '',
    ingredients: [''],
    preparation_time: 15
  });

  useEffect(() => {
    fetchMenuItems();
  }, [showDeleted]);

  async function fetchMenuItems() {
    let query = supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (!showDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching menu items:', error);
      return;
    }

    setItems(data);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('menu_items').insert([{
      ...newItem,
      ingredients: newItem.ingredients.filter(i => i.trim() !== '')
    }]);

    if (error) {
      console.error('Error adding item:', error);
      return;
    }

    setNewItem({
      name: '',
      description: '',
      price: 0,
      category: 'starter',
      image_url: '',
      ingredients: [''],
      preparation_time: 15
    });
    fetchMenuItems();
  }

  async function handleUpdateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    const { error } = await supabase
      .from('menu_items')
      .update({
        ...editingItem,
        ingredients: editingItem.ingredients.filter(i => i.trim() !== '')
      })
      .eq('id', editingItem.id);

    if (error) {
      console.error('Error updating item:', error);
      return;
    }

    setEditingItem(null);
    fetchMenuItems();
  }

  async function handleDeleteItem(id: string) {
    const { error } = await supabase
      .rpc('soft_delete_menu_item', { item_id: id });

    if (error) {
      console.error('Error deleting item:', error);
      return;
    }

    fetchMenuItems();
  }

  async function handleRestoreItem(id: string) {
    const { error } = await supabase
      .from('menu_items')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) {
      console.error('Error restoring item:', error);
      return;
    }

    fetchMenuItems();
  }

  const handleAddIngredient = (isEditing: boolean) => {
    if (isEditing && editingItem) {
      setEditingItem({
        ...editingItem,
        ingredients: [...(editingItem.ingredients || []), '']
      });
    } else {
      setNewItem({
        ...newItem,
        ingredients: [...newItem.ingredients, '']
      });
    }
  };

  const handleRemoveIngredient = (index: number, isEditing: boolean) => {
    if (isEditing && editingItem) {
      const newIngredients = editingItem.ingredients.filter((_, i) => i !== index);
      setEditingItem({
        ...editingItem,
        ingredients: newIngredients
      });
    } else {
      const newIngredients = newItem.ingredients.filter((_, i) => i !== index);
      setNewItem({
        ...newItem,
        ingredients: newIngredients
      });
    }
  };

  const handleIngredientChange = (index: number, value: string, isEditing: boolean) => {
    if (isEditing && editingItem) {
      const newIngredients = [...editingItem.ingredients];
      newIngredients[index] = value;
      setEditingItem({
        ...editingItem,
        ingredients: newIngredients
      });
    } else {
      const newIngredients = [...newItem.ingredients];
      newIngredients[index] = value;
      setNewItem({
        ...newItem,
        ingredients: newIngredients
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-light">Admin Panel</h1>
        <button
          onClick={() => setShowDeleted(!showDeleted)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            showDeleted
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {showDeleted ? 'Ascunde Produse Șterse' : 'Arată Produse Șterse'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'items'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-primary-light hover:text-white'
          }`}
        >
          Produse
        </button>
      </div>

      {activeTab === 'items' && (
        <>
          {/* Add New Item Form */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Adaugă Produs Nou</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nume"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Preț"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="URL Imagine"
                  value={newItem.image_url}
                  onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                  className="border p-2 rounded"
                />
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="border p-2 rounded"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.display_name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    placeholder="Timp de preparare (minute)"
                    value={newItem.preparation_time}
                    onChange={(e) => setNewItem({ ...newItem, preparation_time: Number(e.target.value) })}
                    className="border p-2 rounded flex-1"
                    min="1"
                    max="120"
                  />
                </div>
              </div>
              <textarea
                placeholder="Descriere"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="border p-2 rounded w-full"
              />
              
              {/* Ingredients Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Ingrediente</h3>
                  <button
                    type="button"
                    onClick={() => handleAddIngredient(false)}
                    className="text-primary hover:text-primary-dark"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {newItem.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => handleIngredientChange(index, e.target.value, false)}
                      placeholder="Ingredient"
                      className="border p-2 rounded flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index, false)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <button type="submit" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors">
                <Plus className="inline-block mr-2 h-4 w-4" />
                Adaugă Produs
              </button>
            </form>
          </div>

          {/* Menu Items List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Produse</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className={`border p-4 rounded flex justify-between items-start ${
                  item.deleted_at ? 'bg-red-50 border-red-200' : ''
                }`}>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.deleted_at && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Șters
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">{item.description}</p>
                    <div className="mt-2">
                      <h4 className="font-medium text-sm text-gray-700">Ingrediente:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {item.ingredients?.map((ingredient, index) => (
                          <li key={index}>{ingredient}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Categorie: {categories.find(c => c.id === item.category)?.display_name} | Preț: {item.price} RON
                    </p>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      Timp de preparare: {item.preparation_time || 15} minute
                    </p>
                  </div>
                  <div className="space-x-2">
                    {item.deleted_at ? (
                      <button
                        onClick={() => handleRestoreItem(item.id)}
                        className="text-primary hover:text-primary-dark"
                        title="Restaurează produsul"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Editează Produs</h2>
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nume"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Preț"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="URL Imagine"
                  value={editingItem.image_url}
                  onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                  className="border p-2 rounded"
                />
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="border p-2 rounded"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.display_name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    placeholder="Timp de preparare (minute)"
                    value={editingItem.preparation_time || 15}
                    onChange={(e) => setEditingItem({ ...editingItem, preparation_time: Number(e.target.value) })}
                    className="border p-2 rounded flex-1"
                    min="1"
                    max="120"
                  />
                </div>
              </div>
              <textarea
                placeholder="Descriere"
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="border p-2 rounded w-full"
              />

              {/* Edit Ingredients Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Ingrediente</h3>
                  <button
                    type="button"
                    onClick={() => handleAddIngredient(true)}
                    className="text-primary hover:text-primary-dark"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {editingItem.ingredients?.map((ingredient, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => handleIngredientChange(index, e.target.value, true)}
                      placeholder="Ingredient"
                      className="border p-2 rounded flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index, true)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                >
                  Salvează
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}