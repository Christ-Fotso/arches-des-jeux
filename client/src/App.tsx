import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider, useCart } from "@/contexts/CartContext";
import ShoppingCart from "@/components/ShoppingCart";
import ErrorBoundary from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductPage from "@/pages/ProductPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Support from "@/pages/Support";
import Legal from "@/pages/Legal";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminBrands from "@/pages/AdminBrands";
import AdminProducts from "@/pages/AdminProducts";
import AdminOrders from "@/pages/AdminOrders";
import AdminMessages from "@/pages/AdminMessages";
import DiscountManagement from "@/pages/DiscountManagement";
import Checkout from "@/pages/Checkout";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import MyOrders from "@/pages/MyOrders";
import About from "@/pages/About";
import NotFound from "@/pages/not-found";

function GlobalCart() {
  const { cartItems, cartOpen, setCartOpen, updateQuantity, removeItem } = useCart();
  const [, setLocation] = useLocation();

  return (
    <ShoppingCart
      isOpen={cartOpen}
      onClose={() => setCartOpen(false)}
      items={cartItems}
      onUpdateQuantity={updateQuantity}
      onRemoveItem={removeItem}
      onApplyDiscount={(code) => console.log(`Discount code: ${code}`)}
      onCheckout={() => setLocation("/checkout")}
    />
  );
}

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/product/:id" component={ProductPage} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password/:token" component={ResetPassword} />
        <Route path="/support" component={Support} />
        <Route path="/legal" component={Legal} />
        <Route path="/about" component={About} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/messages" component={AdminMessages} />
        <Route path="/admin/discounts" component={DiscountManagement} />
        <Route path="/admin/brands" component={AdminBrands} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/checkout-success" component={CheckoutSuccess} />
        <Route path="/my-orders" component={MyOrders} />
        <Route component={NotFound} />
      </Switch>
      <GlobalCart />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
