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

type PaymentMethodId = "card" | "apple_pay" | "klarna";

// ─────────────────────────────────────────────
// Config des 3 boutons de sélection
// ─────────────────────────────────────────────
const PAYMENT_METHODS: {
  id: PaymentMethodId;
  label: string;
  icon: JSX.Element;
  wrapperClass: string;
  iconClass: string;
  labelClass: string;
  // Options PaymentElement quand cette méthode est sélectionnée
  wallets: { applePay: "auto" | "never"; googlePay: "auto" | "never" };
}[] = [
  {
    id: "card",
    label: "Carte bancaire",
    icon: <FaCreditCard size={40} />,
    wrapperClass:
      "bg-white border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-800",
    iconClass: "text-slate-600",
    labelClass: "text-slate-700",
    wallets: { applePay: "never", googlePay: "never" },
  },
  {
    id: "apple_pay",
    label: "Apple Pay",
    icon: <FaApplePay size={60} />,
    wrapperClass:
      "bg-black border-2 border-black hover:bg-neutral-800 text-white",
    iconClass: "text-white",
    labelClass: "text-white",
    wallets: { applePay: "auto", googlePay: "never" },
  },
  {
    id: "klarna",
    label: "Klarna",
    icon: <SiKlarna size={38} />,
    wrapperClass:
      "bg-[#FFB3C7] border-2 border-[#FFB3C7] hover:bg-[#ffa0b8] text-black",
    iconClass: "text-black",
    labelClass: "text-black",
    wallets: { applePay: "never", googlePay: "never" },
  },
];

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const { t } = useLanguage();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(null);

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

  // ─── Sélection du moyen de paiement ────────────────────────
  const method = PAYMENT_METHODS.find((m) => m.id === selectedMethod);

  if (!selectedMethod) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-center text-muted-foreground uppercase tracking-widest">
          Choisissez votre moyen de paiement
        </p>
        <div className="grid grid-cols-1 gap-3">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setIsReady(false);
                setSelectedMethod(m.id);
              }}
              className={`
                flex items-center gap-4 px-5 py-4 rounded-2xl
                transition-all duration-200 active:scale-[0.98] shadow-sm
                ${m.wrapperClass}
              `}
            >
              <span className={m.iconClass}>{m.icon}</span>
              <span className={`font-semibold text-base ${m.labelClass}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Formulaire Stripe après sélection ─────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Bouton Changer + méthode choisie */}
      <div className="flex items-center justify-between">
        <div
          className={`
            flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm
            ${method?.wrapperClass}
          `}
        >
          <span className={method?.iconClass}>{method?.icon}</span>
          <span className={method?.labelClass}>{method?.label}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedMethod(null);
            setIsReady(false);
          }}
          className="text-sm text-primary underline underline-offset-2 hover:opacity-75 transition-opacity"
        >
          Changer
        </button>
      </div>

      {/* Chargement */}
      {!isReady && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Chargement sécurisé...
          </span>
        </div>
      )}

      {/* Formulaire Stripe */}
      <div className={!isReady ? "invisible h-0 overflow-hidden" : ""}>
        <PaymentElement
          options={{
            layout: "accordion",
            wallets: method?.wallets ?? { applePay: "never", googlePay: "never" },
          }}
          onReady={() => setIsReady(true)}
        />
      </div>

      {/* Bouton payer */}
      {isReady && (
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
          ) : (
            t("checkout.payNow")
          )}
        </Button>
      )}
    </form>
  );
}
