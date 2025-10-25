import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import DataUpload from "../components/DataUpload";
import { testDatabase } from "../api";

const DashboardPage = () => {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const result = await testDatabase();
        setDbStatus(result);
      } catch (error) {
        console.error("Database test failed:", error);
        setDbStatus({ error: "Failed to connect to database" });
      } finally {
        setLoading(false);
      }
    };

    checkDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏠 Dashboard - Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Analyze your sales data and generate AI-powered forecasts
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">System Status</div>
              {loading ? (
                <div className="text-yellow-600">Checking...</div>
              ) : dbStatus?.error ? (
                <div className="text-red-600">❌ Database Error</div>
              ) : (
                <div className="text-green-600">✅ All Systems Online</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <p className="text-sm text-gray-600">Total Analyses</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📈</div>
              <div>
                <p className="text-sm text-gray-600">Forecasts Generated</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">💾</div>
              <div>
                <p className="text-sm text-gray-600">Data Points</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Data Upload Section */}
        <DataUpload />
      </div>
    </div>
  );
};

export default DashboardPage;
