import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { Package, Save, X } from "lucide-react";

interface ProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const API_URL = 'http://localhost:4000/api';
const getAuthToken = () => localStorage.getItem("token");

export function ProductForm({ onSuccess, onCancel, initialData = null }: ProductFormProps & { initialData?: any }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    sku: initialData?.sku || "",
    category: initialData?.category || "",
    currentPrice: initialData?.currentPrice?.toString() || "",
    costPrice: initialData?.costPrice?.toString() || "",
    stockQuantity: initialData?.stockQuantity?.toString() || "",
    minPrice: initialData?.minPrice?.toString() || "",
    maxPrice: initialData?.maxPrice?.toString() || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.currentPrice) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const url = initialData
        ? `${API_URL}/products/${initialData.id}`
        : `${API_URL}/products`;

      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          category: formData.category || null,
          currentPrice: parseFloat(formData.currentPrice),
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : 0,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null,
          description: formData.description || null,
          imageUrl: formData.imageUrl || null
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Product created successfully!');
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || `Failed to ${initialData ? 'update' : 'create'} product`);
      }
    } catch (err: any) {
      setError(err.message || `Error ${initialData ? 'updating' : 'creating'} product`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {initialData ? 'Edit Product' : 'Add New Product'}
            </CardTitle>
            <CardDescription className="mt-1">
              {initialData ? 'Update product details' : 'Enter product details manually'}
            </CardDescription>
          </div>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Product Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                placeholder="e.g., Wireless Headphones"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                SKU <span className="text-red-500">*</span>
              </label>
              <Input
                name="sku"
                placeholder="e.g., WH-001"
                value={formData.sku}
                onChange={handleChange}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input
                name="category"
                placeholder="e.g., Electronics"
                value={formData.category}
                onChange={handleChange}
              />
            </div>

            {/* Current Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Current Price (₹) <span className="text-red-500">*</span>
              </label>
              <Input
                name="currentPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 5000"
                value={formData.currentPrice}
                onChange={handleChange}
                required
              />
            </div>

            {/* Cost Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cost Price (₹)</label>
              <Input
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 3500"
                value={formData.costPrice}
                onChange={handleChange}
              />
            </div>

            {/* Stock Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Quantity</label>
              <Input
                name="stockQuantity"
                type="number"
                min="0"
                placeholder="e.g., 100"
                value={formData.stockQuantity}
                onChange={handleChange}
              />
            </div>

            {/* Min Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Price (₹)</label>
              <Input
                name="minPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 4000"
                value={formData.minPrice}
                onChange={handleChange}
              />
            </div>

            {/* Max Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Price (₹)</label>
              <Input
                name="maxPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 8000"
                value={formData.maxPrice}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              placeholder="Enter product description..."
              value={formData.description}
              onChange={handleChange}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL</label>
            <Input
              name="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={handleChange}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : (initialData ? 'Update Product' : 'Create Product')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}