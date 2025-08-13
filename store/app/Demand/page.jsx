"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: ""
  });

  // جلب البيانات من localStorage عند تحميل الصفحة
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem("selectedProducts");
      const storedTotal = localStorage.getItem("totalPrice");
      
      if (storedProducts) {
        const products = JSON.parse(storedProducts);
        setSelectedProducts(products);
        console.log("📦 Loaded products from localStorage:", products);
      }
      
      if (storedTotal) {
        setTotalPrice(parseFloat(storedTotal));
        console.log("💰 Loaded total price:", storedTotal);
      }
      
      // إذا لم توجد منتجات، توجه المستخدم للعربة
      if (!storedProducts || JSON.parse(storedProducts).length === 0) {
        alert("لا توجد منتجات للشراء. سيتم توجيهك لصفحة المنتجات.");
        router.push("/Products");
      }
    } catch (error) {
      console.error("خطأ في جلب البيانات:", error);
      router.push("/Products");
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      alert("لا توجد منتجات للشراء");
      return;
    }

    try {
      setLoading(true);
      
      // إعداد بيانات الطلب مع كامل التفاصيل
      const orderPayload = {
        // بيانات العميل
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        
        // عنوان التسليم
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        
        // بيانات المنتجات مع التفاصيل الكاملة
        products: selectedProducts.map(product => ({
          productId: product.id,
          productName: product.title || 'منتج غير محدد',
          price: product.calculatedPrice || product.price || 0,
          quantity: product.quantity || parseInt(product.count) || 1,
          itemTotal: product.itemTotal || (product.calculatedPrice * (product.quantity || parseInt(product.count) || 1)),
          image: product.image
        })),
        
        // المجموع الكلي المحسوب بشكل صحيح
        totalPrice: totalPrice,
        itemCount: selectedProducts.length,
        
        // معلومات إضافية
        notes: formData.notes || "",
        orderSource: "website"
      };
      
      console.log("📤 Sending order data:", orderPayload);

      // إرسال الطلب للـ API
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const orderResult = await orderResponse.json();
      console.log("📥 Order API response:", orderResult);

      if (!orderResult.success) {
        throw new Error(orderResult.error || "فشل في حفظ الطلب");
      }

      // إرسال إيميل التأكيد (اختياري - إذا كان متوفر)
      try {
        await fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            orderNumber: orderResult.orderNumber,
            totalPrice: totalPrice,
            products: selectedProducts
          }),
        });
      } catch (emailError) {
        console.warn("تحذير: فشل في إرسال إيميل التأكيد:", emailError);
        // لا نوقف العملية إذا فشل الإيميل
      }

      // مسح البيانات المحفوظة
      localStorage.removeItem("selectedProducts");
      localStorage.removeItem("totalPrice");
      localStorage.removeItem("orderData");

      // عرض رسالة نجاح
      alert(`تم إرسال طلبك بنجاح! رقم الطلب: ${orderResult.orderNumber || 'غير متوفر'}`);
      
      // توجيه المستخدم
      router.push("/Products");

    } catch (error) {
      console.error("🚨 خطأ في إرسال الطلب:", error);
      alert("حدث خطأ في إرسال الطلب: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // حساب إجمالي الكمية
  const getTotalQuantity = () => {
    return selectedProducts.reduce((total, product) => {
      return total + (product.quantity || parseInt(product.count) || 1);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-3xl font-bold">إتمام الطلب</h1>
            <p className="mt-2 opacity-90">املأ البيانات لإتمام عملية الشراء</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* نموذج البيانات */}
              <div>
                <h2 className="text-xl font-semibold mb-6 text-gray-800">بيانات التسليم</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الكامل *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      placeholder="أدخل اسمك الكامل"
                      onChange={handleChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      placeholder="example@email.com"
                      onChange={handleChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      placeholder="+212 6xx xxx xxx"
                      onChange={handleChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العنوان *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      placeholder="أدخل عنوانك الكامل"
                      onChange={handleChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المدينة *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        placeholder="المدينة"
                        onChange={handleChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الرمز البريدي
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        placeholder="12345"
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملاحظات إضافية
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      placeholder="أي ملاحظات خاصة بالطلب..."
                      onChange={handleChange}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={loading || selectedProducts.length === 0}
                      className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition duration-300 ${
                        loading || selectedProducts.length === 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl"
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          جاري إرسال الطلب...
                        </div>
                      ) : (
                        "تأكيد الطلب والدفع عند الاستلام"
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* ملخص الطلب */}
              <div>
                <h2 className="text-xl font-semibold mb-6 text-gray-800">ملخص الطلب</h2>
                
                <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
                  {/* المنتجات */}
                  <div className="space-y-4 mb-6">
                    {selectedProducts.map((product, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            style={{ objectFit: "cover" }}
                            className="rounded-md"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {product.title || 'منتج غير محدد'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            الكمية: {product.quantity || parseInt(product.count) || 1}
                          </p>
                          <p className="text-sm font-medium text-blue-600">
                            {(product.calculatedPrice || product.price || 0).toFixed(2)} درهم
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {(product.itemTotal || ((product.calculatedPrice || product.price || 0) * (product.quantity || parseInt(product.count) || 1))).toFixed(2)} درهم
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ملخص المبالغ */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">عدد المنتجات:</span>
                      <span className="font-medium">{selectedProducts.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">إجمالي الكمية:</span>
                      <span className="font-medium">{getTotalQuantity()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المجموع الفرعي:</span>
                      <span className="font-medium">{totalPrice.toFixed(2)} درهم</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">رسوم التوصيل:</span>
                      <span className="font-medium text-green-600">مجاني</span>
                    </div>
                    <div className="border-t pt-2 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">المجموع النهائي:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {totalPrice.toFixed(2)} درهم
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* معلومات إضافية */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center text-blue-800">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">معلومات مهمة</span>
                    </div>
                    <ul className="mt-2 text-sm text-blue-700 space-y-1">
                      <li>• الدفع عند الاستلام متاح</li>
                      <li>• التوصيل مجاني لجميع المدن</li>
                      <li>• سيتم التواصل معك لتأكيد الطلب</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}