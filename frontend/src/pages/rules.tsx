//rules.tsx
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { Mic, Plus, Trash2, Save, PlayCircle } from "lucide-react";

const API_URL = 'http://localhost:4000/api';

interface PricingRule {
  id?: number;
  ruleName: string;
  isActive: boolean;
  conditionType: string;
  conditionThreshold: number;
  conditionOperator: string;
  actionType: string;
  actionValue: number;
  actionUnit: string;
}

const getAuthToken = () => localStorage.getItem("token");

export default function Rules() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch(`${API_URL}/pricing-rules`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setRules(data.data);
      } else {
        // Initialize with 2 empty rules if none exist
        setRules([
          {
            ruleName: "Rule #1",
            isActive: true,
            conditionType: "demand_increase",
            conditionThreshold: 20,
            conditionOperator: ">=",
            actionType: "increase_price",
            actionValue: 5,
            actionUnit: "%"
          },
          {
            ruleName: "Rule #2",
            isActive: false,
            conditionType: "demand_increase",
            conditionThreshold: 20,
            conditionOperator: ">=",
            actionType: "increase_price",
            actionValue: 5,
            actionUnit: "%"
          }
        ]);
      }
    } catch (error) {
      console.error('Fetch rules error:', error);
    }
  };

  const handleRuleChange = (index: number, field: string, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const addNewRule = () => {
    setRules([...rules, {
      ruleName: `Rule #${rules.length + 1}`,
      isActive: false,
      conditionType: "demand_increase",
      conditionThreshold: 20,
      conditionOperator: ">=",
      actionType: "increase_price",
      actionValue: 5,
      actionUnit: "%"
    }]);
  };

  const deleteRule = async (index: number) => {
    const rule = rules[index];
    if (rule.id) {
      try {
        await fetch(`${API_URL}/pricing-rules/${rule.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
  };

  const saveRules = async () => {
    setLoading(true);
    try {
      for (const rule of rules) {
        if (rule.id) {
          // Update existing
          await fetch(`${API_URL}/pricing-rules/${rule.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(rule)
          });
        } else {
          // Create new
          await fetch(`${API_URL}/pricing-rules`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(rule)
          });
        }
      }
      alert('✅ Rules saved successfully!');
      await fetchRules();
    } catch (error) {
      alert('❌ Error saving rules');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const previewImpact = async () => {
    setLoading(true);
    try {
      // Preview with first active rule
      const activeRule = rules.find(r => r.isActive);
      if (!activeRule) {
        alert('⚠️ Please activate at least one rule to preview');
        return;
      }

      const res = await fetch(`${API_URL}/pricing-rules/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activeRule)
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`📊 Impact Preview:\n\n${data.affectedCount} products will be affected\nout of ${data.totalProducts} total products`);
      }
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceQuery = async (queryText: string) => {
    setLoading(true);
    setVoiceResponse("");
    
    try {
      const res = await fetch(`${API_URL}/pricing-rules/voice-query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ queryText })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setVoiceResponse(data.responseText);
      } else {
        setVoiceResponse("Sorry, I couldn't process that query.");
      }
    } catch (error) {
      console.error('Voice query error:', error);
      setVoiceResponse("Error processing your query.");
    } finally {
      setLoading(false);
    }
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition is not supported in your browser');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceQuery(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const conditionTypes = [
    { value: "demand_increase", label: "Demand increases by" },
    { value: "demand_decrease", label: "Demand decreases by" },
    { value: "stock_level", label: "Stock level below" },
    { value: "competitor_price", label: "Competitor price difference" }
  ];

  const actionTypes = [
    { value: "increase_price", label: "Increase price by" },
    { value: "decrease_price", label: "Decrease price by" },
    { value: "set_price", label: "Set price to" },
    { value: "set_margin", label: "Set margin to" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Auto-Pricing Rules</h1>
        <p className="mt-1 text-muted-foreground">
          Create automated pricing rules and voice queries
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rule Builder - 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rule Builder</CardTitle>
            <CardDescription>Create automated pricing rules based on market conditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {rules.map((rule, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Input
                    value={rule.ruleName}
                    onChange={(e) => handleRuleChange(index, 'ruleName', e.target.value)}
                    className="max-w-[200px] font-medium"
                  />
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={(e) => handleRuleChange(index, 'isActive', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium">
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRule(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">When</label>
                    <select
                      value={rule.conditionType}
                      onChange={(e) => handleRuleChange(index, 'conditionType', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {conditionTypes.map(ct => (
                        <option key={ct.value} value={ct.value}>{ct.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Threshold</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={rule.conditionThreshold}
                        onChange={(e) => handleRuleChange(index, 'conditionThreshold', parseFloat(e.target.value))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Then</label>
                    <select
                      value={rule.actionType}
                      onChange={(e) => handleRuleChange(index, 'actionType', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {actionTypes.map(at => (
                        <option key={at.value} value={at.value}>{at.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Value</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={rule.actionValue}
                        onChange={(e) => handleRuleChange(index, 'actionValue', parseFloat(e.target.value))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={addNewRule}
            >
              <Plus className="h-4 w-4" />
              Add New Rule
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={saveRules}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Rules
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={previewImpact}
                disabled={loading}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Preview Impact
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Voice Query - 1/3 width */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Query</CardTitle>
            <CardDescription>Use your voice to query prices.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
            <p className="text-sm text-muted-foreground text-center">
              "What's the price of headphones?"
            </p>
            <button
              onClick={startVoiceRecognition}
              disabled={isListening || loading}
              className={`relative h-24 w-24 rounded-full transition-all ${
                isListening 
                  ? 'bg-red-500 animate-pulse' 
                  : 'bg-primary hover:bg-primary/90'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Mic className="h-10 w-10 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </button>
            <p className="text-xs text-muted-foreground">
              {isListening ? 'Listening...' : loading ? 'Processing...' : 'Click to speak'}
            </p>

            {voiceResponse && (
              <div className="w-full mt-4 p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-1">Response:</p>
                <p className="text-sm text-muted-foreground">{voiceResponse}</p>
              </div>
            )}

            <div className="w-full mt-6 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Try asking:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>"What is the optimal price for product X?"</p>
                <p>"Increase price by 5% and show projected profit"</p>
                <p>"Which products are underpriced?"</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}