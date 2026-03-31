import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ProductDetailProps {
  title: string;
  description: string;
  price: number;
  image1: string;
  image2: string;
  deliveryEstimate?: string;
  onAddToCart?: (quantity: number) => void;
}

export default function ProductDetail({
  title,
  description,
  price,
  image1,
  image2,
  deliveryEstimate = "2-3 jours ouvrables",
  onAddToCart,
}: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(image1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg bg-card">
            <img
              src={mainImage}
              alt={title}
              className="w-full h-full object-cover"
              data-testid="img-product-main"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMainImage(image1)}
              className="aspect-square overflow-hidden rounded-lg border-2 hover:border-primary transition-colors"
              data-testid="button-thumbnail-1"
            >
              <img
                src={image1}
                alt={`${title} - View 1`}
                className="w-full h-full object-cover"
              />
            </button>
            <button
              onClick={() => setMainImage(image2)}
              className="aspect-square overflow-hidden rounded-lg border-2 hover:border-primary transition-colors"
              data-testid="button-thumbnail-2"
            >
              <img
                src={image2}
                alt={`${title} - View 2`}
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1
              className="text-4xl font-serif font-bold mb-4"
              data-testid="text-product-title"
            >
              {title}
            </h1>
            <p
              className="text-3xl font-bold text-primary mb-6"
              data-testid="text-product-price"
            >
              € {price.toFixed(2)}
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </div>

          <Separator />

          <div>
            <h2 className="font-semibold mb-2">Livraison estimée</h2>
            <p className="text-muted-foreground" data-testid="text-delivery-estimate">
              {deliveryEstimate}
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="font-semibold mb-4">Quantité</h2>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                data-testid="button-decrease-quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-xl font-semibold w-12 text-center" data-testid="text-quantity">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                data-testid="button-increase-quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full text-lg"
            onClick={() => {
              onAddToCart?.(quantity);
              console.log(`Added ${quantity} items to cart`);
            }}
            data-testid="button-add-to-cart"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Ajouter au panier
          </Button>
        </div>
      </div>
    </div>
  );
}
