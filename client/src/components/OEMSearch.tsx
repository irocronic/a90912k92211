/*
  VADEN ORIGINAL - OEM Code Search Component
  Design: Industrial Precision - Dark search bar with orange accent
*/

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import SearchAutocomplete from "./SearchAutocomplete";
import { AutocompleteSuggestion } from "@/lib/autocomplete";
import { trpc } from "@/lib/trpc";
import { asString, useTemplateBackedPageContent } from "@/lib/pageContent";

type OEMSearchMetadata = {
  tag: string;
  title: string;
  placeholder: string;
  buttonText: string;
  autocompleteOemLabel: string;
  autocompleteProductLabel: string;
  autocompleteCategoryLabel: string;
  samplePrefix: string;
  sampleOne: string;
  sampleTwo: string;
};

export default function OEMSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [, navigate] = useLocation();
  const { data: suggestions = [] } = trpc.content.products.autocomplete.useQuery(
    { query: debouncedQuery, limit: 8 },
    { enabled: debouncedQuery.trim().length > 0 },
  );
  const { metadata } = useTemplateBackedPageContent<OEMSearchMetadata>("home.oemSearch");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    // Suggestion already selected and search triggered in SearchAutocomplete
  };

  return (
    <div className="bg-[var(--vaden-surface-09)] border-y border-[var(--vaden-border-soft)]">
      <div className="container mx-auto px-6 max-w-7xl py-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-1 h-8 bg-[oklch(0.60_0.18_42)]"></div>
            <div>
              <p className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-xs tracking-[0.2em] uppercase">
                {asString(metadata.tag)}
              </p>
              <p className="text-[var(--vaden-on-surface)] font-['Barlow_Condensed'] font-bold text-lg tracking-wide uppercase">
                {asString(metadata.title)}
              </p>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-0 w-full md:w-auto">
            <SearchAutocomplete
              suggestions={suggestions}
              value={query}
              onChange={setQuery}
              onSelect={handleSelectSuggestion}
              onSearch={handleSearch}
              placeholder={asString(metadata.placeholder)}
              labels={{
                oem: asString(metadata.autocompleteOemLabel, "OEM Kodları"),
                product: asString(metadata.autocompleteProductLabel, "Ürünler"),
                category: asString(metadata.autocompleteCategoryLabel, "Kategoriler"),
              }}
            />
            <button
              onClick={() => handleSearch(query)}
              className="bg-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.50_0.18_42)] text-[var(--vaden-on-accent)] px-6 py-3.5 font-['Barlow_Condensed'] font-bold tracking-wide uppercase text-sm transition-all flex items-center gap-2 flex-shrink-0"
            >
              {asString(metadata.buttonText, "ARA")}
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-xs text-[oklch(0.45_0.01_250)] font-['Inter']">
            <span>
              {asString(metadata.samplePrefix, "Örnek:")}{" "}
              <span className="text-[oklch(0.60_0.18_42)]">{asString(metadata.sampleOne)}</span>
            </span>
            <span>|</span>
            <span>
              {asString(metadata.samplePrefix, "Örnek:")}{" "}
              <span className="text-[oklch(0.60_0.18_42)]">{asString(metadata.sampleTwo)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
