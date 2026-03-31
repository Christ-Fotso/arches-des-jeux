import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, User, LogOut, Shield, Package } from "lucide-react";
import PromoBanner from "@/components/PromoBanner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { totalItems, setCartOpen } = useCart();
  const [location, setLocation] = useLocation();

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group" data-testid="link-home">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 shadow-sm group-hover:shadow-md transition-all">
                <img src="/favicon.png" alt="L'Arche des jeux" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-serif leading-tight hidden sm:block">
                L'Arche des jeux
              </h1>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <Link href="/products">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm" data-testid="link-products">
                {t("nav.products")}
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm" data-testid="link-about">
                {t("nav.about")}
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm" data-testid="link-support">
                {t("nav.support")}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs" data-testid="button-language">
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setLanguage("fr")} data-testid="button-lang-fr">
                  Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")} data-testid="button-lang-en">
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setCartOpen(true)}
                data-testid="button-cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full px-1 text-xs"
                    data-testid="badge-cart-count"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-user-menu">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium" data-testid="text-user-name">{user.name}</p>
                    <p className="text-xs text-muted-foreground" data-testid="text-user-email">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/my-orders")} data-testid="link-my-orders">
                    <Package className="mr-2 w-4 h-4" />
                    {t("myOrders.title")}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => setLocation("/admin")} data-testid="link-admin">
                      <Shield className="mr-2 w-4 h-4" />
                      {t("nav.admin")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      setLocation("/");
                    }}
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 w-4 h-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm" data-testid="link-login">
                  {t("nav.login")}
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <PromoBanner />
    </>
  );
}
