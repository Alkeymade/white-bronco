// --- 1. INTERFACE SETUP ---
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

// --- 2. AUDIO ENGINE ---
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
    } catch (e) { 
        console.error("Audio Blocked:", e); 
    }
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

// --- 3. AI & STAMPEDE LOGIC ---
async function triggerStampede(promptText) {
    body.classList.add('stampede');
    statusMsg.style.opacity = "0";
    tensionAudio.pause();
    stampedeAudio.currentTime = 0;
    stampedeAudio.play();

    userQuote.innerText = "COMMUNING WITH THE VOID...";
    artifact.classList.add('opacity-100', 'pointer-events-auto');

    try {
        const response = await fetch('/api/oracle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText, history: chatHistory })
        });
        const data = await response.json();
        
        chatHistory.push({ role: "user", parts: [{ text: promptText }] });
        chatHistory.push({ role: "model", parts: [{ text: data.reply }] });

        setTimeout(() => { 
            userQuote.innerText = `"${data.reply}"`; 
            input.disabled = false;
            input.value = "";
        }, 2000);
    } catch (e) { 
        userQuote.innerText = "THE MACHINE REFUSES YOUR OFFERING."; 
        input.disabled = false;
    }
}

// --- 4. 3D PHYSICS ENGINE ---
const canvas = document.getElementById('neural-canvas');
const ctx = canvas.getContext('2d');
let frames = [], debris = [];
let mouse = { x: 0, y: 0, speedX: 0, speedY: 0, lastX: 0, lastY: 0 };
let currentCamX = 0, currentCamY = 0;
const FOV = 400, MAX_DEPTH = 3000, SHAFT_RADIUS = 600;

window.addEventListener('mousemove', (e) => {
    mouse.speedX = e.x - mouse.lastX; 
    mouse.speedY = e.y - mouse.lastY;
    mouse.x = e.x; 
    mouse.y = e.y;
    mouse.lastX = e.x; 
    mouse.lastY = e.y;
});

class Frame {
    constructor(z) { 
        this.z = z; 
        this.thicknessMultiplier = Math.random() * 1.5 + 0.5;
        this.points = [];
        for (let i = 0; i < 4; i++) {
            let a = (Math.PI * 0.5) * i;
            this.points.push({ 
                rx: Math.cos(a) * SHAFT_RADIUS, 
                ry: Math.sin(a) * SHAFT_RADIUS, 
                offsetX: 0, offsetY: 0, vx: 0, vy: 0, isGrabbed: false 
            });
        }
    }
    update(speed, sound) {
        this.z -= speed;
        if (this.z < -100) this.z = MAX_DEPTH;
        let scale = FOV / (FOV + this.z);
        
        this.points.forEach(p => {
            let px = (canvas.width/2) + (p.rx - currentCamX) * scale;
            let py = (canvas.height/2) + (p.ry - currentCamY) * scale;

            // Interaction logic
            if (Math.sqrt((mouse.x - px)**2 + (mouse.y - py)**2) < 50 * scale) p.isGrabbed = true;
            
            if (p.isGrabbed) {
                p.offsetX = (mouse.x - px) / scale;
                p.offsetY = (mouse.y - py) / scale;
                if (Math.sqrt(p.offsetX**2 + p.offsetY**2) > 250) { 
                    p.isGrabbed = false; p.vx = mouse.speedX; p.vy = mouse.speedY; 
                }
            } else {
                p.vx += (-p.offsetX) * 0.08; p.vy += (-p.offsetY) * 0.08;
                p.vx *= 0.85; p.vy *= 0.85;
                p.offsetX += p.vx; p.offsetY += p.vy;
            }
            p.sx = px + p.offsetX * scale; p.sy = py + p.offsetY * scale;
        });
    }
}

function init() {
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight;
    frames = []; debris = [];
    for (let i = 0; i < 45; i++) frames.push(new Frame((MAX_DEPTH / 45) * i));
    for (let i = 0; i < 600; i++) debris.push({ 
        x: (Math.random()-0.5)*SHAFT_RADIUS*6, y: (Math.random()-0.5)*SHAFT_RADIUS*6, 
        z: Math.random()*MAX_DEPTH, speed: Math.random()+0.5 
    });
}

function animate() {
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    let sound = 0;
    if (isAudioInitialized && analyser) { 
        analyser.getByteFrequencyData(dataArray); 
        sound = dataArray[5]; 
    }
    
    currentCamX += ((mouse.x - canvas.width/2)*0.6 - currentCamX)*0.03;
    currentCamY += ((mouse.y - canvas.height/2)*0.6 - currentCamY)*0.03;
    
    frames.sort((a,b) => b.z - a.z).forEach(f => {
        f.update(0.6 + sound*0.02, sound);
        let op = Math.pow(Math.max(0, 1 - (f.z / (MAX_DEPTH*0.45))), 3);
        ctx.strokeStyle = `rgba(255,255,255,${op})`;
        ctx.lineWidth = Math.max(0.1, 2*op*f.thicknessMultiplier);
        ctx.beginPath();
        f.points.forEach((p, j) => { if (j===0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy); });
        ctx.closePath(); ctx.stroke();
    });

    debris.forEach(d => {
        d.z -= (0.6 * d.speed); if (d.z < -100) d.z = MAX_DEPTH;
        let s = FOV / (FOV + d.z);
        let op = Math.pow(Math.max(0, 1 - (d.z / (MAX_DEPTH*0.7))), 2);
        ctx.fillStyle = `rgba(255,255,255,${op*0.8})`;
        ctx.fillRect((canvas.width/2)+(d.x-currentCamX)*s, (canvas.height/2)+(d.y-currentCamY)*s, 2*s, 2*s);
    });
    requestAnimationFrame(animate);
}

// --- 5. INITIALIZE ENGINE ---
window.addEventListener('resize', init);
init(); 
animate();
