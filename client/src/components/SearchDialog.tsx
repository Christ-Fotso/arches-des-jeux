import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchResult {
  id: string;
  title: string;
  price: number;
  image: string;
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  results?: SearchResult[];
  onResultClick?: (id: string) => void;
}

export default function SearchDialog({
  isOpen,
  onClose,
  onSearch,
  results = [],
  onResultClick,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        data-testid="overlay-search"
      />
      <div className="fixed top-0 left-0 right-0 z-50 bg-background shadow-lg transform transition-transform duration-300">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Search className="h-6 w-6 text-muted-foreground" />
            <Input
              placeholder="Rechercher des produits..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="text-lg"
              autoFocus
              data-testid="input-search"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-search"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {query && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.length > 0 ? (
                results.map((result) => (
                  <button
                    key={result.id}
                    className="w-full flex items-center gap-4 p-4 hover-elevate rounded-md"
                    onClick={() => {
                      onResultClick?.(result.id);
                      console.log(`Clicked result: ${result.id}`);
                    }}
                    data-testid={`result-${result.id}`}
                  >
                    <img
                      src={result.image}
                      alt={result.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 text-left">
                      <h3 className="font-medium">{result.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        € {result.price.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucun résultat trouvé
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
