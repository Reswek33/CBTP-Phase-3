import ListCard from "../components/rfps/ListCard";
import { FileText } from "lucide-react";

const RfpsPage = () => {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Request for Proposals
          </h1>
        </div>
        <p className="text-muted-foreground">
          Browse and respond to open opportunities from verified buyers
        </p>
      </div>

      <ListCard />
    </div>
  );
};

export default RfpsPage;
