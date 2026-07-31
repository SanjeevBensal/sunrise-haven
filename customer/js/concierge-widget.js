document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('concierge-modal');
  const trigger = document.getElementById('concierge-trigger');
  const closeBtn = document.getElementById('concierge-close');
  const sendBtn = document.getElementById('chat-send');
  const input = document.getElementById('chat-input');
  const chatBody = document.getElementById('chat-messages');
  const chipsBox = document.getElementById('suggestion-chips');

  const sessionId = 'session_' + Math.random().toString(36).substring(2, 9);

  trigger.addEventListener('click', () => modal.classList.toggle('hidden'));
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  async function sendMessage(text) {
    if (!text.trim()) return;

    // Append user message
    chatBody.innerHTML += `<div class="msg user-msg">${text}</div>`;
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const res = await fetch('http://127.0.0.1:8000/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text })
      });

      const data = await res.json();

      // Append bot response
      chatBody.innerHTML += `<div class="msg bot-msg">${data.reply}</div>`;

      // Render Cloudinary Room Cards if returned
      if (data.room_cards && data.room_cards.length > 0) {
        data.room_cards.forEach(room => {
          const img = room.images[0] || 'https://via.placeholder.com/300x200';
          chatBody.innerHTML += `
            <div class="msg bot-msg" style="width:100%; max-width:100%; padding:8px;">
              <img src="${img}" style="width:100%; height:120px; object-fit:cover; border-radius:8px;" />
              <div style="font-weight:600; margin-top:6px;">${room.name}</div>
              <div style="font-size:12px; color:var(--deep-blue);">₱${room.price.toLocaleString()} / night</div>
              <a href="availability.html" style="display:inline-block; margin-top:6px; font-size:11px; text-decoration:underline;">Book this room →</a>
            </div>`;
        });
      }

      // Render Follow-up Chips
      chipsBox.innerHTML = (data.suggestions || []).map(s => `<button class="chip">${s}</button>`).join('');
      chipsBox.querySelectorAll('.chip').forEach(c => {
        c.addEventListener('click', () => sendMessage(c.textContent));
      });

      chatBody.scrollTop = chatBody.scrollHeight;

    } catch (err) {
      chatBody.innerHTML += `<div class="msg bot-msg" style="color:red;">Concierge is offline temporarily.</div>`;
    }
  }

  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(input.value); });
});