// Client-side logic for the Taoist learning assistant.

(() => {
  const conversationEl = document.getElementById('conversation');
  const formEl = document.getElementById('chat-form');
  const inputEl = document.getElementById('user-input');
  const modeEl = document.getElementById('mode');

  // Maintain conversation history as an array of { role, content }
  const history = [];

  // Render a message in the conversation panel
  function renderMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = `bubble ${role}`;
    bubbleDiv.textContent = content;
    messageDiv.appendChild(bubbleDiv);
    conversationEl.appendChild(messageDiv);
    // Scroll to bottom after each new message
    conversationEl.scrollTop = conversationEl.scrollHeight;
  }

  // Handle form submission
  async function handleSubmit(event) {
    event.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;

    const mode = modeEl.value;
    // Show user's message
    renderMessage('user', text);
    history.push({ role: 'user', content: text });
    inputEl.value = '';

    // Disable form while waiting for response
    const submitButton = formEl.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: history, mode }),
      });
      if (!response.ok) {
        throw new Error('请求失败，请稍后再试。');
      }
      const data = await response.json();
      const reply = data?.reply?.trim() || '抱歉，我暂时无法回答。';
      renderMessage('assistant', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      console.error(err);
      renderMessage('assistant', '发生错误：' + err.message);
    } finally {
      submitButton.disabled = false;
    }
  }

  formEl.addEventListener('submit', handleSubmit);

  // Optional: Provide an opening message when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    const welcome =
      '你好，我是你的道家文化学习助手！您可以选择“初学入门”或“深入学习”模式，然后输入想要了解的内容。让我们开始吧。';
    renderMessage('assistant', welcome);
    history.push({ role: 'assistant', content: welcome });
  });
})();
