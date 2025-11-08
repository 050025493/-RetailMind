import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { Search, Download, Loader2, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import { scenariosAPI } from "@/lib/api";
import { ScenarioBuilder } from "@/components/ScenarioBuilder";

interface Scenario {
  id: number;
  name: string;
  timePeriod: number;
  priceChange: number;
  demandLift: number;
  competitionFactor: string;
  aiAnalysis: string;
  revenue: string;
  marketShare: string;
  createdAt: string;
}

export default function Scenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchScenarios();
  }, []);

  // 🔹 Fetch scenarios from backend
  const fetchScenarios = async () => {
    try {
      setIsLoading(true);
      const json = await scenariosAPI.getAll();
      if (json.success) setScenarios(json.data);
      else setError(json.message || "Failed to load scenarios");
    } catch (err: any) {
      console.error("Error fetching scenarios:", err);
      setError(err.message || "Error loading scenarios");
    } finally {
      setIsLoading(false);
    }
  };

  // ❌ Delete scenario
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this scenario?")) return;
    const json = await scenariosAPI.delete(id);
    if (json.success) {
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert(json.message || "Failed to delete scenario");
    }
  };

  // 📊 Export report
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFontSize(18);
      pdf.text("AI Scenario Analysis Report", 105, 20, { align: "center" });
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: "center" });

      if (scenarios.length === 0) {
        pdf.text("No scenarios available.", 14, 50);
        pdf.save("Scenario_Report.pdf");
        setIsExporting(false);
        return;
      }

      // Executive Summary
      const topScenario = scenarios[0];
      pdf.setFontSize(13);
      pdf.text("Executive Summary", 14, 45);
      const summary = `
This report includes ${scenarios.length} simulated scenarios.
Highest projected revenue: ${topScenario.name} (${topScenario.revenue})
Key recommendation: Prioritize ${topScenario.name} pricing structure.
      `;
      pdf.setFontSize(11);
      pdf.text(summary.trim(), 14, 55, { maxWidth: 180, lineHeightFactor: 1.4 });
      pdf.text("Page 1", 105, 287, { align: "center" });

      // Each scenario page
      let page = 2;
      for (const s of scenarios) {
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text(s.name, 14, 20);
        pdf.setFontSize(11);
        pdf.text(`Time Period: ${s.timePeriod} days`, 14, 30);
        pdf.text(`Price Change: ${s.priceChange}%`, 14, 35);
        pdf.text(`Demand Lift: ${s.demandLift}%`, 14, 40);
        pdf.text(`Competition: ${s.competitionFactor}`, 14, 45);
        pdf.text(`Revenue: ${s.revenue}`, 14, 55);
        pdf.text(`Market Share: ${s.marketShare}`, 14, 60);

        pdf.text("AI Business Analysis:", 14, 75);
        pdf.setFontSize(10);
        pdf.text(s.aiAnalysis || "No analysis available", 14, 83, { maxWidth: 180, lineHeightFactor: 1.5 });
        pdf.text(`Page ${page}`, 105, 287, { align: "center" });
        page++;
      }

      pdf.save("Scenario_Report.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
      setError("Failed to generate report");
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = scenarios.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ⏳ Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading scenarios...</p>
        </div>
      </div>
    );
  }

  // ❌ Error state
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">What-If Scenarios</h1>
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Main layout
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">What-If Scenarios</h1>
          <p className="mt-1 text-muted-foreground">
            Build and analyze pricing & demand simulations with AI insights
          </p>
        </div>

        <Button
          variant="outline"
          className="gap-2"
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? "Generating..." : "Export Report"}
        </Button>
      </div>

      {/* 🧠 Scenario Builder Form */}
      <ScenarioBuilder onScenarioCreated={fetchScenarios} />

      {/* 🔍 Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search scenarios..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 💾 Saved Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Scenarios</CardTitle>
          <CardDescription>Previously saved scenario simulations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground">No saved scenarios</p>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold">{s.name}</h4>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {s.priceChange}% price change, {s.demandLift}% demand lift
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">Revenue: {s.revenue}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-medium">Share: {s.marketShare}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
