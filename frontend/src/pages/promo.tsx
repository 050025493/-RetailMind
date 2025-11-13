// frontend/src/pages/Promo.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
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
  BarChart3
} from "lucide-react";

const API_URL = 'http://localhost:4000/api';
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

export default function Promo() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(20);
  const [durationDays, setDurationDays] = useState(14);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCampaigns();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        if (data.data.length > 0 && !selectedProduct) {
          setSelectedProduct(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Fetch products error:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_URL}/promo/campaigns?status=completed`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error('Fetch campaigns error:', error);
    }
  };

  const runSimulation = async () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/promo/simulate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: selectedProduct,
          discountPercentage,
          durationDays
        })
      });

      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.data);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Simulation error:', error);
      alert('Error running simulation');
    } finally {
      setLoading(false);
    }
  };

  const generateDemoReviews = async () => {
    if (!selectedProduct) return;
    
    try {
      const res = await fetch(`${API_URL}/promo/demo-reviews/${selectedProduct}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Demo reviews created! Run simulation again to see sentiment impact.');
      }
    } catch (error) {
      console.error('Generate reviews error:', error);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="h-5 w-5 text-green-500" />;
      case 'negative': return <Frown className="h-5 w-5 text-red-500" />;
      default: return <Meh className="h-5 w-5 text-yellow-500" />;
    }
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Promo Impact Simulator</h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered promotional analysis with sentiment insights
          </p>
        </div>
        <Button variant="outline" onClick={generateDemoReviews}>
          Generate Demo Reviews
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Builder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Create Simulation</CardTitle>
            <CardDescription>
              Define promotional parameters to predict impact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product</label>
              <select
                value={selectedProduct || ''}
                onChange={(e) => setSelectedProduct(parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ₹{product.currentPrice.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Discount ({discountPercentage}%)
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Duration ({durationDays} days)
                </label>
                <input
                  type="range"
                  min="3"
                  max="30"
                  step="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {selectedProductData && (
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Price:</span>
                  <span className="font-medium">₹{selectedProductData.currentPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discounted Price:</span>
                  <span className="font-medium text-primary">
                    ₹{((selectedProductData.currentPrice * (1 - discountPercentage / 100))).toLocaleString('en-IN')}
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
                  <div className={`text-2xl font-bold ${simulationResult.predictions.roi > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {simulationResult.predictions.roi > 0 ? '+' : ''}{simulationResult.predictions.roi}%
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
                ₹{simulationResult.predictions.predictedRevenue.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-green-500 mt-1">
                +₹{simulationResult.predictions.revenueIncrease.toLocaleString('en-IN')} vs normal
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
              <div className={`text-2xl font-bold ${simulationResult.predictions.profit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                ₹{simulationResult.predictions.profit.toLocaleString('en-IN')}
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
                        style={{ width: `${(simulationResult.sentiment.distribution.positive / simulationResult.sentiment.reviewCount) * 100}%` }}
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
                        style={{ width: `${(simulationResult.sentiment.distribution.neutral / simulationResult.sentiment.reviewCount) * 100}%` }}
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
                        style={{ width: `${(simulationResult.sentiment.distribution.negative / simulationResult.sentiment.reviewCount) * 100}%` }}
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
              <div className={`p-4 rounded-lg border-2 ${
                simulationResult.recommendation.viable 
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-500' 
                  : 'bg-red-50 dark:bg-red-900/10 border-red-500'
              }`}>
                <div className="flex items-start gap-3">
                  {simulationResult.recommendation.viable ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium mb-1">
                      {simulationResult.recommendation.viable ? 'Recommended' : 'Not Recommended'}
                    </div>
                    <div className="text-sm">{simulationResult.recommendation.message}</div>
                  </div>
                </div>
              </div>

              {simulationResult.recommendation.risks.length > 0 && (
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
                    ₹{parseFloat(campaign.actualRevenue || campaign.predictedRevenue || 0).toLocaleString('en-IN')}
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