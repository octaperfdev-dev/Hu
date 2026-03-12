import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-slate-200 rounded-xl", className)} />
);
