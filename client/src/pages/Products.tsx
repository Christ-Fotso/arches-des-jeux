import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Product } from "@shared/schema";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";

interface ProductWithReviews extends Product {
  ratingAverage: number;
  ratingCount: number;
  brandName: string | null;
}

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const { addToCart } = useCart();

  const { data: products, isLoading } = useQuery<ProductWithReviews[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = products?.filter((product) => {
    if (!searchQuery) return true;
    const title = product[`title${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof Product] as string;
    const description = product[`description${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof Product] as string;
    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-serif mb-4" data-testid="text-products-title">
            {t("products.title")}
          </h1>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder={t("products.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-products"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12" data-testid="text-loading">
            {t("common.loading")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts?.map((product) => {
              const titleKey = `title${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof Product;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => {
                    addToCart({
                      id: product.id,
                      title: product[titleKey] as string,
                      price: parseFloat(product.price),
                      image: product.imageUrl1,
                    });
                    console.log(`Added ${product.id} to cart`);
                  }}
                  onClick={() => setLocation(`/product/${product.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
