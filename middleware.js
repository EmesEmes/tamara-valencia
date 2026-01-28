// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(req) {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  const maintenancePath = '/mantenimiento';

  // Si NO está en modo mantenimiento, dejamos pasar todo
  if (!isMaintenanceMode) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  // 1. Definir rutas que SIEMPRE deben estar accesibles (Admin, Login, API)
  // Usamos 'startsWith' para que '/admin/productos' o '/api/auth' también funcionen
  const allowedPaths = [
    '/admin',      // Tu panel de administración
    '/login',      // Tu página de login
    '/api',        // MUY IMPORTANTE: Para que el login y el admin puedan pedir datos
    '/dashboard',  // (Opcional) Si tu admin está en /dashboard
    maintenancePath // La página de aviso
  ];

  // 2. Verificar si la ruta actual empieza con alguna de las permitidas
  const isAllowed = allowedPaths.some((path) => pathname.startsWith(path));

  // 3. También permitimos archivos estáticos (_next, imágenes, favicon)
  // para que el diseño no se rompa ni en el admin ni en el aviso.
  const isStaticAsset = 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static') || 
    pathname.includes('.');

  // SI es una ruta permitida O es un archivo estático, dejamos pasar
  if (isAllowed || isStaticAsset) {
    return NextResponse.next();
  }

  // SI NO, mandamos a la gente a la página de inventario
  return NextResponse.redirect(new URL(maintenancePath, req.url));
}

export const config = {
  matcher: '/:path*',
};