import { Outlet } from "react-router-dom";
import { Suspense, useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { LoadingSpinner } from "../LoadingSpinner";
import { useUIStore } from "@/stores/uiStore";

export function MainLayout() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={handleMenuClick} />

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Suspense fallback={<LoadingSpinner />}>
              <Outlet />
            </Suspense>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © 2025 CUET Micro-Ops Hackathon. Built with ❤️ and observability.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
