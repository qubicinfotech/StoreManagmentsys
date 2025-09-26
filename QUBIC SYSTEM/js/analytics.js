// analytics.js - Fixed Version
class AnalyticsManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkPermissions();
        this.loadAnalytics();
        this.renderCharts();
    }

    checkPermissions() {
        if (!window.auth || !window.auth.currentUser) {
            window.location.href = 'index.html';
            return;
        }
    }

    loadAnalytics() {
        const transactions = window.db.getTransactions();
        const products = window.db.getProducts();
        
        // Calculate total revenue
        const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
        document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
        
        // Calculate total transactions
        document.getElementById('total-transactions').textContent = transactions.length;
        
        // Find top selling product
        const productSales = {};
        transactions.forEach(t => {
            if (!productSales[t.productName]) {
                productSales[t.productName] = 0;
            }
            productSales[t.productName] += t.quantity;
        });
        
        const topProduct = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];
        if (topProduct) {
            document.getElementById('top-product').textContent = topProduct[0];
            document.getElementById('product-sales').textContent = `${topProduct[1]} units sold`;
        } else {
            document.getElementById('top-product').textContent = '-';
            document.getElementById('product-sales').textContent = 'No sales data';
        }
        
        // Find best category
        const categorySales = {};
        transactions.forEach(t => {
            const product = products.find(p => p.id === t.productId);
            if (product) {
                if (!categorySales[product.category]) {
                    categorySales[product.category] = 0;
                }
                categorySales[product.category] += t.amount;
            }
        });
        
        const topCategory = Object.entries(categorySales).sort((a, b) => b[1] - a[1])[0];
        if (topCategory) {
            document.getElementById('top-category').textContent = topCategory[0];
            document.getElementById('category-sales').textContent = `$${topCategory[1].toFixed(2)} revenue`;
        } else {
            document.getElementById('top-category').textContent = '-';
            document.getElementById('category-sales').textContent = 'No category data';
        }
        
        // Load top products table
        this.loadTopProductsTable();
    }

    renderCharts() {
        this.renderCategoryChart();
        this.renderRevenueChart();
    }

    renderCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        const transactions = window.db.getTransactions();
        const products = window.db.getProducts();
        const categorySales = {};
        
        transactions.forEach(t => {
            const product = products.find(p => p.id === t.productId);
            if (product) {
                if (!categorySales[product.category]) {
                    categorySales[product.category] = 0;
                }
                categorySales[product.category] += t.amount;
            }
        });
        
        // Destroy existing chart if it exists
        if (ctx.chart) {
            ctx.chart.destroy();
        }
        
        ctx.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categorySales),
                datasets: [{
                    data: Object.values(categorySales),
                    backgroundColor: [
                        '#ff7700', '#00cc66', '#ffaa00', '#0099ff', 
                        '#ff4444', '#9966ff', '#ff66cc', '#00cccc',
                        '#ff9966', '#66ff99', '#6699ff', '#ff66ff'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#b0b0b0'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Sales Distribution by Category',
                        color: '#ffffff'
                    }
                }
            }
        });
    }

    renderRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        
        const transactions = window.db.getTransactions();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyRevenue = Array(12).fill(0);
        
        transactions.forEach(t => {
            const month = new Date(t.date).getMonth();
            monthlyRevenue[month] += t.amount;
        });
        
        // Destroy existing chart if it exists
        if (ctx.chart) {
            ctx.chart.destroy();
        }
        
        ctx.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Revenue ($)',
                    data: monthlyRevenue,
                    backgroundColor: '#ff7700',
                    borderColor: '#cc5500',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#b0b0b0'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Monthly Revenue',
                        color: '#ffffff'
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

    loadTopProductsTable() {
        const transactions = window.db.getTransactions();
        const products = window.db.getProducts();
        const productStats = {};
        
        transactions.forEach(t => {
            const product = products.find(p => p.id === t.productId);
            if (product) {
                if (!productStats[t.productId]) {
                    productStats[t.productId] = {
                        name: t.productName,
                        category: product.category,
                        quantity: 0,
                        revenue: 0,
                        profit: 0
                    };
                }
                productStats[t.productId].quantity += t.quantity;
                productStats[t.productId].revenue += t.amount;
                productStats[t.productId].profit += (t.amount - (product.cost * t.quantity));
            }
        });
        
        const topProducts = Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
        
        const tbody = document.getElementById('top-products-table');
        if (tbody) {
            if (topProducts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No sales data available</td></tr>';
                return;
            }
            
            tbody.innerHTML = topProducts.map(stats => `
                <tr>
                    <td>${stats.name}</td>
                    <td>${stats.category}</td>
                    <td>${stats.quantity}</td>
                    <td>$${stats.revenue.toFixed(2)}</td>
                    <td>$${stats.profit.toFixed(2)}</td>
                </tr>
            `).join('');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to initialize
    const initAnalytics = () => {
        if (window.auth && window.auth.currentUser) {
            window.analyticsManager = new AnalyticsManager();
        }
    };
    
    if (window.auth) {
        initAnalytics();
    } else {
        setTimeout(initAnalytics, 100);
    }
});