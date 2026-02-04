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

// Login Elements
const loginForm = document.getElementById('login-form');
const googleBtn = document.getElementById('google-btn');
const showRegisterBtn = document.getElementById('show-register');
const loginBtn = document.getElementById('login-btn');
const authErrorMsg = document.getElementById('auth-error-msg');

// Verify Elements
const checkVerifyBtn = document.getElementById('check-verify-btn');
const resendVerifyBtn = document.getElementById('resend-verify-btn');
const verifyStatus = document.getElementById('verify-status');

// Profile & App Elements
const setupAvatarBtn = document.getElementById('setup-avatar-btn');
const setupUsername = document.getElementById('setup-username');
const saveProfileBtn = document.getElementById('save-profile-btn');
let tempAvatarUrl = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const messagesFeed = document.getElementById('messages-feed');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const settingsModal = document.getElementById('settings-modal');

// Durum Değişkenleri
let currentUserData = null;
let currentRoomID = 'Genel';
let isRegister = false;

// ---------------------------------------------
// 1. GÜVENLİK VE GİRİŞ KONTROLÜ
// ---------------------------------------------

auth.onAuthStateChanged(async (user) => {
    hideAllScreens();

    if (user) {
        // GOOGLE KULLANICILARI OTOMATİK ONAYLIDIR
        // E-posta ile girenler için sunucudan son durumu çek (RELOAD)
        await user.reload(); 
        
        if (!user.emailVerified) {
            // HATA: Doğrulanmamış!
            screens.verify.classList.remove('hidden');
            return;
        }

        // Doğrulanmış -> Profil Var mı Bak
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (userDoc.exists) {
            // Var -> Uygulamaya Gir
            currentUserData = userDoc.data();
            loadApp(currentUserData);
        } else {
            // Yok -> Profil Oluştur
            // Eğer Google ile girdiyse ismini ve resmini otomatik alabiliriz
            if (user.displayName) setupUsername.value = user.displayName;
            if (user.photoURL) {
                tempAvatarUrl = user.photoURL;
                document.getElementById('setup-avatar-preview').src = user.photoURL;
            }
            screens.profile.classList.remove('hidden');
        }

    } else {
        screens.auth.classList.remove('hidden');
    }
});

function hideAllScreens() { Object.values(screens).forEach(el => el.classList.add('hidden')); }

// ---------------------------------------------
// 2. GİRİŞ YÖNTEMLERİ
// ---------------------------------------------

// A) E-POSTA GİRİŞ / KAYIT
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    authErrorMsg.innerText = "İşlem yapılıyor...";

    if (isRegister) {
        auth.createUserWithEmailAndPassword(email, password)
            .then((res) => {
                res.user.sendEmailVerification();
                authErrorMsg.innerText = "Doğrulama maili gönderildi!";
            })
            .catch(err => authErrorMsg.innerText = err.message);
    } else {
        auth.signInWithEmailAndPassword(email, password)
            .catch(err => authErrorMsg.innerText = "Hatalı şifre veya kullanıcı yok.");
    }
});

// B) GOOGLE GİRİŞİ (YENİ)
googleBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Google Girişi Başarılı:", result.user.email);
            // onAuthStateChanged otomatik yakalayacak
        })
        .catch((error) => {
            console.error(error);
            authErrorMsg.innerText = "Google hatası: " + error.message;
        });
});

// Kayıt Ol / Giriş Yap Geçişi
showRegisterBtn.addEventListener('click', () => {
    isRegister = !isRegister;
    document.querySelector('.logo h1').innerText = isRegister ? "KAYIT OL" : "PROTOCOL";
    loginBtn.innerText = isRegister ? "HESAP OLUŞTUR" : "GİRİŞ YAP";
    showRegisterBtn.innerText = isRegister ? "Giriş Yap" : "Kayıt Ol";
    authErrorMsg.innerText = "";
});

// ---------------------------------------------
// 3. DOĞRULAMA KONTROLÜ (SIKI GÜVENLİK)
// ---------------------------------------------

checkVerifyBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    verifyStatus.innerText = "Sunucu sorgulanıyor...";
    
    // ZORLA YENİLEME (Server-side check)
    await user.reload();

    if (user.emailVerified) {
        verifyStatus.innerText = "Onaylandı! Giriş yapılıyor...";
        // Sayfayı yenile ki akış baştan başlasın
        setTimeout(() => window.location.reload(), 1000);
    } else {
        verifyStatus.innerText = "HATA: Mail hala onaylanmamış. Lütfen Spam klasörüne bak.";
    }
});

resendVerifyBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if(user) user.sendEmailVerification().then(() => alert("Mail tekrar gönderildi."));
});

// ---------------------------------------------
// 4. PROFİL VE DOSYA YÜKLEME
// ---------------------------------------------

setupAvatarBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!screens.profile.classList.contains('hidden')) {
        // Profil Fotosu Yükleme
        uploadFile(file, (url) => {
            tempAvatarUrl = url;
            document.getElementById('setup-avatar-preview').src = url;
        });
    } else {
        // Sohbet Dosyası
        attachBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        uploadFile(file, (url, type, name) => {
            sendMessage(url, type, name);
            attachBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        });
    }
    fileInput.value = '';
});

async function uploadFile(file, callback) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.secure_url) callback(data.secure_url, data.resource_type, file.name);
    } catch (err) { alert("Yükleme başarısız."); }
}

saveProfileBtn.addEventListener('click', async () => {
    const username = setupUsername.value.trim();
    if (!username) return alert("İsim şart.");
    const user = auth.currentUser;
    
    const newData = {
        uid: user.uid,
        email: user.email,
        username: username,
        avatar: tempAvatarUrl,
        theme: '#00cec9',
        currentRoom: 'Genel',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(user.uid).set(newData);
    currentUserData = newData;
    loadApp(currentUserData);
});

// ---------------------------------------------
// 5. UYGULAMA İÇİ MANTIK
// ---------------------------------------------

function loadApp(userData) {
    screens.profile.classList.add('hidden');
    screens.app.classList.remove('hidden');
    document.getElementById('nav-avatar').src = userData.avatar;
    document.getElementById('settings-email').innerText = userData.email;
    applyTheme(userData.theme);
    changeRoom(userData.currentRoom || 'Genel');
}

function applyTheme(color) {
    document.documentElement.style.setProperty('--accent', color);
    if (currentUserData && currentUserData.theme !== color) {
        db.collection('users').doc(currentUserData.uid).update({ theme: color });
        currentUserData.theme = color;
    }
}

function changeRoom(roomId) {
    currentRoomID = roomId;
    document.getElementById('current-room-name').innerText = roomId;
    document.getElementById('header-room-name').innerText = roomId;
    loadMessages(roomId);
    if(currentUserData) db.collection('users').doc(currentUserData.uid).update({ currentRoom: roomId });
}

function sendMessage(content, type, fileName) {
    if (!auth.currentUser) return;
    db.collection('messages').add({
        content: content,
        type: type || 'text',
        fileName: fileName || null,
        sender: currentUserData.username,
        avatar: currentUserData.avatar,
        uid: auth.currentUser.uid,
        roomId: currentRoomID,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

sendBtn.addEventListener('click', () => {
    const text = msgInput.value.trim();
    if(text) { sendMessage(text, 'text'); msgInput.value = ''; }
});
msgInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendBtn.click(); });
attachBtn.addEventListener('click', () => { if(screens.app.classList.contains('hidden')) return; fileInput.click(); });

let unsubscribe = null;
function loadMessages(roomId) {
    if (unsubscribe) unsubscribe();
    unsubscribe = db.collection('messages').where('roomId', '==', roomId).orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            messagesFeed.innerHTML = '';
            snapshot.forEach(doc => {
                const msg = doc.data();
                const isMe = msg.uid === auth.currentUser.uid;
                const div = document.createElement('div');
                div.classList.add('message', isMe ? 'sent' : 'received');
                
                let contentHTML = '';
                if(msg.type === 'text') contentHTML = `<p>${msg.content}</p>`;
                else if(msg.type === 'image') contentHTML = `<img src="${msg.content}" style="max-width:100%; border-radius:10px;">`;
                else contentHTML = `<a href="${msg.content}" target="_blank" style="color:white;"><i class="fa-solid fa-file"></i> ${msg.fileName || 'Dosya'}</a>`;
                
                div.innerHTML = `<div style="font-size:10px; color:#aaa; margin-bottom:2px;">${msg.sender}</div>${contentHTML}`;
                messagesFeed.appendChild(div);
            });
            messagesFeed.scrollTop = messagesFeed.scrollHeight;
        });
}

// Ayarlar
document.getElementById('open-settings-btn').addEventListener('click', () => settingsModal.classList.remove('hidden'));
document.querySelector('.close-modal').addEventListener('click', () => settingsModal.classList.add('hidden'));
document.querySelectorAll('.color-dot').forEach(dot => dot.addEventListener('click', (e) => applyTheme(e.target.dataset.color)));
document.getElementById('logout-btn-settings').addEventListener('click', () => { auth.signOut(); window.location.reload(); });

// Hesap Makinesi
const calculatorOverlay = document.getElementById('calculator-overlay');
const stealthBtn = document.getElementById('stealth-btn');
const exitCalcBtn = document.getElementById('exit-calc');
const calcButtonsContainer = document.querySelector('.calc-buttons');

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