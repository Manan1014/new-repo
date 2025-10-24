import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
    host: process.env.CONTENT_DB_HOST || "localhost",
    user: process.env.CONTENT_DB_USER || "root",
    password: process.env.CONTENT_DB_PASS || "YourStrongPassword123!",
    database: process.env.CONTENT_DB_NAME || "ssas_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Get user profile
export async function getUserProfile(userId) {
    const [users] = await pool.execute(
        'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
        [userId]
    );

    if (users.length === 0) {
        throw new Error('User not found');
    }

    return users[0];
}

// Update user profile
export async function updateUserProfile(userId, profileData) {
    const { name, email } = profileData;

    // Check if email is already taken by another user
    if (email) {
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, userId]
        );

        if (existingUsers.length > 0) {
            throw new Error('Email is already taken by another user');
        }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name) {
        updates.push('name = ?');
        values.push(name);
    }

    if (email) {
        updates.push('email = ?');
        values.push(email);
    }

    if (updates.length === 0) {
        throw new Error('No valid fields to update');
    }

    values.push(userId);

    await pool.execute(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
    );

    return await getUserProfile(userId);
}

// Change user password
export async function changeUserPassword(userId, currentPassword, newPassword) {
    // Get current password hash
    const [users] = await pool.execute(
        'SELECT password FROM users WHERE id = ?',
        [userId]
    );

    if (users.length === 0) {
        throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
        throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedNewPassword, userId]
    );

    return { success: true, message: 'Password changed successfully' };
}

// Get user preferences
export async function getUserPreferences(userId) {
    let [preferences] = await pool.execute(
        'SELECT * FROM user_preferences WHERE user_id = ?',
        [userId]
    );

    // If no preferences exist, create default ones
    if (preferences.length === 0) {
        await pool.execute(
            `INSERT INTO user_preferences (user_id, theme, currency, timezone, language, notifications_email, notifications_push)
       VALUES (?, 'light', 'USD', 'UTC', 'en', TRUE, FALSE)`,
            [userId]
        );

        [preferences] = await pool.execute(
            'SELECT * FROM user_preferences WHERE user_id = ?',
            [userId]
        );
    }

    return preferences[0];
}

// Update user preferences
export async function updateUserPreferences(userId, preferencesData) {
    const {
        theme,
        currency,
        timezone,
        language,
        notifications_email,
        notifications_push,
        date_format,
        number_format
    } = preferencesData;

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (theme) {
        updates.push('theme = ?');
        values.push(theme);
    }

    if (currency) {
        updates.push('currency = ?');
        values.push(currency);
    }

    if (timezone) {
        updates.push('timezone = ?');
        values.push(timezone);
    }

    if (language) {
        updates.push('language = ?');
        values.push(language);
    }

    if (typeof notifications_email === 'boolean') {
        updates.push('notifications_email = ?');
        values.push(notifications_email);
    }

    if (typeof notifications_push === 'boolean') {
        updates.push('notifications_push = ?');
        values.push(notifications_push);
    }

    if (date_format) {
        updates.push('date_format = ?');
        values.push(date_format);
    }

    if (number_format) {
        updates.push('number_format = ?');
        values.push(number_format);
    }

    if (updates.length === 0) {
        throw new Error('No valid preferences to update');
    }

    values.push(userId);

    // First ensure preferences record exists
    await pool.execute(
        `INSERT INTO user_preferences (user_id) VALUES (?) 
     ON DUPLICATE KEY UPDATE user_id = user_id`,
        [userId]
    );

    // Then update preferences
    await pool.execute(
        `UPDATE user_preferences SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
        values
    );

    return await getUserPreferences(userId);
}

// Delete user account
export async function deleteUserAccount(userId, password) {
    // Verify password before deletion
    const [users] = await pool.execute(
        'SELECT password FROM users WHERE id = ?',
        [userId]
    );

    if (users.length === 0) {
        throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(password, users[0].password);
    if (!isValidPassword) {
        throw new Error('Password is incorrect');
    }

    // Delete user (cascading will handle related data)
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    return { success: true, message: 'Account deleted successfully' };
}