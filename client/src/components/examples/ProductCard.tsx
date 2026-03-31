import ProductCard from "../ProductCard";
import serumImage1 from "@assets/generated_images/Luxury_face_serum_product_ebb63e00.png";
import serumImage2 from "@assets/generated_images/Face_serum_alternate_angle_d2eb6748.png";

export default function ProductCardExample() {
  return (
    <div className="p-6 max-w-xs">
      <ProductCard
        id="1"
        title="Sérum de Luxe pour le Visage"
        price={89.90}
        image1={serumImage1}
        image2={serumImage2}
        onAddToCart={(id) => console.log(`Product ${id} added to cart`)}
        onProductClick={(id) => console.log(`Product ${id} clicked`)}
      />
    </div>
  );
}
