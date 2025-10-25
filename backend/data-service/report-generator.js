import PDFDocument from 'pdfkit';
import {
    getAnalyticsSummary,
    getAnalyticsTrends,
    getAnalyticsCategories,
    getAnalyticsInsights
} from './analytics.js';

/**
 * Generate a PDF analytics report
 * @param {number} userId - User ID
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateAnalyticsReport(userId) {
    try {
        // Fetch all analytics data
        const [summary, trends, categories, insights] = await Promise.all([
            getAnalyticsSummary(userId),
            getAnalyticsTrends(userId),
            getAnalyticsCategories(userId),
            getAnalyticsInsights(userId)
        ]);

        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: 'Sales Analytics Report',
                Author: 'SSAS Analytics',
                Subject: 'Sales Performance Report',
                Keywords: 'sales, analytics, report'
            }
        });

        // Buffer to store PDF
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));

        // Header
        doc.fontSize(24)
            .fillColor('#1f2937')
            .text('Sales Analytics Report', { align: 'center' });

        doc.fontSize(12)
            .fillColor('#6b7280')
            .text(`Generated on ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`, { align: 'center' });

        doc.moveDown(2);

        // Summary Section
        doc.fontSize(18)
            .fillColor('#1f2937')
            .text('Executive Summary', { underline: true });

        doc.moveDown(0.5);

        // Summary Cards
        const summaryData = [
            { label: 'Total Sales', value: `$${(summary.totalSales / 1000).toFixed(1)}K`, color: '#3b82f6' },
            { label: 'Growth Rate', value: `${summary.growth >= 0 ? '+' : ''}${summary.growth}%`, color: '#10b981' },
            { label: 'Best Month', value: summary.bestMonth, color: '#f59e0b' },
            { label: 'Avg Order Value', value: `$${summary.avgOrderValue.toFixed(0)}`, color: '#8b5cf6' }
        ];

        let xPos = 50;
        const yPos = doc.y;
        const boxWidth = 120;
        const boxHeight = 60;

        summaryData.forEach((item, index) => {
            if (index === 2) {
                xPos = 50;
                doc.y = yPos + boxHeight + 10;
            }

            // Draw box
            doc.rect(xPos, doc.y, boxWidth, boxHeight)
                .fillAndStroke(item.color, item.color)
                .fillOpacity(0.1);

            // Label
            doc.fillColor('#6b7280')
                .fillOpacity(1)
                .fontSize(10)
                .text(item.label, xPos + 10, doc.y + 10, { width: boxWidth - 20 });

            // Value
            doc.fillColor('#1f2937')
                .fontSize(16)
                .font('Helvetica-Bold')
                .text(item.value, xPos + 10, doc.y + 30, { width: boxWidth - 20 });

            doc.font('Helvetica');
            xPos += boxWidth + 15;
        });

        doc.y += boxHeight + 20;
        doc.moveDown(2);

        // Monthly Trends Section
        doc.fontSize(18)
            .fillColor('#1f2937')
            .text('Monthly Sales Trend', { underline: true });

        doc.moveDown(0.5);

        if (trends.length > 0) {
            // Simple bar chart representation
            const chartHeight = 150;
            const chartWidth = 500;
            const barWidth = chartWidth / trends.length - 5;
            const maxSales = Math.max(...trends.map(t => t.sales));

            let chartX = 50;
            const chartY = doc.y;

            trends.forEach((trend, index) => {
                const barHeight = (trend.sales / maxSales) * chartHeight;
                const barY = chartY + chartHeight - barHeight;

                // Draw bar
                doc.rect(chartX, barY, barWidth, barHeight)
                    .fillAndStroke('#3b82f6', '#3b82f6')
                    .fillOpacity(0.7);

                // Month label
                doc.fillColor('#6b7280')
                    .fillOpacity(1)
                    .fontSize(8)
                    .text(trend.month, chartX, chartY + chartHeight + 5, {
                        width: barWidth,
                        align: 'center'
                    });

                // Sales value
                doc.fontSize(7)
                    .text(`$${(trend.sales / 1000).toFixed(0)}K`, chartX, barY - 12, {
                        width: barWidth,
                        align: 'center'
                    });

                chartX += barWidth + 5;
            });

            doc.y = chartY + chartHeight + 30;
        }

        doc.moveDown(2);

        // Category Breakdown Section
        doc.fontSize(18)
            .fillColor('#1f2937')
            .text('Category Breakdown', { underline: true });

        doc.moveDown(0.5);

        if (categories.length > 0) {
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

            categories.forEach((category, index) => {
                const color = colors[index % colors.length];

                // Color indicator
                doc.rect(50, doc.y, 10, 10)
                    .fillAndStroke(color, color);

                // Category name and percentage
                doc.fillColor('#1f2937')
                    .fontSize(12)
                    .text(`${category.name}`, 70, doc.y, { continued: true })
                    .fillColor('#6b7280')
                    .text(` - ${category.percentage}% ($${(category.value / 1000).toFixed(1)}K)`, { align: 'left' });

                doc.moveDown(0.5);
            });
        }

        doc.moveDown(2);

        // Add new page for insights
        doc.addPage();

        // AI Insights Section
        doc.fontSize(18)
            .fillColor('#1f2937')
            .text('AI-Powered Insights', { underline: true });

        doc.moveDown(0.5);

        if (insights.length > 0) {
            insights.forEach((insight, index) => {
                // Insight box
                doc.rect(50, doc.y, 495, 80)
                    .fillAndStroke('#f3f4f6', '#e5e7eb')
                    .fillOpacity(0.5);

                // Icon and title
                doc.fillColor('#1f2937')
                    .fillOpacity(1)
                    .fontSize(14)
                    .font('Helvetica-Bold')
                    .text(`${insight.icon || '💡'} ${insight.title}`, 60, doc.y + 10);

                // Insight text
                doc.font('Helvetica')
                    .fontSize(10)
                    .fillColor('#4b5563')
                    .text(insight.text, 60, doc.y + 30, {
                        width: 475,
                        align: 'left'
                    });

                doc.moveDown(2);
            });
        }

        // Footer
        doc.fontSize(8)
            .fillColor('#9ca3af')
            .text(
                `Report generated by SSAS Analytics | ${new Date().toISOString()}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

        // Finalize PDF
        doc.end();

        // Return promise that resolves with buffer
        return new Promise((resolve, reject) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);
        });

    } catch (error) {
        console.error('Error generating PDF report:', error);
        throw error;
    }
}
