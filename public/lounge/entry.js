/* Presentation state only. Existing /chat owns authentication and conversation state. */
(() => {
  const key = 'misaki-opening-completed-v1';
  const opening = document.querySelector('#opening');
  const video = document.querySelector('#opening-video');
  const status = document.querySelector('#opening-status');
  const shortcut = document.querySelector('#familiar-misaki');
  let navigating = false;
  const seen = () => { try { return localStorage.getItem(key) === '1'; } catch { return false; } };
  function refresh() {
    shortcut.hidden = !seen();
    document.querySelector('#familiar-empty').hidden = seen();
    document.querySelector('#familiar-note').textContent = seen() ? 'タップで会話へ' : '美咲との会話へ';
  }
  function enterChat() {
    if (navigating) return;
    navigating = true;
    video.pause();
    try { localStorage.setItem(key, '1'); } catch { /* Storage is optional. */ }
    window.location.assign('/chat');
  }
  function play() {
    status.textContent = '読み込み中です。スキップもできます。';
    try {
      const attempt = video.play();
      attempt?.catch(() => { status.textContent = '「再生する」をタップするか、スキップして会話へ進めます。'; });
    } catch { status.textContent = 'スキップして会話へ進めます。'; }
  }
  document.querySelector('[data-character-id="misaki"].card').addEventListener('click', () => {
    if (navigating) return;
    if (seen()) { enterChat(); return; }
    if (!opening.open) opening.showModal();
    play();
  });
  shortcut.addEventListener('click', e => { e.preventDefault(); enterChat(); });
  document.querySelector('#play-opening').addEventListener('click', play);
  document.querySelector('#skip-opening').addEventListener('click', enterChat);
  video.addEventListener('ended', enterChat);
  video.addEventListener('playing', () => { status.textContent = ''; });
  video.addEventListener('error', () => { status.textContent = '動画を読み込めませんでした。スキップして会話へ進めます。'; });
  opening.addEventListener('cancel', e => { e.preventDefault(); video.pause(); opening.close(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (opening.open) status.textContent = '「再生する」で続きを再生できます。';
  });
  window.addEventListener('pagehide', () => video.pause());
  window.addEventListener('pageshow', () => {
    navigating = false;
    video.pause();
    if (opening.open) opening.close();
    refresh();
  });
  refresh();
})();
