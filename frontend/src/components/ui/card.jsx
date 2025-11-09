import React from 'react';
import { cn } from './utils';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-white text-slate-900 flex flex-col gap-6 rounded-xl border border-slate-200 shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h4
      className={cn("leading-none text-lg font-medium", className)}
      {...props}
    >
      {children}
    </h4>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn("text-slate-600 text-sm", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div
      className={cn("px-6 pb-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

