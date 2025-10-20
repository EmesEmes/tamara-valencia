'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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
          </div>
        </div>
      )}
    </nav>
  );
}