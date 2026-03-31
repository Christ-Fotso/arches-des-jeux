import { useState } from "react";
import ShoppingCart from "../ShoppingCart";
import { Button } from "@/components/ui/button";
import serumImage from "@assets/generated_images/Luxury_face_serum_product_ebb63e00.png";
import shampooImage from "@assets/generated_images/Premium_shampoo_bottle_50ecea27.png";

const mockCartItems = [
  {
    id: "1",
    title: "Sérum de Luxe pour le Visage",
    price: 89.90,
    quantity: 2,
    image: serumImage,
  },
  {
    id: "2",
    title: "Shampooing Premium Cheveux",
    price: 45.50,
    quantity: 1,
    image: shampooImage,
  },
];

export default function ShoppingCartExample() {
  const [isOpen, setIsOpen] = useState(true);
  const [items, setItems] = useState(mockCartItems);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Cart</Button>
      <ShoppingCart
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={items}
        onUpdateQuantity={(id, quantity) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, quantity } : item
            )
          );
        }}
        onRemoveItem={(id) => {
          setItems((prev) => prev.filter((item) => item.id !== id));
        }}
        onApplyDiscount={(code) => console.log(`Discount code: ${code}`)}
        onCheckout={() => console.log("Checkout")}
      />
    </div>
  );
}
