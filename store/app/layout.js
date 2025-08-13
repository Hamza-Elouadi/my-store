import './globals.css'
import { Inter } from 'next/font/google'
import { FavoritesProvider } from './context/FavoritesContext'
import { CartProvider } from './context/CartContext'
import LayoutWrapper from './components/LayoutWrapper'
import { FilterProvider } from "./context/FilterContext"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Your Store',
  description: 'Dashboard Example',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <FilterProvider>
            <FavoritesProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </FavoritesProvider>
          </FilterProvider>
        </CartProvider>
      </body>
    </html>
  )
}
