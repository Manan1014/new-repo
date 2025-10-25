import React from "react";
import Header from "../components/Header";
import MonthlyDataManager from "../components/MonthlyDataManager";

const DataManagementPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📊 Data Management
          </h1>
          <p className="text-gray-600">
            View, edit, and manage your uploaded sales data organized by month.
          </p>
        </div>

        <MonthlyDataManager />
      </div>
    </div>
  );
};

export default DataManagementPage;
