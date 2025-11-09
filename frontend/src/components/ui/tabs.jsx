import React, { useState } from 'react';
import { cn } from './utils';

export function Tabs({ defaultValue, className, children, ...props }) {
  const [activeTab, setActiveTab] = useState(defaultValue || 'papers');
  
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ activeTab, setActiveTab, className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-white text-slate-600 inline-flex h-auto w-full items-center justify-center rounded-xl p-1 shadow-sm mb-6",
        className
      )}
      {...props}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ value, activeTab, setActiveTab, className, children, ...props }) {
  const isActive = activeTab === value;
  
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
        isActive
          ? "bg-white text-slate-900 border-slate-200 shadow-sm"
          : "text-slate-600 hover:text-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, activeTab, setActiveTab, className, children, ...props }) {
  if (activeTab !== value) return null;
  
  return (
    <div className={cn("flex-1 outline-none", className)} {...props}>
      {children}
    </div>
  );
}

