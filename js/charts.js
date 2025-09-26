// charts.js - Fixed Version
class ChartManager {
    constructor() {
        this.salesChart = null;
        this.init();
    }

    init() {
        this.renderSalesChart();
    }

    renderSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        const transactions = window.db.getTransactions();
        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i)); // Last 7 days including today
            return date.toISOString().split('T')[0];
        });

        const dailySales = last7Days.map(date => {
            return transactions
                .filter(t => t.date.startsWith(date))
                .reduce((sum, t) => sum + t.amount, 0);
        });

        // Destroy existing chart if it exists
        if (this.salesChart) {
            this.salesChart.destroy();
        }

        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(date => new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Sales ($)',
                    data: dailySales,
                    borderColor: '#ff7700',
                    backgroundColor: 'rgba(255, 119, 0, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Sales Trend (Last 7 Days)',
                        color: '#ffffff',
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#b0b0b0'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#b0b0b0'
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        if (this.salesChart) {
            this.salesChart.destroy();
        }
        this.renderSalesChart();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to initialize
    const initCharts = () => {
        if (window.auth && window.auth.currentUser) {
            window.chartManager = new ChartManager();
        }
    };
    
    if (window.auth) {
        initCharts();
    } else {
        setTimeout(initCharts, 100);
    }
});