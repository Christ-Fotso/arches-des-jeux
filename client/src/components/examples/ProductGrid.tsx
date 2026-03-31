import ProductGrid from "../ProductGrid";
import serumImage1 from "@assets/generated_images/Luxury_face_serum_product_ebb63e00.png";
import serumImage2 from "@assets/generated_images/Face_serum_alternate_angle_d2eb6748.png";
import shampooImage1 from "@assets/generated_images/Premium_shampoo_bottle_50ecea27.png";
import shampooImage2 from "@assets/generated_images/Shampoo_bottle_back_view_3fb15117.png";
import moisturizerImage1 from "@assets/generated_images/Moisturizer_cream_jar_fc9bf9ed.png";
import moisturizerImage2 from "@assets/generated_images/Moisturizer_top_view_12d337a4.png";
import lipstickImage1 from "@assets/generated_images/Luxury_red_lipstick_011ccdfc.png";
import lipstickImage2 from "@assets/generated_images/Lipstick_angled_view_23e9c01e.png";
import eyeshadowImage1 from "@assets/generated_images/Luxury_eye_shadow_palette_60a3d393.png";
import eyeshadowImage2 from "@assets/generated_images/Luxury_eye_shadow_palette_60a3d393.png";

const mockProducts = [
  {
    id: "1",
    title: "Sérum de Luxe pour le Visage",
    price: 89.90,
    image1: serumImage1,
    image2: serumImage2,
  },
  {
    id: "2",
    title: "Shampooing Premium Cheveux",
    price: 45.50,
    image1: shampooImage1,
    image2: shampooImage2,
  },
  {
    id: "3",
    title: "Crème Hydratante Visage",
    price: 125.00,
    image1: moisturizerImage1,
    image2: moisturizerImage2,
  },
  {
    id: "4",
    title: "Rouge à Lèvres Luxe",
    price: 38.90,
    image1: lipstickImage1,
    image2: lipstickImage2,
  },
  {
    id: "5",
    title: "Palette Fards à Paupières",
    price: 67.50,
    image1: eyeshadowImage1,
    image2: eyeshadowImage2,
  },
  {
    id: "6",
    title: "Sérum Anti-Âge Premium",
    price: 149.00,
    image1: serumImage1,
    image2: serumImage2,
  },
];

export default function ProductGridExample() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ProductGrid
        products={mockProducts}
        onAddToCart={(id) => console.log(`Product ${id} added to cart`)}
        onProductClick={(id) => console.log(`Product ${id} clicked`)}
      />
    </div>
  );
}
