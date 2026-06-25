'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Bell, Shield, Palette, Globe, Moon, Sun, LogOut, Trash2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    // Simulate saving (extend with real preferences table as needed)
    setTimeout(() => {
      setSuccess('Settings saved successfully!');
      setSaving(false);
    }, 500);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" subtitle="Manage your preferences" />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <AnimatedCard delay={0}>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <Palette className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'light' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
                  <div>
                    <p className="text-sm font-medium text-gray-900">Theme</p>
                    <p className="text-xs text-gray-500">Choose between light and dark mode</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                  {theme === 'light' ? 'Dark' : 'Light'}
                </Button>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.1}>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <Bell className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive updates via email</p>
                </div>
                <button
                  onClick={() => setNotifyEmail(!notifyEmail)}
                  className={`relative h-7 w-12 rounded-full transition-all duration-200 ${notifyEmail ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-200 ${notifyEmail ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                  <p className="text-xs text-gray-500">Receive real-time alerts</p>
                </div>
                <button
                  onClick={() => setNotifyPush(!notifyPush)}
                  className={`relative h-7 w-12 rounded-full transition-all duration-200 ${notifyPush ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-200 ${notifyPush ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
          </AnimatedCard>
        </div>

        <div className="flex flex-col gap-6">
          <AnimatedCard delay={0.2}>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <Shield className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-semibold text-gray-900">Privacy & Security</h3>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-500">Update your account password</p>
                </div>
                <Button variant="outline" size="sm">Change</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Two-Factor Auth</p>
                  <p className="text-xs text-gray-500">Add extra security to your account</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <Globe className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Language</p>
                  <p className="text-xs text-gray-500">English (US)</p>
                </div>
                <Button variant="outline" size="sm">Change</Button>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.4} className="border-red-100 bg-gradient-to-br from-red-50/50 to-white">
            <div className="flex items-center gap-3 border-b border-red-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Sign Out</p>
                  <p className="text-xs font-medium text-gray-500">Log out of your account</p>
                </div>
                <Button variant="danger" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4" /> Save All Settings
        </Button>
      </div>
    </div>
  );
}
