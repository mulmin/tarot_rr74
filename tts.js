/* ═══════════════════════════════════════════
   읽어주기 공유 모듈 (Web Speech API)
   - 켜기: 메인(허브)의 토글에서 일괄
   - 끄기: 모든 화면 우하단 플로팅 버튼에서 언제든지
   ═══════════════════════════════════════════ */
window.TTS = (function () {
  const ok = 'speechSynthesis' in window;
  const S = { on: localStorage.getItem('ttsOn') === '1', voice: null };

  function pickVoice() {
    const vs = speechSynthesis.getVoices().filter(v => v.lang && v.lang.startsWith('ko'));
    S.voice = vs.find(v => v.localService) || vs[0] || null;
  }
  if (ok) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  // ── 끄기 플로팅 버튼 (크고, 항상 같은 자리) ──
  const pill = document.createElement('button');
  pill.id = 'tts-off-pill';
  pill.textContent = '🔊 읽어주기 끄기';
  pill.setAttribute('aria-label', '읽어주기 끄기');
  const st = document.createElement('style');
  st.textContent = [
    '#tts-off-pill{position:fixed;right:14px;bottom:20px;z-index:300;display:none;',
    'font-family:inherit;font-size:18px;font-weight:700;padding:16px 22px;',
    'border-radius:999px;border:1.5px solid rgba(156,123,53,.55);',
    'background:#fffdf7;color:#9c7b35;box-shadow:0 8px 22px rgba(60,45,20,.3);',
    'cursor:pointer;-webkit-tap-highlight-color:transparent}',
    '#tts-off-pill.speaking{background:#9c7b35;color:#fffdf7}'
  ].join('');
  document.head.appendChild(st);
  function mount() { document.body.appendChild(pill); sync(); }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  function sync() {
    pill.style.display = (ok && S.on) ? 'block' : 'none';
    document.dispatchEvent(new CustomEvent('ttschange', { detail: { on: S.on } }));
  }
  function stop() {
    if (ok) speechSynthesis.cancel();
    pill.classList.remove('speaking');
  }
  function speak(text, force) {
    if (!ok || (!S.on && !force)) return;
    stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    if (S.voice) u.voice = S.voice;
    u.rate = 0.95;
    u.onstart = () => pill.classList.add('speaking');
    u.onend = u.onerror = () => pill.classList.remove('speaking');
    speechSynthesis.speak(u);
  }
  function setOn(v) {
    S.on = v;
    localStorage.setItem('ttsOn', v ? '1' : '0');
    if (!v) stop();
    sync();
  }
  pill.addEventListener('click', () => setOn(false));

  return {
    get on() { return S.on; },
    supported: ok,
    speak, stop, setOn,
    toggle() {
      const v = !S.on;
      setOn(v);
      if (v) speak('읽어주기 모드를 켰습니다. 이제 모든 해석을 음성으로 들려드릴게요.', true);
    }
  };
})();
