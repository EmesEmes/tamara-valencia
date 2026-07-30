import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import ProductDetail from "@/components/catalogo/ProductDetail";
import { getProductoById } from "@/lib/supabase/client";

// Función para calcular precio (igual que en ProductDetail)
const calcularPrecio = (prod) => {
  if (!prod.peso || !prod.factor || !prod.factor.valor) return 0;
  return parseFloat(prod.peso) * parseFloat(prod.factor.valor);
};

const redondearPrecio = (precio) => {
  if (!precio || precio === 0) return 0;
  return Math.ceil(precio / 5) * 5;
};

// Esta función genera los meta tags dinámicos para WhatsApp/Facebook/Twitter
export async function generateMetadata({ params }) {
  const { id } = await params; // Cambié esto - usar await en lugar de use()

  try {
    const producto = await getProductoById(id);

    // Calcular precio
    const precioFinal = redondearPrecio(calcularPrecio(producto));

    return {
      title: `${producto.nombre_comercial}`,
      description:
        producto.descripcion ||
        `${producto.nombre_comercial} - ${producto.categoria} - ${producto.material}`,
      openGraph: {
        title: `${producto.nombre_comercial}`,
        description: `${producto.descripcion}`,
        images: [
          {
            url: producto.imagen_url,
            width: 1200,
            height: 630,
            alt: producto.nombre_comercial,
          },
        ],
        type: "website",
        siteName: "Tamara Valencia Joyas",
      },
      twitter: {
        card: "summary_large_image",
        title: `${producto.nombre_comercial}`,
        description: `${producto.categoria} de ${producto.material} - Precio: $${precioFinal}`,
        images: [producto.imagen_url],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Producto | Tamara Valencia",
      description: "Joyería fina y elegante",
    };
  }
}

export default async function ProductoDetallePage({ params }) {
  const { id } = await params;

  let structuredData = null;
  try {
    const producto = await getProductoById(id);
    const precioFinal = redondearPrecio(calcularPrecio(producto));

    structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: producto.nombre_comercial,
      description:
        producto.descripcion ||
        `${producto.nombre_comercial} - ${producto.categoria} - ${producto.material}`,
      image: producto.imagen_url || undefined,
      sku: producto.codigo,
      category: producto.categoria,
      material: producto.material,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: precioFinal,
        availability:
          producto.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        url: `https://www.tamaravalenciajoyas.com/catalogo/${id}`,
      },
    };
  } catch (error) {
    console.error("Error generando structured data del producto:", error);
  }

  return (
    <main className="min-h-screen bg-white">
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <Navbar />
      <div className="pt-20">
        <ProductDetail productId={id} />
      </div>
      <Footer />
    </main>
  );
}
