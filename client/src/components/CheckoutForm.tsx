import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { FaApplePay, FaCreditCard } from "react-icons/fa";
import { SiKlarna } from "react-icons/si";

// ─────────────────────────────────────────────
// Checkout Form — Stripe Native UI
// ─────────────────────────────────────────────

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const { t } = useLanguage();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // ─── Paiement ──────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !isReady) return;

    setIsProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout-success`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          variant: "destructive",
          title: t("checkout.paymentFailed"),
          description: error.message,
        });
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        const response = await apiRequest("POST", "/api/confirm-order", {
          paymentIntentId: paymentIntent.id,
        });
        const data = await response.json();

        if (data.success) {
          clearCart();
          toast({
            title: t("checkout.paymentSuccess"),
            description: t("checkout.orderConfirmed"),
          });
          setLocation(`/checkout-success?orderId=${data.orderId}`);
        } else {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: data.error || "Erreur de création de commande",
          });
          setIsProcessing(false);
        }
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message || "Une erreur est survenue",
      });
      setIsProcessing(false);
    }
  };

  // ─── Rendu du formulaire Stripe ────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-center text-muted-foreground uppercase tracking-widest mb-6">
          Choisissez votre moyen de paiement
        </h3>

        {/* Loading State */}
        {!isReady && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 border-2 border-dashed border-slate-200 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Chargement sécurisé...
            </span>
          </div>
        )}

        {/* Stripe Payment Element (Native Accordion) */}
        <div className={!isReady ? "invisible h-0 overflow-hidden" : "min-h-[300px]"}>
          <PaymentElement
            options={{
              layout: {
                type: "accordion",
                defaultCollapsed: true,
                radios: true,
                spacedAccordionItems: true
              },
              wallets: {
                applePay: "auto",
                googlePay: "auto",
              }
            }}
            onReady={() => setIsReady(true)}
          />
        </div>
      </div>

      {/* Bouton payer */}
      {isReady && (
        <Button
          type="submit"
          disabled={!stripe || !isReady || isProcessing}
          className="w-full h-12 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
          data-testid="button-pay"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            t("checkout.payNow")
          )}
        </Button>
      )}
    </form>
  );
}
