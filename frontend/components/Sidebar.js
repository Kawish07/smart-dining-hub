"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, History, X } from "lucide-react";

const Sidebar = ({ isOpen, toggle, user }) => {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-gray-800 bg-opacity-50 z-20"
          onClick={toggle}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 h-screen bg-white shadow-lg z-30 transition-all duration-300 ${
          isOpen ? "left-0" : "-left-64 md:left-0"
        } w-64 flex flex-col`}
      >
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-bold text-blue-600">User Dashboard</h2>
          <button onClick={toggle} className="md:hidden">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 p-5">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center p-3 rounded-lg ${
                pathname === "/dashboard"
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Package className="mr-3" size={18} />
              <span>Live Orders</span>
            </Link>

            <Link
              href="/dashboard/order-history"
              className={`flex items-center p-3 rounded-lg ${
                pathname === "/dashboard/order-history"
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <History className="mr-3" size={18} />
              <span>Order History</span>
            </Link>
          </div>
        </nav>

        <div className="p-5 border-t border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user?.email || "User"}
              </p>
              <p className="text-xs text-gray-500">Customer</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;