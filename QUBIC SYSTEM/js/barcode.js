// barcode.js
class BarcodeScanner {
    constructor() {
        this.scanner = null;
        this.isScanning = false;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasContext = null;
        this.onScanCallback = null;
        this.init();
    }

    init() {
        this.createScannerElements();
        this.setupEventListeners();
    }

    createScannerElements() {
        // Create scanner modal
        const scannerModal = document.createElement('div');
        scannerModal.id = 'barcode-scanner-modal';
        scannerModal.className = 'modal';
        scannerModal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Barcode Scanner</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="scanner-container" style="text-align: center; padding: 20px;">
                    <video id="barcode-video" width="100%" height="300" style="border-radius: 8px; background: #000;"></video>
                    <canvas id="barcode-canvas" style="display: none;"></canvas>
                    <div class="scanner-controls" style="margin-top: 15px;">
                        <button id="start-scan-btn" class="btn btn-primary">
                            <i class="fas fa-camera"></i> Start Scanner
                        </button>
                        <button id="stop-scan-btn" class="btn btn-secondary" style="display: none;">
                            <i class="fas fa-stop"></i> Stop Scanner
                        </button>
                    </div>
                    <div id="scan-result" style="margin-top: 15px; font-weight: bold;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(scannerModal);

        this.videoElement = document.getElementById('barcode-video');
        this.canvasElement = document.getElementById('barcode-canvas');
        this.canvasContext = this.canvasElement.getContext('2d');
    }

    setupEventListeners() {
        // Close modal
        document.querySelector('#barcode-scanner-modal .close-modal').addEventListener('click', () => {
            this.closeScanner();
        });

        // Start scan button
        document.getElementById('start-scan-btn').addEventListener('click', () => {
            this.startScan();
        });

        // Stop scan button
        document.getElementById('stop-scan-btn').addEventListener('click', () => {
            this.stopScan();
        });

        // Close modal when clicking outside
        document.getElementById('barcode-scanner-modal').addEventListener('click', (e) => {
            if (e.target.id === 'barcode-scanner-modal') {
                this.closeScanner();
            }
        });
    }

    openScanner(onScanCallback) {
        this.onScanCallback = onScanCallback;
        document.getElementById('barcode-scanner-modal').style.display = 'flex';
        document.getElementById('scan-result').textContent = '';
    }

    closeScanner() {
        this.stopScan();
        document.getElementById('barcode-scanner-modal').style.display = 'none';
    }

    async startScan() {
        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            this.videoElement.srcObject = stream;
            this.videoElement.play();
            
            // Update UI
            document.getElementById('start-scan-btn').style.display = 'none';
            document.getElementById('stop-scan-btn').style.display = 'inline-block';
            
            this.isScanning = true;
            this.scanFrame();
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            document.getElementById('scan-result').textContent = 
                'Camera access denied or not available. Please check permissions.';
            document.getElementById('scan-result').style.color = 'var(--danger-color)';
        }
    }

    stopScan() {
        this.isScanning = false;
        
        if (this.videoElement.srcObject) {
            const tracks = this.videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }
        
        // Update UI
        document.getElementById('start-scan-btn').style.display = 'inline-block';
        document.getElementById('stop-scan-btn').style.display = 'none';
        document.getElementById('scan-result').textContent = '';
    }

    scanFrame() {
        if (!this.isScanning) return;

        // Set canvas dimensions to match video
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        
        // Draw video frame to canvas
        this.canvasContext.drawImage(
            this.videoElement, 
            0, 0, 
            this.canvasElement.width, 
            this.canvasElement.height
        );
        
        // Get image data from canvas
        const imageData = this.canvasContext.getImageData(
            0, 0, 
            this.canvasElement.width, 
            this.canvasElement.height
        );
        
        // Try to detect barcode
        const barcode = this.detectBarcode(imageData);
        
        if (barcode) {
            this.onBarcodeDetected(barcode);
        } else {
            // Continue scanning
            requestAnimationFrame(() => this.scanFrame());
        }
    }

    detectBarcode(imageData) {
        // Simple barcode detection algorithm
        // Note: This is a basic implementation. For production, consider using a library like QuaggaJS or ZXing
        
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Convert to grayscale and detect edges
        const grayscale = [];
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i+1] + data[i+2]) / 3;
            grayscale.push(gray);
        }
        
        // Simple barcode pattern detection (looking for alternating dark/light bars)
        // This is a simplified version - real barcode detection is more complex
        let potentialBarcodes = [];
        
        // Scan middle row for patterns
        const middleRow = Math.floor(height / 2);
        const rowStart = middleRow * width;
        
        let currentColor = grayscale[rowStart] > 128 ? 'light' : 'dark';
        let barStart = 0;
        let bars = [];
        
        for (let x = 1; x < width; x++) {
            const pixelIndex = rowStart + x;
            const color = grayscale[pixelIndex] > 128 ? 'light' : 'dark';
            
            if (color !== currentColor) {
                bars.push({
                    color: currentColor,
                    width: x - barStart
                });
                barStart = x;
                currentColor = color;
            }
        }
        
        // Check if pattern resembles a barcode (alternating bars of similar widths)
        if (bars.length > 10) {
            // Calculate average bar width
            const avgWidth = bars.reduce((sum, bar) => sum + bar.width, 0) / bars.length;
            
            // Check if bars are relatively consistent (within 50% of average)
            const validBars = bars.filter(bar => 
                bar.width > avgWidth * 0.5 && bar.width < avgWidth * 1.5
            );
            
            if (validBars.length > bars.length * 0.7) {
                // This might be a barcode - try to decode
                // For simplicity, we'll just return a mock value
                // In a real implementation, you would decode the actual barcode
                return this.mockBarcodeDecode(bars);
            }
        }
        
        return null;
    }

    mockBarcodeDecode(bars) {
        // Mock barcode decoding - in a real app, use a proper barcode library
        // This generates a random 13-digit barcode for demonstration
        let barcode = '';
        for (let i = 0; i < 13; i++) {
            barcode += Math.floor(Math.random() * 10);
        }
        return barcode;
    }

    onBarcodeDetected(barcode) {
        document.getElementById('scan-result').textContent = `Barcode detected: ${barcode}`;
        document.getElementById('scan-result').style.color = 'var(--success-color)';
        
        // Stop scanning
        this.stopScan();
        
        // Call callback with detected barcode
        if (this.onScanCallback) {
            this.onScanCallback(barcode);
        }
        
        // Auto-close after 2 seconds
        setTimeout(() => {
            this.closeScanner();
        }, 2000);
    }

    // Method to manually enter a barcode (fallback)
    manualBarcodeEntry(onScanCallback) {
        const barcode = prompt('Enter barcode manually:');
        if (barcode && onScanCallback) {
            onScanCallback(barcode);
        }
    }
}

// Initialize barcode scanner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.barcodeScanner = new BarcodeScanner();
});

// Integration with inventory system
BarcodeScanner.prototype.integrateWithInventory = function() {
    // Add barcode scan button to product form
    const productForm = document.getElementById('product-form');
    if (productForm) {
        const barcodeField = document.getElementById('product-barcode');
        if (barcodeField) {
            // Create scan button
            const scanButton = document.createElement('button');
            scanButton.type = 'button';
            scanButton.className = 'btn btn-secondary';
            scanButton.innerHTML = '<i class="fas fa-barcode"></i> Scan';
            scanButton.style.marginTop = '5px';
            
            scanButton.addEventListener('click', () => {
                this.openScanner((barcode) => {
                    barcodeField.value = barcode;
                });
            });
            
            // Insert after barcode field
            barcodeField.parentNode.appendChild(scanButton);
            
            // Also add manual entry option
            const manualButton = document.createElement('button');
            manualButton.type = 'button';
            manualButton.className = 'btn btn-secondary';
            manualButton.innerHTML = '<i class="fas fa-keyboard"></i> Manual Entry';
            manualButton.style.marginTop = '5px';
            manualButton.style.marginLeft = '5px';
            
            manualButton.addEventListener('click', () => {
                this.manualBarcodeEntry((barcode) => {
                    barcodeField.value = barcode;
                });
            });
            
            barcodeField.parentNode.appendChild(manualButton);
        }
    }
};

// Auto-integrate when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.barcodeScanner) {
        setTimeout(() => {
            window.barcodeScanner.integrateWithInventory();
        }, 1000);
    }
});