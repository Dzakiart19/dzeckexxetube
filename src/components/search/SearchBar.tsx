"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { searchPath } from "@/lib/urls";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  defaultValue?: string;
  size?: "compact" | "lg";
  autoFocus?: boolean;
}

/**
 * Search entry point used in the header and the homepage hero.
 * Navigates to /search?q=... with a short debounce while typing.
 */
export function SearchBar({ defaultValue = "", size = "compact", autoFocus = false }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (next: string) => {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(searchPath(next));
    }, 400);
  };

  const large = size === "lg";

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        router.push(searchPath(value));
      }}
      className="relative"
    >
      <Search
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
          large ? "size-4.5" : "size-4",
        )}
        aria-hidden
      />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Cari judul video atau folder..."
        aria-label="Kata kunci pencarian"
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-lg border border-input bg-card/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors hover:border-input focus:border-primary/60 focus:outline-none",
          large ? "h-12 text-base" : "h-10",
        )}
      />
    </form>
  );
}
