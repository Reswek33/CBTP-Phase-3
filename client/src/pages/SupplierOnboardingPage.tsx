import { SupplierOnboarding } from "@/components/supplier/SupplierOnboarding";
import { useAuth } from "@/contexts/AuthContext";

const SupplierOnboardingPage = () => {
  const { user } = useAuth();
  const isBuyer = user?.role === "BUYER";
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Onboarding</h1>
        <p className="text-muted-foreground">
          Complete your business profile and verification to{" "}
          {isBuyer ? (
            <span className="text-primary">Post RFPs</span>
          ) : (
            <span className="text-primary">start bidding on RFPs</span>
          )}
        </p>
      </div>
      <SupplierOnboarding />
    </div>
  );
};

export default SupplierOnboardingPage;
