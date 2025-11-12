// frontend/src/pages/Pricing.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import {
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  AlertCircle
} from "lucide-react";

interface PricingSuggestion {
  product: {
    id: number;
    name: string;
    category: string;
    image?: string; // Make image optional
  };
  current_price: number;
  suggested_price: number;
  price_range: {
    min: number;
    max: number;
  };
  confidence: number;
  change_percentage: number;
  reasoning: {
    primary: string;
    factors: string[];
    direction: string;
  };
  impact: {
    revenue_change: number;
    revenue_change_pct: number;
    profit_change: number;
    estimated_units: number;
    margin: number;
  };
}

const API_URL = 'http://localhost:4000/api';

const getAuthToken = () => localStorage.getItem("token");

const getAuthHeader = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json',
});

// Helper to safely get nested values
const safeImpact = (s: PricingSuggestion) => s.impact || {
  revenue_change: 0,
  revenue_change_pct: 0,
  profit_change: 0,
  estimated_units: 0,
  margin: 0
};
const safeReasoning = (s: PricingSuggestion) => s.reasoning || {
  primary: 'No reasoning available',
  factors: [],
  direction: 'maintain'
};
const safePriceRange = (s: PricingSuggestion) => s.price_range || { min: 0, max: 0 };

export default function Pricing() {
  const [suggestions, setSuggestions] = useState<PricingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [dismissingId, setDismissingId] = useState<number | null>(null);
  const [applyingAll, setApplyingAll] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await fetch(`${API_URL}/pricing/suggestions`, {
        headers: getAuthHeader(),
      });

      const json = await res.json();

      if (json.success) {
        setSuggestions(json.data || []);
      } else {
        setError(json.message || 'Failed to load pricing suggestions');
      }
    } catch (err: any) {
      console.error('Error fetching pricing suggestions:', err);
      setError(err.message || 'Error loading pricing suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (productId: number, suggestedPrice: number) => {
    try {
      setApplyingId(productId);
      
      const res = await fetch(`${API_URL}/pricing/product/${productId}/apply`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ accepted_price: suggestedPrice }),
      });

      const json = await res.json();

      if (json.success) {
        // Remove from suggestions list
        setSuggestions(prev => prev.filter(s => s.product.id !== productId));
        alert(`✅ Price updated successfully!`);
      } else {
        alert(`❌ ${json.message || 'Failed to update price'}`);
      }
    } catch (err: any) {
      console.error('Error applying price:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setApplyingId(null);
    }
  };

  const handleDismiss = async (productId: number) => {
    try {
      setDismissingId(productId);
      
      const res = await fetch(`${API_URL}/pricing/product/${productId}/dismiss`, {
        method: 'POST',
        headers: getAuthHeader(),
      });

      const json = await res.json();

      if (json.success) {
        setSuggestions(prev => prev.filter(s => s.product.id !== productId));
      } else {
        alert(`❌ ${json.message || 'Failed to dismiss suggestion'}`);
      }
    } catch (err: any) {
      console.error('Error dismissing suggestion:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setDismissingId(null);
    }
  };

  const handleApplyAll = async () => {
    if (!confirm(`Apply all ${suggestions.length} pricing suggestions?`)) return;
    
    try {
      setApplyingAll(true);
      
      const res = await fetch(`${API_URL}/pricing/apply-all`, {
        method: 'POST',
        headers: getAuthHeader(),
      });

      const json = await res.json();

      if (json.success) {
        alert(`✅ ${json.message}`);
        await fetchSuggestions();
      } else {
        alert(`❌ ${json.message || 'Failed to apply all suggestions'}`);
      }
    } catch (err: any) {
      console.error('Error applying all:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setApplyingAll(false);
    }
  };

  const filteredSuggestions = suggestions.filter(s =>
    s.product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: suggestions.length,
    increase: suggestions.filter(s => s.change_percentage > 0).length,
    decrease: suggestions.filter(s => s.change_percentage < 0).length,
    maintain: suggestions.filter(s => s.change_percentage === 0).length,
    totalImpact: suggestions.reduce((sum, s) => sum + (safeImpact(s).revenue_change || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating AI pricing recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Smart Pricing</h1>
          <p className="mt-1 text-muted-foreground">
            ML-powered pricing recommendations based on demand & competition
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={fetchSuggestions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {suggestions.length > 0 && (
            <Button
              className="gap-2"
              onClick={handleApplyAll}
              disabled={applyingAll}
            >
              {applyingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {applyingAll ? 'Applying...' : 'Apply All Suggestions'}
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Error</p>
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Suggestions</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Price Increases</p>
            <p className="text-2xl font-bold text-green-600">{stats.increase}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Price Decreases</p>
            <p className="text-2xl font-bold text-red-600">{stats.decrease}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Optimal Pricing</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.maintain}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Est. Revenue Impact</p>
            <p className={`text-2xl font-bold ${stats.totalImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalImpact >= 0 ? '+' : ''}₹{Math.round(stats.totalImpact).toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Suggestions List */}
      {filteredSuggestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No products found' : 'No pricing suggestions available'}
            </p>
            {searchTerm && (
              <Button
                variant="link"
                onClick={() => setSearchTerm("")}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSuggestions.map((suggestion) => {
            const isApplying = applyingId === suggestion.product.id;
            const isDismissing = dismissingId === suggestion.product.id;
            const isProcessing = isApplying || isDismissing;

            // Use helpers to safely access data
            const reasoning = safeReasoning(suggestion);
            const impact = safeImpact(suggestion);
            const priceRange = safePriceRange(suggestion);

            return (
              <Card key={suggestion.product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{suggestion.product.name}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {reasoning.primary}
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Category: {suggestion.product.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                      <Sparkles className="h-3 w-3" />
                      <span className="font-medium">{Math.round(suggestion.confidence || 0)}% confidence</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pricing Section */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
                    <div className="flex gap-8">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Price</p>
                        <p className="text-2xl font-bold">₹{(suggestion.current_price || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Suggested Price</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-primary">
                            ₹{(suggestion.suggested_price || 0).toLocaleString('en-IN')}
                          </p>
                          {(suggestion.change_percentage || 0) !== 0 && (
                            <div className={`flex items-center gap-1 text-sm font-medium ${
                              (suggestion.change_percentage || 0) > 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {(suggestion.change_percentage || 0) > 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span>{Math.abs(suggestion.change_percentage || 0).toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Range: ₹{Math.round(priceRange.min).toLocaleString('en-IN')} -
                          ₹{Math.round(priceRange.max).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleDismiss(suggestion.product.id)}
                        disabled={isProcessing}
                      >
                        {isDismissing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Dismiss
                      </Button>
                      <Button
                        onClick={() => handleApply(suggestion.product.id, suggestion.suggested_price)}
                        disabled={isProcessing || (suggestion.change_percentage || 0) === 0}
                      >
                        {isApplying ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Apply Change
                      </Button>
                    </div>
                  </div>

                  {/* Impact Analysis */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Expected Impact</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Revenue Change</p>
                        <p className={`text-sm font-bold ${
                          (impact.revenue_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(impact.revenue_change || 0) >= 0 ? '+' : ''}
                          ₹{Math.round(impact.revenue_change || 0).toLocaleString('en-IN')}
                          <span className="text-xs ml-1">
                            ({(impact.revenue_change_pct || 0) >= 0 ? '+' : ''}
                            {(impact.revenue_change_pct || 0).toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Profit Change</p>
                        <p className={`text-sm font-bold ${
                          (impact.profit_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(impact.profit_change || 0) >= 0 ? '+' : ''}
                          ₹{Math.round(impact.profit_change || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Est. Units</p>
                        <p className="text-sm font-bold">{impact.estimated_units || 0}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Margin</p>
                        <p className="text-sm font-bold">{(impact.margin || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Reasoning Factors */}
                  {(reasoning.factors || []).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Key Factors</h4>
                      <div className="flex flex-wrap gap-2">
                        {reasoning.factors.map((factor, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Insights Section */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ML Model Insights</CardTitle>
            <CardDescription>Automated analysis from Random Forest + Bayesian Optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.increase > 0 && (
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Price Increase Opportunities</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.increase} products can increase prices with minimal demand impact
                    </p>
                  </div>
                </div>
              )}
              {stats.decrease > 0 && (
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="rounded-lg bg-red-500/10 p-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium">Competitive Pricing Adjustments</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.decrease} products need price reductions to stay competitive
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 rounded-lg border p-3 bg-blue-50 dark:bg-blue-900/10">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">ML Model Performance</p>
                  <p className="text-sm text-muted-foreground">
                    Predictions based on demand forecasts, competitor data, and historical patterns.
                    Average confidence: {Math.round(suggestions.reduce((sum, s) => sum + (s.confidence || 0), 0) / (suggestions.length || 1))}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}