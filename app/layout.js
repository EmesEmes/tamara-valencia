import './globals.css'
import { Cormorant_Garamond } from 'next/font/google'
import localFont from 'next/font/local'

const cormorant = Cormorant_Garamond({ 
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-elegant'
})

const biloxiScript = localFont({
  src: '../public/fonts/BiloxiScript.ttf',
  variable: '--font-biloxi',
})

export const metadata = {
  title: 'Tamara Valencia - Joyería Elegante',
  description: 'Elegancia atemporal en cada pieza',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${cormorant.variable} ${biloxiScript.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}