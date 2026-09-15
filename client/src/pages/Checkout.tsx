import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutForm from "@/components/CheckoutForm";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, MapPin } from "lucide-react";
import type { Stripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";

interface ShippingAddress {
  id?: string;
  email?: string;
  firstName: string;
  lastName: string;
  address: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  label?: string;
  isDefault?: boolean;
}

interface SavedAddress {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  address: string;
  addressLine2: string | null;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cartItems } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Gestion des adresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "FR",
  });

  // Frais de port locaux calculés en front pour l'affichage immédiat
  const [localShippingCost, setLocalShippingCost] = useState(0);
  const [localShippingDays, setLocalShippingDays] = useState("");

  // Gestion multi-devises
  const [currency, setCurrency] = useState<'CHF' | 'EUR' | 'USD' | 'GBP'>('EUR');
  const { convertPrice, getCurrencySymbol } = useCurrencyConversion();

  // Gestion du code promo
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: string;
    value: number;
    discountAmount: number;
  } | null>(null);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const response = await apiRequest("POST", "/api/discount/validate", {
        code: promoCode.toUpperCase(),
        amount: subtotal,
      });
      const data = await response.json();
      if (data.valid) {
        setAppliedDiscount({
          code: promoCode.toUpperCase(),
          type: data.type,
          value: data.value,
          discountAmount: data.discountAmount,
        });
        setPromoError("");
        // Si on a déjà généré le payment intent, il faut le regénérer pour appliquer la réduction
        if (clientSecret) {
          handleContinueToPayment();
        }
      } else {
        setPromoError(data.message || "Code promo invalide");
        setAppliedDiscount(null);
      }
    } catch {
      setPromoError("Code promo invalide ou expiré");
      setAppliedDiscount(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const detectCurrencyFromCountry = (countryCode: string): 'CHF' | 'EUR' | 'USD' | 'GBP' => {
    const currencyMap: Record<string, 'CHF' | 'EUR' | 'USD' | 'GBP'> = {
      'CH': 'CHF',
      'FR': 'EUR',
      'DE': 'EUR',
      'IT': 'EUR',
      'ES': 'EUR',
      'BE': 'EUR',
      'NL': 'EUR',
      'AT': 'EUR',
      'PT': 'EUR',
      'US': 'USD',
      'GB': 'GBP',
      'UK': 'GBP',
    };
    return currencyMap[countryCode.toUpperCase()] || 'EUR';
  };

  useEffect(() => {
    if (cartItems.length === 0) {
      setLocation("/");
      return;
    }
    if (user) {
      loadSavedAddresses();
    } else {
      setUseNewAddress(true);
      setLoadingAddresses(false);
    }
  }, [user, cartItems, setLocation]);

  useEffect(() => {
    async function fetchStripeConfig() {
      try {
        const response = await apiRequest("GET", "/api/config/stripe");
        const data = await response.json();
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      } catch (err) {
        console.error("Failed to load Stripe config:", err);
      }
    }
    fetchStripeConfig();
  }, []);

  useEffect(() => {
    let country = "FR";
    let postalCode = "";

    if (useNewAddress) {
      country = shippingAddress.country;
      postalCode = shippingAddress.postalCode;
    } else if (selectedAddressId && savedAddresses.length > 0) {
      const addr = savedAddresses.find(a => a.id === selectedAddressId);
      if (addr) {
        country = addr.country;
        postalCode = addr.postalCode;
      }
    }

    setCurrency(detectCurrencyFromCountry(country));

    // Simulation front-end des frais de port (pour affichage immédiat)
    if (country === "FR") {
      setLocalShippingCost(0);
      const idfDepts = ["75", "77", "78", "91", "92", "93", "94", "95"];
      if (idfDepts.some(d => postalCode.startsWith(d))) {
        setLocalShippingDays("1-2 jours");
      } else {
        setLocalShippingDays("2-3 jours");
      }
    } else {
      setLocalShippingCost(9.90);
      setLocalShippingDays("3-5 jours");
    }

    // Réinitialiser le clientSecret si l'adresse change pour forcer la revalidation
    setClientSecret("");

  }, [selectedAddressId, shippingAddress.country, shippingAddress.postalCode, savedAddresses, useNewAddress]);

  const loadSavedAddresses = async () => {
    try {
      const response = await apiRequest("GET", "/api/shipping-addresses");
      const addresses = await response.json();
      setSavedAddresses(addresses);
      const defaultAddress = addresses.find((addr: SavedAddress) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (addresses.length > 0) {
        setSelectedAddressId(addresses[0].id);
      } else {
        setUseNewAddress(true);
      }
    } catch (err) {
      console.error("Error loading addresses:", err);
      setUseNewAddress(true);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleContinueToPayment = async () => {
    let addressData;
    let addressId;

    if (useNewAddress) {
      if (!user && !shippingAddress.email) {
        setError("L'adresse email est requise");
        return;
      }
      if (!shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode) {
        setError(t("checkout.addressRequired"));
        return;
      }
      if (shippingAddress.country === "FR" && !/^\d{5}$/.test(shippingAddress.postalCode)) {
        setError("Le code postal en France doit comporter exactement 5 chiffres.");
        return;
      }
      addressData = shippingAddress;
    } else {
      if (!selectedAddressId) {
        setError("Veuillez sélectionner une adresse");
        return;
      }
      const addr = savedAddresses.find(a => a.id === selectedAddressId);
      if (addr && addr.country === "FR" && !/^\d{5}$/.test(addr.postalCode)) {
         setError("Le code postal en France doit comporter exactement 5 chiffres.");
         return;
      }
      addressId = selectedAddressId;
    }

    try {
      setLoading(true);
      setError("");
      
      const payload: any = {
        items: cartItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        currency: currency,
        guestEmail: !user ? shippingAddress.email : undefined,
        discountCode: appliedDiscount?.code || undefined,
      };

      if (addressId) {
        payload.shippingAddressId = addressId;
      } else {
        payload.shippingAddress = addressData;
      }

      const response = await apiRequest("POST", "/api/create-payment-intent", payload);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erreur de validation");
      }

      setClientSecret(data.clientSecret);
    } catch (err: any) {
      setError(err.message || "Failed to initialize payment");
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0f172a',
      },
      rules: {
        '.Tab': {
          border: '1px solid #E0E6EB',
          boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 7px rgba(18, 42, 66, 0.04)',
        },
      }
    },
  };

  if (loadingAddresses) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{t("checkout.title")}</h1>

        <div className="flex items-center gap-2 mb-6">
          <Label htmlFor="currency-selector">Devise de paiement:</Label>
          <Select value={currency} onValueChange={(val) => setCurrency(val as any)}>
            <SelectTrigger id="currency-selector" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">€ EUR</SelectItem>
              <SelectItem value="CHF">CHF</SelectItem>
              <SelectItem value="USD">$ USD</SelectItem>
              <SelectItem value="GBP">£ GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Adresse de livraison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {savedAddresses.length > 0 && (
                  <RadioGroup
                    value={useNewAddress ? "new" : "existing"}
                    onValueChange={(value) => setUseNewAddress(value === "new")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="existing" id="existing" />
                      <Label htmlFor="existing">Utiliser une adresse existante</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="new" id="new" />
                      <Label htmlFor="new">Nouvelle adresse</Label>
                    </div>
                  </RadioGroup>
                )}

                {!useNewAddress && savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === addr.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/50"
                          }`}
                        onClick={() => setSelectedAddressId(addr.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <MapPin className="w-5 h-5 mt-0.5 text-primary" />
                            <div>
                              {addr.label && <p className="font-medium text-sm">{addr.label}</p>}
                              <p className="text-sm">{addr.firstName} {addr.lastName}</p>
                              <p className="text-sm text-muted-foreground">{addr.address} {addr.addressLine2 && `, ${addr.addressLine2}`}</p>
                              <p className="text-sm text-muted-foreground">{addr.postalCode} {addr.city}, {addr.country}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {useNewAddress && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{t("checkout.firstName")} *</Label>
                        <Input id="firstName" value={shippingAddress.firstName} onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">{t("checkout.lastName")} *</Label>
                        <Input id="lastName" value={shippingAddress.lastName} onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={shippingAddress.email} onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })} required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">{t("checkout.address")} *</Label>
                      <Input id="address" value={shippingAddress.address} onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">{t("checkout.postalCode")} *</Label>
                        <Input id="postalCode" value={shippingAddress.postalCode} onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">{t("checkout.city")} *</Label>
                        <Input id="city" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">{t("checkout.country")} *</Label>
                      <select id="country" value={shippingAddress.country} onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required>
                        <option value="FR">🇫🇷 France</option>
                        <option value="CH">🇨🇭 Suisse</option>
                        <option value="BE">🇧🇪 Belgique</option>
                        <option value="CA">🇨🇦 Canada</option>
                        <option value="US">🇺🇸 USA</option>
                      </select>
                    </div>
                  </>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}
                
                {!clientSecret && (
                  <Button onClick={handleContinueToPayment} disabled={loading} className="w-full">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Validation...</> : "Continuer vers le paiement"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>{t("checkout.orderSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{t("checkout.quantity")}: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm">
                      {getCurrencySymbol(currency)} {convertPrice(item.price * item.quantity, currency).toFixed(2)}
                    </p>
                  </div>
                ))}

                <div className="space-y-2 border-t pt-4">
                  <Label className="text-sm font-semibold">Code promo</Label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="ENTREZ LE CODE"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm uppercase placeholder:normal-case"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={applyPromoCode} disabled={promoLoading || !promoCode.trim()}>
                      {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tester"}
                    </Button>
                  </div>
                  {promoError && <p className="text-xs text-destructive">{promoError}</p>}
                  {appliedDiscount && (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Code {appliedDiscount.code} appliqué : -{appliedDiscount.discountAmount.toFixed(2)} €
                    </p>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>{t("checkout.subtotal")}</span>
                    <span>{getCurrencySymbol(currency)} {convertPrice(subtotal, currency).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Frais de port ({localShippingDays})</span>
                    <span>{localShippingCost === 0 ? "Gratuit" : `${localShippingCost.toFixed(2)} €`}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Réduction</span>
                      <span>-{appliedDiscount.discountAmount.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                    <span>{t("checkout.total")}</span>
                    <span>
                      {getCurrencySymbol(currency)} {(
                        convertPrice(subtotal - (appliedDiscount?.discountAmount || 0), currency) 
                        + localShippingCost
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {clientSecret && stripePromise && (
                  <div className="mt-6 border-t pt-6">
                    <h3 className="font-semibold text-lg mb-4 text-center">Sélectionnez votre moyen de paiement</h3>
                    <Elements key={clientSecret} options={options} stripe={stripePromise}>
                      <CheckoutForm />
                    </Elements>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
