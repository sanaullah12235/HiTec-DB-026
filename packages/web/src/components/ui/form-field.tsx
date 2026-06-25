'use client';

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldWrapper {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldWrapper({ label, error, hint, required, children }: FieldWrapper) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 font-medium">{hint}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; hint?: string; options: { value: string; label: string }[] };
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string };

const inputBase = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:shadow-md placeholder:text-gray-400 disabled:bg-gray-50 disabled:opacity-60';

export function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={props.required}>
      <input className={`${inputBase} ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : ''} ${className}`} {...props} />
    </FieldWrapper>
  );
}

export function Select({ label, error, hint, options, className = '', ...props }: SelectProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={props.required}>
      <select className={`${inputBase} ${error ? 'border-red-300' : ''} ${className}`} {...props}>
        <option value="" className="text-gray-400">Select...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FieldWrapper>
  );
}

export function Textarea({ label, error, hint, className = '', ...props }: TextareaProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={props.required}>
      <textarea className={`${inputBase} min-h-[100px] resize-y ${error ? 'border-red-300' : ''} ${className}`} {...props} />
    </FieldWrapper>
  );
}
