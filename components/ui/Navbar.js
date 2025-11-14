'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCartStore } from '@/lib/cartStore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  
  // ❌ MAL - Esto solo se calcula una vez
  // const getTotalItems = useCartStore((state) => state.getTotalItems);
  // const totalItems = getTotalItems();
  
  // ✅ BIEN - Esto se reactiva cada vez que cambian los items
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="fixed w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="font-elegant text-2xl md:text-3xl font-light tracking-wide text-gray-900 font-biloxi">
            Tamara Valencia Joyas
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm tracking-widest uppercase text-gray-600 hover:text-gray-900 transition-colors">
              Inicio
            </Link>
            <Link href="/catalogo" className="text-sm tracking-widest uppercase text-gray-600 hover:text-gray-900 transition-colors">
              Catálogo
            </Link>
            
            {/* Ícono del Carrito - Desktop */}
            <Link href="/carrito" className="relative group">
              <svg 
                className="w-6 h-6 text-gray-600 group-hover:text-gray-900 transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1.5" 
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              
              {/* Badge con número */}
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path d="M6 18L18 6M6 6l12 12"></path>
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 text-sm tracking-widest uppercase text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Inicio
            </Link>
            <Link
              href="/catalogo"
              className="block px-3 py-2 text-sm tracking-widest uppercase text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Catálogo
            </Link>
            
            {/* Carrito - Mobile */}
            <Link
              href="/carrito"
              className="flex items-center justify-between px-3 py-2 text-sm tracking-widest uppercase text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <span>Carrito</span>
              {totalItems > 0 && (
                <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}