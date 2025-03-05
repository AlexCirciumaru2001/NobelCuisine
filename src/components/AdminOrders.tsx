import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Package, Clock, MapPin, Table2, AlertCircle, Phone, Trash2, Edit2, CreditCard, Wallet, User, ChevronDown, ChevronUp } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  preparation_time?: number;
}

interface OrderItem {
  quantity: number;
  menu_item: MenuItem;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  delivery_time: number | null;
  delivery_address: {
    table_number?: number;
    street?: string;
    city?: string;
    county?: string;
    phone?: string;
    notes?: string;
    payment_method?: 'cash' | 'card';
  };
  user_id: string;
  user_email: string;
  user_full_name: string | null;
  user_avatar_url: string | null;
  items: OrderItem[];
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDeliveryTime, setEditingDeliveryTime] = useState<{id: string, time: number} | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const { language } = useLanguage();

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('admin_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchOrders() {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          total,
          delivery_time,
          delivery_address,
          user_id,
          user:profiles!orders_user_id_fkey (
            email,
            full_name,
            avatar_url
          ),
          items:order_items (
            quantity,
            menu_item:menu_items (
              id,
              name,
              price,
              image_url,
              preparation_time
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedOrders = orders?.map(order => ({
        ...order,
        user_email: order.user?.email,
        user_full_name: order.user?.full_name,
        user_avatar_url: order.user?.avatar_url,
        items: order.items
          .filter(item => item.menu_item) // Filter out any null menu items
          .map(item => ({
            quantity: item.quantity,
            menu_item: {
              id: item.menu_item.id,
              name: item.menu_item.name,
              price: item.menu_item.price,
              image_url: item.menu_item.image_url,
              preparation_time: item.menu_item.preparation_time
            }
          }))
      })) || [];

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  }

  async function updateDeliveryTime(orderId: string, time: number) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_time: time })
        .eq('id', orderId);

      if (error) throw error;
      setEditingDeliveryTime(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating delivery time:', error);
    }
  }

  async function deleteOrder(orderId: string) {
    if (!window.confirm('Ești sigur că vrei să ștergi această comandă?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  }

  const handlePhoneClick = (e: React.MouseEvent, phone: string) => {
    if (window.innerWidth > 768) {
      e.preventDefault();
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-light mb-8">Administrare Comenzi</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Nu există comenzi</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Comandă #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString(
                      language === 'ro' ? 'ro-RO' : 'en-US',
                      {
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="p-2 rounded-full hover:bg-green-100 text-green-600"
                    title="Marchează ca finalizată"
                  >
                    <Package className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    className="p-2 rounded-full hover:bg-red-100 text-red-600"
                    title="Anulează comanda"
                  >
                    <AlertCircle className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="p-2 rounded-full hover:bg-red-100 text-red-600"
                    title="Șterge comanda"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    order.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'completed' ? 'Finalizată' :
                     order.status === 'processing' ? 'În procesare' :
                     order.status === 'cancelled' ? 'Anulată' : 'În așteptare'}
                  </span>
                </div>
              </div>

              {/* User Information */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {order.user_avatar_url ? (
                    <img
                      src={order.user_avatar_url}
                      alt={order.user_full_name || order.user_email}
                      className="h-10 w-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    {order.user_full_name && (
                      <h3 className="font-medium text-gray-900">{order.user_full_name}</h3>
                    )}
                    <p className="text-sm text-gray-600">{order.user_email}</p>
                  </div>
                </div>
              </div>

              {/* Order Items Section */}
              <div className="mb-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleOrderExpansion(order.id)}
                  className="w-full bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-900">
                      Produse Comandate ({order.items.length})
                    </h3>
                    <span className="ml-2 text-sm text-gray-500">
                      Total: {order.total} RON
                    </span>
                  </div>
                  {expandedOrders.has(order.id) ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedOrders.has(order.id) && (
                  <div className="divide-y divide-gray-200">
                    {order.items.map((item, index) => (
                      <div key={index} className="p-4 flex items-center">
                        <img
                          src={item.menu_item.image_url}
                          alt={item.menu_item.name}
                          className="w-16 h-16 object-cover rounded-lg mr-4"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.menu_item.name}</h4>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <span className="font-medium text-primary">
                              {item.quantity} x {item.menu_item.price} RON
                            </span>
                            <span className="mx-2">•</span>
                            <span>Total: {item.quantity * item.menu_item.price} RON</span>
                          </div>
                          {item.menu_item.preparation_time && (
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              Timp preparare: {item.menu_item.preparation_time} minute
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery Info Section */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {order.delivery_address.table_number ? (
                      <>
                        <Table2 className="h-5 w-5 text-primary mr-2" />
                        <span className="font-medium">
                          Masa {order.delivery_address.table_number}
                        </span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-5 w-5 text-primary mr-2" />
                        <div>
                          <span className="font-medium">Adresă Livrare:</span>
                          <p className="text-sm text-gray-600">{order.delivery_address.street}</p>
                          <p className="text-sm text-gray-600">
                            {order.delivery_address.city}, {order.delivery_address.county}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Phone Number with Call Button */}
                    {order.delivery_address.phone && (
                      <a
                        href={`tel:${order.delivery_address.phone}`}
                        onClick={(e) => handlePhoneClick(e, order.delivery_address.phone!)}
                        className="flex items-center text-primary hover:text-primary-dark transition-colors"
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        <span className="font-medium">{order.delivery_address.phone}</span>
                      </a>
                    )}
                    {/* Payment Method */}
                    <div className="flex items-center text-gray-600">
                      {order.delivery_address.payment_method === 'card' ? (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          <span>Card</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="h-5 w-5 mr-2" />
                          <span>Cash</span>
                        </>
                      )}
                    </div>
                    {/* Delivery Time */}
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-primary mr-2" />
                      {editingDeliveryTime?.id === order.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editingDeliveryTime.time}
                            onChange={(e) => setEditingDeliveryTime({
                              ...editingDeliveryTime,
                              time: parseInt(e.target.value) || 0
                            })}
                            className="w-20 p-1 border rounded"
                            min="1"
                            max="120"
                          />
                          <span className="text-sm text-gray-600">minute</span>
                          <button
                            onClick={() => updateDeliveryTime(order.id, editingDeliveryTime.time)}
                            className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark"
                          >
                            Salvează
                          </button>
                          <button
                            onClick={() => setEditingDeliveryTime(null)}
                            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Anulează
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-primary font-medium">
                            {order.delivery_time || 0} minute
                          </span>
                          <button
                            onClick={() => setEditingDeliveryTime({ 
                              id: order.id, 
                              time: order.delivery_time || 30 
                            })}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            title="Editează timpul"
                          >
                            <Edit2 className="h-4 w-4 text-primary" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {order.delivery_address.notes && (
                  <p className="text-sm text-gray-600 mt-2">
                    Note: {order.delivery_address.notes}
                  </p>
                )}
              </div>

              {/* Order Total */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total Comandă</span>
                  <span className="font-semibold text-lg text-primary">{order.total} RON</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}