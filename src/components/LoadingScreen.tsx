import React from 'react';
import { Utensils } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="relative">
        <Utensils className="h-12 w-12 text-primary animate-[spin_3s_linear_infinite]" />
        <div className="absolute inset-0 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]">
          <Utensils className="h-12 w-12 text-primary opacity-75" />
        </div>
      </div>
      <div className="mt-4 relative">
        <div className="h-1 w-32 bg-gray-200 rounded overflow-hidden">
          <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite]" />
        </div>
      </div>
      <p className="mt-4 text-gray-600 font-light animate-pulse">Se încarcă...</p>
    </div>
  );
}