import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product & {
    ratingAverage: number;
    ratingCount: number;
    brandName: string | null;
  };
  onAddToCart?: () => void;
  onClick?: () => void;
}

export default function ProductCard({ product, onAddToCart, onClick }: ProductCardProps) {
  const { t, language } = useLanguage();

  const titleKey = `title${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof Product;
  const descKey = `description${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof Product;
  const altKey = `altText${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof Product;

  const originalPrice = parseFloat(product.price);
  const discountPercentage = product.discountPercentage || 0;
  const discountedPrice = discountPercentage > 0 
    ? originalPrice * (1 - discountPercentage / 100) 
    : originalPrice;

  return (
    <Card className="flex flex-col group hover-elevate" data-testid={`card-product-${product.id}`}>
      <CardHeader className="p-0 relative overflow-hidden cursor-pointer" onClick={onClick}>
        {discountPercentage > 0 && (
          <Badge 
            className="absolute top-2 right-2 z-10 bg-red-500 text-white hover:bg-red-600 text-xs"
            data-testid={`badge-discount-${product.id}`}
          >
            -{discountPercentage}%
          </Badge>
        )}
        <img
          src={product.imageUrl1}
          alt={product[altKey] as string}
          className="w-full h-40 object-cover rounded-t-md transition-opacity duration-300 group-hover:opacity-0"
          data-testid={`img-product-${product.id}`}
        />
        <img
          src={product.imageUrl2}
          alt={product[altKey] as string}
          className="w-full h-40 object-cover rounded-t-md absolute top-0 left-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          data-testid={`img-product-hover-${product.id}`}
        />
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-base font-bold cursor-pointer flex-1" onClick={onClick} data-testid={`text-product-title-${product.id}`}>
            {product[titleKey] as string}
          </CardTitle>
          {product.brandName && (
            <Badge variant="secondary" className="text-xs shrink-0" data-testid={`badge-brand-${product.id}`}>
              {product.brandName}
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2 mb-3 text-xs" data-testid={`text-product-desc-${product.id}`}>
          {product[descKey] as string}
        </CardDescription>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5" data-testid={`text-product-rating-${product.id}`}>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((starIndex) => (
                <Star
                  key={starIndex}
                  className={`w-3 h-3 ${
                    starIndex <= Math.round(product.ratingAverage)
                      ? "fill-primary text-primary"
                      : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                  }`}
                />
              ))}
            </div>
            {product.ratingCount > 0 ? (
              <span className="text-xs text-muted-foreground">
                {product.ratingAverage.toFixed(1)} ({product.ratingCount})
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{t("products.noReviews")}</span>
            )}
          </div>
          <div>
            {discountPercentage > 0 ? (
              <div className="flex items-center gap-1.5">
                <p className="text-sm text-muted-foreground line-through" data-testid={`text-product-price-original-${product.id}`}>
                  € {originalPrice.toFixed(2)}
                </p>
                <p className="text-lg font-bold text-red-500" data-testid={`text-product-price-${product.id}`}>
                  € {discountedPrice.toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-lg font-bold" data-testid={`text-product-price-${product.id}`}>
                € {originalPrice.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          size="sm"
          className="w-full"
          disabled={product.quantityInStock === 0}
          onClick={onAddToCart}
          data-testid={`button-add-to-cart-${product.id}`}
        >
          {product.quantityInStock === 0 ? t("products.outOfStock") : t("products.addToCart")}
        </Button>
      </CardFooter>
    </Card>
  );
}
