// admin.js - Fixed Version
class AdminManager {
    constructor() {
        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.checkPermissions();
        this.setupEventListeners();
        this.loadAdminData();
    }

    checkPermissions() {
        if (!window.auth || !window.auth.currentUser || !window.auth.isAdmin()) {
            window.location.href = 'dashboard.html';
            return;
        }
    }

    setupEventListeners() {
        // Employee management
        const addEmployeeBtn = document.getElementById('add-employee-btn');
        if (addEmployeeBtn) {
            addEmployeeBtn.addEventListener('click', () => {
                this.openEmployeeModal();
            });
        }

        const employeeForm = document.getElementById('employee-form');
        if (employeeForm) {
            employeeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEmployee();
            });
        }

        const cancelBtn = document.getElementById('cancel-employee');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeEmployeeModal();
            });
        }

        // Settings form
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }

        // Backup/restore
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.createBackup();
            });
        }

        const restoreBtn = document.getElementById('restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                document.getElementById('restore-file').click();
            });
        }

        const restoreFile = document.getElementById('restore-file');
        if (restoreFile) {
            restoreFile.addEventListener('change', (e) => {
                this.restoreBackup(e);
            });
        }

        // Tab functionality
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Close modal buttons
        const closeModalBtns = document.querySelectorAll('.close-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeEmployeeModal();
            });
        });

        // Modal backdrop click
        const modal = document.getElementById('employee-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeEmployeeModal();
                }
            });
        }
    }

    switchTab(tabName) {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
            }
        });
        
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            }
        });
    }

    loadAdminData() {
        this.loadEmployees();
        this.loadSettings();
        this.loadBackupInfo();
    }

    loadEmployees() {
        const employees = window.db.getUsers();
        const tbody = document.getElementById('employees-table');
        
        if (tbody) {
            const nonAdminEmployees = employees.filter(employee => employee.username !== 'admin');
            
            if (nonAdminEmployees.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No employees found</td></tr>';
                return;
            }
            
            tbody.innerHTML = nonAdminEmployees.map(employee => {
                return `
                    <tr>
                        <td>${employee.id}</td>
                        <td>${employee.username}</td>
                        <td>${employee.name}</td>
                        <td><span class="status ${employee.role === 'admin' ? 'in-stock' : 'low-stock'}">${employee.role}</span></td>
                        <td>${new Date(employee.created).toLocaleDateString()}</td>
                        <td class="action-buttons-cell">
                            <button class="action-btn edit" onclick="window.adminManager.editEmployee(${employee.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="action-btn delete" onclick="window.adminManager.deleteEmployee(${employee.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    loadSettings() {
        const settings = window.db.getSettings();
        document.getElementById('low-stock-threshold').value = settings.lowStockThreshold || 5;
        document.getElementById('profit-margin').value = settings.profitMargin || 25;
        document.getElementById('store-name').value = settings.storeName || 'QUBIC Store';
    }

    loadBackupInfo() {
        const settings = window.db.getSettings();
        const lastBackupElement = document.getElementById('last-backup');
        
        if (lastBackupElement) {
            if (settings.lastBackup) {
                lastBackupElement.textContent = new Date(settings.lastBackup).toLocaleString();
            } else {
                lastBackupElement.textContent = 'Never';
            }
        }
    }

    openEmployeeModal(employee = null) {
        const modal = document.getElementById('employee-modal');
        const modalTitle = document.getElementById('employee-modal-title');
        
        if (employee) {
            modalTitle.textContent = 'Edit Employee';
            this.currentEditingId = employee.id;
            this.fillEmployeeForm(employee);
        } else {
            modalTitle.textContent = 'Add Employee';
            this.currentEditingId = null;
            this.clearEmployeeForm();
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeEmployeeModal() {
        const modal = document.getElementById('employee-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentEditingId = null;
    }

    fillEmployeeForm(employee) {
        document.getElementById('employee-username').value = employee.username;
        document.getElementById('employee-name').value = employee.name;
        document.getElementById('employee-role').value = employee.role;
        document.getElementById('employee-password').value = '';
        document.getElementById('employee-password').placeholder = 'Leave blank to keep current password';
    }

    clearEmployeeForm() {
        document.getElementById('employee-form').reset();
    }

    saveEmployee() {
        const formData = {
            username: document.getElementById('employee-username').value.trim(),
            name: document.getElementById('employee-name').value.trim(),
            role: document.getElementById('employee-role').value,
            password: document.getElementById('employee-password').value
        };

        if (!formData.username || !formData.name || !formData.role) {
            window.app.showNotification('Please fill all required fields', 'error');
            return;
        }

        try {
            if (this.currentEditingId) {
                const existingEmployee = window.db.getUsers().find(u => u.id === this.currentEditingId);
                
                // Only update password if provided
                if (formData.password) {
                    formData.password = formData.password;
                } else {
                    delete formData.password;
                }
                
                window.db.updateUser(this.currentEditingId, formData);
                window.app.showNotification('Employee updated successfully', 'success');
            } else {
                if (!formData.password) {
                    window.app.showNotification('Password is required for new employees', 'error');
                    return;
                }
                window.db.addUser(formData);
                window.app.showNotification('Employee added successfully', 'success');
            }

            this.closeEmployeeModal();
            this.loadEmployees();
        } catch (error) {
            window.app.showNotification(error.message, 'error');
        }
    }

    editEmployee(id) {
        const employee = window.db.getUsers().find(u => u.id === id);
        if (employee) {
            this.openEmployeeModal(employee);
        }
    }

    deleteEmployee(id) {
        const employee = window.db.getUsers().find(u => u.id === id);
        if (employee && employee.username === 'admin') {
            window.app.showNotification('Cannot delete the admin user', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this employee?')) {
            try {
                window.db.deleteUser(id);
                window.app.showNotification('Employee deleted successfully', 'success');
                this.loadEmployees();
            } catch (error) {
                window.app.showNotification(error.message, 'error');
            }
        }
    }

    createBackup() {
        try {
            const backupData = window.db.backupData();
            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qubic-store-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Update last backup info
            const settings = window.db.getSettings();
            settings.lastBackup = new Date().toISOString();
            window.db.updateSettings(settings);
            
            window.app.showNotification('Backup created successfully', 'success');
            this.loadBackupInfo();
        } catch (error) {
            window.app.showNotification('Error creating backup: ' + error.message, 'error');
        }
    }

    restoreBackup(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm('This will replace all current data. Are you sure you want to continue?')) {
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const success = window.db.restoreData(event.target.result);
                if (success) {
                    window.app.showNotification('Data restored successfully', 'success');
                    this.loadAdminData();
                    
                    // Refresh other managers if they exist
                    if (window.app && window.app.updateDashboardStats) {
                        window.app.updateDashboardStats();
                    }
                    if (window.inventoryManager) {
                        window.inventoryManager.loadInventory();
                    }
                    if (window.transactionManager) {
                        window.transactionManager.loadTransactions();
                        window.transactionManager.loadProductOptions();
                    }
                    if (window.analyticsManager) {
                        window.analyticsManager.loadAnalytics();
                        window.analyticsManager.renderCharts();
                    }
                } else {
                    window.app.showNotification('Error restoring data from backup file', 'error');
                }
            } catch (error) {
                window.app.showNotification('Error restoring backup: ' + error.message, 'error');
            }
        };
        reader.onerror = () => {
            window.app.showNotification('Error reading backup file', 'error');
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    }

    saveSettings() {
        const settings = {
            lowStockThreshold: parseInt(document.getElementById('low-stock-threshold').value),
            profitMargin: parseFloat(document.getElementById('profit-margin').value),
            storeName: document.getElementById('store-name').value.trim()
        };

        if (isNaN(settings.lowStockThreshold) || settings.lowStockThreshold < 1) {
            window.app.showNotification('Please enter a valid low stock threshold', 'error');
            return;
        }

        if (isNaN(settings.profitMargin) || settings.profitMargin < 0 || settings.profitMargin > 100) {
            window.app.showNotification('Please enter a valid profit margin (0-100)', 'error');
            return;
        }

        if (!settings.storeName) {
            window.app.showNotification('Please enter a store name', 'error');
            return;
        }

        window.db.updateSettings(settings);
        window.app.showNotification('Settings saved successfully', 'success');
        
        // Refresh inventory if it exists to update stock status
        if (window.inventoryManager) {
            window.inventoryManager.loadInventory();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to initialize
    const initAdmin = () => {
        if (window.auth && window.auth.currentUser && window.auth.isAdmin()) {
            window.adminManager = new AdminManager();
        }
    };
    
    if (window.auth) {
        initAdmin();
    } else {
        setTimeout(initAdmin, 100);
    }
});