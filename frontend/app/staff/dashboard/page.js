"use client";
import { useState } from "react";
import { Menu, X, Package, Clock, Users, Settings, Bell, CreditCard } from "lucide-react";
import Link from "next/link";

export default function StaffDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen bg-white shadow-lg z-30 transition-all duration-300 ${
          isSidebarOpen ? "left-0" : "-left-64 md:left-0"
        } w-64 flex flex-col`}
      >
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-bold text-blue-600">Staff Dashboard</h2>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 p-5">
          <div className="space-y-1">
            <Link
              href="/staff/dashboard/orders"
              className="flex items-center p-3 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            >
              <Package className="mr-3" size={20} />
              <span>Order Management</span>
            </Link>
            <Link
              href="/staff/dashboard/reservation"
              className="flex items-center p-3 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            >
              <Clock className="mr-3" size={20} />
              <span>Reservation Management</span>
            </Link>
            
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-40 bg-white p-2 rounded-md shadow-md"
        >
          <Menu size={24} className="text-gray-700" />
        </button>

        {/* Page Content */}
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Welcome to the Staff Dashboard</h1>
        <p className="text-gray-600">Select an option from the sidebar to get started.</p>
      </div>
    </div>
  );
}