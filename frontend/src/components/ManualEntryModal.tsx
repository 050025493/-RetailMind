
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { X, Save, Plus, Trash, Calendar } from "lucide-react";

interface ManualEntryModalProps {
    productId: number;
    productName: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const API_URL = 'http://localhost:4000/api';
const getAuthToken = () => localStorage.getItem("token");

export function ManualEntryModal({ productId, productName, onSuccess, onCancel }: ManualEntryModalProps) {
    const [entries, setEntries] = useState([
        { date: new Date().toISOString().split('T')[0], quantity: 0, revenue: 0 }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleEntryChange = (index: number, field: string, value: any) => {
        if (field === 'date') {
            const todayStr = new Date().toISOString().split('T')[0];
            if (value > todayStr) {
                alert("Cannot enter future dates");
                return;
            }
        }
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setEntries(newEntries);
    };

    const addEntry = () => {
        let newDateStr = new Date().toISOString().split('T')[0];

        if (entries.length > 0) {
            const lastEntryDate = entries[entries.length - 1].date;
            if (lastEntryDate) {
                const lastDate = new Date(lastEntryDate);
                // Safe decrement handling timezone offset issues by using UTC methods
                lastDate.setUTCDate(lastDate.getUTCDate() - 1);
                newDateStr = lastDate.toISOString().split('T')[0];
            }
        }

        setEntries([
            ...entries,
            { date: newDateStr, quantity: 0, revenue: 0 }
        ]);
    };

    const removeEntry = (index: number) => {
        if (entries.length > 1) {
            setEntries(entries.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        try {
            // Convert entries to CSV format for the backend endpoint
            // We can reuse the existing import endpoint!
            const formattedData = entries.map(e => ({
                date: e.date,
                quantity_sold: parseInt(e.quantity.toString()),
                revenue: parseFloat(e.revenue.toString())
            }));

            const res = await fetch(`${API_URL}/sales-data/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId,
                    csvData: formattedData,
                    options: {
                        skipDuplicates: false,
                        updateDuplicates: true // Always update if exists
                    }
                })
            });

            const data = await res.json();

            if (data.success) {
                alert('✅ Sales data added successfully!');
                onSuccess();
            } else {
                setError(data.message || 'Failed to save data');
            }
        } catch (err: any) {
            setError(err.message || 'Error saving data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-auto">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Add Sales Data: {productName}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Manually enter daily sales records
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onCancel}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                            {entries.map((entry, index) => (
                                <div key={index} className="flex gap-3 items-end p-3 rounded bg-muted/50 border">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs font-medium">Date</label>
                                        <Input
                                            type="date"
                                            value={entry.date}
                                            onChange={(e) => handleEntryChange(index, 'date', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs font-medium">Quantity</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={entry.quantity}
                                            onChange={(e) => handleEntryChange(index, 'quantity', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs font-medium">Revenue (₹)</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={entry.revenue}
                                            onChange={(e) => handleEntryChange(index, 'revenue', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => removeEntry(index)}
                                        disabled={entries.length === 1}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between pt-4 border-t">
                            <Button variant="outline" onClick={addEntry} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Another Day
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                                <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {loading ? 'Saving...' : 'Save Records'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
