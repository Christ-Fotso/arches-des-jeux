import { useState } from "react";
import { useLocation } from "wouter";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  items?: CartItem[];
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem?: (id: string) => void;
  onApplyDiscount?: (code: string) => void;
  onCheckout?: () => void;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onCheckout,
}: ShoppingCartProps) {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [discountCode, setDiscountCode] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = 0;
  const total = subtotal - discount;

  const handleCheckout = () => {
    onClose();
    setLocation("/checkout");
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        data-testid="overlay-cart"
      />
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-background z-50 shadow-2xl transform transition-transform duration-300 flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-semibold" data-testid="text-cart-title">
            {t("cart.title")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-cart"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("cart.empty")}
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4"
                  data-testid={`cart-item-${item.id}`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    <p className="text-sm font-bold mt-1">
                      € {item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          onUpdateQuantity?.(item.id, Math.max(1, item.quantity - 1));
                          console.log(`Decreased quantity for ${item.id}`);
                        }}
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          onUpdateQuantity?.(item.id, item.quantity + 1);
                          console.log(`Increased quantity for ${item.id}`);
                        }}
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-auto"
                        onClick={() => {
                          onRemoveItem?.(item.id);
                          console.log(`Removed item ${item.id}`);
                        }}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder={t("cart.discountCode")}
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                data-testid="input-discount-code"
              />
              <Button
                variant="outline"
                onClick={() => {
                  onApplyDiscount?.(discountCode);
                  console.log(`Applied discount code: ${discountCode}`);
                }}
                data-testid="button-apply-discount"
              >
                {t("cart.apply")}
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t("cart.subtotal")}</span>
                <span data-testid="text-subtotal">€ {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>{t("cart.discount")}</span>
                  <span data-testid="text-discount">-€ {discount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>{t("cart.total")}</span>
                <span data-testid="text-total">€ {total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-6"
              size="lg"
              onClick={handleCheckout}
              data-testid="button-checkout"
            >
              {t("cart.checkout")}
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cart.authRequired")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cart.pleaseLogin")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowAuthDialog(false);
                onClose();
                setLocation("/login");
              }}
            >
              {t("nav.login")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
