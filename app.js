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

// --- 1. HESAP MAKİNESİ (IPHONE MANTIĞI) ---
const calculatorOverlay = document.getElementById('calculator-overlay');
const stealthBtn = document.getElementById('stealth-btn');
const exitCalcBtn = document.getElementById('exit-calc');

// iPhone Hesap Makinesi HTML Yapısını Oluşturuyoruz (JS ile inject ediyoruz ki temiz olsun)
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
        try {
            currentInput = eval(currentInput).toString();
        } catch {
            currentInput = 'Error';
        }
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

// Gizli Geçişler
stealthBtn.addEventListener('click', () => { calculatorOverlay.classList.remove('hidden'); });
exitCalcBtn.addEventListener('click', () => { calculatorOverlay.classList.add('hidden'); }); // Üst boşluğa tıklayınca kapanır


// --- 2. GİRİŞ VE KAYIT İŞLEMLERİ ---
let isRegister = false;

// Oturum Kontrolü
auth.onAuthStateChanged(user => {
    if (user) {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        loadMessages(); // Giriş yapınca mesajları yükle
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
        auth.signInWithEmailAndPassword(email, password).catch(err => alert("Giriş başarısız. Bilgileri kontrol et."));
    }
});

logoutBtn.addEventListener('click', () => auth.signOut());


// --- 3. MESAJLAŞMA SİSTEMİ (GERÇEK VERİTABANI) ---

// Mesaj Gönderme
function sendMessage() {
    const text = msgInput.value;
    if (text.trim() === '') return;

    const user = auth.currentUser;
    if (user) {
        // Firestore'a Kaydet
        db.collection('messages').add({
            text: text,
            sender: user.email,
            uid: user.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        msgInput.value = '';
    }
}

sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });


// Mesajları Canlı Dinleme (Real-time Listener)
function loadMessages() {
    db.collection('messages')
      .orderBy('timestamp', 'asc') // Eskiden yeniye sırala
      .onSnapshot(snapshot => {
          messagesFeed.innerHTML = ''; // Listeyi temizle
          const currentUser = auth.currentUser.uid;

          snapshot.forEach(doc => {
              const msg = doc.data();
              const div = document.createElement('div');
              // Mesaj bana mı ait başkasına mı?
              const type = (msg.uid === currentUser) ? 'sent' : 'received';
              
              // Zaman formatı
              let time = '...';
              if(msg.timestamp) {
                  const date = msg.timestamp.toDate();
                  time = date.getHours() + ':' + (date.getMinutes()<10?'0':'') + date.getMinutes();
              }

              div.classList.add('message', type);
              div.innerHTML = `
                  <p>${msg.text}</p>
                  <span class="msg-time">${time}</span>
              `;
              messagesFeed.appendChild(div);
          });
          // En alta kaydır
          messagesFeed.scrollTop = messagesFeed.scrollHeight;
      });
}

// Butonları Aktif Hissettirme (Boş olanlar için)
document.querySelectorAll('.server-icon').forEach(icon => {
    icon.addEventListener('click', function() {
        if(!this.classList.contains('logout-btn')) {
            document.querySelectorAll('.server-icon').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});