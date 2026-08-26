import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import ProductDetail from "@/components/catalogo/ProductDetail";
import { getProductoById } from "@/lib/supabase/client";

const calcularPrecio = (prod) => {
  if (!prod.peso || !prod.factor || !prod.factor.valor) return 0;
  return parseFloat(prod.peso) * parseFloat(prod.factor.valor);
};

const redondearPrecio = (precio) => {
  if (!precio || precio === 0) return 0;
  return Math.ceil(precio / 5) * 5;
};

export async function generateMetadata({ params }) {
  try {
    const producto = await getProductoById(id);
    const precioFinal = redondearPrecio(calcularPrecio(producto));
    const imagenesOG = producto.imagen_url
      ? [
          {
            url: producto.imagen_url,
            width: 800,
            height: 800,
            alt: producto.nombre_comercial,
          },
        ]
      : undefined;

    return {
      title: `${producto.nombre_comercial} | Quito, Ecuador`,
      description:
        producto.descripcion ||
        `${producto.nombre_comercial} en ${producto.material}, disponible en Tamara Valencia Joyas, Quito, Ecuador.`,
      openGraph: {
        title: `${producto.nombre_comercial}`,
        description:
          producto.descripcion ||
          `${producto.nombre_comercial} en ${producto.material}, disponible en Tamara Valencia Joyas, Quito, Ecuador.`,
        images: imagenesOG,
        type: "website",
        siteName: "Tamara Valencia Joyas",
      },
      twitter: {
        card: "summary_large_image",
        title: `${producto.nombre_comercial}`,
        description: `${producto.categoria} de ${producto.material} - Precio: $${precioFinal}`,
        images: producto.imagen_url ? [producto.imagen_url] : undefined,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Producto | Tamara Valencia Joyas, Quito",
      description: "Joyería fina y elegante en Quito, Ecuador.",
    };
  }
}

export default async function ProductoDetallePage({ params }) {
  const { id } = await params;
  const SITE_URL = "https://www.tamaravalenciajoyas.com";

  let structuredData = null;
  let breadcrumbData = null;
  try {
    const producto = await getProductoById(id);
    const precioFinal = redondearPrecio(calcularPrecio(producto));

    structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: producto.nombre_comercial,
      description:
        producto.descripcion ||
        `${producto.nombre_comercial} en ${producto.material}, disponible en Tamara Valencia Joyas, Quito, Ecuador.`,
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
        url: `${SITE_URL}/catalogo/${id}`,
      },
    };

    breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inicio",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Catálogo",
          item: `${SITE_URL}/catalogo`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: producto.nombre_comercial,
          item: `${SITE_URL}/catalogo/${id}`,
        },
      ],
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
      {breadcrumbData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
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
