// --- CLOUDINARY AYARLARI ---
const CLOUD_NAME = "ddxf1fhcy";
const UPLOAD_PRESET = "go1ovdi2";

// --- DOM ELEMENTLERİ ---
const screens = {
    auth: document.getElementById('auth-container'),
    verify: document.getElementById('verify-email-screen'),
    profile: document.getElementById('profile-setup-screen'),
    app: document.getElementById('app-container')
};

// Login Form
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const showRegisterBtn = document.getElementById('show-register');
const loginBtn = document.getElementById('login-btn');
const authErrorMsg = document.getElementById('auth-error-msg');

// Verify Screen
const checkVerifyBtn = document.getElementById('check-verify-btn');
const resendVerifyBtn = document.getElementById('resend-verify-btn');

// Profile Setup
const setupAvatarBtn = document.getElementById('setup-avatar-btn');
const setupUsername = document.getElementById('setup-username');
const saveProfileBtn = document.getElementById('save-profile-btn');
let tempAvatarUrl = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; // Default

// App Elements
const messagesFeed = document.getElementById('messages-feed');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');

// Settings
const settingsModal = document.getElementById('settings-modal');
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeSettingsBtn = document.querySelector('.close-modal');
const colorDots = document.querySelectorAll('.color-dot');
const logoutBtnSettings = document.getElementById('logout-btn-settings');

// Durum Değişkenleri
let currentUserData = null; // Veritabanındaki kullanıcı verisi
let currentRoomID = 'Genel'; // Başlangıç odası
let isRegister = false;

// ---------------------------------------------
// 1. KİMLİK DOĞRULAMA AKIŞI (AUTH FLOW)
// ---------------------------------------------

auth.onAuthStateChanged(async (user) => {
    hideAllScreens();

    if (user) {
        // Kullanıcı var, peki maili onaylı mı?
        if (!user.emailVerified) {
            screens.verify.classList.remove('hidden');
            return; // Dur, ileri gitme
        }

        // Mail onaylı, şimdi profil verisini veritabanından çekelim
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (userDoc.exists) {
            // Profil var -> Uygulamayı Yükle
            currentUserData = userDoc.data();
            loadApp(currentUserData);
        } else {
            // Profil yok -> Profil Kurulum Sihirbazını Aç
            screens.profile.classList.remove('hidden');
        }

    } else {
        // Kullanıcı yok -> Giriş Ekranı
        screens.auth.classList.remove('hidden');
    }
});

// Ekranları Yönetme Yardımcısı
function hideAllScreens() {
    Object.values(screens).forEach(el => el.classList.add('hidden'));
}

// Giriş / Kayıt Butonu
showRegisterBtn.addEventListener('click', () => {
    isRegister = !isRegister;
    document.querySelector('.logo h1').innerText = isRegister ? "KAYIT OL" : "PROTOCOL";
    loginBtn.innerText = isRegister ? "HESAP OLUŞTUR" : "GİRİŞ YAP";
    showRegisterBtn.innerText = isRegister ? "Giriş Yap" : "Kayıt Ol";
    authErrorMsg.innerText = "";
});

// Form Submit
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    authErrorMsg.innerText = "İşlem yapılıyor...";

    if (isRegister) {
        // KAYIT
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Doğrulama Maili Gönder
                userCredential.user.sendEmailVerification();
                alert("Kayıt başarılı! Lütfen mail kutunuza giden linke tıklayın.");
                authErrorMsg.innerText = "Lütfen e-postanızı doğrulayın.";
            })
            .catch(err => authErrorMsg.innerText = err.message);
    } else {
        // GİRİŞ
        auth.signInWithEmailAndPassword(email, password)
            .catch(err => authErrorMsg.innerText = "Giriş başarısız. Bilgileri kontrol et.");
    }
});

// Doğrulama Kontrolleri
checkVerifyBtn.addEventListener('click', () => {
    window.location.reload(); // Sayfayı yenile ki authState tekrar tetiklensin
});

resendVerifyBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if(user) user.sendEmailVerification().then(() => alert("Mail tekrar gönderildi."));
});

// ---------------------------------------------
// 2. PROFİL KURULUMU (WIZARD)
// ---------------------------------------------

// Profil Fotosu Seçme (Cloudinary)
setupAvatarBtn.addEventListener('click', () => fileInput.click());

// Dosya input değişince (Hem sohbet hem profil için kullanıyoruz)
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Eğer Profil Ekranı açıksa -> Profil Fotosu Yükle
    if (!screens.profile.classList.contains('hidden')) {
        uploadFile(file, (url) => {
            tempAvatarUrl = url;
            document.getElementById('setup-avatar-preview').src = url;
        });
    } else {
        // Uygulama açıksa -> Sohbet Dosyası Gönder
        attachBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        uploadFile(file, (url, type, name) => {
            sendMessage(url, type, name);
            attachBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        });
    }
    fileInput.value = ''; // Reset
});

// Cloudinary Yükleme Fonksiyonu
async function uploadFile(file, callback) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.secure_url) {
            callback(data.secure_url, data.resource_type, file.name);
        }
    } catch (err) {
        console.error(err);
        alert("Yükleme hatası.");
    }
}

// Profili Kaydetme
saveProfileBtn.addEventListener('click', async () => {
    const username = setupUsername.value.trim();
    if (!username) return alert("Kullanıcı adı gerekli.");

    const user = auth.currentUser;
    const newData = {
        uid: user.uid,
        email: user.email,
        username: username,
        avatar: tempAvatarUrl,
        theme: '#00cec9', // Varsayılan renk
        currentRoom: 'Genel',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Firestore'a kaydet
    await db.collection('users').doc(user.uid).set(newData);
    
    // Uygulamayı başlat
    currentUserData = newData;
    loadApp(currentUserData);
});

// ---------------------------------------------
// 3. UYGULAMA YÖNETİMİ VE PERSISTENCE
// ---------------------------------------------

function loadApp(userData) {
    screens.profile.classList.add('hidden');
    screens.app.classList.remove('hidden');
    
    // Verileri Yerleştir
    document.getElementById('nav-avatar').src = userData.avatar;
    document.getElementById('settings-email').innerText = userData.email;
    
    // Temayı Yükle
    applyTheme(userData.theme);

    // Son Odayı Yükle
    changeRoom(userData.currentRoom || 'Genel');
}

function applyTheme(color) {
    document.documentElement.style.setProperty('--accent', color);
    // Veritabanına da kaydet (Eğer userData varsa)
    if (currentUserData && currentUserData.theme !== color) {
        db.collection('users').doc(currentUserData.uid).update({ theme: color });
        currentUserData.theme = color;
    }
}

// Oda Değiştirme
function changeRoom(roomId) {
    currentRoomID = roomId;
    document.getElementById('current-room-name').innerText = roomId;
    document.getElementById('header-room-name').innerText = roomId;
    
    // UI Güncelle
    document.querySelectorAll('.server-icon').forEach(el => el.classList.remove('active'));
    // Varsayılan oda ikonu bul ve aktif yap (Şimdilik basit)
    
    // Mesajları Dinle
    loadMessages(roomId);

    // Persistence: Son odayı kaydet
    if(currentUserData) {
        db.collection('users').doc(currentUserData.uid).update({ currentRoom: roomId });
    }
}

// ---------------------------------------------
// 4. MESAJLAŞMA (GÜNCELLENMİŞ)
// ---------------------------------------------

function sendMessage(content, type, fileName) {
    if (!auth.currentUser) return;
    
    db.collection('messages').add({
        text: content, // Eski kod uyumluluğu için
        content: content,
        type: type || 'text',
        fileName: fileName || null,
        sender: currentUserData.username, // Artık isim var
        avatar: currentUserData.avatar,   // Artık avatar var
        uid: auth.currentUser.uid,
        roomId: currentRoomID, // Hangi odaya attık?
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

sendBtn.addEventListener('click', () => {
    const text = msgInput.value.trim();
    if(text) {
        sendMessage(text, 'text');
        msgInput.value = '';
    }
});
msgInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendBtn.click(); });
attachBtn.addEventListener('click', () => { if(screens.app.classList.contains('hidden')) return; fileInput.click(); });

// Mesajları Getir (Odaya Göre)
let unsubscribe = null; // Eski dinleyiciyi kapatmak için

function loadMessages(roomId) {
    if (unsubscribe) unsubscribe(); // Önceki odayı dinlemeyi bırak

    unsubscribe = db.collection('messages')
        .where('roomId', '==', roomId)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            messagesFeed.innerHTML = '';
            snapshot.forEach(doc => {
                const msg = doc.data();
                const isMe = msg.uid === auth.currentUser.uid;
                
                const div = document.createElement('div');
                div.classList.add('message', isMe ? 'sent' : 'received');

                // İçerik Tipi
                let contentHTML = '';
                if(msg.type === 'text') contentHTML = `<p>${msg.content}</p>`;
                else if(msg.type === 'image') contentHTML = `<img src="${msg.content}" style="max-width:100%; border-radius:10px;">`;
                else contentHTML = `<a href="${msg.content}" target="_blank" style="color:white;"><i class="fa-solid fa-file"></i> ${msg.fileName || 'Dosya'}</a>`;

                div.innerHTML = `
                    <div style="font-size:10px; color:#aaa; margin-bottom:2px;">${msg.sender || 'Anonim'}</div>
                    ${contentHTML}
                `;
                messagesFeed.appendChild(div);
            });
            messagesFeed.scrollTop = messagesFeed.scrollHeight;
        });
}


// ---------------------------------------------
// 5. AYARLAR VE HESAP MAKİNESİ
// ---------------------------------------------

// Ayarlar Modalını Aç/Kapa
openSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

// Renk Seçimi
colorDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        applyTheme(color);
    });
});

// Çıkış
logoutBtnSettings.addEventListener('click', () => {
    auth.signOut();
    window.location.reload();
});

// Hesap Makinesi (Aynı Kod)
const calculatorOverlay = document.getElementById('calculator-overlay');
const stealthBtn = document.getElementById('stealth-btn');
const exitCalcBtn = document.getElementById('exit-calc');
const calcButtonsContainer = document.querySelector('.calc-buttons');

// iPhone Tuşları
calcButtonsContainer.innerHTML = `
    <button class="calc-btn btn-gray" onclick="calcAction('AC')">AC</button>
    <button class="calc-btn btn-gray" onclick="calcAction('+/-')">+/-</button>
    <button class="calc-btn btn-gray" onclick="calcAction('%')">%</button>
    <button class="calc-btn btn-orange" onclick="calcAction('/')">÷</button>
    <button class="calc-btn btn-dark" onclick="calcAction('7')">7</button>
    <button class="calc-btn btn-dark" onclick="calcAction('8')">8</button>
    <button class="calc-btn btn-dark" onclick="calcAction('9')">9</button>
    <button class="calc-btn btn-orange" onclick="calcAction('*')">×</button>
    <button class="calc-btn btn-dark" onclick="calcAction('4')">4</button>
    <button class="calc-btn btn-dark" onclick="calcAction('5')">5</button>
    <button class="calc-btn btn-dark" onclick="calcAction('6')">6</button>
    <button class="calc-btn btn-orange" onclick="calcAction('-')">-</button>
    <button class="calc-btn btn-dark" onclick="calcAction('1')">1</button>
    <button class="calc-btn btn-dark" onclick="calcAction('2')">2</button>
    <button class="calc-btn btn-dark" onclick="calcAction('3')">3</button>
    <button class="calc-btn btn-orange" onclick="calcAction('+')">+</button>
    <button class="calc-btn btn-dark btn-zero" onclick="calcAction('0')">0</button>
    <button class="calc-btn btn-dark" onclick="calcAction('.')">,</button>
    <button class="calc-btn btn-orange" onclick="calcAction('=')">=</button>
`;
let currentInput = '0';
const screenDiv = document.querySelector('.calc-screen');
window.calcAction = function(val) {
    if (val === 'AC') { currentInput = '0'; }
    else if (val === '=') { try { currentInput = eval(currentInput).toString(); } catch { currentInput = 'Error'; } }
    else if (val === '+/-') { currentInput = (parseFloat(currentInput) * -1).toString(); }
    else if (val === '%') { currentInput = (parseFloat(currentInput) / 100).toString(); }
    else { if (currentInput === '0') currentInput = ''; currentInput += val; }
    screenDiv.innerText = currentInput;
}
stealthBtn.addEventListener('click', () => { calculatorOverlay.classList.remove('hidden'); });
exitCalcBtn.addEventListener('click', () => { calculatorOverlay.classList.add('hidden'); });