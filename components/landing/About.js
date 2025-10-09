export default function About() {
  return (
    <section id="about" className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="font-elegant text-5xl font-light text-gray-900 mb-6">
              Sobre Nosotros
            </h2>
            
            <div className="w-16 h-px bg-[#FFF2E0]"></div>
            
            <p className="text-lg text-gray-600 leading-relaxed font-light">
              En Tamara Valencia, cada joya es una obra de arte cuidadosamente creada 
              para expresar tu esencia única. Combinamos técnicas tradicionales con 
              diseños contemporáneos para ofrecerte piezas excepcionales.
            </p>
            
            <p className="text-lg text-gray-600 leading-relaxed font-light">
              Trabajamos con los mejores materiales: oro, plata, perlas cultivadas 
              y piedras seleccionadas, garantizando la calidad y durabilidad de cada 
              creación.
            </p>

            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <p className="text-4xl font-light text-gray-900 mb-2">100%</p>
                <p className="text-sm text-gray-500 uppercase tracking-wider">Calidad</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-light text-gray-900 mb-2">+500</p>
                <p className="text-sm text-gray-500 uppercase tracking-wider">Diseños</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-light text-gray-900 mb-2">5⭐</p>
                <p className="text-sm text-gray-500 uppercase tracking-wider">Experiencia</p>
              </div>
            </div>
          </div>

          <div className="relative h-[600px] bg-[#FFF2E0]/30 rounded-sm overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <svg 
                  className="w-32 h-32 mx-auto text-gray-300" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="0.5"
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  ></path>
                </svg>
                <p className="mt-4 text-sm text-gray-400">Imagen principal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}