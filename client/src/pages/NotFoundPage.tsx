import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, AlertCircle, Zap, Search } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-linear-to-br from-background via-background to-primary/5 pointer-events-none" />

      {/* Navigation Bar */}
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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center min-h-[calc(100vh-57px-57px)] px-4">
        <div className="text-center max-w-lg animate-in fade-in zoom-in duration-300">
          {/* 404 Number with Animation */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full animate-pulse" />
            <h1 className="relative text-8xl md:text-9xl font-black bg-linear-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-gradient">
              404
            </h1>
          </div>

          {/* Error Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 mb-6 animate-in slide-in-from-bottom-4 duration-300">
            <AlertCircle className="w-3 h-3 text-destructive" />
            <span className="text-[10px] font-mono font-bold text-destructive uppercase tracking-wider">
              Page Not Found
            </span>
          </div>

          {/* Message */}
          <div className="space-y-2 mb-8 animate-in slide-in-from-bottom-5 duration-300 delay-100">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Oops! Page not found
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              The page you're looking for doesn't exist or has been moved to
              another URL.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Check the URL for typos or go back to the homepage.
            </p>
          </div>

          {/* Search Suggestion */}
          <div className="mb-8 p-4 bg-muted/30 rounded-xl border border-border max-w-sm mx-auto animate-in slide-in-from-bottom-6 duration-300 delay-200">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Search className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono">
                Looking for something specific?
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Try navigating from the dashboard or using the search feature
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-in slide-in-from-bottom-7 duration-300 delay-300">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border rounded-lg font-medium text-sm text-foreground bg-card hover:bg-accent transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous Page
            </button>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">
              Quick navigation:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                to="/dashboard"
                className="text-xs text-primary hover:underline transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-xs text-muted-foreground">•</span>
              <Link
                to="/login"
                className="text-xs text-primary hover:underline transition-colors"
              >
                Login
              </Link>
              <span className="text-xs text-muted-foreground">•</span>
              <Link
                to="/register"
                className="text-xs text-primary hover:underline transition-colors"
              >
                Register
              </Link>
              <span className="text-xs text-muted-foreground">•</span>
              <Link
                to="/contact"
                className="text-xs text-primary hover:underline transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-[10px] font-mono text-muted-foreground">
            © 2025 BidSync Protocol. All rights reserved.
          </p>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes zoom-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slide-in-from-bottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .fade-in {
          animation-name: fade-in;
          animation-duration: 0.3s;
          animation-timing-function: ease-out;
        }
        
        .zoom-in {
          animation-name: zoom-in;
          animation-duration: 0.3s;
          animation-timing-function: ease-out;
        }
        
        .slide-in-from-bottom-4 {
          animation-name: slide-in-from-bottom;
          animation-duration: 0.3s;
          animation-timing-function: ease-out;
          animation-delay: 0.1s;
          animation-fill-mode: both;
        }
        
        .slide-in-from-bottom-5 {
          animation-name: slide-in-from-bottom;
          animation-duration: 0.3s;
          animation-timing-function: ease-out;
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }
        
        .slide-in-from-bottom-6 {
          animation-name: slide-in-from-bottom;
          animation-duration: 0.3s;
          animation-timing-function: ease-out;
          animation-delay: 0.3s;
          animation-fill-mode: both;
        }
        
        .slide-in-from-bottom-7 {
          animation-name: slide-in-from-bottom;
          animation-duration: 0.3s;
          animation-timing-function: ease-out;
          animation-delay: 0.4s;
          animation-fill-mode: both;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.3;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};
