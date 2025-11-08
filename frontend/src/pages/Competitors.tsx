// frontend/src/pages/Competitors.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { Search, RefreshCw, TrendingUp, TrendingDown, BarChart3, Clock } from "lucide-react";
import { competitorAPI } from "@/lib/competitorApi";
import { CompetitorAnalysisModal } from "@/components/CompetitorAnalysisModal";

interface CompetitorStatus {
  productId: number;
  productName: string;
  yourPrice: number;
  avgCompetitorPrice: number | null;
  competitorCount: number;
  status: 'overpriced' | 'underpriced' | 'competitive' | 'no_data';
  canRefresh: boolean;
  lastRefresh: string | null;
}

export default function Competitors() {
  const [products, setProducts] = useState<CompetitorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    fetchAllStatus();
  }, []);

  const fetchAllStatus = async () => {
    try {
      setLoading(true);
      const response = await competitorAPI.getAllStatus();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching competitor status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (productId: number) => {
    try {
      setRefreshingId(productId);
      const response = await competitorAPI.refreshPrices(productId);
      
      if (response.success) {
        // Refresh the list
        await fetchAllStatus();
        alert('✅ Competitor prices refreshed successfully!');
      } else {
        alert(`❌ ${response.message}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message || 'Failed to refresh prices'}`);
    } finally {
      setRefreshingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'overpriced':
        return {
          text: 'Overpriced',
          color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
          icon: TrendingUp,
          iconColor: 'text-red-600'
        };
      case 'underpriced':
        return {
          text: 'Underpriced',
          color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
          icon: TrendingDown,
          iconColor: 'text-green-600'
        };
      case 'competitive':
        return {
          text: 'Competitive',
          color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
          icon: BarChart3,
          iconColor: 'text-yellow-600'
        };
      default:
        return {
          text: 'No Data',
          color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
          icon: Clock,
          iconColor: 'text-gray-600'
        };
    }
  };

  const filteredProducts = products.filter(p =>
    p.productName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading competitor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Competitor Watch</h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered competitive pricing intelligence for {products.length} products
          </p>
        </div>
        <Button 
          className="gap-2" 
          onClick={fetchAllStatus}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Overpriced</p>
            <p className="text-2xl font-bold text-red-600">
              {products.filter(p => p.status === 'overpriced').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Underpriced</p>
            <p className="text-2xl font-bold text-green-600">
              {products.filter(p => p.status === 'underpriced').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Competitive</p>
            <p className="text-2xl font-bold text-yellow-600">
              {products.filter(p => p.status === 'competitive').length}
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const config = getStatusConfig(product.status);
            const StatusIcon = config.icon;
            
            return (
              <Card key={product.productId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.productName}</CardTitle>
                      <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        <StatusIcon className={`h-3.5 w-3.5 ${config.iconColor}`} />
                        {config.text}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your Price:</span>
                      <span className="font-bold">₹{product.yourPrice.toLocaleString('en-IN')}</span>
                    </div>
                    {product.avgCompetitorPrice && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg. Competitor:</span>
                        <span className="font-bold">₹{product.avgCompetitorPrice.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Competitors:</span>
                      <span className="font-medium">{product.competitorCount}</span>
                    </div>
                    {product.lastRefresh && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Last updated:</span>
                        <span>{new Date(product.lastRefresh).toLocaleString('en-IN', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleRefresh(product.productId)}
                      disabled={!product.canRefresh || refreshingId === product.productId}
                    >
                      {refreshingId === product.productId ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          {product.canRefresh ? 'Refresh' : 'Cooldown'}
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => setSelectedProduct({ id: product.productId, name: product.productName })}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">
                {search ? 'No products found' : 'No products available'}
              </p>
              {search && (
                <Button 
                  variant="link" 
                  onClick={() => setSearch("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Modal */}
      {selectedProduct && (
        <CompetitorAnalysisModal
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}