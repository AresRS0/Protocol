// --- AYARLAR ---
const CLOUD_NAME = "ddxf1fhcy";
const UPLOAD_PRESET = "go1ovdi2";

// DOM & Firebase
const authLayer = document.getElementById('auth-layer');
const appLayer = document.getElementById('app-layer');
const loginContainer = document.getElementById('sign-in-container');
const registerContainer = document.getElementById('register-container');

// State
let currentUser = null;
let currentRoomId = 'general';

// ===========================================
// 1. FIREBASE AUTH & FLOW LOGIC
// ===========================================

// Auth Durumunu İzle
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log("LOGIN: SUCCESS", user.email);
        
        // Kullanıcı verisini çek
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
            currentUser = doc.data();
        } else {
            // İlk kez giriyorsa oluştur
            const newUser = {
                uid: user.uid,
                email: user.email,
                username: user.displayName || "Agent",
                avatar: user.photoURL || "https://cdn.discordapp.com/embed/avatars/0.png",
                rooms: ['general'],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('users').doc(user.uid).set(newUser);
            currentUser = newUser;
        }
        
        // AUTH LAYER'ı Gizle, APP LAYER'ı Aç
        authLayer.classList.add('hidden');
        appLayer.style.display = 'flex';
        appLayer.classList.remove('hidden');
        
        // Chat Başlat
        initChatApp();
    } else {
        // Çıkış yapılmışsa Auth ekranına dön
        appLayer.style.display = 'none';
        appLayer.classList.add('hidden');
        authLayer.classList.remove('hidden');
    }
});

// A) Google ile Giriş
document.getElementById('google-btn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
        alert("Google Error: " + err.message);
    });
});

// B) E-Posta ile Giriş
document.getElementById('sign-in-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('researcher-id').value;
    const password = document.getElementById('clearance-code').value;
    
    // Butonu Yükleniyor Yap (Visual Feedback)
    const btn = document.getElementById('authenticate-btn');
    btn.innerHTML = 'VERIFYING...';
    
    auth.signInWithEmailAndPassword(email, password).catch(err => {
        btn.innerHTML = 'AUTHENTICATE <span class="btn-glow"></span>';
        alert("ACCESS DENIED: " + err.message);
    });
});

// C) Kayıt Ol
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-researcher-name').value;
    const email = document.getElementById('new-researcher-id').value;
    const pass = document.getElementById('clearance-code-new').value;
    
    auth.createUserWithEmailAndPassword(email, pass)
        .then((cred) => {
            cred.user.updateProfile({ displayName: name });
            alert("CLEARANCE GRANTED. LOGGING IN...");
        })
        .catch(err => alert("REGISTRATION ERROR: " + err.message));
});

// Form Geçişleri
document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    loginContainer.classList.add('hidden');
    registerContainer.classList.remove('hidden');
});
document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    registerContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
});


// ===========================================
// 2. CHAT APP LOGIC (APP LAYER)
// ===========================================

function initChatApp() {
    document.getElementById('user-name').innerText = currentUser.username;
    document.getElementById('user-avatar').src = currentUser.avatar;
    renderServers();
    enterRoom('general');
}

function renderServers() {
    const list = document.getElementById('server-list');
    list.innerHTML = '';
    currentUser.rooms.forEach(roomId => {
        const div = document.createElement('div');
        div.className = 'guild-icon';
        div.innerText = roomId.substring(0,2).toUpperCase();
        div.onclick = () => enterRoom(roomId);
        list.appendChild(div);
    });
}

function enterRoom(roomId) {
    currentRoomId = roomId;
    document.getElementById('server-name').innerText = "Protocol: " + roomId;
    document.getElementById('channel-name').innerText = roomId;
    loadMessages(roomId);
}

let unsubscribe = null;
function loadMessages(roomId) {
    if(unsubscribe) unsubscribe();
    const feed = document.getElementById('messages-feed');
    feed.innerHTML = '';
    
    unsubscribe = db.collection('messages')
        .where('roomId', '==', roomId)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if(change.type === 'added') {
                    renderMessage(change.doc.data());
                    feed.scrollTop = feed.scrollHeight;
                }
            });
        });
}

function renderMessage(msg) {
    const feed = document.getElementById('messages-feed');
    const div = document.createElement('div');
    div.className = 'message';
    
    let content = `<div class="msg-text">${msg.content}</div>`;
    if(msg.type === 'image') content = `<img src="${msg.content}" class="msg-image" onclick="window.open(this.src)">`;
    
    div.innerHTML = `
        <img class="msg-avatar" src="${msg.avatar}">
        <div class="msg-content">
            <h4>${msg.sender} <span class="msg-timestamp">Today</span></h4>
            ${content}
        </div>
    `;
    feed.appendChild(div);
}

// Mesaj Gönderme
document.getElementById('msg-input').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        const txt = e.target.value.trim();
        if(txt) {
            db.collection('messages').add({
                content: txt,
                type: 'text',
                sender: currentUser.username,
                avatar: currentUser.avatar,
                roomId: currentRoomId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            e.target.value = '';
        }
    }
});

// Dosya Yükleme
const fileInput = document.getElementById('file-input');
document.getElementById('file-btn').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        db.collection('messages').add({
            content: data.secure_url,
            type: 'image',
            sender: currentUser.username,
            avatar: currentUser.avatar,
            roomId: currentRoomId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch(err) { console.error(err); }
});

// Çıkış
document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut().then(() => window.location.reload());
});

// ===========================================
// 3. VISUAL EFFECTS (CODEPEN ORIGINALS)
// ===========================================

// Mouse Tracking
document.addEventListener('mousemove', (e) => {
  const x = e.clientX / window.innerWidth * 100;
  const y = e.clientY / window.innerHeight * 100;
  document.documentElement.style.setProperty('--mouse-x', `${x}%`);
  document.documentElement.style.setProperty('--mouse-y', `${y}%`);
});

// Timestamp
function updateTimestamp() {
  const now = new Date();
  const ts = document.getElementById('timestamp');
  if(ts) ts.textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}
setInterval(updateTimestamp, 1000);

// Input Focus Glitch Effect
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('focus', () => {
    input.closest('.input-container').style.borderColor = 'var(--bioluminescent-teal)';
  });
  input.addEventListener('blur', () => {
    input.closest('.input-container').style.borderColor = 'rgba(96, 125, 139, 0.3)';
  });
});

// HESAP MAKİNESİ (Overlay)
const calcBtn = document.getElementById('calc-btn');
const calcOverlay = document.getElementById('calculator-overlay');
const exitCalc = document.getElementById('exit-calc');

// Butonları Oluştur
const keys = ['AC','+/-','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='];
const container = document.querySelector('.calc-buttons');
const screen = document.querySelector('.calc-screen');
let calcInput = "0";

keys.forEach(key => {
    const btn = document.createElement('button');
    btn.innerText = key;
    btn.style.height = '70px';
    btn.style.borderRadius = '50%';
    btn.style.border = 'none';
    btn.style.fontSize = '24px';
    btn.style.cursor = 'pointer';
    
    if(['/','*','-','+','='].includes(key)) { btn.style.background = '#ff9f0a'; btn.style.color='white'; }
    else if(['AC','+/-','%'].includes(key)) { btn.style.background = '#a5a5a5'; btn.style.color='black'; }
    else { btn.style.background = '#333'; btn.style.color='white'; }
    
    if(key === '0') { btn.style.gridColumn = "span 2"; btn.style.borderRadius = "40px"; }

    btn.onclick = () => {
        if(key === 'AC') calcInput = "0";
        else if(key === '=') { try{calcInput = eval(calcInput).toString()}catch{calcInput="Err"} }
        else { if(calcInput==="0") calcInput=""; calcInput+=key; }
        screen.innerText = calcInput;
    }
    container.appendChild(btn);
});

// Aç/Kapa
if(calcBtn) calcBtn.addEventListener('click', () => calcOverlay.classList.remove('hidden'));
exitCalc.addEventListener('click', () => calcOverlay.classList.add('hidden'));