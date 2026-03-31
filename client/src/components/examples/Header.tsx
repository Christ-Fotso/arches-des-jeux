import { useState } from "react";
import Header from "../Header";

export default function HeaderExample() {
  const [language, setLanguage] = useState("FR");
  const [cartCount] = useState(3);

  return (
    <Header
      cartItemCount={cartCount}
      currentLanguage={language}
      onLanguageChange={setLanguage}
      isAuthenticated={false}
      onCartClick={() => console.log("Cart opened")}
      onSearchClick={() => console.log("Search opened")}
    />
  );
}
