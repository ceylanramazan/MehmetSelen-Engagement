// Firebase Configuration
// Bu dosyada Firebase proje bilgilerinizi güncelleyin

const firebaseConfig = {
    apiKey: "AIzaSyAtBTALfxjnkzqn3j_hVa04_2ipea1RXYM",
    authDomain: "mehmetselen-engagement.firebaseapp.com",
    projectId: "mehmetselen-engagement",
    storageBucket: "mehmetselen-engagement.firebasestorage.app",
    messagingSenderId: "597137708672",
    appId: "1:597137708672:web:759f11c0bd207621f3f865",
    measurementId: "G-4KXHRWVDVB"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Firebase servislerini al
const storage = firebase.storage();
const firestore = firebase.firestore();
const auth = firebase.auth();

// Anonymous authentication kullan
auth.signInAnonymously().catch((error) => {
    console.error("Anonymous auth error:", error);
});

// Storage ve Firestore referansları
const storageRef = storage.ref();
const uploadsRef = storageRef.child('engagement-uploads');

// Firestore collection referansı
const uploadsCollection = firestore.collection('uploads');

console.log("Firebase initialized successfully!");

// Export references for use in other files
window.firebaseRefs = {
    storage,
    firestore,
    auth,
    storageRef,
    uploadsRef,
    uploadsCollection
};
