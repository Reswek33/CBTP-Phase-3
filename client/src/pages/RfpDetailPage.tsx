import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { RfpDetail } from "../components/rfps/RfpDetail";
import { ArrowLeft, AlertCircle, Home } from "lucide-react";

const RfpDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the previous page source to determine where to navigate back
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = (location.state as any)?.from || "/dashboard/rfps";

  if (!id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-md shadow-lg">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Invalid RFP ID
          </h2>
          <p className="text-muted-foreground mb-6">
            The RFP ID provided is invalid or missing. Please check the URL and
            try again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate("/dashboard/rfps")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              RFPs Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header with back button */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(from)}
              className="group flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to RFPs
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>Dashboard</span>
              <span>/</span>
              <span>RFPs</span>
              <span>/</span>
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <RfpDetail rfpId={id} />
      </div>
    </div>
  );
};

export default RfpDetailPage;
