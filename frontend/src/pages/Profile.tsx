import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState<{ name: string; email: string; company?: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <User className="h-16 w-16 text-indigo-600 dark:text-indigo-400" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Profile</h1>

        {user ? (
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <p><span className="font-medium">Name:</span> {user.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            {user.company && <p><span className="font-medium">Company:</span> {user.company}</p>}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No user data found.</p>
        )}

        <button
          onClick={handleLogout}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
