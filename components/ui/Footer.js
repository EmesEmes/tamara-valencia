import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo y descripción */}
          <div>
            <h3 className="font-elegant text-2xl mb-4">Tamara Valencia Joyas</h3>
            <p className="text-gray-400 text-sm font-light">
              Elegancia atemporal en cada pieza de joyería.
            </p>
          </div>

          {/* Enlaces */}
          <div>
            <h4 className="text-sm tracking-widest uppercase mb-4">Enlaces</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <a href="#about" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Nosotros
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-sm tracking-widest uppercase mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>+593 99 844 4531</li>
              <li>Quito, Ecuador</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Tamara Valencia. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}