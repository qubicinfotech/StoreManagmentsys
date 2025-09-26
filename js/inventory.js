// inventory.js - Fixed Version
class InventoryManager {
    constructor() {
        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.checkPermissions();
        this.setupEventListeners();
        this.loadInventory();
    }

    checkPermissions() {
        if (!window.auth || !window.auth.currentUser) {
            window.location.href = 'index.html';
            return;
        }
    }

    setupEventListeners() {
        // Add product button
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.openProductModal();
            });
        }

        // Product form
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancel-product');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeProductModal();
            });
        }

        // Close modal buttons
        const closeModalBtns = document.querySelectorAll('.close-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeProductModal();
            });
        });

        // Search functionality
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Modal backdrop click
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeProductModal();
                }
            });
        }
    }

    loadInventory() {
        const products = window.db.getProducts();
        const settings = window.db.getSettings();
        const tbody = document.getElementById('inventory-table');
        
        if (tbody) {
            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No products found</td></tr>';
                return;
            }
            
            tbody.innerHTML = products.map(product => {
                const status = this.getStockStatus(product.stock, settings.lowStockThreshold);
                return `
                    <tr>
                        <td>${product.id}</td>
                        <td>${product.name}</td>
                        <td>${product.category}</td>
                        <td>${product.barcode || 'N/A'}</td>
                        <td>${product.stock}</td>
                        <td>$${product.price.toFixed(2)}</td>
                        <td><span class="status ${status.class}">${status.text}</span></td>
                        <td class="action-buttons-cell">
                            <button class="action-btn edit" onclick="window.inventoryManager.editProduct(${product.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="action-btn delete" onclick="window.inventoryManager.deleteProduct(${product.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    getStockStatus(stock, threshold) {
        if (stock === 0) {
            return { class: 'out-of-stock', text: 'Out of Stock' };
        } else if (stock <= threshold) {
            return { class: 'low-stock', text: 'Low Stock' };
        } else {
            return { class: 'in-stock', text: 'In Stock' };
        }
    }

    handleSearch(query) {
        const products = window.db.getProducts();
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase()) ||
            (product.barcode && product.barcode.includes(query))
        );
        
        const tbody = document.getElementById('inventory-table');
        if (tbody) {
            if (filteredProducts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No products match your search</td></tr>';
                return;
            }
            
            tbody.innerHTML = filteredProducts.map(product => {
                const status = this.getStockStatus(product.stock, window.db.getSettings().lowStockThreshold);
                return `
                    <tr>
                        <td>${product.id}</td>
                        <td>${product.name}</td>
                        <td>${product.category}</td>
                        <td>${product.barcode || 'N/A'}</td>
                        <td>${product.stock}</td>
                        <td>$${product.price.toFixed(2)}</td>
                        <td><span class="status ${status.class}">${status.text}</span></td>
                        <td class="action-buttons-cell">
                            <button class="action-btn edit" onclick="window.inventoryManager.editProduct(${product.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="action-btn delete" onclick="window.inventoryManager.deleteProduct(${product.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    openProductModal(product = null) {
        const modal = document.getElementById('product-modal');
        const modalTitle = document.getElementById('modal-title');
        
        if (product) {
            modalTitle.textContent = 'Edit Product';
            this.currentEditingId = product.id;
            this.fillProductForm(product);
        } else {
            modalTitle.textContent = 'Add New Product';
            this.currentEditingId = null;
            this.clearProductForm();
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeProductModal() {
        const modal = document.getElementById('product-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentEditingId = null;
    }

    fillProductForm(product) {
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-barcode').value = product.barcode || '';
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-cost').value = product.cost;
        document.getElementById('product-description').value = product.description || '';
    }

    clearProductForm() {
        document.getElementById('product-form').reset();
    }

    saveProduct() {
        const formData = {
            name: document.getElementById('product-name').value.trim(),
            category: document.getElementById('product-category').value,
            barcode: document.getElementById('product-barcode').value.trim(),
            stock: parseInt(document.getElementById('product-stock').value),
            price: parseFloat(document.getElementById('product-price').value),
            cost: parseFloat(document.getElementById('product-cost').value),
            description: document.getElementById('product-description').value.trim()
        };

        // Validation
        if (!formData.name || !formData.category) {
            window.app.showNotification('Please fill all required fields', 'error');
            return;
        }

        if (formData.stock < 0 || isNaN(formData.stock)) {
            window.app.showNotification('Please enter a valid stock quantity', 'error');
            return;
        }

        if (formData.price <= 0 || isNaN(formData.price)) {
            window.app.showNotification('Please enter a valid price', 'error');
            return;
        }

        if (formData.cost <= 0 || isNaN(formData.cost)) {
            window.app.showNotification('Please enter a valid cost', 'error');
            return;
        }

        try {
            if (this.currentEditingId) {
                window.db.updateProduct(this.currentEditingId, formData);
                window.app.showNotification('Product updated successfully', 'success');
            } else {
                window.db.addProduct(formData);
                window.app.showNotification('Product added successfully', 'success');
            }

            this.closeProductModal();
            this.loadInventory();
            
            // Update dashboard stats if on dashboard
            if (window.app && window.app.updateDashboardStats) {
                window.app.updateDashboardStats();
            }
        } catch (error) {
            window.app.showNotification(error.message, 'error');
        }
    }

    editProduct(id) {
        const product = window.db.getProduct(id);
        if (product) {
            this.openProductModal(product);
        }
    }

    deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            try {
                window.db.deleteProduct(id);
                window.app.showNotification('Product deleted successfully', 'success');
                this.loadInventory();
                
                // Update dashboard stats if on dashboard
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
    const initInventory = () => {
        if (window.auth && window.auth.currentUser) {
            window.inventoryManager = new InventoryManager();
        }
    };
    
    if (window.auth) {
        initInventory();
    } else {
        setTimeout(initInventory, 100);
    }
});