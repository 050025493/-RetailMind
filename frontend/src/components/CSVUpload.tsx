import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react";

interface CSVUploadProps {
  productId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: 'single' | 'multi'; // single product or multi-product matching
}

const API_URL = 'http://localhost:4000/api';
const getAuthToken = () => localStorage.getItem("token");

export function CSVUpload({ productId, onSuccess, onCancel, mode = 'single' }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState("");
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateDuplicates: false,
    deleteExisting: false,
    matchBy: 'sku' // for multi mode
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setPreview(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const includeProduct = mode === 'multi';
      const res = await fetch(
        `${API_URL}/sales-data/template?includeProduct=${includeProduct}`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        }
      );

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sales_data_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download template error:', err);
      setError('Failed to download template');
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setPreviewing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/sales-data/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        setPreview(data.data);
      } else {
        setError(data.message || 'Failed to preview CSV');
      }
    } catch (err: any) {
      setError(err.message || 'Error previewing CSV');
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (!preview) {
      setError('Please preview the file first');
      return;
    }

    if (mode === 'single' && !productId) {
      setError('Product ID is required');
      return;
    }

    setUploading(true);
    setError("");

    try {
      let endpoint = '';
      let body: any = {};

      if (mode === 'single') {
        // Import for specific product
        endpoint = `${API_URL}/sales-data/import`;
        body = {
          productId,
          csvData: preview.preview.concat(
            preview.validRows ? preview.validRows.slice(10) : []
          ),
          options: {
            skipDuplicates: importOptions.skipDuplicates,
            updateDuplicates: importOptions.updateDuplicates,
            deleteExisting: importOptions.deleteExisting
          }
        };
      } else {
        // Import with product matching
        endpoint = `${API_URL}/sales-data/import-with-matching`;
        body = {
          csvData: preview.preview.concat(
            preview.validRows ? preview.validRows.slice(10) : []
          ),
          matchBy: importOptions.matchBy
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ Import successful!\nInserted: ${data.data.inserted}\nSkipped: ${data.data.skipped || 0}`);
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || 'Failed to import data');
      }
    } catch (err: any) {
      setError(err.message || 'Error importing data');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload Sales Data (CSV)
            </CardTitle>
            <CardDescription className="mt-1">
              {mode === 'single' 
                ? 'Upload historical sales data for this product'
                : 'Upload sales data with automatic product matching'}
            </CardDescription>
          </div>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 p-4">
          <h4 className="text-sm font-medium mb-2">CSV Format Requirements:</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• <strong>Required columns:</strong> date, quantity_sold</li>
            {mode === 'multi' && (
              <li>• <strong>For matching:</strong> sku or product_name</li>
            )}
            <li>• <strong>Optional columns:</strong> revenue, price</li>
            <li>• Date format: YYYY-MM-DD (e.g., 2024-01-15)</li>
            <li>• At least 30 days of data recommended for forecasting</li>
          </ul>
        </div>

        {/* Download Template */}
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={handleDownloadTemplate}
        >
          <Download className="h-4 w-4" />
          Download CSV Template
        </Button>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select CSV File</label>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          {file && (
            <p className="text-xs text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Import Options */}
        <div className="space-y-3 p-4 rounded-lg border">
          <h4 className="text-sm font-medium">Import Options</h4>
          
          {mode === 'single' ? (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={importOptions.skipDuplicates}
                  onChange={(e) => setImportOptions({
                    ...importOptions,
                    skipDuplicates: e.target.checked,
                    updateDuplicates: e.target.checked ? false : importOptions.updateDuplicates
                  })}
                  className="rounded"
                />
                Skip duplicate dates
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={importOptions.updateDuplicates}
                  onChange={(e) => setImportOptions({
                    ...importOptions,
                    updateDuplicates: e.target.checked,
                    skipDuplicates: e.target.checked ? false : importOptions.skipDuplicates
                  })}
                  className="rounded"
                />
                Update duplicate dates
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={importOptions.deleteExisting}
                  onChange={(e) => setImportOptions({
                    ...importOptions,
                    deleteExisting: e.target.checked
                  })}
                  className="rounded"
                />
                <span className="text-red-600">Delete all existing data first</span>
              </label>
            </>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Match Products By:</label>
              <select
                value={importOptions.matchBy}
                onChange={(e) => setImportOptions({
                  ...importOptions,
                  matchBy: e.target.value
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="sku">SKU</option>
                <option value="name">Product Name</option>
              </select>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview Results */}
        {preview && (
          <div className="space-y-3">
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Preview Results
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-2 rounded bg-muted">
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                  <p className="text-lg font-bold">{preview.totalRows}</p>
                </div>
                <div className="p-2 rounded bg-green-50 dark:bg-green-900/10">
                  <p className="text-xs text-muted-foreground">Valid</p>
                  <p className="text-lg font-bold text-green-600">{preview.validRows}</p>
                </div>
                <div className="p-2 rounded bg-red-50 dark:bg-red-900/10">
                  <p className="text-xs text-muted-foreground">Invalid</p>
                  <p className="text-lg font-bold text-red-600">{preview.invalidRows}</p>
                </div>
                <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/10">
                  <p className="text-xs text-muted-foreground">Columns</p>
                  <p className="text-lg font-bold text-blue-600">{preview.columns?.length || 0}</p>
                </div>
              </div>

              {preview.validationErrors && preview.validationErrors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-red-600 mb-1">Validation Errors:</p>
                  <div className="max-h-32 overflow-y-auto text-xs text-red-600 space-y-1">
                    {preview.validationErrors.map((err: string, idx: number) => (
                      <p key={idx}>• {err}</p>
                    ))}
                  </div>
                </div>
              )}

              {preview.preview && preview.preview.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium mb-2">Sample Data (first 5 rows):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left border">Date</th>
                          <th className="p-2 text-left border">Quantity</th>
                          {preview.preview[0]?.revenue && (
                            <th className="p-2 text-left border">Revenue</th>
                          )}
                          {preview.preview[0]?.sku && (
                            <th className="p-2 text-left border">SKU</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview.slice(0, 5).map((row: any, idx: number) => (
                          <tr key={idx}>
                            <td className="p-2 border">{row.date}</td>
                            <td className="p-2 border">{row.quantity_sold}</td>
                            {row.revenue && (
                              <td className="p-2 border">₹{row.revenue}</td>
                            )}
                            {row.sku && (
                              <td className="p-2 border">{row.sku}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handlePreview}
            disabled={!file || previewing}
          >
            <Upload className="h-4 w-4" />
            {previewing ? 'Previewing...' : 'Preview CSV'}
          </Button>

          <Button
            className="flex-1 gap-2"
            onClick={handleImport}
            disabled={!preview || uploading}
          >
            <CheckCircle2 className="h-4 w-4" />
            {uploading ? 'Importing...' : 'Import Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}