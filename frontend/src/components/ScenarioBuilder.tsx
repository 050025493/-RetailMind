import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { Play, Loader2 } from "lucide-react";
import { scenariosAPI } from "@/lib/api";

interface Props {
  onScenarioCreated: () => void; // callback to refresh list after creating
}

export function ScenarioBuilder({ onScenarioCreated }: Props) {
  const [form, setForm] = useState({
    name: "",
    timePeriod: 30,
    priceChange: 0,
    demandLift: 0,
    competitionFactor: "Low",
    includeStock: false,
    includeSeasonal: false,
    includeBundle: false,
    includeLoyalty: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement;
  const { name, type, value } = target;
  const checked = (target as HTMLInputElement).checked;

  setForm((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
};

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await scenariosAPI.create(form);
      if (res.success) {
        setSuccess("Scenario created successfully!");
        onScenarioCreated(); // refresh list in parent
      } else {
        setError(res.message || "Failed to create scenario");
      }
    } catch (err: any) {
      setError(err.message || "Error creating scenario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Scenario</CardTitle>
        <CardDescription>Define market conditions and pricing strategies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Scenario Name</label>
            <Input name="name" placeholder="e.g., Holiday Sale" value={form.name} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Period (Days)</label>
            <Input type="number" name="timePeriod" value={form.timePeriod} onChange={handleChange} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Price Change (%)</label>
            <Input type="number" name="priceChange" value={form.priceChange} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Demand Lift (%)</label>
            <Input type="number" name="demandLift" value={form.demandLift} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Competition Factor</label>
            <select
              name="competitionFactor"
              value={form.competitionFactor}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["includeStock", "Include stock constraints"],
            ["includeSeasonal", "Apply seasonal factors"],
            ["includeBundle", "Consider bundle deals"],
            ["includeLoyalty", "Factor in loyalty programs"],
          ].map(([key, label]) => (
            <div className="flex items-center gap-2" key={key}>
              <input
                type="checkbox"
                name={key}
                checked={(form as any)[key]}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <label className="text-sm">{label}</label>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setForm({
            name: "",
            timePeriod: 30,
            priceChange: 0,
            demandLift: 0,
            competitionFactor: "Low",
            includeStock: false,
            includeSeasonal: false,
            includeBundle: false,
            includeLoyalty: false,
          })}>
            Reset
          </Button>
          <Button className="gap-2" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {loading ? "Generating..." : "Run Simulation"}
          </Button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
      </CardContent>
    </Card>
  );
}
