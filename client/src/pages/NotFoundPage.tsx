import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, AlertCircle, Zap } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal background - just a subtle gradient */}
      <div className="fixed inset-0 bg-linear-to-br from-background via-background to-primary/5 pointer-events-none" />

      {/* Navigation Bar - Minimal */}
      <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Zap className="text-primary-foreground w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tighter text-foreground">
              Bid<span className="text-primary">Sync</span>
            </span>
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-accent"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>
        </div>
      </nav>

      {/* Main Content - Centered */}
      <main className="flex items-center justify-center min-h-[calc(100vh-57px)] px-4">
        <div className="text-center max-w-lg">
          {/* Status Code - Large and bold */}
          <div className="mb-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full"></div>
              <h1 className="relative text-8xl md:text-9xl font-black text-foreground tracking-tighter">
                404
              </h1>
            </div>
          </div>

          {/* Error Badge - Minimal */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 mb-4">
            <AlertCircle className="w-3 h-3 text-destructive" />
            <span className="text-[10px] font-mono font-bold text-destructive uppercase tracking-wider">
              Not Found
            </span>
          </div>

          {/* Message */}
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
            Page not found
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Actions - Minimal buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all active:scale-95"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border rounded-lg font-medium text-sm text-foreground hover:bg-accent transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>

          {/* Help link - Subtle */}
          <p className="text-xs text-muted-foreground mt-8">
            Need help?{" "}
            <Link to="/contact" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-border py-4 text-center">
        <p className="text-[10px] font-mono text-muted-foreground">
          © 2025 BidSync. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
