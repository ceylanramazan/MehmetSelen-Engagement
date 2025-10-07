// Global variables
let selectedFiles = [];
let isUploading = false;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordingTimer = null;
let recordingStartTime = 0;
let pressTimer = null;
let isLongPress = false;

// DOM elements - defer initialization
let fileInput, selectedFilesContainer, uploadForm, uploadBtn, progressContainer;
let progressBar, progressText, successMessage, uploadMoreBtn, uploaderNameInput, fileUploadBtn;

// Initialize DOM elements after page load
function initializeDOMElements() {
    fileInput = document.getElementById('fileInput');
    selectedFilesContainer = document.getElementById('selectedFiles');
    uploadForm = document.getElementById('uploadForm');
    uploadBtn = document.getElementById('uploadBtn');
    progressContainer = document.getElementById('progressContainer');
    progressBar = document.getElementById('progressBar');
    progressText = document.getElementById('progressText');
    successMessage = document.getElementById('successMessage');
    uploadMoreBtn = document.getElementById('uploadMoreBtn');
    uploaderNameInput = document.getElementById('uploaderName');
    fileUploadBtn = document.querySelector('.file-upload-btn');
    
    // Voice recording elements
    voiceRecordBtn = document.getElementById('voiceRecordBtn');
    voiceRecordText = document.getElementById('voiceRecordText');
    voiceRecordingStatus = document.getElementById('voiceRecordingStatus');
    recordingTimerElement = document.getElementById('recordingTimer');
    stopRecordBtn = document.getElementById('stopRecordBtn');
    
    console.log('DOM elements initialized:', {
        fileInput: !!fileInput,
        fileUploadBtn: !!fileUploadBtn,
        uploadBtn: !!uploadBtn,
        voiceRecordBtn: !!voiceRecordBtn
    });
}

// File type configurations
const FILE_TYPES = {
    image: {
        icon: 'fas fa-image',
        accept: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        maxSize: 10 * 1024 * 1024 // 10MB
    },
    video: {
        icon: 'fas fa-video',
        accept: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
        maxSize: 100 * 1024 * 1024 // 100MB
    },
    audio: {
        icon: 'fas fa-microphone',
        accept: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'],
        maxSize: 50 * 1024 * 1024 // 50MB
    }
};

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileType(mimeType) {
    for (const [type, config] of Object.entries(FILE_TYPES)) {
        if (config.accept.some(acceptType => mimeType.startsWith(acceptType.split('/')[0]))) {
            return type;
        }
    }
    return 'unknown';
}

function getFileIcon(mimeType) {
    const type = getFileType(mimeType);
    return FILE_TYPES[type]?.icon || 'fas fa-file';
}

function validateFile(file) {
    const fileType = getFileType(file.type);
    const config = FILE_TYPES[fileType];
    
    if (!config) {
        return { valid: false, error: 'Desteklenmeyen dosya türü' };
    }
    
    if (!config.accept.includes(file.type)) {
        return { valid: false, error: 'Desteklenmeyen dosya formatı' };
    }
    
    if (file.size > config.maxSize) {
        return { 
            valid: false, 
            error: `Dosya boyutu çok büyük (Max: ${formatFileSize(config.maxSize)})` 
        };
    }
    
    return { valid: true };
}

function generateFileName(originalName, uploaderName) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(/\.[^/.]+$/, "").substring(0, 30);
    
    const prefix = uploaderName ? 
        `${uploaderName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}_` : 
        '';
    
    return `${prefix}${baseName}_${timestamp}_${randomId}.${extension}`;
}

// File selection and display
function handleFileSelection(files) {
    const newFiles = Array.from(files);
    
    newFiles.forEach(file => {
        const validation = validateFile(file);
        
        if (!validation.valid) {
            showToast(validation.error, 'error');
            return;
        }
        
        // Check if file already selected
        const alreadySelected = selectedFiles.some(f => 
            f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
        );
        
        if (alreadySelected) {
            showToast('Bu dosya zaten seçili', 'warning');
            return;
        }
        
        selectedFiles.push(file);
    });
    
    updateSelectedFilesDisplay();
    updateUploadButton();
}

function updateSelectedFilesDisplay() {
    selectedFilesContainer.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="${getFileIcon(file.type)}"></i>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button type="button" class="remove-file" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        selectedFilesContainer.appendChild(fileItem);
    });
    
    // Add remove file event listeners
    document.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            selectedFiles.splice(index, 1);
            updateSelectedFilesDisplay();
            updateUploadButton();
        });
    });
}

function updateUploadButton() {
    if (uploadBtn) {
        uploadBtn.disabled = selectedFiles.length === 0 || isUploading;
    }
}

// Google Drive Upload functionality
async function uploadFiles() {
    if (selectedFiles.length === 0 || isUploading) return;
    
    isUploading = true;
    updateUploadButton();
    
    console.log('Google Drive yükleme işlemi başlıyor...');
    
    // Show progress and hide entire upload section
    if (progressContainer) progressContainer.style.display = 'block';
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) uploadSection.style.display = 'none';
    
    const uploaderName = uploaderNameInput?.value?.trim() || 'Anonim';
    const totalFiles = selectedFiles.length;
    let completedFiles = 0;
    let totalBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    let uploadedBytes = 0;
    
    try {
        // Google Drive API hazır mı kontrol et
        if (!window.googleDriveRefs?.isReady()) {
            throw new Error('Google Drive API henüz hazır değil. Lütfen birkaç saniye bekleyin.');
        }
        
        // Kullanıcı kimlik doğrulaması
        const isAuthenticated = await window.googleDriveRefs.authenticate();
        if (!isAuthenticated) {
            throw new Error('Google hesabına giriş yapılamadı');
        }
        
        if (progressText) progressText.textContent = `Google Drive'a yükleniyor... (0/${totalFiles})`;
        
        // Her dosyayı sırayla yükle
        for (let i = 0; i < totalFiles; i++) {
            const file = selectedFiles[i];
            
            try {
                console.log(`Dosya yükleniyor: ${file.name} (${formatFileSize(file.size)})`);
                
                // Dosyayı Google Drive'a yükle
                await uploadSingleFileToGoogleDrive(file, uploaderName, (progress) => {
                    // Dosya bazında progress callback
                    const fileProgress = (uploadedBytes + (file.size * progress / 100)) / totalBytes * 100;
                    if (progressBar) progressBar.style.width = `${fileProgress}%`;
                    if (progressText) {
                        progressText.textContent = `${file.name} yükleniyor... ${Math.round(progress)}%`;
                    }
                });
                
                uploadedBytes += file.size;
                completedFiles++;
                
                // Genel progress güncelle
                const overallProgress = (completedFiles / totalFiles) * 100;
                if (progressBar) progressBar.style.width = `${overallProgress}%`;
                if (progressText) {
                    progressText.textContent = `Dosyalar yüklendi: ${completedFiles}/${totalFiles}`;
                }
                
                console.log(`Dosya başarıyla yüklendi: ${file.name}`);
                
            } catch (fileError) {
                console.error(`Dosya yükleme hatası (${file.name}):`, fileError);
                showToast(`${file.name} yüklenemedi: ${fileError.message}`, 'warning');
                // Diğer dosyalarla devam et
            }
        }
        
        // Başarı mesajını göster
        if (progressContainer) progressContainer.style.display = 'none';
        if (successMessage) successMessage.style.display = 'block';
        
        // Form'u sıfırla
        selectedFiles = [];
        updateSelectedFilesDisplay();
        if (uploaderNameInput) uploaderNameInput.value = '';
        if (fileInput) fileInput.value = '';
        
        console.log('Tüm dosyalar başarıyla yüklendi!');
        showToast(`${completedFiles} dosya başarıyla Google Drive'a yüklendi!`, 'success');
        
    } catch (error) {
        console.error('Google Drive yükleme hatası:', error);
        showToast(`Yükleme hatası: ${error.message}`, 'error');
        
        // UI'yi sıfırla - upload section'ı tekrar göster
        if (progressContainer) progressContainer.style.display = 'none';
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) uploadSection.style.display = 'block';
    }
    
    isUploading = false;
    updateUploadButton();
}

// Google Drive'a tek dosya yükleme fonksiyonu
async function uploadSingleFileToGoogleDrive(file, uploaderName, progressCallback) {
    const fileName = generateFileName(file.name, uploaderName);
    const folderId = window.googleDriveRefs.getFolderId();
    const gapi = window.googleDriveRefs.gapi();
    
    if (!folderId) {
        throw new Error('Nişan klasörü bulunamadı');
    }
    
    return new Promise((resolve, reject) => {
        // Dosya metadata'sı
        const metadata = {
            name: fileName,
            parents: [folderId],
            description: `${uploaderName} tarafından yüklendi - Selen & Mehmet Nişan Anıları`
        };
        
        // Form data oluştur
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', file);
        
        // XMLHttpRequest ile yükleme (progress tracking için)
        const xhr = new XMLHttpRequest();
        
        // Progress event listener
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const progress = (e.loaded / e.total) * 100;
                if (progressCallback) {
                    progressCallback(progress);
                }
            }
        });
        
        // Load event listener
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    console.log(`Dosya başarıyla yüklendi: ${response.name} (ID: ${response.id})`);
                    resolve(response);
                } catch (parseError) {
                    reject(new Error('Sunucu yanıtı işlenemedi'));
                }
            } else {
                reject(new Error(`Yükleme hatası: ${xhr.status} - ${xhr.statusText}`));
            }
        });
        
        // Error event listener
        xhr.addEventListener('error', () => {
            reject(new Error('Ağ hatası oluştu'));
        });
        
        // Timeout event listener
        xhr.addEventListener('timeout', () => {
            reject(new Error('Yükleme zaman aşımına uğradı'));
        });
        
        // Request ayarları
        xhr.timeout = 300000; // 5 dakika timeout
        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
        
        // Authorization header
        const authInstance = gapi.auth2.getAuthInstance();
        const accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        
        // Yüklemeyi başlat
        xhr.send(form);
    });
}

// Eski Firebase fonksiyonu (artık kullanılmıyor)
async function uploadSingleFile(file, uploaderName) {
    // Bu fonksiyon artık kullanılmıyor - Google Drive kullanıyoruz
    console.warn('uploadSingleFile fonksiyonu artık kullanılmıyor. uploadSingleFileToGoogleDrive kullanın.');
    return null;
}

// UI Helper functions
function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        max-width: 300px;
        transition: all 0.3s ease;
    `;
    
    switch (type) {
        case 'error':
            toast.style.background = '#e74c3c';
            break;
        case 'warning':
            toast.style.background = '#f39c12';
            break;
        case 'success':
            toast.style.background = '#2ecc71';
            break;
        default:
            toast.style.background = '#3498db';
    }
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function resetUploadForm() {
    selectedFiles = [];
    updateSelectedFilesDisplay();
    if (uploaderNameInput) uploaderNameInput.value = '';
    if (fileInput) fileInput.value = '';
    if (successMessage) successMessage.style.display = 'none';
    
    // Show upload section again
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) uploadSection.style.display = 'block';
    
    if (progressContainer) progressContainer.style.display = 'none';
    updateUploadButton();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements first
    initializeDOMElements();
    
    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFileSelection(e.target.files);
        });
    }
    
    // Form submit
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Form submit triggered');
            uploadFiles();
            return false;
        });
    }
    
    // Also add click event to upload button as backup
    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Upload button clicked');
            if (!uploadBtn.disabled) {
                uploadFiles();
            }
            return false;
        });
    }
    
    // Upload more button
    if (uploadMoreBtn) {
        uploadMoreBtn.addEventListener('click', resetUploadForm);
    }
    
    // Voice recording buttons - with long press support
    if (voiceRecordBtn) {
        voiceRecordBtn.addEventListener('mousedown', startLongPress);
        voiceRecordBtn.addEventListener('mouseup', endLongPress);
        voiceRecordBtn.addEventListener('mouseleave', endLongPress);
        voiceRecordBtn.addEventListener('touchstart', startLongPress);
        voiceRecordBtn.addEventListener('touchend', endLongPress);
        voiceRecordBtn.addEventListener('click', handleVoiceClick);
    }
    if (stopRecordBtn) {
        stopRecordBtn.addEventListener('click', stopVoiceRecording);
    }
    
    // Tab switching - initialize after DOM is ready
    setTimeout(() => {
        const tabButtons = document.querySelectorAll('.tab-btn');
        console.log('Tab buttons found:', tabButtons.length);
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = e.currentTarget.dataset.tab;
                console.log('Switching to tab:', targetTab);
                
                // Remove active class from all tabs and contents
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                e.currentTarget.classList.add('active');
                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.add('active');
                    console.log('Tab switched successfully to:', targetTab);
                } else {
                    console.error('Target content not found:', targetTab);
                }
            });
        });
    }, 100);
    
    // Drag and drop support
    if (fileUploadBtn) {
        fileUploadBtn.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadBtn.classList.add('dragover');
        });
        
        fileUploadBtn.addEventListener('dragleave', (e) => {
            e.preventDefault();
            fileUploadBtn.classList.remove('dragover');
        });
        
        fileUploadBtn.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadBtn.classList.remove('dragover');
            handleFileSelection(e.dataTransfer.files);
        });
    }
    
    // Initial button state
    updateUploadButton();
});

// Long Press Functions
function startLongPress(e) {
    e.preventDefault();
    isLongPress = false;
    
    pressTimer = setTimeout(() => {
        isLongPress = true;
        voiceRecordBtn.style.transform = 'scale(0.95)';
        voiceRecordBtn.style.background = 'rgba(231, 76, 60, 0.2)';
        startVoiceRecording();
    }, 500); // 0.5 saniye basılı tutma
}

function endLongPress(e) {
    e.preventDefault();
    clearTimeout(pressTimer);
    
    if (isLongPress && isRecording) {
        stopVoiceRecording();
    }
    
    voiceRecordBtn.style.transform = '';
    voiceRecordBtn.style.background = '';
    isLongPress = false;
}

function handleVoiceClick(e) {
    e.preventDefault();
    // Eğer uzun basma değilse, sadece uyarı göster
    if (!isLongPress && !isRecording) {
        showToast('Ses kaydı için butonu basılı tutun', 'info');
    }
}

// Voice Recording Functions
async function startVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            const file = new File([blob], `voice_message_${Date.now()}.webm`, { type: 'audio/webm' });
            selectedFiles.push(file);
            updateSelectedFilesDisplay();
            updateUploadButton();
            
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        recordingStartTime = Date.now();
        
        // Update UI
        if (voiceRecordBtn) voiceRecordBtn.classList.add('recording');
        if (voiceRecordText) voiceRecordText.textContent = 'Kayıt alınıyor...';
        if (voiceRecordingStatus) voiceRecordingStatus.style.display = 'flex';
        
        // Start timer
        recordingTimer = setInterval(updateRecordingTimer, 1000);
        
    } catch (error) {
        console.error('Mikrofon erişim hatası:', error);
        showToast('Mikrofon erişimi reddedildi', 'error');
    }
}

function stopVoiceRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        // Stop timer
        clearInterval(recordingTimer);
        
        // Reset UI
        if (voiceRecordBtn) voiceRecordBtn.classList.remove('recording');
        if (voiceRecordText) voiceRecordText.textContent = 'Sesli Not Bırakan';
        if (voiceRecordingStatus) voiceRecordingStatus.style.display = 'none';
        if (recordingTimerElement) recordingTimerElement.textContent = '00:00';
        
        showToast('Ses kaydı tamamlandı!', 'success');
    }
}

function updateRecordingTimer() {
    const elapsed = Date.now() - recordingStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    if (recordingTimerElement) {
        recordingTimerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Google Drive API hazır olduğunda çalışacak
document.addEventListener('DOMContentLoaded', () => {
    // Google Drive API'nin yüklenmesini bekle
    const checkGoogleDriveReady = setInterval(() => {
        if (window.googleDriveRefs?.isReady()) {
            console.log('Google Drive API hazır!');
            clearInterval(checkGoogleDriveReady);
            
            // UI'yi güncelle
            const uploadBtn = document.getElementById('uploadBtn');
            if (uploadBtn && uploadBtn.disabled && selectedFiles.length > 0) {
                updateUploadButton();
            }
        }
    }, 1000);
    
    // 30 saniye sonra timeout
    setTimeout(() => {
        clearInterval(checkGoogleDriveReady);
        if (!window.googleDriveRefs?.isReady()) {
            showToast('Google Drive bağlantısı kurulamadı. Sayfayı yenileyin.', 'error');
        }
    }, 30000);
});
