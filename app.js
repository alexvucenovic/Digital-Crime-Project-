document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

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

let uploadedImageData = '';

function loadImagePreview(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    uploadedImageData = e.target.result;
    document.getElementById('preview-img').src = uploadedImageData;
    document.getElementById('image-preview').classList.remove('hidden');
    dropZone.classList.add('hidden');
  };

  reader.readAsDataURL(file);
}


function clearImage() {
  uploadedImageData = '';
  document.getElementById('preview-img').src = '';
  document.getElementById('image-preview').classList.add('hidden');
  dropZone.classList.remove('hidden');
  fileInput.value = '';
}


function clearInput() {
  document.getElementById('scan-input').value = '';
}

async function runScan() {
  const activePanel = document.querySelector('.tab-panel.active').id;
  let inputText = '';

  const btn = document.querySelector('.scan-btn');
  const originalText = btn.innerHTML;
  btn.disabled = true;

  if (activePanel === 'panel-text') {
    inputText = document.getElementById('scan-input').value.trim();

    if (!inputText) {
      alert('Please paste some text, a URL, or a message to scan.');
      btn.disabled = false;
      return;
    }

    btn.innerHTML = '<span class="scan-btn-icon">⏳</span> Analyzing…';
  } else {
    if (!uploadedImageData) {
      alert('Please upload an image first.');
      btn.disabled = false;
      return;
    }

    btn.innerHTML = '<span class="scan-btn-icon">⏳</span> Reading image…';

    const ocrResult = await Tesseract.recognize(uploadedImageData, 'eng');
    inputText = ocrResult.data.text.trim();

    if (!inputText) {
      btn.innerHTML = originalText;
      btn.disabled = false;
      alert('No readable text was found in this image.');
      return;
    }

    btn.innerHTML = '<span class="scan-btn-icon">⏳</span> Analyzing…';
  }

  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.disabled = false;

    const result = analyzeText(inputText);
    showResults(inputText, result);
  }, 500);
}


function analyzeText(text) {
  const lower = text.toLowerCase();

  const highRiskKeywords = [
  'account access suspended',
  'immediate verification required',
  'security restriction applied',
  'confirm your credentials',
  'login attempt blocked',
  'unauthorized transaction',
  'verify your login details',
  'account compromise suspected',
  'urgent account review',
  'validate your payment',
  'confirm your identity now',
  'account under review',
  'restore full access',
  'reactivation required',
  'security validation needed',
  'identity check required',
  'login failure notice',
  'verify your profile',
  'confirm your account ownership',
  'payment verification required',
  'billing confirmation needed',
  'secure your profile',
  'account recovery request',
  'verify to avoid suspension',
  'login verification required',
  'update your credentials',
  'authentication failure',
  'access blocked temporarily',
  'account risk detected',
  'confirm your security info',
  'secure account confirmation',
  'identity authentication needed',
  'validate recent activity',
  'payment issue detected',
  'verify your transaction',
  'confirm your bank details',
  'security hold applied',
  'account flagged for review',
  'restricted login attempt',
  'confirm your login attempt',
  'verify session activity',
  'update required immediately',
  'confirm sensitive information',
  'secure verification process',
  'account integrity check',
  'confirm account security',
  'login credentials required',
  'verify access request',
  'reconfirm payment details',
  'account limitation notice',
  'final account warning',
  'urgent security notice',
  'verify account ownership now',
  'account temporarily restricted',
  'confirm your authorization',
  'security compliance required',
  'validate account access',
  'confirm login credentials',
  'account access verification',
  'critical security alert',
  'update to maintain access',
  'verification deadline',
  'confirm identity to proceed',
  'login authorization required',
  'account protection required',
  'security risk detected',
  'verify to con',
  'account suspended',
  'access restricted',
  'login blocked',
  'unauthorized access detected',
  'security alert',
  'security breach',
  'account compromised',
  'suspicious activity detected',
  'identity verification required',
  'verify your identity',
  'account locked',
  'temporary restriction',
  'authentication required',
  'security check required',
  'reset your credentials',
   'final notice',
  'last warning',
  'legal action pending',
  'court action initiated',
  'arrest warrant issued',
  'enforcement action required',
  'account will be suspended immediately',
  'service will be terminated',
  'pay immediately',
  'immediate payment required',
  'outstanding balance must be paid',
  'payment required to avoid suspension',
  'account sent to collections',
  'debt collection action',
  'additional fees will apply',
  'verify your account',
  'confirm your identity',
  're-enter your password',
  'update your login credentials',
  'login to restore access',
  'account verification required',
  'secure login required',
  'authentication required',
  'validate your account',
  'sign in to continue',
  'update payment information',
  'confirm billing details',
  'outstanding balance',
  'payment required immediately',
  'complete payment now',
  'billing issue detected',
  'verify your bank account',
  'payment method expired',
  'refund processing required',
  'avoid suspension by paying',
  'account suspended',
  'account locked',
  'access will be restricted',
  'access blocked',
  'service will be disabled',
  'account deactivated',
  'temporary suspension',
  'restricted access notice',
  'login disabled',
  'account limited',
  'irs notice',
  'dmv notice',
  'social security administration',
  'bank security department',
  'government enforcement',
  'official notice',
  'legal department',
  'law enforcement notice',
  'compliance division',
  'tax authority notice',
  'click here to verify',
  'click to secure your account',
  'follow this link',
  'open secure portal',
  'verify here immediately',
  'access your account now',
  'submit your details',
  'complete verification process',
  'respond to this message',
  'confirm now',
  'verify',
  'verification',
  'confirm',
  'urgent',
  'immediate',
  'suspended',
  'suspension',
  'locked',
  'blocked',
  'restricted',
  'limited',
  'disabled',
  'unauthorized',
  'security',
  'alert',
  'warning',
  'notice',
  'compliance',
  'billing',
  'payment',
  'refund',
  'update',
  'credentials',
  'password',
  'login',
  'account',
  'identity',
  'access',
  'breach',
  'fraud',
  'risk',
  'violation',
  'enforcement',
  'legal',
  'delinquent'

];

  const mediumRiskKeywords = [
  'attention required',
  'important notice',
  'please confirm receipt',
  'review the details',
  'for your review',
  'as requested',
  'per your request',
  'following up',
  'friendly reminder',
  'status update',
  'account message',
  'customer notice',
  'service alert',
  'system message',
  'notification',
  'alert notice',
  'transaction notice',
  'payment update',
  'order update',
  'shipping update',
  'delivery notice',
  'package update',
  'invoice details',
  'billing update',
  'account statement',
  'financial summary',
  'recent activity',
  'login activity',
  'new device detected',
  'sign-in attempt',
  'account change',
  'profile update',
  'settings update',
  'security update',
  'support request',
  'case update',
  'ticket update',
  'helpdesk message',
  'service request',
  'technical notice',
  'system alert',
  'maintenance notice',
  'scheduled maintenance',
  'downtime notice',
  'service interruption',
  'temporary outage',
  'connectivity issue',
  'access notice',
  'verification notice',
  'confirmation message',
  'response required',
  'please acknowledge',
  'take a moment to review',
  'important information',
  'attached file',
  'see attachment',
  'download file',
  'view report',
  'open report',
  'document enclosed',
  'file included',
  'secure file',
  'message center',
  'check your account',
  'log in for details',
  'view your account',
  'access your dashboard',
 'account update',
  'service update',
  'important update',
  'notification',
  'account activity',
  'recent activity',
  'review required',
  'review your account',
  'action recommended',
  'action may be required',
    'attention required',
  'time sensitive',
  'please respond',
  'prompt response',
  'respond soon',
  'within a short time',
  'as soon as possible',
  'do not delay',
  'important message',
  'verify information',
  'confirm information',
  'check your details',
  'review your details',
  'update your profile',
  'update your information',
  'confirm your details',
  'validate information',
  'to continue using',
  'to avoid interruption',
  'to maintain access',
  'to keep your account active',
  'service continuity',
  'prevent interruption',
  'avoid disruption',
  'account status review',
  'billing update',
  'payment update',
  'transaction review',
  'account billing',
  'invoice attached',
  'payment notice',
  'refund update',
  'security update',
  'security check',
  'security review',
  'suspicious activity',
  'login activity',
  'access activity',
  'unusual activity detected',
  'click for details',
  'view details',
  'open message',
  'review now',
  'check now',
  'learn more',
  'see more information',
  'go to portal',
  'update',
  'notice',
  'alert',
  'review',
  'action',
  'verify',
  'confirm',
  'information',
  'activity',
  'account',
  'security',
  'billing',
  'payment',
  'invoice',
  'transaction',
  'access',
  'login',
  'profile',
  'details',
  'service',
  'support',
  'portal',
  'message',
  'notification',
  'status',
  'request',
  'check',
  'validate',
];

  const found_high = highRiskKeywords.filter(kw => lower.includes(kw.toLowerCase()));
  const found_med  = mediumRiskKeywords.filter(kw => lower.includes(kw.toLowerCase()));

  let score = 0;
  score += found_high.length * 18;
  score += found_med.length * 8;

  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = text.match(urlPattern) || [];
  urls.forEach(url => {
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) score += 20; // IP-based URL
    if ((url.match(/\./g) || []).length > 3) score += 12;    // Many subdomains
    if (/-(login|verify|secure|account|update)/i.test(url)) score += 15;
  });

  const exclamations = (text.match(/!/g) || []).length;
  score += Math.min(exclamations * 3, 12);

  score = Math.min(100, score); 

  const allFound = [...new Set([...found_high, ...found_med])];

  const flags = [];
  if (found_high.length)    flags.push(`${found_high.length} high-risk phishing keyword(s) detected`);
  if (found_med.length)     flags.push(`${found_med.length} suspicious keyword(s) detected`);
  if (urls.length)          flags.push(`${urls.length} URL(s) found in text`);
  if (exclamations > 2)     flags.push('Excessive use of exclamation marks (urgency tactic)');
  if (/dear (user|customer)/i.test(text)) flags.push('Generic greeting — legitimate services use your name');
  if (score === 0)          flags.push('No phishing patterns found');

  return { score, keywords: allFound, flags };
}

function showResults(originalText, result) {
  const { score, keywords, flags } = result;

  document.getElementById('results').classList.remove('hidden');
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });

  setTimeout(() => {
    document.getElementById('risk-fill').style.width  = score + '%';
    document.getElementById('risk-thumb').style.left  = score + '%';
  }, 100);

  animateCounter('risk-percent', score);

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

  let highlighted = originalText;
  keywords.forEach(kw => {
    const regex = new RegExp(escapeRegex(kw), 'gi');
    highlighted = highlighted.replace(regex, `<span class="flag-word">$&</span>`);
  });
  document.getElementById('highlighted-text').innerHTML =
    highlighted.length ? highlighted : '<em style="color:var(--muted)">No text to highlight.</em>';

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

function resetScan() {
  document.getElementById('results').classList.add('hidden');
  document.getElementById('risk-fill').style.width = '0%';
  document.getElementById('risk-thumb').style.left = '0%';
  document.getElementById('scan-input').value = '';
  document.querySelector('#scan').scrollIntoView({ behavior: 'smooth' });
}
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
