// First, let's add debugging to your Products page
// /app/Products/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { FaHeart } from "react-icons/fa";
import { useFavorites } from "@/app/context/FavoritesContext";
import { useCart } from "@/app/context/CartContext";
import { useFilter } from "@/app/context/FilterContext";

function Products() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomMode, setZoomMode] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  const { addToFavorites } = useFavorites();
  const { addToCart } = useCart();

  // ⬇️ Enhanced fetch with better debugging
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("🔍 Fetching products from /api/products...");
        const res = await fetch("/api/products");
        console.log("📡 Response status:", res.status);
        
        const data = await res.json();
        console.log("📦 Raw API response:", data);
        
        if (data.success) {
          console.log("✅ Products loaded:", data.products?.length || 0, "items");
          console.log("📋 Products data:", data.products);
          setProducts(data.products || []);
        } else {
          console.error("❌ API Error:", data.error);
          setError(data.error);
        }
      } catch (err) {
        console.error("🚨 Fetch Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleOpen = (product) => {
    setSelectedProduct(product);
    setSelectedImage(product.images?.[0]);
    setShowDetails(true);
  };

  const handleClose = () => {
    setShowDetails(false);
    setZoomMode(false);
    setSelectedProduct(null);
    setSelectedImage(null);
  };

  const handleMouseEnter = () => setZoomMode(true);
  const handleMouseLeave = () => setZoomMode(false);
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const { filterType } = useFilter();
  
  // Add debug logging for filtering
  const filteredProducts = products.filter((product) => {
    const matches = filterType === "All" || product.type === filterType;
    console.log(`🔍 Product "${product.description}" (${product.type}) matches filter "${filterType}":`, matches);
    return matches;
  });

  console.log("🎯 Current filter:", filterType);
  console.log("📊 Total products:", products.length);
  console.log("📊 Filtered products:", filteredProducts.length);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 text-lg">خطأ في تحميل المنتجات</p>
          <p className="text-gray-500 text-sm mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // No products state
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 text-lg">لا توجد منتجات للعرض</p>
          <p className="text-gray-500 text-sm mt-2">قم بإضافة منتجات من لوحة التحكم</p>
          <div className="mt-4 p-4 bg-yellow-100 rounded">
            <p className="text-sm text-gray-700">تأكد من:</p>
            <ul className="text-xs text-gray-600 mt-2 text-right">
              <li>• تم إضافة منتجات في لوحة التحكم</li>
              <li>• API endpoint /api/products يعمل بشكل صحيح</li>
              <li>• قاعدة البيانات متصلة</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // No products match filter
  if (filteredProducts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 text-lg">لا توجد منتجات بهذا التصنيف: {filterType}</p>
          <p className="text-gray-500 text-sm mt-2">جرب تصنيف آخر</p>
          <div className="mt-4 p-4 bg-blue-100 rounded">
            <p className="text-sm text-gray-700">المتوفر حالياً: {products.length} منتج</p>
            <p className="text-xs text-gray-600 mt-1">
              الأنواع: {[...new Set(products.map(p => p.type))].join(', ')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Debug info panel - remove in production */}
      <div className="bg-gray-100 p-2 text-xs text-gray-600 mb-4">
        <strong>Debug Info:</strong> Total: {products.length} | Filtered: {filteredProducts.length} | Filter: {filterType}
      </div>

      <div className="flex flex-wrap gap-6 p-4">
        {filteredProducts.map((product, i) => (
          <button
            key={product.id || i}
            onClick={() => handleOpen(product)}
            className="hover:bg-stone-100 p-2 rounded-md transition"
          >
            <div className="relative w-[300px] h-[400px]">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0]}
                  alt="img product"
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-md"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                  <p className="text-gray-500">لا توجد صورة</p>
                </div>
              )}
              
              <FaHeart
                onClick={(e) => {
                  e.stopPropagation();
                  addToFavorites({
                    id: product.id,
                    image: product.images && product.images[0] ? product.images[0] : '',
                    price: product.price,
                    title: product.description,
                  });
                }}
                className="absolute top-2 right-2 text-2xl text-white hover:text-red-600 transition cursor-pointer"
              />
            </div>
            <h1 className="mt-2 font-bold text-lg">{product.price} DH</h1>
            <p className="text-sm text-gray-600 truncate max-w-[300px]">{product.description}</p>
            <p className="text-xs text-gray-500 mt-1">typ: {product.type}</p>
            {product.size && (
              <p className="text-xs text-gray-500">size: {product.size}</p>
            )}
          </button>
        ))}
      </div>

      {/* Rest of your modal code remains the same */}
      {showDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="relative w-full max-w-[90%] md:max-w-3xl bg-white rounded-lg shadow-lg p-6">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>

            {zoomMode && selectedImage && (
              <div
                className="absolute top-7 left-96 w-[350px] h-[350px] z-50 pointer-events-none overflow-hidden border-2 border-black bg-white rounded shadow-md"
                style={{
                  backgroundImage: `url(${selectedImage})`,
                  backgroundSize: "300% 300%",
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundRepeat: "no-repeat",
                }}
              />
            )}

            <div className="flex flex-col md:flex-row gap-4 relative">
              <div
                className="w-full max-w-xs md:w-[300px] h-[400px] relative rounded overflow-hidden cursor-zoom-in"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={zoomMode ? handleMouseMove : undefined}
              >
                {selectedImage ? (
                  <Image
                    src={selectedImage}
                    alt="product detail"
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                    <p className="text-gray-500">لا توجد صورة</p>
                  </div>
                )}
              </div>

              <div
                className={`flex-1 transition-all duration-300 ${
                  zoomMode ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              >
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto">
                    {selectedProduct.images.map((img, index) => (
                      <div
                        key={index}
                        className={`w-16 h-20 relative border-2 rounded-md cursor-pointer flex-shrink-0 ${
                          selectedImage === img ? "border-black" : "border-transparent"
                        }`}
                        onClick={() => setSelectedImage(img)}
                      >
                        <Image
                          src={img}
                          alt={`img-${index}`}
                          fill
                          style={{ objectFit: "cover" }}
                          className="rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-green-600 mb-2">
                    {selectedProduct.price} DH
                  </h2>
                  <p className="text-gray-700 mb-2">{selectedProduct.description}</p>
                  <p className="text-sm text-gray-500">typ: {selectedProduct.type}</p>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  {selectedProduct.size && (
                    <div className="text-sm">
                      <span className="font-semibold">size:</span> {selectedProduct.size}
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-semibold">QTY:</span> {selectedProduct.qty || 0}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      addToCart({
                        id: selectedProduct.id,
                        image: selectedProduct.images && selectedProduct.images[0] ? selectedProduct.images[0] : '',
                        title: selectedProduct.description,
                        price: selectedProduct.price,
                      });
                      handleClose();
                    }}
                    disabled={!selectedProduct.qty || selectedProduct.qty === 0}
                    className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {selectedProduct.qty && selectedProduct.qty > 0 ? 'Add To Cart' : 'Not Available'}
                  </button>
                  
                  <button
                    onClick={() => {
                      addToFavorites({
                        id: selectedProduct.id,
                        image: selectedProduct.images && selectedProduct.images[0] ? selectedProduct.images[0] : '',
                        price: selectedProduct.price,
                        title: selectedProduct.description,
                      });
                    }}
                    className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition flex items-center gap-2"
                  >
                    <FaHeart />
                    Favorite
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Products;