import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export const metadata = {
  title: "Garantía y Devoluciones | Quito, Ecuador",
  description:
    "Política de garantía de Tamara Valencia Joyas en Quito, Ecuador. Cobertura por defectos de fábrica y proceso de verificación.",
  alternates: {
    canonical: "/politica-devoluciones",
  },
};

export default function PoliticaDevolucionesPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-elegant text-4xl md:text-5xl font-light text-gray-900 mb-4 text-center">
            Garantía y Devoluciones
          </h1>
          <div className="w-16 h-px bg-[#FFF2E0] mx-auto mb-12" />

          <div className="space-y-10 text-gray-700 font-light leading-relaxed">
            <section>
              <p className="text-lg">
                En Tamara Valencia Joyas respaldamos la calidad de cada pieza
                que creamos. Todas nuestras joyas cuentan con garantía por
                defectos de fábrica, verificados por nuestro equipo antes de
                proceder con cualquier reparación o cambio.
              </p>
            </section>

            <section>
              <h2 className="font-elegant text-xl text-gray-900 mb-3 font-bold">
                ¿Qué cubre la garantía?
              </h2>
              <p>
                La garantía cubre defectos originados en la fabricación de la
                pieza, tales como fallas en el material, en el acabado o en el
                ensamblaje, que no sean atribuibles al uso normal de la joya.
              </p>
            </section>

            <section>
              <h2 className="font-elegant text-xl text-gray-900 mb-3 font-bold">
                ¿Qué no cubre la garantía?
              </h2>
              <p>
                No aplica para el desgaste natural por el uso, daños ocasionados
                por mal uso o accidentes, ni para piezas que hayan sido
                alteradas, reparadas o manipuladas por terceros ajenos a Tamara
                Valencia Joyas.
              </p>
            </section>

            <section>
              <h2 className="font-elegant text-xl text-gray-900 mb-3 font-bold">
                ¿Cómo solicitar la garantía?
              </h2>
              <p>
                Escríbenos por WhatsApp al{" "}
                <a
                  href="https://wa.me/593998444531"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 underline hover:no-underline"
                >
                  +593 99 844 4531
                </a>{" "}
                indicando tu número de pedido, una descripción del problema y
                fotos claras de la pieza. Nuestro equipo revisará el caso para
                verificar si se trata de un defecto de fábrica.
              </p>
            </section>

            <section>
              <h2 className="font-elegant text-xl text-gray-900 mb-3 font-bold">
                Proceso de verificación
              </h2>
              <p>
                Una vez recibida tu solicitud, evaluamos la pieza para confirmar
                el defecto reportado. Si se verifica que corresponde a un
                defecto de fábrica, coordinamos contigo la solución más
                adecuada: reparación, cambio de la pieza, u otra alternativa
                según el caso.
              </p>
            </section>

            <section className="bg-[#FFF2E0]/20 p-6 rounded-lg">
              <h2 className="font-elegant text-xl text-gray-900 mb-3 font-bold">
                ¿Tienes dudas?
              </h2>
              <p>
                Cualquier consulta sobre tu garantía o sobre este proceso,
                contáctanos directamente al{" "}
                <a
                  href="https://wa.me/593998444531"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 font-normal underline hover:no-underline"
                >
                  +593 99 844 4531
                </a>
                . Con gusto te atendemos desde Quito, Ecuador.
              </p>
            </section>

            <p className="text-sm text-gray-400 pt-8 border-t border-gray-100">
              Última actualización: agosto de 2026
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
