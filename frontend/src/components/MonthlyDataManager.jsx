import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MonthlyDataManager = () => {
    const [monthlyData, setMonthlyData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_BASE = 'http://localhost:4000/api';

    useEffect(() => {
        fetchMonthlyData();
    }, []);

    const fetchMonthlyData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/monthly-data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMonthlyData(response.data);
        } catch (err) {
            setError('Failed to fetch monthly data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async (year, month) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/monthly-data/${year}/${month}/transactions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(response.data);
            setSelectedMonth({ year, month });
        } catch (err) {
            setError('Failed to fetch transactions');
            console.error(err);
        }
    };

    const deleteMonthlyData = async (year, month) => {
        if (!confirm(`Are you sure you want to delete data for ${getMonthName(month)} ${year}?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE}/monthly-data/${year}/${month}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh data
            fetchMonthlyData();
            if (selectedMonth && selectedMonth.year === year && selectedMonth.month === month) {
                setSelectedMonth(null);
                setTransactions([]);
            }
        } catch (err) {
            setError('Failed to delete monthly data');
            console.error(err);
        }
    };

    const getMonthName = (month) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1];
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">📊 Your Monthly Data</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {monthlyData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">📈</div>
                    <p>No monthly data found.</p>
                    <p className="text-sm mt-2">Upload some sales data to see your monthly summaries here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Summary Cards */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Monthly Summaries</h3>
                        {monthlyData.map((month) => (
                            <div key={`${month.year}-${month.month}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-medium text-lg">
                                            {getMonthName(month.month)} {month.year}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            Updated: {new Date(month.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => fetchTransactions(month.year, month.month)}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => deleteMonthlyData(month.year, month.month)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Revenue:</span>
                                        <div className="font-semibold text-green-600">
                                            {formatCurrency(month.total_revenue)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Transactions:</span>
                                        <div className="font-semibold">{month.total_transactions}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Avg. Value:</span>
                                        <div className="font-semibold">
                                            {formatCurrency(month.avg_transaction_value)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Top Category:</span>
                                        <div className="font-semibold">{month.top_category}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Transaction Details */}
                    <div>
                        {selectedMonth ? (
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-4">
                                    Transactions - {getMonthName(selectedMonth.month)} {selectedMonth.year}
                                </h3>
                                {transactions.length === 0 ? (
                                    <p className="text-gray-500">No transactions found.</p>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {transactions.map((transaction) => (
                                            <div key={transaction.id} className="border rounded p-3 text-sm">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-medium">{transaction.product_name}</div>
                                                        <div className="text-gray-600">
                                                            {new Date(transaction.sale_date).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-gray-600">
                                                            {transaction.category} • {transaction.region}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-semibold">
                                                            {formatCurrency(transaction.total_amount)}
                                                        </div>
                                                        <div className="text-gray-600">
                                                            {transaction.quantity} × {formatCurrency(transaction.price)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <div className="text-3xl mb-2">👆</div>
                                <p>Select a month to view transaction details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyDataManager;