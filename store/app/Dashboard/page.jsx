"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiTrash2, FiEye } from "react-icons/fi";
import Image from "next/image";
import HeaderDashboard from "../Dashboard/HeaderDashboard/page";

const Dashboard = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [salesData, setSalesData] = useState({
    totalSales: 0,
    topCategories: []
  });

  // Status options in English
  const statusOptions = [
    "Processing",
    "Confirmed", 
    "Preparing",
    "Shipped",
    "Delivered",
    "Cancelled"
  ];

  const statusColors = {
    "Processing": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Confirmed": "bg-blue-100 text-blue-800 border-blue-200",
    "Preparing": "bg-purple-100 text-purple-800 border-purple-200",
    "Shipped": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Delivered": "bg-green-100 text-green-800 border-green-200",
    "Cancelled": "bg-red-100 text-red-800 border-red-200"
  };

  useEffect(() => {
    fetchOrders();
    calculateSalesData();
  }, []);

  const calculateSalesData = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      
      if (data.success && data.orders) {
        // Calculate total sales
        const totalSales = data.orders.reduce((sum, order) => {
          return sum + calculateTotal(order);
        }, 0);

        // Predefined store categories
        const predefinedCategories = ["Panties", "Shirts", "Jackets", "Underwear", "Accessories"];
        const categoryMap = {};
        
        // Initialize categories with zero values
        predefinedCategories.forEach(cat => {
          categoryMap[cat] = 0;
        });
        
        data.orders.forEach(order => {
          if (order.products && Array.isArray(order.products)) {
            order.products.forEach(product => {
              const itemTotal = product.itemTotal || (parseFloat(product.price) * (parseInt(product.quantity) || 1));
              
              // Find appropriate category in product name or category
              let matchedCategory = 'Accessories'; // Default
              
              const productText = (product.productName || product.category || '').toLowerCase();
              
              if (productText.includes('pantie') || productText.includes('سروال')) {
                matchedCategory = 'Panties';
              } else if (productText.includes('shirt') || productText.includes('قميص') || productText.includes('تيشيرت')) {
                matchedCategory = 'Shirts';
              } else if (productText.includes('jacket') || productText.includes('سترة') || productText.includes('جاكيت')) {
                matchedCategory = 'Jackets';
              } else if (productText.includes('underwear') || productText.includes('ملابس داخلية')) {
                matchedCategory = 'Underwear';
              } else if (productText.includes('accessory') || productText.includes('إكسسوار') || productText.includes('حقيبة') || productText.includes('جورب')) {
                matchedCategory = 'Accessories';
              }
              
              categoryMap[matchedCategory] += itemTotal;
            });
          } else {
            // For old orders
            const orderTotal = calculateTotal(order);
            const productText = (order.productName || '').toLowerCase();
            
            let matchedCategory = 'Accessories'; // Default
            
            if (productText.includes('pantie') || productText.includes('سروال')) {
              matchedCategory = 'Panties';
            } else if (productText.includes('shirt') || productText.includes('قميص') || productText.includes('تيشيرت')) {
              matchedCategory = 'Shirts';
            } else if (productText.includes('jacket') || productText.includes('سترة') || productText.includes('جاكيت')) {
              matchedCategory = 'Jackets';
            } else if (productText.includes('underwear') || productText.includes('ملابس داخلية')) {
              matchedCategory = 'Underwear';
            } else if (productText.includes('accessory') || productText.includes('إكسسوار') || productText.includes('حقيبة') || productText.includes('جورب')) {
              matchedCategory = 'Accessories';
            }
            
            categoryMap[matchedCategory] += orderTotal;
          }
        });

        // Sort categories by sales and take top two (only categories with sales)
        const sortedCategories = Object.entries(categoryMap)
          .filter(([, value]) => value > 0) // Only categories with sales
          .sort(([,a], [,b]) => b - a)
          .slice(0, 2);

        console.log("📊 Sales by category:", categoryMap);
        console.log("🏆 Top categories:", sortedCategories);

        setSalesData({
          totalSales,
          topCategories: sortedCategories
        });
      }
    } catch (error) {
      console.error("Error calculating sales data:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      
      if (data.success) {
        console.log("📦 Fetched orders:", data.orders);
        
        // Filter orders to show only today's orders
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        const todayOrders = data.orders.filter(order => {
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
          return orderDate === todayString;
        });
        
        console.log("📅 Today's orders:", todayOrders);
        setOrders(todayOrders);
        
        // Recalculate sales data when orders are updated
        calculateSalesData();
      } else {
        console.error("API Error:", data.error);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    }
  };

  // Update order status function from MyOrders
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          status: newStatus
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setOrders(orders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        ));
        alert('Order status updated successfully');
      } else {
        alert('Failed to update order: ' + data.error);
      }
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Error updating order');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: orderId })
      });

      const data = await res.json();
      
      if (data.success) {
        setOrders(orders.filter(order => order._id !== orderId));
        alert('Order deleted successfully');
      } else {
        alert('Failed to delete order: ' + data.error);
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Error deleting order');
    }
  };

  // Date formatting function from MyOrders
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    const englishDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return englishDate;
  };

  // Calculate total function from MyOrders
  const calculateTotal = (order) => {
    console.log("💰 Calculating total for order:", order);
    
    if (order.totalPrice && order.totalPrice > 0) {
      console.log("✅ Using stored totalPrice:", order.totalPrice);
      return parseFloat(order.totalPrice);
    }
    
    if (order.products && Array.isArray(order.products)) {
      const calculatedTotal = order.products.reduce((sum, product) => {
        if (product.itemTotal) {
          console.log(`📊 Using itemTotal for ${product.productName}:`, product.itemTotal);
          return sum + parseFloat(product.itemTotal);
        }
        
        const price = parseFloat(product.price) || 0;
        const quantity = parseInt(product.quantity) || 1;
        const itemTotal = price * quantity;
        
        console.log(`📊 Calculated for ${product.productName}:`, { price, quantity, itemTotal });
        return sum + itemTotal;
      }, 0);
      
      console.log("✅ Calculated total from products:", calculatedTotal);
      return calculatedTotal;
    }
    
    const fallbackPrice = parseFloat(order.price) || 0;
    console.log("⚠️ Using fallback price:", fallbackPrice);
    return fallbackPrice;
  };

  // Calculate total quantity
  const calculateTotalQuantity = (order) => {
    if (order.products && Array.isArray(order.products)) {
      return order.products.reduce((sum, product) => {
        return sum + (parseInt(product.quantity) || 1);
      }, 0);
    }
    return 1;
  };

  return (
    <div className="bg-[#E4E0E0] min-h-screen p-6">
      <HeaderDashboard/>
      
      {/* Cards */}
      <div className="flex flex-wrap gap-6 mb-6">
        {/* Sales Card */}
        <div className="bg-white p-6 rounded-xl shadow w-full md:w-[400px]">
          <h1 className="text-2xl font-bold text-black">
            {salesData.totalSales.toFixed(2)}DH
          </h1>
          <p className="text-gray-600 mb-4">Total Sales</p>
          
          {salesData.topCategories.length > 0 && (
            <>
              <div className="mt-4">
                <p className="text-sm text-gray-600">{salesData.topCategories[0]?.[0] || 'Top Category'}</p>
                <h2 className="text-lg font-semibold text-black">
                  {salesData.topCategories[0]?.[1]?.toFixed(2) || '0.00'}DH
                </h2>
              </div>
              {salesData.topCategories[1] && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">{salesData.topCategories[1][0]}</p>
                  <h2 className="text-lg font-semibold text-purple-600">
                    {salesData.topCategories[1][1].toFixed(2)}DH
                  </h2>
                </div>
              )}
            </>
          )}
          
          {salesData.topCategories.length === 0 && (
            <div className="mt-4 text-center text-gray-400">
              <p className="text-sm">No sales data yet</p>
            </div>
          )}
        </div>

        {/* Customers Card */}
        <div className="bg-white p-6 rounded-xl shadow w-full md:w-[400px]">
          <h1 className="text-2xl font-bold text-black">{orders.length}</h1>
          <p className="text-gray-600">Orders Today</p>
          
          <div className="mt-4">
            <p className="font-semibold text-gray-700">Recent Customers</p>
            <div className="flex mt-2">
              {orders.slice(0, 4).map((order, index) => (
                <div 
                  key={order._id}
                  className={`w-8 h-8 rounded-full text-white text-center text-sm flex items-center justify-center ${
                    index === 0 ? 'bg-yellow-400' :
                    index === 1 ? 'bg-blue-500' :
                    index === 2 ? 'bg-pink-500' : 'bg-green-500'
                  } ${index > 0 ? '-ml-2' : ''}`}
                  title={order.customerName}
                >
                  {order.customerName ? order.customerName.charAt(0).toUpperCase() : '?'}
                </div>
              ))}
              {orders.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-gray-700 text-white text-center text-xs flex items-center justify-center -ml-2">
                  +{orders.length - 4}
                </div>
              )}
              {orders.length === 0 && (
                <div className="text-gray-400 text-sm">No orders today</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Orders in same format as MyOrders */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">📦 Today's Orders ({orders.length})</h2>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders today</p>
            <p className="text-gray-400 text-sm mt-2">New orders will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">#</th>
                  <th className="text-left p-4 font-semibold">Order Number</th>
                  <th className="text-left p-4 font-semibold">Customer Name</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Phone</th>
                  <th className="text-left p-4 font-semibold">Items</th>
                  <th className="text-left p-4 font-semibold">Total</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Time</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 text-sm font-mono">
                      {order.orderNumber || `#${order._id.slice(-6)}`}
                    </td>
                    <td className="p-4 font-medium">{order.customerName}</td>
                    <td className="p-4 text-sm text-gray-600">{order.customerEmail}</td>
                    <td className="p-4 text-sm">{order.customerPhone}</td>
                    <td className="p-4 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {calculateTotalQuantity(order)}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-green-600">
                      {calculateTotal(order).toFixed(2)}DH
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status || "Processing"}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          statusColors[order.status] || statusColors["Processing"]
                        }`}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => deleteOrder(order._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Order"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal - Same modal from MyOrders but in English */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Order Details</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Order Number: {selectedOrder.orderNumber || `#${selectedOrder._id.slice(-6)}`}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                    👤 Customer Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                    <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                    <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                    📍 Delivery Address
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Address:</strong> {selectedOrder.address || 'Not specified'}</p>
                    <p><strong>City:</strong> {selectedOrder.city || 'Not specified'}</p>
                    <p><strong>Postal Code:</strong> {selectedOrder.postalCode || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                  🛍️ Products ({selectedOrder.products?.length || 1})
                </h3>
                {selectedOrder.products && Array.isArray(selectedOrder.products) ? (
                  <div className="space-y-3">
                    {selectedOrder.products.map((product, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        {product.image && (
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <Image 
                              src={product.image} 
                              alt={product.productName}
                              fill
                              style={{ objectFit: "cover" }}
                              className="rounded-md"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {product.productName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Price: {product.price}DH | Quantity: {product.quantity || 1}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {product.itemTotal || (product.price * (product.quantity || 1))}DH
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span>{selectedOrder.productName || 'Product not specified'}</span>
                    <span className="float-right font-semibold">${selectedOrder.price}</span>
                  </div>
                )}
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">📝 Notes</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-gray-800">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <span>Order Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm border ${
                        statusColors[selectedOrder.status] || statusColors["Processing"]
                      }`}>
                        {selectedOrder.status || "Processing"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
                      <span>Order Date:</span>
                      <span>{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
                      <span>Total Quantity:</span>
                      <span>{calculateTotalQuantity(selectedOrder)} items</span>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      {calculateTotal(selectedOrder).toFixed(2)}DH
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;