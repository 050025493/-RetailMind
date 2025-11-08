
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { X, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, LineChart as LineChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { competitorAPI } from "@/lib/competitorApi";

interface AnalysisModalProps {
  productId: number;
  productName: string;
  onClose: () => void;
}

export function CompetitorAnalysisModal({ productId, productName, onClose }: AnalysisModalProps) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalysis();
  }, [productId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await competitorAPI.getAnalysis(productId);
      
      if (response.success) {
        setAnalysis(response.data);
      } else {
        setError(response.message || 'Failed to load analysis');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Generating AI analysis...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Error</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error || 'Failed to load analysis'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const chartData = prepareChartData(analysis.priceHistory, analysis.product.currentPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto">
        <CardHeader className="sticky top-0 bg-card z-10 border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{productName}</CardTitle>
              <CardDescription className="mt-1">
                Detailed Competitive Analysis & AI Recommendations
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Summary Card */}
          <Card className={`border-2 ${
            analysis.analysis.position === 'overpriced' ? 'border-red-500 bg-red-50 dark:bg-red-900/10' :
            analysis.analysis.position === 'underpriced' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' :
            'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {analysis.analysis.position === 'overpriced' ? (
                  <TrendingUp className="h-6 w-6 text-red-500 mt-1" />
                ) : analysis.analysis.position === 'underpriced' ? (
                  <TrendingDown className="h-6 w-6 text-green-500 mt-1" />
                ) : (
                  <LineChartIcon className="h-6 w-6 text-yellow-500 mt-1" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    Position: {analysis.analysis.position.toUpperCase()}
                  </h3>
                  <p className="text-sm">{analysis.analysis.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Pricing Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Your Price</p>
                <p className="text-2xl font-bold">₹{analysis.product.currentPrice.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Avg. Competitor Price</p>
                <p className="text-2xl font-bold">
                  ₹{(analysis.currentCompetitors.reduce((sum: number, c: any) => sum + c.price, 0) / analysis.currentCompetitors.length).toLocaleString('en-IN')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Cost Price</p>
                <p className="text-2xl font-bold">₹{analysis.product.costPrice.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Price History Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Price History (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN')}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="yourPrice" stroke="hsl(var(--chart-1))" name="Your Price" strokeWidth={2} />
                    {analysis.currentCompetitors.map((comp: any, idx: number) => (
                      <Line 
                        key={comp.competitorName}
                        type="monotone" 
                        dataKey={comp.competitorName}
                        stroke={`hsl(var(--chart-${(idx % 4) + 2}))`}
                        name={comp.competitorName}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.analysis.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-lg">
                      {rec.action === 'increase' ? 'Increase' : rec.action === 'decrease' ? 'Decrease' : 'Maintain'} Price
                    </h4>
                    <span className="text-xl font-bold text-primary">
                      ₹{rec.suggestedPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{rec.reasoning}</p>
                  <p className="text-xs text-muted-foreground">Expected Impact: {rec.expectedImpact}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Market Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.analysis.marketInsights.map((insight: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.analysis.risks.map((risk: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.analysis.opportunities.map((opp: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Current Competitors List */}
          <Card>
            <CardHeader>
              <CardTitle>Current Competitor Prices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.currentCompetitors.map((comp: any) => (
                  <div key={comp.competitorName} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="font-medium">{comp.competitorName}</span>
                    <span className="text-lg font-bold">₹{comp.price.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to prepare chart data
function prepareChartData(priceHistory: any, yourPrice: number) {
  const dataMap = new Map<string, any>();

  // Add your price to all dates
  Object.keys(priceHistory).forEach(competitor => {
    priceHistory[competitor].forEach((entry: any) => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0];
      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, { date: entry.date, yourPrice });
      }
      dataMap.get(dateKey)[competitor] = entry.price;
    });
  });

  return Array.from(dataMap.values()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}