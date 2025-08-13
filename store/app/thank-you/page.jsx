'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name");

  useEffect(() => {
    // You can trigger analytics or reset cart here
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-green-50 text-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-green-700 mb-4">Thank you {name || 'for your order'}! 🎉</h1>
        <p className="text-gray-700 mb-4">
          We’ve received your order and we’re getting it ready. You’ll receive a confirmation soon.
        </p>

        <div className="w-full h-40 mb-4 bg-[url('/truck-animation.gif')] bg-contain bg-center bg-no-repeat"></div>

        <button 
          className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition"
          onClick={() => window.location.href = '/'}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
