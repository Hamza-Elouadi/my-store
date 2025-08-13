// /app/Dashboard/AddProducts/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2 ,FiMessageSquare } from "react-icons/fi";
import Image from "next/image";
import { useFilter } from "@/app/context/FilterContext";
import HeaderDashboard from "../HeaderDashboard/page";
import { NextResponse } from "next/server";

function AddProducts() {
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    type: "",
    price: "",
    description: "",
    size: "",
    qty: "",
    images: [],
  });

  const { filterType, setFilterType } = useFilter("");
  const [searchTerm, setSearchTerm] = useState("");

 useEffect(() => {
  fetch("/api/products")
    .then((res) => res.json())
    .then((data) => {
      if (data.success) setProducts(data.products);
    })
    .catch((err) => console.error("خطأ في تحميل المنتجات:", err));
}, []);

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handleInputChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files.length > 0) {
      const array = Array.from(files);
      const base64s = await Promise.all(array.map(convertToBase64));
      setFormData((p) => ({
        ...p,
        images: [...p.images, ...base64s],
      }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

const handleAddOrUpdate = async (e) => {
  e.preventDefault();

  const productData = { ...formData };

  const method = formData.id ? "PUT" : "POST";
  const url = "/api/products";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    const result = await res.json();

    if (result.success) {
      if (method === "POST") {
        setProducts((prev) => [result.product, ...prev]);
      } else {
        // update product locally
        setProducts((prev) =>
          prev.map((p) => (p.id === productData.id ? { ...productData } : p))
        );
      }
      resetForm();
    } else {
      alert(result.error);
    }
  } catch (err) {
    alert("فشل في الاتصال بالسيرفر");
  }
};

  const resetForm = () => {
    setFormData({
      id: null,
      type: "Shirts",
      price: "",
      description: "",
      size: "",
      qty: "",
      images: [],
    });
    setShowForm(false);
  };

  const startEdit = (prod) => {
    setFormData(prod);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
  if (!confirm("واش متأكد بغيتي تحذف المنتج؟")) return;

  try {
    const res = await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const result = await res.json();

    if (result.success) {
      setProducts((p) => p.filter((x) => x.id !== id));
    } else {
      alert("فشل في الحذف: " + result.error);
    }
  } catch (err) {
    alert("خطأ في الاتصال بالسيرفر");
  }
};

  const filtered = products
    .filter((product) =>
      filterType === "All" ? true : product.type === filterType
    )
    .filter((product) =>
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="p-4">
      <HeaderDashboard/>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <button
          onClick={() => {
            resetForm();
            setShowForm((s) => !s);
          }}
          className="flex items-center gap-2 text-white bg-black px-4 py-2 rounded hover:bg-gray-800"
        >
          <FiPlus />
          {formData.id ? "تعديل منتوج" : "إضافة منتوج"}
        </button>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border p-2 rounded"
        >
          {["All", "Panties", "Shirts", "Jackets", "Underwear", "Accessories"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="🔍 بحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded flex-1"
        />
      </div>

      {showForm && (
        <form
          onSubmit={handleAddOrUpdate}
          className="border p-4 rounded mb-6 bg-white grid gap-4"
        >
          <select name="type" value={formData.type} onChange={handleInputChange} className="w-full border rounded p-2">
            {["Panties", "Shirts", "Jackets", "Underwear", "Accessories"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <input type="text" name="price" value={formData.price} onChange={handleInputChange}
            placeholder="الثمن" className="w-full border rounded p-2" />

          <textarea name="description" value={formData.description} onChange={handleInputChange}
            placeholder="الوصف" className="w-full border rounded p-2" />

          <input type="text" name="size" value={formData.size} onChange={handleInputChange}
            placeholder="المقاس" className="w-full border rounded p-2" />

          <input type="number" name="qty" value={formData.qty} onChange={handleInputChange}
            placeholder="الكمية" className="w-full border rounded p-2" />

          <input type="file" name="image" accept="image/*" multiple onChange={handleInputChange}
            className="w-full" />

          {formData.images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {formData.images.map((src, i) => (
                <Image key={i} src={src} alt={`Preview ${i}`} width={100} height={100} className="rounded" />
              ))}
            </div>
          )}

          <button type="submit" className="bg-green-600 text-white py-2 rounded hover:bg-green-700">
            {formData.id ? "تحديث" : "إضافة"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((product) => (
          <div key={product.id} className="border p-4 rounded shadow relative">
            <div className="absolute top-2 right-2 flex gap-2">
              <FiEdit className="cursor-pointer" onClick={() => startEdit(product)} />
              <FiTrash2 className="cursor-pointer" onClick={() => handleDelete(product.id)} />
            </div>

            {product.images.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto">
                {product.images.map((src, i) => (
                  <Image key={i} src={src} alt={`Product ${i}`} width={100} height={100} className="rounded" />
                ))}
              </div>
            )}

            <h3 className="font-bold text-lg">{product.price} DH</h3>
            <p className="text-sm text-gray-700">{product.description}</p>
            <p className="text-sm">Size: {product.size}</p>
            <p className="text-sm">QTY: {product.qty}</p>
            <p className="text-sm text-gray-500">Type: {product.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
export default AddProducts;