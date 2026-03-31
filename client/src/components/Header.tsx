import { useState } from "react";
import { Link } from "wouter";
import { Search, ShoppingCart, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onCartClick?: () => void;
  onSearchClick?: () => void;
  cartItemCount?: number;
  currentLanguage?: string;
  onLanguageChange?: (lang: string) => void;
  isAuthenticated?: boolean;
}

export default function Header({
  onCartClick,
  onSearchClick,
  cartItemCount = 0,
  currentLanguage = "FR",
  onLanguageChange,
  isAuthenticated = false,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const languages = [
    { code: "FR", label: "Français" },
    { code: "DE", label: "Deutsch" },
    { code: "EN", label: "English" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-background/95 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" data-testid="link-home">
            <h1 className="text-2xl font-serif font-bold hover-elevate px-2 py-1 rounded-md cursor-pointer">
              L'Arche des jeux
            </h1>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/products" data-testid="link-products">
              <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">
                Produits
              </span>
            </Link>
            <Link href="/support" data-testid="link-support">
              <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">
                Support
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-language"
                  className="hidden md:flex"
                >
                  {currentLanguage}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange?.(lang.code);
                      console.log(`Language changed to ${lang.code}`);
                    }}
                    data-testid={`option-language-${lang.code.toLowerCase()}`}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onSearchClick?.();
                console.log("Search clicked");
              }}
              data-testid="button-search"
            >
              <Search className="h-5 w-5" />
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-account">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link href="/account" data-testid="link-account">
                      Mon Compte
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => console.log("Logout clicked")}
                    data-testid="button-logout"
                  >
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Connexion
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => {
                onCartClick?.();
                console.log("Cart clicked");
              }}
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              <Link href="/products" data-testid="link-products-mobile">
                <span className="text-sm font-medium hover:text-primary transition-colors">
                  Produits
                </span>
              </Link>
              <Link href="/support" data-testid="link-support-mobile">
                <span className="text-sm font-medium hover:text-primary transition-colors">
                  Support
                </span>
              </Link>
              <div className="flex items-center gap-2 pt-2 border-t">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={currentLanguage === lang.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      onLanguageChange?.(lang.code);
                      console.log(`Language changed to ${lang.code}`);
                    }}
                    data-testid={`button-language-mobile-${lang.code.toLowerCase()}`}
                  >
                    {lang.code}
                  </Button>
                ))}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
