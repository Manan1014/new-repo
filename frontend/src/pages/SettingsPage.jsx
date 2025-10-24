import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import {
    getUserProfile,
    updateUserProfile,
    changePassword,
    getUserPreferences,
    updateUserPreferences,
    deleteUserAccount
} from '../api';

const SettingsPage = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Profile state
    const [profile, setProfile] = useState({
        name: '',
        email: ''
    });

    // Preferences state
    const [preferences, setPreferences] = useState({
        theme: 'light',
        currency: 'USD',
        timezone: 'UTC',
        language: 'en',
        notifications_email: true,
        notifications_push: false
    });

    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Delete account state
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const [profileData, preferencesData] = await Promise.all([
                getUserProfile(),
                getUserPreferences()
            ]);

            setProfile({
                name: profileData.name || '',
                email: profileData.email || ''
            });

            setPreferences({
                theme: preferencesData.theme || 'light',
                currency: preferencesData.currency || 'USD',
                timezone: preferencesData.timezone || 'UTC',
                language: preferencesData.language || 'en',
                notifications_email: preferencesData.notifications_email ?? true,
                notifications_push: preferencesData.notifications_push ?? false
            });
        } catch (err) {
            setError('Failed to load user data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await updateUserProfile(profile);
            setMessage('Profile updated successfully!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePreferencesUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await updateUserPreferences(preferences);
            setMessage('Preferences updated successfully!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update preferences');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            setLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setMessage('Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setError('Please enter your password to delete account');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await deleteUserAccount(deletePassword);
            logout();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete account');
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', name: 'Profile', icon: '👤' },
        { id: 'preferences', name: 'Preferences', icon: '⚙️' },
        { id: 'password', name: 'Password', icon: '🔒' },
        { id: 'danger', name: 'Danger Zone', icon: '⚠️' }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        ⚙️ Account Settings
                    </h1>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-8">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {/* Tab Content */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800">Profile Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <input
                                        type="text"
                                        value={user?.role || 'User'}
                                        disabled
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'preferences' && (
                        <form onSubmit={handlePreferencesUpdate} className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800">Preferences</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Theme</label>
                                    <select
                                        value={preferences.theme}
                                        onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="auto">Auto</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                                    <select
                                        value={preferences.currency}
                                        onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="GBP">GBP - British Pound</option>
                                        <option value="JPY">JPY - Japanese Yen</option>
                                        <option value="CAD">CAD - Canadian Dollar</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                                    <select
                                        value={preferences.timezone}
                                        onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="America/New_York">EST - Eastern Time</option>
                                        <option value="America/Chicago">CST - Central Time</option>
                                        <option value="America/Denver">MST - Mountain Time</option>
                                        <option value="America/Los_Angeles">PST - Pacific Time</option>
                                        <option value="Europe/London">GMT - London</option>
                                        <option value="Europe/Paris">CET - Paris</option>
                                        <option value="Asia/Tokyo">JST - Tokyo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Language</label>
                                    <select
                                        value={preferences.language}
                                        onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                        <option value="de">German</option>
                                        <option value="ja">Japanese</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-md font-medium text-gray-800">Notifications</h3>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={preferences.notifications_email}
                                        onChange={(e) => setPreferences({ ...preferences, notifications_email: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label className="text-sm text-gray-700">Email notifications</label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={preferences.notifications_push}
                                        onChange={(e) => setPreferences({ ...preferences, notifications_push: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label className="text-sm text-gray-700">Push notifications</label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update Preferences'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>
                            <div className="max-w-md space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                            >
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'danger' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
                            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                                <h3 className="text-md font-medium text-red-800 mb-2">Delete Account</h3>
                                <p className="text-sm text-red-600 mb-4">
                                    Once you delete your account, there is no going back. Please be certain.
                                    All your data including monthly sales data and preferences will be permanently deleted.
                                </p>

                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Delete Account
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-red-700">
                                                Enter your password to confirm deletion:
                                            </label>
                                            <input
                                                type="password"
                                                value={deletePassword}
                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                className="mt-1 block w-full max-w-xs px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Enter password"
                                            />
                                        </div>
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={loading || !deletePassword}
                                                className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                            >
                                                {loading ? 'Deleting...' : 'Confirm Delete'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowDeleteConfirm(false);
                                                    setDeletePassword('');
                                                    setError('');
                                                }}
                                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;