interface Props {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({ message, className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-16 ${className}`}>
      <div className="w-10 h-10 border-4 border-violet-600/30 border-t-violet-500 rounded-full animate-spin" />
      {message && <p className="text-slate-400 text-sm">{message}</p>}
    </div>
  );
}
