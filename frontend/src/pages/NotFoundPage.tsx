import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold text-white">Page not found</h1>
      <p className="max-w-md text-slate-400">The route you requested does not exist or is not yet implemented.</p>
      <Link to="/" className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/20">
        Return to dashboard
      </Link>
    </div>
  );
}
