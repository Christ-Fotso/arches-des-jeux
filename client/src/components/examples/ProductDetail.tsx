import ProductDetail from "../ProductDetail";
import serumImage1 from "@assets/generated_images/Luxury_face_serum_product_ebb63e00.png";
import serumImage2 from "@assets/generated_images/Face_serum_alternate_angle_d2eb6748.png";

export default function ProductDetailExample() {
  return (
    <ProductDetail
      title="Sérum de Luxe pour le Visage"
      description="Un sérum visage luxueux qui hydrate en profondeur et aide à réduire les signes de l'âge. Formulé avec des ingrédients premium pour une peau éclatante et rajeunie. Convient à tous les types de peau."
      price={89.90}
      image1={serumImage1}
      image2={serumImage2}
      deliveryEstimate="2-3 jours ouvrables"
      onAddToCart={(quantity) => console.log(`Added ${quantity} to cart`)}
    />
  );
}
