// ==============================
//  Anti-PhishingZone — app.js
//  Front-end phishing detection demo logic
//  NOTE: Replace the analyzeText() function body with your
//        real Python backend API call (fetch to your endpoint).
// ==============================

// ---- Tab switching ----
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

// ---- Drag & Drop ----
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadImagePreview(file);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) loadImagePreview(fileInput.files[0]);
});

function loadImagePreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('preview-img').src = e.target.result;
    document.getElementById('image-preview').classList.remove('hidden');
    dropZone.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  document.getElementById('preview-img').src = '';
  document.getElementById('image-preview').classList.add('hidden');
  dropZone.classList.remove('hidden');
  fileInput.value = '';
}

// ---- Clear text input ----
function clearInput() {
  document.getElementById('scan-input').value = '';
}

// ---- MAIN SCAN FUNCTION ----
function runScan() {
  const activePanel = document.querySelector('.tab-panel.active').id;
  let inputText = '';

  if (activePanel === 'panel-text') {
    inputText = document.getElementById('scan-input').value.trim();
    if (!inputText) {
      alert('Please paste some text, a URL, or a message to scan.');
      return;
    }
  } else {
    inputText = '[Image input — connect to OCR/backend]';
  }

  // -- Fake loading shimmer on button --
  const btn = document.querySelector('.scan-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="scan-btn-icon">⏳</span> Analyzing…';
  btn.disabled = true;

  // Simulate async backend (replace with real fetch call below)
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.disabled = false;
    const result = analyzeText(inputText);
    showResults(inputText, result);
  }, 1200);
}

// ==============================
//  analyzeText(text)
//  ─────────────────────────────
//  DEMO / FRONT-END ONLY version.
//  Replace this with a real fetch() call to your Python backend:
//
//  async function analyzeText(text) {
//    const response = await fetch('/api/scan', {
//      method: 'POST',
//      headers: { 'Content-Type': 'application/json' },
//      body: JSON.stringify({ input: text })
//    });
//    return await response.json();
//    // expected: { score: 0-100, flags: [...], keywords: [...] }
//  }
// ==============================
function analyzeText(text) {
  const lower = text.toLowerCase();

  // --- Keyword lists (based on common phishing patterns) ---
  const highRiskKeywords = [
    'verify your account', 'click here', 'update your information',
    'urgent', 'suspended', 'confirm your identity', 'login immediately',
    'your account has been', 'act now', 'limited time', 'reset your password',
    'bank account', 'social security', 'credit card', 'paypal', 'wire transfer',
    '.tk', '.ml', '.ga', '.cf', 'bit.ly', 'tinyurl', 'secure-login', 'webscr',
    'account-verify', 'password reset', 'signin', 'password expired',
    'you have won', 'prize', 'lottery', 'claim your', 'free gift'
  ];

  const mediumRiskKeywords = [
    'dear user', 'dear customer', 'valued customer', 'invoice attached',
    'please respond', 'kindly', 'your order', 'tracking number',
    'delivery failed', 'shipment', 'refund', 'unusual activity',
    'verify', 'confirm', 'suspicious', 'security alert', 'http://'
  ];

  const found_high = highRiskKeywords.filter(kw => lower.includes(kw.toLowerCase()));
  const found_med  = mediumRiskKeywords.filter(kw => lower.includes(kw.toLowerCase()));

  // Score calculation
  let score = 0;
  score += found_high.length * 18;
  score += found_med.length * 8;

  // URL pattern checks
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = text.match(urlPattern) || [];
  urls.forEach(url => {
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) score += 20; // IP-based URL
    if ((url.match(/\./g) || []).length > 3) score += 12;    // Many subdomains
    if (/-(login|verify|secure|account|update)/i.test(url)) score += 15;
  });

  // Exclamation points / all caps sections
  const exclamations = (text.match(/!/g) || []).length;
  score += Math.min(exclamations * 3, 12);

  score = Math.min(100, score); // cap at 100

  const allFound = [...new Set([...found_high, ...found_med])];

  // Build flags list
  const flags = [];
  if (found_high.length)    flags.push(`${found_high.length} high-risk phishing keyword(s) detected`);
  if (found_med.length)     flags.push(`${found_med.length} suspicious keyword(s) detected`);
  if (urls.length)          flags.push(`${urls.length} URL(s) found in text`);
  if (exclamations > 2)     flags.push('Excessive use of exclamation marks (urgency tactic)');
  if (/dear (user|customer)/i.test(text)) flags.push('Generic greeting — legitimate services use your name');
  if (score === 0)          flags.push('No phishing patterns found');

  return { score, keywords: allFound, flags };
}

// ---- showResults ----
function showResults(originalText, result) {
  const { score, keywords, flags } = result;

  // Scroll to / show results section
  document.getElementById('results').classList.remove('hidden');
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // -- Animate risk bar --
  setTimeout(() => {
    document.getElementById('risk-fill').style.width  = score + '%';
    document.getElementById('risk-thumb').style.left  = score + '%';
  }, 100);

  // -- Percent counter animation --
  animateCounter('risk-percent', score);

  // -- Badge & color indicator --
  let label, color, ciDotColor, ciText;
  if (score >= 65) {
    label = '🚨 PHISHING';
    color = 'var(--red)';
    ciDotColor = 'var(--red)';
    ciText = 'HIGH RISK — This content shows strong signs of a phishing attack. Do NOT click any links.';
  } else if (score >= 30) {
    label = '⚠ SUSPICIOUS';
    color = 'var(--yellow)';
    ciDotColor = 'var(--yellow)';
    ciText = 'SUSPICIOUS — Treat this content with caution. Verify the sender independently.';
  } else {
    label = '✓ CLEAR';
    color = 'var(--green)';
    ciDotColor = 'var(--green)';
    ciText = 'CLEAR — No significant phishing patterns detected. Stay vigilant.';
  }

  const badge = document.getElementById('risk-badge');
  badge.textContent   = label;
  badge.style.cssText = `background: ${color}22; border: 1px solid ${color}; color: ${color};`;

  document.getElementById('risk-percent').style.color = color;

  document.getElementById('ci-dot').style.background  = ciDotColor;
  document.getElementById('ci-dot').style.boxShadow   = `0 0 12px ${ciDotColor}`;
  document.getElementById('ci-text').textContent       = ciText;

  // -- Highlighted text --
  let highlighted = originalText;
  keywords.forEach(kw => {
    const regex = new RegExp(escapeRegex(kw), 'gi');
    highlighted = highlighted.replace(regex, `<span class="flag-word">$&</span>`);
  });
  document.getElementById('highlighted-text').innerHTML =
    highlighted.length ? highlighted : '<em style="color:var(--muted)">No text to highlight.</em>';

  // -- Flags list --
  const flagsList = document.getElementById('flags-list');
  flagsList.innerHTML = '';
  if (flags.length === 0) {
    flagsList.innerHTML = '<li>No specific flags raised.</li>';
  } else {
    flags.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f;
      flagsList.appendChild(li);
    });
  }
}

// ---- Reset ----
function resetScan() {
  document.getElementById('results').classList.add('hidden');
  document.getElementById('risk-fill').style.width = '0%';
  document.getElementById('risk-thumb').style.left = '0%';
  document.getElementById('scan-input').value = '';
  document.querySelector('#scan').scrollIntoView({ behavior: 'smooth' });
}

// ---- Helpers ----
function animateCounter(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current + '%';
    if (current >= target) clearInterval(timer);
  }, 25);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
