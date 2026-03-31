import ProductCard from "./ProductCard";

interface Product {
  id: string;
  title: string;
  price: number;
  image1: string;
  image2: string;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (id: string) => void;
  onProductClick?: (id: string) => void;
}

export default function ProductGrid({
  products,
  onAddToCart,
  onProductClick,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          title={product.title}
          price={product.price}
          image1={product.image1}
          image2={product.image2}
          onAddToCart={onAddToCart}
          onProductClick={onProductClick}
        />
      ))}
    </div>
  );
}
