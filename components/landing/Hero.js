import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[url(/img/test2.webp)] bg-cover bg-center">
      {/* Overlay opcional para mejorar contraste */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Contenido */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
        <h1 className="font-serif text-6xl md:text-8xl font-light mb-6 tracking-wide text-gray-900">
          Tamara Valencia
        </h1>
        
        <div className="w-24 h-px bg-gray-300 mx-auto mb-8"></div>
        
        <p className="text-xl md:text-2xl font-light text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Elegancia atemporal en cada pieza. Descubre joyas que cuentan historias.
        </p>
        
        <Link 
          href="/catalogo"
          className="inline-block px-12 py-4 bg-gray-900 text-white font-light tracking-widest uppercase text-sm hover:bg-gray-800 transition-all duration-300 hover:scale-105"
        >
          Ver Colección
        </Link>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg 
          className="w-6 h-6 text-gray-400" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  );
}