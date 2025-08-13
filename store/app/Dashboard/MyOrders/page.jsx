// /app/Dashboard/MyOrders/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { FiEdit, FiTrash2, FiEye, FiRefreshCw } from 'react-icons/fi';
import Image from 'next/image';
import HeaderDashboard from '../HeaderDashboard/page';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/orders');
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.orders || []);
        console.log("📦 Loaded orders:", data.orders);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Server connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      
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
        // Update local state
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
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete order
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

  // Format date in English
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total amount
  const calculateTotal = (order) => {
    console.log("💰 Calculating total for order:", order);
    
    // If totalPrice exists and is calculated correctly
    if (order.totalPrice && order.totalPrice > 0) {
      console.log("✅ Using stored totalPrice:", order.totalPrice);
      return parseFloat(order.totalPrice);
    }
    
    // If products exist, calculate from scratch
    if (order.products && Array.isArray(order.products)) {
      const calculatedTotal = order.products.reduce((sum, product) => {
        // Use itemTotal if available
        if (product.itemTotal) {
          console.log(`📊 Using itemTotal for ${product.productName}:`, product.itemTotal);
          return sum + parseFloat(product.itemTotal);
        }
        
        // Otherwise calculate price × quantity
        const price = parseFloat(product.price) || 0;
        const quantity = parseInt(product.quantity) || 1;
        const itemTotal = price * quantity;
        
        console.log(`📊 Calculated for ${product.productName}:`, { price, quantity, itemTotal });
        return sum + itemTotal;
      }, 0);
      
      console.log("✅ Calculated total from products:", calculatedTotal);
      return calculatedTotal;
    }
    
    // For old orders with single product
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
    return 1; // For old orders
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mr-3"></div>
          <span>Loading orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error!</p>
          <p>{error}</p>
          <button 
            onClick={fetchOrders}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <HeaderDashboard/>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📦 Order Management</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders currently</p>
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
                  <th className="text-left p-4 font-semibold">Items Count</th>
                  <th className="text-left p-4 font-semibold">Total</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Date</th>
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
                        {order.itemCount || (order.products?.length) || 1}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-green-600">
                      {calculateTotal(order).toFixed(2)}DH
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status || "Processing"}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        disabled={updatingStatus}
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
                      {formatDate(order.createdAt)}
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

      {/* Order Details Modal */}
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

              {/* Additional Notes */}
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
}