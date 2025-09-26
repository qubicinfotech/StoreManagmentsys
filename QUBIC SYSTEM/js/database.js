// database.js - Fixed Version
class Database {
    constructor() {
        this.init();
    }

    init() {
        this.initializeDefaultData();
    }

    initializeDefaultData() {
        if (!localStorage.getItem('users')) {
            const defaultUsers = [
                {
                    id: 1,
                    username: 'qubic',
                    password: '##$@##',
                    name: 'Administrator',
                    role: 'admin',
                    created: new Date().toISOString()
                },
                {
                    id: 2,
                    username: 'emp',
                    password: 'emp@@',
                    name: 'Employee User',
                    role: 'employee',
                    created: new Date().toISOString()
                }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }

        if (!localStorage.getItem('products')) {
            const defaultProducts = [
                {
                    id: 1,
                    name: 'iPhone 14 Pro',
                    category: 'Phones',
                    barcode: '1234567890123',
                    stock: 15,
                    price: 999.99,
                    cost: 799.99,
                    description: 'Latest iPhone model',
                    created: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'MacBook Pro',
                    category: 'Laptops',
                    barcode: '1234567890124',
                    stock: 8,
                    price: 1999.99,
                    cost: 1599.99,
                    description: 'Apple MacBook Pro 16-inch',
                    created: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Google Play Gift Card',
                    category: 'Vouchers',
                    barcode: '1234567890125',
                    stock: 50,
                    price: 25.00,
                    cost: 22.50,
                    description: '$25 Google Play Gift Card',
                    created: new Date().toISOString()
                }
            ];
            localStorage.setItem('products', JSON.stringify(defaultProducts));
        }

        if (!localStorage.getItem('transactions')) {
            const defaultTransactions = [
                {
                    id: 1,
                    productId: 1,
                    productName: 'iPhone 14 Pro',
                    quantity: 1,
                    amount: 999.99,
                    date: new Date(Date.now() - 86400000).toISOString(),
                    employee: 'admin'
                },
                {
                    id: 2,
                    productId: 3,
                    productName: 'Google Play Gift Card',
                    quantity: 2,
                    amount: 50.00,
                    date: new Date(Date.now() - 172800000).toISOString(),
                    employee: 'employee'
                }
            ];
            localStorage.setItem('transactions', JSON.stringify(defaultTransactions));
        }

        if (!localStorage.getItem('settings')) {
            const defaultSettings = {
                lowStockThreshold: 5,
                profitMargin: 25,
                storeName: 'QUBIC Store',
                lastBackup: null
            };
            localStorage.setItem('settings', JSON.stringify(defaultSettings));
        }
    }

    // User management methods
    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }

    getUserByUsername(username) {
        const users = this.getUsers();
        return users.find(user => user.username === username);
    }

    addUser(userData) {
        const users = this.getUsers();
        
        // Check if username already exists
        if (users.find(user => user.username === userData.username)) {
            throw new Error('Username already exists');
        }
        
        const newUser = {
            id: this.generateId(users),
            username: userData.username,
            password: userData.password,
            name: userData.name,
            role: userData.role || 'employee',
            created: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return newUser;
    }

    updateUser(id, updatedData) {
        const users = this.getUsers();
        const userIndex = users.findIndex(user => user.id === id);
        if (userIndex !== -1) {
            // Don't update username if it's admin
            if (users[userIndex].username === 'admin') {
                delete updatedData.username;
            }
            
            users[userIndex] = { ...users[userIndex], ...updatedData };
            localStorage.setItem('users', JSON.stringify(users));
            return users[userIndex];
        }
        return null;
    }

    deleteUser(id) {
        const users = this.getUsers();
        const user = users.find(u => u.id === id);
        
        // Prevent deleting admin user
        if (user && user.username === 'admin') {
            throw new Error('Cannot delete admin user');
        }
        
        const filteredUsers = users.filter(user => user.id !== id);
        localStorage.setItem('users', JSON.stringify(filteredUsers));
        return filteredUsers;
    }

    // Product management methods
    getProducts() {
        return JSON.parse(localStorage.getItem('products') || '[]');
    }

    getProduct(id) {
        const products = this.getProducts();
        return products.find(product => product.id === id);
    }

    getProductByBarcode(barcode) {
        const products = this.getProducts();
        return products.find(product => product.barcode === barcode);
    }

    addProduct(productData) {
        const products = this.getProducts();
        const newProduct = {
            id: this.generateId(products),
            ...productData,
            created: new Date().toISOString()
        };
        products.push(newProduct);
        localStorage.setItem('products', JSON.stringify(products));
        return newProduct;
    }

    updateProduct(id, updatedData) {
        const products = this.getProducts();
        const productIndex = products.findIndex(product => product.id === id);
        if (productIndex !== -1) {
            products[productIndex] = { ...products[productIndex], ...updatedData };
            localStorage.setItem('products', JSON.stringify(products));
            return products[productIndex];
        }
        return null;
    }

    deleteProduct(id) {
        const products = this.getProducts();
        const filteredProducts = products.filter(product => product.id !== id);
        localStorage.setItem('products', JSON.stringify(filteredProducts));
        return filteredProducts;
    }

    // Transaction management methods
    getTransactions() {
        return JSON.parse(localStorage.getItem('transactions') || '[]');
    }

    addTransaction(transactionData) {
        const transactions = this.getTransactions();
        const product = this.getProduct(transactionData.productId);
        
        if (!product) {
            throw new Error('Product not found');
        }
        
        if (product.stock < transactionData.quantity) {
            throw new Error(`Insufficient stock. Only ${product.stock} available`);
        }
        
        const newTransaction = {
            id: this.generateId(transactions),
            productId: transactionData.productId,
            productName: product.name,
            quantity: transactionData.quantity,
            amount: transactionData.amount,
            date: new Date().toISOString(),
            employee: window.auth ? window.auth.getCurrentUser().username : 'system'
        };
        
        transactions.unshift(newTransaction); // Add to beginning for recent first
        
        // Update product stock
        this.updateProduct(product.id, {
            stock: product.stock - transactionData.quantity
        });
        
        localStorage.setItem('transactions', JSON.stringify(transactions));
        return newTransaction;
    }

    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const transaction = transactions.find(t => t.id === id);
        
        if (transaction) {
            // Restore product stock
            const product = this.getProduct(transaction.productId);
            if (product) {
                this.updateProduct(product.id, {
                    stock: product.stock + transaction.quantity
                });
            }
        }
        
        const filteredTransactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(filteredTransactions));
        return filteredTransactions;
    }

    // Settings management
    getSettings() {
        return JSON.parse(localStorage.getItem('settings') || '{}');
    }

    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        localStorage.setItem('settings', JSON.stringify(updatedSettings));
        return updatedSettings;
    }

    // Utility methods
    generateId(items) {
        return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    }

    backupData() {
        const data = {
            users: this.getUsers(),
            products: this.getProducts(),
            transactions: this.getTransactions(),
            settings: this.getSettings(),
            backupDate: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(data, null, 2);
    }

    restoreData(backupData) {
        try {
            const data = JSON.parse(backupData);
            
            // Validate backup data
            if (!data.users || !data.products || !data.transactions || !data.settings) {
                throw new Error('Invalid backup file format');
            }
            
            localStorage.setItem('users', JSON.stringify(data.users));
            localStorage.setItem('products', JSON.stringify(data.products));
            localStorage.setItem('transactions', JSON.stringify(data.transactions));
            localStorage.setItem('settings', JSON.stringify(data.settings));
            
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }
}

// Initialize database when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.db = new Database();
});