'use client';
import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/lib/cartStore';
import { useRouter } from 'next/navigation';

export default function PayPhoneButton() {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const ppbRef = useRef(null);
  const router = useRouter();
  
  const items = useCartStore((state) => state.items);
  
  const subtotal = items.reduce((total, item) => {
    return total + (item.precio_final * item.quantity);
  }, 0);

  // Cargar scripts de PayPhone
  useEffect(() => {
    if (document.getElementById('payphone-css') && document.getElementById('payphone-js')) {
      setScriptsLoaded(true);
      return;
    }

    console.log('📦 Cargando scripts de PayPhone...');
    
    // Cargar CSS
    const link = document.createElement('link');
    link.id = 'payphone-css';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.css';
    document.head.appendChild(link);

    // Cargar JS
    const script = document.createElement('script');
    script.id = 'payphone-js';
    script.src = 'https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js';
    script.onload = () => {
      console.log('✅ Scripts de PayPhone cargados');
      setScriptsLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ Error al cargar scripts');
      setError('Error al cargar el método de pago');
    };
    document.head.appendChild(script);

  }, []);

  // Renderizar la cajita cuando los scripts estén listos
  useEffect(() => {
    if (!scriptsLoaded || items.length === 0) return;

    const token = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN;
    const storeId = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID;

    if (!token || !storeId) {
      console.error('❌ Faltan credenciales');
      setError('Credenciales de PayPhone no configuradas');
      return;
    }

    // Verificar que PPaymentButtonBox esté disponible
    if (typeof window.PPaymentButtonBox === 'undefined') {
      console.error('❌ PPaymentButtonBox no está definido');
      setError('Error al cargar PayPhone');
      return;
    }

    const clientTransactionId = `ORDER-${Date.now()}`;
    const amountInCents = Math.round(subtotal * 100);

    console.log('=== RENDERIZANDO CAJITA ===');
    console.log('💰 Amount (centavos):', amountInCents);
    console.log('🆔 Transaction ID:', clientTransactionId);

    try {
      // Limpiar el contenedor antes de renderizar
      const container = document.getElementById('pp-button');
      if (container) {
        container.innerHTML = '';
      }

      // Crear instancia de PPaymentButtonBox
      ppbRef.current = new window.PPaymentButtonBox({
        token: token,
        storeId: storeId,
        clientTransactionId: clientTransactionId,
        amount: amountInCents,
        amountWithoutTax: amountInCents,
        amountWithTax: 0,
        tax: 0,
        service: 0,
        tip: 0,
        currency: 'USD',
        reference: 'Tamara Valencia Joyas',
        lang: 'es',
        defaultMethod: 'card',
        timeZone: -5
      });

      // Renderizar en el contenedor
      ppbRef.current.render('pp-button');

      console.log('✅ Cajita renderizada correctamente');

      // Escuchar eventos de PayPhone
      window.addEventListener('payphone-response', handlePayPhoneResponse);

    } catch (err) {
      console.error('❌ Error al renderizar cajita:', err);
      setError('Error al renderizar el botón de pago');
    }

    return () => {
      window.removeEventListener('payphone-response', handlePayPhoneResponse);
    };

  }, [scriptsLoaded, items, subtotal]);

  const handlePayPhoneResponse = (event) => {
    console.log('=== RESPUESTA DE PAYPHONE ===');
    console.log(event.detail);

    const response = event.detail;

    if (response.transactionStatus === 'Approved') {
      console.log('✅ Pago aprobado');
      router.push(`/carrito/confirmacion?id=${response.transactionId}&clientTransactionId=${response.clientTransactionId}`);
    } else if (response.transactionStatus === 'Canceled') {
      console.log('❌ Pago cancelado');
      alert('Pago cancelado');
    } else {
      console.log('⚠️ Estado desconocido:', response.transactionStatus);
    }
  };

  if (items.length === 0) {
    return null;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm rounded">
        {error}
      </div>
    );
  }

  if (!scriptsLoaded) {
    return (
      <div className="w-full px-6 py-4 bg-gray-200 text-gray-600 text-center font-light tracking-widest uppercase text-sm">
        Cargando método de pago...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 text-center">
        Pago seguro con PayPhone
      </div>
      
      {/* Contenedor donde se renderiza la cajita */}
      <div id="pp-button"></div>
    </div>
  );
}