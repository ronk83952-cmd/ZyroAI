// 1. INITIALIZE TOOLS
lucide.createIcons();
const supabase = supabase.createClient('https://bxqcvcyzjtkajttzokax.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cWN2Y3l6anRrYWp0dHpva2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjE4NTYsImV4cCI6MjA4ODYzNzg1Nn0.kZ84SbD0dMQwCGqqR77JH_T68cVMWgrD5m2VX3WNrTE');

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const themeToggle = document.getElementById('theme-toggle');

// 2. THEME TOGGLE
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    themeToggle.querySelector('span').innerText = isLight ? 'Dark Mode' : 'Light Mode';
    themeToggle.querySelector('i').setAttribute('data-lucide', isLight ? 'moon' : 'sun');
    lucide.createIcons();
});

// 3. CHAT LOGIC
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Clear welcome text if first message
    if (chatWindow.innerText.includes("Start a conversation")) chatWindow.innerHTML = '';

    appendMessage('user', text);
    userInput.value = '';

    // Call Netlify Function (AI Wrapper)
    try {
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            body: JSON.stringify({
                prompt: text,
                model: document.getElementById('model-select').value
            })
        });
        const data = await response.json();
        appendMessage('assistant', data.reply);
        
        // Save to Supabase (Record the prompt/response)
        saveToHistory(text, data.reply);
    } catch (err) {
        appendMessage('assistant', "I'm having trouble connecting to my brain. Please check your Netlify logs.");
    }
}

function appendMessage(role, content) {
    const div = document.createElement('div');
    div.className = `flex gap-4 p-4 rounded-xl message-fade ${role === 'assistant' ? 'bg-white/5' : ''}`;
    div.innerHTML = `
        <div class="w-8 h-8 rounded flex items-center justify-center font-bold ${role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'}">
            ${role === 'user' ? 'U' : 'AI'}
        </div>
        <div class="flex-1 leading-relaxed">${content}</div>
    `;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// 4. SUPABASE FUNCTIONS
async function saveToHistory(prompt, response) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Only save if logged in

    await supabase.from('messages').insert([
        { user_id: user.id, prompt: prompt, response: response, model: document.getElementById('model-select').value }
    ]);
}

async function handleAuth() {
    // This is a placeholder for a login popup
    alert("Connect your Supabase Auth here!");
}

function toggleModal() {
    document.getElementById('profile-modal').classList.toggle('hidden');
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }});
