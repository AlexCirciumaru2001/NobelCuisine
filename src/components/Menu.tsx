import React, { useState, useEffect } from 'react';
import { supabase, getConnectionStatus } from '../lib/supabase';
import { MenuItem } from '../types';
import { Search, Utensils, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ProductDetails from './ProductDetails';

interface FloatingItem {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('starter');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(getConnectionStatus().isConnected);
  const { t } = useLanguage();

  const categories = [
    { id: 'starter', name: 'categories.starter' },
    { id: 'carne', name: 'categories.carne' },
    { id: 'din-gradina', name: 'categories.din-gradina' },
    { id: 'supe-creme', name: 'categories.supe-creme' },
    { id: 'copii', name: 'categories.copii' },
    { id: 'fainoase', name: 'categories.fainoase' },
    { id: 'dulce', name: 'categories.dulce' },
  ];

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const checkAndFetch = async () => {
      if (!mounted) return;

      try {
        const connected = await getConnectionStatus().checkConnection();
        if (!mounted) return;

        setIsConnected(connected);
        if (connected) {
          await fetchMenuItems();
        } else {
          setLoading(false);
          setError(t('errors.connection'));
          // Retry after 3 seconds
          retryTimeout = setTimeout(checkAndFetch, 3000);
        }
      } catch (err) {
        if (!mounted) return;
        setLoading(false);
        setError(t('errors.connection'));
      }
    };

    checkAndFetch();

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [t]);

  useEffect(() => {
    if (isConnected) {
      fetchMenuItems();
    }
    setIsImageVisible(true);
  }, [activeCategory, searchQuery, isConnected]);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const connected = await getConnectionStatus().checkConnection();
      if (connected) {
        await fetchMenuItems();
      } else {
        setError(t('errors.connection'));
      }
    } catch (err) {
      setError(t('errors.connection'));
    } finally {
      setLoading(false);
    }
  };

  async function fetchMenuItems() {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      let query = supabase
        .from('menu_items')
        .select('*')
        .is('deleted_at', null);

      if (searchQuery) {
        const matchedCategory = categories.find(cat => {
          const translatedName = t(cat.name).toLowerCase();
          return translatedName.includes(searchQuery.toLowerCase());
        });

        if (matchedCategory) {
          query = query.eq('category', matchedCategory.id);
        } else {
          query = query.ilike('name', `%${searchQuery}%`);
        }
      } else {
        query = query.eq('category', activeCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      setItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setError(t('errors.loadingProducts'));
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(menuItem: MenuItem, event: React.MouseEvent<HTMLButtonElement>) {
    try {
      const button = event.currentTarget;
      const buttonRect = button.getBoundingClientRect();
      const cartIcon = document.querySelector('.cart-icon');
      
      if (cartIcon) {
        const cartRect = cartIcon.getBoundingClientRect();
        
        const newFloatingItem: FloatingItem = {
          id: `${menuItem.id}-${Date.now()}`,
          imageUrl: menuItem.image_url,
          startX: buttonRect.left,
          startY: buttonRect.top,
          endX: cartRect.left + cartRect.width / 2,
          endY: cartRect.top + cartRect.height / 2
        };
        
        setFloatingItems(prev => [...prev, newFloatingItem]);

        setTimeout(() => {
          setFloatingItems(prev => prev.filter(item => item.id !== newFloatingItem.id));
        }, 1000);

        const { data: existingCart, error: cartError } = await supabase
          .from('carts')
          .select('id')
          .eq('status', 'active')
          .limit(1);

        if (cartError) throw cartError;

        let cartId;
        if (!existingCart || existingCart.length === 0) {
          const { data: newCart, error: newCartError } = await supabase
            .from('carts')
            .insert({ status: 'active' })
            .select('id')
            .single();

          if (newCartError) throw newCartError;
          cartId = newCart?.id;
        } else {
          cartId = existingCart[0].id;
        }

        if (cartId) {
          const { data: existingItem, error: itemError } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', cartId)
            .eq('menu_item_id', menuItem.id)
            .maybeSingle();

          if (itemError) throw itemError;

          if (existingItem) {
            const { error: updateError } = await supabase
              .from('cart_items')
              .update({ quantity: existingItem.quantity + 1 })
              .eq('id', existingItem.id);

            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from('cart_items')
              .insert({
                cart_id: cartId,
                menu_item_id: menuItem.id,
                quantity: 1
              });

            if (insertError) throw insertError;
          }
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError(t('errors.addToCart'));
    }
  }

  return (
    <div>
      {/* Connection Error */}
      {!isConnected && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center shadow-lg">
          <WifiOff className="h-5 w-5 mr-2 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">{t('errors.connection')}</p>
            <p className="text-sm">{t('errors.connectionHelp')}</p>
          </div>
          <button 
            onClick={handleRetry}
            className="ml-4 px-3 py-1 bg-red-200 hover:bg-red-300 rounded-md transition-colors flex items-center"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t('errors.retry')
            )}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && isConnected && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center shadow-lg">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-4 text-red-700 hover:text-red-900 p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-gray-600">{t('loading')}</span>
          </div>
        </div>
      )}

      {/* Floating Items */}
      {floatingItems.map(item => (
        <div
          key={item.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: item.startX,
            top: item.startY,
            transform: `translate(-50%, -50%)`,
            animation: 'floatToCart 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
          }}
        >
          <img
            src={item.imageUrl}
            alt=""
            className="w-16 h-16 rounded-full object-cover shadow-lg"
            style={{
              animation: 'scaleDown 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
            }}
          />
        </div>
      ))}

      {/* Product Details Modal */}
      {selectedItem && (
        <ProductDetails
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Hero Image Section */}
      <div className="relative h-[300px] md:h-[500px] overflow-hidden mb-8 md:mb-12">
        <div className={`absolute inset-0 transition-transform duration-1000 ease-out ${
          isImageVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img
            src="https://wnvjscdxrdqdxxmsryme.supabase.co/storage/v1/object/sign/images/nobel1.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvbm9iZWwxLnBuZyIsImlhdCI6MTczODQzNDQyOSwiZXhwIjoxNzY5OTcwNDI5fQ.A9CavlhVJlIRP4_kUnFNNl0vluuMSxKJKkSPUZFnEA4&t=2025-02-01T18%3A27%3A09.604Z"
            alt="Restaurant ambiance"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
            <h1 className={`text-3xl md:text-5xl font-light mb-4 transition-all duration-1000 delay-300 ${
              isImageVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              {t('banner.title')}
            </h1>
            <p className={`text-lg md:text-xl max-w-2xl mx-auto transition-all duration-1000 delay-500 ${
              isImageVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              {t('banner.description')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Search and Categories */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center mb-4 md:mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-primary focus:border-primary text-sm md:text-base"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex space-x-2 md:space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setSearchQuery('');
                }}
                className={`px-3 md:px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm md:text-base flex-shrink-0 ${
                  activeCategory === category.id && !searchQuery
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-800 hover:bg-primary-light hover:text-white'
                }`}
              >
                {t(category.name)}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
              <div className="p-4">
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-800">{item.name}</h3>
                <p className="text-gray-600 mb-4 h-20 overflow-hidden text-sm md:text-base">{item.description}</p>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
                  <span className="text-lg font-bold text-primary">{item.price} RON</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item, e);
                    }}
                    className="w-full md:w-auto bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center md:justify-start text-sm md:text-base"
                  >
                    <Utensils className="h-5 w-5 mr-2 cart-icon" />
                    Adaugă pe Masă
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}