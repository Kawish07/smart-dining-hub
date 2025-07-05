import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import '@/app/globals.css';
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { RestaurantProvider } from "@/context/RestaurantContext"; // Import RestaurantProvider
import CustomSessionProvider from "@/context/SessionProvider";
import { getServerSession } from "next-auth"; // Import getServerSession
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SpecialDishesProvider } from "@/context/SpecialDishesContext"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Smart Dining Hub",
  description: "The smart dining hub for seamless food ordering and delivery.",
};

export default async function RootLayout({ children }) {
  // Fetch the session on the server side
  const session = await getServerSession(authOptions);
  console.log("Server-side session:", session);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex flex-col min-h-screen">
        {/* Pass the session to CustomSessionProvider */}
        <CustomSessionProvider session={session}>
          <AuthProvider>
            <CartProvider>
              <RestaurantProvider>
              <SpecialDishesProvider> 
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
                </SpecialDishesProvider>
              </RestaurantProvider>
            </CartProvider>
          </AuthProvider>
        </CustomSessionProvider>
      </body>
    </html>
  );
}