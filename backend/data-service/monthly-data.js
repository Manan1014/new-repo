import mysql from "mysql2/promise";
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

// Save or update monthly data
export async function saveMonthlyData(userId, salesData) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Group data by month
    const monthlyGroups = {};

    salesData.forEach((item) => {
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!monthlyGroups[key]) {
        monthlyGroups[key] = {
          year,
          month,
          transactions: [],
          totalRevenue: 0,
          totalTransactions: 0,
        };
      }

      const revenue = item.price * item.quantity;
      monthlyGroups[key].transactions.push(item);
      monthlyGroups[key].totalRevenue += revenue;
      monthlyGroups[key].totalTransactions += 1;
    });

    const results = [];

    // Process each month
    for (const [key, monthData] of Object.entries(monthlyGroups)) {
      const { year, month, transactions, totalRevenue, totalTransactions } =
        monthData;
      const avgTransactionValue = totalRevenue / totalTransactions;

      // Find most common category
      const categories = {};
      transactions.forEach((t) => {
        categories[t.category || "General"] =
          (categories[t.category || "General"] || 0) + 1;
      });
      const topCategory = Object.keys(categories).reduce((a, b) =>
        categories[a] > categories[b] ? a : b
      );

      // Insert or update monthly summary (will be recalculated after adding transactions)
      const [monthlyResult] = await connection.execute(
        `
        INSERT INTO monthly_sales_data 
        (user_id, year, month, total_revenue, total_transactions, avg_transaction_value, top_category, raw_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        updated_at = CURRENT_TIMESTAMP
      `,
        [
          userId,
          year,
          month,
          totalRevenue,
          totalTransactions,
          avgTransactionValue,
          topCategory,
          JSON.stringify(transactions),
        ]
      );

      const monthlyDataId =
        monthlyResult.insertId ||
        (
          await connection.execute(
            "SELECT id FROM monthly_sales_data WHERE user_id = ? AND year = ? AND month = ?",
            [userId, year, month]
          )
        )[0][0].id;

      // Instead of deleting all, only delete transactions with same product+date combination
      // This allows adding new products to the same month without deleting existing ones

      // Insert or update transactions (avoid duplicates)
      for (const transaction of transactions) {
        const productName = transaction.product || "Unknown Product";
        const saleDate = transaction.date;

        // Check if this exact transaction already exists (same product, date, price, quantity)
        const [existing] = await connection.execute(
          `
                    SELECT id FROM sales_transactions 
                    WHERE monthly_data_id = ? 
                    AND product_name = ? 
                    AND sale_date = ?
                    AND price = ?
                    AND quantity = ?
                `,
          [
            monthlyDataId,
            productName,
            saleDate,
            transaction.price,
            transaction.quantity,
          ]
        );

        if (existing.length === 0) {
          // Only insert if it doesn't exist
          await connection.execute(
            `
                        INSERT INTO sales_transactions 
                        (monthly_data_id, user_id, product_name, sale_date, price, quantity, region, category)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `,
            [
              monthlyDataId,
              userId,
              productName,
              saleDate,
              transaction.price,
              transaction.quantity,
              transaction.region || "Unknown",
              transaction.category || "General",
            ]
          );
        }
        // If it exists, skip (don't create duplicate)
      }

      // Recalculate totals from ALL transactions in this month
      const [totals] = await connection.execute(
        `
                SELECT 
                    SUM(total_amount) as total_revenue,
                    COUNT(*) as total_transactions,
                    AVG(total_amount) as avg_transaction_value
                FROM sales_transactions
                WHERE monthly_data_id = ?
            `,
        [monthlyDataId]
      );

      const recalculatedRevenue = totals[0].total_revenue || 0;
      const recalculatedTransactions = totals[0].total_transactions || 0;
      const recalculatedAvg = totals[0].avg_transaction_value || 0;

      // Update monthly summary with recalculated values
      await connection.execute(
        `
                UPDATE monthly_sales_data
                SET total_revenue = ?,
                    total_transactions = ?,
                    avg_transaction_value = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `,
        [
          recalculatedRevenue,
          recalculatedTransactions,
          recalculatedAvg,
          monthlyDataId,
        ]
      );

      results.push({
        monthlyDataId,
        year,
        month,
        totalRevenue: recalculatedRevenue,
        totalTransactions: recalculatedTransactions,
        avgTransactionValue: recalculatedAvg,
        topCategory,
      });
    }

    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Get user's monthly data
export async function getUserMonthlyData(userId, year = null, month = null) {
  let query = `
    SELECT 
      msd.*,
      COUNT(st.id) as transaction_count
    FROM monthly_sales_data msd
    LEFT JOIN sales_transactions st ON msd.id = st.monthly_data_id
    WHERE msd.user_id = ?
  `;
  const params = [userId];

  if (year) {
    query += " AND msd.year = ?";
    params.push(year);
  }

  if (month) {
    query += " AND msd.month = ?";
    params.push(month);
  }

  query += " GROUP BY msd.id ORDER BY msd.year DESC, msd.month DESC";

  const [rows] = await pool.execute(query, params);
  return rows;
}

// Get specific month's transactions
export async function getMonthTransactions(userId, year, month) {
  const [rows] = await pool.execute(
    `
    SELECT st.* 
    FROM sales_transactions st
    JOIN monthly_sales_data msd ON st.monthly_data_id = msd.id
    WHERE msd.user_id = ? AND msd.year = ? AND msd.month = ?
    ORDER BY st.sale_date DESC
  `,
    [userId, year, month]
  );

  return rows;
}

// Delete monthly data
export async function deleteMonthlyData(userId, year, month) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get monthly data ID
    const [monthlyData] = await connection.execute(
      "SELECT id FROM monthly_sales_data WHERE user_id = ? AND year = ? AND month = ?",
      [userId, year, month]
    );

    if (monthlyData.length === 0) {
      throw new Error("Monthly data not found");
    }

    const monthlyDataId = monthlyData[0].id;

    // Delete transactions first (due to foreign key)
    await connection.execute(
      "DELETE FROM sales_transactions WHERE monthly_data_id = ?",
      [monthlyDataId]
    );

    // Delete monthly summary
    await connection.execute("DELETE FROM monthly_sales_data WHERE id = ?", [
      monthlyDataId,
    ]);

    await connection.commit();
    return { success: true, message: "Monthly data deleted successfully" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
