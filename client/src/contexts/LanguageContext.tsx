import { createContext, useContext, useState, useEffect } from "react";

type Language = "fr" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  fr: {
    // Navigation
    "nav.products": "Produits",
    "nav.about": "À propos",
    "about.story.title": "Notre Histoire",
    "about.story.p1": "« C’est quoi le verset ? » est né d'une passion pour la transmission de la foi chrétienne d'une manière ludique et éducative.",
    "about.story.p2": "Nous créons des jeux bibliques qui rassemblent, éduquent et divertissent, tout en restant fidèle aux valeurs catholiques.",
    "about.mission.title": "Notre Mission",
    "about.mission.text": "Notre mission est de rendre l'apprentissage de la Bible et de la spiritualité chrétienne accessible et amusant pour toutes les familles.",
    "nav.support": "Support",
    "nav.login": "Connexion",
    "nav.register": "Créer un compte",
    "nav.logout": "Déconnexion",
    "nav.profile": "Profil",
    "nav.admin": "Administration",

    // Home
    "home.title": "L'Arche des Jeux - C'est quoi le verset ?",
    "home.subtitle": "Apprenez chaque verset de la Bible en famille avec nos jeux chrétiens",
    "home.cta": "Voir le jeu",

    // 404 Not Found
    "notfound.title": "Page Introuvable",
    "notfound.subtitle": "Oops... Il semble que vous vous soyez égaré du chemin !",
    "notfound.description": "La page que vous recherchez n'existe pas ou a été déplacée.",
    "notfound.backHome": "Retour à l'accueil",

    // Auth
    "auth.login": "Connexion",
    "auth.register": "Créer un compte",
    "auth.email": "Email",
    "auth.password": "Mot de passe",
    "auth.name": "Nom complet",
    "auth.confirmPassword": "Confirmer le mot de passe",
    "auth.forgotPassword": "Mot de passe oublié?",
    "auth.noAccount": "Pas de compte?",
    "auth.hasAccount": "Déjà un compte?",
    "auth.signIn": "Se connecter",
    "auth.signUp": "S'inscrire",
    "auth.createAccount": "Créer votre compte",

    // Products
    "products.title": "Nos Produits",
    "products.search": "Rechercher des produits...",
    "products.price": "Prix",
    "products.stock": "En stock",
    "products.outOfStock": "Rupture de stock",
    "products.addToCart": "Ajouter au panier",
    "products.review": "avis",
    "products.reviews": "avis",
    "products.noReviews": "Aucun avis",

    // Admin
    "admin.dashboard": "Tableau de bord",
    "admin.products": "Produits",
    "admin.discounts": "Codes promo",
    "admin.stats": "Statistiques",
    "admin.settings": "Paramètres",
    "admin.addProduct": "Ajouter un produit",
    "admin.editProduct": "Modifier le produit",
    "admin.deleteProduct": "Supprimer",
    "admin.siteSettings": "Paramètres du site",
    "admin.siteSettingsDesc": "Gérez les paramètres généraux de votre site",
    "admin.defaultLanguage": "Langue par défaut",
    "admin.defaultLanguageDesc": "Cette langue sera utilisée par défaut pour tous les nouveaux visiteurs",
    "admin.settingsUpdated": "Paramètres mis à jour",
    "admin.settingsUpdatedDesc": "Les paramètres du site ont été enregistrés avec succès",
    "admin.settingsUpdateError": "Erreur lors de la mise à jour des paramètres",

    // Common
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succès",
    "common.cancel": "Annuler",
    "common.save": "Enregistrer",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",

    // Support
    "support.title": "Support Client",
    "support.contactUs": "Contactez-nous",
    "support.email": "Email",
    "support.phone": "Téléphone",
    "support.hours": "Horaires d'ouverture",
    "support.hoursValue": "Lun-Dim: 9h00 - 20h00",
    "support.sendMessage": "Envoyez-nous un message",
    "support.name": "Nom",
    "support.message": "Message",
    "support.send": "Envoyer",
    "support.faq": "Questions Fréquentes",
    "support.faq1Q": "Quels sont les délais de livraison ?",
    "support.faq1A": "Les commandes sont généralement livrées en 2-4 jours ouvrables en France.",
    "support.faq2Q": "Comment puis-je retourner un produit ?",
    "support.faq2A": "Vous pouvez retourner tout produit dans les 30 jours suivant la réception s'il n'est pas endommagé. Contactez-nous pour obtenir un numéro de retour.",
    "support.faq3Q": "Le jeu convient-il aux enfants ?",
    "support.faq3A": "Absolument ! Notre jeu est conçu pour être joué en famille et convient à tous les âges.",

    // Legal
    "legal.title": "Mentions Légales",
    "legal.companyInfo": "Informations sur l'entreprise",
    "legal.companyName": "Nom de l'entreprise",
    "legal.address": "Adresse",
    "legal.terms": "Conditions Générales de Vente",
    "legal.terms1Title": "1. Objet",
    "legal.terms1Text": "Les présentes conditions générales de vente régissent les ventes de jeux effectuées par L'Arche des jeux.",
    "legal.terms2Title": "2. Commandes",
    "legal.terms2Text": "Toute commande passée sur notre site implique l'acceptation sans réserve des présentes conditions générales de vente.",
    "legal.terms3Title": "3. Prix",
    "legal.terms3Text": "Les prix sont indiqués en euros (EUR) et incluent la TVA applicable.",
    "legal.terms4Title": "4. Livraison",
    "legal.terms4Text": "Les délais de livraison sont de 2-3 jours ouvrables en Suisse. Les frais de livraison sont calculés lors du passage de la commande.",
    "legal.terms5Title": "5. Retours",
    "legal.terms5Text": "Vous disposez d'un délai de 30 jours pour retourner tout produit ne vous convenant pas.",
    "legal.privacyTitle": "Politique de Confidentialité",
    "legal.privacy1Title": "Collecte des données",
    "legal.privacy1Text": "Nous collectons les données personnelles nécessaires au traitement de vos commandes et à l'amélioration de nos services.",
    "legal.privacy2Title": "Utilisation des données",
    "legal.privacy2Text": "Vos données sont utilisées uniquement pour le traitement de vos commandes et ne sont jamais partagées avec des tiers sans votre consentement.",
    "legal.privacy3Title": "Sécurité",
    "legal.privacy3Text": "Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données personnelles.",

    // Cart
    "cart.title": "Panier",
    "cart.empty": "Votre panier est vide",
    "cart.subtotal": "Sous-total",
    "cart.discount": "Réduction",
    "cart.total": "Total",
    "cart.discountCode": "Code de réduction",
    "cart.apply": "Appliquer",
    "cart.checkout": "Passer la commande",
    "cart.authRequired": "Authentification requise",
    "cart.pleaseLogin": "Veuillez vous connecter pour passer la commande",

    // Payment
    "checkout.title": "Paiement",
    "checkout.orderSummary": "Récapitulatif de la commande",
    "checkout.paymentDetails": "Informations de paiement",
    "checkout.securePayment": "Paiement sécurisé par Stripe",
    "checkout.quantity": "Quantité",
    "checkout.subtotal": "Sous-total",
    "checkout.shipping": "Livraison",
    "checkout.total": "Total",
    "checkout.payNow": "Payer maintenant",
    "checkout.processing": "Traitement...",
    "checkout.confirmingOrder": "Confirmation de votre commande...",
    "checkout.loading": "Initialisation du paiement...",
    "checkout.error": "Erreur",
    "checkout.paymentFailed": "Échec du paiement",
    "checkout.paymentSuccess": "Paiement réussi !",
    "checkout.orderConfirmed": "Votre commande a été confirmée",
    "checkout.orderCreationFailed": "Impossible de créer la commande",
    "checkout.noPaymentIntent": "Informations de paiement manquantes",
    "checkout.orderNumber": "Numéro de commande",
    "checkout.somethingWentWrong": "Une erreur s'est produite",
    "checkout.tryAnotherCard": "Payer avec une autre carte",
    "checkout.shippingAddress": "Adresse de livraison",
    "checkout.enterShippingDetails": "Entrez votre adresse de livraison",
    "checkout.firstName": "Prénom",
    "checkout.firstNamePlaceholder": "Jean",
    "checkout.lastName": "Nom",
    "checkout.lastNamePlaceholder": "Dupont",
    "checkout.address": "Adresse",
    "checkout.addressPlaceholder": "Rue de la Gare 15",
    "checkout.addressLine2": "Complément d'adresse",
    "checkout.addressLine2Placeholder": "Appartement, étage, etc.",
    "checkout.city": "Ville",
    "checkout.cityPlaceholder": "Genève",
    "checkout.postalCode": "Code postal",
    "checkout.postalCodePlaceholder": "1200",
    "checkout.country": "Pays",
    "checkout.selectCountry": "Sélectionner un pays",
    "checkout.otherCountry": "Autre pays",
    "checkout.addressRequired": "Veuillez remplir tous les champs obligatoires",
    "checkout.continueToPayment": "Continuer vers le paiement",
    "myOrders.title": "Mes commandes",
    "myOrders.noOrders": "Vous n'avez pas encore passé de commande",
    "myOrders.orderNumber": "Commande n°",
    "myOrders.date": "Date",
    "myOrders.status": "Statut",
    "myOrders.total": "Total",
    "myOrders.items": "Articles",
    "myOrders.shippingAddress": "Adresse de livraison",
    "myOrders.trackingNumber": "Numéro de suivi",
    "myOrders.noTracking": "Pas encore disponible",
    "myOrders.status.PENDING": "En attente",
    "myOrders.status.CONFIRMED": "Confirmée",
    "myOrders.status.SHIPPED": "Expédiée",
    "myOrders.status.DELIVERED": "Livrée",
    "myOrders.status.CANCELLED": "Annulée",
    "reviews.title": "Avis clients",
    "reviews.leaveReview": "Laisser un avis",
    "reviews.yourRating": "Votre note",
    "reviews.yourComment": "Votre commentaire",
    "reviews.commentPlaceholder": "Partagez votre expérience avec ce produit (minimum 10 caractères)",
    "reviews.submit": "Publier l'avis",
    "reviews.cancel": "Annuler",
    "reviews.noReviews": "Aucun avis pour le moment",
    "reviews.beFirst": "Soyez le premier à donner votre avis !",
    "reviews.rating": "Note",
    "reviews.basedOn": "Basé sur",
    "reviews.review": "avis",
    "reviews.reviews": "avis",
    "reviews.success": "Merci pour votre avis !",
    "reviews.error": "Erreur lors de la publication de l'avis",
    "reviews.alreadyReviewed": "Vous avez déjà laissé un avis pour ce produit",
    "reviews.mustPurchase": "Vous devez acheter ce produit pour laisser un avis",
    "reviews.by": "par",
    "payment.success.title": "Paiement réussi !",
    "payment.success.description": "Votre commande a été confirmée",
    "payment.success.confirmation": "Vous recevrez un email de confirmation avec les détails de votre commande.",
    "payment.success.backToHome": "Retour à l'accueil",
    "payment.success.continueShopping": "Continuer mes achats",
    "payment.cancel.title": "Paiement annulé",
    "payment.cancel.description": "Votre paiement n'a pas été traité",
    "payment.cancel.message": "Votre panier a été conservé. Vous pouvez réessayer quand vous voulez.",
    "payment.cancel.backToHome": "Retour à l'accueil",
    "payment.cancel.continueShopping": "Retourner au panier",

    // Footer
    "footer.tagline": "Vivre la foi à travers le jeu - Votre destination pour des jeux bibliques premium",
    "footer.quickLinks": "Liens Rapides",
    "footer.products": "Produits",
    "footer.support": "Support",
    "footer.legal": "Mentions Légales",
    "footer.contact": "Contact",
    "footer.email": "Email",
    "footer.phone": "Téléphone",
    "footer.copyright": "Tous droits réservés.",
  },
  en: {
    // Navigation
    "nav.products": "Products",
    "nav.about": "About Us",
    "about.story.title": "Our Story",
    "about.story.p1": "\"What’s the verse?\" was born from a shared passion for discovering the Scriptures in a new and friendly way.",
    "about.story.p2": "We wanted to create a game that brings people together, educates and entertains, while remaining faithful to biblical values.",
    "about.mission.title": "Our Mission",
    "about.mission.text": "Our mission is to make learning the Bible accessible and fun for all families and youth groups.",
    "nav.support": "Support",
    "nav.login": "Login",
    "nav.register": "Sign Up",
    "nav.logout": "Logout",
    "nav.profile": "Profile",
    "nav.admin": "Admin",

    // Home
    "home.title": "The Ark of Games - C'est quoi le verset ?",
    "home.subtitle": "Learn every Bible verse with your family through our Christian games",
    "home.cta": "Explore the game",

    // 404 Not Found
    "notfound.title": "Page Not Found",
    "notfound.subtitle": "Oops... It looks like you've wandered off the path!",
    "notfound.description": "The page you are looking for does not exist or has been moved.",
    "notfound.backHome": "Back to Home",

    // Auth
    "auth.login": "Login",
    "auth.register": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Full Name",
    "auth.confirmPassword": "Confirm Password",
    "auth.forgotPassword": "Forgot password?",
    "auth.noAccount": "No account?",
    "auth.hasAccount": "Already have an account?",
    "auth.signIn": "Sign In",
    "auth.signUp": "Sign Up",
    "auth.createAccount": "Create your account",

    // Products
    "products.title": "Our Products",
    "products.search": "Search products...",
    "products.price": "Price",
    "products.stock": "In stock",
    "products.outOfStock": "Out of stock",
    "products.addToCart": "Add to cart",
    "products.review": "review",
    "products.reviews": "reviews",
    "products.noReviews": "No reviews",

    // Admin
    "admin.dashboard": "Dashboard",
    "admin.products": "Products",
    "admin.discounts": "Discount codes",
    "admin.stats": "Statistics",
    "admin.settings": "Settings",
    "admin.addProduct": "Add product",
    "admin.editProduct": "Edit product",
    "admin.deleteProduct": "Delete",
    "admin.siteSettings": "Site Settings",
    "admin.siteSettingsDesc": "Manage your site's general settings",
    "admin.defaultLanguage": "Default Language",
    "admin.defaultLanguageDesc": "This language will be used by default for all new visitors",
    "admin.settingsUpdated": "Settings Updated",
    "admin.settingsUpdatedDesc": "Site settings have been saved successfully",
    "admin.settingsUpdateError": "Error updating settings",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",

    // Support
    "support.title": "Customer Support",
    "support.contactUs": "Contact Us",
    "support.email": "Email",
    "support.phone": "Phone",
    "support.hours": "Opening Hours",
    "support.hoursValue": "Mon-Sun: 9:00 AM - 8:00 PM",
    "support.sendMessage": "Send us a message",
    "support.name": "Name",
    "support.message": "Message",
    "support.send": "Send",
    "support.faq": "Frequently Asked Questions",
    "support.faq1Q": "What are the delivery times?",
    "support.faq1A": "Orders are usually delivered within 2-4 business days in France.",
    "support.faq2Q": "How can I return a product?",
    "support.faq2A": "You can return any product within 30 days of receipt if it's undamaged. Contact us to get a return number.",
    "support.faq3Q": "Is the game suitable for children?",
    "support.faq3A": "Absolutely! Our game is designed for family play and is suitable for all ages.",

    // Legal
    "legal.title": "Legal Notice",
    "legal.companyInfo": "Company Information",
    "legal.companyName": "Company Name",
    "legal.address": "Address",
    "legal.terms": "Terms and Conditions",
    "legal.terms1Title": "1. Purpose",
    "legal.terms1Text": "These general terms and conditions govern the sale of games by L'Arche des jeux.",
    "legal.terms2Title": "2. Orders",
    "legal.terms2Text": "Any order placed on our website implies unreserved acceptance of these general terms and conditions.",
    "legal.terms3Title": "3. Prices",
    "legal.terms3Text": "Prices are indicated in euros (EUR) and include applicable VAT.",
    "legal.terms4Title": "4. Delivery",
    "legal.terms4Text": "Delivery times are 2-3 business days in Switzerland. Shipping costs are calculated when placing the order.",
    "legal.terms5Title": "5. Returns",
    "legal.terms5Text": "You have 30 days to return any product that does not suit you.",
    "legal.privacyTitle": "Privacy Policy",
    "legal.privacy1Title": "Data Collection",
    "legal.privacy1Text": "We collect personal data necessary for processing your orders and improving our services.",
    "legal.privacy2Title": "Data Usage",
    "legal.privacy2Text": "Your data is used only for processing your orders and is never shared with third parties without your consent.",
    "legal.privacy3Title": "Security",
    "legal.privacy3Text": "We implement appropriate security measures to protect your personal data.",

    // Cart
    "cart.title": "Shopping Cart",
    "cart.empty": "Your cart is empty",
    "cart.subtotal": "Subtotal",
    "cart.discount": "Discount",
    "cart.total": "Total",
    "cart.discountCode": "Discount code",
    "cart.apply": "Apply",
    "cart.checkout": "Checkout",
    "cart.authRequired": "Authentication Required",
    "cart.pleaseLogin": "Please log in to proceed with checkout",

    // Payment
    "checkout.title": "Checkout",
    "checkout.orderSummary": "Order Summary",
    "checkout.paymentDetails": "Payment Details",
    "checkout.securePayment": "Secure payment powered by Stripe",
    "checkout.quantity": "Quantity",
    "checkout.subtotal": "Subtotal",
    "checkout.shipping": "Shipping",
    "checkout.total": "Total",
    "checkout.payNow": "Pay Now",
    "checkout.processing": "Processing...",
    "checkout.confirmingOrder": "Confirming your order...",
    "checkout.loading": "Initializing payment...",
    "checkout.error": "Error",
    "checkout.paymentFailed": "Payment Failed",
    "checkout.paymentSuccess": "Payment Successful!",
    "checkout.orderConfirmed": "Your order has been confirmed",
    "checkout.orderCreationFailed": "Failed to create order",
    "checkout.noPaymentIntent": "Payment information missing",
    "checkout.orderNumber": "Order Number",
    "checkout.somethingWentWrong": "Something went wrong",
    "checkout.tryAnotherCard": "Try Another Card",
    "checkout.shippingAddress": "Shipping Address",
    "checkout.enterShippingDetails": "Enter your shipping details",
    "checkout.firstName": "First Name",
    "checkout.firstNamePlaceholder": "John",
    "checkout.lastName": "Last Name",
    "checkout.lastNamePlaceholder": "Smith",
    "checkout.address": "Address",
    "checkout.addressPlaceholder": "Main Street 15",
    "checkout.addressLine2": "Address Line 2",
    "checkout.addressLine2Placeholder": "Apartment, floor, etc.",
    "checkout.city": "City",
    "checkout.cityPlaceholder": "Geneva",
    "checkout.postalCode": "Postal Code",
    "checkout.postalCodePlaceholder": "1200",
    "checkout.country": "Country",
    "checkout.selectCountry": "Select a country",
    "checkout.otherCountry": "Other country",
    "checkout.addressRequired": "Please fill in all required fields",
    "checkout.continueToPayment": "Continue to Payment",
    "myOrders.title": "My Orders",
    "myOrders.noOrders": "You haven't placed any orders yet",
    "myOrders.orderNumber": "Order #",
    "myOrders.date": "Date",
    "myOrders.status": "Status",
    "myOrders.total": "Total",
    "myOrders.items": "Items",
    "myOrders.shippingAddress": "Shipping Address",
    "myOrders.trackingNumber": "Tracking Number",
    "myOrders.noTracking": "Not available yet",
    "myOrders.status.PENDING": "Pending",
    "myOrders.status.CONFIRMED": "Confirmed",
    "myOrders.status.SHIPPED": "Shipped",
    "myOrders.status.DELIVERED": "Delivered",
    "myOrders.status.CANCELLED": "Cancelled",
    "reviews.title": "Customer Reviews",
    "reviews.leaveReview": "Leave a Review",
    "reviews.yourRating": "Your Rating",
    "reviews.yourComment": "Your Comment",
    "reviews.commentPlaceholder": "Share your experience with this product (minimum 10 characters)",
    "reviews.submit": "Submit Review",
    "reviews.cancel": "Cancel",
    "reviews.noReviews": "No reviews yet",
    "reviews.beFirst": "Be the first to leave a review!",
    "reviews.rating": "Rating",
    "reviews.basedOn": "Based on",
    "reviews.review": "review",
    "reviews.reviews": "reviews",
    "reviews.success": "Thank you for your review!",
    "reviews.error": "Error submitting review",
    "reviews.alreadyReviewed": "You have already reviewed this product",
    "reviews.mustPurchase": "You must purchase this product to leave a review",
    "reviews.by": "by",
    "payment.success.title": "Payment Successful!",
    "payment.success.description": "Your order has been confirmed",
    "payment.success.confirmation": "You will receive a confirmation email with your order details.",
    "payment.success.backToHome": "Back to Home",
    "payment.success.continueShopping": "Continue Shopping",
    "payment.cancel.title": "Payment Cancelled",
    "payment.cancel.description": "Your payment was not processed",
    "payment.cancel.message": "Your cart has been saved. You can try again whenever you're ready.",
    "payment.cancel.backToHome": "Back to Home",
    "payment.cancel.continueShopping": "Back to Cart",

    // Footer
    "footer.tagline": "Your destination for premium beauty products in Switzerland",
    "footer.quickLinks": "Quick Links",
    "footer.products": "Products",
    "footer.support": "Support",
    "footer.legal": "Legal Notice",
    "footer.contact": "Contact",
    "footer.email": "Email",
    "footer.phone": "Phone",
    "footer.copyright": "All rights reserved.",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      const saved = localStorage.getItem("language");
      if (saved) {
        setLanguageState(saved as Language);
        setIsInitialized(true);
      } else {
        try {
          const response = await fetch("/api/settings");
          if (response.ok) {
            const settings = await response.json();
            const defaultLang = settings.defaultLanguage as Language || "fr";
            setLanguageState(defaultLang);
            localStorage.setItem("language", defaultLang);
          }
        } catch (error) {
          console.error("Failed to fetch default language:", error);
        } finally {
          setIsInitialized(true);
        }
      }
    };

    initializeLanguage();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("language", language);
    }
  }, [language, isInitialized]);

  const setLanguage = (lang: Language) => {
    console.log("Language changed to", lang.toUpperCase());
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.fr] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
