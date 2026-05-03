/* ============================================================
   Anti-PhishingZone — app.js
   ============================================================ */

// ── Tab switching ──────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + target).classList.add('active');
  });
});

// ── Clear text ─────────────────────────────────────────────
function clearInput() {
  document.getElementById('scan-input').value = '';
  document.getElementById('scan-input').focus();
}

// ── Drop zone ──────────────────────────────────────────────
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.add('dragover');
}
function handleDragLeave() {
  document.getElementById('drop-zone').classList.remove('dragover');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) showPreview(file);
}

document.getElementById('file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) showPreview(file);
});

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('preview-img').src = ev.target.result;
    document.getElementById('drop-zone').classList.add('hidden');
    document.getElementById('image-preview').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function clearImage(e) {
  if (e) e.stopPropagation();
  document.getElementById('preview-img').src = '';
  document.getElementById('file-input').value = '';
  document.getElementById('drop-zone').classList.remove('hidden');
  document.getElementById('image-preview').classList.add('hidden');
}

// ── Run scan ───────────────────────────────────────────────
function runScan() {
  const activePanel = document.querySelector('.tab-panel.active').id;
  let inputText = '';

  if (activePanel === 'panel-text') {
    inputText = document.getElementById('scan-input').value.trim();
    if (!inputText) { alert('Please paste some text or a URL to scan.'); return; }
  } else {
    if (!document.getElementById('preview-img').src) {
      alert('Please upload an image to scan.'); return;
    }
    inputText = '[IMAGE SCAN]';
  }

  const btn = document.querySelector('#panel-' + activePanel + ' .scan-button');
  btn.textContent = 'Analyzing…';
  btn.disabled = true;

  // ── BACKEND HOOK ──────────────────────────────────────────
  // Replace the setTimeout below with a fetch() to Xaidyn's backend:
  //
  // fetch('/api/analyze', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ text: inputText })
  // })
  // .then(r => r.json())
  // .then(data => displayResults(data, inputText))
  // .catch(err => { console.error(err); alert('Backend error.'); })
  // .finally(() => { btn.textContent = 'Analyze Now'; btn.disabled = false; });
  // ─────────────────────────────────────────────────────────

  setTimeout(() => {
    const result = analyzeText(inputText);
    displayResults(result, inputText);
    btn.textContent = activePanel === 'panel-text' ? 'Analyze Now' : '🔍 Analyze Image';
    btn.disabled = false;
  }, 900);
}

// ── Placeholder analysis engine ────────────────────────────
function analyzeText(text) {
  const patterns = [
    { pattern: /urgent|immediately|act now|limited time/i,                      label: 'Urgency language detected',             weight: 15 },
    { pattern: /verify your account|confirm your (password|identity|details)/i, label: 'Account verification request',          weight: 20 },
    { pattern: /click here|click the link/i,                                    label: 'Generic click-here prompt',             weight: 10 },
    { pattern: /paypal|amazon|apple|microsoft|google|netflix|bank of america/i, label: 'Brand impersonation attempt',           weight: 20 },
    { pattern: /\b(login|log-in|sign.?in)\b.{0,30}(link|here|below)/i,        label: 'Suspicious login redirect',             weight: 15 },
    { pattern: /password|passwd|credentials/i,                                  label: 'Credential request detected',           weight: 18 },
    { pattern: /\.ru|\.cn|\.xyz|\.tk|\.click|\.top/i,                          label: 'Suspicious TLD in URL',                 weight: 22 },
    { pattern: /bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly/i,                        label: 'URL shortener detected',                weight: 12 },
    { pattern: /you (have|won|are selected|are a winner)/i,                     label: 'Prize / reward scam language',          weight: 18 },
    { pattern: /http:\/\//i,                                                    label: 'Unencrypted HTTP link (not HTTPS)',      weight: 14 },
    { pattern: /suspended|disabled|locked|blocked/i,                            label: 'Account threat language',               weight: 16 },
    { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,                          label: 'Raw IP address in URL',                 weight: 25 },
    { pattern: /free|win|prize|gift card|reward/i,                              label: 'Free offer / prize language',           weight: 10 },
    { pattern: /dear (customer|user|member|account holder)/i,                   label: 'Generic greeting (non-personalised)',   weight: 8  },
  ];

  let score = 0;
  const triggered = [];
  const flaggedWords = [];

  patterns.forEach(({ pattern, label, weight }) => {
    if (pattern.test(text)) {
      score += weight;
      triggered.push(label);
      const match = text.match(pattern);
      if (match) flaggedWords.push(match[0]);
    }
  });

  return { score: Math.min(score, 100), triggered, flaggedWords };
}

// ── Display results ────────────────────────────────────────
function displayResults({ score, triggered, flaggedWords }, originalText) {
  const section = document.getElementById('results');
  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth' });

  // Determine risk tier — matching hero card colors and emojis exactly
  let emoji, label, color, borderClass;
  if (score < 30) {
    emoji = '✓';       label = 'SAFE — Low Risk';    color = '#00c875'; borderClass = 'green';
  } else if (score < 65) {
    emoji = '⚡';      label = 'SUSPICIOUS — Medium Risk'; color = '#f0c040'; borderClass = 'yellow';
  } else {
    emoji = '⚠';       label = 'HIGH RISK — Phishing Detected'; color = '#ff3c5f'; borderClass = 'red';
  }

  // Update verdict card
  const card = document.getElementById('result-card');
  card.className = 'card result-card ' + borderClass;

  document.getElementById('result-icon').textContent = emoji;

  const valueEl = document.getElementById('result-value');
  valueEl.textContent = label;
  valueEl.style.color = color;

  const pctBadge = document.getElementById('result-percent-badge');
  pctBadge.style.color = color;

  // Animated percent counter
  let current = 0;
  const tick = setInterval(() => {
    current = Math.min(current + 2, score);
    pctBadge.textContent = current + '%';
    if (current >= score) clearInterval(tick);
  }, 20);

  // Meter
  setTimeout(() => {
    document.getElementById('risk-fill').style.width = score + '%';
    document.getElementById('risk-thumb').style.left = score + '%';
  }, 100);

  // Highlighted text
  const highlightedBlock = document.getElementById('highlighted-block');
  if (originalText !== '[IMAGE SCAN]' && flaggedWords.length > 0) {
    highlightedBlock.classList.remove('hidden');
    let html = originalText;
    const seen = new Set();
    flaggedWords.forEach(word => {
      if (seen.has(word)) return;
      seen.add(word);
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(escaped, 'gi'), `<span class="flag-word">$&</span>`);
    });
    document.getElementById('highlighted-text').innerHTML = html;
  } else {
    highlightedBlock.classList.add('hidden');
  }

  // Flags list
  const flagsBlock = document.getElementById('flags-block');
  const flagsList  = document.getElementById('flags-list');
  flagsList.innerHTML = '';

  if (triggered.length > 0) {
    flagsBlock.classList.remove('hidden');
    triggered.forEach(flag => {
      const li = document.createElement('li');
      li.textContent = flag;
      flagsList.appendChild(li);
    });
  } else {
    flagsBlock.classList.add('hidden');
  }
}

// ── Reset ──────────────────────────────────────────────────
function resetScan() {
  document.getElementById('results').classList.add('hidden');
  document.getElementById('scan-input').value = '';
  document.getElementById('risk-fill').style.width = '0%';
  document.getElementById('risk-thumb').style.left = '0%';
  document.getElementById('result-percent-badge').textContent = '—';
  document.getElementById('scan').scrollIntoView({ behavior: 'smooth' });
}