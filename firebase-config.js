// Google Drive API Configuration
// Bu dosyada Google Drive API bilgilerinizi güncelleyin

const googleDriveConfig = {
    // Google Cloud Console'dan alacağınız bilgiler
    apiKey: "AIzaSyAcjyauDzBg7V7HDAl5xiLnO-06oiwgLqs", // Google Cloud Console > Credentials > API Keys
    clientId: "21230947997-ju6sg4c8evpgp041tdf8cb5bdkf9233f.apps.googleusercontent.com", // Google Cloud Console > Credentials > OAuth 2.0
    discoveryDoc: "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    scopes: "https://www.googleapis.com/auth/drive.file",
    
    // Nişan fotoğrafları için klasör ayarları
    folderName: "Selen & Mehmet - Nişan Anıları",
    folderDescription: "Nişan törenimizde çekilen fotoğraf ve videolar"
};

// Google Drive API durumu
let gapi = null;
let isGoogleDriveReady = false;
let engagementFolderId = null;

// Google Drive API'yi yükle ve başlat
async function initializeGoogleDrive() {
    try {
        console.log("Google Drive API yükleniyor...");
        
        // GAPI kütüphanesini yükle
        await loadGoogleAPI();
        
        // API'yi başlat
        await gapi.load('client:auth2', async () => {
            await gapi.client.init({
                apiKey: googleDriveConfig.apiKey,
                clientId: googleDriveConfig.clientId,
                discoveryDocs: [googleDriveConfig.discoveryDoc],
                scope: googleDriveConfig.scopes
            });
            
            console.log("Google Drive API başlatıldı!");
            isGoogleDriveReady = true;
            
            // Nişan klasörünü oluştur veya bul
            await createOrFindEngagementFolder();
        });
        
    } catch (error) {
        console.error("Google Drive API başlatma hatası:", error);
        showToast("Google Drive bağlantısında sorun oluştu", "error");
    }
}

// Google API script'ini dinamik olarak yükle
function loadGoogleAPI() {
    return new Promise((resolve, reject) => {
        if (window.gapi) {
            gapi = window.gapi;
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            gapi = window.gapi;
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Nişan klasörünü oluştur veya bul
async function createOrFindEngagementFolder() {
    try {
        // Önce klasörün var olup olmadığını kontrol et
        const response = await gapi.client.drive.files.list({
            q: `name='${googleDriveConfig.folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            spaces: 'drive'
        });
        
        if (response.result.files.length > 0) {
            // Klasör zaten var
            engagementFolderId = response.result.files[0].id;
            console.log("Nişan klasörü bulundu:", engagementFolderId);
        } else {
            // Klasörü oluştur
            const folderResponse = await gapi.client.drive.files.create({
                resource: {
                    name: googleDriveConfig.folderName,
                    description: googleDriveConfig.folderDescription,
                    mimeType: 'application/vnd.google-apps.folder'
                }
            });
            
            engagementFolderId = folderResponse.result.id;
            console.log("Nişan klasörü oluşturuldu:", engagementFolderId);
            
            // Klasörü herkese açık yap (görüntüleme izni)
            await gapi.client.drive.permissions.create({
                fileId: engagementFolderId,
                resource: {
                    role: 'reader',
                    type: 'anyone'
                }
            });
        }
        
    } catch (error) {
        console.error("Klasör oluşturma/bulma hatası:", error);
        throw error;
    }
}

// Kullanıcı kimlik doğrulaması
async function authenticateUser() {
    try {
        const authInstance = gapi.auth2.getAuthInstance();
        
        if (!authInstance.isSignedIn.get()) {
            console.log("Kullanıcı girişi yapılıyor...");
            await authInstance.signIn();
        }
        
        console.log("Kullanıcı kimlik doğrulaması tamamlandı");
        return true;
        
    } catch (error) {
        console.error("Kimlik doğrulama hatası:", error);
        showToast("Google hesabına giriş yapılamadı", "error");
        return false;
    }
}

console.log("Google Drive configuration loaded!");

// Export references for use in other files
window.googleDriveRefs = {
    config: googleDriveConfig,
    isReady: () => isGoogleDriveReady,
    getFolderId: () => engagementFolderId,
    authenticate: authenticateUser,
    gapi: () => gapi
};

// Sayfa yüklendiğinde Google Drive API'yi başlat
document.addEventListener('DOMContentLoaded', () => {
    // Biraz gecikme ile başlat (diğer scriptlerin yüklenmesi için)
    setTimeout(initializeGoogleDrive, 1000);
});
