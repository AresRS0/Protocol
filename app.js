// ==========================================
// 0. AYARLAR & CONFIG
// ==========================================
const CLOUD_NAME = "ddxf1fhcy";
const UPLOAD_PRESET = "go1ovdi2";

// DOM SEÇİCİLERİ
const screens = {
    auth: document.getElementById('auth-layer'),
    verify: document.getElementById('verify-layer'),
    profile: document.getElementById('profile-layer'),
    app: document.getElementById('app-layer')
};

// UI Elementleri
const msgFeed = document.getElementById('messages-feed');
const msgInput = document.getElementById('msg-input');
const fileInput = document.getElementById('file-input');
const fileTrigger = document.getElementById('file-trigger');

// Durum
let currentUser = null;
let currentRoom = null;

// ==========================================
// 1. AUTHENTICATION (Kimlik Doğrulama)
// ==========================================

auth.onAuthStateChanged(async (user) => {
    hideAllScreens();
    
    if (user) {
        // E-posta ile giriş yapanlar için kontrol
        const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
        
        if (!isGoogle && !user.emailVerified) {
            // Zorla yenile ki durumu anlık görsün
            await user.reload();
            if(!user.emailVerified) {
                screens.verify.classList.remove('hidden');
                return;
            }
        }

        // Kullanıcı Profili Var mı?
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
            currentUser = doc.data();
            initApp();
        } else {
            // Profil Yok -> Oluştur
            if(user.photoURL) document.getElementById('setup-avatar-preview').src = user.photoURL;
            if(user.displayName) document.getElementById('setup-username').value = user.displayName;
            screens.profile.classList.remove('hidden');
        }
    } else {
        screens.auth.classList.remove('hidden');
    }
});

function hideAllScreens() {
    Object.values(screens).forEach(el => el.classList.add('hidden'));
}

// Giriş İşlemleri
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, pass).catch(err => document.getElementById('auth-error').innerText = err.message);
});

document.getElementById('google-btn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(console.error);
});

// Kayıt İşlemleri
document.getElementById('show-register').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    if(!email || !pass) return alert("E-posta ve şifre giriniz.");
    
    auth.createUserWithEmailAndPassword(email, pass)
        .then(creds => {
            creds.user.sendEmailVerification();
            alert("Doğrulama maili gönderildi.");
        })
        .catch(err => alert(err.message));
});

// Profil Kaydet
document.getElementById('save-profile-btn').addEventListener('click', async () => {
    const username = document.getElementById('setup-username').value;
    const avatar = document.getElementById('setup-avatar-preview').src;
    
    if(!username) return alert("Kullanıcı adı gerekli");
    
    const userData = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        username: username,
        avatar: avatar,
        theme: '#5865F2',
        rooms: ['Genel'], // Varsayılan oda
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(auth.currentUser.uid).set(userData);
    currentUser = userData;
    initApp();
});

// ==========================================
// 2. UYGULAMA MANTIĞI & ODA SİSTEMİ
// ==========================================

function initApp() {
    screens.app.classList.remove('hidden');
    
    // Kullanıcı Paneli Doldur
    document.getElementById('user-panel-name').innerText = currentUser.username;
    document.getElementById('user-panel-avatar').src = currentUser.avatar;
    document.getElementById('member-list-name').innerText = currentUser.username;
    document.getElementById('member-list-avatar').src = currentUser.avatar;
    
    // Server Listesini Render Et
    renderServers();
    
    // Varsayılan olarak ilk odaya gir
    enterRoom(currentUser.rooms[0] || 'Genel');
}

function renderServers() {
    const list = document.getElementById('server-list');
    list.innerHTML = '';
    
    // Kullanıcının odalarını listele (Şimdilik basit dizi)
    currentUser.rooms.forEach(roomId => {
        const div = document.createElement('div');
        div.className = 'guild-icon';
        div.innerText = roomId.substring(0, 2).toUpperCase();
        div.title = roomId;
        div.onclick = () => enterRoom(roomId);
        list.appendChild(div);
    });
}

function enterRoom(roomId) {
    currentRoom = roomId;
    
    // UI Güncelle
    document.getElementById('sidebar-server-name').innerText = roomId;
    document.getElementById('chat-header-name').innerText = roomId;
    
    // Aktif ikonu işaretle
    document.querySelectorAll('.guild-icon').forEach(el => el.classList.remove('active'));
    // Basit eşleştirme (Geliştirilebilir)
    
    // Mesajları Getir
    loadMessages(roomId);
}

// Modal Açma/Kapama
const serverModal = document.getElementById('server-modal');
const settingsModal = document.getElementById('settings-modal');

document.getElementById('add-server-modal-btn').addEventListener('click', () => serverModal.classList.remove('hidden'));
document.getElementById('open-settings-btn').addEventListener('click', () => settingsModal.classList.remove('hidden'));

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        serverModal.classList.add('hidden');
        settingsModal.classList.add('hidden');
    });
});

// Oda Oluştur / Katıl
document.getElementById('create-join-btn').addEventListener('click', async () => {
    let name = document.getElementById('new-server-name').value;
    const code = document.getElementById('join-server-code').value;
    
    let targetRoom = name || code;
    if(!targetRoom) return;

    // Kullanıcının odalarına ekle
    if(!currentUser.rooms.includes(targetRoom)) {
        currentUser.rooms.push(targetRoom);
        await db.collection('users').doc(currentUser.uid).update({
            rooms: currentUser.rooms
        });
    }
    
    renderServers();
    enterRoom(targetRoom);
    serverModal.classList.add('hidden');
});


// ==========================================
// 3. MESAJLAŞMA SİSTEMİ (Onarılmış)
// ==========================================

let unsubscribe = null;

function loadMessages(roomId) {
    if(unsubscribe) unsubscribe(); // Eskiyi durdur
    
    msgFeed.innerHTML = ''; // Temizle
    
    unsubscribe = db.collection('messages')
        .where('roomId', '==', roomId)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if(change.type === "added") {
                    renderMessage(change.doc.data());
                }
            });
            msgFeed.scrollTop = msgFeed.scrollHeight;
        });
}

function renderMessage(msg) {
    const div = document.createElement('div');
    div.className = 'discord-msg';
    
    // Tarih Formatı
    const date = msg.timestamp ? msg.timestamp.toDate() : new Date();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString();

    // İçerik Tipi
    let contentHTML = `<div class="msg-text">${msg.content}</div>`;
    
    if(msg.type === 'image') {
        contentHTML = `<img src="${msg.content}" class="msg-image" onclick="window.open(this.src)">`;
    } else if(msg.type === 'raw') {
        contentHTML = `<a href="${msg.content}" target="_blank" class="msg-file-link"><i class="fa-solid fa-download"></i> &nbsp; ${msg.fileName}</a>`;
    }

    div.innerHTML = `
        <img src="${msg.avatar}" class="msg-avatar">
        <div class="msg-content-wrapper">
            <div class="msg-header">
                <span class="msg-author" style="color:${msg.themeColor || 'white'}">${msg.sender}</span>
                <span class="msg-timestamp">${dateStr} ${timeStr}</span>
            </div>
            ${contentHTML}
        </div>
    `;
    
    msgFeed.appendChild(div);
}

// Mesaj Gönderme (Enter ve Buton yok, sadece Enter basınca gider Discord gibi)
msgInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        const text = msgInput.value.trim();
        if(text && currentRoom) {
            sendMessage(text, 'text');
            msgInput.value = '';
        }
    }
});

function sendMessage(content, type, fileName) {
    db.collection('messages').add({
        content: content,
        type: type,
        fileName: fileName || null,
        sender: currentUser.username,
        avatar: currentUser.avatar,
        themeColor: currentUser.theme,
        roomId: currentRoom,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Dosya Yükleme (Tamir Edildi)
fileTrigger.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    
    // Yükleniyor efekti
    fileTrigger.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
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
        if(data.resource_type === 'image') type = 'image';
        
        sendMessage(data.secure_url, type, file.name);
        
    } catch(err) {
        console.error(err);
        alert("Dosya yüklenemedi!");
    } finally {
        fileTrigger.innerHTML = '<i class="fa-solid fa-circle-plus"></i>';
        fileInput.value = '';
    }
});


// ==========================================
// 4. DİĞER FONKSİYONLAR
// ==========================================

// Çıkış Yap (Güvenli Reload)
document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut().then(() => window.location.reload());
});
document.getElementById('logout-verify-btn').addEventListener('click', () => {
    auth.signOut().then(() => window.location.reload());
});

// Tema Değiştirme
window.setTheme = function(color) {
    document.documentElement.style.setProperty('--brand', color);
    if(currentUser) {
        db.collection('users').doc(auth.currentUser.uid).update({ theme: color });
    }
}

// Avatar Yükleme (Profil Ekranında)
document.getElementById('setup-avatar-btn').addEventListener('click', () => {
    // Geçici input oluştur
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.onchange = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        document.getElementById('setup-avatar-preview').src = data.secure_url;
    };
    inp.click();
});

// HESAP MAKİNESİ (Bukalemun)
const calcOverlay = document.getElementById('calculator-overlay');
const stealthTrigger = document.getElementById('stealth-trigger');
const exitCalc = document.getElementById('exit-calc');

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

stealthTrigger.addEventListener('click', () => calcOverlay.classList.remove('hidden'));
exitCalc.addEventListener('click', () => calcOverlay.classList.add('hidden'));