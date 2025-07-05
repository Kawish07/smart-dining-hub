"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from 'uuid';
import { CreditCardIcon, LockClosedIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";

const PaymentPage = () => {
  const { cart, clearCart, restaurantInfo } = useCart();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/login?redirect=/payment");
    }
  }, [sessionStatus, router]);

  const paymentMethods = [
    { 
      name: "EasyPaisa", 
      icon: "EP",
      details: { 
        instructionText: "Send payment to our EasyPaisa account and enter transaction ID below",
        accountNumber: "0312-3456789",
        accountName: "Smart Dining Hub",
        additionalInfo: "Use 'Food Payment' as reference"
      } 
    },
    { 
      name: "JazzCash", 
      icon: "JC",
      details: { 
        instructionText: "Send payment to our JazzCash account and enter transaction ID below",
        accountNumber: "0300-1234567",
        accountName: "Smart Dining Hub",
        additionalInfo: "Select 'Send to Mobile Account'"
      } 
    },
    { 
      name: "NayaPay", 
      icon: "NP",
      details: { 
        instructionText: "Send payment to our NayaPay account and enter transaction ID below",
        accountNumber: "0333-7654321",
        accountName: "Smart Dining Hub",
        additionalInfo: "Scan QR code at checkout"
      } 
    },
    { 
      name: "SadaPay", 
      icon: "SP",
      details: { 
        instructionText: "Send payment to our SadaPay account and enter transaction ID below",
        accountNumber: "0331-9876543",
        accountName: "Smart Dining Hub",
        additionalInfo: "Use wallet-to-wallet transfer"
      } 
    },
    { 
      name: "Allied Bank", 
      icon: "ABL",
      details: { 
        instructionText: "Transfer to our Allied Bank account and enter transaction ID below",
        accountNumber: "0012-3456789012",
        accountName: "Smart Dining Hub",
        iban: "PK36AABL0000001234567890",
        additionalInfo: "IBAN required for transfers"
      } 
    },
    { 
      name: "Cash", 
      icon: "Cash",
      details: { 
        instructionText: "Pay cash at the counter when picking up your order",
        accountNumber: "N/A",
        accountName: "Cash Payment",
        additionalInfo: "Provide phone number for order reference"
      } 
    }
  ];

  const validateOrderData = () => {
    if (!session) return "You must be logged in to proceed with payment.";
    if (cart.length === 0) return "Your cart is empty. Please add items before proceeding.";
    if (!paymentMethod || !transactionId) return "Please fill all required fields.";
    if (!restaurantInfo?.id || !restaurantInfo?.name || !restaurantInfo?.slug) {
      return "Restaurant information is missing. Please return to the menu and try again.";
    }
    
    const invalidItems = cart.filter(item => 
      !item.restaurantId || !item.restaurantName || !item.restaurantSlug
    );
    if (invalidItems.length > 0) return "Some items have missing restaurant information.";
    
    return null;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    const validationError = validateOrderData();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const orderData = {
        userId: session.user.email,
        restaurantId: restaurantInfo.id,
        restaurantName: restaurantInfo.name,
        restaurantSlug: restaurantInfo.slug,
        items: cart.map((item) => ({
          _id: item._id || uuidv4(),
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity || 1),
          specialInstructions: item.specialInstructions || "",
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName,
          restaurantSlug: item.restaurantSlug
        })),
        totalPrice: Number(cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0)),
        paymentMethod,
        transactionId,
        customerNotes,
        deliveryAddress: session.user.address ? {
          street: session.user.address.street || "",
          city: session.user.address.city || "",
          state: session.user.address.state || "",
          zipCode: session.user.address.zipCode || "",
          country: session.user.address.country || "Pakistan"
        } : { country: "Pakistan" }
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Payment failed. Please try again.");
      }

      const result = await response.json();
      setSuccessMessage(`Order #${result.order.orderNumber || 'N/A'} placed successfully!`);
      clearCart();
      setTimeout(() => router.push("/auth/dashboard"), 2000);
      
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message || "There was an error during payment.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalAmount = () => {
    return cart.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0).toFixed(2);
  };

  if (sessionStatus === "loading") {
    return <LoadingSpinner />;
  }

  if (cart.length === 0) {
    return <EmptyCart onReturn={() => router.push("/")} />;
  }

  if (!restaurantInfo?.id) {
    return <MissingRestaurantInfo onReturn={() => router.push("/")} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-white shadow-2xl rounded-xl p-8 border border-gray-200">
        <div className="text-center">
          <CreditCardIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Complete Payment</h2>
          <p className="mt-2 text-sm text-gray-600">Secure checkout for your order</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md text-center">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-md text-center">
            <CheckCircleIcon className="inline-block h-5 w-5 mr-1" />
            {successMessage}
          </div>
        )}

        <OrderSummary 
          cart={cart} 
          restaurantName={restaurantInfo.name} 
          totalAmount={calculateTotalAmount()} 
        />

        <PaymentForm
          paymentMethods={paymentMethods}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          transactionId={transactionId}
          setTransactionId={setTransactionId}
          customerNotes={customerNotes}
          setCustomerNotes={setCustomerNotes}
          isLoading={isLoading}
          handlePayment={handlePayment}
        />
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

const EmptyCart = ({ onReturn }) => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
    <div className="w-full max-w-md space-y-8 bg-white shadow-xl rounded-xl p-8 border border-gray-200 text-center">
      <ExclamationCircleIcon className="mx-auto h-12 w-12 text-yellow-500" />
      <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
      <p className="text-gray-600">Please add items to your cart before proceeding to payment.</p>
      <button
        onClick={onReturn}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Return to menu
      </button>
    </div>
  </div>
);

const MissingRestaurantInfo = ({ onReturn }) => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
    <div className="w-full max-w-md space-y-8 bg-white shadow-xl rounded-xl p-8 border border-gray-200 text-center">
      <ExclamationCircleIcon className="mx-auto h-12 w-12 text-yellow-500" />
      <h2 className="text-2xl font-bold text-gray-900">Missing Restaurant Information</h2>
      <p className="text-gray-600">We couldn't find information about the restaurant for your order.</p>
      <button
        onClick={onReturn}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Return to menu
      </button>
    </div>
  </div>
);

const OrderSummary = ({ cart, restaurantName, totalAmount }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <p className="text-lg font-semibold text-gray-800 text-center">
      Total Amount: <span className="text-blue-700">Rs {totalAmount}</span>
    </p>
    <div className="mt-4 border-t border-blue-200 pt-3">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Order Summary</h3>
      <ul className="space-y-2">
        {cart.map((item, index) => (
          <li key={index} className="flex justify-between text-sm">
            <span>{item.quantity || 1} × {item.name}</span>
            <span>Rs {((item.price * (item.quantity || 1)).toFixed(2))}</span>
          </li>
        ))}
      </ul>
    </div>
    {restaurantName && (
      <div className="mt-4 pt-3 border-t border-blue-200 text-sm text-gray-600">
        <p>Restaurant: {restaurantName}</p>
      </div>
    )}
  </div>
);

const PaymentForm = ({
  paymentMethods,
  paymentMethod,
  setPaymentMethod,
  transactionId,
  setTransactionId,
  customerNotes,
  setCustomerNotes,
  isLoading,
  handlePayment
}) => {
  const selectedMethod = paymentMethods.find(m => m.name === paymentMethod);
  
  return (
    <form onSubmit={handlePayment} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Payment Method
        </label>
        <div className="grid grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.name}
              onClick={() => setPaymentMethod(method.name)}
              className={`cursor-pointer p-3 rounded-lg border-2 text-center transition-all duration-300
                ${paymentMethod === method.name
                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-300'
                  : 'border-gray-300 hover:border-blue-400'}`}
            >
              <div className="h-10 flex items-center justify-center font-medium text-sm">
                {method.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {paymentMethod && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment Instructions</h3>
          <p className="text-sm text-gray-600 mb-3">
            {selectedMethod.details.instructionText}
          </p>
          
          <div className="mt-3 space-y-2 text-sm">
            {paymentMethod !== "Cash" && (
              <>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Account Name:</span>
                  <span className="text-gray-600">{selectedMethod.details.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Account Number:</span>
                  <span className="text-gray-600">{selectedMethod.details.accountNumber}</span>
                </div>
                {selectedMethod.details.iban && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">IBAN:</span>
                    <span className="text-gray-600 break-all text-right">{selectedMethod.details.iban}</span>
                  </div>
                )}
                {selectedMethod.details.additionalInfo && (
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <p className="text-xs text-blue-600">{selectedMethod.details.additionalInfo}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {paymentMethod && (
        <div>
          <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-2">
            {paymentMethod === "Cash" ? "Your Phone Number (Reference)" : "Transaction ID"}
            <span className="text-red-500">*</span>
          </label>
          <input
            id="transactionId"
            type="text"
            required
            disabled={isLoading}
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder={paymentMethod === "Cash" ? "Enter your phone number" : "Enter transaction ID"}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:opacity-50"
          />
        </div>
      )}

      <div>
        <label htmlFor="customerNotes" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          id="customerNotes"
          disabled={isLoading}
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          placeholder="Special delivery instructions"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 h-24 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !paymentMethod || !transactionId}
        className="w-full flex justify-center py-3 px-4
          border border-transparent rounded-md shadow-sm
          text-white bg-blue-600 hover:bg-blue-700
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          transition-all duration-300 disabled:opacity-50
          font-semibold items-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Complete Payment
          </>
        )}
      </button>
    </form>
  );
};

export default PaymentPage;