import { useState } from "react";
import SearchDialog from "../SearchDialog";
import { Button } from "@/components/ui/button";
import serumImage from "@assets/generated_images/Luxury_face_serum_product_ebb63e00.png";
import shampooImage from "@assets/generated_images/Premium_shampoo_bottle_50ecea27.png";

const mockResults = [
  {
    id: "1",
    title: "Sérum de Luxe pour le Visage",
    price: 89.90,
    image: serumImage,
  },
  {
    id: "2",
    title: "Shampooing Premium Cheveux",
    price: 45.50,
    image: shampooImage,
  },
];

export default function SearchDialogExample() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Search</Button>
      <SearchDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSearch={(query) => console.log("Search:", query)}
        results={mockResults}
        onResultClick={(id) => console.log("Clicked:", id)}
      />
    </div>
  );
}
