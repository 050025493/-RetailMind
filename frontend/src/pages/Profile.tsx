import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/Input";
import { User, Mail, Building, Lock, Globe, Bell, Shield, LogOut, Save, Eye, EyeOff } from "lucide-react";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  company?: string;
  role?: string;
  joinedDate?: string;
}

interface Settings {
  language: 'en' | 'hi';
  emailNotifications: boolean;
  priceAlerts: boolean;
  weeklyReports: boolean;
  twoFactorAuth: boolean;
}

const translations = {
  en: {
    title: "Profile Settings",
    subtitle: "Manage your account settings and preferences",
    accountInfo: "Account Information",
    security: "Security Settings",
    preferences: "Preferences",
    notifications: "Notifications",
    name: "Full Name",
    email: "Email Address",
    company: "Company Name",
    role: "Role",
    memberSince: "Member Since",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    changePassword: "Change Password",
    language: "Language",
    selectLanguage: "Select Language",
    english: "English",
    hindi: "हिंदी (Hindi)",
    emailNotif: "Email Notifications",
    emailNotifDesc: "Receive email updates about your account",
    priceAlerts: "Price Alerts",
    priceAlertsDesc: "Get notified when competitor prices change",
    weeklyReports: "Weekly Reports",
    weeklyReportsDesc: "Receive weekly performance summaries",
    twoFactor: "Two-Factor Authentication",
    twoFactorDesc: "Add an extra layer of security",
    saveChanges: "Save Changes",
    logout: "Logout",
    updateSuccess: "Profile updated successfully!",
    updateError: "Failed to update profile",
    passwordSuccess: "Password changed successfully!",
    passwordError: "Failed to change password",
    passwordMismatch: "Passwords do not match",
    passwordShort: "Password must be at least 6 characters",
  },
  hi: {
    title: "प्रोफ़ाइल सेटिंग्स",
    subtitle: "अपने खाते की सेटिंग्स और प्राथमिकताएं प्रबंधित करें",
    accountInfo: "खाता जानकारी",
    security: "सुरक्षा सेटिंग्स",
    preferences: "प्राथमिकताएं",
    notifications: "सूचनाएं",
    name: "पूरा नाम",
    email: "ईमेल पता",
    company: "कंपनी का नाम",
    role: "भूमिका",
    memberSince: "सदस्य बने",
    currentPassword: "वर्तमान पासवर्ड",
    newPassword: "नया पासवर्ड",
    confirmPassword: "नए पासवर्ड की पुष्टि करें",
    changePassword: "पासवर्ड बदलें",
    language: "भाषा",
    selectLanguage: "भाषा चुनें",
    english: "English",
    hindi: "हिंदी (Hindi)",
    emailNotif: "ईमेल सूचनाएं",
    emailNotifDesc: "अपने खाते के बारे में ईमेल अपडेट प्राप्त करें",
    priceAlerts: "मूल्य अलर्ट",
    priceAlertsDesc: "प्रतिस्पर्धी मूल्य बदलने पर सूचित हों",
    weeklyReports: "साप्ताहिक रिपोर्ट",
    weeklyReportsDesc: "साप्ताहिक प्रदर्शन सारांश प्राप्त करें",
    twoFactor: "दो-कारक प्रमाणीकरण",
    twoFactorDesc: "सुरक्षा की एक अतिरिक्त परत जोड़ें",
    saveChanges: "परिवर्तन सहेजें",
    logout: "लॉग आउट",
    updateSuccess: "प्रोफ़ाइल सफलतापूर्वक अपडेट किया गया!",
    updateError: "प्रोफ़ाइल अपडेट करने में विफल",
    passwordSuccess: "पासवर्ड सफलतापूर्वक बदल दिया गया!",
    passwordError: "पासवर्ड बदलने में विफल",
    passwordMismatch: "पासवर्ड मेल नहीं खाते",
    passwordShort: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए",
  }
};

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<Settings>({
    language: 'en',
    emailNotifications: true,
    priceAlerts: true,
    weeklyReports: false,
    twoFactorAuth: false,
  });
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const t = translations[settings.language];

  useEffect(() => {
    // Load user data
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setEditedUser(parsed);
      } catch {
        setUser(null);
      }
    }

    // Load settings from localStorage
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch {
        // Use default settings
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userSettings");
    window.location.href = "/login";
  };

  const handleUserChange = (field: keyof UserProfile, value: string) => {
    if (editedUser) {
      setEditedUser({ ...editedUser, [field]: value });
    }
  };

  const handleSettingToggle = (field: keyof Settings) => {
    setSettings(prev => {
      const newSettings = { ...prev, [field]: !prev[field] };
      localStorage.setItem("userSettings", JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const handleLanguageChange = (lang: 'en' | 'hi') => {
    setSettings(prev => {
      const newSettings = { ...prev, language: lang };
      localStorage.setItem("userSettings", JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const handleSaveProfile = async () => {
    if (!editedUser) return;
    
    setLoading(true);
    setMessage(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/users/profile', {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(editedUser)
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      localStorage.setItem("user", JSON.stringify(editedUser));
      setUser(editedUser);
      setMessage({ type: 'success', text: t.updateSuccess });
    } catch (error) {
      setMessage({ type: 'error', text: t.updateError });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setMessage(null);

    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: t.passwordMismatch });
      return;
    }

    if (passwords.new.length < 6) {
      setMessage({ type: 'error', text: t.passwordShort });
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/users/change-password', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     currentPassword: passwords.current,
      //     newPassword: passwords.new
      //   })
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage({ type: 'success', text: t.passwordSuccess });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      setMessage({ type: 'error', text: t.passwordError });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !editedUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button variant="destructive" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          {t.logout}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <Card className={`border-2 ${
          message.type === 'success' 
            ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
            : 'border-red-500 bg-red-50 dark:bg-red-900/10'
        }`}>
          <CardContent className="p-4">
            <p className={message.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>{t.accountInfo}</CardTitle>
            </div>
            <CardDescription>
              {t.memberSince}: {user.joinedDate || new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t.name}
                </label>
                <Input
                  value={editedUser.name}
                  onChange={(e) => handleUserChange('name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t.email}
                </label>
                <Input
                  type="email"
                  value={editedUser.email}
                  onChange={(e) => handleUserChange('email', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {t.company}
                </label>
                <Input
                  value={editedUser.company || ''}
                  onChange={(e) => handleUserChange('company', e.target.value)}
                  placeholder="Your Company Ltd."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t.role}
                </label>
                <Input
                  value={editedUser.role || 'User'}
                  onChange={(e) => handleUserChange('role', e.target.value)}
                  placeholder="Manager"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveProfile} disabled={loading} className="gap-2">
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : t.saveChanges}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>{t.security}</CardTitle>
            </div>
            <CardDescription>{t.changePassword}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.currentPassword}</label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.newPassword}</label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.confirmPassword}</label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={loading || !passwords.current || !passwords.new || !passwords.confirm}
              className="w-full"
            >
              {loading ? 'Changing...' : t.changePassword}
            </Button>

            {/* Two-Factor Auth */}
            <div className="pt-4 border-t">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t.twoFactor}</p>
                  <p className="text-xs text-muted-foreground">{t.twoFactorDesc}</p>
                </div>
                <button
                  onClick={() => handleSettingToggle('twoFactorAuth')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.twoFactorAuth ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>{t.preferences}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.language}</label>
              <select
                value={settings.language}
                onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'hi')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="en">{t.english}</option>
                <option value="hi">{t.hindi}</option>
              </select>
            </div>

            {/* Notifications Header */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="font-medium">{t.notifications}</h3>
              </div>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">{t.emailNotif}</p>
                    <p className="text-xs text-muted-foreground">{t.emailNotifDesc}</p>
                  </div>
                  <button
                    onClick={() => handleSettingToggle('emailNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.emailNotifications ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Price Alerts */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">{t.priceAlerts}</p>
                    <p className="text-xs text-muted-foreground">{t.priceAlertsDesc}</p>
                  </div>
                  <button
                    onClick={() => handleSettingToggle('priceAlerts')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.priceAlerts ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.priceAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Weekly Reports */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">{t.weeklyReports}</p>
                    <p className="text-xs text-muted-foreground">{t.weeklyReportsDesc}</p>
                  </div>
                  <button
                    onClick={() => handleSettingToggle('weeklyReports')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.weeklyReports ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <User className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <p className="text-xl font-bold">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Security Level</p>
                <p className="text-xl font-bold">
                  {settings.twoFactorAuth ? 'High' : 'Medium'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Globe className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Language</p>
                <p className="text-xl font-bold">
                  {settings.language === 'en' ? 'English' : 'हिंदी'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}