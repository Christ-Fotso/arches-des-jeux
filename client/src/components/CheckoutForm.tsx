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
import { FaApplePay, FaGooglePay, FaCreditCard } from "react-icons/fa";
import { SiKlarna } from "react-icons/si";

type PaymentMethod = "card" | "apple_pay" | "google_pay" | "klarna" | null;

// ──────────────────────────────────────────────────────────────
// Boutons de sélection du moyen de paiement
// ──────────────────────────────────────────────────────────────
const methods: {
  id: PaymentMethod;
  label: string;
  icon: JSX.Element;
  bg: string;
  border: string;
  textColor: string;
}[] = [
  {
    id: "card",
    label: "Carte bancaire",
    icon: <FaCreditCard size={36} />,
    bg: "bg-white hover:bg-slate-50",
    border: "border-slate-200 hover:border-slate-400",
    textColor: "text-slate-700",
  },
  {
    id: "apple_pay",
    label: "Apple Pay",
    icon: <FaApplePay size={52} />,
    bg: "bg-black hover:bg-neutral-800",
    border: "border-black",
    textColor: "text-white",
  },
  {
    id: "google_pay",
    label: "Google Pay",
    icon: <FaGooglePay size={52} />,
    bg: "bg-white hover:bg-slate-50",
    border: "border-slate-200 hover:border-slate-400",
    textColor: "text-slate-700",
  },
  {
    id: "klarna",
    label: "Klarna",
    icon: <SiKlarna size={32} />,
    bg: "bg-[#FFB3C7] hover:bg-[#ffa0b8]",
    border: "border-[#FFB3C7]",
    textColor: "text-black",
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
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);

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
          toast({ title: t("checkout.paymentSuccess"), description: t("checkout.orderConfirmed") });
          setLocation(`/checkout-success?orderId=${data.orderId}`);
        } else {
          toast({ variant: "destructive", title: "Erreur", description: data.error || "Erreur de création de commande" });
          setIsProcessing(false);
        }
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Une erreur est survenue" });
      setIsProcessing(false);
    }
  };

  // ── Sélection du moyen de paiement ──────────────────────────
  if (!selectedMethod) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-center text-muted-foreground tracking-wide uppercase">
          Sélectionnez votre moyen de paiement
        </p>
        <div className="grid grid-cols-2 gap-3">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMethod(m.id)}
              className={`
                flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2
                transition-all duration-200 active:scale-95 shadow-sm
                ${m.bg} ${m.border} ${m.textColor}
              `}
            >
              {m.icon}
              <span className="text-xs font-semibold tracking-wide">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Formulaire de paiement après sélection ──────────────────
  const selected = methods.find((m) => m.id === selectedMethod)!;

  // Options PaymentElement filtrées selon la méthode choisie
  const paymentElementOptions: any = {
    layout: "accordion",
    defaultValues: {},
    // On indique à Stripe quelle méthode afficher en priorité
    ...(selectedMethod === "apple_pay" || selectedMethod === "google_pay"
      ? { wallets: { applePay: "auto", googlePay: "auto" } }
      : { wallets: { applePay: "never", googlePay: "never" } }),
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* En-tête avec le moyen choisi + bouton Changer */}
      <div className="flex items-center justify-between px-1">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${selected.bg} ${selected.border} ${selected.textColor}`}>
          {selected.icon}
          <span className="text-sm font-semibold">{selected.label}</span>
        </div>
        <button
          type="button"
          onClick={() => { setSelectedMethod(null); setIsReady(false); }}
          className="text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
        >
          Changer
        </button>
      </div>

      {/* Zone de chargement */}
      {!isReady && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Chargement sécurisé...</span>
        </div>
      )}

      {/* Formulaire Stripe */}
      <div className={!isReady ? "invisible h-0 overflow-hidden" : ""}>
        <PaymentElement
          options={paymentElementOptions}
          onReady={() => setIsReady(true)}
        />
      </div>

      <Button
        type="submit"
        disabled={!stripe || !isReady || isProcessing}
        className="w-full mt-2"
        data-testid="button-pay"
      >
        {isProcessing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement en cours...</>
        ) : !isReady ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Chargement...</>
        ) : (
          t("checkout.payNow")
        )}
      </Button>
    </form>
  );
}
