import os
import re

file_path = 'client/src/pages/Checkout.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The section we want to replace starts with:
start_marker = '<div className="space-y-6">'
# The section ends just before:
end_marker = '<div>\n            <Card>\n              <CardHeader>\n                <CardTitle>{t("checkout.orderSummary")}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers!")
    exit(1)

# Before the left column
prefix = content[:start_idx]
# After the left column
suffix = content[end_idx:]

left_col_original = content[start_idx:end_idx]

# Let's extract the forms to keep them exactly the same
def extract_between(text, start, end):
    s = text.find(start)
    if s == -1: return ""
    e = text.find(end, s + len(start))
    if e == -1: return ""
    return text[s:e+len(end)]

address_form_top = extract_between(left_col_original, '{/* Sélection adresse existante ou nouvelle */}', '</RadioGroup>\n                )')
address_form_list = extract_between(left_col_original, '{/* Liste des adresses sauvegardées */}', '</div>\n                )')
address_form_new = extract_between(left_col_original, '{/* Formulaire nouvelle adresse */}', '</select>\n                    </div>\n                  </>\n                )')
error_text = extract_between(left_col_original, '{error && (', ')}' ) # We'll just write it manually

# Create the new left column
new_left_col = """<div className="space-y-6">
            {/* ETAPE 1: ADRESSE */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">1. Adresse de livraison</CardTitle>
                  {currentStep > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                      Modifier
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStep === 1 ? (
                  <>
                    """ + address_form_top + """
                    """ + address_form_list + """
                    """ + address_form_new + """
                    {error && (
                      <p className="text-sm text-destructive" data-testid="text-error">
                        {error}
                      </p>
                    )}
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
                ) : (
                  (() => {
                    const addr = useNewAddress ? shippingAddress : savedAddresses.find(a => a.id === selectedAddressId);
                    return addr ? (
                      <div className="text-sm">
                        <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                        <p className="text-muted-foreground">{addr.address}</p>
                        {addr.addressLine2 && <p className="text-muted-foreground">{addr.addressLine2}</p>}
                        <p className="text-muted-foreground">{addr.postalCode} {addr.city}, {addr.country}</p>
                        {useNewAddress && shippingAddress.email && <p className="text-muted-foreground">{shippingAddress.email}</p>}
                        {useNewAddress && (shippingAddress as any).phone && <p className="text-muted-foreground">{(shippingAddress as any).phone}</p>}
                      </div>
                    ) : null;
                  })()
                )}
              </CardContent>
            </Card>

            {/* ETAPE 2: LIVRAISON */}
            <Card className={currentStep < 2 ? 'opacity-50 pointer-events-none' : ''}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">2. Mode de livraison</CardTitle>
                  {currentStep > 2 && (
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                      Modifier
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStep < 2 ? (
                  <p className="text-sm text-muted-foreground">Veuillez d'abord valider votre adresse de livraison.</p>
                ) : currentStep === 2 ? (
                  <>
                    <div className="space-y-4">
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
                    
                    <div className="space-y-2 border rounded-lg p-4 bg-muted/20 mt-4">
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
                          ✓ Code <strong>{appliedDiscount.code}</strong> appliqué : -{appliedDiscount.discountAmount.toFixed(2)} €
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
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
                  </>
                ) : (
                  selectedRate ? (
                    <div className="text-sm">
                      <p className="font-medium">{selectedRate.carrier} - {selectedRate.service}</p>
                      <p className="text-muted-foreground">Livraison estimée : {selectedRate.rateId.includes('_fr_') || selectedRate.rateId.includes('-fr-') ? '2-4' : '3-5'} jours</p>
                      <p className="font-medium mt-1">{parseFloat(selectedRate.amount).toFixed(2)} €</p>
                    </div>
                  ) : null
                )}
              </CardContent>
            </Card>

            {/* ETAPE 3: PAIEMENT */}
            <Card className={currentStep < 3 ? 'opacity-50 pointer-events-none' : ''}>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">3. Paiement</CardTitle>
                <CardDescription>{t("checkout.securePayment")}</CardDescription>
              </CardHeader>
              <CardContent>
                {currentStep < 3 ? (
                  <p className="text-sm text-muted-foreground">Veuillez valider vos options de livraison pour procéder au paiement.</p>
                ) : (
                  clientSecret && (
                    <Elements
                      key={clientSecret}
                      options={options}
                      stripe={stripePromise}
                    >
                      <CheckoutForm />
                    </Elements>
                  )
                )}
              </CardContent>
            </Card>
          </div>
          """

new_content = prefix + new_left_col + suffix

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Checkout.tsx updated successfully!")
