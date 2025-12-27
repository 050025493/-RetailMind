import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import {
  Plus,
  Search,
  FileSpreadsheet,
  Edit,
  Trash2,
  Upload,
  Package,
  TrendingUp
} from "lucide-react";
import { ProductForm } from "@/components/ProductForm";
import { ManualEntryModal } from "@/components/ManualEntryModal";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  currentPrice: number;
  costPrice: number;
  stockQuantity: number;
  status: string;
  imageUrl?: string;
}

const API_URL = 'http://localhost:4000/api';
const getAuthToken = () => localStorage.getItem("token");

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [salesStats, setSalesStats] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesStats = async (productId: number) => {
    try {
      const res = await fetch(`${API_URL}/sales-data/stats/${productId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      const data = await res.json();
      if (data.success) {
        setSalesStats(data.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      const data = await res.json();
      if (data.success) {
        alert('✅ Product deleted successfully');
        fetchProducts();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Failed to delete product');
    }
  };

  const handleManualEntry = (product: Product) => {
    setSelectedProduct(product);
    setShowManualEntry(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Products</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your product catalog and sales data
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setSelectedProduct(null);
              setShowProductForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>

        </div>
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-auto">
            <ProductForm
              initialData={selectedProduct}
              onSuccess={() => {
                setShowProductForm(false);
                setSelectedProduct(null);
                fetchProducts();
              }}
              onCancel={() => {
                setShowProductForm(false);
                setSelectedProduct(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualEntry && selectedProduct && (
        <ManualEntryModal
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          onSuccess={() => {
            setShowManualEntry(false);
            setSelectedProduct(null);
          }}
          onCancel={() => {
            setShowManualEntry(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products by name or SKU..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No products found' : 'No products yet'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowProductForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      SKU: {product.sku}
                    </p>
                    {product.category && (
                      <span className="inline-block mt-2 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                        {product.category}
                      </span>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${product.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20'
                    : 'bg-gray-100 text-gray-700'
                    }`}>
                    {product.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.imageUrl ? (
                  <div className="w-full h-48 mb-4 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package className="h-12 w-12 opacity-20" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 mb-4 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Package className="h-12 w-12 opacity-20" />
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-bold">₹{product.currentPrice.toLocaleString('en-IN')}</span>
                  </div>
                  {product.costPrice && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost:</span>
                      <span>₹{product.costPrice.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className={product.stockQuantity <= 10 ? 'text-red-600 font-medium' : ''}>
                      {product.stockQuantity} units
                    </span>
                  </div>
                  {product.costPrice && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin:</span>
                      <span className="font-medium">
                        {(((product.currentPrice - product.costPrice) / product.currentPrice) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleManualEntry(product)}
                  >
                    <Upload className="h-3 w-3" />
                    Add Sales
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
      }
    </div >
  );
}