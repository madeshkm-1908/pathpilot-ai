import { AlertTriangle } from 'lucide-react';

interface Props {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ title = 'Something went wrong', message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="flex items-center gap-2 text-red-400">
        <AlertTriangle size={20} />
        <span className="font-semibold">{title}</span>
      </div>
      <p className="text-slate-400 text-sm text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
