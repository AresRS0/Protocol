// firebase-config.js
// PROTOCOL - Veritabanı Bağlantı Ayarları

// Firebase kütüphanelerini çekiyoruz
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Senin Proje Bilgilerin
const firebaseConfig = {
  apiKey: "AIzaSyAQxv2-4XG4K0kVm5ITFcbDkpxqts4yAz4",
  authDomain: "protocol-e7e7c.firebaseapp.com",
  projectId: "protocol-e7e7c",
  storageBucket: "protocol-e7e7c.firebasestorage.app",
  messagingSenderId: "594400924109",
  appId: "1:594400924109:web:23ae7037855c7fcd2eb484",
  measurementId: "G-Y8BRBYLQJM"
};

// Firebase'i Başlat
const app = initializeApp(firebaseConfig);

// Yetkilendirme (Giriş/Çıkış) servisini başlat
const auth = getAuth(app);

// Veritabanı servisini başlat
const db = getDatabase(app);

// Bu servisleri diğer dosyalarda kullanmak için dışa aktar
export { auth, db };