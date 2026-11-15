interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-900/50 bg-rose-950/20 py-16 text-center"
    >
      <p className="text-sm text-rose-300">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-rose-800 px-4 py-2 text-sm text-rose-300 hover:bg-rose-950/40"
        >
          Try again
        </button>
      )}
    </div>
  );
}
