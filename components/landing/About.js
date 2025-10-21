export default function About() {
  return (
    <section id="about" className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="font-elegant text-5xl font-light text-gray-900 mb-6 font-biloxi">
              Sobre Nosotros
            </h2>
            
            <div className="w-16 h-px bg-[#FFF2E0]"></div>
            
            <p className="text-lg text-gray-600 leading-relaxed font-light">
              En Tamara Valencia Joyas, cada pieza es una obra de arte cuidadosamente escogida 
              para expresar tu esencia única. Combinamos técnicas tradicionales con 
              diseños contemporáneos para ofrecerte joyas excepcionales.
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
                <p className="text-4xl font-light text-gray-900 mb-2">+10 Años</p>
                <p className="text-sm text-gray-500 uppercase tracking-wider"> de Experiencia</p>
              </div>
            </div>
          </div>

          <div className="relative h-[600px] bg-[#FFF2E0]/30 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-[url(/about.webp)] bg-cover bg-center" />
          </div>
        </div>
      </div>
    </section>
  );
}