"use client";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Sparkles,
  Gift,
  Zap
} from "lucide-react";

export default function CartAside({ setCartOpen }) {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setCartOpen(false);
    }, 300);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className={`fixed inset-0 z-[9999] flex justify-end transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Backdrop with matte emerald blur effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-teal-900/40 to-slate-900/50 backdrop-blur-md"
        onClick={handleClose}
      />
      
      <div 
        className={`
          relative w-full max-w-md h-full 
          bg-gradient-to-br from-slate-800 via-emerald-900/95 to-teal-900
          shadow-2xl overflow-hidden
          transform transition-transform duration-300 ease-out
          ${isClosing ? 'translate-x-full' : 'translate-x-0'}
          border-l border-emerald-500/20
        `}
      >
        {/* Matte animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-600/15 to-teal-600/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-teal-700/20 to-emerald-700/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 right-10 w-24 h-24 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 rounded-full blur-2xl animate-bounce" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <div className="relative">
                <ShoppingCart className="mr-3 text-emerald-400" size={32} />
                {totalItems > 0 && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                    {totalItems}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-200 bg-clip-text text-transparent">
                  Shopping Cart
                </h2>
                <p className="text-slate-400 text-sm">
                  {totalItems > 0 ? `${totalItems} item${totalItems > 1 ? 's' : ''}` : 'Empty cart'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="
                text-slate-400 hover:text-emerald-300 
                transition-all duration-300 p-2 rounded-full 
                hover:bg-emerald-500/10 hover:rotate-90 transform
                backdrop-blur-sm border border-emerald-500/20
                hover:shadow-lg hover:shadow-emerald-500/20
              "
            >
              <X size={20} />
            </button>
          </div>

          {/* Empty Cart State */}
          {cart.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-800/80 to-teal-800/80 rounded-full flex items-center justify-center shadow-xl border border-emerald-600/30">
                  <ShoppingCart size={40} className="text-emerald-400/80" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 text-emerald-400 animate-ping" size={16} />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-emerald-100">Your cart is empty</p>
                <p className="text-slate-400">Add some items to get started!</p>
              </div>
              <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse shadow-sm" />
            </div>
          )}

          {/* Cart Items */}
          {cart.length > 0 && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 cart-aside-container" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#10b981 rgba(16,185,129,0.1)'
            }}>
              {cart.map((item, index) => (
                <div 
                  key={item.id} 
                  className="
                    group relative bg-emerald-950/30 backdrop-blur-sm rounded-xl p-4 
                    border border-emerald-500/20 hover:border-emerald-400/40
                    transition-all duration-300 hover:transform hover:scale-[1.02]
                    hover:shadow-lg hover:shadow-emerald-500/20
                    animate-[slideInUp_0.5s_ease-out_forwards]
                  "
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Item content */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-emerald-100 truncate group-hover:text-emerald-200 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">
                        <span className="text-teal-400 font-medium">{item.price} Rs</span>
                        <span className="mx-2">×</span>
                        <span>{item.quantity}</span>
                      </p>
                      <p className="text-emerald-300 font-semibold mt-1">
                        Total: {item.price * item.quantity} Rs
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="
                          w-8 h-8 rounded-full bg-slate-700/60 backdrop-blur-sm
                          flex items-center justify-center
                          disabled:opacity-30 disabled:cursor-not-allowed
                          hover:bg-emerald-600/20 transition-all duration-200
                          hover:scale-110 active:scale-95
                          border border-emerald-500/20 hover:border-emerald-400/40
                        "
                      >
                        <Minus size={14} className="text-slate-300" />
                      </button>

                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">{item.quantity}</span>
                      </div>

                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="
                          w-8 h-8 rounded-full bg-slate-700/60 backdrop-blur-sm
                          flex items-center justify-center
                          hover:bg-emerald-600/20 transition-all duration-200
                          hover:scale-110 active:scale-95
                          border border-emerald-500/20 hover:border-emerald-400/40
                        "
                      >
                        <Plus size={14} className="text-slate-300" />
                      </button>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="
                          w-8 h-8 rounded-full bg-red-500/15 backdrop-blur-sm
                          flex items-center justify-center
                          hover:bg-red-500/30 transition-all duration-200
                          hover:scale-110 active:scale-95
                          border border-red-500/30 hover:border-red-400/50
                          group/delete
                        "
                      >
                        <Trash2 size={14} className="text-red-400 group-hover/delete:text-red-300" />
                      </button>
                    </div>
                  </div>

                  {/* Matte hover effect gradient */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 via-teal-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:via-teal-500/5 group-hover:to-emerald-500/5 transition-all duration-300 pointer-events-none" />
                </div>
              ))}
            </div>
          )}

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="mt-6 pt-6 border-t border-emerald-500/20 space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Subtotal</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  {calculateSubtotal()} Rs
                </span>
              </div>

              {/* Savings indicator */}
              <div className="flex items-center justify-center space-x-2 text-emerald-300 text-sm bg-emerald-950/30 rounded-lg py-2 px-3 border border-emerald-500/20">
                <Gift size={16} />
                <span>Free shipping on orders over 1000 Rs!</span>
              </div>

              {/* Checkout button */}
              <button
                onClick={() => {
                  router.push("/payment");
                  setCartOpen(false);
                }}
                className="
                  w-full relative overflow-hidden
                  bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600
                  hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500
                  text-white font-semibold py-4 rounded-xl
                  transition-all duration-300 transform hover:scale-[1.02]
                  shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
                  flex items-center justify-center space-x-3
                  group/checkout border border-emerald-400/20
                "
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover/checkout:translate-x-[100%] transition-transform duration-700" />
                <Zap className="relative z-10 group-hover/checkout:animate-pulse" size={20} />
                <span className="relative z-10">Proceed to Payment</span>
                <CreditCard className="relative z-10 group-hover/checkout:rotate-12 transition-transform duration-300" size={20} />
              </button>

              {/* Clear cart button */}
              <button
                onClick={clearCart}
                className="
                  w-full text-slate-400 hover:text-red-400 
                  text-sm py-2 transition-colors duration-200
                  hover:bg-red-500/10 rounded-lg border border-transparent
                  hover:border-red-500/20
                "
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>

        {/* Custom CSS for animations and scrollbar */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .cart-aside-container::-webkit-scrollbar {
              width: 4px;
            }
            
            .cart-aside-container::-webkit-scrollbar-track {
              background: rgba(16, 185, 129, 0.1);
              border-radius: 2px;
            }
            
            .cart-aside-container::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #10b981, #14b8a6);
              border-radius: 2px;
            }
            
            .cart-aside-container::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #059669, #0d9488);
            }
          `
        }} />
      </div>
    </div>
  );
}