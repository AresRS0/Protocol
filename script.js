// --- SADECE UI TESTİ İÇİN ---

const authLayer = document.getElementById('auth-layer');
const appLayer = document.getElementById('app-layer');
const switchBtn = document.getElementById('ui-switch-btn');

// Giriş Butonuna Basınca -> Discord Ekranını Aç
switchBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini engelle
    
    // Buton Efekti
    switchBtn.innerHTML = 'VERIFYING...';
    switchBtn.style.opacity = '0.7';
    
    // 1.5 Saniye sonra geçiş yap (Yükleniyor hissi)
    setTimeout(() => {
        authLayer.style.opacity = '0'; // Yavaşça kaybol
        authLayer.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            authLayer.classList.add('hidden'); // Tamamen gizle
            appLayer.classList.remove('hidden'); // Sohbeti aç
        }, 500);
        
    }, 1500);
});

// Inputlara Focus Efekti (Glitch)
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.style.borderColor = '#39F0D9';
        input.parentElement.style.boxShadow = '0 0 15px rgba(57,240,217,0.1)';
    });
    input.addEventListener('blur', () => {
        input.parentElement.style.borderColor = '#444';
        input.parentElement.style.boxShadow = 'none';
    });
});