"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  PHONE_COUNTRIES,
  PRIORITY_COUNTRIES,
  findCountry,
  type PhoneCountry,
} from "@/lib/phone-formats";
import { cn } from "@/lib/utils";

/**
 * PhoneInput — sélecteur pays + saisie numéro local.
 * 20 pays supportés (FR/BE/CH/LU/MU/RE en priorité, puis le reste).
 * Validation faite via lib/phone-formats.ts (Pattern 10).
 */
export function PhoneInput({
  countryCode,
  onCountryCodeChange,
  value,
  onChange,
  placeholder,
  hasError,
  disabled,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
}: {
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
}) {
  const country = findCountry(countryCode) ?? PHONE_COUNTRIES[0];

  // Sort countries: priority first, then rest alphabetically by name.
  const sortedCountries = React.useMemo(() => {
    const priority = PRIORITY_COUNTRIES.map((code) =>
      PHONE_COUNTRIES.find((c) => c.code === code)
    ).filter(Boolean) as PhoneCountry[];
    const others = PHONE_COUNTRIES.filter(
      (c) => !PRIORITY_COUNTRIES.includes(c.code)
    ).sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return [...priority, ...others];
  }, []);

  return (
    <div
      className={cn(
        "flex h-11 w-full overflow-hidden rounded-sm border bg-surface transition-colors",
        "focus-within:ring-2 focus-within:ring-aubergine focus-within:ring-offset-0 focus-within:border-aubergine",
        hasError
          ? "border-error border-2 bg-error/5"
          : "border-border hover:border-aubergine-soft",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="relative flex items-center border-r border-border bg-cream-warm/50 pr-1">
        <select
          aria-label="Indicatif pays"
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "appearance-none bg-transparent pl-3 pr-7 py-2 text-sm font-medium text-ink",
            "focus:outline-none cursor-pointer",
            disabled && "cursor-not-allowed"
          )}
        >
          {sortedCountries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.dialCode} — {c.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-1.5 h-3.5 w-3.5 text-ink-muted"
          aria-hidden
        />
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? country.format.replace(/X/g, "0")}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired}
        className={cn(
          "flex-1 bg-transparent px-3 py-2 text-base text-ink placeholder:text-ink-muted",
          "focus:outline-none",
          disabled && "cursor-not-allowed"
        )}
      />
    </div>
  );
}
