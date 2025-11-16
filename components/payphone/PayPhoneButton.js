'use client';
import { useState } from 'react';
import { useCartStore } from '@/lib/cartStore';

export default function PayPhoneButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const items = useCartStore((state) => state.items);
  
  const subtotal = items.reduce((total, item) => {
    return total + (item.precio_final * item.quantity);
  }, 0);

  const handlePayment = async () => {
    if (items.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Crear la transacción en tu backend
      const response = await fetch('/api/payphone/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: subtotal,
          items: items
        })
      });

      const data = await response.json();

      if (data.payWithCard) {
        // Redirigir a la URL de pago de PayPhone
        window.location.href = data.payWithCard;
      } else {
        throw new Error('No se pudo generar el link de pago');
      }

    } catch (err) {
      console.error('Error al iniciar pago:', err);
      setError('Error al iniciar el pago. Por favor, intenta nuevamente.');
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-4 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full px-6 py-4 bg-green-600 text-white text-center font-light tracking-widest uppercase text-sm hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Redirigiendo a PayPhone...' : 'Pagar con PayPhone'}
      </button>
    </div>
  );
}