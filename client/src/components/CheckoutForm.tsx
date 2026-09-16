import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import {
  useStripe,
  useElements,
  PaymentElement
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const { t } = useLanguage();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isReady) {
      toast({
        variant: "destructive",
        title: t("checkout.error"),
        description: "Le formulaire n'est pas prêt.",
      });
      return;
    }

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

      if (paymentIntent && paymentIntent.status === "succeeded") {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isReady && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Chargement sécurisé...
          </span>
        </div>
      )}
      
      <div className={!isReady ? "invisible h-0" : "visible"}>
        <PaymentElement 
          options={{
            layout: 'accordion',
            wallets: { 
              applePay: 'auto', 
              googlePay: 'auto' 
            }
          }}
          onReady={() => setIsReady(true)} 
        />
      </div>
      
      <Button
        type="submit"
        disabled={!stripe || !isReady || isProcessing}
        className="w-full mt-6"
        data-testid="button-pay"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Traitement en cours...
          </>
        ) : !isReady ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Chargement...
          </>
        ) : (
          t("checkout.payNow")
        )}
      </Button>
    </form>
  );
}
