import './globals.css'
import { Cormorant_Garamond } from 'next/font/google'

const cormorant = Cormorant_Garamond({ 
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-elegant'
})

export const metadata = {
  title: 'Tamara Valencia - Joyería Elegante',
  description: 'Elegancia atemporal en cada pieza',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${cormorant.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}