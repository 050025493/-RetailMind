import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Smile,
  Meh,
  Frown,
  Play,
  Calendar,
  DollarSign,
  Package,
  BarChart3,
  Save,
  Download,
  History,
  X,
} from "lucide-react";
import jsPDF from "jspdf";

const API_URL = "http://localhost:4000/api";
const getAuthToken = () => localStorage.getItem("token");

interface Product {
  id: number;
  name: string;
  currentPrice: number;
  stockQuantity: number;
}

interface SimulationResult {
  simulation: any;
  sentiment: any;
  predictions: any;
  stock: any;
  recommendation: any;
}

// --- NEW MESSAGE BOX COMPONENT ---
interface MessageBoxProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const MessageBox: React.FC<MessageBoxProps> = ({ message, type, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle
            className={`flex items-center gap-2 ${
              type === "success" ? "text-green-500" : "text-red-500"
            }`}
          >
            {type === "success" ? <CheckCircle2 /> : <AlertCircle />}
            {type === "success" ? "Success" : "Error"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{message}</p>
          <Button onClick={onClose} className="w-full">
            OK
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
// --- END OF MESSAGE BOX COMPONENT ---

export default function Promo() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(20);
  const [durationDays, setDurationDays] = useState<number>(14);
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] =
    useState<SimulationResult | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [savedSimulations, setSavedSimulations] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [campaignName, setCampaignName] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false);

  // New state for message box
  const [message, setMessage] = useState<
    { text: string; type: "success" | "error" } | null
  >(null);

  useEffect(() => {
    fetchProducts();
    fetchCampaigns();
    fetchSimulations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        if (data.data.length > 0 && selectedProduct === null) {
          setSelectedProduct(data.data[0].id);
        }
      }
    } catch (error) {
      console.error("Fetch products error:", error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_URL}/promo/campaigns`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error("Fetch campaigns error:", error);
    }
  };

  const fetchSimulations = async () => {
    try {
      const res = await fetch(`${API_URL}/promo/simulations?limit=10`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        setSavedSimulations(data.data);
      }
    } catch (error) {
      console.error("Fetch simulations error:", error);
    }
  };

  const runSimulation = async () => {
    if (!selectedProduct) {
      setMessage({ text: "Please select a product", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/promo/simulate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct,
          discountPercentage,
          durationDays,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.data);
      } else {
        setMessage({ text: `Error: ${data.message}`, type: "error" });
      }
    } catch (error) {
      console.error("Simulation error:", error);
      setMessage({ text: "Error running simulation", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const saveSimulation = async () => {
    if (!simulationResult || !campaignName) {
      setMessage({ text: "Please enter a campaign name", type: "error" });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/promo/save-simulation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          simulationId: simulationResult.simulation.id,
          campaignName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: "✅ Simulation saved successfully!", type: "success" });
        setShowSaveDialog(false);
        setCampaignName("");
        fetchCampaigns();
        fetchSimulations();
      } else {
        setMessage({ text: `Error: ${data.message}`, type: "error" });
      }
    } catch (error) {
      console.error("Save simulation error:", error);
      setMessage({ text: "Error saving simulation", type: "error" });
    }
  };

  // --- UPDATED PDF EXPORT FUNCTION ---
  const exportToPDF = async (simulationId: number) => {
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/promo/export-pdf/${simulationId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (data.success) {
        const pdf = new jsPDF("p", "mm", "a4");
        const htmlReport = data.data.html;
        const pdfFilename = data.data.filename.replace(".html", ".pdf");

        await pdf.html(htmlReport, {
          callback: function (doc) {
            doc.save(pdfFilename);
            setMessage({ text: "✅ Report exported successfully!", type: "success" });
          },
          x: 5,
          y: 5,
          width: 200,
          windowWidth: 800,
        });
      } else {
        setMessage({ text: `Error: ${data.message}`, type: "error" });
      }
    } catch (error) {
      console.error("Export error:", error);
      setMessage({ text: "Error exporting report", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  const generateDemoReviews = async () => {
    if (!selectedProduct) return;

    try {
      const res = await fetch(`${API_URL}/promo/demo-reviews/${selectedProduct}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "✅ Demo reviews created! Run simulation to see results.", type: "success" });
      }
    } catch (error) {
      console.error("Generate reviews error:", error);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <Smile className="h-5 w-5 text-green-500" />;
      case "negative":
        return <Frown className="h-5 w-5 text-red-500" />;
      default:
        return <Meh className="h-5 w-5 text-yellow-500" />;
    }
  };

  const selectedProductData = products.find((p) => p.id === selectedProduct) ?? null;

  return (
    <div className="space-y-6">
      {message && (
        <MessageBox
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Promo Impact Simulator</h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered promotional analysis with sentiment insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            {showHistory ? "Hide" : "Show"} History
          </Button>
        </div>
      </div>

      {/* Simulation History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Simulation History</CardTitle>
                <CardDescription>Your past promotional simulations</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {savedSimulations.length > 0 ? (
                <div className="space-y-3">
                  {savedSimulations.map((sim) => (
                    <div key={sim.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <div className="font-medium">{sim.product?.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {sim.discountPercentage}% off • {sim.durationDays} days
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(sim.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">ROI</div>
                          <div className={`font-bold ${sim.roiPercentage > 0 ? "text-green-500" : "text-red-500"}`}>
                            {sim.roiPercentage > 0 ? "+" : ""}{sim.roiPercentage}%
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportToPDF(sim.id)}
                          className="gap-2"
                          disabled={exporting}
                        >
                          <Download className="h-3 w-3" />
                          {exporting ? "Exporting..." : "Export"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No simulations yet. Run a simulation to get started!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Save Simulation</CardTitle>
              <CardDescription>Give your simulation a name to save it as a campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Name</label>
                <Input
                  placeholder="e.g., Black Friday 2024"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setCampaignName("");
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1 gap-2" onClick={saveSimulation}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Builder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Create Simulation</CardTitle>
            <CardDescription>Define promotional parameters to predict impact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product</label>
              <select
                value={selectedProduct ?? ""}
                onChange={(e) => setSelectedProduct(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ₹{product.currentPrice.toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount ({discountPercentage}%)</label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duration ({durationDays} days)</label>
                <input
                  type="range"
                  min={3}
                  max={30}
                  step={1}
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            </div>

            {selectedProductData && (
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Price:</span>
                  <span className="font-medium">₹{selectedProductData.currentPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discounted Price:</span>
                  <span className="font-medium text-primary">
                    ₹{(selectedProductData.currentPrice * (1 - discountPercentage / 100)).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Available Stock:</span>
                  <span className="font-medium">{selectedProductData.stockQuantity} units</span>
                </div>
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={runSimulation}
              disabled={loading || !selectedProduct}
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Simulation
                </>
              )}
            </Button>

            {simulationResult && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setShowSaveDialog(true)}
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => exportToPDF(simulationResult.simulation.id)}
                  disabled={exporting}
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Exporting..." : "Export PDF"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {simulationResult ? (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(simulationResult.sentiment.sentiment)}
                    <span className="text-sm">Sentiment</span>
                  </div>
                  <span className="font-medium capitalize">
                    {simulationResult.sentiment.sentiment}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                  <div className="text-2xl font-bold">{simulationResult.predictions.confidence}%</div>
                </div>

                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground mb-1">Expected ROI</div>
                  <div className={`text-2xl font-bold ${simulationResult.predictions.roi > 0 ? "text-green-500" : "text-red-500"}`}>
                    {simulationResult.predictions.roi > 0 ? "+" : ""}{simulationResult.predictions.roi}%
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground mb-1">Review Count</div>
                  <div className="text-2xl font-bold">{simulationResult.sentiment.reviewCount}</div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Run a simulation to see insights
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Simulation Results */}
      {simulationResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Demand Lift</span>
              </div>
              <div className="text-2xl font-bold">+{simulationResult.predictions.demandLift}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {simulationResult.sentiment.impact.recommendation}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Predicted Revenue</span>
              </div>
              <div className="text-2xl font-bold">
                ₹{simulationResult.predictions.predictedRevenue.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-green-500 mt-1">
                +₹{simulationResult.predictions.revenueIncrease.toLocaleString("en-IN")} vs normal
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Predicted Sales</span>
              </div>
              <div className="text-2xl font-bold">
                {simulationResult.predictions.predictedUnits} units
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                vs {simulationResult.predictions.baseUnits} normally
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Profit</span>
              </div>
              <div className={`text-2xl font-bold ${simulationResult.predictions.profit > 0 ? "text-green-500" : "text-red-500"}`}>
                ₹{simulationResult.predictions.profit.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Break-even: {simulationResult.predictions.breakEvenUnits} units
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analysis */}
      {simulationResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getSentimentIcon(simulationResult.sentiment.sentiment)}
                Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sentiment Score:</span>
                  <span className="font-medium">{simulationResult.sentiment.avgSentiment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sentiment Multiplier:</span>
                  <span className="font-medium">{simulationResult.sentiment.impact.sentimentMultiplier}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Trend:</span>
                  <span className="font-medium capitalize">{simulationResult.sentiment.trend}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Review Distribution</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-green-500/20 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-green-500 h-full"
                        style={{
                          width: `${(simulationResult.sentiment.distribution.positive / simulationResult.sentiment.reviewCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-16">
                      {simulationResult.sentiment.distribution.positive} positive
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-yellow-500/20 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-yellow-500 h-full"
                        style={{
                          width: `${(simulationResult.sentiment.distribution.neutral / simulationResult.sentiment.reviewCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-16">
                      {simulationResult.sentiment.distribution.neutral} neutral
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-red-500/20 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full"
                        style={{
                          width: `${(simulationResult.sentiment.distribution.negative / simulationResult.sentiment.reviewCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-16">
                      {simulationResult.sentiment.distribution.negative} negative
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`p-4 rounded-lg border-2 ${
                  simulationResult.recommendation.viable
                    ? "bg-green-50 dark:bg-green-900/10 border-green-500"
                    : "bg-red-50 dark:bg-red-900/10 border-red-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  {simulationResult.recommendation.viable ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium mb-1">
                      {simulationResult.recommendation.viable ? "Recommended" : "Not Recommended"}
                    </div>
                    <div className="text-sm">{simulationResult.recommendation.message}</div>
                  </div>
                </div>
              </div>

              {simulationResult.recommendation.risks && simulationResult.recommendation.risks.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Risk Factors:</div>
                  <ul className="space-y-1">
                    {simulationResult.recommendation.risks.map((risk: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!simulationResult.stock.sufficient && (
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-500">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Stock Warning</div>
                      <div className="text-xs mt-1">{simulationResult.stock.warning}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Past Campaigns */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Promotions</CardTitle>
            <CardDescription>Historical performance of previous campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{campaign.campaignName}</h4>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{campaign.discountValue}% off</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{campaign.durationDays} days</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">
                    ₹{parseFloat(campaign.actualRevenue || campaign.predictedRevenue || 0).toLocaleString("en-IN")}
                  </p>
                  {campaign.actualDemandLift && (
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-sm font-medium text-green-500">+{campaign.actualDemandLift}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
