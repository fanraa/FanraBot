import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message = "Memuat data..." }: LoadingViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 p-8 w-full bg-transparent">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}
