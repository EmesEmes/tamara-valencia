import { Suspense } from "react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import CatalogoContent from "@/components/catalogo/CatalogoContent";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export const metadata = {
  title: "Catálogo de Joyas",
  description:
    "Explora nuestro catálogo completo de joyería: anillos, aretes, collares, pulseras y cadenas en oro, plata y perlas cultivadas. Envíos en Ecuador.",
  alternates: {
    canonical: "/catalogo",
  },
};

export default function CatalogoPage() {
  return (
    <main className="min-h-screen bg-white">
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
