import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import ProductDetail from "@/components/ProductDetail";
import Footer from "@/components/Footer";
import SearchDialog from "@/components/SearchDialog";
import ReviewDialog from "@/components/ReviewDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { format } from "date-fns";
import type { Product } from "@shared/schema";

export default function ProductPage() {
  const [match, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { addToCart, updateQuantity, cartItems } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ["/api/products", params?.id],
    queryFn: () => api.products.getById(params!.id),
    enabled: !!params?.id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["/api/reviews", params?.id],
    enabled: !!params?.id,
  });

  if (!match || !params?.id) {
    setLocation("/");
    return null;
  }

  const languageKey = language.charAt(0).toUpperCase() + language.slice(1);
  const getLocalizedData = (prod: Product) => ({
    title: prod[`title${languageKey}` as keyof Product] as string,
    description: prod[`description${languageKey}` as keyof Product] as string,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        {isLoading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : product ? (
          <div className="container max-w-6xl mx-auto px-4 space-y-12">
            <ProductDetail
              title={getLocalizedData(product).title}
              description={getLocalizedData(product).description}
              price={parseFloat(product.price)}
              image1={product.imageUrl1}
              image2={product.imageUrl2}
              deliveryEstimate="2-3 jours ouvrables"
              onAddToCart={(quantity) => {
                const localized = getLocalizedData(product);
                addToCart({
                  id: product.id,
                  title: localized.title,
                  price: parseFloat(product.price),
                  image: product.imageUrl1,
                }, quantity);
                console.log(`Added ${quantity} items to cart`);
              }}
            />

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <CardTitle>{t("reviews.title")}</CardTitle>
                    {reviewsData?.stats && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= Math.round(reviewsData.stats.averageRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {reviewsData.stats.averageRating.toFixed(1)} {t("reviews.basedOn")} {reviewsData.stats.totalReviews} {reviewsData.stats.totalReviews === 1 ? t("reviews.review") : t("reviews.reviews")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviewsData.reviews.map((review: any) => (
                      <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0" data-testid={`review-${review.id}`}>
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>{review.userName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{review.userName}</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-3 h-3 ${star <= review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300 dark:text-gray-600"
                                          }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(review.createdAt), "dd/MM/yyyy")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t("reviews.noReviews")}</p>
                    <p className="text-sm mt-1">{t("reviews.beFirst")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">Produit non trouvé</div>
        )}
      </main>

      <Footer />

      <SearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={(query) => console.log("Search:", query)}
        results={[]}
        onResultClick={(id) => {
          setLocation(`/product/${id}`);
          setSearchOpen(false);
        }}
      />

      {reviewDialogOpen && product && (
        <ReviewDialog
          productId={product.id}
          productTitle={getLocalizedData(product).title}
          onClose={() => setReviewDialogOpen(false)}
        />
      )}
    </div>
  );
}
