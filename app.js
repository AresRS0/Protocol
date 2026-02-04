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

// UI Elemanları
const msgInput = document.getElementById('msg-input');
const messagesFeed = document.getElementById('messages-feed');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const sendBtn = document.getElementById('send-btn');
const roomModal = document.getElementById('room-modal');
const settingsModal = document.getElementById('settings-modal');

// Durum Değişkenleri
let currentUser = null;
let currentRoomId = null;

// ==========================================
// 1. GİRİŞ & GÜVENLİK
// ==========================================

auth.onAuthStateChanged(async (user) => {
    // Tüm ekranları gizle
    Object.values(screens).forEach(el => el.classList.add('hidden'));

    if (user) {
        // Mail onayı kontrolü (Google hariç)
        const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
        if (!isGoogle && !user.emailVerified) {
            await user.reload(); // Sunucuyu zorla
            if (!user.emailVerified) {
                screens.verify.classList.remove('hidden');
                return;
            }
        }

        // Profil Kontrolü
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            currentUser = userDoc.data();
            initApp();
        } else {
            // Profil oluşturma ekranı
            if (user.photoURL) document.getElementById('setup-avatar-preview').src = user.photoURL;
            screens.profile.classList.remove('hidden');
        }
    } else {
        screens.auth.classList.remove('hidden');
    }
});

// Giriş İşlemleri
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password).catch(err => alert(err.message));
});

document.getElementById('google-btn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => alert(err.message));
});

document.getElementById('show-register').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if(!email || !password) return alert("Kayıt olmak için E-posta ve Şifre girin.");
    
    auth.createUserWithEmailAndPassword(email, password).then(res => {
        res.user.sendEmailVerification();
        alert("Doğrulama maili gönderildi. Lütfen onaylayın.");
    }).catch(err => alert(err.message));
});

// Profil Kaydetme
document.getElementById('save-profile-btn').addEventListener('click', async () => {
    const username = document.getElementById('setup-username').value;
    if (!username) return alert("İsim şart.");
    
    const user = auth.currentUser;
    const avatar = document.getElementById('setup-avatar-preview').src;

    const userData = {
        uid: user.uid,
        email: user.email,
        username: username,
        avatar: avatar,
        theme: '#00cec9',
        rooms: ['Genel'], // Varsayılan oda
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(user.uid).set(userData);
    currentUser = userData;
    initApp();
});

// ==========================================
// 2. UYGULAMA BAŞLATMA & ODA YÖNETİMİ
// ==========================================

function initApp() {
    screens.app.classList.remove('hidden');
    
    // Profili Yükle
    document.getElementById('nav-avatar').src = currentUser.avatar;
    document.getElementById('settings-email-display').innerText = currentUser.email;
    applyTheme(currentUser.theme);

    // Oda Listesini Getir (Şimdilik manuel ekliyoruz, ilerde 'subscribedRooms' kullanırız)
    // Şimdilik sadece kullanıcıyı boş ekrana atıyoruz, oda seçmesini istiyoruz.
    renderRoomList();
}

function renderRoomList() {
    // Burada kullanıcının katıldığı odaları listeleyebiliriz.
    // Şimdilik basit tutuyoruz, 'Genel' odası varsayılan değil, seçilmesi gerek.
}

// Odaya Girme
async function enterRoom(roomId) {
    currentRoomId = roomId;
    
    // UI Güncelle
    document.getElementById('empty-state-msg').classList.add('hidden');
    document.getElementById('room-info-card').classList.remove('hidden');
    document.getElementById('panel-room-name').innerText = "Oda: " + roomId;
    document.getElementById('panel-room-id').innerText = roomId;
    document.getElementById('header-room-name').innerText = roomId;

    // Mesajları Dinle
    loadMessages(roomId);
}

// Modal Açma/Kapama
document.getElementById('open-room-modal-btn').addEventListener('click', () => roomModal.classList.remove('hidden'));
document.getElementById('settings-trigger').addEventListener('click', () => settingsModal.classList.remove('hidden'));

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.target).classList.add('hidden');
    });
});

// Tab Geçişleri (Katıl / Oluştur)
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
});

// ODA OLUŞTURMA
document.getElementById('create-room-btn').addEventListener('click', async () => {
    const name = document.getElementById('create-room-name').value;
    let code = document.getElementById('create-room-code').value;

    if (!code) code = "#" + Math.random().toString(36).substr(2, 6).toUpperCase(); // Rastgele kod
    if (!code.startsWith('#')) code = '#' + code;

    // Odaya giriş yap
    enterRoom(code);
    roomModal.classList.add('hidden');
    
    // Sol menüye ikon ekle (Geçici)
    addRoomIconToSidebar(code);
});

// ODAYA KATILMA
document.getElementById('join-room-btn').addEventListener('click', () => {
    const code = document.getElementById('join-room-code').value;
    if (!code) return;
    
    enterRoom(code);
    roomModal.classList.add('hidden');
    addRoomIconToSidebar(code);
});

function addRoomIconToSidebar(code) {
    const list = document.getElementById('my-rooms-list');
    const div = document.createElement('div');
    div.className = 'server-icon';
    div.innerText = code.substring(1, 3).toUpperCase();
    div.title = code;
    div.onclick = () => enterRoom(code);
    list.appendChild(div);
}

// ==========================================
// 3. MESAJLAŞMA & DOSYA YÜKLEME
// ==========================================

function loadMessages(roomId) {
    // Önceki dinleyiciyi temizle (varsa)
    // db.collection('messages').onSnapshot...
    
    db.collection('messages')
        .where('roomId', '==', roomId)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            messagesFeed.innerHTML = '';
            snapshot.forEach(doc => {
                const msg = doc.data();
                const isMe = msg.uid === auth.currentUser.uid;
                
                const div = document.createElement('div');
                div.className = `message ${isMe ? 'sent' : 'received'}`;
                
                // İçerik Oluşturma
                let contentHTML = '';
                if (msg.type === 'text') {
                    contentHTML = `<p>${msg.content}</p>`;
                } else if (msg.type === 'image') {
                    contentHTML = `<img src="${msg.content}" style="max-width:100%; border-radius:8px;">`;
                } else {
                    contentHTML = `<a href="${msg.content}" target="_blank" style="color:white; text-decoration:underline;">
                        <i class="fa-solid fa-file"></i> ${msg.fileName || 'Dosya'}
                    </a>`;
                }

                div.innerHTML = `
                    <div class="msg-info">${msg.sender}</div>
                    ${contentHTML}
                    <span class="msg-time">${new Date(msg.timestamp?.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                `;
                messagesFeed.appendChild(div);
            });
            messagesFeed.scrollTop = messagesFeed.scrollHeight;
        });
}

// Mesaj Gönderme
sendBtn.addEventListener('click', () => {
    const text = msgInput.value;
    if (!text.trim() || !currentRoomId) return; // Oda seçili değilse gönderme
    
    sendMessage(text, 'text');
    msgInput.value = '';
});

// Dosya Yükleme (KESİN ÇÖZÜM)
attachBtn.addEventListener('click', () => {
    if (!currentRoomId) return alert("Önce bir odaya girin.");
    fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    attachBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; // Yükleniyor ikonu

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        let type = 'raw';
        if (data.resource_type === 'image') type = 'image';
        
        sendMessage(data.secure_url, type, file.name);
    } catch (err) {
        alert("Yükleme başarısız oldu.");
        console.error(err);
    } finally {
        attachBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        fileInput.value = '';
    }
});

function sendMessage(content, type, fileName) {
    db.collection('messages').add({
        content: content,
        type: type,
        fileName: fileName || null,
        sender: currentUser.username,
        uid: currentUser.uid,
        roomId: currentRoomId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// ==========================================
// 4. AYARLAR & TEMA
// ==========================================

function changeTheme(color) {
    applyTheme(color);
    // DB Güncelle
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).update({ theme: color });
        currentUser.theme = color;
    }
}

function applyTheme(color) {
    document.documentElement.style.setProperty('--accent', color);
}

document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut();
    window.location.reload();
});

// Profil Resmi Yükleme (Setup ekranında)
document.getElementById('setup-avatar-btn').addEventListener('click', () => {
    // Basit olması için fileInput'u burada da kullanıyoruz
    // Ama normalde ayrı input olması daha temiz olur.
    // Şimdilik hızlı çözüm:
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        document.getElementById('setup-avatar-preview').src = data.secure_url;
    };
    input.click();
});


// HESAP MAKİNESİ (Sadeleştirilmiş - Butonları JS ile dolduruyoruz)
const calcOverlay = document.getElementById('calculator-overlay');
const stealthBtn = document.getElementById('stealth-btn');
const exitCalc = document.getElementById('exit-calc');

// Tuşlar
const calcKeys = ['AC','+/-','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='];
const calcContainer = document.querySelector('.calc-buttons');
const calcScreen = document.querySelector('.calc-screen');
let calcInput = "0";

calcKeys.forEach(key => {
    const btn = document.createElement('button');
    btn.className = `calc-btn ${['/','*','-','+','='].includes(key) ? 'btn-orange' : (['AC','+/-','%'].includes(key) ? 'btn-gray' : 'btn-dark')}`;
    if(key === '0') btn.classList.add('btn-zero');
    btn.innerText = key === '*' ? '×' : (key === '/' ? '÷' : key);
    
    btn.onclick = () => {
        if(key === 'AC') calcInput = "0";
        else if(key === '=') { try { calcInput = eval(calcInput).toString(); } catch{calcInput="Error";} }
        else {
            if(calcInput === "0") calcInput = "";
            calcInput += key;
        }
        calcScreen.innerText = calcInput;
    };
    calcContainer.appendChild(btn);
});

stealthBtn.addEventListener('click', () => calcOverlay.classList.remove('hidden'));
exitCalc.addEventListener('click', () => calcOverlay.classList.add('hidden'));