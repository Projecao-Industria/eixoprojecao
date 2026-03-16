import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseBRL(str: string): number {
  const cleaned = str.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export default function CurrencyInput({ value, onChange, disabled, className }: CurrencyInputProps) {
  const [display, setDisplay] = useState(formatBRL(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDisplay(formatBRL(value));
    }
  }, [value, focused]);

  return (
    <Input
      value={display}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9.,]/g, "");
        setDisplay(raw);
        onChange(parseBRL(raw));
      }}
      onFocus={() => {
        setFocused(true);
        if (value === 0) setDisplay("");
      }}
      onBlur={() => {
        setFocused(false);
        setDisplay(formatBRL(parseBRL(display)));
      }}
      disabled={disabled}
      className={className}
      placeholder="0,00"
    />
  );
}
