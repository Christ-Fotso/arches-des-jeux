import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Package, MapPin, Loader2 } from "lucide-react";
import { useState } from "react";
import ReviewDialog from "@/components/ReviewDialog";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: string;
  productTitleFr: string;
  productTitleDe: string;
  productTitleEn: string;
  productImageUrl: string;
}

interface Order {
  id: string;
  totalAmount: string;
  discountAmount: string;
  status: string;
  trackingNumber: string | null;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
  address: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  items: OrderItem[];
}

export default function MyOrders() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [reviewProduct, setReviewProduct] = useState<{ productId: string; productTitle: string } | null>(null);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/my-orders"],
    enabled: !!user,
  });

  // Récupérer tous les avis de l'utilisateur pour tous les produits
  const { data: userReviews } = useQuery<Record<string, boolean>>({
    queryKey: ["/api/user-reviews", orders],
    enabled: !!user && !!orders && orders.length > 0,
    queryFn: async () => {
      if (!orders || orders.length === 0) return {};
      const productIds = Array.from(new Set(orders.flatMap(o => o.items.map(i => i.productId))));
      console.log('🔍 Checking reviews for products:', productIds);
      const reviewsMap: Record<string, boolean> = {};

      await Promise.all(
        productIds.map(async (productId) => {
          try {
            const response = await fetch(`/api/reviews/${productId}/user-review`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            const data = await response.json();
            console.log(`📝 Product ${productId}: hasReview =`, data.hasReview);
            reviewsMap[productId] = data.hasReview;
          } catch (error) {
            console.error(`❌ Error checking review for ${productId}:`, error);
            reviewsMap[productId] = false;
          }
        })
      );

      console.log('✅ Final reviews map:', reviewsMap);
      return reviewsMap;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
      case "SHIPPED":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300";
      case "DELIVERED":
        return "bg-green-500/10 text-green-700 dark:text-green-300";
      case "CANCELLED":
        return "bg-red-500/10 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-300";
    }
  };

  const getProductTitle = (item: OrderItem) => {
    switch (language) {
      case "en":
        return item.productTitleEn;
      default:
        return item.productTitleFr;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        <Link href="/">
          <a className="inline-block mb-6 text-sm text-muted-foreground hover:text-foreground">
            ← Accueil du site
          </a>
        </Link>
        <h1 className="text-3xl font-bold mb-8" data-testid="text-page-title">{t("myOrders.title")}</h1>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground" data-testid="text-no-orders">
                {t("myOrders.noOrders")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} data-testid={`card-order-${order.id}`}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl" data-testid="text-order-number">
                        {t("myOrders.orderNumber")}{order.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground" data-testid="text-order-date">
                        {t("myOrders.date")}: {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge className={getStatusColor(order.status)} data-testid="badge-order-status">
                        {t(`myOrders.status.${order.status}`)}
                      </Badge>
                      <p className="text-2xl font-bold" data-testid="text-order-total">
                        € {order.totalAmount}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {t("myOrders.items")}
                    </h3>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 rounded-md bg-muted/50" data-testid={`order-item-${item.productId}`}>
                          <img
                            src={item.productImageUrl}
                            alt={getProductTitle(item)}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{getProductTitle(item)}</p>
                            <p className="text-sm text-muted-foreground">
                              {t("checkout.quantity")}: {item.quantity} × € {item.priceAtPurchase}
                            </p>
                          </div>
                          {order.status === "DELIVERED" && !userReviews?.[item.productId] && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReviewProduct({
                                productId: item.productId,
                                productTitle: getProductTitle(item)
                              })}
                              data-testid={`button-review-${item.productId}`}
                            >
                              {t("reviews.leaveReview")}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.firstName && order.address && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {t("myOrders.shippingAddress")}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid="text-shipping-address">
                        {order.firstName} {order.lastName}<br />
                        {order.address}
                        {order.addressLine2 && <>, {order.addressLine2}</>}<br />
                        {order.postalCode} {order.city}<br />
                        {order.country}
                      </p>
                    </div>
                  )}

                  {order.trackingNumber && (
                    <div>
                      <h3 className="font-semibold mb-2">{t("myOrders.trackingNumber")}</h3>
                      <p className="text-sm font-mono" data-testid="text-tracking-number">{order.trackingNumber}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
      {reviewProduct && (
        <ReviewDialog
          productId={reviewProduct.productId}
          productTitle={reviewProduct.productTitle}
          onClose={() => setReviewProduct(null)}
        />
      )}
    </div>
  );
}
