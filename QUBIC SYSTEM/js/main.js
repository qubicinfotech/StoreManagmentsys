// main.js - Global application utilities
class ReelApp {
    constructor() {
        this.init();
    }

    init() {
        console.log('QUBIC Store Management System Initialized');
        this.setupGlobalErrorHandling();
        this.enhanceUI();
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showNotification('An unexpected error occurred', 'error');
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.showNotification('An unexpected error occurred', 'error');
        });
    }

    enhanceUI() {
        // Add smooth transitions to all buttons
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                const button = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
                this.addButtonFeedback(button);
            }
        });

        // Add loading state to forms
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                this.setButtonLoading(submitButton, true);
                
                // Re-enable button after form processing (assuming it will be handled by specific form handlers)
                setTimeout(() => {
                    this.setButtonLoading(submitButton, false);
                }, 2000);
            }
        });
    }

    addButtonFeedback(button) {
        button.style.transform = 'scale(0.98)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            const originalText = button.innerHTML;
            button.setAttribute('data-original-text', originalText);
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            button.disabled = true;
        } else {
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.innerHTML = originalText;
            }
            button.disabled = false;
        }
    }

    showNotification(message, type = 'success') {
        // Use auth notification if available, otherwise fallback
        if (window.auth && window.auth.showNotification) {
            window.auth.showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                color: white;
                border-radius: 5px;
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                background-color: ${type === 'success' ? '#00cc66' : '#ff4444'};
            `;
            notification.innerHTML = `
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                ${message}
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 3000);
        }
    }

    // Utility function to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Utility function to format date
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Utility function to debounce API calls
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the main application utilities
document.addEventListener('DOMContentLoaded', () => {
    window.reelApp = new ReelApp();
});

// Add CSS for animations if not already present
if (!document.querySelector('#global-styles')) {
    const styles = document.createElement('style');
    styles.id = 'global-styles';
    styles.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        button {
            transition: transform 0.15s ease;
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(styles);
}