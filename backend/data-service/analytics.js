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

// Get analytics summary
export const getAnalyticsSummary = async (userId) => {
  try {
    // Get total sales and transaction count
    const [salesData] = await pool.query(
      `SELECT 
        COALESCE(SUM(total_revenue), 0) as totalSales,
        COALESCE(SUM(total_transactions), 0) as totalTransactions
      FROM monthly_sales_data 
      WHERE user_id = ?`,
      [userId]
    );

    const totalSales = parseFloat(salesData[0].totalSales) || 0;
    const totalTransactions = parseInt(salesData[0].totalTransactions) || 0;
    const avgOrderValue =
      totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Get best month
    const [bestMonthData] = await pool.query(
      `SELECT 
        CONCAT(
          CASE month
            WHEN 1 THEN 'Jan' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar'
            WHEN 4 THEN 'Apr' WHEN 5 THEN 'May' WHEN 6 THEN 'Jun'
            WHEN 7 THEN 'Jul' WHEN 8 THEN 'Aug' WHEN 9 THEN 'Sep'
            WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dec'
          END, ' ', year
        ) as monthName,
        total_revenue
      FROM monthly_sales_data 
      WHERE user_id = ?
      ORDER BY total_revenue DESC
      LIMIT 1`,
      [userId]
    );

    const bestMonth = bestMonthData[0]?.monthName || "N/A";
    const bestMonthSales = parseFloat(bestMonthData[0]?.total_revenue) || 0;

    // Calculate growth (compare first and last month)
    const [growthData] = await pool.query(
      `SELECT 
        total_revenue,
        year,
        month
      FROM monthly_sales_data 
      WHERE user_id = ?
      ORDER BY year ASC, month ASC`,
      [userId]
    );

    let growth = 0;
    let growthPeriod = "N/A";

    if (growthData.length >= 2) {
      const firstMonth = parseFloat(growthData[0].total_revenue);
      const lastMonth = parseFloat(
        growthData[growthData.length - 1].total_revenue
      );

      if (firstMonth > 0) {
        growth = (((lastMonth - firstMonth) / firstMonth) * 100).toFixed(1);
      }

      const firstMonthName = getMonthName(growthData[0].month);
      const lastMonthName = getMonthName(
        growthData[growthData.length - 1].month
      );
      growthPeriod = `${firstMonthName} to ${lastMonthName}`;
    }

    return {
      totalSales,
      avgOrderValue,
      bestMonth,
      bestMonthSales,
      growth: parseFloat(growth),
      growthPeriod,
      period: "All time",
    };
  } catch (error) {
    console.error("Error getting analytics summary:", error);
    throw error;
  }
};

// Get monthly trends
export const getAnalyticsTrends = async (userId) => {
  try {
    const [trends] = await pool.query(
      `SELECT 
        CONCAT(
          CASE month
            WHEN 1 THEN 'Jan' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar'
            WHEN 4 THEN 'Apr' WHEN 5 THEN 'May' WHEN 6 THEN 'Jun'
            WHEN 7 THEN 'Jul' WHEN 8 THEN 'Aug' WHEN 9 THEN 'Sep'
            WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dec'
          END
        ) as month,
        total_revenue as sales,
        total_transactions as orders,
        year
      FROM monthly_sales_data 
      WHERE user_id = ?
      ORDER BY year ASC, month ASC`,
      [userId]
    );

    return trends.map((t) => ({
      month: t.month,
      sales: parseFloat(t.sales),
      orders: parseInt(t.orders),
    }));
  } catch (error) {
    console.error("Error getting analytics trends:", error);
    throw error;
  }
};

// Get category breakdown (showing products)
export const getAnalyticsCategories = async (userId) => {
  try {
    // Try to get products first
    const [products] = await pool.query(
      `SELECT 
        COALESCE(NULLIF(product_name, ''), 'Unknown Product') as name,
        SUM(total_amount) as value
      FROM sales_transactions st
      JOIN monthly_sales_data msd ON st.monthly_data_id = msd.id
      WHERE st.user_id = ?
      GROUP BY product_name
      ORDER BY value DESC
      LIMIT 10`,
      [userId]
    );

    if (
      products.length === 0 ||
      (products.length === 1 && products[0].name === "Unknown Product")
    ) {
      const [categories] = await pool.query(
        `SELECT 
          category as name,
          SUM(total_amount) as value
        FROM sales_transactions st
        JOIN monthly_sales_data msd ON st.monthly_data_id = msd.id
        WHERE st.user_id = ?
        GROUP BY category
        ORDER BY value DESC`,
        [userId]
      );

      const total = categories.reduce(
        (sum, cat) => sum + parseFloat(cat.value),
        0
      );

      return categories.map((cat) => ({
        name: cat.name,
        value: parseFloat(cat.value),
        percentage:
          total > 0 ? ((parseFloat(cat.value) / total) * 100).toFixed(0) : 0,
      }));
    }

    const total = products.reduce(
      (sum, prod) => sum + parseFloat(prod.value),
      0
    );

    return products.map((prod) => ({
      name: prod.name,
      value: parseFloat(prod.value),
      percentage:
        total > 0 ? ((parseFloat(prod.value) / total) * 100).toFixed(0) : 0,
    }));
  } catch (error) {
    console.error("Error getting analytics categories:", error);
    throw error;
  }
};

// Get AI insights
export const getAnalyticsInsights = async (userId) => {
  try {
    // Get summary data for insights
    const summary = await getAnalyticsSummary(userId);
    const trends = await getAnalyticsTrends(userId);
    const categories = await getAnalyticsCategories(userId);

    const insights = [];

    // Growth insight
    if (summary.growth !== 0) {
      insights.push({
        icon: summary.growth > 0 ? "📈" : "📉",
        title: summary.growth > 0 ? "Strong Growth Trend" : "Declining Trend",
        text: `Your sales have ${
          summary.growth > 0 ? "increased" : "decreased"
        } by ${Math.abs(summary.growth)}% ${summary.growthPeriod}, showing ${
          summary.growth > 0 ? "positive" : "concerning"
        } momentum.`,
        color:
          summary.growth > 0
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400",
      });
    }

    // Best month insight
    if (summary.bestMonth !== "N/A") {
      insights.push({
        icon: "🎯",
        title: "Peak Performance",
        text: `${summary.bestMonth} was your best period with $${(
          summary.bestMonthSales / 1000
        ).toFixed(
          1
        )}K in sales. Consider analyzing what strategies worked during this time.`,
        color: "text-blue-600 dark:text-blue-400",
      });
    }

    // Category insight
    if (categories.length > 0) {
      const topCategory = categories[0];
      insights.push({
        icon: "💡",
        title: "Category Focus",
        text: `${topCategory.name} leads with ${topCategory.percentage}% of total sales. Consider expanding inventory in high-performing categories.`,
        color: "text-purple-600 dark:text-purple-400",
      });
    }

    // Average order value insight
    if (summary.avgOrderValue > 0) {
      insights.push({
        icon: "⚡",
        title: "Recommendation",
        text: `With an average order value of $${summary.avgOrderValue.toFixed(
          0
        )}, consider implementing upselling strategies to increase this metric by 10-15%.`,
        color: "text-yellow-600 dark:text-yellow-400",
      });
    }

    // Trend insight
    if (trends.length >= 3) {
      const recentTrends = trends.slice(-3);
      const isIncreasing = recentTrends.every(
        (t, i) => i === 0 || t.sales >= recentTrends[i - 1].sales
      );

      if (isIncreasing) {
        insights.push({
          icon: "🚀",
          title: "Positive Momentum",
          text: "Your last 3 months show consistent growth. Keep up the great work and maintain your current strategies.",
          color: "text-green-600 dark:text-green-400",
        });
      }
    }

    return insights;
  } catch (error) {
    console.error("Error getting analytics insights:", error);
    throw error;
  }
};

function getMonthName(monthNum) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[monthNum - 1] || "Unknown";
}
