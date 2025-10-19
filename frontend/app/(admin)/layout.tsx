"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const isEditorPage = pathname === '/editor';

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, [router]);

  const handleNavigation = (href: string) => {
    if (isEditorPage && (window as unknown as { hasUnsavedChanges: boolean }).hasUnsavedChanges) {
      const shouldSave = confirm('You have unsaved changes. Do you want to save before leaving?');
      if (shouldSave) {
        return;
      }
    }
    router.push(href);
  };

  const handleLogout = () => {
    if (isEditorPage && (window as unknown as { hasUnsavedChanges: boolean }).hasUnsavedChanges) {
      const shouldSave = confirm('You have unsaved changes. Do you want to save before leaving?');
      if (shouldSave) {
        return;
      }
    }
    localStorage.removeItem("access_token");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 tablet:px-6 desktop:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 tablet:space-x-8">
              <button
                onClick={() => handleNavigation('/')}
                className="text-lg tablet:text-xl font-bold text-gray-900 hover:text-gray-700"
              >
                datanooblol
              </button>
              <div className="flex space-x-4 tablet:space-x-6">
                <button
                  onClick={() => handleNavigation('/dashboard')}
                  className="text-gray-700 hover:text-blue-600"
                >
                  Dashboard
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2 tablet:space-x-4">
              <button
                onClick={() => handleNavigation('/')}
                className="hidden tablet:block text-gray-600 hover:text-gray-800"
              >
                View Site
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 tablet:px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm tablet:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="py-8">{children}</main>
    </div>
  );
}
