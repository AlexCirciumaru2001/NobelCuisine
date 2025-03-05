import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X, Minus, Plus, Utensils, LogIn } from 'lucide-react';
import { CartItem, MenuItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Generate or retrieve a session ID for guest users
  const getSessionId = () => {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID(); // Generate a unique ID
      localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  // Fetch cart items for the current user or guest session
  useEffect(() => {
    if (isOpen) {
      fetchCartItems();
    }
  }, [isOpen, user]);

  async function fetchCartItems() {
    setLoading(true);
    try {
      let cartId;
      const cartIdentifier = user ? { user_id: user.id } : { session_id: getSessionId() };

      // Fetch the cart for the logged-in user or guest session
      const { data: carts } = await supabase
        .from('carts')
        .select('id')
        .match(cartIdentifier) // Use user_id or session_id
        .eq('status', 'active')
        .limit(1);

      if (!carts || carts.length === 0) {
        // Create a new cart for the user or guest
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ status: 'active', ...cartIdentifier }) // Include user_id or session_id
          .select('id')
          .single();
        cartId = newCart?.id;
      } else {
        cartId = carts[0].id;
      }

      if (cartId) {
        const { data: items } = await supabase
          .from('cart_items')
          .select(`
            id,
            quantity,
            menu_items (
              id,
              name,
              price,
              image_url
            )
          `)
          .eq('cart_id', cartId);

        // Map the data to match the CartItem type
        const formattedItems: CartItem[] = (items || []).map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          menu_items: item.menu_items[0], // Ensure menu_items is a single object, not an array
        }));

        setCartItems(formattedItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }

  // Update the quantity of an item in the cart
  async function updateQuantity(itemId: string, newQuantity: number) {
    if (newQuantity < 1) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
    } else {
      await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);
    }
    fetchCartItems();
  }

  // Merge guest cart with user cart upon login
  const mergeCarts = async (sessionId: string, userId: string) => {
    const { data: guestCart } = await supabase
      .from('carts')
      .select('id')
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .single();

    if (guestCart) {
      const { data: userCart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (userCart) {
        // Merge guest cart items into user cart
        await supabase
          .from('cart_items')
          .update({ cart_id: userCart.id })
          .eq('cart_id', guestCart.id);

        // Delete the guest cart
        await supabase
          .from('carts')
          .delete()
          .eq('id', guestCart.id);
      } else {
        // Convert guest cart to user cart
        await supabase
          .from('carts')
          .update({ user_id: userId, session_id: null })
          .eq('id', guestCart.id);
      }
    }
  };

  // Handle login and merge guest cart with user cart
  const handleLogin = () => {
    navigate('/login', {
      state: { fromCart: true }, // Pass a flag to indicate the user is coming from the cart
    });
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!user) {
      navigate('/login', {
        state: { fromCart: true }, // Pass a flag to indicate the user is coming from the cart
      });
      return;
    }
    navigate('/checkout');
    onClose();
  };

  // Calculate the total price of items in the cart
  const total = cartItems.reduce((sum, item) => {
    return sum + (item.menu_items?.price || 0) * item.quantity;
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#f8f5f2] shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-amber-200 bg-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Utensils className="h-6 w-6 text-primary mr-2" />
                <h2 className="text-2xl font-light">{t('cart.title')}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 font-light">{t('cart.empty')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#8B4513]/10 rounded-lg p-4 shadow-inner">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm mb-4 border border-amber-100"
                    >
                      <img
                        src={item.menu_items?.image_url}
                        alt={item.menu_items?.name}
                        className="w-20 h-20 object-cover rounded-lg shadow-md"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{item.menu_items?.name}</h3>
                        <p className="text-primary font-semibold">
                          {item.menu_items?.price} RON
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-primary/10 text-primary transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-primary/10 text-primary transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-amber-200 bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-light">{t('cart.total')}</span>
              <span className="text-2xl font-semibold text-primary">{total} RON</span>
            </div>
            {!user && (
              <button
                onClick={handleLogin}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light mb-4"
              >
                <LogIn className="h-5 w-5 inline-block mr-2" />
                {t('cart.login')}
              </button>
            )}
            <button
              onClick={handleCheckout}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light"
              disabled={cartItems.length === 0}
            >
              {user ? t('cart.checkout') : t('cart.login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}