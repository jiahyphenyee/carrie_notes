import { forwardRef } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({ className = "", variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal-600",
    secondary: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 focus:ring-stone-400",
    ghost: "text-stone-600 hover:bg-stone-100 focus:ring-stone-400",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
  };
  return <button className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props} />;
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string };
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({ label, hint, error, className = "", ...props }, ref) {
  return <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-semibold text-stone-800">{label}</span>
    <input ref={ref} className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:ring-2 ${error ? "border-rose-400 focus:ring-rose-200" : "border-stone-300 focus:border-teal-600 focus:ring-teal-100"}`} {...props} />
    {hint && !error && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    {error && <span className="mt-1 block text-xs text-rose-700">{error}</span>}
  </label>;
});

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string };
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea({ label, hint, className = "", ...props }, ref) {
  return <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-semibold text-stone-800">{label}</span>
    <textarea ref={ref} className="min-h-24 w-full resize-y rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" {...props} />
    {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
  </label>;
});

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5"><h2 className="font-serif text-xl font-semibold text-stone-900">{title}</h2>{description && <p className="mt-1 text-sm leading-6 text-stone-600">{description}</p>}</div>{children}</section>;
}
