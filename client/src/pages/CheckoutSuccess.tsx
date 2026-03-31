import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { apiRequest } from "@/lib/queryClient";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    const confirmOrder = async () => {
      const params = new URLSearchParams(window.location.search);
      const paymentIntentId = params.get("payment_intent");
      const existingOrderId = params.get("orderId");

      if (existingOrderId) {
        setOrderId(existingOrderId);
        setLoading(false);
        return;
      }

      if (!paymentIntentId) {
        setError(t("checkout.noPaymentIntent"));
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest("POST", "/api/confirm-order", {
          paymentIntentId,
        });

        const data = await response.json();

        if (data.success) {
          setOrderId(data.orderId);
          clearCart();
        } else {
          setError(data.error || t("checkout.orderCreationFailed"));
        }
      } catch (err: any) {
        setError(err.message || t("checkout.somethingWentWrong"));
      } finally {
        setLoading(false);
      }
    };

    confirmOrder();
  }, [clearCart, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">{t("checkout.processing")}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t("checkout.confirmingOrder")}
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <CardTitle className="text-2xl">{t("checkout.error")}</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => setLocation("/checkout")}
                className="w-full"
                data-testid="button-retry-payment"
              >
                {t("checkout.tryAnotherCard")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full"
                data-testid="button-back-home"
              >
                {t("common.backToHome")}
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">{t("payment.success.title")}</CardTitle>
            <CardDescription>{t("payment.success.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderId && (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm font-medium">{t("checkout.orderNumber")}</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">{orderId}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              {t("payment.success.confirmation")}
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setLocation("/")} data-testid="button-home">
                {t("payment.success.backToHome")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/products")}
                data-testid="button-products"
              >
                {t("payment.success.continueShopping")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
