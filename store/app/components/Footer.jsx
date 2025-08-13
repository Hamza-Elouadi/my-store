'use client';

import { FaFacebook, FaInstagram, FaXTwitter, FaTiktok, FaYoutube, FaPinterest } from 'react-icons/fa6';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[#8F5A5A] text-white pt-8 pb-4 px-4">
      <div className="max-w-5xl mx-auto text-center">
        {/* Logo & Offer Text */}
        <div className="flex flex-col items-center">
          <Image
            src="/567fe35fe2ac8b7c3f66567fa9c32194-removebg-preview.png"
            alt="store logo"
            width={200}
            height={200}
          />
          <p className="text-black mt-4 text-sm">
            we offer very interesting offers, you <br />
            just have to follow us <span className="text-red-600">to</span> get all the new
          </p>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center gap-6 mt-6 text-black text-3xl">
          <a href="#" className="hover:text-white transition"><FaFacebook /></a>
          <a href="#" className="hover:text-white transition"><FaInstagram /></a>
          <a href="#" className="hover:text-white transition"><FaXTwitter /></a>
          <a href="#" className="hover:text-white transition"><FaTiktok /></a>
          <a href="#" className="hover:text-white transition"><FaYoutube /></a>
          <a href="#" className="hover:text-white transition"><FaPinterest /></a>
        </div>

        {/* Payment & Rights */}
        <div className="mt-6 text-sm text-black">
          <p className="text-white text-sm italic mt-2">
             🚚 Cash on delivery available across Morocco
          </p>
          <p className="text-xs">&copy; {new Date().getFullYear()} Clothing Store. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}