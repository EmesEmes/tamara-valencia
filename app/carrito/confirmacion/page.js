'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { useCartStore } from '@/lib/cartStore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function ConfirmacionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  
  const [paymentStatus, setPaymentStatus] = useState('loading');
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
  const id = searchParams.get('id');
  const clientTransactionId = searchParams.get('clientTransactionId');

  if (!id || !clientTransactionId) {
    setPaymentStatus('error');
    setError('No se encontraron datos de la transacción');
    return;
  }

  // Función movida DENTRO del useEffect
  const confirmPayment = async (transactionId, clientTxId) => {
    try {
      const response = await fetch('/api/payphone/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: transactionId,
          clientTransactionId: clientTxId
        })
      });

      const data = await response.json();

      if (data.statusCode === 3) {
        setPaymentStatus('success');
        setPaymentData(data);
        clearCart();
      } else {
        setPaymentStatus('failed');
        setPaymentData(data);
      }
    } catch (err) {
      console.error('Error al confirmar pago:', err);
      setPaymentStatus('error');
      setError('Error al verificar el estado del pago');
    }
  };

  confirmPayment(id, clientTransactionId);
}, [searchParams, clearCart]);

  const confirmPayment = async (transactionId, clientTxId) => {
    try {
      const response = await fetch('/api/payphone/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: transactionId,
          clientTransactionId: clientTxId
        })
      });

      const data = await response.json();

      if (data.statusCode === 3) {
        setPaymentStatus('success');
        setPaymentData(data);
        clearCart();
      } else {
        setPaymentStatus('failed');
        setPaymentData(data);
      }
    } catch (err) {
      console.error('Error al confirmar pago:', err);
      setPaymentStatus('error');
      setError('Error al verificar el estado del pago');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-28 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {paymentStatus === 'loading' && (
            <div className="text-center py-16">
              <LoadingSpinner />
              <p className="text-gray-600 mt-4">Verificando tu pago...</p>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="text-center py-16">
              <div className="mb-6">
                <svg 
                  className="w-20 h-20 text-green-600 mx-auto" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              
              <h1 className="font-elegant text-3xl md:text-4xl font-light text-gray-900 mb-4">
                ¡Pago Exitoso!
              </h1>
              
              <div className="w-16 h-px bg-[#FFF2E0] mx-auto mb-6"></div>
              
              <p className="text-gray-600 mb-8">
                Gracias por tu compra. Hemos recibido tu pago correctamente.
              </p>

              {paymentData && (
                <div className="bg-gray-50 p-6 rounded-lg mb-8 text-left">
                  <h2 className="font-medium text-gray-900 mb-4">Detalles de la transacción</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID de transacción:</span>
                      <span className="font-medium">{paymentData.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto:</span>
                      <span className="font-medium">${paymentData.amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className="font-medium text-green-600">Aprobado</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={() => router.push('/catalogo')}
                  className="w-full px-6 py-3 bg-gray-900 text-white font-light tracking-widest uppercase text-sm hover:bg-gray-800 transition-colors"
                >
                  Volver al Catálogo
                </button>
                
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-900 font-light tracking-widest uppercase text-sm hover:bg-gray-50 transition-colors"
                >
                  Ir al Inicio
                </button>
              </div>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="text-center py-16">
              <div className="mb-6">
                <svg 
                  className="w-20 h-20 text-red-600 mx-auto" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              
              <h1 className="font-elegant text-3xl md:text-4xl font-light text-gray-900 mb-4">
                Pago No Procesado
              </h1>
              
              <div className="w-16 h-px bg-[#FFF2E0] mx-auto mb-6"></div>
              
              <p className="text-gray-600 mb-4">
                Tu pago no pudo ser procesado.
              </p>
              
              {paymentData?.message && (
                <p className="text-sm text-gray-500 mb-8">
                  {paymentData.message}
                </p>
              )}

              <div className="space-y-4">
                <button
                  onClick={() => router.push('/carrito')}
                  className="w-full px-6 py-3 bg-gray-900 text-white font-light tracking-widest uppercase text-sm hover:bg-gray-800 transition-colors"
                >
                  Volver al Carrito
                </button>
                
                <a
                  href="https://wa.me/593998444531?text=Hola,%20tuve%20un%20problema%20con%20mi%20pago"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-3 border border-gray-300 text-gray-900 font-light tracking-widest uppercase text-sm hover:bg-gray-50 transition-colors"
                >
                  Contactar Soporte
                </a>
              </div>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="text-center py-16">
              <div className="mb-6">
                <svg 
                  className="w-20 h-20 text-yellow-600 mx-auto" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              
              <h1 className="font-elegant text-3xl md:text-4xl font-light text-gray-900 mb-4">
                Error de Verificación
              </h1>
              
              <div className="w-16 h-px bg-[#FFF2E0] mx-auto mb-6"></div>
              
              <p className="text-gray-600 mb-8">
                {error || 'No pudimos verificar el estado de tu pago. Por favor, contacta con soporte.'}
              </p>

              <div className="space-y-4">
                <a
                  href="https://wa.me/593998444531?text=Hola,%20necesito%20ayuda%20con%20mi%20pago"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-3 bg-gray-900 text-white font-light tracking-widest uppercase text-sm hover:bg-gray-800 transition-colors"
                >
                  Contactar Soporte
                </a>
                
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-900 font-light tracking-widest uppercase text-sm hover:bg-gray-50 transition-colors"
                >
                  Ir al Inicio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}