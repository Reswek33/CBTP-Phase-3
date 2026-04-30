/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { getTransactions } from "@/services/api/admin-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Calendar,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Transactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await getTransactions();
        if (response.success) {
          setTransactions(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.txRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "PENDING":
        return "bg-amber-500/20 text-amber-500 border-amber-500/30";
      case "FAILED":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case "PENDING":
        return <Clock className="w-3 h-3 mr-1" />;
      case "FAILED":
        return <XCircle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const totalRevenue = transactions
    .filter((tx) => tx.status === "SUCCESS")
    .reduce((acc, tx) => acc + parseFloat(tx.amount), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-mono text-muted-foreground">
          LOADING_TRANSACTIONS...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <DollarSign className="text-green-500 w-8 h-8" />
            Financial Audit
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track and audit all system payments and transaction history
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by user or reference..."
              className="pl-10 h-11 bg-card border-border rounded-xl focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="h-11 rounded-xl border-border bg-card gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <DollarSign size={48} className="text-green-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-500">
              {totalRevenue.toLocaleString()}{" "}
              <span className="text-xs font-mono">ETB</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Successful Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter((tx) => tx.status === "SUCCESS").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter((tx) => tx.status === "FAILED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-40 text-center text-muted-foreground"
                >
                  No transactions found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="hover:bg-muted/30 transition-colors border-border"
                >
                  <TableCell>
                    <code className="text-xs font-mono text-primary font-bold">
                      {tx.txRef}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-sm">
                          {tx.user?.firstName} {tx.user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.user?.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{tx.plan?.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold">
                      {parseFloat(tx.amount).toLocaleString()} {tx.currency}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(tx.status)} flex items-center w-fit`}
                    >
                      {getStatusIcon(tx.status)}
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(tx.createdAt).toLocaleString()}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Transactions;
