export default function Personalizadas() {
  return (
    <section className="py-24 px-4 bg-[#FFF2E0]/20">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-elegant text-5xl font-light text-gray-900 mb-6 font-biloxi">
          Joyas Personalizadas
        </h2>

        <div className="w-16 h-px bg-[#FFF2E0] mx-auto mb-8"></div>

        <p className="text-lg text-gray-600 leading-relaxed font-light mb-4">
          En Tamara Valencia Joyas, además de nuestro catálogo, ofrecemos un
          servicio de joyería personalizada en Quito, Ecuador, pensado para
          quienes buscan una pieza verdaderamente única. Ya sea un anillo de
          compromiso con un diseño exclusivo, un dije con un significado
          especial, o un regalo que cuente una historia particular, en Tamara
          Valencia Joyas te acompañamos en todo el proceso de crear esa joya que
          tienes en mente.
        </p>

        <p className="text-lg text-gray-600 leading-relaxed font-light mb-4">
          Trabajamos contigo desde la idea inicial hasta la pieza terminada,
          combinando oro, plata y perlas cultivadas según lo que imagines.
          Podemos partir de un boceto, una fotografía de referencia, o
          simplemente una descripción de lo que tienes en mente — nuestro equipo
          te asesora en cada paso para que el resultado final sea exactamente lo
          que buscabas.
        </p>

        <p className="text-lg text-gray-600 leading-relaxed font-light mb-10">
          Este servicio es ideal para aniversarios, pedidas de mano, cumpleaños,
          o cualquier ocasión donde una joya de catálogo simplemente no sea
          suficiente. Cuéntanos tu idea por WhatsApp y te ayudamos a convertirla
          en una joya real, hecha especialmente para ti.
        </p>

        <a
          href={`https://wa.me/593998444531?text=Hola, me interesa una joya personalizada`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-10 py-4 bg-gray-900 text-white text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Consulta tu Diseño
        </a>
      </div>
    </section>
  );
}
