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

import { FaApplePay, FaGooglePay, FaCreditCard } from "react-icons/fa";

// Icônes
const CbIcon = () => <FaCreditCard size={32} className="text-primary" />;
const ApplePayIcon = () => <FaApplePay size={64} className="text-white" />;
const GooglePayIcon = () => <FaGooglePay size={64} className="text-gray-800" />;

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
              options={{
                buttonType: {
                  applePay: 'pay',
                  googlePay: 'pay'
                },
                wallets: {
                  applePay: 'auto',
                  googlePay: 'auto'
                }
              }}
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
