// CHUM Resize - Image Optimizer Pro v2.1
// Features: Multi-platform presets, Clipboard paste, Smart compression, Watermark

class ImageResizer {
    constructor() {
        this.images = [];
        this.maxSize = 2048;
        this.quality = 0.92;
        this.format = 'jpeg';
        this.platform = 'custom';
        this.smartCompress = true;
        this.addWatermark = false;
        this.watermarkPosition = 'bottomRight';
        this.watermarkOpacity = 0.5;

        this.platforms = {
            facebook: { size: 2048, name: 'Facebook' },
            instagram: { size: 1080, name: 'Instagram' },
            twitter: { size: 1500, name: 'Twitter/X' },
            linkedin: { size: 1200, name: 'LinkedIn' },
            zalo: { size: 1280, name: 'Zalo' },
            tiktok: { size: 1080, name: 'TikTok' },
            custom: { size: 2048, name: 'Tùy chỉnh' }
        };

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
        this.pasteClipboardBtn = document.getElementById('pasteClipboardBtn');
        this.customSizeInput = document.getElementById('customSizeInput');
        this.customSizeLabel = document.getElementById('customSizeLabel');
        this.toggleSettings = document.getElementById('toggleSettings');
        this.settingsContent = document.getElementById('settingsContent');
        this.smartCompressCheckbox = document.getElementById('smartCompress');
        this.watermarkCheckbox = document.getElementById('addWatermark');
        this.watermarkOptions = document.getElementById('watermarkOptions');
        this.watermarkPosition = document.getElementById('watermarkPosition');
        this.watermarkOpacitySlider = document.getElementById('watermarkOpacity');
    }

    initEventListeners() {
        // Upload zone
        this.uploadZone.addEventListener('click', () => this.fileInput.click());
        this.uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Clipboard paste - keyboard
        document.addEventListener('paste', (e) => this.handlePaste(e));

        // Clipboard paste - button click
        this.pasteClipboardBtn.addEventListener('click', () => this.pasteFromClipboardButton());

        // Quality slider
        this.qualitySlider.addEventListener('input', (e) => {
            this.quality = e.target.value / 100;
            this.qualityValue.textContent = e.target.value;
        });

        // Custom size input
        this.customSizeInput.addEventListener('change', (e) => {
            const size = parseInt(e.target.value);
            if (size >= 100 && size <= 8192) {
                this.maxSize = size;
                this.customSizeLabel.textContent = size + 'px';
            }
        });

        // Platform presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectPlatform(btn));
        });

        // Format buttons
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.format = btn.dataset.format;
            });
        });

        // Settings toggle
        this.toggleSettings.addEventListener('click', () => {
            this.settingsContent.classList.toggle('collapsed');
            this.toggleSettings.classList.toggle('collapsed');
        });

        // Smart compression
        this.smartCompressCheckbox.addEventListener('change', (e) => {
            this.smartCompress = e.target.checked;
        });

        // Watermark
        this.watermarkCheckbox.addEventListener('change', (e) => {
            this.addWatermark = e.target.checked;
            this.watermarkOptions.style.display = e.target.checked ? 'flex' : 'none';
        });

        this.watermarkOpacitySlider.addEventListener('input', (e) => {
            this.watermarkOpacity = e.target.value / 100;
            document.querySelector('.opacity-value').textContent = e.target.value + '%';
        });

        // Action buttons
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    selectPlatform(btn) {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.platform = btn.dataset.platform;
        this.maxSize = parseInt(btn.dataset.size);

        if (this.platform !== 'custom') {
            this.customSizeInput.value = this.maxSize;
        }
        this.customSizeLabel.textContent = this.maxSize + 'px';
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

        const files = Array.from(e.dataTransfer.files).filter(f =>
            f.type.startsWith('image/') ||
            f.name.toLowerCase().match(/\.(heic|heif|bmp|tiff?|svg)$/)
        );
        if (files.length > 0) this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) this.processFiles(files);
        this.fileInput.value = '';
    }

    handlePaste(e) {
        console.log('Paste event triggered');

        // Get clipboard data
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) {
            console.log('No clipboard data');
            return;
        }

        const items = clipboardData.items || clipboardData.files;
        if (!items || items.length === 0) {
            console.log('No items in clipboard');
            return;
        }

        const imageFiles = [];

        // Check items
        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // DataTransferItem
            if (item.kind === 'file' || item.type?.startsWith('image/')) {
                const file = item.getAsFile ? item.getAsFile() : item;
                if (file && file.type?.startsWith('image/')) {
                    imageFiles.push(file);
                }
            }
        }

        // Also check files directly (for some browsers)
        if (clipboardData.files && clipboardData.files.length > 0) {
            for (let i = 0; i < clipboardData.files.length; i++) {
                const file = clipboardData.files[i];
                if (file.type?.startsWith('image/') && !imageFiles.includes(file)) {
                    imageFiles.push(file);
                }
            }
        }

        console.log('Found images:', imageFiles.length);

        if (imageFiles.length > 0) {
            e.preventDefault();
            this.showToast('✓ Đã dán ' + imageFiles.length + ' ảnh từ clipboard!', 'success');
            this.processFiles(imageFiles);
        }
    }

    // Paste from clipboard using button click (uses Clipboard API)
    async pasteFromClipboardButton() {
        try {
            // Check if Clipboard API is available
            if (!navigator.clipboard || !navigator.clipboard.read) {
                this.showToast('Trình duyệt không hỗ trợ. Hãy dùng Ctrl+V', 'error');
                return;
            }

            const clipboardItems = await navigator.clipboard.read();
            const imageFiles = [];

            for (const item of clipboardItems) {
                // Find image type in the clipboard item
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    const file = new File([blob], 'clipboard_image.png', { type: imageType });
                    imageFiles.push(file);
                }
            }

            if (imageFiles.length > 0) {
                this.showToast('✓ Đã dán ' + imageFiles.length + ' ảnh từ clipboard!', 'success');
                this.processFiles(imageFiles);
            } else {
                this.showToast('Không tìm thấy ảnh trong clipboard', 'error');
            }
        } catch (error) {
            console.error('Clipboard error:', error);
            if (error.name === 'NotAllowedError') {
                this.showToast('Vui lòng cho phép truy cập clipboard hoặc dùng Ctrl+V', 'error');
            } else {
                this.showToast('Lỗi đọc clipboard. Hãy thử Ctrl+V', 'error');
            }
        }
    }

    async fetchFromUrl() {
        const url = this.urlInput.value.trim();
        if (!url) {
            this.showToast('Vui lòng nhập URL ảnh', 'error');
            return;
        }

        try {
            this.showProcessing();
            this.updateProcessingText('Đang tải ảnh từ URL...');

            const response = await fetch(url);
            if (!response.ok) throw new Error('Không thể tải ảnh');

            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) {
                throw new Error('URL không phải là ảnh');
            }

            const fileName = url.split('/').pop().split('?')[0] || 'image_from_url.jpg';
            const file = new File([blob], fileName, { type: blob.type });

            await this.processFiles([file]);
            this.urlInput.value = '';
            this.showToast('Đã tải ảnh từ URL thành công', 'success');
        } catch (error) {
            this.hideProcessing();
            this.showToast('Lỗi: ' + error.message, 'error');
        }
    }

    isHeicFile(file) {
        const name = file.name.toLowerCase();
        return name.endsWith('.heic') || name.endsWith('.heif') ||
            file.type === 'image/heic' || file.type === 'image/heif';
    }

    async convertHeicToBlob(file) {
        if (typeof heic2any === 'undefined') {
            throw new Error('HEIC converter not loaded');
        }
        const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
        return Array.isArray(blob) ? blob[0] : blob;
    }

    updateProcessingText(text) {
        const el = document.querySelector('.processing-text');
        if (el) el.textContent = text;
    }

    async processFiles(files) {
        this.showProcessing();
        const total = files.length;
        let processed = 0;

        for (const file of files) {
            try {
                let processableFile = file;
                const originalFileName = file.name;

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
                console.error('Error:', error);
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

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);

                    // Add watermark if enabled
                    if (this.addWatermark) {
                        this.drawWatermark(ctx, newWidth, newHeight);
                    }

                    const mimeType = this.format === 'jpeg' ? 'image/jpeg' :
                        this.format === 'png' ? 'image/png' : 'image/webp';

                    // Smart compression
                    let quality = this.quality;
                    if (this.smartCompress && this.format === 'jpeg') {
                        const pixels = newWidth * newHeight;
                        if (pixels > 4000000) quality = Math.min(quality, 0.85);
                    }

                    canvas.toBlob((blob) => {
                        resolve({
                            id: Date.now() + Math.random(),
                            name: this.getNewFileName(fileName),
                            originalName: fileName,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            newWidth, newHeight,
                            originalSize: this.formatFileSize(file.size),
                            newSize: this.formatFileSize(blob.size),
                            blob, url: URL.createObjectURL(blob),
                            format: this.format
                        });
                    }, mimeType, quality);
                };

                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    drawWatermark(ctx, width, height) {
        const text = '© CHUM Resize';
        const fontSize = Math.max(12, Math.min(width, height) * 0.025);

        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.watermarkOpacity})`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${this.watermarkOpacity * 0.5})`;
        ctx.lineWidth = 1;

        const metrics = ctx.measureText(text);
        const padding = fontSize * 0.8;
        let x, y;

        const pos = document.getElementById('watermarkPosition')?.value || 'bottomRight';

        switch (pos) {
            case 'topLeft': x = padding; y = padding + fontSize; break;
            case 'topRight': x = width - metrics.width - padding; y = padding + fontSize; break;
            case 'bottomLeft': x = padding; y = height - padding; break;
            case 'bottomRight': x = width - metrics.width - padding; y = height - padding; break;
            case 'center': x = (width - metrics.width) / 2; y = height / 2; break;
            default: x = width - metrics.width - padding; y = height - padding;
        }

        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
    }

    calculateDimensions(width, height) {
        if (width <= this.maxSize && height <= this.maxSize) return { width, height };
        const ratio = width / height;
        if (width > height) {
            return { width: this.maxSize, height: Math.round(this.maxSize / ratio) };
        }
        return { width: Math.round(this.maxSize * ratio), height: this.maxSize };
    }

    getNewFileName(originalName) {
        const lastDot = originalName.lastIndexOf('.');
        const baseName = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
        const ext = this.format === 'jpeg' ? 'jpg' : this.format;
        const platformSuffix = this.platform !== 'custom' ? `_${this.platform}` : '';
        return `${baseName}${platformSuffix}_${this.maxSize}px.${ext}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    addImageCard(image) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.id = image.id;

        card.innerHTML = `
            <div class="image-preview"><img src="${image.url}" alt="${image.name}"></div>
            <div class="image-info">
                <div class="image-name" title="${image.name}">${image.name}</div>
                <div class="image-stats">
                    <div class="stat-item"><span class="stat-label">Gốc</span><span class="stat-value">${image.originalWidth}×${image.originalHeight}</span></div>
                    <div class="stat-item"><span class="stat-label">Mới</span><span class="stat-value success">${image.newWidth}×${image.newHeight}</span></div>
                    <div class="stat-item"><span class="stat-label">Size</span><span class="stat-value">${image.newSize}</span></div>
                </div>
                <div class="image-actions">
                    <button class="btn-icon download-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Tải</button>
                    <button class="btn-icon danger remove-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Xóa</button>
                </div>
            </div>`;

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
            card.style.opacity = '0';
            card.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                card.remove();
                this.updatePreviewArea();
            }, 200);
        }
    }

    downloadAll() {
        if (this.images.length === 0) return;
        this.images.forEach((image, i) => setTimeout(() => this.downloadImage(image), i * 150));
        this.showToast(`Đang tải ${this.images.length} ảnh...`, 'success');
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

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => new ImageResizer());
