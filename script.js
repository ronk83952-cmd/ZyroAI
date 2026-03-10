// --- CONFIGURATION (PLACE YOUR KEYS HERE) ---
const MISTRAL_API_KEY = "aMEZWrul1meowT8ApyZm3pjiSSx0bzOz"; // Get from Mistral Studio
const SUPABASE_URL = "https://bxqcvcyzjtkajttzokax.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cWN2Y3l6anRrYWp0dHpva2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjE4NTYsImV4cCI6MjA4ODYzNzg1Nn0.kZ84SbD0dMQwCGqqR77JH_T68cVMWgrD5m2VX3WNrTE";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
lucide.createIcons();

// State
let userProfile = { name: '', age: '', occupation: '', instructions: '' };
let currentSessionUser = null;

// Initialize
async function init() {
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
        currentSessionUser = user;
        document.getElementById('auth-btn').innerHTML = `<i data-lucide="log-out" class="w-5 h-5"></i> Logout`;
        document.getElementById('user-badge').innerText = "Logged In";
        loadProfile();
        lucide.createIcons();
    }
}

// --- AUTH & PROFILE ---
function openAuthModal() { 
    if (currentSessionUser) { sb.auth.signOut(); location.reload(); }
    else { document.getElementById('auth-modal').classList.remove('hidden'); }
}

async function authAction(type) {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const { data, error } = type === 'login' 
        ? await sb.auth.signInWithPassword({ email, password })
        : await sb.auth.signUp({ email, password });

    if (error) alert(error.message);
    else { alert(type === 'login' ? "Welcome back!" : "Check your email!"); location.reload(); }
}

async function saveProfile() {
    if (!currentSessionUser) return alert("Please login to save profile!");
    
    const profile = {
        id: currentSessionUser.id,
        name: document.getElementById('p-name').value,
        age: document.getElementById('p-age').value,
        occupation: document.getElementById('p-job').value,
        custom_instructions: document.getElementById('p-instr').value
    };

    const { error } = await sb.from('profiles').upsert(profile);
    if (!error) { alert("Profile Saved!"); closeModals(); userProfile = profile; }
}

async function loadProfile() {
    const { data } = await sb.from('profiles').select('*').eq('id', currentSessionUser.id).single();
    if (data) {
        userProfile = data;
        document.getElementById('p-name').value = data.name;
        document.getElementById('p-instr').value = data.custom_instructions;
    }
}

// --- CHAT LOGIC ---
async function handleSend() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    appendMessage('user', text);
    input.value = '';
    input.style.height = 'auto';

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: document.getElementById('model-select').value,
                messages: [
                    { role: 'system', content: `User Info: ${userProfile.name}, ${userProfile.occupation}. Instructions: ${userProfile.custom_instructions}` },
                    { role: 'user', content: text }
                ]
            })
        });

        const data = await response.json();
        const aiReply = data.choices[0].message.content;
        appendMessage('assistant', aiReply);

        // Save to Supabase
        if (currentSessionUser) {
            await sb.from('messages').insert([{ 
                user_id: currentSessionUser.id, 
                prompt: text, 
                response: aiReply,
                model_used: document.getElementById('model-select').value
            }]);
        }
    } catch (err) {
        appendMessage('assistant', "Error: Mistral API key missing or invalid.");
    }
}

function appendMessage(role, content) {
    const win = document.getElementById('chat-window');
    const isFirst = win.innerText.includes("How can ZyroAI");
    if (isFirst) win.innerHTML = '';

    const div = document.createElement('div');
    div.className = `p-5 rounded-2xl message-anim ${role === 'assistant' ? 'bg-white/5 border border-white/5' : 'bg-transparent'}`;
    div.innerHTML = `
        <div class="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">${role === 'user' ? 'You' : 'ZyroAI'}</div>
        <div class="whitespace-pre-wrap leading-relaxed">${content}</div>
    `;
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
}

// --- UI HELPERS ---
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    document.getElementById('theme-text').innerText = isLight ? "Dark Mode" : "Light Mode";
    document.getElementById('theme-icon').setAttribute('data-lucide', isLight ? 'moon' : 'sun');
    lucide.createIcons();
}

function openProfile() { document.getElementById('profile-modal').classList.remove('hidden'); }
function closeModals() { 
    document.getElementById('auth-modal').classList.add('hidden'); 
    document.getElementById('profile-modal').classList.add('hidden'); 
}
function autoGrow(element) { element.style.height = "5px"; element.style.height = (element.scrollHeight) + "px"; }
function newChat() { document.getElementById('chat-window').innerHTML = ''; }

init();
