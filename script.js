// --- AYARLAR ---
const CLOUD_NAME = "ddxf1fhcy";
const UPLOAD_PRESET = "go1ovdi2";

// DOM Elemanları
const layers = {
    auth: document.getElementById('auth-layer'),
    app: document.getElementById('app-layer')
};
const forms = {
    login: document.getElementById('sign-in-container'),
    register: document.getElementById('register-container'),
    aptitude: document.querySelector('.aptitude-test-container')
};

// Değişkenler
let currentUser = null;
let currentRoomId = 'general';
let pendingRegData = {}; 

// ==========================================
// 1. AUTHENTICATION & GİRİŞ AKIŞI
// ==========================================

auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log("Kullanıcı aktif:", user.email);
        const doc = await db.collection('users').doc(user.uid).get();
        
        if (doc.exists) {
            currentUser = doc.data();
            startApp(); 
        } else {
            const newUserData = {
                uid: user.uid,
                email: user.email,
                username: user.displayName || "Agent",
                avatar: user.photoURL || "https://cdn.discordapp.com/embed/avatars/0.png",
                rooms: ['general'],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('users').doc(user.uid).set(newUserData);
            currentUser = newUserData;
            startApp();
        }
    } else {
        layers.app.classList.add('hidden');
        layers.auth.classList.remove('hidden');
    }
});

// A) Google Girişi
document.getElementById('google-btn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => alert("Hata: " + err.message));
});

// B) E-Posta Girişi
document.getElementById('sign-in-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    
    const btn = document.getElementById('login-btn');
    btn.innerText = 'DOĞRULANIYOR...';
    
    auth.signInWithEmailAndPassword(email, pass).catch(err => {
        btn.innerText = 'BAĞLAN'; // Hata olursa geri dön
        alert("Giriş Başarısız: " + err.message);
    });
});

// C) Kayıt Ekranı Geçişleri
document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    forms.login.classList.add('hidden');
    forms.register.classList.remove('hidden');
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    forms.register.classList.add('hidden');
    forms.login.classList.remove('hidden');
});

// D) Kayıt ve Test Başlatma
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    pendingRegData.name = document.getElementById('reg-name').value;
    pendingRegData.email = document.getElementById('reg-email').value;
    pendingRegData.pass = document.getElementById('reg-pass').value;
    
    forms.register.classList.add('hidden');
    forms.aptitude.classList.remove('hidden'); // Testi Başlat
});

// E) Test Mantığı
document.querySelectorAll('.pattern-option').forEach(opt => {
    opt.addEventListener('click', function() {
        document.querySelector('.test-section[data-test="1"]').classList.remove('active');
        document.querySelector('.test-section[data-test="results"]').classList.add('active');
        
        setTimeout(() => {
            completeRegistration();
        }, 1500);
    });
});

function completeRegistration() {
    auth.createUserWithEmailAndPassword(pendingRegData.email, pendingRegData.pass)
        .then(cred => {
            cred.user.updateProfile({ displayName: pendingRegData.name });
            const userData = {
                uid: cred.user.uid,
                email: cred.user.email,
                username: pendingRegData.name,
                avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
                rooms: ['general'],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            return db.collection('users').doc(cred.user.uid).set(userData);
        })
        .catch(err => alert("Kayıt Hatası: " + err.message));
}

// ==========================================
// 2. UYGULAMA (CHAT) AKIŞI
// ==========================================

function startApp() {
    layers.auth.classList.add('hidden');
    layers.app.classList.remove('hidden');
    
    // Kullanıcı UI
    if(currentUser) {
        document.getElementById('user-name').innerText = currentUser.username;
        document.getElementById('user-avatar').src = currentUser.avatar;
        renderServerList();
        enterRoom('general');
    }
}

function renderServerList() {
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
    
    // Mobilde odaya girince menüyü kapatabiliriz (İsteğe bağlı)
    // if(window.innerWidth < 768) document.querySelector('.sidebar').classList.add('hidden');
}

// Mesajları Dinle
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
    
    let contentHtml = `<div class="msg-text">${msg.content}</div>`;
    if(msg.type === 'image') {
        contentHtml = `<img src="${msg.content}" class="msg-image" onclick="window.open(this.src)">`;
    }
    
    div.innerHTML = `
        <img class="msg-avatar" src="${msg.avatar}">
        <div class="msg-content">
            <h4>${msg.sender} <span class="msg-timestamp">Bugün</span></h4>
            ${contentHtml}
        </div>
    `;
    feed.appendChild(div);
}

// Mesaj Gönderme
document.getElementById('msg-input').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        const txt = e.target.value.trim();
        if(txt) {
            sendMessage(txt, 'text');
            e.target.value = '';
        }
    }
});

function sendMessage(content, type) {
    db.collection('messages').add({
        content: content,
        type: type,
        sender: currentUser.username,
        avatar: currentUser.avatar,
        roomId: currentRoomId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

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
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        let type = data.resource_type === 'image' ? 'image' : 'text';
        sendMessage(data.secure_url, type);
    } catch(err) { console.error(err); }
});

// Çıkış
document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut().then(() => window.location.reload());
});

// Oda Ekleme Modal
document.getElementById('add-server-btn').addEventListener('click', () => {
    document.getElementById('modal-backdrop').classList.remove('hidden');
});
document.getElementById('create-room-btn').addEventListener('click', async () => {
    const name = document.getElementById('new-room-name').value;
    if(name) {
        currentUser.rooms.push(name);
        await db.collection('users').doc(currentUser.uid).update({ rooms: currentUser.rooms });
        renderServerList();
        document.getElementById('modal-backdrop').classList.add('hidden');
        enterRoom(name);
    }
});

// ==========================================
// 3. BUKALEMUN MODU (HESAP MAKİNESİ) - GERİ GELDİ!
// ==========================================

// HTML'e Hesap Makinesini JS ile Enjekte Et (Eğer HTML'de yoksa)
if(!document.getElementById('calculator-overlay')) {
    const calcDiv = document.createElement('div');
    calcDiv.id = 'calculator-overlay';
    calcDiv.className = 'hidden';
    calcDiv.innerHTML = `
        <div class="calc-top-bar" id="exit-calc" style="height:100px; width:100%;"></div>
        <div class="calc-screen" style="color:white; font-size:60px; text-align:right; padding:20px;">0</div>
        <div class="calc-buttons" style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding:10px;"></div>
    `;
    document.body.appendChild(calcDiv);
    
    // Tuşları Oluştur
    const keys = ['AC','+/-','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='];
    const container = calcDiv.querySelector('.calc-buttons');
    const screen = calcDiv.querySelector('.calc-screen');
    let calcInput = "0";

    keys.forEach(key => {
        const btn = document.createElement('button');
        btn.innerText = key;
        btn.style.height = '70px';
        btn.style.borderRadius = '50%';
        btn.style.border = 'none';
        btn.style.fontSize = '24px';
        btn.style.cursor = 'pointer';
        
        // Renkler
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

    // Çıkış (Üst boşluğa tıklama)
    document.getElementById('exit-calc').addEventListener('click', () => {
        calcDiv.classList.add('hidden');
    });
}

// "P" Tuşu veya Özel Bir İkon ile Açma (Örn: Chat başlığındaki # ikonuna çift tıklama)
document.addEventListener('keydown', (e) => {
    if(e.key === 'p' && e.ctrlKey) { // CTRL + P
        document.getElementById('calculator-overlay').classList.remove('hidden');
    }
});

// Ayrıca Chat Header'daki # ikonuna tıklayınca da açılsın (Mobilde klavye yok)
setTimeout(() => {
    const headerIcon = document.querySelector('.header-left i');
    if(headerIcon) {
        headerIcon.style.cursor = 'pointer';
        headerIcon.addEventListener('click', () => {
            document.getElementById('calculator-overlay').classList.toggle('hidden');
        });
    }
}, 2000);