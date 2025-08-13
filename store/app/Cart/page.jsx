"use client";
import Image from "next/image";
import React, { useState, useEffect, useMemo } from "react";
import { FaTrash, FaExclamationTriangle } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";

function CartPage() {
  const { cartItems, removeFromCart } = useCart();
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // إضافة state لحالة المنتجات
  const [productAvailability, setProductAvailability] = useState({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const extractPrice = (priceString) => {
    if (!priceString) return 0;
    const str = priceString.toString().trim();
    
    // Try to find price with currency symbols first
    let match = str.match(/(\d+(?:[.,]\d+)?)\s*(?:درهم|dh|د\.م|mad)/i);
    if (match) return parseFloat(match[1].replace(",", ".")) || 0;
    
    // Try to find any number
    match = str.match(/(\d+(?:[.,]\d+)?)/);
    if (match) return parseFloat(match[1].replace(",", ".")) || 0;
    
    // Try direct conversion
    const directNumber = parseFloat(str.replace(",", "."));
    return isNaN(directNumber) ? 0 : directNumber;
  };

  // دالة للتحقق من توفر المنتجات
  const checkProductAvailability = async () => {
    if (cartItems.length === 0) return;
    
    setIsCheckingAvailability(true);
    console.log("🔍 Checking availability for cart items...");
    
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      
      if (data.success) {
        const availableProducts = data.products;
        const availabilityMap = {};
        
        cartItems.forEach((cartItem, index) => {
          const uniqueKey = `${cartItem.id}-${index}`;
          
          // البحث عن المنتج في قاعدة البيانات
          const dbProduct = availableProducts.find(p => 
            p.id === cartItem.id || p._id === cartItem.id
          );
          
          if (!dbProduct) {
            // المنتج محذوف نهائياً من قاعدة البيانات
            availabilityMap[uniqueKey] = {
              status: 'deleted',
              message: 'هذا المنتج لم يعد متوفراً',
              availableQty: 0,
              requestedQty: parseInt(cartItem.count) || 1
            };
          } else {
            const availableQty = parseInt(dbProduct.qty) || 0;
            const requestedQty = parseInt(cartItem.count) || 1;
            
            if (availableQty === 0) {
              // المنتج نفد المخزون
              availabilityMap[uniqueKey] = {
                status: 'out_of_stock',
                message: 'نفد المخزون',
                availableQty: 0,
                requestedQty: requestedQty
              };
            } else if (availableQty < requestedQty) {
              // الكمية المتاحة أقل من المطلوبة
              availabilityMap[uniqueKey] = {
                status: 'insufficient_stock',
                message: `متوفر فقط ${availableQty} قطعة`,
                availableQty: availableQty,
                requestedQty: requestedQty
              };
            } else {
              // المنتج متوفر بالكمية المطلوبة
              availabilityMap[uniqueKey] = {
                status: 'available',
                message: 'متوفر',
                availableQty: availableQty,
                requestedQty: requestedQty
              };
            }
          }
          
          console.log(`📦 Product ${uniqueKey}:`, availabilityMap[uniqueKey]);
        });
        
        setProductAvailability(availabilityMap);
      }
    } catch (error) {
      console.error("❌ Error checking product availability:", error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // التحقق من التوفر عند تحميل الصفحة وعند تغيير العربة
  useEffect(() => {
    checkProductAvailability();
  }, [cartItems]);

  // Use useMemo to calculate total price more efficiently - only for available items
  const totalPrice = useMemo(() => {
    if (selectedItems.length === 0) return 0;
    
    return selectedItems.reduce((total, uniqueKey) => {
      // تحقق من حالة المنتج
      const availability = productAvailability[uniqueKey];
      if (!availability || availability.status === 'deleted' || availability.status === 'out_of_stock') {
        return total; // لا تحسب المنتجات غير المتوفرة
      }
      
      // Extract index from unique key
      const itemIndex = parseInt(uniqueKey.split('-').pop());
      const item = cartItems[itemIndex];
      
      if (item) {
        const price = extractPrice(item.price);
        // استخدم الكمية المتاحة إذا كانت أقل من المطلوبة
        let quantity = parseInt(item.count) || 1;
        if (availability.status === 'insufficient_stock') {
          quantity = availability.availableQty;
        }
        
        console.log(`💰 Calculating for item ${itemIndex}:`, { price, quantity, total: price * quantity });
        return total + (price * quantity);
      }
      return total;
    }, 0);
  }, [selectedItems, cartItems, productAvailability]);

  // Calculate if all items are selected
  const selectAll = useMemo(() => {
    return cartItems.length > 0 && selectedItems.length === cartItems.length;
  }, [selectedItems.length, cartItems.length]);

  const handleItemSelect = (itemId, itemIndex) => {
    const uniqueKey = `${itemId}-${itemIndex}`;
    const availability = productAvailability[uniqueKey];
    
    // منع تحديد المنتجات غير المتوفرة
    if (availability && (availability.status === 'deleted' || availability.status === 'out_of_stock')) {
      alert(availability.message);
      return;
    }
    
    console.log("🔘 Selecting item:", { itemId, itemIndex, uniqueKey });
    console.log("🔍 Item details:", cartItems[itemIndex]);
    
    setSelectedItems((prev) => {
      const newSelection = prev.includes(uniqueKey) 
        ? prev.filter((id) => id !== uniqueKey)
        : [...prev, uniqueKey];
      
      console.log("📊 Previous selection:", prev);
      console.log("📊 New selection:", newSelection);
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    console.log("🔘 Select All clicked, current selectAll:", selectAll);
    
    if (selectAll) {
      console.log("🔄 Deselecting all items");
      setSelectedItems([]);
    } else {
      console.log("🔄 Selecting all available items");
      // حدد فقط المنتجات المتوفرة
      const availableKeys = cartItems
        .map((item, index) => {
          const uniqueKey = `${item.id}-${index}`;
          const availability = productAvailability[uniqueKey];
          return availability && availability.status !== 'deleted' && availability.status !== 'out_of_stock' 
            ? uniqueKey 
            : null;
        })
        .filter(Boolean);
      
      console.log("📋 Available item keys:", availableKeys);
      setSelectedItems(availableKeys);
    }
  };

  // في CartPage - تعديل دالة handleBuySelected
  const handleBuySelected = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one available product to buy");
      return;
    }
    
    const selectedProducts = selectedItems.map(uniqueKey => {
      const itemIndex = parseInt(uniqueKey.split('-').pop());
      const item = cartItems[itemIndex];
      const availability = productAvailability[uniqueKey];
      
      if (!item || !availability) return null;
      
      // تعديل الكمية حسب المتوفر
      let finalQuantity = parseInt(item.count) || 1;
      if (availability.status === 'insufficient_stock') {
        finalQuantity = availability.availableQty;
      }
      
      return {
        ...item,
        count: finalQuantity,
        quantity: finalQuantity
      };
    }).filter(Boolean);
    
    const productsWithCalculatedPrice = selectedProducts.map((product) => ({
      ...product,
      calculatedPrice: extractPrice(product.price),
      quantity: parseInt(product.count) || 1,
      itemTotal: extractPrice(product.price) * (parseInt(product.count) || 1)
    }));
    
    console.log("🛒 Selected products for purchase:", productsWithCalculatedPrice);
    console.log("💰 Total price:", totalPrice.toFixed(2));
    
    const orderData = {
      products: productsWithCalculatedPrice,
      totalPrice: totalPrice,
      itemCount: selectedItems.length
    };
    
    localStorage.setItem("selectedProducts", JSON.stringify(productsWithCalculatedPrice));
    localStorage.setItem("totalPrice", totalPrice.toFixed(2));
    localStorage.setItem("orderData", JSON.stringify(orderData));
    
    router.push("/Demand");
  };

  // تعديل زر Buy This Product Only أيضاً
  const buyThisProductOnly = (currentItem, itemIndex) => {
    const uniqueKey = `${currentItem.id}-${itemIndex}`;
    const availability = productAvailability[uniqueKey];
    
    if (!availability || availability.status === 'deleted' || availability.status === 'out_of_stock') {
      alert(availability?.message || "هذا المنتج غير متوفر");
      return;
    }
    
    let finalQuantity = parseInt(currentItem.count) || 1;
    if (availability.status === 'insufficient_stock') {
      finalQuantity = availability.availableQty;
      if (!confirm(`المتوفر فقط ${finalQuantity} قطعة. هل تريد المتابعة؟`)) {
        return;
      }
    }
    
    const singleProductTotal = extractPrice(currentItem.price) * finalQuantity;
    
    const singleProduct = [{
      ...currentItem,
      count: finalQuantity,
      calculatedPrice: extractPrice(currentItem.price),
      quantity: finalQuantity,
      itemTotal: singleProductTotal
    }];
    
    const orderData = {
      products: singleProduct,
      totalPrice: singleProductTotal,
      itemCount: 1
    };
    
    localStorage.setItem("selectedProducts", JSON.stringify(singleProduct));
    localStorage.setItem("totalPrice", singleProductTotal.toFixed(2));
    localStorage.setItem("orderData", JSON.stringify(orderData));
    
    router.push("/Demand");
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one product to delete");
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
      selectedItems.forEach((uniqueKey) => {
        const itemIndex = parseInt(uniqueKey.split('-').pop());
        const item = cartItems[itemIndex];
        if (item) {
          removeFromCart(item.id);
        }
      });
      setSelectedItems([]);
    }
  };

  const handleOpen = (item) => {
    setSelectedImage(item.image);
    setCurrentItem(item);
    setShowDetails(true);
  };

  const handleClose = () => {
    setShowDetails(false);
    setZoomMode(false);
  };

  const handleMouseEnter = () => setZoomMode(true);
  const handleMouseLeave = () => setZoomMode(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  // Clean up selected items when cart items change
  useEffect(() => {
    setSelectedItems(prev => 
      prev.filter(uniqueKey => {
        const itemIndex = parseInt(uniqueKey.split('-').pop());
        return itemIndex < cartItems.length && cartItems[itemIndex];
      })
    );
  }, [cartItems]);

  if (cartItems.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-4">Add some products to get started!</p>
          <button 
            onClick={() => router.push("/Products")}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Debug Info - Remove in production */}
      <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
        <strong>Debug:</strong> Total Items: {cartItems.length} | Selected: {selectedItems.length} | 
        Total Price: {totalPrice.toFixed(2)} MAD | Select All: {selectAll.toString()} | 
        Checking: {isCheckingAvailability.toString()}
      </div>

      {/* Refresh Availability Button */}
      <div className="mb-4">
        <button
          onClick={checkProductAvailability}
          disabled={isCheckingAvailability}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm"
        >
          {isCheckingAvailability ? "جارِ التحقق..." : "🔄 تحديث حالة المنتجات"}
        </button>
      </div>

      {/* Control Panel */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium">
                تحديد الكل ({cartItems.length})
              </span>
            </label>

            {selectedItems.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 transition-colors"
              >
                <FaTrash className="text-xs" /> 
                حذف ({selectedItems.length})
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-600">
                محدد: {selectedItems.length} من {cartItems.length}
              </p>
              <p className="text-lg font-bold text-green-600">
                المجموع: {totalPrice.toFixed(2)} MAD
              </p>
            </div>
            <button
              onClick={handleBuySelected}
              disabled={selectedItems.length === 0}
              className={`px-6 py-2 rounded-md transition duration-300 font-medium ${
                selectedItems.length > 0
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              شراء المحدد ({selectedItems.length})
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {cartItems.map((item, index) => {
          const numericPrice = extractPrice(item.price);
          const uniqueKey = `${item.id}-${index}`;
          const isSelected = selectedItems.includes(uniqueKey);
          const availability = productAvailability[uniqueKey];
          const isUnavailable = availability && (availability.status === 'deleted' || availability.status === 'out_of_stock');
          
          return (
            <div
              key={uniqueKey}
              className={`relative border rounded-lg p-3 shadow-sm transition-all duration-200 ${
                isUnavailable
                  ? "border-red-200 bg-red-50 opacity-75"
                  : isSelected
                  ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                  : "hover:bg-gray-50 hover:shadow-md"
              }`}
            >
              {/* Availability Warning */}
              {availability && availability.status !== 'available' && (
                <div className={`absolute top-1 right-1 z-20 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  availability.status === 'deleted' || availability.status === 'out_of_stock'
                    ? "bg-red-500 text-white"
                    : "bg-yellow-500 text-white"
                }`}>
                  <FaExclamationTriangle className="text-xs" />
                  {availability.message}
                </div>
              )}

              {/* Selection Checkbox */}
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleItemSelect(item.id, index)}
                  disabled={isUnavailable}
                  className={`w-4 h-4 rounded bg-white border-2 focus:ring-blue-500 ${
                    isUnavailable 
                      ? "text-gray-400 border-gray-300 cursor-not-allowed"
                      : "text-blue-600 border-gray-300"
                  }`}
                />
              </div>

              {/* Product Content */}
              <button
                onClick={() => handleOpen(item)}
                className="block w-full text-left"
                disabled={isUnavailable}
              >
                <div className={`relative w-full h-[300px] mb-3 ${isUnavailable ? 'opacity-50' : ''}`}>
                  <Image
                    src={item.image}
                    alt="product"
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-md"
                  />
                  {isUnavailable && (
                    <div className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">غير متوفر</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <h1 className={`font-bold text-lg ${isUnavailable ? 'text-gray-400' : 'text-gray-800'}`}>
                    {item.price}
                  </h1>
                  <p className={`text-sm line-clamp-2 ${isUnavailable ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.title}
                  </p>
                  
                  {item.count && item.count > 1 && (
                    <div className="text-xs text-gray-500">
                      <span>الكمية المطلوبة: {item.count}</span>
                      {availability && availability.status === 'insufficient_stock' && (
                        <span className="text-yellow-600 font-medium block">
                          ⚠️ متوفر فقط: {availability.availableQty}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <p className={`text-sm font-medium ${isUnavailable ? 'text-gray-400' : 'text-blue-600'}`}>
                    {numericPrice.toFixed(2)} MAD
                    {item.count && item.count > 1 && (
                      <span className="text-xs text-gray-500">
                        {' '}(× {item.count} = {(numericPrice * item.count).toFixed(2)} MAD)
                      </span>
                    )}
                  </p>
                </div>
              </button>

              {/* Actions */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
                  title="إزالة من العربة"
                >
                  <FaTrash />
                </button>
                
                <div className="text-xs text-gray-500">
                  {isUnavailable 
                    ? "غير متوفر" 
                    : isSelected 
                    ? "✓ محدد" 
                    : "اضغط للتحديد"
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Details Modal */}
      {showDetails && currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl z-10"
            >
              ✕
            </button>

            {/* Zoom Window */}
            {zoomMode && selectedImage && (
              <div
                className="absolute top-16 right-16 w-[350px] h-[350px] z-50 pointer-events-none overflow-hidden border-2 border-black bg-white rounded shadow-lg"
                style={{
                  backgroundImage: `url(${selectedImage})`,
                  backgroundSize: "300% 300%",
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundRepeat: "no-repeat",
                }}
              />
            )}

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Image Section */}
              <div
                className="w-full lg:w-1/2 max-w-lg mx-auto lg:mx-0"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={zoomMode ? handleMouseMove : undefined}
              >
                <div className="relative w-full h-[500px] rounded-lg overflow-hidden cursor-zoom-in">
                  <Image
                    src={selectedImage}
                    alt="Product detail"
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-lg"
                  />
                </div>
              </div>

              {/* Details Section */}
              <div className={`flex-1 transition-all duration-300 ${
                zoomMode ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {currentItem.price}
                    </h2>
                    <p className="text-gray-600 mb-3">{currentItem.title}</p>
                    <p className="text-xl font-semibold text-blue-600">
                      {extractPrice(currentItem.price).toFixed(2)} MAD
                    </p>
                  </div>

                  <div className="flex items-center gap-6 py-4 border-y">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Size:</span>
                      <span className="ml-2">M</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Quantity:</span>
                      <span className="ml-2">{currentItem.count || 1}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        const currentIndex = cartItems.findIndex(item => item === currentItem);
                        handleItemSelect(currentItem.id, currentIndex);
                      }}
                      className={`w-full py-3 rounded-lg font-medium transition duration-300 ${
                        selectedItems.includes(`${currentItem.id}-${cartItems.findIndex(item => item === currentItem)}`)
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {selectedItems.includes(`${currentItem.id}-${cartItems.findIndex(item => item === currentItem)}`) ? "✓ محدد للشراء" : "تحديد للشراء"}
                    </button>
                    
                    <button 
                      onClick={() => {
                        const currentIndex = cartItems.findIndex(item => item === currentItem);
                        buyThisProductOnly(currentItem, currentIndex);
                      }}
                      className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 font-medium transition duration-300"
                    >
                      شراء هذا المنتج فقط ({(extractPrice(currentItem.price) * (parseInt(currentItem.count) || 1)).toFixed(2)} MAD)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;