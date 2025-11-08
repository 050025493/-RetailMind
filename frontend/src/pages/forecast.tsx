import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search, Download, Loader2 } from "lucide-react"; // Import Loader2 for spinner
import { Button } from "@/components/ui/buttonVariants";
import { DemandForecastChart } from "@/components/DemandForecastChart";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <-- 1. Import jspdf-autotable

interface Product {
  id: number;
  name: string;
  category?: string;
}

// --- NEW: Define types for our data ---
interface HistoryItem {
  date: string;
  quantity_sold: number;
}
interface ForecastItem {
  date: string;
  predicted_quantity: number;
}
// ---

const API_URL = 'http://localhost:4000/api';
const getAuthToken = () => localStorage.getItem("token");

export default function Forecast() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  
  // --- 2. Add new state for the export button ---
  const [isExporting, setIsExporting] = useState(false);
  
  // We don't need the contentToPrintRef anymore
  // const contentToPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    // ... (This function is unchanged)
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/products`, {
        headers: { 
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }

      const json = await res.json();
      console.log('Products response:', json);

      if (json.success) {
        setProducts(json.data);
      } else {
        setError(json.message || 'Failed to load products');
      }
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.message || 'Error loading products');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- 3. Replace handleExportPDF with handleExportReport ---
  const handleExportReport = async () => {
    setIsExporting(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let allProductsAnalysis: { name: string, total: number }[] = [];
      let productPageNumber = 2; // Summary is on page 1

      // Add a title page
      pdf.setFontSize(18);
      pdf.text('Demand Forecast Report', 105, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Report Generated: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

      // Loop through all products to fetch their data and build the PDF
      for (const product of products) {
        // 1. Fetch data for this product
        const [historyRes, forecastRes] = await Promise.all([
          fetch(`${API_URL}/products/${product.id}/history`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
          }),
          fetch(`${API_URL}/forecast/${product.id}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
          }),
        ]);

        const historyJson = await historyRes.json();
        const forecastJson = await forecastRes.json();

        if (!historyJson.success || !forecastJson.success) {
          console.warn(`Could not fetch data for ${product.name}`);
          continue; // Skip this product if data is missing
        }

        const forecastData: ForecastItem[] = forecastJson.data;
        const historyData: HistoryItem[] = historyJson.data;

        // 2. Analyze the data
        const totalForecasted = forecastData.reduce((sum, item) => sum + item.predicted_quantity, 0);
        const last30DaysActual = historyData.slice(-30).reduce((sum, item) => sum + item.quantity_sold, 0);
        allProductsAnalysis.push({ name: product.name, total: totalForecasted });

        // 3. Add a new page for this product
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text(product.name, 14, 22);
        
        // 4. Add summary text for the product
        pdf.setFontSize(11);
        pdf.text(`Total Forecasted Demand (Next 30 Days): ${Math.round(totalForecasted)} units`, 14, 30);
        pdf.text(`Actual Demand (Last 30 Days): ${last30DaysActual} units`, 14, 35);

        // 5. Add the forecast data table
        const tableData = forecastData.map(item => [
          new Date(item.date).toLocaleDateString(),
          Math.round(item.predicted_quantity)
        ]);

        autoTable(pdf, {
          head: [['Date', 'Forecasted Units']],
          body: tableData,
          startY: 45,
          headStyles: { fillColor: [30, 58, 138] }, // Dark blue header
        });

        // Add page number
        pdf.setFontSize(10);
        pdf.text(`Page ${productPageNumber}`, 105, 287, { align: 'center' });
        productPageNumber++;
      }

      // 6. Go back to page 1 and add the Executive Summary
      allProductsAnalysis.sort((a, b) => b.total - a.total); // Sort by highest forecast
      
      let summaryText = `This report analyzes the 30-day demand forecast for ${products.length} products.\n\n`;
      summaryText += `Key Findings:\n`;
      summaryText += `- Total forecasted demand across all products: ${Math.round(allProductsAnalysis.reduce((sum, p) => sum + p.total, 0))} units.\n`;
      summaryText += `- The product with the highest forecasted demand is ${allProductsAnalysis[0]?.name || 'N/A'} (${Math.round(allProductsAnalysis[0]?.total || 0)} units).\n`;
      summaryText += `- The product with the lowest forecasted demand is ${allProductsAnalysis[allProductsAnalysis.length - 1]?.name || 'N/A'} (${Math.round(allProductsAnalysis[allProductsAnalysis.length - 1]?.total || 0)} units).\n\n`;
      
      summaryText += `Recommendations:\n`;
      summaryText += `- Prioritize stock replenishment for: ${allProductsAnalysis.slice(0, 3).map(p => p.name).join(', ')}.\n`;
      summaryText += `- Consider promotional activities for low-demand products like ${allProductsAnalysis[allProductsAnalysis.length - 1]?.name || 'N/A'} to increase sales.\n`;
      summaryText += `- Review stock levels for high-demand products to prevent stockouts.`;

      pdf.setPage(1); // Go back to the first page
      pdf.setFontSize(12);
      pdf.text('Executive Summary & Recommendations', 14, 40);
      pdf.setFontSize(11);
      pdf.text(summaryText, 14, 48, { maxWidth: 180, lineHeightFactor: 1.5 });
      pdf.text('Page 1', 105, 287, { align: 'center' });
      
      // 7. Save the PDF
      pdf.save('Demand_Forecast_Report.pdf');

    } catch (err) {
      console.error("Error generating PDF report:", err);
      setError("Failed to generate PDF report.");
    } finally {
      setIsExporting(false);
    }
  };
  // --- END OF NEW FUNCTION ---


  if (isLoading) {
    // ... (your loading spinner code is perfect, no change)
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading products...</p>
            </div>
        </div>
    );
  }

  if (error) {
    // ... (your error card code is perfect, no change)
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-semibold">Demand Forecast</h1>
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
                <CardContent className="pt-6">
                    <p className="text-red-600">{error}</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (products.length === 0) {
    // ... (your "no products" card is perfect, no change)
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-semibold">Demand Forecast</h1>
            <Card>
                <CardContent className="pt-6">
                    <p className="text-muted-foreground">No products found. Please add products first.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Demand Forecast</h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered demand predictions for {products.length} products
          </p>
        </div>
        
        {/* --- 4. Update the Export Button --- */}
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={handleExportReport} // Use the new function
          disabled={isExporting} // Disable when exporting
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? "Generating..." : "Export Report"}
        </Button>
      </div>

      {/* We no longer need the ref here. The button will fetch its own data. */}
      <div className="space-y-6">
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

        <div className="space-y-6">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">No products match your search.</p>
              </CardContent>
            </Card>
          ) : (
            filteredProducts.map((product) => (
              <DemandForecastChart
                key={product.id}
                productId={product.id}
                productName={product.name}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}