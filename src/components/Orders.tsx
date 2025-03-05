import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { Package, Clock, MapPin, Table2, AlertCircle, Phone, ChevronDown, ChevronUp, CreditCard, Wallet } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  preparation_time?: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
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
  items: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (user) {
      fetchOrders();

      // Subscribe to real-time updates
      const subscription = supabase
        .channel('orders_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  // Fetch orders and their items in a single query
  async function fetchOrders() {
    setLoading(true);

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          total,
          delivery_time,
          delivery_address,
          order_items (
            id,
            quantity,
            price,
            menu_items (
              id,
              name,
              price,
              image_url,
              preparation_time
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Map orders with their items
      const ordersWithItems = ordersData.map((order) => ({
        ...order,
        items: (order.order_items || [])
          .filter((item) => item && item.menu_items) // Ensure both item and menu_items exist
          .map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            menu_item: item.menu_items,
          })),
      }));

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Optionally, show a user-friendly error message here
    } finally {
      setLoading(false);
    }
  }

  // Toggle expanded state for an order
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Loading state with skeleton loader
  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-light mb-8">{t('orders.title')}</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">{t('orders.empty')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
              {/* Order Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {t('orders.number')} #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString(
                      language === 'ro' ? 'ro-RO' : 'en-US',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </p>
                </div>
                <div className="flex items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm flex items-center ${
                      order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {order.status === 'completed' ? (
                      t('orders.status.completed')
                    ) : order.status === 'processing' ? (
                      <>
                        <Clock className="h-4 w-4 mr-1 animate-spin" />
                        {t('orders.status.processing')}
                      </>
                    ) : order.status === 'cancelled' ? (
                      <>
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {t('orders.status.cancelled')}
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-1" />
                        {t('orders.status.pending')}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Order Items Section */}
              <div className="mb-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleOrderExpansion(order.id)}
                  aria-label={expandedOrders.has(order.id) ? 'Collapse order details' : 'Expand order details'}
                  aria-expanded={expandedOrders.has(order.id)}
                  className="w-full bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-900">
                      {t('orders.items')} ({order.items?.length || 0})
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
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item) => (
                        <div key={item.id} className="p-4 flex items-center">
                          <img
                            src={item.menu_item.image_url || 'https://via.placeholder.com/64'}
                            alt={item.menu_item.name || 'Item'}
                            className="w-16 h-16 object-cover rounded-lg mr-4"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.menu_item.name}</h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <span className="font-medium text-primary">
                                {item.quantity} x {item.price} RON
                              </span>
                              <span className="mx-2">•</span>
                              <span>Total: {item.quantity * item.price} RON</span>
                            </div>
                            {item.menu_item.preparation_time && (
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Clock className="h-4 w-4 mr-1" />
                                {t('orders.preparation')}: {item.menu_item.preparation_time}{' '}
                                {t('orders.delivery.time')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 p-4">{t('orders.no_items')}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {order.delivery_address?.table_number ? (
                      <>
                        <Table2 className="h-5 w-5 text-primary mr-2" />
                        <span className="font-medium">
                          {t('orders.delivery.table')} {order.delivery_address.table_number}
                        </span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-5 w-5 text-primary mr-2" />
                        <div>
                          <span className="font-medium">{t('orders.delivery.address')}:</span>
                          <p className="text-sm text-gray-600">{order.delivery_address?.street || 'N/A'}</p>
                          <p className="text-sm text-gray-600">
                            {order.delivery_address?.city || 'N/A'}, {order.delivery_address?.county || 'N/A'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Phone Number */}
                    {order.delivery_address?.phone && (
                      <a
                        href={`tel:${order.delivery_address.phone}`}
                        className="flex items-center text-primary hover:text-primary-dark transition-colors"
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        <span className="font-medium">{order.delivery_address.phone}</span>
                      </a>
                    )}
                    {/* Payment Method */}
                    <div className="flex items-center text-gray-600">
                      {order.delivery_address?.payment_method === 'card' ? (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          <span>{t('orders.payment.card')}</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="h-5 w-5 mr-2" />
                          <span>{t('orders.payment.cash')}</span>
                        </>
                      )}
                    </div>
                    {/* Delivery Time */}
                    {order.delivery_time && (
                      <div className="flex items-center text-primary">
                        <Clock className="h-5 w-5 mr-2" />
                        <span className="font-medium">
                          {order.delivery_time} {t('orders.delivery.time')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {order.delivery_address?.notes && (
                  <p className="text-sm text-gray-600 mt-2">
                    {t('orders.notes')}: {order.delivery_address.notes}
                  </p>
                )}
              </div>

              {/* Order Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold">{t('cart.total')}</span>
                  <span className="font-semibold">{order.total} RON</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}