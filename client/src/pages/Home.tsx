import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import SearchDialog from "@/components/SearchDialog";
import heroImage from "@assets/Gemini_Generated_Image_r5qqhyr5qqhyr5qq_1762763605794.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@shared/schema";

interface ProductWithReviews extends Product {
  ratingAverage: number;
  ratingCount: number;
  brandName: string | null;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { language, t } = useLanguage();
  const { addToCart } = useCart();

  const { data: products = [], isLoading } = useQuery<ProductWithReviews[]>({
    queryKey: ["/api/products"],
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Hero
          title={t("home.title")}
          subtitle={t("home.subtitle")}
          ctaText={t("home.cta")}
          ctaLink="#products"
          backgroundImage="/hero-bg.png"
        />

        <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-4xl font-serif font-bold mb-8 text-center">
            {t("products.title")}
          </h2>
          {isLoading ? (
            <div className="text-center py-12">{t("common.loading")}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
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
                      console.log(`Added product ${product.id} to cart`);
                    }}
                    onClick={() => setLocation(`/product/${product.id}`)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <SearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={(query) => console.log("Search:", query)}
        results={products.slice(0, 3).map((p) => {
          const titleKey = `title${language}` as keyof Product;
          return {
            id: p.id,
            title: p[titleKey] as string,
            price: parseFloat(p.price),
            image: p.imageUrl1,
          };
        })}
        onResultClick={(id) => {
          setLocation(`/product/${id}`);
          setSearchOpen(false);
        }}
      />
    </div>
  );
}
