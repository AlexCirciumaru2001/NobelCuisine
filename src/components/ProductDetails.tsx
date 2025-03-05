import React, { useState } from 'react';
import { X, Utensils, Clock } from 'lucide-react';
import { MenuItem } from '../types';

interface ProductDetailsProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: MenuItem, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ProductDetails({ item, onClose, onAddToCart }: ProductDetailsProps) {
  const [floatingItems, setFloatingItems] = useState<{
    id: string;
    imageUrl: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }[]>([]);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    const button = e.currentTarget;
    const buttonRect = button.getBoundingClientRect();
    const cartIcon = document.querySelector('.cart-icon');
    
    if (cartIcon) {
      const cartRect = cartIcon.getBoundingClientRect();
      
      const newFloatingItem = {
        id: `${item.id}-${Date.now()}`,
        imageUrl: item.image_url,
        startX: buttonRect.left,
        startY: buttonRect.top,
        endX: cartRect.left + cartRect.width / 2,
        endY: cartRect.top + cartRect.height / 2
      };
      
      setFloatingItems(prev => [...prev, newFloatingItem]);

      setTimeout(() => {
        setFloatingItems(prev => prev.filter(item => item.id !== newFloatingItem.id));
      }, 1000);
    }

    onAddToCart(item, e);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {/* Floating Items */}
      {floatingItems.map(item => (
        <div
          key={item.id}
          className="fixed pointer-events-none z-[60]"
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

      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full z-10"
        >
          <X className="h-6 w-6 text-gray-500" />
        </button>

        <div className="grid md:grid-cols-2 max-h-[90vh]">
          {/* Image Section */}
          <div className="relative h-64 md:h-[90vh]">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:hidden" />
          </div>

          {/* Content Section */}
          <div className="flex flex-col h-full max-h-[90vh]">
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-semibold mb-2">{item.name}</h2>
              <p className="text-2xl text-primary font-bold mb-4">{item.price} RON</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Descriere</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Ingrediente</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {item.ingredients?.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary" />
                    Timp de preparare
                  </h3>
                  <p className="text-gray-600">{item.preparation_time || 15} minute</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t">
              <button
                onClick={handleAddToCart}
                className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
              >
                <Utensils className="h-5 w-5 mr-2" />
                Adaugă pe Masă
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}