import { SupplierOnboarding } from "@/components/supplier/SupplierOnboarding";

const SupplierOnboardingPage = () => {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Supplier Onboarding
        </h1>
        <p className="text-muted-foreground">
          Complete your business profile and verification to start bidding on
          RFPs
        </p>
      </div>
      <SupplierOnboarding />
    </div>
  );
};

export default SupplierOnboardingPage;
