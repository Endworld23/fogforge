"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { getMetroSuggestions, getStateMatches, type MetroOption } from "../../lib/metroSearch";

type MetroSearchProps = {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  buttonSize?: "sm" | "default";
  buttonVariant?: "default" | "outline";
  showButton?: boolean;
  showIcon?: boolean;
  showStateMatches?: boolean;
};

export default function MetroSearch({
  className,
  inputClassName,
  placeholder = "Search metros",
  buttonSize = "default",
  buttonVariant = "outline",
  showButton = true,
  showIcon = false,
  showStateMatches = true,
}: MetroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [metros, setMetros] = useState<MetroOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(
    () => getMetroSuggestions(metros, debouncedQuery),
    [metros, debouncedQuery]
  );
  const stateMatches = useMemo(() => getStateMatches(debouncedQuery), [debouncedQuery]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const fetchMetros = async () => {
      try {
        const response = await fetch("/api/metros");
        if (!response.ok) return;
        const data = (await response.json()) as MetroOption[];
        setMetros(data);
      } catch {
        setMetros([]);
      }
    };

    fetchMetros();
  }, []);

  return (
    <form
      className={cn("flex min-w-0 items-center gap-2", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) {
          return;
        }
        router.push(`/grease-trap-cleaning?query=${encodeURIComponent(trimmed)}`);
      }}
    >
      <div className="relative min-w-0 flex-1">
        {showIcon ? (
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        ) : null}
        <Input
          placeholder={placeholder}
          value={query}
          className={cn(showIcon ? "pl-9" : "", "min-w-0", inputClassName)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
              setActiveIndex(-1);
            }, 100);
          }}
          onKeyDown={(event) => {
            if (!isOpen || suggestions.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((prev) => (prev + 1) % suggestions.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
            } else if (event.key === "Enter" && activeIndex >= 0) {
              event.preventDefault();
              const selected = suggestions[activeIndex];
              router.push(`/grease-trap-cleaning/${selected.state.toLowerCase()}/${selected.slug}`);
            } else if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
        />
        {isOpen && suggestions.length > 0 ? (
          <div
            className="absolute z-50 mt-2 w-full rounded-md border border-border bg-background shadow-lg"
            role="listbox"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.slug}-${suggestion.state}`}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                className={
                  activeIndex === index
                    ? "flex w-full items-center justify-between rounded-md bg-muted px-3 py-2 text-left text-sm text-foreground"
                    : "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                }
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  router.push(
                    `/grease-trap-cleaning/${suggestion.state.toLowerCase()}/${suggestion.slug}`
                  );
                  setIsOpen(false);
                }}
              >
                <span>{suggestion.name}</span>
                <span className="text-xs text-muted-foreground">{suggestion.state}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {showButton ? (
        <Button type="submit" variant={buttonVariant} size={buttonSize}>
          Search
        </Button>
      ) : null}
      {showStateMatches && stateMatches.length > 0 ? (
        <span className="hidden text-xs text-muted-foreground lg:inline">
          Filtering {stateMatches.join(", ")}
        </span>
      ) : null}
    </form>
  );
}
