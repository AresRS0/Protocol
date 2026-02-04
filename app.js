// PROTOCOL V1 - MAIN LOGIC

// --- 1. DOM ELEMENTLERİ ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const authErrorMsg = document.getElementById('auth-error-msg');
const showRegisterBtn = document.getElementById('show-register');
const logoutBtn = document.getElementById('logout-btn');

const stealthBtn = document.getElementById('stealth-btn');
const calculatorOverlay = document.getElementById('calculator-overlay');
const exitCalcBtn = document.getElementById('exit-calc');

// --- 2. AUTHENTICATION (KİMLİK DOĞRULAMA) ---

// Kullanıcı Durumunu Dinle (Giriş yaptı mı?)
auth.onAuthStateChanged(user => {
    if (user) {
        // Kullanıcı giriş yapmış -> Uygulamayı Aç
        console.log("Kullanıcı aktif:", user.email);
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
    } else {
        // Giriş yapmamış -> Login Ekranını Göster
        console.log("Kullanıcı yok.");
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});

// Giriş Yap / Kayıt Ol Butonu
let isRegisterMode = false;

showRegisterBtn.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    if (isRegisterMode) {
        document.querySelector('.logo h1').innerText = "KAYIT OL";
        loginBtn.innerText = "HESAP OLUŞTUR";
        showRegisterBtn.innerText = "Giriş Yap";
    } else {
        document.querySelector('.logo h1').innerText = "PROTOCOL";
        loginBtn.innerText = "GİRİŞ YAP";
        showRegisterBtn.innerText = "Kayıt Ol";
    }
    authErrorMsg.innerText = "";
});

// Form Gönderildiğinde
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    if (isRegisterMode) {
        // KAYIT OLMA İŞLEMİ
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Kayıt başarılı, otomatik giriş yapar
                console.log("Kayıt başarılı");
            })
            .catch((error) => {
                authErrorMsg.innerText = "Hata: " + error.message;
            });
    } else {
        // GİRİŞ YAPMA İŞLEMİ
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Giriş başarılı
                console.log("Giriş başarılı");
            })
            .catch((error) => {
                authErrorMsg.innerText = "Hata: Bilgiler yanlış.";
            });
    }
});

// Çıkış Yap
logoutBtn.addEventListener('click', () => {
    auth.signOut();
    // Sayfa otomatik yenilenir ve authStateChanged tetiklenir
});

// --- 3. BUKALEMUN MODU (HESAP MAKİNESİ) ---
stealthBtn.addEventListener('click', () => {
    calculatorOverlay.classList.remove('hidden');
});

exitCalcBtn.addEventListener('click', () => {
    calculatorOverlay.classList.add('hidden');
});

// --- 4. BASİT HESAP MAKİNESİ FONKSİYONLARI ---
const calcScreen = document.querySelector('.calc-screen');
const calcButtons = document.querySelectorAll('.calc-buttons button');

calcButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = e.target.innerText;
        if (val === 'C') {
            calcScreen.innerText = '0';
        } else if (val !== 'X') {
            if (calcScreen.innerText === '0') calcScreen.innerText = '';
            calcScreen.innerText += val;
        }
    });
});