import React from 'react';
import Header from '../components/Header';

const AnalyticsPage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        📊 Advanced Analytics
                    </h1>
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">📈</div>
                        <p className="text-lg">Advanced Analytics Dashboard</p>
                        <p className="text-sm mt-2">
                            Coming soon - Advanced charts, trends, and insights
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;