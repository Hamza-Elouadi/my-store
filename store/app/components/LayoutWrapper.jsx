"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  const noLayoutRoutes = ["/dashboard"]; // كله صغير!
  
  const shouldHideLayout = noLayoutRoutes.some((route) =>
    pathname.toLowerCase().startsWith(route)
  );

  return (
    <>
      {!shouldHideLayout && <Header />}
      {children}
      {!shouldHideLayout && <Footer />}
    </>
  );
}
