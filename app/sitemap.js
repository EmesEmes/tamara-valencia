import { getProductos, getConjuntos } from "@/lib/supabase/client";

const SITE_URL = "https://www.tamaravalenciajoyas.com";

export default async function sitemap() {
  // Páginas fijas del sitio
  const paginasFijas = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/catalogo`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Una entrada por cada producto activo, con imagen y stock (igual que el catálogo público)
  let paginasProductos = [];
  try {
    const productos = await getProductos();
    paginasProductos = productos.map((producto) => ({
      url: `${SITE_URL}/catalogo/${producto.id}`,
      lastModified: producto.updated_at
        ? new Date(producto.updated_at)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error generando sitemap de productos:", error);
  }

  // Una entrada por cada conjunto/colección
  let paginasConjuntos = [];
  try {
    const conjuntos = await getConjuntos();
    paginasConjuntos = (conjuntos || []).map((conjunto) => ({
      url: `${SITE_URL}/catalogo?conjunto=${conjunto.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error generando sitemap de conjuntos:", error);
  }

  return [...paginasFijas, ...paginasProductos, ...paginasConjuntos];
}
