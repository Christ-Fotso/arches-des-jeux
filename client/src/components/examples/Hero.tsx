import Hero from "../Hero";
import heroImage from "@assets/generated_images/Hero_banner_beauty_image_87edf850.png";

export default function HeroExample() {
  return (
    <Hero
      title="Beauté Suisse"
      subtitle="Découvrez notre collection de produits de beauté premium"
      ctaText="Découvrir la collection"
      ctaLink="/products"
      backgroundImage={heroImage}
    />
  );
}
