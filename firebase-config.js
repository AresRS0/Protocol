// PROTOCOL FIREBASE CONFIG
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

console.log("SYSTEM: Secure Connection Established via Firebase.");