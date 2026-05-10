// --- INITIAL STATE ---
const input = document.getElementById('prompt-input');
const body = document.body;
const statusMsg = document.getElementById('status-msg');
const tensionAudio = document.getElementById('stem-tension');
const stampedeAudio = document.getElementById('stem-stampede');
const artifact = document.getElementById('artifact-overlay');
const userQuote = document.getElementById('user-quote');

let audioCtx, analyser, dataArray;
let isAudioInitialized = false;
let chatHistory = []; 

// --- AUDIO & INPUT ENGINE ---
function initAudio() {
    if (isAudioInitialized) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        const tSource = audioCtx.createMediaElementSource(tensionAudio);
        const sSource = audioCtx.createMediaElementSource(stampedeAudio);
        tSource.connect(analyser); 
        sSource.connect(analyser);
        analyser.connect(audioCtx.destination);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        isAudioInitialized = true;
    } catch (e) { console.error("Audio Blocked:", e); }
}

document.addEventListener('mousedown', () => {
    initAudio();
    if (audioCtx?.state === 'suspended') audioCtx.resume();
    if (tensionAudio.paused) tensionAudio.play();
}, { once: true });

input.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const val = input.value.trim();
        if (!val) return;
        input.disabled = true;
        triggerStampede(val);
    }
});

async function triggerStampede(promptText) {
    body.classList.add('stampede');
    statusMsg.style.opacity = "0";
    tensionAudio.pause();
    stampedeAudio.currentTime = 0;
    stampedeAudio.play();

    userQuote.innerText = "COMMUNING...";
    artifact.classList.add('opacity-100', 'pointer-events-auto');

    try {
        const response = await fetch('/api/oracle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText, history: chatHistory })
        });
        const data = await response.json();
        
        if (data.reply) {
            chatHistory.push({ role: "user", parts: [{ text: promptText }] });
            chatHistory.push({ role: "model", parts: [{ text: data.reply }] });
            setTimeout(() => { 
                userQuote.innerText = `"${data.reply}"`; 
                input.disabled = false;
                input.value = "";
                input.focus();
            }, 2000);
        }
    } catch (e) {
        userQuote.innerText = "SIGNAL LOST. TRY AGAIN.";
        input.disabled = false;
    }
}

// --- 3D VISUAL ENGINE ---
const canvas = document.getElementById('neural-canvas');
const ctx = canvas.getContext('2d');
let frames = [], debris = [];
let mouse = { x: 0, y: 0, speedX: 0, speedY: 0, lastX: 0, lastY: 0 };
let currentCamX = 0, currentCamY = 0;
const FOV = 400, MAX_DEPTH = 3000, SHAFT_RADIUS = 600;

window.addEventListener('mousemove', (e) => {
    mouse.speedX = e.x - mouse.lastX; 
    mouse.speedY = e.y - mouse.lastY;
    mouse.x = e.x; mouse.y = e.y;
    mouse.lastX = e.x; mouse.lastY = e.y;
});

class Frame {
    constructor(z) { 
        this.z = z; 
        this.generatePoints(); 
    }
    generatePoints() {
        this.points = [];
        for (let i = 0; i < 4; i++) {
            let a = (Math.PI * 0.5) * i;
            this.points.push({ baseX: Math.cos(a) * SHAFT_RADIUS, baseY: Math.sin(a) * SHAFT_RADIUS });
        }
    }
    update(speed) {
        this.z -= speed;
        if (this.z < -100) this.z = MAX_DEPTH;
        this.points.forEach(p => {
            let scale = FOV / (FOV + this.z);
            p.sx = (canvas.width/2) + (p.baseX - currentCamX) * scale;
            p.sy = (canvas.height/2) + (p.baseY - currentCamY) * scale;
        });
    }
}

function init() {
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight;
    frames = []; debris = [];
    for (let i = 0; i < 45; i++) frames.push(new Frame((MAX_DEPTH / 45) * i));
    for (let i = 0; i < 400; i++) debris.push({ x: (Math.random()-0.5)*SHAFT_RADIUS*6, y: (Math.random()-0.5)*SHAFT_RADIUS*6, z: Math.random()*MAX_DEPTH, speed: Math.random()+0.5 });
}

function animate() {
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    let sound = 0;
    if (isAudioInitialized && analyser) { analyser.getByteFrequencyData(dataArray); sound = dataArray[5]; }
    
    currentCamX += ((mouse.x - canvas.width/2)*0.6 - currentCamX)*0.03;
    currentCamY += ((mouse.y - canvas.height/2)*0.6 - currentCamY)*0.03;
    
    frames.forEach(f => {
        f.update(1 + sound*0.05);
        let op = Math.max(0, 1 - (f.z / MAX_DEPTH));
        ctx.strokeStyle = `rgba(255,255,255,${op})`;
        ctx.beginPath();
        f.points.forEach((p, j) => { if (j===0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy); });
        ctx.closePath(); ctx.stroke();
    });

    debris.forEach(d => {
        d.z -= 2; if (d.z < 0) d.z = MAX_DEPTH;
        let s = FOV / (FOV + d.z);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, 1-(d.z/MAX_DEPTH))})`;
        ctx.fillRect((canvas.width/2)+(d.x-currentCamX)*s, (canvas.height/2)+(d.y-currentCamY)*s, 2, 2);
    });
    requestAnimationFrame(animate);
}

window.addEventListener('resize', init);
init(); 
animate();
