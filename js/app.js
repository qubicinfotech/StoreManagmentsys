// app.js - Fixed Version
class AppManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadDashboard();
    }

    checkAuthentication() {
        if (!window.auth || !window.auth.currentUser) {
            window.location.href = 'index.html';
            return;
        }
    }

    setupEventListeners() {
        // Update admin nav visibility
        this.updateAdminNavVisibility();

        // Search functionality for dashboard
        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            searchBox.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Handle page-specific initializations
        this.initializePageSpecificFeatures();
    }

    updateAdminNavVisibility() {
        const adminNav = document.getElementById('admin-nav');
        if (adminNav && window.auth) {
            adminNav.style.display = window.auth.isAdmin() ? 'block' : 'none';
        }
    }

    initializePageSpecificFeatures() {
        const currentPage = window.location.pathname.split('/').pop();
        
        switch (currentPage) {
            case 'dashboard.html':
                this.loadDashboard();
                break;
            case 'inventory.html':
                if (typeof InventoryManager !== 'undefined') {
                    window.inventoryManager = new InventoryManager();
                }
                break;
            case 'transactions.html':
                if (typeof TransactionManager !== 'undefined') {
                    window.transactionManager = new TransactionManager();
                }
                break;
            case 'analytics.html':
                if (typeof AnalyticsManager !== 'undefined') {
                    window.analyticsManager = new AnalyticsManager();
                }
                break;
            case 'admin.html':
                if (typeof AdminManager !== 'undefined' && window.auth.isAdmin()) {
                    window.adminManager = new AdminManager();
                } else {
                    window.location.href = 'dashboard.html';
                }
                break;
        }
    }

    loadDashboard() {
        this.updateDashboardStats();
        this.loadRecentTransactions();
        
        // Initialize charts if on dashboard
        if (typeof ChartManager !== 'undefined' && document.getElementById('salesChart')) {
            window.chartManager = new ChartManager();
        }
    }

    updateDashboardStats() {
        const products = window.db.getProducts();
        const transactions = window.db.getTransactions();
        const settings = window.db.getSettings();
        
        const totalProducts = products.length;
        const totalTransactions = transactions.length;
        const lowStockItems = products.filter(p => p.stock < (settings.lowStockThreshold || 5)).length;
        const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

        // Update DOM elements
        this.updateElementText('total-products', totalProducts);
        this.updateElementText('total-transactions', totalTransactions);
        this.updateElementText('low-stock', lowStockItems);
        this.updateElementText('total-revenue', `$${totalRevenue.toFixed(2)}`);
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    loadRecentTransactions() {
        const transactions = window.db.getTransactions().slice(0, 5); // Get first 5 (most recent)
        const tbody = document.getElementById('recent-transactions');
        
        if (tbody) {
            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No transactions found</td></tr>';
                return;
            }
            
            tbody.innerHTML = transactions.map(transaction => `
                <tr>
                    <td>${transaction.id}</td>
                    <td>${transaction.productName}</td>
                    <td>${new Date(transaction.date).toLocaleDateString()}</td>
                    <td>$${transaction.amount.toFixed(2)}</td>
                    <td><span class="status in-stock">Completed</span></td>
                </tr>
            `).join('');
        }
    }

    handleSearch(query) {
        const rows = document.querySelectorAll('#recent-transactions tr');
        const searchTerm = query.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    showNotification(message, type = 'success') {
        if (window.auth && window.auth.showNotification) {
            window.auth.showNotification(message, type);
        } else {
            // Fallback notification
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to initialize
    const initApp = () => {
        if (window.auth && window.auth.currentUser) {
            window.app = new AppManager();
        } else if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    };
    
    if (window.auth) {
        initApp();
    } else {
        setTimeout(initApp, 100);
    }
});