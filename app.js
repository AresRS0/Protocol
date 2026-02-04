// --- CLOUDINARY AYARLARI ---
const CLOUD_NAME = "ddxf1fhcy";
const UPLOAD_PRESET = "go1ovdi2";

// --- DOM ELEMENTLERİ ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authErrorMsg = document.getElementById('auth-error-msg');
const showRegisterBtn = document.getElementById('show-register');
const logoutBtn = document.getElementById('logout-btn');
const messagesFeed = document.getElementById('messages-feed');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const attachBtn = document.getElementById('attach-btn'); // Dosya butonu
const fileInput = document.getElementById('file-input'); // Gizli input

// --- 1. HESAP MAKİNESİ (IPHONE MANTIĞI) ---
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
    if (val === 'AC') {
        currentInput = '0';
    } else if (val === '=') {
        try { currentInput = eval(currentInput).toString(); } catch { currentInput = 'Error'; }
    } else if (val === '+/-') {
        currentInput = (parseFloat(currentInput) * -1).toString();
    } else if (val === '%') {
        currentInput = (parseFloat(currentInput) / 100).toString();
    } else {
        if (currentInput === '0') currentInput = '';
        currentInput += val;
    }
    screenDiv.innerText = currentInput;
}

stealthBtn.addEventListener('click', () => { calculatorOverlay.classList.remove('hidden'); });
exitCalcBtn.addEventListener('click', () => { calculatorOverlay.classList.add('hidden'); });

// --- 2. AUTH İŞLEMLERİ ---
let isRegister = false;
auth.onAuthStateChanged(user => {
    if (user) {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        loadMessages();
    } else {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});

showRegisterBtn.addEventListener('click', () => {
    isRegister = !isRegister;
    document.querySelector('.logo h1').innerText = isRegister ? "KAYIT OL" : "PROTOCOL";
    document.getElementById('login-btn').innerText = isRegister ? "HESAP OLUŞTUR" : "GİRİŞ YAP";
    showRegisterBtn.innerText = isRegister ? "Giriş Yap" : "Kayıt Ol";
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    if (isRegister) {
        auth.createUserWithEmailAndPassword(email, password).catch(err => alert(err.message));
    } else {
        auth.signInWithEmailAndPassword(email, password).catch(err => alert("Giriş başarısız."));
    }
});
logoutBtn.addEventListener('click', () => auth.signOut());


// --- 3. MESAJ VE DOSYA GÖNDERME ---

// Artı butonuna basınca dosya seçiciyi aç
attachBtn.addEventListener('click', () => {
    fileInput.click();
});

// Dosya seçilince Cloudinary'e yükle
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Yükleniyor efekti (ikonu değiştir)
    attachBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        // Yükleme başarılıysa linki al ve mesaj olarak at
        if (data.secure_url) {
            sendMessage(data.secure_url, data.resource_type); // type: 'image' veya 'video'
        }
    } catch (error) {
        console.error("Yükleme hatası:", error);
        alert("Dosya yüklenemedi.");
    } finally {
        // İkonu geri düzelt
        attachBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        fileInput.value = ''; // Inputu temizle
    }
});

// Metin Mesajı Gönderme
sendBtn.addEventListener('click', () => {
    const text = msgInput.value;
    if (text.trim() === '') return;
    sendMessage(text, 'text');
    msgInput.value = '';
});
msgInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendBtn.click(); });

// Ortak Gönderme Fonksiyonu
function sendMessage(content, type) {
    const user = auth.currentUser;
    if (user) {
        db.collection('messages').add({
            content: content,
            type: type, // 'text', 'image', 'video'
            sender: user.email,
            uid: user.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

// Mesajları Listeleme
function loadMessages() {
    db.collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot(snapshot => {
          messagesFeed.innerHTML = '';
          const currentUser = auth.currentUser.uid;

          snapshot.forEach(doc => {
              const msg = doc.data();
              const div = document.createElement('div');
              const typeClass = (msg.uid === currentUser) ? 'sent' : 'received';
              
              let time = '...';
              if(msg.timestamp) {
                  const date = msg.timestamp.toDate();
                  time = date.getHours() + ':' + (date.getMinutes()<10?'0':'') + date.getMinutes();
              }

              div.classList.add('message', typeClass);

              // İÇERİK TİPİNE GÖRE GÖSTERİM
              let innerContent = '';
              if (msg.type === 'text') {
                  innerContent = `<p>${msg.content}</p>`;
              } else if (msg.type === 'image') {
                  innerContent = `<img src="${msg.content}" style="max-width: 100%; border-radius: 10px;">`;
              } else if (msg.type === 'video') {
                  innerContent = `<video src="${msg.content}" controls style="max-width: 100%; border-radius: 10px;"></video>`;
              }

              div.innerHTML = `
                  ${innerContent}
                  <span class="msg-time">${time}</span>
              `;
              messagesFeed.appendChild(div);
          });
          messagesFeed.scrollTop = messagesFeed.scrollHeight;
      });
}

// Buton görselliği
document.querySelectorAll('.server-icon').forEach(icon => {
    icon.addEventListener('click', function() {
        if(!this.classList.contains('logout-btn')) {
            document.querySelectorAll('.server-icon').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});