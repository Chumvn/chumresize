// Image Resizer 2048 - Facebook Optimizer
// Main Application Logic - Supports ALL image formats including HEIC

class ImageResizer {
    constructor() {
        this.images = [];
        this.maxSize = 2048;
        this.quality = 0.92;
        this.format = 'jpeg';

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.previewArea = document.getElementById('previewArea');
        this.previewGrid = document.getElementById('previewGrid');
        this.imageCount = document.getElementById('imageCount');
        this.qualitySlider = document.getElementById('qualitySlider');
        this.qualityValue = document.getElementById('qualityValue');
        this.processingOverlay = document.getElementById('processingOverlay');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
    }

    initEventListeners() {
        // Upload zone events
        this.uploadZone.addEventListener('click', () => this.fileInput.click());
        this.uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Quality slider
        this.qualitySlider.addEventListener('input', (e) => {
            this.quality = e.target.value / 100;
            this.qualityValue.textContent = e.target.value;
        });

        // Size buttons
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.maxSize = parseInt(btn.dataset.size);
            });
        });

        // Format buttons
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.format = btn.dataset.format;
            });
        });

        // Action buttons
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadZone.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadZone.classList.remove('dragover');

        // Accept all image files including HEIC/HEIF
        const files = Array.from(e.dataTransfer.files).filter(f =>
            f.type.startsWith('image/') ||
            f.name.toLowerCase().endsWith('.heic') ||
            f.name.toLowerCase().endsWith('.heif') ||
            f.name.toLowerCase().endsWith('.bmp') ||
            f.name.toLowerCase().endsWith('.tiff') ||
            f.name.toLowerCase().endsWith('.tif') ||
            f.name.toLowerCase().endsWith('.svg')
        );
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            this.processFiles(files);
        }
        // Reset input for re-selection
        this.fileInput.value = '';
    }

    // Check if file is HEIC/HEIF format
    isHeicFile(file) {
        const name = file.name.toLowerCase();
        return name.endsWith('.heic') || name.endsWith('.heif') ||
            file.type === 'image/heic' || file.type === 'image/heif';
    }

    // Convert HEIC to standard format using heic2any library
    async convertHeicToBlob(file) {
        try {
            // Check if heic2any is available
            if (typeof heic2any === 'undefined') {
                throw new Error('HEIC converter library not loaded');
            }

            const blob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.95
            });
            // heic2any may return an array of blobs for multi-frame HEIC
            return Array.isArray(blob) ? blob[0] : blob;
        } catch (error) {
            console.error('HEIC conversion error:', error);
            throw new Error('Không thể chuyển đổi file HEIC. Vui lòng thử lại.');
        }
    }

    updateProcessingText(text) {
        const processingText = document.querySelector('.processing-text');
        if (processingText) {
            processingText.textContent = text;
        }
    }

    async processFiles(files) {
        this.showProcessing();

        const total = files.length;
        let processed = 0;

        for (const file of files) {
            try {
                let processableFile = file;
                const originalFileName = file.name;

                // Convert HEIC files first
                if (this.isHeicFile(file)) {
                    this.updateProcessingText('Đang chuyển đổi HEIC...');
                    processableFile = await this.convertHeicToBlob(file);
                }

                this.updateProcessingText('Đang xử lý ảnh...');
                const result = await this.resizeImage(processableFile, originalFileName);
                this.images.push(result);
                this.addImageCard(result);

                processed++;
                this.updateProgress(processed, total);
            } catch (error) {
                console.error('Error processing image:', error);
                processed++;
                this.updateProgress(processed, total);
            }
        }

        this.hideProcessing();
        this.updatePreviewArea();
    }

    resizeImage(file, originalFileName = null) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const fileName = originalFileName || file.name || 'image';

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    const { width: newWidth, height: newHeight } = this.calculateDimensions(img.width, img.height);

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    canvas.width = newWidth;
                    canvas.height = newHeight;

                    // High quality rendering
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Draw image
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);

                    // Get mime type
                    const mimeType = this.format === 'jpeg' ? 'image/jpeg' :
                        this.format === 'png' ? 'image/png' : 'image/webp';

                    // Convert to blob
                    canvas.toBlob((blob) => {
                        const resizedUrl = URL.createObjectURL(blob);
                        const originalSize = this.formatFileSize(file.size);
                        const newSize = this.formatFileSize(blob.size);

                        resolve({
                            id: Date.now() + Math.random(),
                            name: this.getNewFileName(fileName),
                            originalName: fileName,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            newWidth,
                            newHeight,
                            originalSize,
                            newSize,
                            blob,
                            url: resizedUrl,
                            format: this.format
                        });
                    }, mimeType, this.quality);
                };

                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    calculateDimensions(width, height) {
        if (width <= this.maxSize && height <= this.maxSize) {
            return { width, height };
        }

        const ratio = width / height;

        if (width > height) {
            return {
                width: this.maxSize,
                height: Math.round(this.maxSize / ratio)
            };
        } else {
            return {
                width: Math.round(this.maxSize * ratio),
                height: this.maxSize
            };
        }
    }

    getNewFileName(originalName) {
        const lastDot = originalName.lastIndexOf('.');
        const baseName = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
        const extension = this.format === 'jpeg' ? 'jpg' : this.format;
        return `${baseName}_${this.maxSize}px.${extension}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    addImageCard(image) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.id = image.id;

        card.innerHTML = `
            <div class="image-preview">
                <img src="${image.url}" alt="${image.name}">
            </div>
            <div class="image-info">
                <div class="image-name" title="${image.name}">${image.name}</div>
                <div class="image-stats">
                    <div class="stat-item">
                        <span class="stat-label">Gốc</span>
                        <span class="stat-value">${image.originalWidth}×${image.originalHeight}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Mới</span>
                        <span class="stat-value success">${image.newWidth}×${image.newHeight}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Dung lượng</span>
                        <span class="stat-value">${image.newSize}</span>
                    </div>
                </div>
                <div class="image-actions">
                    <button class="btn-icon download-btn" data-id="${image.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Tải về
                    </button>
                    <button class="btn-icon danger remove-btn" data-id="${image.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Xóa
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        card.querySelector('.download-btn').addEventListener('click', () => this.downloadImage(image));
        card.querySelector('.remove-btn').addEventListener('click', () => this.removeImage(image.id));

        this.previewGrid.appendChild(card);
    }

    downloadImage(image) {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = image.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    removeImage(id) {
        const index = this.images.findIndex(img => img.id === id);
        if (index > -1) {
            URL.revokeObjectURL(this.images[index].url);
            this.images.splice(index, 1);
        }

        const card = this.previewGrid.querySelector(`[data-id="${id}"]`);
        if (card) {
            card.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                card.remove();
                this.updatePreviewArea();
            }, 300);
        }
    }

    downloadAll() {
        if (this.images.length === 0) return;

        this.images.forEach((image, index) => {
            setTimeout(() => {
                this.downloadImage(image);
            }, index * 200);
        });
    }

    clearAll() {
        this.images.forEach(img => URL.revokeObjectURL(img.url));
        this.images = [];
        this.previewGrid.innerHTML = '';
        this.updatePreviewArea();
    }

    updatePreviewArea() {
        this.imageCount.textContent = this.images.length;
        this.previewArea.style.display = this.images.length > 0 ? 'block' : 'none';
    }

    showProcessing() {
        this.processingOverlay.style.display = 'flex';
        this.updateProgress(0, 100);
    }

    hideProcessing() {
        this.processingOverlay.style.display = 'none';
    }

    updateProgress(current, total) {
        const percent = Math.round((current / total) * 100);
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = `${percent}%`;
    }
}

// Fade out animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-10px);
        }
    }
`;
document.head.appendChild(style);

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new ImageResizer();
});
