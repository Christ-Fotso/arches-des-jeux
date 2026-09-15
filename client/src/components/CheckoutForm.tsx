import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import {
  useStripe,
  useElements,
  PaymentElement,
  ExpressCheckoutElement
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, Smartphone } from "lucide-react";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const { t } = useLanguage();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'wallet' | null>(null);

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
    <div className="space-y-6">
      {/* 1. SELECTION DU MOYEN DE PAIEMENT (Custom) */}
      {!selectedMethod && (
        <div className="space-y-4">
          <p className="text-sm text-center text-muted-foreground mb-4">
            Choisissez comment vous souhaitez payer :
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              className="flex flex-col items-center justify-center p-4 border-2 border-transparent bg-muted/30 hover:bg-muted/50 rounded-xl transition-all hover:border-primary/50"
            >
              <CreditCard className="w-8 h-8 mb-2 text-primary" />
              <span className="font-semibold text-sm">Carte Bancaire</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('wallet')}
              className="flex flex-col items-center justify-center p-4 border-2 border-transparent bg-muted/30 hover:bg-muted/50 rounded-xl transition-all hover:border-primary/50"
            >
              <Smartphone className="w-8 h-8 mb-2 text-primary" />
              <span className="font-semibold text-sm">Apple / Google Pay</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. AFFICHAGE DE LA METHODE SELECTIONNEE */}
      {selectedMethod === 'wallet' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Paiement Rapide</h4>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMethod(null)}>Changer</Button>
          </div>
          
          <div className="p-4 bg-muted/20 border rounded-lg">
            <ExpressCheckoutElement 
              onReady={({availablePaymentMethods}) => {
                if (!availablePaymentMethods) {
                  toast({
                    title: "Indisponible",
                    description: "Apple Pay ou Google Pay n'est pas configuré ou supporté sur ce navigateur.",
                    variant: "destructive"
                  });
                }
              }}
            />
            <p className="text-xs text-center text-muted-foreground mt-4">
              * Si aucun bouton ne s'affiche ci-dessus, cela signifie que votre appareil ou navigateur ne supporte pas Apple Pay / Google Pay, ou qu'aucune carte n'y est associée.
            </p>
          </div>
        </div>
      )}

      {selectedMethod === 'card' && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Carte Bancaire</h4>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMethod(null)}>Changer</Button>
          </div>

          {!isReady && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Chargement sécurisé...
              </span>
            </div>
          )}
          
          <PaymentElement 
            options={{
              layout: 'accordion',
              wallets: { applePay: 'never', googlePay: 'never' }
            }}
            onReady={() => setIsReady(true)} 
          />
          
          <Button
            type="submit"
            disabled={!stripe || !isReady || isProcessing}
            className="w-full"
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
      )}
    </div>
  );
}
