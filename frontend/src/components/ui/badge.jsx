import React from 'react';
import { cn } from './utils';

const badgeVariants = {
  default: "border-transparent bg-slate-900 text-white",
  secondary: "border-transparent bg-slate-100 text-slate-900",
  outline: "text-slate-900 border-slate-200 bg-white",
};

export function Badge({ className, variant = "default", children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

