"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
};

/**
 * Password field with an inline show/hide (eye) toggle.
 * Styling is passed in via `className` so callers keep their existing look.
 */
export function PasswordInput({
  value,
  onChange,
  className,
  placeholder,
  required,
  minLength,
  autoComplete,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className ?? ""} pr-11`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#8a8478] transition hover:bg-white/5 hover:text-[#ddbe7e] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c6a15b]/40"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
