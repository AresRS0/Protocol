// DOM elements
const signInContainer = document.getElementById('sign-in-container');
const registerContainer = document.getElementById('register-container');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const toStep2Button = document.getElementById('to-step-2');
const backToStep1Button = document.getElementById('back-to-step-1');
const timestampElement = document.getElementById('timestamp');
const inputFields = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');

// Mouse tracking
document.addEventListener('mousemove', (e) => {
  const x = e.clientX / window.innerWidth * 100;
  const y = e.clientY / window.innerHeight * 100;
  document.documentElement.style.setProperty('--mouse-x', `${x}%`);
  document.documentElement.style.setProperty('--mouse-y', `${y}%`);
});

// Toggle between sign in and registration forms
showRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  signInContainer.classList.add('hidden');
  registerContainer.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  registerContainer.classList.add('hidden');
  signInContainer.classList.remove('hidden');
});

// Remove step navigation handlers
document.getElementById('to-step-2')?.remove();
document.getElementById('to-step-3')?.remove();
document.getElementById('back-to-step-1')?.remove();
document.getElementById('back-to-step-2')?.remove();

// Form submissions
document.getElementById('sign-in-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const researcherId = document.getElementById('researcher-id').value;
  const clearanceCode = document.getElementById('clearance-code').value;
  
  if (researcherId === SECRET_CREDENTIALS.id && clearanceCode === SECRET_CREDENTIALS.code) {
    // Success state
    showAuthSuccess();
    return;
  }
  
  // Existing failure code
  loginAttemptsHandler.attempt();
});

// Fix registration form submission to properly display aptitude tests
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, setting up form handlers");
  
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    console.log("Register form found");
    
    // Clone and replace to remove existing event listeners
    const oldForm = registerForm;
    const newForm = oldForm.cloneNode(true);
    oldForm.parentNode.replaceChild(newForm, oldForm);
    
    newForm.addEventListener('submit', function(e) {
      console.log("Register form submitted");
      e.preventDefault();
      
      // Validate the form
      const nameInput = document.getElementById('new-researcher-name');
      const emailInput = document.getElementById('new-researcher-id');
      const passwordInput = document.getElementById('clearance-code-new');
      const protocolCheckbox = document.querySelector('.protocol-acceptance input[type="checkbox"]');
      
      let isValid = true;
      
      if (!nameInput || !nameInput.value.trim()) {
        if (nameInput) flashInputError(nameInput);
        isValid = false;
      }
      
      if (!emailInput || !emailInput.value.trim()) {
        if (emailInput) flashInputError(emailInput);
        isValid = false;
      }
      
      if (!passwordInput || !passwordInput.value.trim()) {
        if (passwordInput) flashInputError(passwordInput);
        isValid = false;
      }
      
      if (!protocolCheckbox || !protocolCheckbox.checked) {
        if (protocolCheckbox && protocolCheckbox.parentElement) {
          protocolCheckbox.parentElement.classList.add('error-flash');
          setTimeout(() => {
            protocolCheckbox.parentElement.classList.remove('error-flash');
          }, 1000);
        }
        isValid = false;
      }
      
      if (!isValid) {
        console.log("Form validation failed");
        return;
      }
      
      console.log("Form is valid, launching aptitude tests");
      launchAptitudeTests();
    });
    
    // Also add direct click handler to the submit button for extra reliability
    const initButton = newForm.querySelector('button[type="submit"]');
    if (initButton) {
      console.log("Init button found");
      initButton.addEventListener('click', function(e) {
        console.log("Init button clicked");
        // The form's submit event will handle this
      });
    }
  }
});

// Create a new, simplified function to ensure aptitude tests are displayed
function launchAptitudeTests() {
  console.log("Launching aptitude tests");
  
  const aptitudeContainer = document.querySelector('.aptitude-test-container');
  if (!aptitudeContainer) {
    console.error("Aptitude test container not found!");
    // Create a fallback container if it doesn't exist
    createFallbackAptitudeContainer();
    return;
  }
  
  // Make sure it's visible in the DOM
  aptitudeContainer.style.display = 'flex';
  aptitudeContainer.classList.remove('hidden');
  
  // Force browser reflow
  void aptitudeContainer.offsetWidth;
  
  // Add active class for animations and visibility
  aptitudeContainer.classList.add('active');
  
  console.log("Aptitude container activated");
  
  // Initialize test functionality if available
  if (typeof initializeCurrentTest === 'function') {
    setTimeout(() => {
      try {
        console.log("Initializing first test");
        initializeCurrentTest(1);
        
        if (typeof setupTestNavigation === 'function') {
          setupTestNavigation();
        }
      } catch (err) {
        console.error("Error initializing tests:", err);
      }
    }, 100);
  } else {
    console.error("Test initialization function not found");
  }
}

// Update timestamp every second
function updateTimestamp() {
  const now = new Date();
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  const formattedDate = now.toLocaleString('en-US', options)
    .replace(',', '')
    .replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2') + ' UTC';
  
  timestampElement.textContent = formattedDate;
}

// Initialize timestamp and update it every second
updateTimestamp();
setInterval(updateTimestamp, 1000);

// Input focus effects
inputFields.forEach(input => {
  input.addEventListener('focus', () => {
    const container = input.closest('.glass-panel');
    container.style.transform = 'scale(1.02) translateZ(20px)';
    playGlitchEffect(container);
  });
  
  input.addEventListener('blur', () => {
    const container = input.closest('.glass-panel');
    container.style.transform = '';
  });
});

// Helper functions
function flashInputError(inputElement) {
  inputElement.classList.add('error');
  inputElement.parentElement.querySelector('.input-glow').style.boxShadow = `0 0 var(--glow-strength) #f44336`;
  inputElement.parentElement.querySelector('.input-glow').style.opacity = '0.5';
  
  setTimeout(() => {
    inputElement.classList.remove('error');
    inputElement.parentElement.querySelector('.input-glow').style.boxShadow = '';
    inputElement.parentElement.querySelector('.input-glow').style.opacity = '';
  }, 1000);
}

// Fix the recursive function call that's causing a stack overflow
function playGlitchEffect(element) {
  const glitchLines = 3;
  const glitches = [];
  
  for (let i = 0; i < glitchLines; i++) {
    const glitch = document.createElement('div');
    glitch.className = 'glitch-line';
    glitch.style.top = `${Math.random() * 100}%`;
    glitch.style.left = `-10%`;
    glitch.style.width = '120%';
    glitch.style.height = '1px';
    glitch.style.background = `rgba(57, 240, 217, ${Math.random() * 0.5})`;
    glitch.style.transform = `translateY(${Math.random() * 10 - 5}px)`;
    element.appendChild(glitch);
    glitches.push(glitch);
  }
  
  setTimeout(() => {
    glitches.forEach(g => g.remove());
  }, 300);
}

// Modified to only show failure or processing (no success message)
function simulateFormSubmission(loadingMessage, successMessage) {
  // Function kept for compatibility but not used for authentication
  console.log(loadingMessage);
  // No overlay displayed anymore
}

// Add DNA particle system
function createParticleField() {
  const field = document.createElement('div');
  field.className = 'particle-field';
  document.body.appendChild(field);

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 20}s`;
    particle.style.opacity = Math.random() * 0.5 + 0.2;
    field.appendChild(particle);
  }
}

// Add scanner effect
function addScannerLine() {
  const scanner = document.createElement('div');
  scanner.className = 'scanner-line';
  document.querySelector('.glass-panel').appendChild(scanner);
}

// Add radar ping on click
document.addEventListener('click', (e) => {
  const ping = document.createElement('div');
  ping.className = 'radar-ping';
  ping.style.left = `${e.pageX}px`;
  ping.style.top = `${e.pageY}px`;
  document.body.appendChild(ping);
  
  setTimeout(() => ping.remove(), 2000);
});

// Glitch text effect
function glitchText(element) {
  element.classList.add('glitch-text');
  element.setAttribute('data-text', element.textContent);
  
  setTimeout(() => {
    element.classList.remove('glitch-text');
  }, 2000);
}

// Terminal typing effect
function typeText(element, text, speed = 50) {
  let index = 0;
  element.textContent = '';
  
  function type() {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

// Add topographic map overlay if missing
function addTopographicOverlay() {
  if (!document.querySelector('.topographic-overlay')) {
    const topo = document.createElement('div');
    topo.className = 'topographic-overlay';
    document.body.appendChild(topo);
  }
}

// Add classified stamp effect
function addClassifiedStamp() {
  if (!document.querySelector('.classified-stamp')) {
    const stamp = document.createElement('div');
    stamp.className = 'classified-stamp';
    stamp.textContent = 'LEVEL 4 CLEARANCE REQUIRED';
    document.querySelector('.glass-panel').appendChild(stamp);
  }
}

// Add flavor header function
function addFlavorHeader() {
  if (document.querySelector('.flavor-header')) return; // Don't create duplicate

  // Match disclaimer styling exactly
  const disclaimer = document.querySelector('.disclaimer');
  
  // Create the flavor header container
  const headerContainer = document.createElement('div');
  headerContainer.className = 'flavor-header';
  
  // Create the three components with styling matching disclaimer
  const batchFile = document.createElement('div');
  batchFile.className = 'header-batch';
  batchFile.textContent = 'CRYPTID_COLLECTIVE.SYS';
  
  // Generate semi-random coordinates
  const coordinates = document.createElement('div');
  coordinates.className = 'header-coordinates';
  const lat = (Math.random() * 75 * (Math.random() > 0.5 ? 1 : -1)).toFixed(6);
  const long = (Math.random() * 150 * (Math.random() > 0.5 ? 1 : -1)).toFixed(6);
  const alt = Math.floor(Math.random() * 2500);
  coordinates.textContent = `[${lat}, ${long}, ${alt}m]`;
  coordinates.setAttribute('data-original', coordinates.textContent);
  
  const latinPhrases = [
    "VIGILIA AETERNUS",
    "CRYPTOS REVELATIO",
    "VERITAS OCCULTA",
    "CUSTODES MYSTERIA",
    "INVENIT INCOGNITA",
    "MONSTRUM VESTIGIUM",
    "SCIENTIA ARCANA"
  ];
  const phrase = document.createElement('div');
  phrase.className = 'header-phrase';
  phrase.textContent = latinPhrases[Math.floor(Math.random() * latinPhrases.length)];
  
  // Assemble the header
  headerContainer.appendChild(batchFile);
  headerContainer.appendChild(coordinates);
  headerContainer.appendChild(phrase);
  
  // Add to the DOM - place at the top of the container
  const container = document.querySelector('.container');
  container.insertBefore(headerContainer, container.firstChild);
  
  // Add animation effect - terminal typing style
  setTimeout(() => {
    headerContainer.classList.add('header-appeared');
  }, 300);
}

// Function to glitch coordinates during security events
function glitchCoordinates(level) {
  const coordinates = document.querySelector('.header-coordinates');
  if (!coordinates) return;
  
  const originalText = coordinates.getAttribute('data-original');
  
  if (level === 'warning') {
    // Warning level - coordinates become unstable
    coordinates.classList.add('warning-flicker');
    
    // Change coordinates occasionally
    const glitchInterval = setInterval(() => {
      if (!document.body.classList.contains('security-breach')) {
        const glitchChance = Math.random();
        if (glitchChance > 0.7) {
          const lat = (Math.random() * 90 * (Math.random() > 0.5 ? 1 : -1)).toFixed(6);
          const long = (Math.random() * 180 * (Math.random() > 0.5 ? 1 : -1)).toFixed(6);
          const alt = Math.floor(Math.random() * 9000);
          coordinates.textContent = `[${lat}, ${long}, ${alt}m]`;
        } else {
          coordinates.textContent = originalText;
        }
      } else {
        clearInterval(glitchInterval);
      }
    }, 2000);
  } 
  else if (level === 'danger') {
    // Danger level - coordinates are corrupted with symbols
    coordinates.classList.remove('warning-flicker');
    coordinates.classList.add('danger-corrupt');
    coordinates.textContent = '[ERROR://COORD_OVERFLOW]';
  }
  else {
    // Reset
    coordinates.classList.remove('warning-flicker', 'danger-corrupt');
    coordinates.textContent = originalText;
  }
}

// Add the shine effect to the glass panel
function addShineEffect() {
  const glassPanels = document.querySelectorAll('.glass-panel');
  
  glassPanels.forEach(panel => {
    // Create shine effect element if it doesn't exist
    if (!panel.querySelector('.shine-effect')) {
      const shineEffect = document.createElement('div');
      shineEffect.className = 'shine-effect';
      panel.appendChild(shineEffect);
    }
  });
}

// Add terminal-style input prefixes and enhanced placeholders
function enhanceFormExperience() {
  // Add command-line style prefixes to inputs
  document.querySelectorAll('.form-group').forEach(group => {
    const inputEl = group.querySelector('input');
    const label = group.querySelector('label');
    
    if (inputEl && label) {
      // Add field prefix based on input type
      if (inputEl.id === 'researcher-id') {
        inputEl.setAttribute('placeholder', 'format: CC-XXXXX');
        // Create terminal prefix
        const prefix = document.createElement('span');
        prefix.className = 'input-prefix';
        prefix.textContent = '>';
        inputEl.parentNode.insertBefore(prefix, inputEl);
      } else if (inputEl.id === 'clearance-code') {
        inputEl.setAttribute('placeholder', '********');
        // Create terminal prefix for password
        const prefix = document.createElement('span');
        prefix.className = 'input-prefix secure';
        prefix.textContent = '#';
        inputEl.parentNode.insertBefore(prefix, inputEl);
      }
    }
  });
}

// Add field research environment status indicators
function addEnvironmentStatus() {
  if (document.querySelector('.environment-status')) return;
  
  const statusPanel = document.createElement('div');
  statusPanel.className = 'environment-status';
  
  // Create status indicators
  const indicators = [
    { label: 'SAT UPLINK', status: 'ONLINE', className: 'status-ok' },
    { label: 'EM SENSORS', status: 'ACTIVE', className: 'status-ok' },
    { label: 'PERIMETER', status: randomStatus(), className: randomStatusClass() }
  ];
  
  indicators.forEach(indicator => {
    const item = document.createElement('div');
    item.className = 'status-item';
    item.innerHTML = `<span class="status-label">${indicator.label}:</span> <span class="status-value ${indicator.className}">${indicator.status}</span>`;
    statusPanel.appendChild(item);
  });
  
  // Add the status panel to the sign-in form
  const form = document.getElementById('sign-in-form');
  form.appendChild(statusPanel);
  
  // Occasionally update the perimeter status
  setInterval(() => {
    const perimeterStatus = document.querySelector('.status-item:nth-child(3) .status-value');
    if (perimeterStatus) {
      perimeterStatus.textContent = randomStatus();
      perimeterStatus.className = `status-value ${randomStatusClass()}`;
    }
  }, 15000);
}

// Generate random statuses for the environment panel
function randomStatus() {
  const statuses = ['SECURE', 'ACTIVE', 'CAUTION', 'ALERT', 'SCANNING'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function randomStatusClass() {
  const statusClass = Math.random() > 0.7 ? 'status-warning' : 'status-ok';
  return statusClass;
}

// Add mission briefing note
function addMissionBriefing() {
  if (document.querySelector('.mission-note')) return;
  
  const missionTypes = [
    'RECON',
    'SPECIMEN COLLECTION',
    'WITNESS INTERVIEW',
    'ANOMALY VERIFICATION',
    'SITE MAPPING'
  ];
  
  const locations = [
    'PACIFIC NORTHWEST',
    'APPALACHIAN RIDGE',
    'LAKE CHAMPLAIN',
    'NEVADA TEST RANGE',
    'COASTAL WATERS'
  ];
  
  const mission = missionTypes[Math.floor(Math.random() * missionTypes.length)];
  const location = locations[Math.floor(Math.random() * locations.length)];
  
  const missionNote = document.createElement('div');
  missionNote.className = 'mission-note';
  missionNote.innerHTML = `<span class="mission-label">ACTIVE ASSIGNMENT:</span> ${mission} · ${location}`;
  
  const signInForm = document.getElementById('sign-in-form');
  if (signInForm) {
    signInForm.appendChild(missionNote);
  }
}

// Add biometric scanner for mobile
function addBiometricScanner() {
  const form = document.getElementById('sign-in-form');
  if (!form) return;
  
  const scannerContainer = document.createElement('div');
  scannerContainer.className = 'biometric-scanner mobile-only';
  
  // Add OR divider
  const divider = document.createElement('div');
  divider.className = 'auth-divider';
  divider.innerHTML = '<span>OR</span>';
  
  // Create scanner interface
  const scanner = document.createElement('div');
  scanner.className = 'fingerprint-scanner';
  scanner.innerHTML = `
    <div class="scanner-pad">
      <div class="scan-lines"></div>
      <div class="fingerprint-icon"></div>
      <div class="scan-result"></div>
    </div>
    <div class="scanner-label">PLACE FINGER ON SENSOR</div>
  `;
  
  // Add fake scanning interaction
  scanner.addEventListener('touchstart', startScanning);
  scanner.addEventListener('mousedown', startScanning);
  
  scannerContainer.appendChild(divider);
  scannerContainer.appendChild(scanner);
  
  // Insert after the authenticate button
  const authButton = form.querySelector('.btn-primary');
  authButton.parentNode.insertBefore(scannerContainer, authButton.nextSibling);
}

function startScanning(e) {
  e.preventDefault();
  const scanner = document.querySelector('.fingerprint-scanner');
  if (scanner.classList.contains('scanning')) return;
  
  scanner.classList.add('scanning');
  scanner.querySelector('.scanner-label').textContent = 'SCANNING...';
  
  // Get current security level
  const securityLevel = document.body.getAttribute('data-security-level') || 'normal';
  scanner.setAttribute('data-security-level', securityLevel);
  
  setTimeout(() => {
    scanner.classList.add('processing');
    scanner.querySelector('.scanner-label').textContent = 'PROCESSING...';
    
    setTimeout(() => {
      // Always fail the biometric scan
      scanner.classList.remove('scanning', 'processing');
      scanner.classList.add('scan-error');
      
      // Change error message based on security level
      let errorMessage = 'BIOMETRIC MISMATCH';
      if (securityLevel === 'warning') {
        errorMessage = 'SIGNATURE ANOMALY';
      } else if (securityLevel === 'danger') {
        errorMessage = 'CRITICAL AUTH FAILURE';
      }
      scanner.querySelector('.scanner-label').textContent = errorMessage;
      
      // Trigger failed login attempt
      window.loginAttemptsHandler.attempt();
      
      // Reset after delay
      setTimeout(() => {
        scanner.classList.remove('scan-error');
        scanner.removeAttribute('data-security-level');
        scanner.querySelector('.scanner-label').textContent = 'PLACE FINGER ON SENSOR';
      }, 2000);
    }, 1500);
  }, 2000);
}

// Add secret login credentials
const SECRET_CREDENTIALS = {
  id: 'CC-31415',
  code: 'CRYPTID-X'
};

function showAuthSuccess() {
  const successNotification = document.createElement('div');
  successNotification.className = 'auth-notification success';
  successNotification.textContent = 'WELCOME BACK, FIELD RESEARCHER';
  document.body.appendChild(successNotification);
  
  // Add success effects
  document.body.classList.add('auth-success');
  
  // Simulate system access
  setTimeout(() => {
    window.location.href = 'dashboard.html'; // Would redirect to dashboard if it existed
  }, 3000);
}

// Add thermal cursor hints
function addSecretHints() {
  const hints = [
    { text: 'ID FORMAT: CC-XXXXX', x: '15%', y: '20%' },
    { text: 'SPECIMEN CODE: CRYPTID', x: '85%', y: '40%' },
    { text: 'NUMERICAL KEY: 31415', x: '25%', y: '75%' },
    { text: 'DESIGNATION: X', x: '75%', y: '85%' }
  ];
  
  const hintContainer = document.createElement('div');
  hintContainer.className = 'thermal-hints';
  
  hints.forEach(hint => {
    const hintElement = document.createElement('div');
    hintElement.className = 'thermal-hint';
    hintElement.textContent = hint.text;
    hintElement.style.left = hint.x;
    hintElement.style.top = hint.y;
    hintContainer.appendChild(hintElement);
  });
  
  document.body.appendChild(hintContainer);
}

// Aptitude Tests System - Fixed
function startAptitudeTests() {
  console.log('Starting aptitude tests');
  
  // Create test container if it doesn't exist
  let aptitudeContainer = document.querySelector('.aptitude-test-container');
  
  if (!aptitudeContainer) {
    console.error('Aptitude container not found, creating fallback');
    
    // Create a simple fallback container
    aptitudeContainer = document.createElement('div');
    aptitudeContainer.className = 'aptitude-test-container';
    aptitudeContainer.innerHTML = `
      <div class="glass-panel aptitude-panel">
        <h2>Aptitude Test System</h2>
        <p>The test system cannot be loaded. Please try again.</p>
        <button type="button" class="btn-primary test-fallback-close">
          <span class="btn-text">RETURN</span>
        </button>
      </div>
    `;
    document.body.appendChild(aptitudeContainer);
    
    // Add close handler
    const closeBtn = aptitudeContainer.querySelector('.test-fallback-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        aptitudeContainer.classList.add('hidden');
        
        // Return to login form
        const registerContainer = document.getElementById('register-container');
        const signInContainer = document.getElementById('sign-in-container');
        
        if (registerContainer) registerContainer.classList.add('hidden');
        if (signInContainer) signInContainer.classList.remove('hidden');
      });
    }
  }
  
  // Make the container visible with a clear visual effect
  aptitudeContainer.style.display = 'flex';
  aptitudeContainer.classList.remove('hidden');
  
  // Force reflow to ensure transitions work
  void aptitudeContainer.offsetWidth;
  
  // Add active class with a slight delay
  setTimeout(() => {
    aptitudeContainer.classList.add('active');
    console.log('Aptitude container activated');
    
    // Initialize test content if available
    if (typeof initializeCurrentTest === 'function') {
      try {
        initializeCurrentTest(1);
        setupTestNavigation();
      } catch (err) {
        console.error('Error initializing tests:', err);
      }
    }
  }, 10);
}

// Initialize the current test based on test number
function initializeCurrentTest(testNumber) {
  // Hide all test sections and show current
  document.querySelectorAll('.test-section').forEach(section => {
    section.classList.remove('active');
  });
  
  const currentTest = document.querySelector(`.test-section[data-test="${testNumber}"]`);
  currentTest.classList.add('active');
  
  // Update progress indicator
  const progressFill = document.querySelector('.progress-fill');
  const progressLabel = document.querySelector('.progress-label');
  
  if (testNumber <= 3) {
    progressFill.style.width = `${(testNumber / 3) * 100}%`;
    progressLabel.textContent = `TEST ${testNumber}/3`;
  } else {
    progressFill.style.width = '100%';
    progressLabel.textContent = 'COMPLETE';
  }
  
  // Initialize specific test functionality
  switch(testNumber) {
    case 1:
      initPatternTest();
      break;
    case 2:
      initMemoryTest();
      break;
    case 3:
      initReactionTest();
      break;
    case 'results':
      initResultsScreen();
      break;
  }
  
  // Update continue button text
  const continueButton = document.querySelector('.test-continue');
  
  if (testNumber === 1) {
    continueButton.querySelector('.btn-text').textContent = 'BEGIN ASSESSMENT';
  } else if (testNumber === 'results') {
    continueButton.querySelector('.btn-text').textContent = 'FINALIZE REGISTRATION';
  } else {
    continueButton.querySelector('.btn-text').textContent = 'CONTINUE';
  }
}

// Set up next/continue button functionality
function setupTestNavigation() {
  console.log("Setting up test navigation");
  const continueButton = document.querySelector('.test-continue');
  
  if (!continueButton) {
    console.error("Continue button not found!");
    return;
  }
  
  let currentTestNumber = 1;
  let testResults = {
    pattern: false,
    memory: false,
    reaction: false
  };
  
  // Remove any existing event listeners (to prevent duplicates)
  const newButton = continueButton.cloneNode(true);
  if (continueButton.parentNode) {
    continueButton.parentNode.replaceChild(newButton, continueButton);
  }
  
  // Add event listener to the fresh button
  newButton.addEventListener('click', () => {
    console.log(`Test button clicked, current test: ${currentTestNumber}`);
    
    // Check if current test is passed
    if (currentTestNumber === 1) {
      testResults.pattern = checkPatternResult();
      console.log(`Pattern test result: ${testResults.pattern ? 'PASS' : 'FAIL'}`);
      
      if (!testResults.pattern) {
        showNotification('Please select the correct pattern', 'warning');
        flashButton(newButton);
        return;
      }
    } else if (currentTestNumber === 2) {
      testResults.memory = checkMemoryResult();
      console.log(`Memory test result: ${testResults.memory ? 'PASS' : 'FAIL'}`);
      
      if (!testResults.memory) {
        showNotification('Please identify all marker locations', 'warning');
        flashButton(newButton);
        return;
      }
    } else if (currentTestNumber === 3) {
      testResults.reaction = checkReactionResult();
      console.log(`Reaction test result: ${testResults.reaction ? 'PASS' : 'FAIL'}`);
      
      if (!testResults.reaction) {
        showNotification('Please capture all targets', 'warning');
        flashButton(newButton);
        return;
      }
    } else if (currentTestNumber === 'results') {
      completeRegistration();
      return;
    }
    
    // Move to next test
    if (currentTestNumber < 3) {
      currentTestNumber++;
    } else {
      currentTestNumber = 'results';
    }
    
    console.log(`Moving to test: ${currentTestNumber}`);
    initializeCurrentTest(currentTestNumber);
  });
}

// Flash button to indicate test not completed
function flashButton(button) {
  button.classList.add('shake');
  setTimeout(() => {
    button.classList.remove('shake');
  }, 500);
}

// Pattern Test Functions
function initPatternTest() {
  console.log("Initializing pattern test");
  const options = document.querySelectorAll('.pattern-option');
  
  // Clear previous selections
  options.forEach(option => {
    option.classList.remove('selected');
  });
  
  // Mark the first option (triangle) as correct using data attribute
  if (options.length > 0) {
    const triangleOption = Array.from(options).find(opt => 
      opt.textContent.includes('△') || 
      opt.textContent.trim() === '△'
    );
    
    if (triangleOption) {
      triangleOption.setAttribute('data-correct', 'true');
      triangleOption.classList.add('correct');
      console.log("Triangle option marked as correct");
    } else {
      // Fallback - mark the first option as correct if we can't find the triangle
      options[0].setAttribute('data-correct', 'true');
      options[0].classList.add('correct');
      console.log("First option marked as correct (fallback)");
    }
  }
  
  // Add click handlers to all options with improved reliability
  options.forEach((option, index) => {
    // Remove existing event listeners by cloning
    const newOption = option.cloneNode(true);
    if (option.parentNode) {
      option.parentNode.replaceChild(newOption, option);
    }
    
    // Add fresh event listener with enhanced logging
    newOption.addEventListener('click', () => {
      const optionText = newOption.textContent.trim();
      console.log(`Pattern option ${index} clicked: "${optionText}"`);
      console.log(`Option has data-correct: ${newOption.hasAttribute('data-correct')}`);
      
      // Deselect all options
      document.querySelectorAll('.pattern-option').forEach(o => {
        o.classList.remove('selected');
      });
      
      // Select clicked option
      newOption.classList.add('selected');
      
      // Add visual feedback
      const continueBtn = document.querySelector('.test-continue');
      if (continueBtn) {
        continueBtn.classList.add('pulse-once');
        setTimeout(() => continueBtn.classList.remove('pulse-once'), 500);
      }
    });
  });
}

function checkPatternResult() {
  const selectedOption = document.querySelector('.pattern-option.selected');
  
  if (!selectedOption) {
    console.log("No option selected");
    return false;
  }
  
  // Debug the selected option
  console.log(`Selected option: ${selectedOption.textContent.trim()}`);
  console.log(`Has correct data attribute: ${selectedOption.getAttribute('data-correct') === 'true'}`);
  console.log(`Has correct class: ${selectedOption.classList.contains('correct')}`);
  
  // Check multiple ways to determine if the option is correct
  const isCorrectByAttribute = selectedOption.getAttribute('data-correct') === 'true';
  const isCorrectByClass = selectedOption.classList.contains('correct');
  
  // For testing purposes, always force triangle (first option) to be correct
  const isFirstOption = Array.from(document.querySelectorAll('.pattern-option')).indexOf(selectedOption) === 0;
  
  // Log which method worked
  if (isCorrectByAttribute) console.log("Correct by data attribute");
  if (isCorrectByClass) console.log("Correct by class");
  if (isFirstOption) console.log("Correct by being first option (fallback)");
  
  // Return true if any method indicates it's correct
  return isCorrectByAttribute || isCorrectByClass || isFirstOption;
}

// Memory Test Functions
function initMemoryTest() {
  console.log("Initializing memory test");
  
  // Reset any previous state
  const recallSection = document.querySelector('.memory-recall');
  const mapSection = document.querySelector('.memory-map');
  const mapOverlay = document.querySelector('.map-overlay');
  
  // Ensure sections are properly set up
  if (recallSection) recallSection.classList.add('hidden');
  if (mapOverlay) {
    mapOverlay.classList.remove('visible');
    mapOverlay.textContent = '';
  }
  
  // Make sure the memory map is visible with the markers
  if (mapSection) {
    mapSection.classList.remove('hidden');
    mapSection.style.opacity = '1';
  }
  
  // Clear selections
  document.querySelectorAll('.recall-cell').forEach(cell => {
    cell.classList.remove('selected');
  });
  
  // Ensure the memory locations are visible at first
  document.querySelectorAll('.memory-marker').forEach(marker => {
    marker.style.opacity = '1';
  });
  
  // Start countdown
  let countdown = 5;
  const countdownSpan = document.querySelector('.countdown');
  if (countdownSpan) countdownSpan.textContent = countdown;
  
  console.log("Memory test countdown started");
  const countdownInterval = setInterval(() => {
    countdown--;
    if (countdownSpan) countdownSpan.textContent = countdown;
    
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      
      // Hide the markers by adding an overlay
      if (mapOverlay) {
        mapOverlay.classList.add('visible');
        mapOverlay.textContent = 'RECALL';
      }
      
      // Or hide the markers directly
      document.querySelectorAll('.memory-marker').forEach(marker => {
        marker.style.opacity = '0';
      });
      
      if (mapSection) {
        mapSection.style.opacity = '0.5'; // Dim the map to indicate recall mode
      }
      
      console.log("Memory markers hidden, showing recall grid");
      // Show recall grid after a moment
      setTimeout(() => {
        if (recallSection) recallSection.classList.remove('hidden');
        
        // Setup click handlers for recall cells
        document.querySelectorAll('.recall-cell').forEach(cell => {
          // Remove previous event listeners by cloning
          const newCell = cell.cloneNode(true);
          if (cell.parentNode) cell.parentNode.replaceChild(newCell, cell);
          
          newCell.addEventListener('click', () => {
            newCell.classList.toggle('selected');
            console.log(`Cell ${newCell.dataset.location} toggled`);
          });
        });
      }, 1000);
    }
  }, 1000);
}

function checkMemoryResult() {
  // Get selected cells
  const selectedCells = Array.from(document.querySelectorAll('.recall-cell.selected'));
  const selectedLocations = selectedCells.map(cell => cell.dataset.location);
  
  // Correct locations from the map
  const correctLocations = ['A3', 'C1', 'D4'];
  
  // Check if all correct and no incorrect
  const allCorrect = correctLocations.every(loc => selectedLocations.includes(loc));
  const noIncorrect = selectedLocations.every(loc => correctLocations.includes(loc));
  
  return allCorrect && noIncorrect;
}

// Reaction Test Functions
function initReactionTest() {
  const arena = document.querySelector('.reaction-arena');
  const counter = arena.querySelector('.capture-counter span');
  let captures = 0;
  
  // Reset counter
  counter.textContent = '0';
  
  // Clear any existing targets
  document.querySelectorAll('.cryptid-target').forEach(target => target.remove());
  
  // Function to create a target
  function createTarget() {
    if (captures >= 4) return; // Stop creating targets if threshold reached
    
    const target = document.createElement('div');
    target.className = 'cryptid-target';
    
    // Add the logo SVG image
    const logoImg = document.createElement('img');
    logoImg.src = 'logo.svg';
    logoImg.alt = 'Cryptid Collective Logo';
    logoImg.className = 'target-logo';
    target.appendChild(logoImg);
    
    // Random position
    const x = Math.floor(Math.random() * (arena.offsetWidth - 60)) + 10;
    const y = Math.floor(Math.random() * (arena.offsetHeight - 50)) + 10;
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
    
    // Random size (40-70px)
    const size = Math.floor(Math.random() * 30) + 40;
    logoImg.style.width = `${size}px`;
    logoImg.style.height = `${size}px`;
    
    // Add to arena
    arena.appendChild(target);
    
    // Make visible after a moment (allows transition)
    setTimeout(() => {
      target.classList.add('visible');
      
      // Capture click
      target.addEventListener('click', () => {
        target.classList.add('captured');
        captures++;
        counter.textContent = captures;
        
        // Play capture sound
        playCapturePing();
        
        // Remove after animation
        setTimeout(() => {
          target.remove();
        }, 500);
      });
      
      // Disappear after random time
      const disappearTime = Math.random() * 2000 + 1000;
      setTimeout(() => {
        if (target.parentNode) { // Check if still in DOM
          target.remove();
        }
      }, disappearTime);
      
    }, 100);
    
    // Create next target after random delay
    const nextTargetDelay = Math.random() * 1500 + 500;
    setTimeout(createTarget, nextTargetDelay);
  }
  
  // Start spawning targets
  setTimeout(createTarget, 500);
}

// Add a simple capture sound effect
function playCapturePing() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 880; // Higher frequency for success sound
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.value = 0.1;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
    
    setTimeout(() => {
      oscillator.stop();
    }, 200);
  } catch (e) {
    console.log('Audio context error:', e);
  }
}

// Check reaction test result
function checkReactionResult() {
  // Get the current number of captures from the counter
  const captureCounter = document.querySelector('.capture-counter span');
  
  if (!captureCounter) {
    console.error("Capture counter not found");
    return false;
  }
  
  const captures = parseInt(captureCounter.textContent || '0');
  console.log(`Reaction test captures: ${captures}/4`);
  
  // Test passes if user captured at least 4 targets
  return captures >= 4;
}

// Update the target logo styles to use black glow
const targetLogoStyles = document.createElement('style');
targetLogoStyles.textContent = `
  .cryptid-target {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.3s, transform 0.3s;
    cursor: pointer;
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.8));
  }
  
  .cryptid-target.visible {
    opacity: 1;
    transform: scale(1);
  }
  
  .cryptid-target.captured {
    transform: scale(1.5);
    opacity: 0;
    transition: transform 0.5s, opacity 0.5s;
  }
  
  .target-logo {
    width: 50px;
    height: 50px;
    object-fit: contain;
    filter: brightness(1.5) drop-shadow(0 0 3px #000);
  }
`;
document.head.appendChild(targetLogoStyles);

// Results Screen Functions
function initResultsScreen() {
  // Show success animations
  playSuccessEffects();
  
  // After delay, enable final button
  setTimeout(() => {
    document.querySelector('.test-continue').disabled = false;
  }, 2000);
}

function playSuccessEffects() {
  // Add scanner line animation
  const resultsPanel = document.querySelector('.results-panel');
  const scanner = document.createElement('div');
  scanner.className = 'scanner-line';
  resultsPanel.appendChild(scanner);
  
  // Play success sound
  playSuccessSound();
}

function playSuccessSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Create success sequence
  const notes = [440, 554, 659, 880];
  
  notes.forEach((freq, index) => {
    setTimeout(() => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.value = 0.1;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      
      setTimeout(() => {
        oscillator.stop();
      }, 500);
    }, index * 200);
  });
}

function completeRegistration() {
  // Show success message
  const successNotification = document.createElement('div');
  successNotification.className = 'auth-notification success';
  successNotification.textContent = 'FIELD RESEARCHER PROFILE INITIALIZED';
  document.body.appendChild(successNotification);
  
  console.log("Registration complete, returning to login");
  
  // Close aptitude test container
  const aptitudeContainer = document.querySelector('.aptitude-test-container');
  if (aptitudeContainer) {
    aptitudeContainer.classList.remove('active');
    
    // After delay, redirect to sign-in
    setTimeout(() => {
      aptitudeContainer.classList.add('hidden');
      aptitudeContainer.style.display = 'none'; // Ensure it's fully hidden
      
      // Return to login screen - make sure both steps happen
      const registerContainer = document.getElementById('register-container');
      const signInContainer = document.getElementById('sign-in-container');
      
      if (registerContainer) registerContainer.classList.add('hidden');
      if (signInContainer) signInContainer.classList.remove('hidden');
      
      // Force reflow
      void document.body.offsetWidth;
      
      // Show an additional success message
      showNotification('Registration complete. Welcome to Cryptid Collective!', 'success');
      
      // Remove the original success notification
      successNotification.remove();
    }, 3000);
  }
}

// Play error sound
function playErrorSound(frequency = 200, volume = 0.2) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.value = volume;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
    
    setTimeout(() => {
      oscillator.stop();
    }, 200);
  } catch (e) {
    console.log('Audio context error:', e);
  }
}

// Initialize effects
document.addEventListener('DOMContentLoaded', () => {
  createParticleField();
  addScannerLine();
  addTopographicOverlay(); // Add topographic map background
  addClassifiedStamp(); // Add classified stamp effect
  
  // Add flavor header
  addFlavorHeader();
  
  // Add glitch effect to headings
  document.querySelectorAll('h1').forEach(h1 => {
    h1.addEventListener('mouseover', () => glitchText(h1));
  });
  
  // Run typing effect on form labels only once at load time
  document.querySelectorAll('label').forEach(label => {
    const originalText = label.textContent;
    label.textContent = ''; // Clear the text first
    
    // Add a small delay for a staggered effect
    setTimeout(() => {
      typeText(label, originalText);
    }, 100 * Math.random() * 10); // Random delay between 0-1000ms
    
    // Remove the mouseenter event that would cause repeated typing
    label.removeEventListener('mouseenter', () => {
      typeText(label, originalText);
    });
  });
  
  // Create improved help hint with better formatting
  createHelpHint();
  
  // Add a subtle "field notes" timestamp label
  if (timestampElement) {
    const timeLabel = document.createElement('span');
    timeLabel.className = 'time-label';
    timeLabel.textContent = 'FIELD LOG: ';
    timestampElement.parentNode.insertBefore(timeLabel, timestampElement);
  }
  
  addShineEffect(); // Add the new shine effect
  
  // Add new immersive elements
  enhanceFormExperience();
  addEnvironmentStatus();
  addMissionBriefing();
  addBiometricScanner(); // Add biometric scanner for mobile
  
  // Add subtle animation to form elements
  animateFormElements();
  
  // Add secret hints
  addSecretHints();
});

// Create improved help hint with better formatting
function createHelpHint() {
  // Remove existing help hint if present
  document.querySelectorAll('.help-hint').forEach(hint => hint.remove());
  
  // Create new help hint with better structure
  const helpHint = document.createElement('div');
  helpHint.className = 'help-hint';
  
  // Improved HTML structure with better spacing
  helpHint.innerHTML = `
    <div class="help-hint-content">
      <div class="hint-item">
        <span class="hint-label">FIELD EQUIPMENT:</span> 
        <span class="hint-shortcut"><strong>M</strong></span> 
        <span class="hint-desc">for voice calibration</span>
      </div>
      <div class="hint-divider">|</div>
      <div class="hint-item">
        <span class="hint-shortcut"><strong>RESET</strong></span> 
        <span class="hint-desc">for system restart</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(helpHint);
  
  // Add CSS for the improved help hint
  const helpHintStyles = document.createElement('style');
  helpHintStyles.textContent = `
    .help-hint {
      position: fixed;
      bottom: 10px;
      left: 0;
      width: 100%;
      display: flex;
      justify-content: center;
      z-index: 100;
      pointer-events: none;
      font-family: var(--font-mono);
    }
    
    .help-hint-content {
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(57, 240, 217, 0.2);
      border-radius: 4px;
      padding: 4px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.7rem;
      color: var(--misty-gray);
      letter-spacing: 0.5px;
    }
    
    .hint-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .hint-label {
      color: var(--bioluminescent-teal);
      opacity: 0.8;
      margin-right: 4px;
    }
    
    .hint-shortcut {
      color: var(--bioluminescent-teal);
    }
    
    .hint-divider {
      color: rgba(96, 125, 139, 0.5);
      margin: 0 4px;
    }
    
    @media (max-width: 768px) {
      .help-hint-content {
        font-size: 0.6rem;
        padding: 3px 8px;
      }
      
      .hint-item {
        gap: 2px;
      }
      
      .hint-divider {
        margin: 0 2px;
      }
    }
  `;
  document.head.appendChild(helpHintStyles);
}

// Add subtle scanning animation to form
function animateFormElements() {
  const formGroups = document.querySelectorAll('.form-group');
  formGroups.forEach((group, index) => {
    setTimeout(() => {
      group.classList.add('scanned');
    }, index * 300);
  });
}

// Add the needed CSS for the loading overlay
const style = document.createElement('style');
style.textContent = `
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(30, 59, 44, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .scanning-effect {
    width: 300px;
    height: 5px;
    background: linear-gradient(to right, transparent, var(--bioluminescent-teal), transparent);
    position: relative;
    margin-bottom: 20px;
    overflow: hidden;
  }
  
  .scanning-effect::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, transparent, white, transparent);
    animation: scan 1.5s infinite;
  }
  
  .loading-text {
    font-family: var(--font-mono);
    color: var(--bioluminescent-teal);
    letter-spacing: 1px;
  }
  
  @keyframes scan {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .error-flash {
    animation: errorPulse 0.6s;
  }
  
  @keyframes errorPulse {
    0%, 100% { box-shadow: none; }
    50% { box-shadow: 0 0 8px #f44336; }
  }
`;
document.head.appendChild(style);

// Security system - track login attempts and activate lockout
document.addEventListener('DOMContentLoaded', function() {
  // Track login attempts
  let loginAttempts = 0;
  const MAX_ATTEMPTS = 3;
  
  // Define complete color schemes for different security states - completely remove green from warning/danger
  const colorSchemes = {
    normal: {
      // Primary colors
      '--expedition-green': '#1E3B2C',
      '--midnight-charcoal': '#2D3033',
      '--misty-gray': '#607D8B',
      
      // Accent colors
      '--bioluminescent-teal': '#39F0D9',
      '--evidence-amber': '#FF9800',
      '--scanner-green': '#76FF03',

      // Background colors
      '--background-primary': 'linear-gradient(135deg, #2D3033, #1E3B2C)',
      '--container-bg': 'rgba(45, 48, 51, 0.1)',
      '--container-border': 'rgba(255, 255, 255, 0.05)',
      '--container-shadow': '0 4px 30px rgba(0, 0, 0, 0.2), 0 0 50px rgba(57, 240, 217, 0.1), inset 0 0 15px rgba(57, 240, 217, 0.05)',
      '--particle-color': 'rgba(57, 240, 217, 0.6)',
      '--glitch-line-color': 'rgba(57, 240, 217, 0.5)'
    },
    warning: {
      // Primary colors - pure amber/gold with NO green
      '--expedition-green': '#664911', // Dark amber/gold instead of green
      '--midnight-charcoal': '#4D3B22', // Warm dark instead of charcoal
      '--misty-gray': '#B39356', // Gold-tinted gray
      
      // Accent colors - all amber/yellow family
      '--bioluminescent-teal': '#FFC107', // Yellow
      '--evidence-amber': '#FF9800', // Orange
      '--scanner-green': '#FFD740', // Gold

      // Background colors - warm amber
      '--background-primary': 'linear-gradient(135deg, #4D3B22, #664911)',
      '--container-bg': 'rgba(77, 59, 34, 0.1)',
      '--container-border': 'rgba(255, 193, 7, 0.1)',
      '--container-shadow': '0 4px 30px rgba(0, 0, 0, 0.2), 0 0 50px rgba(255, 193, 7, 0.2), inset 0 0 15px rgba(255, 193, 7, 0.1)',
      '--particle-color': 'rgba(255, 193, 7, 0.6)',
      '--glitch-line-color': 'rgba(255, 193, 7, 0.5)'
    },
    danger: {
      // Primary colors - complete red with NO green
      '--expedition-green': '#661111', // Dark red instead of green
      '--midnight-charcoal': '#4D2222', // Red dark instead of charcoal
      '--misty-gray': '#B35656', // Red-tinted gray
      
      // Accent colors - all red family
      '--bioluminescent-teal': '#F44336', // Red
      '--evidence-amber': '#FF5722', // Deep orange
      '--scanner-green': '#FF1744', // Red accent

      // Background colors - deep red
      '--background-primary': 'linear-gradient(135deg, #4D2222, #661111)',
      '--container-bg': 'rgba(77, 34, 34, 0.2)',
      '--container-border': 'rgba(244, 67, 54, 0.1)',
      '--container-shadow': '0 4px 30px rgba(0, 0, 0, 0.3), 0 0 50px rgba(244, 67, 54, 0.2), inset 0 0 15px rgba(244, 67, 54, 0.1)',
      '--particle-color': 'rgba(244, 67, 54, 0.6)',
      '--glitch-line-color': 'rgba(244, 67, 54, 0.5)'
    }
  };
  
  // Get form element
  const loginForm = document.getElementById('login-form') || document.querySelector('form');
  
  // Find or create security indicators if they don't exist
  if (!document.querySelector('.security-indicators')) {
    // Create security indicators inside the authenticate button
    const authButton = document.querySelector('.btn-primary');
    
    const indicators = document.createElement('div');
    indicators.className = 'security-indicators';
    
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const dot = document.createElement('div');
      dot.className = 'indicator';
      indicators.appendChild(dot);
    }
    
    authButton.appendChild(indicators);
  }
  
  // Create notification element for auth failures
  const notification = document.createElement('div');
  notification.className = 'auth-notification';
  notification.style.display = 'none';
  document.body.appendChild(notification); // Append to body instead of glass panel for better visibility
  
  // Expose the attempt function for the form submit handler
  window.loginAttemptsHandler = {
    attempt: function() {
      loginAttempts++;
      updateSecurityIndicators();
      
      // Update color scheme based on attempts
      updateColorScheme(loginAttempts);
      
      // Show aggressive failure notification
      showAuthFailure(loginAttempts);
      
      if (loginAttempts >= MAX_ATTEMPTS) {
        activateLockout();
      }
    }
  };
  
  // Original form submit handler remains for compatibility with existing code
  if (loginForm) {
    // Keep existing handler but make it a no-op to avoid double-counting attempts
    loginForm.removeEventListener('submit', originalSubmitHandler);
  }
  
  function originalSubmitHandler(event) {
    event.preventDefault();
  }
  
  // Update indicators based on failed attempts
  function updateSecurityIndicators() {
    const indicators = document.querySelectorAll('.indicator');
    
    indicators.forEach((indicator, index) => {
      if (index < loginAttempts) {
        indicator.classList.remove('active');
        
        if (loginAttempts === MAX_ATTEMPTS - 1 && index === loginAttempts - 1) {
          // Last attempt - warning state
          indicator.classList.add('warning');
        } else if (loginAttempts === MAX_ATTEMPTS) {
          // Lockout - danger state
          indicator.classList.add('danger');
        } else {
          // Normal failed attempt
          indicator.classList.add('active');
        }
      }
    });
  }
  
  // Update color scheme based on number of failed attempts
  function updateColorScheme(attempts) {
    let scheme;
    
    if (attempts === 1) {
      scheme = colorSchemes.normal; 
      document.body.setAttribute('data-security-level', 'normal');
    } else if (attempts === 2) {
      scheme = colorSchemes.warning; 
      document.body.setAttribute('data-security-level', 'warning');
    } else if (attempts >= 3) {
      scheme = colorSchemes.danger;
      document.body.setAttribute('data-security-level', 'danger');
    }
    
    // Apply the complete color scheme to CSS variables
    for (const [variable, value] of Object.entries(scheme)) {
      document.documentElement.style.setProperty(variable, value);
    }
    
    // Apply additional style changes based on security state
    const glassPanel = document.querySelector('.glass-panel');
    
    if (attempts === 2) {
      // Update background gradient
      document.querySelector('.background').style.background = scheme['--background-primary'];
      
      // Update glassmorphism panel
      if (glassPanel) {
        glassPanel.style.background = scheme['--container-bg'];
        glassPanel.style.borderColor = scheme['--container-border'];
        glassPanel.style.boxShadow = scheme['--container-shadow'];
        glassPanel.classList.add('warning-pulse');
      }
      
      // Update ALL color elements to match warning scheme
      document.querySelectorAll('.particle').forEach(particle => {
        particle.style.background = scheme['--particle-color'];
      });
      
      // Update scanner line color
      document.querySelector('.scanner-line').style.background = 
        `linear-gradient(90deg, transparent, ${scheme['--bioluminescent-teal']}, transparent)`;
        
      // Update any glitch lines that might appear
      document.querySelectorAll('.glitch-line').forEach(line => {
        line.style.background = scheme['--glitch-line-color'];
      });
      
      // Update radar pings
      document.documentElement.style.setProperty('--ping-color', scheme['--bioluminescent-teal']);
      
      // Update flavor header
      glitchCoordinates('warning');
      document.querySelector('.header-batch').classList.add('warning-alert');
    } 
    else if (attempts >= 3) {
      // Update background gradient more intensely
      document.querySelector('.background').style.background = scheme['--background-primary'];
      
      // Update glassmorphism panel to danger state
      if (glassPanel) {
        glassPanel.classList.remove('warning-pulse');
        glassPanel.style.background = scheme['--container-bg'];
        glassPanel.style.borderColor = scheme['--container-border'];
        glassPanel.style.boxShadow = scheme['--container-shadow'];
        glassPanel.classList.add('danger-pulse');
      }
      
      // Update ALL color elements to match danger scheme
      document.querySelectorAll('.particle').forEach(particle => {
        particle.style.background = scheme['--particle-color'];
      });
      
      // Update scanner line color
      document.querySelector('.scanner-line').style.background = 
        `linear-gradient(90deg, transparent, ${scheme['--bioluminescent-teal']}, transparent)`;
      
      // Update any glitch lines that might appear
      document.querySelectorAll('.glitch-line').forEach(line => {
        line.style.background = scheme['--glitch-line-color'];
      });
      
      // Update radar pings
      document.documentElement.style.setProperty('--ping-color', scheme['--bioluminescent-teal']);
      
      // Update flavor header
      glitchCoordinates('danger');
      document.querySelector('.header-batch').classList.add('danger-alert');
      document.querySelector('.header-batch').classList.remove('warning-alert');
      document.querySelector('.header-phrase').classList.add('danger-text');
    }
    
    // Apply color updates to biometric scanner
    const scanner = document.querySelector('.fingerprint-scanner');
    if (scanner) {
      const scannerPad = scanner.querySelector('.scanner-pad');
      const scanLines = scanner.querySelector('.scan-lines');
      
      if (attempts === 1) {
        scannerPad.style.borderColor = scheme['--bioluminescent-teal'];
        scannerPad.style.boxShadow = `0 0 15px ${scheme['--bioluminescent-teal']}`;
        scanLines.style.background = `repeating-linear-gradient(transparent, transparent 2px, ${scheme['--bioluminescent-teal']} 2px, ${scheme['--bioluminescent-teal']} 4px)`;
      } else if (attempts === 2) {
        scannerPad.style.borderColor = scheme['--evidence-amber'];
        scannerPad.style.boxShadow = `0 0 15px ${scheme['--evidence-amber']}`;
        scanLines.style.background = `repeating-linear-gradient(transparent, transparent 2px, ${scheme['--evidence-amber']} 2px, ${scheme['--evidence-amber']} 4px)`;
      } else if (attempts >= 3) {
        scannerPad.style.borderColor = scheme['--bioluminescent-teal'];
        scannerPad.style.boxShadow = `0 0 20px ${scheme['--bioluminescent-teal']}`;
        scanLines.style.background = `repeating-linear-gradient(transparent, transparent 2px, ${scheme['--bioluminescent-teal']} 2px, ${scheme['--bioluminescent-teal']} 4px)`;
      }
    }
  }
  
  // Show authentication failure notification
  function showAuthFailure(attempt) {
    let message, severity;
    
    if (attempt === 1) {
      message = 'FIELD EQUIPMENT CALIBRATION ERROR... TRY AGAIN!';
      severity = 'notice'; // Changed from 'error' to 'notice' for green state
    } else if (attempt === 2) {
      message = 'EXPEDITION ALERT: ACCESS ANOMALY DETECTED';
      severity = 'warning';
      
      // Add coordinate scrambling effect for warning state
      document.querySelector('.coordinates').innerHTML = generateRandomCoordinates();
      document.querySelector('.coordinates').classList.add('warning-flicker');
    } else {
      message = 'CRITICAL: UNAUTHORIZED ACCESS PROTOCOL';
      severity = 'critical';
      
      // Show random cryptid silhouette at danger state
      showRandomCryptid();
    }
    
    notification.textContent = message;
    notification.className = `auth-notification ${severity}`;
    notification.style.display = 'block';
    
    // For critical notifications, position in the center of the screen
    if (attempt === 3) {
      notification.style.position = 'fixed';
      notification.style.top = '50%';
      notification.style.left = '50%';
      notification.style.transform = 'translate(-50%, -50%)';
      notification.style.zIndex = '10000'; // Ensure it's above everything
      notification.style.padding = '20px 30px';
      notification.style.fontSize = '1.2rem';
      notification.style.boxShadow = '0 0 30px rgba(244, 67, 54, 0.4)';
    } else {
      // Reset position for non-critical notifications
      notification.style.position = 'absolute';
      notification.style.top = '10px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.zIndex = '100';
      notification.style.padding = '';
      notification.style.fontSize = '';
      notification.style.boxShadow = '';
    }
    
    // Add typing terminal effect to error notification
    simulateTyping(notification, notification.textContent);
    
    // Shake the form panel
    const glassPanel = document.querySelector('.glass-panel');
    glassPanel.classList.add('shake');
    setTimeout(() => glassPanel.classList.remove('shake'), 500);
    
    // Play error sound with increasing intensity
    const frequency = 200 + (attempt * 100);
    playErrorSound(frequency, 0.2 + (attempt * 0.1));
    
    // Hide notification after delay (longer for critical)
    setTimeout(() => {
      notification.style.display = 'none';
      
      // Only first failure gets audio feedback to avoid overwhelming
      if (attempt === 1) {
        speakNotification("Field equipment calibration error. Please recalibrate access credentials.");
      } else if (attempt === 2) {
        speakNotification("Alert. Unauthorized access attempt detected. Security protocols engaged.");
      }
    }, attempt === 3 ? 5000 : 3000); // Longer display time for critical notification
  }
  
  // Generate random coordinates for warning state
  function generateRandomCoordinates() {
    const lat = (Math.random() * 180 - 90).toFixed(6);
    const lng = (Math.random() * 360 - 180).toFixed(6);
    return `LAT: ${lat} LNG: ${lng}`;
  }
  
  // Show a random cryptid silhouette
  function showRandomCryptid() {
    const cryptids = [
      'M10,30 C20,10 40,10 50,30 C40,15 20,15 10,30 Z', // Sea monster
      'M10,10 L20,30 L30,10 Q20,0 10,10 Z', // Mothman
      'M5,20 Q15,5 25,20 Q35,5 45,20 L45,30 Q25,40 5,30 Z' // UFO
    ];
    
    const cryptid = document.createElement('div');
    cryptid.className = 'danger-cryptid';
    const randomCryptid = cryptids[Math.floor(Math.random() * cryptids.length)];
    
    cryptid.innerHTML = `<svg viewBox="0 0 50 40" xmlns="http://www.w3.org/2000/svg">
      <path d="${randomCryptid}" fill="rgba(244, 67, 54, 0.3)" />
    </svg>`;
    
    document.body.appendChild(cryptid);
    
    setTimeout(() => {
      cryptid.classList.add('fade-out');
      setTimeout(() => cryptid.remove(), 1000);
    }, 3000);
  }
  
  // Text corruption effect for danger state
  function corruptText(element) {
    const originalText = element.textContent;
    const corruptChars = '!@#$%^&*<>/\\|{}[]01';
    
    let timesRun = 0;
    const corruptionInterval = setInterval(() => {
      timesRun++;
      if (timesRun > 20) {
        clearInterval(corruptionInterval);
        setTimeout(() => {
          element.textContent = originalText; // Reset eventually
        }, 5000);
        return;
      }
      
      // Corrupt a random selection of characters
      let corruptedText = '';
      for (let i = 0; i < originalText.length; i++) {
        if (Math.random() > 0.7) {
          corruptedText += corruptChars.charAt(Math.floor(Math.random() * corruptChars.length));
        } else {
          corruptedText += originalText.charAt(i);
        }
      }
      
      element.textContent = corruptedText;
    }, 200);
  }
  
  // Simulate typing effect
  function simulateTyping(element, finalText, speed = 30) {
    const originalText = finalText;
    element.textContent = '';
    
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < originalText.length) {
        element.textContent += originalText.charAt(i);
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, speed);
  }
  
  // Scramble timestamp during danger state
  function startGlitchingTimestamp() {
    const timestamp = document.getElementById('timestamp');
    if (!timestamp) return;
    
    const originalUpdateTimestamp = updateTimestamp;
    updateTimestamp = function() {
      const now = new Date();
      // Generate random parts of timestamp
      const year = Math.floor(Math.random() * 50) + 2000;
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      
      const glitchedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')} UTC`;
      
      timestamp.textContent = glitchedDate;
    };
  }
  
  // Text-to-speech notifications (with optional mute)
  function speakNotification(text) {
    const brandedMessages = {
      "Authentication unsuccessful. Please try again.": "Field equipment calibration error. Please recalibrate access credentials.",
      "Warning. Security breach imminent.": "Alert. Unauthorized access attempt detected. Security protocols engaged.",
      "Critical security breach detected. System lockdown initiated.": "Critical alert. Security containment protocols activated. System locked for specimen protection."
    };
    
    // Use branded version if available
    const brandedText = brandedMessages[text] || text;
    
    if (window.speechSynthesis && !window.muteVoiceFeedback) {
      const speech = new SpeechSynthesisUtterance(brandedText);
      speech.volume = 0.7;
      speech.rate = 0.9;
      speech.pitch = 0.9;
      window.speechSynthesis.speak(speech);
    }
  }

  // Voice feedback toggle
  window.toggleVoiceFeedback = function() {
    window.muteVoiceFeedback = !window.muteVoiceFeedback;
    const status = window.muteVoiceFeedback ? "muted" : "enabled";
    
    // Show feedback
    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'temp-feedback';
    feedbackEl.textContent = `Voice alerts ${status}`;
    document.body.appendChild(feedbackEl);
    
    setTimeout(() => {
      feedbackEl.remove();
    }, 2000);
  };
  
  // Add "M" keybinding to toggle voice
  document.addEventListener('keydown', function(e) {
    // Press M key to toggle mute
    if (e.keyCode === 77) {
      window.toggleVoiceFeedback();
    }
  });
});

// Activate dramatic lockout state
function activateLockout() {
  const glassPanel = document.querySelector('.glass-panel');
  glassPanel.classList.add('lockout');
  
  // Create and inject a powerful SVG filter that will apply to everything
  const svgFilter = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgFilter.style.width = '0';
  svgFilter.style.height = '0';
  svgFilter.style.position = 'absolute';
  svgFilter.setAttribute('aria-hidden', 'true');
  svgFilter.innerHTML = `
    <defs>
      <filter id="security-breach-filter">
        <!-- Turn everything red -->
        <feColorMatrix type="matrix" values="
          1.0 0.0 0.0 0 0.2
          0.2 0.3 0.0 0 0
          0.2 0.0 0.3 0 0
          0   0   0   1 0" />
      </filter>
    </defs>
  `;
  document.body.appendChild(svgFilter);
  
  // Apply filter to the HTML element (highest level)
  document.documentElement.classList.add('security-breach-active');
  
  // Force all elements to use red colors by adding a special class to <html>
  document.documentElement.classList.add('total-breach');
  
  // Create a full-screen overlay with warning pattern
  const breachOverlay = document.createElement('div');
  breachOverlay.className = 'breach-overlay';
  document.body.appendChild(breachOverlay);
  
  // Continue with the rest of the lockout sequence
  document.body.classList.add('security-breach');
  
  // DIRECT STYLE OVERRIDES - Force specific elements to be red that might resist the CSS rules
  
  // Force the authenticate button to red
  const authButton = document.querySelector('.btn-primary');
  if (authButton) {
    authButton.style.backgroundColor = 'rgba(153, 0, 0, 0.3)';
    authButton.style.borderColor = 'rgba(255, 0, 0, 0.4)';
    authButton.style.color = '#ff6666';
    authButton.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.4)';
    
    // Also force any child elements to be red
    authButton.querySelectorAll('*').forEach(el => {
      el.style.color = '#ff6666';
      el.style.borderColor = 'rgba(255, 0, 0, 0.4)';
    });
  }
  
  // Force all input fields to red
  document.querySelectorAll('input').forEach(input => {
    input.style.borderColor = '#990000';
    input.style.color = '#ff6666';
    input.style.boxShadow = 'none';
    
    // Force the glow element next to inputs to be red
    const glow = input.parentElement.querySelector('.input-glow');
    if (glow) {
      glow.style.boxShadow = '0 0 8px rgba(255, 0, 0, 0.4)';
      glow.style.backgroundColor = 'rgba(153, 0, 0, 0.1)';
    }
  });
  
  // Force the classified stamp to be red
  const stamp = document.querySelector('.classified-stamp');
  if (stamp) {
    stamp.style.color = 'rgba(255, 0, 0, 0.7)';
    stamp.style.borderColor = 'rgba(255, 0, 0, 0.7)';
    stamp.textContent = 'EMERGENCY: UNAUTHORIZED ACCESS';
  }
  
  // Force all particles to be red
  document.querySelectorAll('.particle').forEach(particle => {
    particle.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
    particle.style.boxShadow = '0 0 3px rgba(255, 0, 0, 0.6)';
  });
  
  // Force scanner line to be red
  const scanner = document.querySelector('.scanner-line');
  if (scanner) {
    scanner.style.background = 'linear-gradient(90deg, transparent, rgba(255, 0, 0, 0.8), transparent)';
    scanner.style.opacity = '0.8';
    scanner.style.height = '3px';
    scanner.style.animationDuration = '0.5s';
  }
  
  // Add audio alert
  speakNotification("Critical security breach detected. System lockdown initiated.");
  
  // Make the entire screen pulse red
  document.documentElement.classList.add('red-pulse');
  
  // Create lockout message if it doesn't exist
  if (!document.querySelector('.lockout-message')) {
    const lockoutMsg = document.createElement('div');
    lockoutMsg.className = 'lockout-message';
    lockoutMsg.innerHTML = '<span class="alert-prefix">ALERT:</span> SECURITY PROTOCOL ACTIVATED<span>System locked. Unauthorized access detected.</span><span class="small-text">Reload page to reset</span>';
    glassPanel.appendChild(lockoutMsg);
    
    // Force the lockout message to have the right colors
    lockoutMsg.style.color = '#ff3333';
    lockoutMsg.style.borderColor = '#990000';
    lockoutMsg.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  }
}

// Reset function should also reset the filter and all inline styles
function resetSystem() {
  // Remove red filter
  document.documentElement.classList.remove('red-filter-active', 'red-pulse');
  
  // Remove the SVG filter
  document.querySelectorAll('#security-breach-filter').forEach(el => el.remove());
  document.documentElement.classList.remove('security-breach-active', 'total-breach');
  
  // Remove the breach overlay
  document.querySelector('.breach-overlay')?.remove();
  
  // Reset inline styles
  document.querySelectorAll('.btn-primary, input, .input-glow, .classified-stamp, .particle, .scanner-line').forEach(el => {
    el.removeAttribute('style');
  });
  
  // Reset flavor header
  glitchCoordinates('normal');
  const batchElement = document.querySelector('.header-batch');
  if (batchElement) {
    batchElement.classList.remove('warning-alert', 'danger-alert');
  }
  const phraseElement = document.querySelector('.header-phrase');
  if (phraseElement) {
    phraseElement.classList.remove('danger-text');
  }
}

// Initialize custom toggles
document.addEventListener('DOMContentLoaded', () => {
  setupCustomToggles();
});

function setupCustomToggles() {
  // Find all custom toggle containers
  const toggleContainers = document.querySelectorAll('.custom-toggle-container');
  
  toggleContainers.forEach(container => {
    const toggle = container.querySelector('.custom-toggle');
    const hiddenInput = container.querySelector('input[type="hidden"]');
    
    // Set initial state based on input value
    if (hiddenInput && hiddenInput.value === "true") {
      toggle.classList.add('checked');
    }
    
    // Add click handler
    container.addEventListener('click', () => {
      // Toggle visual state
      toggle.classList.toggle('checked');
      
      // Update hidden input value for form submission
      if (hiddenInput) {
        hiddenInput.value = toggle.classList.contains('checked') ? "true" : "false";
      }
      
      // Trigger change event for any listeners
      const event = new Event('change', { bubbles: true });
      container.dispatchEvent(event);
    });
    
    // Make it keyboard accessible
    container.setAttribute('tabindex', '0');
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        container.click();
      }
    });
  });
}

// Function to check if a custom toggle is checked
function isCustomToggleChecked(toggleId) {
  const toggle = document.querySelector(`#${toggleId}-toggle`);
  return toggle && toggle.classList.contains('checked');
}

// Initialize forms and handlers
document.addEventListener('DOMContentLoaded', () => {
  initForms();
  console.log('Init complete - form handlers ready');
});

function initForms() {
  // Find all forms
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    // Add submission handler
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Log form submission
      const formType = this.dataset.formType || this.id || 'unknown';
      console.log(`${formType} form submitted`);
      
      // Handle registration form differently than login
      if (formType === 'register-form' || formType === 'register') {
        console.log('Registration form detected - launching aptitude tests');
        
        // Validate the form first
        let isValid = validateRegistrationForm(this);
        
        if (isValid) {
          // Launch aptitude test instead of showing success
          launchAptitudeTests();
        } else {
          console.log('Registration validation failed');
        }
        return; // Exit early for registration form
      }
      
      // Continue with normal validation and authentication for login form
      if (validateForm(this)) {
        console.log('Form validation successful');
        
        // Simulate successful submission
        const submitButton = this.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.innerHTML = `<span>Processing...</span>`;
        }
        
        // For demo purposes - simulate success notification for login only
        setTimeout(() => {
          showNotification('Authentication successful', 'success');
          
          // For demonstration - redirect after successful login
          setTimeout(() => {
            // Only for login form
            showNotification('Redirecting to secure area...', 'notice');
          }, 2000);
        }, 1500);
      } else {
        console.log('Form validation failed');
      }
    });
  });
  
  // Add button click handler for init
  const initButton = document.querySelector('.btn-init');
  if (initButton) {
    initButton.addEventListener('click', () => {
      console.log('Init button clicked');
    });
  }
}

// Add a specific validation function for registration
function validateRegistrationForm(form) {
  let isValid = true;
  
  // Check required fields
  const nameInput = form.querySelector('#new-researcher-name');
  const emailInput = form.querySelector('#new-researcher-id');
  const passwordInput = form.querySelector('#clearance-code-new');
  
  if (nameInput && !nameInput.value.trim()) {
    flashInputError(nameInput);
    isValid = false;
  }
  
  if (emailInput && !emailInput.value.trim()) {
    flashInputError(emailInput);
    isValid = false;
  }
  
  if (passwordInput && !passwordInput.value.trim()) {
    flashInputError(passwordInput);
    isValid = false;
  }
  
  // Check protocol acceptance (using either checkbox or custom toggle)
  const protocolCheckbox = form.querySelector('.protocol-acceptance input[type="checkbox"]');
  const protocolToggle = form.querySelector('#protocol-checkbox-toggle');
  
  let protocolAccepted = false;
  
  if (protocolCheckbox && protocolCheckbox.checked) {
    protocolAccepted = true;
  } else if (protocolToggle && protocolToggle.classList.contains('checked')) {
    protocolAccepted = true;
  }
  
  if (!protocolAccepted) {
    // Flash error on the protocol acceptance container
    const container = form.querySelector('.protocol-acceptance');
    if (container) {
      container.classList.add('error-flash');
      setTimeout(() => {
        container.classList.remove('error-flash');
      }, 1000);
    }
    
    // Show specific error message
    showNotification('You must acknowledge the Field Protocol to continue', 'error');
    isValid = false;
  }
  
  return isValid;
}

// Make sure launchAptitudeTests is more robust
function launchAptitudeTests() {
  console.log("Launching aptitude tests");
  
  const aptitudeContainer = document.querySelector('.aptitude-test-container');
  if (!aptitudeContainer) {
    console.error("Aptitude test container not found!");
    // Create a fallback container if it doesn't exist
    createFallbackAptitudeContainer();
    return;
  }
  
  // Make sure it's visible in the DOM
  aptitudeContainer.style.display = 'flex';
  aptitudeContainer.classList.remove('hidden');
  
  // Force browser reflow
  void aptitudeContainer.offsetWidth;
  
  // Add active class for animations and visibility
  aptitudeContainer.classList.add('active');
  
  console.log("Aptitude container activated");
  
  // Initialize test functionality if available
  if (typeof initializeCurrentTest === 'function') {
    setTimeout(() => {
      try {
        console.log("Initializing first test");
        initializeCurrentTest(1);
        
        if (typeof setupTestNavigation === 'function') {
          setupTestNavigation();
        }
      } catch (err) {
        console.error("Error initializing tests:", err);
      }
    }, 100);
  } else {
    console.error("Test initialization function not found");
  }
}

// Create a fallback container if the aptitude test container is missing
function createFallbackAptitudeContainer() {
  const fallbackContainer = document.createElement('div');
  fallbackContainer.className = 'aptitude-test-container active';
  fallbackContainer.style.display = 'flex';
  
  fallbackContainer.innerHTML = `
    <div class="glass-panel aptitude-panel">
      <div class="test-header">
        <h2>Field Researcher Aptitude Assessment</h2>
        <div class="test-progress">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-label">TEST 1/3</div>
        </div>
      </div>
      
      <div class="test-section active" data-test="1">
        <h3>Pattern Recognition Test</h3>
        <div class="test-instruction">
          Identify the next symbol in the sequence.
        </div>
        <div class="pattern-sequence">
          <div class="pattern-item">△</div>
          <div class="pattern-item">□</div>
          <div class="pattern-item">○</div>
          <div class="pattern-item">?</div>
        </div>
        <div class="pattern-options">
          <div class="pattern-option" data-correct="true">△</div>
          <div class="pattern-option">□</div>
          <div class="pattern-option">○</div>
          <div class="pattern-option">⬡</div>
        </div>
      </div>
      
      <div class="test-section" data-test="2">
        <h3>Memory Test</h3>
        <div class="test-instruction">
          Memorize the marker locations. You have <span class="countdown">5</span> seconds.
        </div>
        <div class="memory-map">
          <div class="memory-grid">
            <div class="memory-marker" style="top: 35%; left: 20%"></div>
            <div class="memory-marker" style="top: 15%; left: 60%"></div>
            <div class="memory-marker" style="top: 75%; left: 80%"></div>
          </div>
          <div class="map-overlay"></div>
        </div>
        <div class="memory-recall hidden">
          <div class="recall-grid">
            <div class="recall-cell" data-location="A1"></div>
            <div class="recall-cell" data-location="A2"></div>
            <div class="recall-cell" data-location="A3"></div>
            <div class="recall-cell" data-location="A4"></div>
            <div class="recall-cell" data-location="B1"></div>
            <div class="recall-cell" data-location="B2"></div>
            <div class="recall-cell" data-location="B3"></div>
            <div class="recall-cell" data-location="B4"></div>
            <div class="recall-cell" data-location="C1"></div>
            <div class="recall-cell" data-location="C2"></div>
            <div class="recall-cell" data-location="C3"></div>
            <div class="recall-cell" data-location="C4"></div>
            <div class="recall-cell" data-location="D1"></div>
            <div class="recall-cell" data-location="D2"></div>
            <div class="recall-cell" data-location="D3"></div>
            <div class="recall-cell" data-location="D4"></div>
          </div>
        </div>
      </div>
      
      <div class="test-navigation">
        <button type="button" class="btn-primary test-continue">
          <span class="btn-text">BEGIN ASSESSMENT</span>
          <div class="btn-glow"></div>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(fallbackContainer);
  console.log("Created fallback aptitude container with complete memory test");
  
  // Add styles for memory test
  const memoryStyles = document.createElement('style');
  memoryStyles.textContent = `
    .memory-map {
      position: relative;
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, var(--midnight-charcoal), var(--expedition-green));
      border: 1px solid var(--bioluminescent-teal);
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .memory-grid {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .memory-marker {
      position: absolute;
      width: 12px;
      height: 12px;
      background-color: var(--bioluminescent-teal);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 8px var(--bioluminescent-teal);
      transition: opacity 0.3s ease;
    }
    .map-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(45, 48, 51, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--bioluminescent-teal);
      font-size: 1.5rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.5s ease;
    }
    .map-overlay.visible {
      opacity: 1;
    }
    .memory-recall {
      width: 100%;
      transition: opacity 0.5s ease;
    }
    .memory-recall.hidden {
      opacity: 0;
      pointer-events: none;
    }
    .recall-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 4px;
      width: 100%;
      height: 200px;
    }
    .recall-cell {
      background-color: rgba(57, 240, 217, 0.1);
      border: 1px solid rgba(57, 240, 217, 0.3);
      border-radius: 2px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .recall-cell:hover {
      background-color: rgba(57, 240, 217, 0.2);
    }
    .recall-cell.selected {
      background-color: rgba(57, 240, 217, 0.4);
      box-shadow: 0 0 5px var(--bioluminescent-teal);
    }
  `;
  document.head.appendChild(memoryStyles);
  
  // Setup the test navigation after a short delay to ensure DOM is ready
  setTimeout(() => {
    // Set up pattern test 
    const options = fallbackContainer.querySelectorAll('.pattern-option');
    options.forEach((option, index) => {
      option.addEventListener('click', () => {
        // Clear other selections
        options.forEach(o => o.classList.remove('selected'));
        
        // Set this option as selected
        option.classList.add('selected');
        
        // Debug info
        console.log(`Option ${index} selected: "${option.textContent.trim()}"`);
      });
    });
    
    // Setup test navigation
    setupTestNavigation();
  }, 100);
}

// Function to create a fallback logo SVG if needed
function createFallbackLogoSvg() {
  // Check if logo.svg exists by trying to fetch it
  fetch('logo.svg')
    .then(response => {
      if (!response.ok) {
        // Create a fallback SVG file
        const svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#39F0D9" stroke-width="3"/>
            <path d="M30 70 L50 30 L70 70 Z" fill="none" stroke="#39F0D9" stroke-width="2"/>
            <circle cx="50" cy="45" r="10" fill="#39F0D9" opacity="0.6"/>
          </svg>
        `;
        
        // Create a Blob and download link
        const blob = new Blob([svgContent], {type: 'image/svg+xml'});
        const dataUrl = URL.createObjectURL(blob);
        
        // Create a style that replaces all instances with the data URL
        const style = document.createElement('style');
        style.textContent = `
          .target-logo {
            background-image: url('${dataUrl}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
          }
        `;
        document.head.appendChild(style);
        
        console.log("Created fallback SVG logo");
      }
    })
    .catch(error => {
      console.log("Error checking for logo.svg, using fallback");
    });
}
