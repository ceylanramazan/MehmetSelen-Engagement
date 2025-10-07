# Sena & Akif - Nişan Anıları Projesi 💕

Bu proje, nişan töreni sırasında çekilen fotoğraf, video ve ses dosyalarının konuklar tarafından paylaşılması için tasarlanmış bir web uygulamasıdır.

## 🎯 Özellikler

- **Mobil Uyumlu Tasarım** - Telefon ve tabletlerde mükemmel çalışır
- **Çoklu Dosya Yükleme** - Fotoğraf, video ve ses dosyaları
- **Drag & Drop Desteği** - Dosyaları sürükleyip bırakabilirsiniz
- **İlerleme Göstergesi** - Yükleme durumunu takip edin
- **Kalite Korunması** - Dosyalar orijinal kalitelerinde saklanır
- **Güvenli Depolama** - Firebase Storage ile güvenli saklama
- **İsteğe Bağlı İsim** - Konuklar isteğe bağlı olarak isim girebilir

## 🚀 Kurulum

### 1. Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com) adresine gidin
2. "Create a project" butonuna tıklayın
3. Proje adı: `MehmetSelen-Engagement`
4. Google Analytics: İsteğe bağlı (önerilen: Europe-west1)
5. Projeyi oluşturun

### 2. Firebase Servislerini Aktifleştirme

#### Authentication
1. Firebase Console → Authentication → Sign-in method
2. "Anonymous" seçeneğini aktifleştirin

#### Storage
1. Firebase Console → Storage → Get started
2. Güvenlik kurallarını başlangıç modunda bırakın
3. Storage location: europe-west1 (Türkiye'ye en yakın)

#### Firestore Database
1. Firebase Console → Firestore Database → Create database
2. "Start in test mode" seçin
3. Location: europe-west1

### 3. Web App Konfigürasyonu

1. Firebase Console → Project Settings → General
2. "Your apps" bölümünde "Web" ikonuna tıklayın
3. App nickname: `Engagement-Web`
4. Firebase Hosting'i şimdilik aktifleştirmeyin
5. "Register app" butonuna tıklayın
6. Firebase config objesi'ni kopyalayın

### 4. Konfigürasyon Dosyasını Güncelleme

`firebase-config.js` dosyasını açın ve Firebase config bilgilerinizi yapıştırın:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### 5. Güvenlik Kurallarını Güncelleme

#### Storage Rules
Firebase Console → Storage → Rules bölümünde aşağıdaki kuralları ekleyin:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /engagement-uploads/{allPaths=**} {
      // Allow uploads up to 100MB
      allow create: if request.resource.size < 100 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*|video/.*|audio/.*');
      // Allow reads
      allow read: if true;
    }
  }
}
```

#### Firestore Rules
Firebase Console → Firestore → Rules bölümünde:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /uploads/{document} {
      allow create: if request.auth != null;
      allow read: if true;
    }
  }
}
```

## 🌐 Hosting

### Yerel Test
1. Dosyaları bir web sunucusunda çalıştırın (Chrome'da `file://` protokolü Firebase ile çalışmaz)
2. Python ile: `python -m http.server 8000`
3. Node.js ile: `npx http-server`

### Firebase Hosting (Önerilen)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 📱 QR Kod Oluşturma

1. Web sitenizin URL'ini alın
2. [QR Code Generator](https://www.qr-code-generator.com/) gibi bir site kullanın
3. URL'i girin ve QR kodu oluşturun
4. QR kodu kartlara bastırın

## 🔧 Dosya Limitleri

- **Fotoğraflar:** Max 10MB (JPEG, PNG, GIF, WebP)
- **Videolar:** Max 100MB (MP4, MOV, AVI, WebM)
- **Ses Dosyaları:** Max 50MB (MP3, WAV, M4A, AAC)

## 💾 Firebase Kotaları

**Ücretsiz Plan Limitleri:**
- Storage: 5GB
- Bandwidth: 1GB/gün
- Firestore Reads: 50,000/gün
- Firestore Writes: 20,000/gün

200-300 kişi için bu limitler fazlasıyla yeterlidir.

## 🎨 Özelleştirme

- `styles.css` dosyasındaki renkleri değiştirebilirsiniz
- `index.html` dosyasındaki "Sena & Akif" kısmını düzenleyebilirsiniz
- İkonları ve tasarım elementlerini özelleştirebilirsiniz

## 🐛 Sorun Giderme

**"Firebase is not defined" hatası:**
- İnternet bağlantınızı kontrol edin
- Firebase CDN linklerinin çalıştığından emin olun

**Dosya yüklenmiyor:**
- Firebase Storage kurallarını kontrol edin
- Dosya boyutlarını kontrol edin
- Tarayıcı konsolunda hata mesajlarını inceleyin

**QR kod çalışmıyor:**
- URL'in doğru olduğundan emin olun
- HTTPS kullandığınızdan emin olun

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Tarayıcı konsolundaki hata mesajlarını kontrol edin
2. Firebase Console'daki kullanım istatistiklerini inceleyin
3. İnternet bağlantınızı test edin

---

**Mutlu nişanlar! 💕**

*Bu proje sevgiyle ve özenle hazırlanmıştır.*

