import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccess() {
  return (
    <div className="min-h-[calc(100vh-20rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-primary mx-auto" />
        </div>
        <h1 className="text-3xl font-light mb-4">Comandă Plasată cu Succes!</h1>
        <p className="text-gray-600 mb-8">
          Îți mulțumim pentru comandă! Vei primi în curând o confirmare și timpul estimat de livrare.
        </p>
        <Link
          to="/"
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Înapoi la Meniu
        </Link>
      </div>
    </div>
  );
}