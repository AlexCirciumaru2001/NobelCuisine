import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, CreditCard, Clock, Table2, AlertCircle, Phone } from 'lucide-react';

interface CheckoutFormData {
  street: string;
  city: string;
  county: string;
  phone: string;
  notes: string;
  tableNumber: number | null;
  isTableOrder: boolean;
  payment_method: 'cash' | 'card';
}

export default function Checkout() {
  const [formData, setFormData] = useState<CheckoutFormData>({
    street: '',
    city: '',
    county: '',
    phone: '',
    notes: '',
    tableNumber: null,
    isTableOrder: false,
    payment_method: 'cash'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'tableNumber' ? (value ? parseInt(value) : null) : value 
    }));
  };

  const toggleOrderType = (isTable: boolean) => {
    setFormData(prev => ({
      ...prev,
      isTableOrder: isTable,
      tableNumber: isTable ? prev.tableNumber : null,
      street: !isTable ? prev.street : '',
      city: !isTable ? prev.city : '',
      county: !isTable ? prev.county : '',
    }));
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^(\+4|)?(07[0-8]{1}[0-9]{1}|02[0-9]{2}|03[0-9]{2}){1}?(\s|\.|\-)?([0-9]{3}(\s|\.|\-|)){2}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate phone number
    if (!validatePhoneNumber(formData.phone)) {
      setError(t('checkout.errors.phone'));
      setLoading(false);
      return;
    }

    try {
      // Get active cart with items
      const { data: cart } = await supabase
        .from('carts')
        .select(`
          id,
          cart_items (
            quantity,
            menu_items (
              id,
              name,
              price,
              preparation_time
            )
          )
        `)
        .eq('status', 'active')
        .single();

      if (!cart || !cart.cart_items?.length) {
        throw new Error(t('checkout.errors.emptyCart'));
      }

      // Calculate total preparation time
      const totalPrepTime = cart.cart_items.reduce((total, item) => {
        return Math.max(total, item.menu_items?.preparation_time || 15);
      }, 0);

      // Calculate total
      const total = cart.cart_items.reduce((sum, item) => {
        return sum + (item.menu_items?.price || 0) * item.quantity;
      }, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          status: 'pending',
          total,
          delivery_time: totalPrepTime,
          delivery_address: formData.isTableOrder ? {
            table_number: formData.tableNumber,
            notes: formData.notes,
            phone: formData.phone,
            payment_method: formData.payment_method
          } : {
            street: formData.street,
            city: formData.city,
            county: formData.county,
            phone: formData.phone,
            notes: formData.notes,
            payment_method: formData.payment_method
          }
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Move items from cart to order
      const orderItems = cart.cart_items
        .filter(item => item.menu_items?.id) // Ensure menu_item_id exists
        .map(item => ({
          order_id: order.id,
          menu_item_id: item.menu_items.id,
          quantity: item.quantity,
          price: item.menu_items.price
        }));

      if (orderItems.length === 0) {
        throw new Error(t('checkout.errors.invalidItems'));
      }

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await supabase
        .from('carts')
        .update({ status: 'completed' })
        .eq('id', cart.id);

      // Redirect to success page
      navigate('/order-success');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checkout.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-light mb-8">{t('checkout.title')}</h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Type Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{t('checkout.orderType.title')}</h2>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => toggleOrderType(true)}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                formData.isTableOrder
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <Table2 className="h-6 w-6 mx-auto mb-2" />
              <span className="block text-sm font-medium">{t('checkout.orderType.table')}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleOrderType(false)}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                !formData.isTableOrder
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <MapPin className="h-6 w-6 mx-auto mb-2" />
              <span className="block text-sm font-medium">{t('checkout.orderType.delivery')}</span>
            </button>
          </div>
        </div>

        {/* Phone Number Section - Required for both order types */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <Phone className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-xl font-semibold">{t('checkout.phone.title')}</h2>
          </div>
          <div className="space-y-2">
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              placeholder={t('checkout.phone.placeholder')}
              className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
            />
            <p className="text-sm text-gray-500">{t('checkout.phone.help')}</p>
          </div>
        </div>

        {formData.isTableOrder ? (
          // Table Selection
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <Table2 className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-xl font-semibold">{t('checkout.table.title')}</h2>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((tableNum) => (
                <button
                  key={tableNum}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tableNumber: tableNum }))}
                  className={`aspect-square rounded-lg border-2 flex items-center justify-center text-lg font-medium transition-colors ${
                    formData.tableNumber === tableNum
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  {tableNum}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Delivery Address
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-xl font-semibold">{t('checkout.delivery.title')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('checkout.delivery.street')}
                </label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  required={!formData.isTableOrder}
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('checkout.delivery.city')}
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required={!formData.isTableOrder}
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('checkout.delivery.county')}
                </label>
                <input
                  type="text"
                  id="county"
                  name="county"
                  required={!formData.isTableOrder}
                  value={formData.county}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            {t(formData.isTableOrder ? 'checkout.notes.kitchen' : 'checkout.notes.delivery')}
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
            placeholder={t(formData.isTableOrder ? 'checkout.notes.kitchenPlaceholder' : 'checkout.notes.deliveryPlaceholder')}
          />
        </div>

        {/* Preparation Time Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-xl font-semibold">
              {t(formData.isTableOrder ? 'checkout.time.preparation' : 'checkout.time.delivery')}
            </h2>
          </div>
          <p className="text-gray-600">
            {t(formData.isTableOrder ? 'checkout.time.preparationInfo' : 'checkout.time.deliveryInfo')}
          </p>
        </div>

        {/* Payment Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <CreditCard className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-xl font-semibold">{t('checkout.payment.title')}</h2>
          </div>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="payment_method"
                value="cash"
                checked={formData.payment_method === 'cash'}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as 'cash' | 'card' }))}
                className="text-primary focus:ring-primary"
              />
              <span>
                {t(formData.isTableOrder ? 'checkout.payment.cashTable' : 'checkout.payment.cashDelivery')}
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="payment_method"
                value="card"
                checked={formData.payment_method === 'card'}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as 'cash' | 'card' }))}
                className="text-primary focus:ring-primary"
              />
              <span>
                {t(formData.isTableOrder ? 'checkout.payment.cardTable' : 'checkout.payment.cardDelivery')}
              </span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || (formData.isTableOrder && !formData.tableNumber)}
          className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
              {t('checkout.processing')}
            </span>
          ) : (
            t('checkout.submit')
          )}
        </button>
      </form>
    </div>
  );
}