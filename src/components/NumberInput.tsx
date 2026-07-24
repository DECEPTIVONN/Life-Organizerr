import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  textClassName?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  className = '',
  textClassName = 'text-white',
  placeholder,
  disabled = false
}: NumberInputProps) {
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    let nextVal = Number((value - step).toFixed(2));
    if (min !== undefined) nextVal = Math.max(min, nextVal);
    onChange(nextVal);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    let nextVal = Number((value + step).toFixed(2));
    if (max !== undefined) nextVal = Math.min(max, nextVal);
    onChange(nextVal);
  };

  return (
    <div className={`flex items-center bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden focus-within:border-orange-500/50 transition-all ${className}`}>
      {prefix && (
        <span className="pl-3 text-xs text-zinc-500 font-bold select-none">{prefix}</span>
      )}
      <input
        type="number"
        step={step}
        disabled={disabled}
        value={value === 0 && placeholder ? '' : value}
        placeholder={placeholder}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '') {
            onChange(0);
          } else {
            const parsed = parseFloat(val);
            onChange(isNaN(parsed) ? 0 : parsed);
          }
        }}
        className={`w-full bg-transparent px-3 py-2 text-xs font-mono font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${textClassName}`}
      />
      {suffix && (
        <span className="pr-2 text-xs text-zinc-400 font-bold select-none">{suffix}</span>
      )}
      <div className="flex flex-col border-l border-zinc-850/80 bg-zinc-900/50 shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={handleIncrement}
          className="px-2 py-0.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none active:bg-zinc-700 disabled:opacity-50"
          title="Aumentar"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={handleDecrement}
          className="px-2 py-0.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border-t border-zinc-850/80 focus:outline-none active:bg-zinc-700 disabled:opacity-50"
          title="Diminuir"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
