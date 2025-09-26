// transactions.js - Fixed Version
class TransactionManager {
    constructor() {
        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.checkPermissions();
        this.setupEventListeners();
        this.loadTransactions();
        this.loadProductOptions();
    }

    checkPermissions() {
        if (!window.auth || !window.auth.currentUser) {
            window.location.href = 'index.html';
            return;
        }
    }

    setupEventListeners() {
        // Fix: Corrected ID from new-transaction-btn to add-transaction-btn
        const addTransactionBtn = document.getElementById('new-transaction-btn');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => {
                this.openTransactionModal();
            });
        }

        const transactionForm = document.getElementById('transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTransaction();
            });
        }

        const cancelBtn = document.getElementById('cancel-transaction');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeTransactionModal();
            });
        }

        const closeModalBtns = document.querySelectorAll('.close-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeTransactionModal();
            });
        });

        const searchInput = document.getElementById('transaction-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        const productSelect = document.getElementById('transaction-product');
        if (productSelect) {
            productSelect.addEventListener('change', (e) => {
                this.updateProductInfo(e.target.value);
            });
        }

        const quantityInput = document.getElementById('transaction-quantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', () => {
                this.calculateTotal();
            });
        }

        // Modal backdrop click
        const modal = document.getElementById('transaction-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeTransactionModal();
                }
            });
        }
    }

    loadTransactions() {
        const transactions = window.db.getTransactions();
        const tbody = document.getElementById('transactions-table');
        
        if (tbody) {
            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No transactions found</td></tr>';
                return;
            }
            
            tbody.innerHTML = transactions.map(transaction => {
                const canEdit = window.auth.isAdmin();
                return `
                    <tr>
                        <td>${transaction.id}</td>
                        <td>${transaction.productName}</td>
                        <td>${transaction.quantity}</td>
                        <td>$${transaction.amount.toFixed(2)}</td>
                        <td>${new Date(transaction.date).toLocaleDateString()}</td>
                        <td>${transaction.employee}</td>
                        <td class="action-buttons-cell">
                            ${canEdit ? `
                                <button class="action-btn delete" onclick="window.transactionManager.deleteTransaction(${transaction.id})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            ` : '<span>No actions</span>'}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    loadProductOptions() {
        const products = window.db.getProducts().filter(p => p.stock > 0);
        const select = document.getElementById('transaction-product');
        
        if (select) {
            select.innerHTML = '<option value="">Select Product</option>' +
                products.map(product => 
                    `<option value="${product.id}" data-price="${product.price}">${product.name} (Stock: ${product.stock})</option>`
                ).join('');
        }
    }

    updateProductInfo(productId) {
        const priceInput = document.getElementById('transaction-price');
        const quantityInput = document.getElementById('transaction-quantity');
        
        if (productId) {
            const product = window.db.getProduct(parseInt(productId));
            if (product) {
                priceInput.value = product.price.toFixed(2);
                quantityInput.max = product.stock;
                quantityInput.value = 1;
                this.calculateTotal();
            }
        } else {
            priceInput.value = '';
            quantityInput.value = '';
        }
    }

    calculateTotal() {
        const productId = document.getElementById('transaction-product').value;
        const quantity = parseInt(document.getElementById('transaction-quantity').value) || 0;
        const price = parseFloat(document.getElementById('transaction-price').value) || 0;
        const totalInput = document.getElementById('transaction-total');
        
        if (productId && quantity > 0) {
            const total = price * quantity;
            totalInput.value = total.toFixed(2);
        } else {
            totalInput.value = '';
        }
    }

    handleSearch(query) {
        const transactions = window.db.getTransactions();
        const filteredTransactions = transactions.filter(transaction => 
            transaction.productName.toLowerCase().includes(query.toLowerCase()) ||
            transaction.employee.toLowerCase().includes(query.toLowerCase()) ||
            transaction.id.toString().includes(query)
        );
        
        const tbody = document.getElementById('transactions-table');
        if (tbody) {
            if (filteredTransactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No transactions match your search</td></tr>';
                return;
            }
            
            tbody.innerHTML = filteredTransactions.map(transaction => {
                const canEdit = window.auth.isAdmin();
                return `
                    <tr>
                        <td>${transaction.id}</td>
                        <td>${transaction.productName}</td>
                        <td>${transaction.quantity}</td>
                        <td>$${transaction.amount.toFixed(2)}</td>
                        <td>${new Date(transaction.date).toLocaleDateString()}</td>
                        <td>${transaction.employee}</td>
                        <td class="action-buttons-cell">
                            ${canEdit ? `
                                <button class="action-btn delete" onclick="window.transactionManager.deleteTransaction(${transaction.id})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            ` : '<span>No actions</span>'}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    openTransactionModal(transaction = null) {
        const modal = document.getElementById('transaction-modal');
        
        if (transaction) {
            this.currentEditingId = transaction.id;
            this.fillTransactionForm(transaction);
        } else {
            this.currentEditingId = null;
            this.clearTransactionForm();
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeTransactionModal() {
        const modal = document.getElementById('transaction-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentEditingId = null;
    }

    fillTransactionForm(transaction) {
        document.getElementById('transaction-product').value = transaction.productId;
        this.updateProductInfo(transaction.productId);
        document.getElementById('transaction-quantity').value = transaction.quantity;
        this.calculateTotal();
    }

    clearTransactionForm() {
        document.getElementById('transaction-form').reset();
        document.getElementById('transaction-price').value = '';
        document.getElementById('transaction-total').value = '';
    }

    saveTransaction() {
        const productId = parseInt(document.getElementById('transaction-product').value);
        const quantity = parseInt(document.getElementById('transaction-quantity').value);
        const amount = parseFloat(document.getElementById('transaction-total').value);
        
        if (!productId) {
            window.app.showNotification('Please select a product', 'error');
            return;
        }

        if (quantity <= 0) {
            window.app.showNotification('Please enter a valid quantity', 'error');
            return;
        }

        const product = window.db.getProduct(productId);
        if (!product) {
            window.app.showNotification('Product not found', 'error');
            return;
        }

        if (product.stock < quantity) {
            window.app.showNotification(`Insufficient stock. Only ${product.stock} items available`, 'error');
            return;
        }

        const transactionData = {
            productId: productId,
            quantity: quantity,
            amount: amount
        };

        try {
            window.db.addTransaction(transactionData);
            window.app.showNotification('Transaction completed successfully', 'success');

            this.closeTransactionModal();
            this.loadTransactions();
            this.loadProductOptions();
            
            // Update dashboard stats
            if (window.app && window.app.updateDashboardStats) {
                window.app.updateDashboardStats();
            }
        } catch (error) {
            window.app.showNotification(error.message, 'error');
        }
    }

    deleteTransaction(id) {
        if (!window.auth.isAdmin()) {
            window.app.showNotification('Only administrators can delete transactions', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to delete this transaction? The product stock will be restored.')) {
            try {
                window.db.deleteTransaction(id);
                window.app.showNotification('Transaction deleted successfully', 'success');
                this.loadTransactions();
                this.loadProductOptions();
                
                // Update dashboard stats
                if (window.app && window.app.updateDashboardStats) {
                    window.app.updateDashboardStats();
                }
            } catch (error) {
                window.app.showNotification(error.message, 'error');
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to initialize
    const initTransactions = () => {
        if (window.auth && window.auth.currentUser) {
            window.transactionManager = new TransactionManager();
        }
    };
    
    if (window.auth) {
        initTransactions();
    } else {
        setTimeout(initTransactions, 100);
    }
});