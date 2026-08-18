import { Suspense } from "react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import CatalogoContent from "@/components/catalogo/CatalogoContent";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export const metadata = {
  title: "Catálogo de Joyas en Quito, Ecuador",
  description:
    "Explora nuestro catálogo completo de joyería en Quito: anillos, aretes, collares, pulseras y cadenas en oro, plata y perlas cultivadas. Envíos a todo Ecuador.",
  alternates: {
    canonical: "/catalogo",
  },
};

export default function CatalogoPage() {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://www.tamaravalenciajoyas.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catálogo",
        item: "https://www.tamaravalenciajoyas.com/catalogo",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <Navbar />
      <div className="pt-20">
        <Suspense fallback={<LoadingSpinner />}>
          <CatalogoContent />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
