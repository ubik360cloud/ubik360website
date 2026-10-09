(function () {
  const BOT_URL = 'https://ubik360-bot-production.up.railway.app/chat';
  const SESSION_ID = 'web_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();

  const lang = (navigator.language || 'es').toLowerCase();
  const isEN = lang.startsWith('en');

  // TEMPORARY TEST VARIANT (2026-07): widget copy scrubbed of "Jose"/personal
  // framing to match the anonymous/bigger-company positioning test -- see
  // MARKETING.md "Anonymous/bigger-company positioning test". Prompts updated
  // from the old Hispanic-market-specific framing to the current general
  // growth-marketing / $5M+ ICP positioning. NOTE: this only covers the
  // client-side widget copy -- the bot's actual conversation logic and
  // knowledge base live in a separate Railway-hosted service outside this
  // repo (ubik360-bot-production.up.railway.app) and were NOT updated here;
  // that service needs its own review to stay consistent with this test.
  const STRINGS = {
    greeting: isEN
      ? "Hi! I'm the Ubik 360 assistant 👋\n\nHow can I help you today?"
      : '¡Hola! Soy el asistente de Ubik 360 👋\n\n¿En qué te puedo ayudar hoy?',
    bubble: isEN ? '👋 Hi! Can I help you?' : '👋 ¡Hola! ¿Te ayudo?',
    placeholder: isEN ? 'Type your message...' : 'Escribe tu mensaje...',
    subtitle: isEN ? 'Ubik 360 Assistant · Online' : 'Asistente de Ubik 360 · En línea',
    error: isEN ? 'Connection error. Please try again.' : 'Error de conexión. Intenta de nuevo.'
  };

  const PROMPTS = isEN
    ? ['🏢 Expand to the U.S./Canada', '📈 Growth marketing', '👥 LatAm staffing']
    : ['🏢 Expansión a EE.UU./Canadá', '📈 Marketing de crecimiento', '👥 Personal en LatAm'];

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');
    #u360-widget * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

    #u360-btn {
      position: fixed; bottom: 24px; right: 24px;
      width: 62px; height: 62px; border-radius: 50%;
      background: linear-gradient(135deg, #9B1F1F, #C0392B);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 24px rgba(155,31,31,0.45);
      z-index: 99999; transition: transform 0.2s ease;
      animation: u360-pulse 2.8s infinite;
    }
    #u360-btn:hover { transform: scale(1.08); animation: none; }
    @keyframes u360-pulse {
      0% { box-shadow: 0 4px 24px rgba(155,31,31,0.45), 0 0 0 0 rgba(155,31,31,0.35); }
      70% { box-shadow: 0 4px 24px rgba(155,31,31,0.45), 0 0 0 16px rgba(155,31,31,0); }
      100% { box-shadow: 0 4px 24px rgba(155,31,31,0.45), 0 0 0 0 rgba(155,31,31,0); }
    }

    #u360-dot {
      position: fixed; bottom: 74px; right: 22px;
      width: 15px; height: 15px;
      background: #22c55e; border: 2.5px solid #fff;
      border-radius: 50%; z-index: 100000;
      transition: opacity 0.3s ease;
    }

    #u360-bubble {
      position: fixed; bottom: 100px; right: 24px;
      background: #fff; color: #1a1a1a;
      padding: 11px 16px; border-radius: 18px 18px 4px 18px;
      font-size: 14px; font-weight: 500;
      box-shadow: 0 6px 28px rgba(0,0,0,0.12);
      z-index: 99998; cursor: pointer;
      border: 1.5px solid #f0f0f0;
      max-width: calc(100vw - 100px);
      display: flex; align-items: center; gap: 10px;
      opacity: 0; transform: translateY(10px) scale(0.95);
      transition: opacity 0.35s ease, transform 0.35s ease;
    }
    #u360-bubble.visible { opacity: 1; transform: translateY(0) scale(1); }
    #u360-bubble-x {
      width: 18px; height: 18px; border-radius: 50%;
      background: #f0f0f0; border: none; cursor: pointer;
      font-size: 10px; color: #999; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    #u360-bubble-x:hover { background: #e0e0e0; }

    #u360-window {
      position: fixed; bottom: 100px; right: 24px;
      width: 400px; max-width: calc(100vw - 32px);
      height: 560px; max-height: calc(100vh - 120px);
      background: #fff; border-radius: 22px;
      box-shadow: 0 16px 56px rgba(0,0,0,0.14);
      display: flex; flex-direction: column;
      z-index: 99999; overflow: hidden;
      opacity: 0; transform: translateY(20px) scale(0.96);
      pointer-events: none;
      transition: opacity 0.28s ease, transform 0.28s ease;
    }
    #u360-window.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }

    #u360-header {
      background: linear-gradient(135deg, #9B1F1F, #C0392B);
      padding: 16px 18px; display: flex; align-items: center;
      gap: 12px; flex-shrink: 0;
    }
    #u360-avatar {
      width: 42px; height: 42px; border-radius: 50%;
      background: rgba(255,255,255,0.18);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    #u360-header-text { flex: 1; min-width: 0; }
    #u360-header-title { font-family: 'Playfair Display', serif; color: #fff; font-size: 17px; font-weight: 600; }
    #u360-header-sub { color: rgba(255,255,255,0.78); font-size: 11.5px; margin-top: 2px; }
    #u360-close-btn {
      background: rgba(255,255,255,0.15); border: none; border-radius: 50%;
      width: 30px; height: 30px; display: flex; align-items: center;
      justify-content: center; cursor: pointer; flex-shrink: 0;
      transition: background 0.2s ease;
    }
    #u360-close-btn:hover { background: rgba(255,255,255,0.28); }

    #u360-prompts {
      padding: 10px 14px 0; display: flex; gap: 7px;
      flex-wrap: wrap; background: #fafafa; flex-shrink: 0;
    }
    .u360-prompt {
      background: #fff; border: 1.5px solid #e8e8e8;
      border-radius: 20px; padding: 7px 13px;
      font-size: 12.5px; color: #9B1F1F; cursor: pointer;
      font-weight: 500; transition: all 0.18s ease; white-space: nowrap;
    }
    .u360-prompt:hover { background: #9B1F1F; color: #fff; border-color: #9B1F1F; }

    #u360-messages {
      flex: 1; overflow-y: auto; padding: 16px 14px;
      display: flex; flex-direction: column; gap: 12px;
      background: #fafafa; scroll-behavior: smooth;
    }
    #u360-messages::-webkit-scrollbar { width: 3px; }
    #u360-messages::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }

    .u360-msg {
      max-width: 80%;
      width: fit-content;
      min-width: 60px;
      padding: 11px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.6;
      animation: u360-in 0.22s ease;
      white-space: pre-wrap;
      word-break: break-word;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    @keyframes u360-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .u360-bot {
      background: #fff; color: #1a1a1a;
      align-self: flex-start; border-bottom-left-radius: 4px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.08);
      max-width: 85%;
    }
    .u360-user {
      background: linear-gradient(135deg, #9B1F1F, #C0392B);
      color: #fff; align-self: flex-end; border-bottom-right-radius: 4px;
      max-width: 75%;
    }

    .u360-typing {
      display: flex; align-items: center; gap: 5px;
      padding: 13px 16px; background: #fff;
      border-radius: 18px; border-bottom-left-radius: 4px;
      align-self: flex-start; box-shadow: 0 1px 6px rgba(0,0,0,0.08);
      animation: u360-in 0.22s ease;
    }
    .u360-typing span {
      width: 7px; height: 7px; background: #9B1F1F;
      border-radius: 50%; opacity: 0.35;
      animation: u360-bounce 1.3s infinite;
    }
    .u360-typing span:nth-child(2) { animation-delay: 0.18s; }
    .u360-typing span:nth-child(3) { animation-delay: 0.36s; }
    @keyframes u360-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
      40% { transform: translateY(-6px); opacity: 1; }
    }

    #u360-input-area {
      padding: 12px 14px 14px; background: #fff;
      border-top: 1px solid #f0f0f0;
      display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0;
    }
    #u360-input {
      flex: 1; border: 1.5px solid #ebebeb; border-radius: 14px;
      padding: 11px 15px; font-size: 14px; color: #1a1a1a;
      resize: none; outline: none; max-height: 100px; min-height: 44px;
      line-height: 1.45; transition: border-color 0.2s ease;
      font-family: 'DM Sans', sans-serif; background: #fafafa;
    }
    #u360-input:focus { border-color: #9B1F1F; background: #fff; }
    #u360-input::placeholder { color: #bbb; }

    #u360-send {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #9B1F1F, #C0392B);
      border: none; border-radius: 12px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: opacity 0.2s ease, transform 0.1s ease;
    }
    #u360-send:hover { opacity: 0.88; }
    #u360-send:active { transform: scale(0.93); }
    #u360-send:disabled { opacity: 0.38; cursor: default; }

    #u360-footer {
      text-align: center; font-size: 10px; color: #d0d0d0;
      padding: 5px 0 9px; background: #fff; flex-shrink: 0;
    }

    @media (max-width: 480px) {
      #u360-window {
        right: 0; left: 0; bottom: 0;
        width: 100%; max-width: 100%;
        height: 85vh; max-height: 85vh;
        border-radius: 22px 22px 0 0;
      }
      #u360-btn { right: 16px; bottom: 16px; width: 58px; height: 58px; }
      #u360-dot { right: 18px; bottom: 64px; }
      #u360-bubble { right: 16px; bottom: 84px; font-size: 13px; }
      .u360-msg { font-size: 15px; }
      #u360-input { font-size: 16px; }
    }
  `;

  function init() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.id = 'u360-widget';

    const dot = document.createElement('div');
    dot.id = 'u360-dot';

    const bubble = document.createElement('div');
    bubble.id = 'u360-bubble';
    bubble.innerHTML = `<span>${STRINGS.bubble}</span><button id="u360-bubble-x" aria-label="Cerrar">✕</button>`;

    const btn = document.createElement('button');
    btn.id = 'u360-btn';
    btn.setAttribute('aria-label', 'Abrir chat');
    btn.innerHTML = `
      <svg id="u360-icon-chat" width="27" height="27" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="rgba(255,255,255,0.12)"/>
      </svg>
      <svg id="u360-icon-close" width="22" height="22" viewBox="0 0 24 24" fill="none" style="display:none">
        <path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;

    const promptsHTML = PROMPTS.map(p => `<button class="u360-prompt">${p}</button>`).join('');

    const win = document.createElement('div');
    win.id = 'u360-window';
    win.setAttribute('role', 'dialog');
    win.innerHTML = `
      <div id="u360-header">
        <div id="u360-avatar">🤝</div>
        <div id="u360-header-text">
          <div id="u360-header-title">Ubik360</div>
          <div id="u360-header-sub">${STRINGS.subtitle}</div>
        </div>
        <button id="u360-close-btn" aria-label="Cerrar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div id="u360-prompts">${promptsHTML}</div>
      <div id="u360-messages"></div>
      <div id="u360-input-area">
        <textarea id="u360-input" placeholder="${STRINGS.placeholder}" rows="1"></textarea>
        <button id="u360-send" aria-label="Enviar">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div id="u360-footer">Ubik360 AI Assistant</div>`;

    wrapper.appendChild(dot);
    wrapper.appendChild(bubble);
    wrapper.appendChild(win);
    wrapper.appendChild(btn);
    document.body.appendChild(wrapper);

    const messagesEl = document.getElementById('u360-messages');
    const inputEl = document.getElementById('u360-input');
    const sendBtn = document.getElementById('u360-send');
    const closeBtn = document.getElementById('u360-close-btn');
    const iconChat = document.getElementById('u360-icon-chat');
    const iconClose = document.getElementById('u360-icon-close');
    const bubbleX = document.getElementById('u360-bubble-x');

    let isOpen = false, isTyping = false, greeted = false;

    setTimeout(() => { if (!isOpen) bubble.classList.add('visible'); }, 4000);

    function openChat() {
      isOpen = true;
      win.classList.add('open');
      iconChat.style.display = 'none';
      iconClose.style.display = 'block';
      bubble.classList.remove('visible');
      dot.style.opacity = '0';
      if (!greeted) { greeted = true; setTimeout(() => addMessage(STRINGS.greeting, 'bot'), 350); }
      setTimeout(() => inputEl.focus(), 300);
    }

    function closeChat() {
      isOpen = false;
      win.classList.remove('open');
      iconChat.style.display = 'block';
      iconClose.style.display = 'none';
    }

    function addMessage(text, type) {
      const msg = document.createElement('div');
      msg.className = 'u360-msg u360-' + type;
      msg.textContent = text;
      messagesEl.appendChild(msg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      if (type === 'user') {
        const prompts = document.getElementById('u360-prompts');
        if (prompts) prompts.style.display = 'none';
      }
    }

    function showTyping() {
      const el = document.createElement('div');
      el.className = 'u360-typing'; el.id = 'u360-t';
      el.innerHTML = '<span></span><span></span><span></span>';
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function hideTyping() { const el = document.getElementById('u360-t'); if (el) el.remove(); }

    async function sendMessage(text) {
      text = text || inputEl.value.trim();
      if (!text || isTyping) return;
      addMessage(text, 'user');
      inputEl.value = ''; inputEl.style.height = 'auto';
      isTyping = true; sendBtn.disabled = true; showTyping();
      try {
        const res = await fetch(BOT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId: SESSION_ID })
        });
        const data = await res.json();
        hideTyping(); addMessage(data.reply || STRINGS.error, 'bot');
      } catch (e) { hideTyping(); addMessage(STRINGS.error, 'bot'); }
      isTyping = false; sendBtn.disabled = false; inputEl.focus();
    }

    btn.addEventListener('click', () => isOpen ? closeChat() : openChat());
    closeBtn.addEventListener('click', closeChat);
    bubble.addEventListener('click', (e) => { if (e.target !== bubbleX) openChat(); });
    bubbleX.addEventListener('click', (e) => { e.stopPropagation(); bubble.classList.remove('visible'); });
    sendBtn.addEventListener('click', () => sendMessage());
    inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    inputEl.addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 100) + 'px'; });
    win.querySelectorAll('.u360-prompt').forEach(p => {
      p.addEventListener('click', function () {
        openChat();
        setTimeout(() => sendMessage(this.textContent.replace(/^[\p{Emoji}\s]+/u, '').trim()), greeted ? 0 : 500);
      });
    });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();