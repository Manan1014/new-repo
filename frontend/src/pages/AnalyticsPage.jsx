import { useState, useEffect } from 'react';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    getAnalyticsSummary,
    getAnalyticsTrends,
    getAnalyticsCategories,
    getAnalyticsInsights,
} from '../api';

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summaryData, setSummaryData] = useState(null);
    const [trendsData, setTrendsData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [insightsData, setInsightsData] = useState([]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    const handleDownloadReport = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:4000/api/analytics/report', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Failed to generate report');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading report:', err);
            setError('Failed to download report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [summary, trends, categories, insights] = await Promise.all([
                    getAnalyticsSummary(),
                    getAnalyticsTrends(),
                    getAnalyticsCategories(),
                    getAnalyticsInsights(),
                ]);

                setSummaryData(summary);
                setTrendsData(trends);
                setCategoryData(categories);
                setInsightsData(insights);
            } catch (err) {
                console.error('Error fetching analytics data:', err);
                setError(err.response?.data?.error || 'Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, []);

    if (loading) return <LoadingSpinner message="Loading analytics data..." />;

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center">
                            <svg
                                className="w-6 h-6 text-red-600 mr-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <div>
                                <h3 className="text-lg font-semibold text-red-800">Error Loading Analytics</h3>
                                <p className="text-red-600 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!summaryData || !trendsData.length) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <p className="text-yellow-800">
                            No analytics data available yet. Upload some sales data to see insights.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
                        <p className="text-gray-600 mt-1">
                            Comprehensive insights into your sales performance
                        </p>
                    </div>
                    <button
                        onClick={handleDownloadReport}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        Download Report
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Sales */}
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    $
                                    {summaryData.totalSales >= 1000
                                        ? (summaryData.totalSales / 1000).toFixed(1) + 'K'
                                        : summaryData.totalSales.toFixed(0)}
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <svg
                                    className="w-6 h-6 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{summaryData.period || 'Year to date'}</p>
                    </div>

                    {/* Growth */}
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {summaryData.growth >= 0 ? '+' : ''}
                                    {summaryData.growth}%
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <svg
                                    className="w-6 h-6 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                    />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {summaryData.growthPeriod || 'Period comparison'}
                        </p>
                    </div>

                    {/* Best Month */}
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Best Month</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{summaryData.bestMonth}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <svg
                                    className="w-6 h-6 text-yellow-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            $
                            {summaryData.bestMonthSales >= 1000
                                ? (summaryData.bestMonthSales / 1000).toFixed(1) + 'K'
                                : summaryData.bestMonthSales.toFixed(0)}{' '}
                            in sales
                        </p>
                    </div>

                    {/* Average Order */}
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    ${summaryData.avgOrderValue.toFixed(0)}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <svg
                                    className="w-6 h-6 text-purple-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Per transaction</p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Line Chart */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Sales Trend</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trendsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                <YAxis
                                    stroke="#6b7280"
                                    style={{ fontSize: '12px' }}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                                />
                                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Sales']} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                    activeDot={{ r: 6 }}
                                    name="Sales ($)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Category Breakdown</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percentage }) => `${name} ${percentage}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="mt-4 space-y-2">
                            {categoryData.map((category, index) => (
                                <div
                                    key={category.name}
                                    className="flex items-center justify-between text-sm text-gray-800"
                                >
                                    <div className="flex items-center">
                                        <div
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: COLORS[index] }}
                                        ></div>
                                        <span>{category.name}</span>
                                    </div>
                                    <span className="font-medium">${(category.value / 1000).toFixed(0)}K</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI Insights */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <div className="bg-blue-500 p-3 rounded-full">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                🤖 AI-Powered Insights
                            </h3>
                            <div className="space-y-3">
                                {insightsData && insightsData.length > 0 ? (
                                    insightsData.map((insight, index) => (
                                        <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-sm text-gray-700">
                                                <span
                                                    className={`font-semibold ${insight.color || 'text-blue-600'
                                                        }`}
                                                >
                                                    {insight.icon || '💡'} {insight.title}:
                                                </span>{' '}
                                                {insight.text}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold text-blue-600">💡 AI Insights:</span>{' '}
                                            Upload more sales data to receive personalized AI-powered insights and
                                            recommendations.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
