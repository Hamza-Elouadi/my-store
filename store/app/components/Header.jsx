"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FaHeart } from "react-icons/fa";
import { BiCartDownload } from "react-icons/bi";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";
import { useFilter } from "../context/FilterContext";

function Header() {
  const [showCart, setShowCart] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const { favorites } = useFavorites();
  const { cartItems } = useCart();
  const { setFilterType } = useFilter();

  const toggleCart = () => {
    setShowCart(!showCart);
    setShowFavorites(false);
  };

  const toggleFavorites = () => {
    setShowFavorites(!showFavorites);
    setShowCart(false);
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between p-4 bg-white shadow-md relative gap-4">
      {/* Logo */}
      <Image
        src="/567fe35fe2ac8b7c3f66567fa9c32194-removebg-preview.png"
        alt="logo"
        width={120}
        height={120}
        className="rounded-md"
      />

      {/* Filter Buttons */}
      <nav className="flex flex-wrap justify-center gap-2 md:gap-4">
        {["All", "Panties", "Shirts", "Jackets", "Underwear", "Accessories"].map((item) => (
          <button
            key={item}
            onClick={() => setFilterType(item)}
            className="px-3 py-1 md:px-4 md:py-2 rounded-2xl bg-[#D9D9D9] text-black hover:bg-[#623A3A] hover:text-white transition text-sm md:text-base"
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Icons */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Favorites */}
        <button onClick={toggleFavorites} className="text-xl md:text-2xl text-red-500">
          <FaHeart />
        </button>

        {/* Cart */}
        <button onClick={toggleCart} className="text-xl md:text-2xl text-gray-700">
          <BiCartDownload />
        </button>
      </div>

      {/* Favorites Panel */}
      {showFavorites && (
        <div className="absolute right-4 top-24 z-50 w-80 max-w-full border border-gray-300 bg-white shadow-xl rounded-md p-5">
          <button
            onClick={() => setShowFavorites(false)}
            className="absolute top-3 right-3 text-gray-600 hover:scale-110 transition"
          >
            ✕
          </button>
          <h3 className="text-lg font-semibold mb-4">Your Favorites</h3>
          <ul className="space-y-4 mt-2 max-h-60 overflow-y-auto">
            {favorites.length === 0 ? (
              <p className="text-sm text-gray-500">No favorites yet.</p>
            ) : (
              favorites.map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt=""
                    className="w-16 h-16 object-cover rounded-sm"
                  />
                  <div>
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    <p className="text-xs text-gray-500">{item.price}</p>
                  </div>
                </li>
              ))
            )}
          </ul>

          {/* Static Buttons */}
          <div className="mt-4 text-center space-y-2">
            <button
              className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition text-sm"
            >
              View All Favorites
            </button>
          </div>
        </div>
      )}

      {/* Cart Panel */}
      {showCart && (
        <div className="absolute right-4 top-24 z-50 w-80 max-w-full border border-gray-300 bg-white shadow-xl rounded-md p-5">
          <button
            onClick={() => setShowCart(false)}
            className="absolute top-3 right-3 text-gray-600 hover:scale-110 transition"
          >
            ✕
          </button>
          <ul className="space-y-4 mt-4 max-h-60 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 object-cover rounded-sm"
                />
                <div>
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.price}</p>
                </div>
              </div>
            ))}
          </ul>

          {/* Static Buttons */}
          <div className="mt-6 space-y-3 text-center">
            <button
              className="block border border-gray-400 py-2 px-4 text-sm text-gray-600 rounded hover:ring-1 hover:ring-gray-500 transition w-full"
            >
              View My Cart ({cartItems.length})
            </button>
            <button
              className="block bg-gray-700 py-2 px-4 text-sm text-white rounded hover:bg-gray-600 transition w-full"
            >
              Checkout
            </button>
            <button
              className="inline-block text-sm text-gray-500 underline hover:text-gray-600 transition"
            >
              Continue shopping
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
