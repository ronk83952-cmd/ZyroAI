lucide.createIcons();
const supabase = supabase.createClient('https://bxqcvcyzjtkajttzokax.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cWN2Y3l6anRrYWp0dHpva2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjE4NTYsImV4cCI6MjA4ODYzNzg1Nn0.kZ84SbD0dMQwCGqqR77JH_T68cVMWgrD5m2VX3WNrTE');

let currentUser = null;
let profileData = { name: '', age: '', occupation: '', instructions: '' };

// --- 1. AUTH LOGIC ---
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
        document.getElementById('auth-text').innerText = "Profile";
        document.getElementById('user-status').innerText = `Logged in as ${user.email}`;
        fetchProfile();
    }
}

async function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message); else alert("Check your email for confirmation!");
}

async function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else location.reload();
}

async function googleSignIn() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
}

// --- 2. CHAT LOGIC ---
async function sendMessage() {
    const text = document.getElementById('user-input').value;
    if (!text) return;

    appendMessage('user', text);
    document.getElementById('user-input').value = '';

    const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        body: JSON.stringify({
            prompt: text,
            model: document.getElementById('model-select').value,
            instructions: profileData.instructions
        })
    });
    
    const data = await response.json();
    appendMessage('assistant', data.reply);

    // Save to Supabase ONLY if logged in
    if (currentUser) {
        await supabase.from('messages').insert([{ 
            user_id: currentUser.id, prompt: text, response: data.reply 
        }]);
    }
}

function appendMessage(role, content) {
    const win = document.getElementById('chat-window');
    const div = document.createElement('div');
    div.className = `p-4 rounded-xl ${role === 'assistant' ? 'bg-white/5 border border-white/5' : ''}`;
    div.innerHTML = `<div class="font-bold mb-1">${role === 'user' ? 'You' : 'ZyroAI'}</div><div>${content}</div>`;
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
}

// --- 3. THEME & UI ---
document.getElementById('theme-toggle').addEventListener('click', () => {
    const body = document.body;
    body.classList.toggle('light-theme');
    const isLight = body.classList.contains('light-theme');
    body.style.backgroundColor = isLight ? "#ffffff" : "#212121";
    body.style.color = isLight ? "#000000" : "#ffffff";
    document.getElementById('theme-toggle').querySelector('span').innerText = isLight ? "Dark Mode" : "Light Mode";
});

document.getElementById('auth-btn').addEventListener('click', () => {
    document.getElementById('auth-modal').classList.toggle('hidden');
});

function closeModal() { document.getElementById('auth-modal').classList.add('hidden'); }

document.getElementById('send-btn').addEventListener('click', sendMessage);
checkUser();
