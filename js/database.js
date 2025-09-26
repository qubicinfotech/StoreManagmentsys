// database.js - JSON Server Version
class Database {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.init();
    }

    init() {
        // Check if JSON Server is available
        this.checkServerConnection();
    }

    async checkServerConnection() {
        try {
            const response = await fetch(`${this.baseURL}/users`);
            if (!response.ok) {
                throw new Error('JSON Server not available');
            }
            console.log('Connected to JSON Server successfully');
        } catch (error) {
            console.error('JSON Server connection failed:', error);
            this.showServerError();
        }
    }

    showServerError() {
        const errorMessage = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ff4444;
                color: white;
                padding: 15px;
                text-align: center;
                z-index: 10000;
                font-weight: bold;
            ">
                ⚠️ JSON Server is not running. Please start the server with: npm run json-server
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', errorMessage);
    }

    // Generic API methods
    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // User management methods
    async getUsers() {
        return await this.apiCall('/users');
    }

    async getUserByUsername(username) {
        const users = await this.getUsers();
        return users.find(user => user.username === username);
    }

    async addUser(userData) {
        const users = await this.getUsers();
        
        // Check if username already exists
        if (users.find(user => user.username === userData.username)) {
            throw new Error('Username already exists');
        }
        
        const newUser = {
            username: userData.username,
            password: userData.password,
            name: userData.name,
            role: userData.role || 'employee',
            created: new Date().toISOString()
        };

        return await this.apiCall('/users', {
            method: 'POST',
            body: JSON.stringify(newUser)
        });
    }

    async updateUser(id, updatedData) {
        const user = await this.apiCall(`/users/${id}`);
        
        // Don't update username if it's admin
        if (user.username === 'admin') {
            delete updatedData.username;
        }
        
        const updatedUser = { ...user, ...updatedData };
        return await this.apiCall(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedUser)
        });
    }

    async deleteUser(id) {
        const user = await this.apiCall(`/users/${id}`);
        
        // Prevent deleting admin user
        if (user && user.username === 'admin') {
            throw new Error('Cannot delete admin user');
        }
        
        return await this.apiCall(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Product management methods
    async getProducts() {
        return await this.apiCall('/products');
    }

    async getProduct(id) {
        return await this.apiCall(`/products/${id}`);
    }

    async getProductByBarcode(barcode) {
        const products = await this.getProducts();
        return products.find(product => product.barcode === barcode);
    }

    async addProduct(productData) {
        const newProduct = {
            ...productData,
            created: new Date().toISOString()
        };

        return await this.apiCall('/products', {
            method: 'POST',
            body: JSON.stringify(newProduct)
        });
    }

    async updateProduct(id, updatedData) {
        const product = await this.getProduct(id);
        const updatedProduct = { ...product, ...updatedData };
        
        return await this.apiCall(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedProduct)
        });
    }

    async deleteProduct(id) {
        return await this.apiCall(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    // Transaction management methods
    async getTransactions() {
        return await this.apiCall('/transactions');
    }

    async addTransaction(transactionData) {
        const product = await this.getProduct(transactionData.productId);
        
        if (!product) {
            throw new Error('Product not found');
        }
        
        if (product.stock < transactionData.quantity) {
            throw new Error(`Insufficient stock. Only ${product.stock} available`);
        }
        
        const newTransaction = {
            productId: transactionData.productId,
            productName: product.name,
            quantity: transactionData.quantity,
            amount: transactionData.amount,
            date: new Date().toISOString(),
            employee: window.auth ? window.auth.getCurrentUser().username : 'system'
        };
        
        // Update product stock
        await this.updateProduct(product.id, {
            stock: product.stock - transactionData.quantity
        });
        
        return await this.apiCall('/transactions', {
            method: 'POST',
            body: JSON.stringify(newTransaction)
        });
    }

    async deleteTransaction(id) {
        const transaction = await this.apiCall(`/transactions/${id}`);
        
        if (transaction) {
            // Restore product stock
            const product = await this.getProduct(transaction.productId);
            if (product) {
                await this.updateProduct(product.id, {
                    stock: product.stock + transaction.quantity
                });
            }
        }
        
        return await this.apiCall(`/transactions/${id}`, {
            method: 'DELETE'
        });
    }

    // Settings management
    async getSettings() {
        try {
            const settings = await this.apiCall('/settings/1');
            return settings;
        } catch (error) {
            // Return default settings if not found
            return {
                id: 1,
                lowStockThreshold: 5,
                profitMargin: 25,
                storeName: 'QUBIC Store',
                lastBackup: null
            };
        }
    }

    async updateSettings(newSettings) {
        const currentSettings = await this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        
        return await this.apiCall('/settings/1', {
            method: 'PUT',
            body: JSON.stringify(updatedSettings)
        });
    }

    // Backup/Restore methods
    async backupData() {
        const [users, products, transactions, settings] = await Promise.all([
            this.getUsers(),
            this.getProducts(),
            this.getTransactions(),
            this.getSettings()
        ]);

        const backupData = {
            users,
            products,
            transactions,
            settings,
            backupDate: new Date().toISOString(),
            version: '1.0'
        };

        return JSON.stringify(backupData, null, 2);
    }

    async restoreData(backupData) {
        try {
            const data = JSON.parse(backupData);
            
            // Validate backup data
            if (!data.users || !data.products || !data.transactions || !data.settings) {
                throw new Error('Invalid backup file format');
            }

            // Clear existing data
            await this.clearAllData();

            // Restore data
            const restorePromises = [
                ...data.users.map(user => this.apiCall('/users', {
                    method: 'POST',
                    body: JSON.stringify(user)
                })),
                ...data.products.map(product => this.apiCall('/products', {
                    method: 'POST',
                    body: JSON.stringify(product)
                })),
                ...data.transactions.map(transaction => this.apiCall('/transactions', {
                    method: 'POST',
                    body: JSON.stringify(transaction)
                }))
            ];

            await Promise.all(restorePromises);
            await this.updateSettings(data.settings);

            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }

    async clearAllData() {
        try {
            // Get all existing data
            const [users, products, transactions] = await Promise.all([
                this.getUsers(),
                this.getProducts(),
                this.getTransactions()
            ]);

            // Delete all records
            const deletePromises = [
                ...users.map(user => this.apiCall(`/users/${user.id}`, { method: 'DELETE' })),
                ...products.map(product => this.apiCall(`/products/${product.id}`, { method: 'DELETE' })),
                ...transactions.map(transaction => this.apiCall(`/transactions/${transaction.id}`, { method: 'DELETE' }))
            ];

            await Promise.all(deletePromises);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
}

// Initialize database when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.db = new Database();
});