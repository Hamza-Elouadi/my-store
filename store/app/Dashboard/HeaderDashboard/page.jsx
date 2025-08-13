"use client";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiHome,
  FiUser,
  FiBarChart2,
  FiBox,
  FiList,
  FiMessageSquare,
} from "react-icons/fi";

export default function HeaderDashboard() {
  const router = useRouter();

  const buttonClass =
    "flex items-center justify-center bg-[#0F1B6C] text-white w-12 h-12 rounded-full hover:bg-[#101e75] transition";

  return (
    <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start mb-6">
      {/* الصفحة الرئيسية */}
      <button
        onClick={() => router.push("/Dashboard")}
        className={buttonClass}
        title="الصفحة الرئيسية"
      >
        <FiHome className="text-xl" />
      </button>

      {/* المستخدم */}
      <button
        onClick={() => router.push("/Dashboard/Users")}
        className={buttonClass}
        title="المستخدم"
      >
        <FiUser className="text-xl" />
      </button>

      {/* الإحصائيات */}
      <button
        onClick={() => router.push("/Dashboard/statistics")}
        className={buttonClass}
        title="الإحصائيات"
      >
        <FiBarChart2 className="text-xl" />
      </button>

      {/* الطلبات */}
      <button
        onClick={() => router.push("/Dashboard/MyOrders")}
        className={buttonClass}
        title="الطلبات"
      >
        <FiList className="text-xl" />
      </button>

      {/* الرسائل */}
      <button
        onClick={() => router.push("/Dashboard/messages")}
        className={buttonClass}
        title="الرسائل"
      >
        <FiMessageSquare className="text-xl" />
      </button>

      {/* إضافة منتج */}
      <button
        onClick={() => router.push("/Dashboard/AddProducts")}
        className="flex items-center justify-center bg-green-600 text-white w-12 h-12 rounded-full hover:bg-green-700 transition"
        title="إضافة منتج"
      >
        <FiPlus className="text-xl" />
      </button>
    </div>
  );
}
