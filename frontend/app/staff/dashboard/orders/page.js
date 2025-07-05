"use client";
import { useEffect, useState } from "react";
import {
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  Wallet,
  Banknote,
  Smartphone
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const PAYMENT_METHODS = {
  "EasyPaisa": {
    icon: Smartphone,
    accountNumber: "0312-3456789",
    accountName: "Smart Dining Hub",
    type: "Mobile Wallet",
    color: "text-purple-600"
  },
  "JazzCash": {
    icon: Smartphone,
    accountNumber: "0300-1234567",
    accountName: "Smart Dining Hub",
    type: "Mobile Wallet",
    color: "text-green-600"
  },
  "NayaPay": {
    icon: Wallet,
    accountNumber: "0333-7654321",
    accountName: "Smart Dining Hub",
    type: "Digital Wallet",
    color: "text-blue-600"
  },
  "SadaPay": {
    icon: Wallet,
    accountNumber: "0331-9876543",
    accountName: "Smart Dining Hub",
    type: "Digital Wallet",
    color: "text-red-600"
  },
  "Allied Bank": {
    icon: Banknote,
    accountNumber: "0012-3456789012",
    accountName: "Smart Dining Hub",
    type: "Bank Account",
    iban: "PK36AABL0000001234567890",
    color: "text-yellow-600"
  },
  "Cash": {
    icon: Wallet,
    accountNumber: "N/A",
    accountName: "Cash Payment",
    type: "In-Person",
    color: "text-gray-600"
  },
  "Credit Card": {
    icon: CreditCard,
    accountNumber: "****-****-****-1234",
    accountName: "Smart Dining Hub",
    type: "Card Payment",
    color: "text-indigo-600"
  },
  "Debit Card": {
    icon: CreditCard,
    accountNumber: "****-****-****-5678",
    accountName: "Smart Dining Hub",
    type: "Card Payment",
    color: "text-indigo-600"
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [verifyingTransaction, setVerifyingTransaction] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  const displayOrderId = (order) => {
    if (!order?._id) return 'N/A';
    try {
      return order.orderNumber || `#${order._id.toString().slice(-6)}`;
    } catch {
      return '#' + order._id;
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      if (!user?.token) throw new Error("User not authenticated");
      const response = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch orders: ${response.statusText}`);
      const data = await response.json();
      const ordersArray = Array.isArray(data)
        ? data
        : data.orders
          ? data.orders
          : data.data || [];
      setOrders(ordersArray);
      setError(null);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(error.message);
      if (error.message === "User not authenticated") {
        router.push("/auth/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPayment = async (orderId) => {
    try {
      setProcessingPayment(orderId);
      const response = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          staffId: user.id,
          transactionVerified: true, // Add this line
          verifiedBy: user.id        // And this line
        }),
      });

      if (!response.ok) throw new Error("Payment confirmation failed");
      toast.success("Payment confirmed and verified!");
      fetchOrders();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingPayment(null);
    }
  };

  const verifyTransaction = async (orderId) => {
    try {
      setVerifyingTransaction(orderId);
      const response = await fetch(`/api/orders/${orderId}/verify-transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ verifiedBy: user.id }),
      });

      if (!response.ok) throw new Error("Transaction verification failed");
      toast.success("Transaction verified successfully");
      fetchOrders();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setVerifyingTransaction(null);
    }
  };

  const getPaymentMethodDetails = (method) => {
    return PAYMENT_METHODS[method] || {
      icon: CreditCard,
      accountNumber: "Unknown",
      accountName: "Unknown",
      type: "Unknown",
      color: "text-gray-600"
    };
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update order status");
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(error.message);
    }
  };

  const getStatusBadge = (paymentStatus, transactionVerified) => {
    if (paymentStatus === "confirmed") {
      return {
        text: transactionVerified ? "Verified Payment" : "Payment Confirmed (Pending Verification)",
        className: transactionVerified
          ? "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center"
          : "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center",
        icon: transactionVerified ? CheckCircle : Clock
      };
    }

    return {
      text: "Payment Pending",
      className: "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center",
      icon: Clock
    };
  };

  const getKitchenStatusBadge = (kitchenStatus, paymentStatus) => {
    if (paymentStatus !== "confirmed") {
      return {
        text: "Awaiting Payment",
        className: "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center",
      };
    }

    switch (kitchenStatus) {
      case "Pending":
        return {
          text: "In Kitchen Queue",
          className: "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center",
        };
      case "Preparing":
        return {
          text: "Being Prepared",
          className: "bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs flex items-center",
        };
      case "Ready":
        return {
          text: "Ready for Pickup",
          className: "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center",
        };
      default:
        return {
          text: kitchenStatus || "Unknown",
          className: "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center",
        };
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <Package className="mr-2" size={24} />
        Order Management
      </h1>

      {error && (
        <div
          className={`mb-4 p-3 rounded ${error.includes("confirmed") || error.includes("sent to kitchen")
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
            }`}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center">
          <Clock className="animate-spin mr-2" size={20} />
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Account Details</th>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const paymentBadge = getStatusBadge(order.paymentStatus, order.transactionVerified);
                const kitchenBadge = getKitchenStatusBadge(order.kitchenStatus, order.paymentStatus);
                const paymentMethod = getPaymentMethodDetails(order.paymentMethod);
                const PaymentMethodIcon = paymentMethod.icon;

                return (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{displayOrderId(order)}</td>
                    <td className="py-3 px-4">{order.tableNumber || "1"}</td>
                    <td className="py-3 px-4 text-sm">
                      <ul>
                        {order.items.map((item, i) => (
                          <li key={i} className="flex justify-between">
                            <span>{item.name}</span>
                            <span className="text-gray-500">x{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-3 px-4 font-medium">Rs {order.totalPrice?.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <PaymentMethodIcon className={`h-4 w-4 mr-2 ${paymentMethod.color}`} />
                        <div>
                          <div className="text-sm font-medium">{order.paymentMethod}</div>
                          <div className="text-xs text-gray-500">{paymentMethod.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="group relative">
                        <button className="flex items-center text-blue-600 hover:text-blue-800 text-sm">
                          <Wallet className="h-4 w-4 mr-1" />
                          View Account
                        </button>
                        <div className="absolute left-0 z-10 mt-1 w-64 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block p-3">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-900">Payment Account Details</p>
                            <div className="border-t border-gray-200 pt-2">
                              <div className="flex justify-between py-1 text-sm">
                                <span className="text-gray-500">Account:</span>
                                <span className="font-medium">{paymentMethod.accountName}</span>
                              </div>
                              <div className="flex justify-between py-1 text-sm">
                                <span className="text-gray-500">Number:</span>
                                <span className="font-mono font-medium">{paymentMethod.accountNumber}</span>
                              </div>
                              {paymentMethod.iban && (
                                <div className="flex justify-between py-1 text-sm">
                                  <span className="text-gray-500">IBAN:</span>
                                  <span className="font-mono text-xs break-all">{paymentMethod.iban}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="group relative flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {order.transactionId || "N/A"}
                        </code>
                        {order.verificationTimestamp && (
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-white p-2 rounded shadow-lg border border-gray-200 z-10 text-xs w-64">
                            <p>
                              <span className="font-medium">Verified:</span> {new Date(order.verificationTimestamp).toLocaleString()}
                            </p>
                            {order.verifiedBy && (
                              <p>
                                <span className="font-medium">By:</span> {order.verifiedBy}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-1">
                        <span className={paymentBadge.className}>
                          <paymentBadge.icon className="h-3 w-3 mr-1" />
                          {paymentBadge.text}
                        </span>
                        <span className={kitchenBadge.className}>
                          {kitchenBadge.icon && <kitchenBadge.icon className="h-3 w-3 mr-1" />}
                          {kitchenBadge.text}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {order.paymentStatus !== 'confirmed' ? (
                        <button
                          onClick={() => confirmPayment(order._id)}
                          disabled={processingPayment === order._id}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center justify-center w-full"
                        >
                          {processingPayment === order._id ? (
                            <>
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            "Confirm Payment"
                          )}
                        </button>
                      ) : (
                        <select
                          className="text-xs border border-gray-300 rounded px-2 py-1 w-full bg-white"
                          value={order.kitchenStatus || "Pending"}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Ready">Ready</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}