import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <LoadingSpinner message="Loading application..." />
            </div>
        );
    }

    if (isAuthenticated) {
        // Redirect to dashboard if already authenticated
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PublicRoute;