import { FormEvent, useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";

// Icônes personnalisées (SVGs purs)
const CbIcon = () => (
  <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="25" rx="4" fill="#003D7C"/>
    <path d="M14.5 7C14.5 7 11 7 9 9C7 11 7 14 9 16C11 18 14.5 18 14.5 18M14.5 7V18M14.5 7C14.5 7 18 7 20 9C22 11 22 14 20 16C18 18 14.5 18 14.5 18M25 7H31C33 7 34 8 34 10C34 12 33 13 31 13H25V7ZM25 13H31C33 13 34 14 34 16C34 18 33 19 31 19H25V13Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ApplePayIcon = () => (
  <svg width="50" height="24" viewBox="0 0 50 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.2 11.6c0-1.8 1.5-2.8 2.3-3.2-1-1.3-2.6-1.5-3.1-1.5-1.3-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.8.8-3.5 2-1.5 2.5-.4 6.2 1 8.3.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.7.7 2.8.7 1.2 0 1.9-1.1 2.6-2.1.9-1.2 1.2-2.4 1.2-2.4 0-.1-2.2-.9-2.2-3.3m-1.7-4.5c.6-.7 1-1.7.9-2.7-1 .1-2 .6-2.6 1.3-.5.6-1 1.6-.9 2.6.9.1 1.9-.4 2.6-1.2" fill="currentColor"/>
    <path d="M30 18.2v-7.3h1.8v1c.5-.7 1.3-1.1 2.3-1.1 1.4 0 2.5 1 2.5 2.8v4.6H35v-4.4c0-1.1-.6-1.6-1.5-1.6-.8 0-1.6.6-1.6 1.8v4.2H30zm10.7-5.5c-1.3 0-2 .7-2 1.5 0 .9.8 1.4 1.8 1.4.9 0 1.6-.6 1.6-1.5v-1.4h-1.4zm2.1-1.5c1.1 0 1.8.8 1.8 2v4.9h-1.5v-.9c-.4.7-1.1 1-1.9 1-1.5 0-2.6-1-2.6-2.3 0-1.5 1.1-2.3 2.8-2.3h1.7v-.4c0-.8-.6-1.2-1.4-1.2-.7 0-1.2.3-1.4.7h-1.6c.3-1 1.4-1.6 2.9-1.6zm6.8 6.5-2.2-5.9h1.7l1.3 3.9 1.2-3.9h1.7l-2.7 7.7c-.4 1.1-.9 1.5-1.9 1.5h-.8v-1.3h.5c.6 0 .9-.3 1.1-.8l.1-.2z" fill="currentColor"/>
  </svg>
);

const GooglePayIcon = () => (
  <svg width="50" height="20" viewBox="0 0 50 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.1 8.9v2.2h4.5c-.2 1.4-1.4 2.6-2.9 3-1.7.4-3.5-.2-4.5-1.6-1.2-1.7-.5-4.2 1.3-5 1.1-.5 2.5-.3 3.3.4l1.6-1.6c-1.4-1.3-3.4-1.8-5.3-1.2-2.3.7-3.9 2.7-4.2 5.1-.3 2.9 1.9 5.5 4.8 5.7 2.6.2 4.9-1.6 5.3-4.1.1-.9.1-2 .1-2.9h-4z" fill="#4285F4"/>
    <path d="M30 14h-1.5v-7.3H30V14zm-4.7 0h-1.5v-7.3h1.5V14zm-4.7-3.7c0-2.1-1.5-3.7-3.6-3.7s-3.6 1.6-3.6 3.7 1.5 3.7 3.6 3.7 3.6-1.6 3.6-3.7zm-1.5 0c0 1.2-.9 2.2-2.1 2.2-1.2 0-2.1-1-2.1-2.2s.9-2.2 2.1-2.2c1.2 0 2.1 1 2.1 2.2z" fill="#5F6368"/>
  </svg>
);

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const { t } = useLanguage();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'apple_pay' | 'google_pay' | null>(null);
  
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Détection basique du type d'appareil
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/i.test(ua);
    
    if (isIOS) {
      setDeviceType('ios');
    } else if (isAndroid) {
      setDeviceType('android');
    } else {
      // Desktop : par défaut, on le met sur Carte Bancaire direct
      setDeviceType('desktop');
      setSelectedMethod('card');
    }
  }, []);

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
      {/* 1. SELECTION DU MOYEN DE PAIEMENT (Mobile Only) */}
      {!selectedMethod && deviceType !== 'desktop' && (
        <div className="space-y-4">
          <p className="text-sm text-center text-muted-foreground mb-4">
            Choisissez votre moyen de paiement :
          </p>
          <div className="grid grid-cols-2 gap-4">
            {deviceType === 'ios' && (
              <button
                type="button"
                onClick={() => setSelectedMethod('apple_pay')}
                className="flex flex-col items-center justify-center p-4 border-2 border-transparent bg-black text-white hover:bg-black/90 rounded-xl transition-all"
              >
                <ApplePayIcon />
              </button>
            )}
            
            {deviceType === 'android' && (
              <button
                type="button"
                onClick={() => setSelectedMethod('google_pay')}
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 bg-white hover:bg-gray-50 rounded-xl transition-all"
              >
                <GooglePayIcon />
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              className="flex flex-col items-center justify-center p-4 border-2 border-transparent bg-muted/30 hover:bg-muted/50 rounded-xl transition-all hover:border-primary/50"
            >
              <CbIcon />
              <span className="font-semibold text-sm mt-2">Carte Bancaire</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. AFFICHAGE APPLE PAY / GOOGLE PAY */}
      {(selectedMethod === 'apple_pay' || selectedMethod === 'google_pay') && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">{selectedMethod === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}</h4>
            {deviceType !== 'desktop' && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedMethod(null)}>Changer</Button>
            )}
          </div>
          
          <div className="p-4 bg-muted/20 border rounded-lg">
            <ExpressCheckoutElement 
              onReady={({availablePaymentMethods}) => {
                if (!availablePaymentMethods || (selectedMethod === 'apple_pay' && !availablePaymentMethods.applePay) || (selectedMethod === 'google_pay' && !availablePaymentMethods.googlePay)) {
                  toast({
                    title: "Indisponible",
                    description: "Ce moyen de paiement n'est pas configuré ou supporté sur ce navigateur.",
                    variant: "destructive"
                  });
                }
              }}
            />
            <p className="text-xs text-center text-muted-foreground mt-4">
              * Veuillez vérifier que votre portefeuille numérique est configuré avec une carte valide.
            </p>
          </div>
        </div>
      )}

      {/* 3. AFFICHAGE CARTE BANCAIRE */}
      {selectedMethod === 'card' && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {deviceType !== 'desktop' && (
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold flex items-center gap-2">
                <CbIcon /> Carte Bancaire
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMethod(null)}>Retour</Button>
            </div>
          )}

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
