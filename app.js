// PWA (Uygulama) Kurulumu İçin Service Worker Kaydı
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Kayıtlı: ', reg.scope))
            .catch(err => console.log('SW Hata: ', err));
    });
}

// DOM Elementlerini Seçiyoruz
const stealthBtn = document.getElementById('stealth-btn'); // Gizli buton
const calculatorOverlay = document.getElementById('calculator-overlay'); // Hesap makinesi ekranı
const exitCalcBtn = document.getElementById('exit-calc'); // Gizli çıkış butonu
const messageInput = document.querySelector('.input-area input');
const sendBtn = document.querySelector('.send-btn');
const messagesContainer = document.querySelector('.messages-container');

// --- BUKALEMUN MODU (HESAP MAKİNESİ GEÇİŞİ) ---

// 1. Sohbet ekranındaki "Hesap Makinesi" ikonuna basınca aç
stealthBtn.addEventListener('click', () => {
    calculatorOverlay.classList.remove('hidden');
});

// 2. Hesap makinesindeki GİZLİ çıkış butonuna basınca kapan
// (Şu an '=' tuşunun yanındaki boşluğa koyduk)
exitCalcBtn.addEventListener('click', () => {
    calculatorOverlay.classList.add('hidden');
});

// --- BASİT SOHBET SİMÜLASYONU (GÖRÜNTÜ İÇİN) ---

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const text = messageInput.value;
    if (text.trim() === "") return;

    // Mesajı ekrana ekle (Senin tarafın)
    addMessageToScreen(text, 'sent');
    
    // Inputu temizle
    messageInput.value = '';

    // Otomatik cevap simülasyonu (Bot)
    setTimeout(() => {
        addMessageToScreen("Sistem: Mesaj şifreli olarak alındı.", 'received');
    }, 1000);
}

function addMessageToScreen(text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', type);
    
    const p = document.createElement('p');
    p.innerText = text;
    
    const timeSpan = document.createElement('span');
    timeSpan.classList.add('msg-time');
    const now = new Date();
    timeSpan.innerText = now.getHours() + ':' + (now.getMinutes()<10?'0':'') + now.getMinutes();

    if (type === 'sent') {
        timeSpan.innerHTML += ' <i class="fa-solid fa-check"></i>';
    }

    msgDiv.appendChild(p);
    msgDiv.appendChild(timeSpan);
    
    messagesContainer.appendChild(msgDiv);
    
    // En alta kaydır
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// --- HESAP MAKİNESİ FONKSİYONLARI ---
// Sadece görüntü olsun diye basit tuşlama
const calcScreen = document.querySelector('.calc-screen');
const calcButtons = document.querySelectorAll('.calc-buttons button');

calcButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = e.target.innerText;
        if (val === 'C') {
            calcScreen.innerText = '0';
        } else if (val !== 'X') { // Gizli çıkış butonu değilse
            if (calcScreen.innerText === '0') calcScreen.innerText = '';
            calcScreen.innerText += val;
        }
    });
});