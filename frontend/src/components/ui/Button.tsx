import { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-200",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200"
};

export default function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
