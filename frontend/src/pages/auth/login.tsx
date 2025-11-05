import { useState, useContext } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { AuthContext } from "@/context/AuthContext";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useContext(AuthContext)!;

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      login(data.token, data.user);
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      {/* Left Section */}
      <div className="hidden md:flex w-1/2 flex-col justify-center px-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-800/70 to-pink-600/70 mix-blend-overlay" />
        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
            ReatilMind
          </h1>
          <p className="max-w-md text-lg opacity-90">
            Optimize prices, forecast demand, and stay ahead of competitors using real-time
            intelligence and machine learning models.
          </p>
         
        </div>
      </div>

      {/* Right Section (Login Card) */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-white dark:bg-gray-900 p-10 shadow-lg">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">User Login</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold py-2"
              disabled={loading}
            >
              {loading ? "Logging in..." : <><LogIn className="h-4 w-4 mr-2" /> Login</>}
            </Button>
          </form>

          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-4">
            Don't have an account?{" "}
            <Link href="/signup">
              <a className="font-medium text-primary hover:underline">Sign up</a>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
