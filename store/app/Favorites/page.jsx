"use client";
import Image from "next/image";
import React, { useState } from "react";
import { BiCartDownload } from "react-icons/bi";
import { FaTrash, FaHeart } from "react-icons/fa";
import { useFavorites } from "@/app/context/FavoritesContext";

const productImages = [
  "/d7b373fc20696c7cbd3f0db43121ef72.jpg",
  "/a8325babc91ca98f20cccb105cc37222.jpg",
  "/image3.jpg",
  "/image4.jpg",
];

function FavoritesPage() {
  const { favorites, removeFromFavorites, addToFavorites } = useFavorites();
  const [showDetails, setShowDetails] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [selectedImage, setSelectedImage] = useState(productImages[0]);

  const handleOpen = () => setShowDetails(true);
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

  if (favorites.length === 0) {
    return (
      <p className="p-5 text-center text-gray-500">لا توجد منتجات في المفضلة</p>
    );
  }

  return (
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {favorites.map((item) => (
        <div
          key={item.id}
          className="w-[330px] hover:bg-stone-100 relative border rounded-md p-2 shadow hover:shadow-md transition"
        >
          <>
            <button
              onClick={handleOpen}
              className=" p-2 rounded-md transition duration-300 ease-in-out"
            >
              <div className="relative w-[300px] h-[400px]">
                <Image
                  src={item.image}
                  alt="img product"
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-md"
                />
              </div>
              <h1 className="mt-2 font-bold text-lg">{item.price}</h1>
              <p className="text-sm text-gray-600">{item.title}</p>
            </button>

            {showDetails && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
                <div className="relative w-full max-w-[90%] md:max-w-3xl bg-white rounded-lg shadow-lg p-6">
                  <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
                  >
                    ✕
                  </button>

                  {zoomMode && (
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
                      <Image
                        src={selectedImage}
                        alt="product detail"
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded"
                      />
                    </div>

                    <div
                      className={`flex-1 transition-all duration-300 ${
                        zoomMode
                          ? "opacity-0 pointer-events-none"
                          : "opacity-100"
                      }`}
                    >
                      <div className="flex gap-2 mb-4 overflow-x-auto">
                        {productImages.map((img, index) => (
                          <div
                            key={index}
                            className={`w-16 h-20 relative border-2 rounded-md cursor-pointer ${
                              selectedImage === img
                                ? "border-black"
                                : "border-transparent"
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

                      <div className="mb-4">
                        <h2 className="text-lg font-semibold">{item.price}</h2>
                        <p className="text-sm text-gray-700">{item.title}</p>
                      </div>

                      <div className="items-center justify-center mb-4">
                        <label className="text-sm">Size : S</label>
                        <label className="text-sm ml-2">QTY : 2</label>
                      </div>

                      <button className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 flex justify-center items-center gap-2">
                        ADD TO CART <BiCartDownload />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>

          <div className="flex justify-between mt-3">
            <button className="bg-black text-white py-1 px-3 rounded hover:bg-gray-800 flex items-center gap-1">
              ADD TO CART <BiCartDownload />
            </button>
            <button
              onClick={() => removeFromFavorites(item.id)}
              className="text-red-500 hover:text-red-700 text-lg"
              title="حذف من المفضلة"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FavoritesPage;
