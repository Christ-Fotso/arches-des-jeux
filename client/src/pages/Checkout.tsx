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
import { Loader2, Plus, MapPin } from "lucide-react";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
);

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

interface ShippingRate {
  carrier: string;
  service: string;
  amount: string;
  currency: string;
  estimatedDays: number;
  rateId: string;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cartItems } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPayment, setShowPayment] = useState(false);

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

  // Gestion des options de livraison Shippo
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  // Gestion des étapes du checkout
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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

  // Fonction de détection automatique de devise selon le pays
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
      // Charger les adresses sauvegardées
      loadSavedAddresses();
    } else {
      setUseNewAddress(true);
      setLoadingAddresses(false);
    }
  }, [user, cartItems, setLocation]);

  // Détection automatique de la devise selon l'adresse
  useEffect(() => {
    if (selectedAddressId && savedAddresses.length > 0) {
      const addr = savedAddresses.find(a => a.id === selectedAddressId);
      if (addr) {
        const detectedCurrency = detectCurrencyFromCountry(addr.country);
        setCurrency(detectedCurrency);
      }
    } else if (shippingAddress.country && shippingAddress.country !== 'CH') {
      const detectedCurrency = detectCurrencyFromCountry(shippingAddress.country);
      setCurrency(detectedCurrency);
    }
  }, [selectedAddressId, shippingAddress.country, savedAddresses]);

  const loadSavedAddresses = async () => {
    try {
      const response = await apiRequest("GET", "/api/shipping-addresses");
      const addresses = await response.json();
      setSavedAddresses(addresses);

      // Sélectionner l'adresse par défaut si elle existe
      const defaultAddress = addresses.find((addr: SavedAddress) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (addresses.length > 0) {
        setSelectedAddressId(addresses[0].id);
      } else {
        // Aucune adresse sauvegardée, utiliser le formulaire
        setUseNewAddress(true);
      }
    } catch (err) {
      console.error("Error loading addresses:", err);
      setUseNewAddress(true);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchShippingRates = async (address: ShippingAddress | SavedAddress) => {
    try {
      setLoadingRates(true);
      setError("");

      const shippingAddr = {
        name: `${address.firstName} ${address.lastName}`,
        street1: address.address,
        city: address.city,
        zip: address.postalCode,
        country: address.country,
      };

      const response = await apiRequest("POST", "/api/shipping/rates", {
        address: shippingAddr,
        itemCount: cartItems.length,
      });

      const data = await response.json();
      console.log('Shipping rates response:', data);

      // Le serveur retourne directement un tableau
      const rates = Array.isArray(data) ? data : (data.rates || []);
      setShippingRates(rates);

      // Sélectionner automatiquement l'option la moins chère
      if (rates && rates.length > 0) {
        setSelectedRate(rates[0]);
      }
    } catch (err: any) {
      console.error("Error fetching shipping rates:", err);
      setError("Impossible de calculer les frais de livraison. Veuillez réessayer.");
    } finally {
      setLoadingRates(false);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleContinueToPayment = async () => {
    let addressData;
    let addressId;

    if (useNewAddress) {
      // Valider la nouvelle adresse
      if (!user && !shippingAddress.email) {
        setError("L'adresse email est requise");
        return;
      }
      if (!shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode) {
        setError(t("checkout.addressRequired"));
        return;
      }
      addressData = shippingAddress;
    } else {
      // Utiliser une adresse existante
      if (!selectedAddressId) {
        setError("Veuillez sélectionner une adresse");
        return;
      }
      addressId = selectedAddressId;
    }

    // Vérifier qu'un transporteur est sélectionné
    if (!selectedRate) {
      setError("Veuillez sélectionner une option de livraison");
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        items: cartItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        shippingCost: selectedRate.amount,
        shippingCarrier: selectedRate.carrier,
        shippingService: selectedRate.service,
        estimatedDeliveryDays: selectedRate.estimatedDays,
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
      setClientSecret(data.clientSecret);
      setShowPayment(true);
      setCurrentStep(3); // Passer à l'étape 3
    } catch (err: any) {
      setError(err.message || "Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  };

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
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
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{t("checkout.title")}</h1>

        {/* Sélecteur de devise */}
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

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 pt-6">
                {/* Sélection adresse existante ou nouvelle */}
                {savedAddresses.length > 0 && currentStep === 1 && (
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

                {/* Liste des adresses sauvegardées */}
                {!useNewAddress && savedAddresses.length > 0 && currentStep === 1 && (
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
                              {addr.label && (
                                <p className="font-medium text-sm">{addr.label}</p>
                              )}
                              <p className="text-sm">
                                {addr.firstName} {addr.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {addr.address}
                                {addr.addressLine2 && `, ${addr.addressLine2}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {addr.postalCode} {addr.city}, {addr.country}
                              </p>
                            </div>
                          </div>
                          {addr.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Par défaut
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulaire nouvelle adresse */}
                {useNewAddress && currentStep === 1 && (
                  <>
                    {/* Prénom / Nom */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">
                          {t("checkout.firstName")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          value={shippingAddress.firstName}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
                          placeholder={t("checkout.firstNamePlaceholder")}
                          required
                          data-testid="input-first-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">
                          {t("checkout.lastName")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          value={shippingAddress.lastName}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
                          placeholder={t("checkout.lastNamePlaceholder")}
                          required
                          data-testid="input-last-name"
                        />
                      </div>
                    </div>

                    {/* Email (toujours visible) */}
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                        placeholder="votre@email.com"
                        required
                        data-testid="input-email"
                      />
                    </div>

                    {/* Téléphone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Téléphone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={(shippingAddress as any).phone || ""}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, ...(shippingAddress as any), phone: e.target.value } as any)}
                        placeholder="+33 6 XX XX XX XX"
                        required
                        data-testid="input-phone"
                      />
                    </div>

                    {/* Adresse */}
                    <div className="space-y-2">
                      <Label htmlFor="address">
                        {t("checkout.address")} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="address"
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                        placeholder={t("checkout.addressPlaceholder")}
                        required
                        data-testid="input-address"
                      />
                    </div>

                    {/* Complément (optionnel, pas d'étoile) */}
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">{t("checkout.addressLine2")}</Label>
                      <Input
                        id="addressLine2"
                        value={shippingAddress.addressLine2}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                        placeholder={t("checkout.addressLine2Placeholder")}
                        data-testid="input-address-line-2"
                      />
                    </div>

                    {/* Code postal / Ville */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">
                          {t("checkout.postalCode")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="postalCode"
                          value={shippingAddress.postalCode}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                          placeholder={t("checkout.postalCodePlaceholder")}
                          required
                          data-testid="input-postal-code"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          {t("checkout.city")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          placeholder={t("checkout.cityPlaceholder")}
                          required
                          data-testid="input-city"
                        />
                      </div>
                    </div>

                    {/* Pays */}
                    <div className="space-y-2">
                      <Label htmlFor="country">
                        {t("checkout.country")} <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="country"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        data-testid="select-country"
                        required
                      >
                        <option value="CH">🇨🇭 Suisse / Schweiz / Switzerland</option>
                        <option value="FR">🇫🇷 France</option>
                        <option value="DE">🇩🇪 Deutschland / Germany</option>
                        <option value="IT">🇮🇹 Italia / Italy</option>
                        <option value="AT">🇦🇹 Österreich / Austria</option>
                        <option value="BE">🇧🇪 Belgique / België / Belgium</option>
                        <option value="LU">🇱🇺 Luxembourg</option>
                        <option value="NL">🇳🇱 Nederland / Netherlands</option>
                        <option value="ES">🇪🇸 España / Spain</option>
                        <option value="PT">🇵🇹 Portugal</option>
                        <option value="GB">🇬🇧 United Kingdom</option>
                        <option value="IE">🇮🇪 Ireland</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Afficher seulement à l'étape 1 */}
                {currentStep === 1 && (
                  <>
                    {error && (
                      <p className="text-sm text-destructive" data-testid="text-error">
                        {error}
                      </p>
                    )}

                    {/* Bouton Suivant - Étape 1 */}
                    <Button
                      onClick={async () => {
                        const address = useNewAddress
                          ? shippingAddress
                          : savedAddresses.find(a => a.id === selectedAddressId);

                        if (!address) {
                          setError("Veuillez sélectionner ou renseigner une adresse");
                          return;
                        }

                        if (!address.firstName || !address.lastName || !address.address || !address.city || !address.postalCode) {
                          setError(t("checkout.addressRequired"));
                          return;
                        }

                        setError("");
                        await fetchShippingRates(address);
                        setCurrentStep(2);
                      }}
                      disabled={loadingRates}
                      className="w-full"
                    >
                      {loadingRates ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Calcul en cours...
                        </>
                      ) : (
                        "Suivant"
                      )}
                    </Button>
                  </>
                )}

                {/* Étape 2: Options de livraison */}
                {currentStep === 2 && (
                  <>
                    {/* Récapitulatif de l'adresse */}
                    <div className="space-y-2 pb-4 border-b">
                      <h3 className="font-semibold">Adresse de livraison</h3>
                      {(() => {
                        const address = useNewAddress
                          ? shippingAddress
                          : savedAddresses.find(a => a.id === selectedAddressId);
                        return address ? (
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">{address.firstName} {address.lastName}</p>
                            <p>{address.address}</p>
                            {address.addressLine2 && <p>{address.addressLine2}</p>}
                            <p>{address.postalCode} {address.city}, {address.country}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Options de livraison */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Choisissez votre mode de livraison</h3>
                      {loadingRates ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : shippingRates.length > 0 ? (
                        <div className="space-y-2">
                          {shippingRates.map((rate) => (
                            <div
                              key={rate.rateId}
                              onClick={() => setSelectedRate(rate)}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedRate?.rateId === rate.rateId
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">{rate.carrier} - {rate.service}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Livraison estimée: {rate.rateId.includes('_fr_') || rate.rateId.includes('-fr-') ? '2-4' : '3-5'} jours
                                  </div>
                                </div>
                                <div className="text-lg font-bold">
                                  {parseFloat(rate.amount).toFixed(2)} €
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucune option de livraison disponible</p>
                      )}
                    </div>
                  </>
                )}

                {/* Code Promo - Étape 2 */}
                {currentStep === 2 && (
                  <div className="space-y-2 border rounded-lg p-4 bg-muted/20">
                    <Label className="font-semibold">Code promo</Label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="BIENVENUE"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase placeholder:normal-case"
                        data-testid="input-promo-code"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={applyPromoCode}
                        disabled={promoLoading || !promoCode.trim()}
                      >
                        {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Appliquer"}
                      </Button>
                    </div>
                    {promoError && <p className="text-sm text-destructive">{promoError}</p>}
                    {appliedDiscount && (
                      <p className="text-sm text-green-600 font-medium">
                        ✓ Code <strong>{appliedDiscount.code}</strong> appliqué : -{appliedDiscount.discountAmount.toFixed(2)} €
                      </p>
                    )}
                  </div>
                )}

                {/* Boutons Étape 2 */}
                {currentStep === 2 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      className="flex-1"
                    >
                      Retour
                    </Button>
                    <Button
                      onClick={handleContinueToPayment}
                      disabled={!selectedRate || loading}
                      className="flex-1"
                      data-testid="button-continue-payment"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("checkout.processing")}
                        </>
                      ) : (
                        t("checkout.continueToPayment")
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {showPayment && (
              <>
                {/* Affichage de l'adresse de livraison sélectionnée */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    {selectedAddressId && savedAddresses.length > 0 ? (
                      (() => {
                        const addr = savedAddresses.find(a => a.id === selectedAddressId);
                        return addr ? (
                          <div className="text-sm">
                            <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                            <p className="text-muted-foreground">{addr.address}</p>
                            {addr.addressLine2 && <p className="text-muted-foreground">{addr.addressLine2}</p>}
                            <p className="text-muted-foreground">{addr.postalCode} {addr.city}, {addr.country}</p>
                          </div>
                        ) : null;
                      })()
                    ) : (
                      <div className="text-sm">
                        <p className="font-medium">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                        <p className="text-muted-foreground">{shippingAddress.address}</p>
                        {shippingAddress.addressLine2 && <p className="text-muted-foreground">{shippingAddress.addressLine2}</p>}
                        <p className="text-muted-foreground">{shippingAddress.postalCode} {shippingAddress.city}, {shippingAddress.country}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("checkout.paymentDetails")}</CardTitle>
                    <CardDescription>{t("checkout.securePayment")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {clientSecret && (
                      <Elements
                        key={clientSecret}
                        options={options}
                        stripe={stripePromise}
                      >
                        <CheckoutForm />
                      </Elements>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t("checkout.orderSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start"
                    data-testid={`order-item-${item.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("checkout.quantity")}: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {getCurrencySymbol(currency)} {convertPrice(item.price * item.quantity, currency).toFixed(2)}
                    </p>
                  </div>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span>{t("checkout.subtotal")}</span>
                    <span data-testid="subtotal-amount">
                      {getCurrencySymbol(currency)} {convertPrice(subtotal, currency).toFixed(2)}
                    </span>
                  </div>
                  {selectedRate && (
                    <div className="flex justify-between items-center">
                      <span>{t("checkout.shipping")}</span>
                      <span data-testid="shipping-amount">
                        {parseFloat(selectedRate.amount).toFixed(2)} €
                      </span>
                    </div>
                  )}
                  {appliedDiscount && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Code promo ({appliedDiscount.code})</span>
                      <span data-testid="discount-amount">-{appliedDiscount.discountAmount.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                    <span>{t("checkout.total")}</span>
                    <span data-testid="total-amount">
                      {getCurrencySymbol(currency)} {(
                        convertPrice(
                          subtotal - (appliedDiscount?.discountAmount || 0),
                          currency
                        ) + (selectedRate ? parseFloat(selectedRate.amount) : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
