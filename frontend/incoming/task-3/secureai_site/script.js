const toast = document.getElementById('toast');
const themeToggle = document.getElementById('themeToggle');
const mobileMenu = document.getElementById('mobileMenu');
const modal = document.getElementById('toolModal');
const modalBody = document.getElementById('modalBody');
const modalTitle = document.getElementById('modalTitle');

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function openModal(title, html) {
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}
function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
}
document.getElementById('closeModal').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

async function api(path, payload) {
  const res = await fetch(path, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function resultMarkup(result) {
  const cls = result.status === 'Safe' ? 'safe' : result.status === 'Risk' ? 'risk' : 'attention';
  const reasons = (result.reasons || []).map(r => `<li>${escapeHtml(r)}</li>`).join('');
  return `<div class="result-card ${cls}">
    <div class="result-top"><span class="status ${cls}">${escapeHtml(result.status)}</span><strong>${result.score}/100</strong></div>
    <h4>${escapeHtml(result.level || '')}</h4>
    <ul>${reasons}</ul>
  </div>`;
}
function escapeHtml(s){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function showTool(tool) {
  if (tool === 'Check a Link') {
    openModal('Check a Link', `<p class="modal-note">Paste a link and SecureAI will check common phishing warning signs.</p><form id="urlForm"><label>URL<input id="urlInput" type="text" placeholder="https://example.com" required></label><button class="btn btn-primary full" type="submit">Analyze link</button></form><div id="toolResult"></div>`);
    document.getElementById('urlForm').addEventListener('submit', async e => {
      e.preventDefault(); const out = document.getElementById('toolResult'); out.innerHTML='<div class="loading">Analyzing…</div>';
      try { out.innerHTML = resultMarkup(await api('/api/check-url',{url:document.getElementById('urlInput').value})); refreshDashboard(); }
      catch(err){ out.innerHTML=`<div class="error-box">${escapeHtml(err.message)}</div>`; }
    });
  }
  if (tool === 'Check a Message') {
    openModal('Check a Message', `<p class="modal-note">Paste an email, SMS, or DM. The analyzer looks for common social-engineering indicators.</p><form id="msgForm"><label>Message<textarea id="msgInput" rows="7" placeholder="Paste the message here..." required></textarea></label><button class="btn btn-primary full" type="submit">Analyze message</button></form><div id="toolResult"></div>`);
    document.getElementById('msgForm').addEventListener('submit', async e => {
      e.preventDefault(); const out = document.getElementById('toolResult'); out.innerHTML='<div class="loading">Analyzing…</div>';
      try { out.innerHTML = resultMarkup(await api('/api/check-message',{text:document.getElementById('msgInput').value})); refreshDashboard(); }
      catch(err){ out.innerHTML=`<div class="error-box">${escapeHtml(err.message)}</div>`; }
    });
  }
  if (tool === 'Scan a File') {
    openModal('Scan a File', `<p class="modal-note">This starter version checks file metadata and SHA-256. It does not certify a file as malware-free.</p><form id="fileForm"><label>Select file<input id="fileInput" type="file" required></label><button class="btn btn-primary full" type="submit">Check file metadata</button></form><div id="toolResult"></div>`);
    document.getElementById('fileForm').addEventListener('submit', async e => {
      e.preventDefault(); const f=document.getElementById('fileInput').files[0]; const out=document.getElementById('toolResult'); if(!f)return;
      out.innerHTML='<div class="loading">Reading metadata…</div>';
      const buf=await f.arrayBuffer(); const hash=await crypto.subtle.digest('SHA-256',buf); const sha=Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
      out.innerHTML=resultMarkup(await api('/api/scan-file',{name:f.name,size:f.size,sha256:sha}));
    });
  }
  if (tool === 'Security Check') {
    openModal('Security Check', `<p class="modal-note">A quick self-assessment. Nothing is installed on your device.</p><form id="secForm" class="checklist">
      <label><input type="checkbox" name="two_factor" checked> Two-factor authentication is enabled</label>
      <label><input type="checkbox" name="updates" checked> Device and apps are updated</label>
      <label><input type="checkbox" name="screen_lock" checked> Screen lock / PIN is enabled</label>
      <label><input type="checkbox" name="backup" checked> Important data is backed up</label>
      <label><input type="checkbox" name="password_manager" checked> Important accounts use unique passwords</label>
      <label><input type="checkbox" name="public_wifi" checked> I avoid sensitive logins on unknown public Wi-Fi</label>
      <button class="btn btn-primary full" type="submit">Calculate score</button></form><div id="toolResult"></div>`);
    document.getElementById('secForm').addEventListener('submit', async e => { e.preventDefault(); const data={}; document.querySelectorAll('#secForm input[type=checkbox]').forEach(x=>data[x.name]=x.checked); const out=document.getElementById('toolResult'); out.innerHTML=resultMarkup(await api('/api/security-check',data)); refreshDashboard(); });
  }
  if (tool === 'Ask Security AI') {
    openModal('Ask Security AI', `<p class="modal-note">A safe starter assistant. It provides guidance without performing actions on your device.</p><form id="askForm"><label>Your question<textarea id="askInput" rows="5" placeholder="Example: I received a suspicious OTP message. What should I do?" required></textarea></label><button class="btn btn-primary full" type="submit">Ask SecureAI</button></form><div id="toolResult"></div>`);
    document.getElementById('askForm').addEventListener('submit', async e => { e.preventDefault(); const out=document.getElementById('toolResult'); out.innerHTML='<div class="loading">Thinking…</div>'; try { const r=await api('/api/ask',{question:document.getElementById('askInput').value}); out.innerHTML=`<div class="answer-card">${escapeHtml(r.answer)}</div>`; } catch(err){ out.innerHTML=`<div class="error-box">${escapeHtml(err.message)}</div>`; } });
  }
}

document.querySelectorAll('.tool-card').forEach(card => card.addEventListener('click', () => showTool(card.dataset.tool)));
document.getElementById('reportBtn').addEventListener('click', () => showToast('Run the Security Check to generate your current score.'));
document.getElementById('viewAll').addEventListener('click', () => showToast('Activity history is stored for this session in the local MVP.'));

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  showToast(document.body.classList.contains('light') ? 'Light mode enabled.' : 'Dark mode enabled.');
});

mobileMenu.addEventListener('click', () => {
  const isOpen = mobileMenu.getAttribute('aria-expanded') === 'true';
  mobileMenu.setAttribute('aria-expanded', String(!isOpen));
  document.querySelector('.main-nav').classList.toggle('mobile-open', !isOpen);
});

document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const id = link.getAttribute('href'); if(id==='#')return; const target=document.querySelector(id); if(target){event.preventDefault(); target.scrollIntoView({behavior:'smooth',block:'start'});}
}));

async function refreshDashboard(){
  try{
    const data=await fetch('/api/history').then(r=>r.json());
    const panel=document.querySelector('.activity-panel');
    if(!panel) return;
    const head=panel.querySelector('.activity-head');
    panel.innerHTML=''; panel.appendChild(head);
    if(!data.history.length){ panel.insertAdjacentHTML('beforeend','<div class="empty-state">No scans yet — try one of the tools above.</div>'); return; }
    data.history.slice(0,4).forEach(item=>{
      const cls=item.status==='Safe'?'safe':item.status==='Risk'?'risk':'attention';
      panel.insertAdjacentHTML('beforeend',`<div class="activity-row"><span class="activity-icon cyan">•</span><div class="activity-main"><strong>${escapeHtml(item.target)}</strong><small>${escapeHtml(item.kind)} · <em>${escapeHtml(item.status)}</em></small></div><span class="status ${cls}">${escapeHtml(item.status)}</span><small>${new Date(item.timestamp*1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></div>`);
    });
  }catch(e){}
}
refreshDashboard();


// AI Security Questions chat
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

function addChatBubble(text, who='bot') {
  const div = document.createElement('div');
  div.className = `chat-bubble ${who}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

if (chatForm) {
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = chatInput.value.trim();
    if (!q) return;
    addChatBubble(q, 'user');
    chatInput.value = '';
    const thinking = addChatBubble('Thinking…', 'bot thinking');
    try {
      const r = await api('/api/ask', {question: q});
      thinking.textContent = r.answer || 'I could not generate an answer.';
      thinking.classList.remove('thinking');
    } catch (err) {
      thinking.textContent = 'The AI service is not available right now. Please try again.';
      thinking.classList.remove('thinking');
      showToast('AI service unavailable');
    }
  });
}

document.querySelectorAll('.suggestion').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!chatInput) return;
    chatInput.value = btn.dataset.question || '';
    chatInput.focus();
    document.getElementById('ask-ai')?.scrollIntoView({behavior:'smooth', block:'start'});
  });
});
