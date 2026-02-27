/*
  VADEN ORIGINAL - Search Autocomplete Component
  Design: Industrial Precision - Dark dropdown with orange highlights
*/

import { useState, useEffect, useRef } from "react";
import { Search, TrendingUp, Package } from "lucide-react";
import {
  getAutocompleteSuggestions,
  AutocompleteSuggestion,
} from "@/lib/autocomplete";
import type { DisplayProduct } from "@/lib/contentProducts";

interface SearchAutocompleteProps {
  products?: DisplayProduct[];
  suggestions?: AutocompleteSuggestion[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  labels?: {
    oem?: string;
    product?: string;
    category?: string;
  };
}

export default function SearchAutocomplete({
  products,
  suggestions: externalSuggestions,
  value,
  onChange,
  onSelect,
  onSearch,
  placeholder = "OEM kodu veya ürün adı girin...",
  labels,
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate suggestions when input changes
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (externalSuggestions) {
      const nextSuggestions = externalSuggestions.slice(0, 8);
      setSuggestions(nextSuggestions);
      setIsOpen(nextSuggestions.length > 0);
      setSelectedIndex(-1);
      return;
    }

    if (!products || products.length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const nextSuggestions = getAutocompleteSuggestions(products, value, 8);
    setSuggestions(nextSuggestions);
    setIsOpen(nextSuggestions.length > 0);
    setSelectedIndex(-1);
  }, [externalSuggestions, products, value]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "Enter" && value.trim()) {
        onSearch(value);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (value.trim()) {
          onSearch(value);
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    onChange(suggestion.value);
    onSelect(suggestion);
    setIsOpen(false);
    onSearch(suggestion.value);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Input */}
      <div className="flex items-center bg-[var(--vaden-surface-14)] border border-[var(--vaden-border-strong)] focus-within:border-[oklch(0.60_0.18_42)] transition-colors">
        <Search size={18} className="ml-4 text-[oklch(0.45_0.01_250)] flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim() && setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-4 py-3.5 text-[var(--vaden-on-surface)] placeholder-[var(--vaden-text-placeholder)] text-sm outline-none font-['Inter']"
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--vaden-surface-14)] border border-[var(--vaden-border-strong)] shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Group by type */}
          {(() => {
            const grouped = {
              oem: suggestions.filter((s) => s.type === "oem"),
              product: suggestions.filter((s) => s.type === "product"),
              category: suggestions.filter((s) => s.type === "category"),
            };

            let currentIndex = 0;
            const groups = [];

            // OEM Codes
            if (grouped.oem.length > 0) {
              groups.push(
                <div key="oem-group">
                  <div className="px-4 py-2 text-xs font-['Barlow_Condensed'] font-bold text-[oklch(0.60_0.18_42)] uppercase tracking-wide border-b border-[var(--vaden-border-soft)]">
                    {labels?.oem || "OEM Kodları"}
                  </div>
                  {grouped.oem.map((suggestion, idx) => {
                    const itemIndex = currentIndex;
                    currentIndex++;
                    return (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3 ${
                          itemIndex === selectedIndex
                            ? "bg-[oklch(0.60_0.18_42)] text-white"
                            : "text-[var(--vaden-text-muted)] hover:bg-[var(--vaden-surface-border)]"
                        }`}
                      >
                        <Search size={14} className="flex-shrink-0" />
                        <span className="font-mono font-bold">
                          {suggestion.label}
                        </span>
                        {suggestion.icon && (
                          <span className="ml-auto text-xs opacity-60">
                            {suggestion.icon}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            }

            // Products
            if (grouped.product.length > 0) {
              groups.push(
                <div key="product-group">
                  <div className="px-4 py-2 text-xs font-['Barlow_Condensed'] font-bold text-[oklch(0.60_0.18_42)] uppercase tracking-wide border-b border-[var(--vaden-border-soft)]">
                    {labels?.product || "Ürünler"}
                  </div>
                  {grouped.product.map((suggestion, idx) => {
                    const itemIndex = currentIndex;
                    currentIndex++;
                    return (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3 ${
                          itemIndex === selectedIndex
                            ? "bg-[oklch(0.60_0.18_42)] text-white"
                            : "text-[var(--vaden-text-muted)] hover:bg-[var(--vaden-surface-border)]"
                        }`}
                      >
                        <Package size={14} className="flex-shrink-0" />
                        <span className="truncate">{suggestion.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            }

            // Categories
            if (grouped.category.length > 0) {
              groups.push(
                <div key="category-group">
                  <div className="px-4 py-2 text-xs font-['Barlow_Condensed'] font-bold text-[oklch(0.60_0.18_42)] uppercase tracking-wide border-b border-[var(--vaden-border-soft)]">
                    {labels?.category || "Kategoriler"}
                  </div>
                  {grouped.category.map((suggestion, idx) => {
                    const itemIndex = currentIndex;
                    currentIndex++;
                    return (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3 ${
                          itemIndex === selectedIndex
                            ? "bg-[oklch(0.60_0.18_42)] text-white"
                            : "text-[var(--vaden-text-muted)] hover:bg-[var(--vaden-surface-border)]"
                        }`}
                      >
                        <TrendingUp size={14} className="flex-shrink-0" />
                        <span>{suggestion.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            }

            return groups;
          })()}
        </div>
      )}
    </div>
  );
}
