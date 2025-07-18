'use client';

// Main page that shows login or the main application
import { useAuthStore } from '@/store/auth-store';
import { LoginPage } from '@/components/auth/login-page';
import { MainApp } from '@/components/main-app';

export default function Home() {
  const { user, loading } = useAuthStore();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading Memories...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show main application if authenticated
  return <MainApp />;
}
