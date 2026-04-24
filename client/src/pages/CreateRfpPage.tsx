import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Info } from "lucide-react";
import RfpsCreateForm from "../components/rfps/RfpsCreateForm";

const CreateRfpPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Create New Request for Proposal
              </h1>
            </div>
            <p className="text-muted-foreground">
              Fill out the form below to create a new RFP and start receiving
              bids from suppliers
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/rfps")}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to RFPs</span>
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <RfpsCreateForm />
      </div>

      {/* Info Note */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-500 mb-1">
              Important Information
            </p>
            <p className="text-sm text-muted-foreground">
              All fields marked with * are required. The buyer information will
              be automatically assigned from your account. Once published,
              suppliers will be able to view and submit bids for your RFP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRfpPage;
