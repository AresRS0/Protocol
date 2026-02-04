// CONFIG
const CLOUD_NAME = "ddxf1fhcy";
const UPLOAD_PRESET = "go1ovdi2";

// DOM
const screens = {
    auth: document.getElementById('auth-layer'),
    profile: document.getElementById('profile-layer'),
    app: document.getElementById('app-layer')
};

// UI Elemanları
const msgInput = document.getElementById('msg-input');
const msgFeed = document.getElementById('messages-feed');
const fileInput = document.getElementById('file-input');
const roomModal = document.getElementById('room-modal');
const settingsModal = document.getElementById('settings-modal');
const membersSidebar = document.getElementById('members-sidebar');

// Durum
let currentUser = null;
let currentRoomId = null;

// =====================================
// 1. AUTH SİSTEMİ
// =====================================
auth.onAuthStateChanged(async (user) => {
    Object.values(screens).forEach(s => s.classList.add('hidden'));

    if (user) {
        // Profil Çek
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
            currentUser = doc.data();
            initApp();
        } else {
            // Yeni Profil
            if(user.photoURL) document.getElementById('setup-avatar-preview').src = user.photoURL;
            screens.profile.classList.remove('hidden');
        }
    } else {
        screens.auth.classList.remove('hidden');
    }
});

// Giriş
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, pass).catch(e => document.getElementById('auth-error').innerText = e.message);
});

// Kayıt Butonu
document.getElementById('show-register').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    if(!email || !pass) return alert("Bilgileri girin.");
    
    auth.createUserWithEmailAndPassword(email, pass)
        .then(() => alert("Kayıt Başarılı. Giriş yapabilirsiniz."))
        .catch(e => alert(e.message));
});

// Google
document.getElementById('google-btn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
});

// Profil Kaydet
document.getElementById('save-profile-btn').addEventListener('click', async () => {
    const username = document.getElementById('setup-username').value;
    const avatar = document.getElementById('setup-avatar-preview').src;
    if(!username) return alert("İsim şart!");

    const data = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        username: username,
        avatar: avatar,
        theme: '#00cec9',
        rooms: ['Genel'], // Başlangıç odası
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(auth.currentUser.uid).set(data);
    currentUser = data;
    initApp();
});

// =====================================
// 2. UYGULAMA BAŞLATMA
// =====================================
function initApp() {
    screens.app.classList.remove('hidden');
    
    // Kullanıcı Bilgileri
    document.getElementById('user-panel-name').innerText = currentUser.username;
    document.getElementById('user-panel-code').innerText = currentUser.uid.substring(0,4).toUpperCase();
    document.getElementById('user-panel-avatar').src = currentUser.avatar;
    
    // Ayarlar İçini Doldur
    document.getElementById('settings-username').innerText = currentUser.username;
    document.getElementById('settings-email').innerText = currentUser.email;
    document.getElementById('settings-avatar').src = currentUser.avatar;
    
    // Tema Uygula
    setTheme(currentUser.theme || '#00cec9');
    
    // Odaları Listele
    renderRooms();
    
    // İlk odaya gir
    enterRoom(currentUser.rooms[0] || 'Genel');
    
    // Kendi profilini sağ üye listesine ekle (Görsel amaçlı)
    document.getElementById('member-self-name').innerText = currentUser.username;
    document.getElementById('member-self-avatar').src = currentUser.avatar;
}

function renderRooms() {
    const list = document.getElementById('server-list');
    list.innerHTML = '';
    
    currentUser.rooms.forEach(room => {
        const div = document.createElement('div');
        div.className = 'server-icon';
        div.innerText = room.substring(0,2).toUpperCase();
        div.title = room;
        div.onclick = () => enterRoom(room);
        list.appendChild(div);
    });
}

function enterRoom(roomId) {
    currentRoomId = roomId;
    
    // UI Güncelle
    document.getElementById('sidebar-room-name').innerText = roomId;
    document.getElementById('chat-header-title').innerText = roomId;
    document.getElementById('channel-name-disp').innerText = roomId.toLowerCase().replace(' ', '-');
    
    // Aktiflik Sınıfı
    document.querySelectorAll('.server-icon').forEach(el => el.classList.remove('active'));
    // Basit eşleştirme yok, hepsi yeniden çizildiği için sonuncuya bakmıyoruz.
    
    loadMessages(roomId);
}

// =====================================
// 3. MESAJLAR & DOSYA
// =====================================
let unsubscribe = null;

function loadMessages(roomId) {
    if(unsubscribe) unsubscribe();
    msgFeed.innerHTML = '';
    
    unsubscribe = db.collection('messages')
        .where('roomId', '==', roomId)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snap => {
            snap.docChanges().forEach(change => {
                if(change.type === 'added') renderMsg(change.doc.data());
            });
            msgFeed.scrollTop = msgFeed.scrollHeight;
        });
}

function renderMsg(msg) {
    const div = document.createElement('div');
    div.className = 'message';
    
    // İçerik
    let content = `<div class="msg-bubble">${msg.content}</div>`;
    if(msg.type === 'image') content = `<img src="${msg.content}" class="msg-image" onclick="window.open(this.src)">`;
    else if(msg.type === 'raw') content = `<a href="${msg.content}" target="_blank" class="msg-file"><i class="fa-solid fa-file-arrow-down"></i> ${msg.fileName}</a>`;
    
    div.innerHTML = `
        <img src="${msg.avatar}" class="msg-avatar">
        <div class="msg-content">
            <h4>${msg.sender} <span class="msg-date">Bugün</span></h4>
            ${content}
        </div>
    `;
    msgFeed.appendChild(div);
}

// Gönder
msgInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        const txt = msgInput.value.trim();
        if(txt) {
            send(txt, 'text');
            msgInput.value = '';
        }
    }
});

function send(content, type, fileName) {
    db.collection('messages').add({
        content: content,
        type: type,
        fileName: fileName || null,
        sender: currentUser.username,
        avatar: currentUser.avatar,
        roomId: currentRoomId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Dosya
document.getElementById('file-trigger').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    
    // Loading
    const btn = document.getElementById('file-trigger');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        let type = data.resource_type === 'image' ? 'image' : 'raw';
        send(data.secure_url, type, file.name);
    } catch(e) { console.error(e); }
    
    btn.innerHTML = '<i class="fa-solid fa-paperclip"></i>';
});

// =====================================
// 4. MODALLAR VE AYARLAR
// =====================================

// Modal Yöneticisi
const toggleModal = (id, show) => {
    const el = document.getElementById(id);
    show ? el.classList.remove('hidden') : el.classList.add('hidden');
};

document.getElementById('add-room-trigger').addEventListener('click', () => toggleModal('room-modal', true));
document.getElementById('settings-trigger').addEventListener('click', () => toggleModal('settings-modal', true));
document.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', (e) => {
    e.target.closest('.modal-backdrop').classList.add('hidden');
}));

// Oda Kurma / Katılma
const tabs = document.querySelectorAll('.tab-btn');
tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    t.classList.add('active');
    document.getElementById(`tab-${t.dataset.target}`).classList.remove('hidden');
}));

document.getElementById('create-room-act-btn').addEventListener('click', async () => {
    const name = document.getElementById('new-room-name').value;
    if(!name) return;
    await addRoom(name);
});
document.getElementById('join-room-act-btn').addEventListener('click', async () => {
    const code = document.getElementById('join-room-code').value;
    if(!code) return;
    await addRoom(code);
});

async function addRoom(roomName) {
    if(!currentUser.rooms.includes(roomName)) {
        currentUser.rooms.push(roomName);
        await db.collection('users').doc(currentUser.uid).update({ rooms: currentUser.rooms });
    }
    renderRooms();
    enterRoom(roomName);
    toggleModal('room-modal', false);
}

// Tema
window.setTheme = function(color) {
    document.documentElement.style.setProperty('--accent', color);
    if(currentUser) db.collection('users').doc(currentUser.uid).update({ theme: color });
}

// Üye Listesi Toggle
document.getElementById('member-toggle').addEventListener('click', () => {
    membersSidebar.classList.toggle('hidden');
});

// ÇIKIŞ
document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut().then(() => window.location.reload());
});

// PANİK BUTONU (Siber Güvenlik)
document.getElementById('panic-btn').addEventListener('click', () => {
    if(confirm("TÜM YEREL VERİLER SİLİNECEK. ONAYLIYOR MUSUN?")) {
        localStorage.clear();
        sessionStorage.clear();
        auth.signOut();
        document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:50px;'>SİSTEM TEMİZLENDİ</h1>";
        setTimeout(() => window.location.href = "https://google.com", 2000);
    }
});

// HESAP MAKİNESİ (Bukalemun)
const calcOverlay = document.getElementById('calculator-overlay');
const stealthTrigger = document.getElementById('stealth-trigger');
const exitCalc = document.getElementById('exit-calc');
const calcContainer = document.querySelector('.calc-buttons');
const calcScreen = document.querySelector('.calc-screen');
let calcInput = "0";

const calcKeys = ['AC','+/-','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='];
calcKeys.forEach(key => {
    const btn = document.createElement('button');
    btn.className = `calc-btn ${['/','*','-','+','='].includes(key) ? 'btn-orange' : (['AC','+/-','%'].includes(key) ? 'btn-gray' : 'btn-dark')}`;
    if(key === '0') btn.classList.add('btn-zero');
    btn.innerText = key === '*' ? '×' : (key === '/' ? '÷' : key);
    btn.onclick = () => {
        if(key === 'AC') calcInput = "0";
        else if(key === '=') { try { calcInput = eval(calcInput).toString(); } catch{calcInput="Error";} }
        else { if(calcInput === "0") calcInput = ""; calcInput += key; }
        calcScreen.innerText = calcInput;
    };
    calcContainer.appendChild(btn);
});

stealthTrigger.addEventListener('click', () => calcOverlay.classList.remove('hidden'));
// Üstteki boş alana tıklayınca çık
exitCalc.addEventListener('click', () => calcOverlay.classList.add('hidden'));