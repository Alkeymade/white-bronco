// --- INTERFACE SETUP ---
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

// --- AUDIO ENGINE ---
function initAudio() {
    if (isAudioInitialized) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        const tSource = audioCtx.createMediaElementSource(tensionAudio);
        const sSource = audioCtx.createMediaElementSource(stampedeAudio);
        tSource.connect(analyser); sSource.connect(analyser);
        analyser.connect(audioCtx.destination);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        isAudioInitialized = true;
    } catch (e) { console.error("Audio block:", e); }
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
        
        chatHistory.push({ role: "user", parts: [{ text: promptText }] });
        chatHistory.push({ role: "model", parts: [{ text: data.reply }] });

        setTimeout(() => { userQuote.innerText = `"${data.reply}"`; }, 2000);
    } catch (e) { userQuote.innerText = "REFUSED."; }
}

// --- VISUAL ENGINE ---
const canvas = document.getElementById('neural-canvas');
const ctx = canvas.getContext('2d');
let frames = [], debris = [];
let mouse = { x: 0, y: 0, speedX: 0, speedY: 0, lastX: 0, lastY: 0 };
let currentCamX = 0, currentCamY = 0;
const FOV = 400, MAX_DEPTH = 3000, SHAFT_RADIUS = 600;

window.addEventListener('mousemove', (e) => {
    mouse.speedX = e.x - mouse.lastX; mouse.speedY = e.y - mouse.lastY;
    mouse.x = e.x; mouse.y = e.y;
    mouse.lastX = e.x; mouse.lastY = e.y;
});

class Frame {
    constructor(z) { this.z = z; this.generatePoints(); }
    generatePoints() {
        this.points = [];
        for (let i = 0; i < 4; i++) {
            let a = (Math.PI * 0.5) * i;
            this.points.push({ baseX: Math.cos(a) * SHAFT_RADIUS, baseY: Math.sin(a) * SHAFT_RADIUS, offsetX: 0, offsetY: 0, vx: 0, vy: 0 });
        }
    }
    update(speed, sound) {
        this.z -= speed;
        if (this.z < -100) { this.z = MAX_DEPTH; }
        this.points.forEach(p => {
            let scale = FOV / (FOV + this.z);
            let px = (canvas.width/2) + (p.baseX - currentCamX) * scale + (p.offsetX * scale);
            let py = (canvas.height/2) + (p.baseY - currentCamY) * scale + (p.offsetY * scale);
            p.sx = px; p.sy = py;
        });
    }
}

function init() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
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
        f.update(1 + sound*0.05, sound);
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
init(); animate();
            setTimeout(() => { 
                userQuote.innerText = `"${data.reply}"`; 
            }, 2000);
        } else {
            throw new Error("Empty response");
        }

    } catch (e) {
        console.error(e);
        userQuote.innerText = "THE MACHINE REFUSES YOUR OFFERING.";
    }
}

}


// --- 3D PLUCKABLE ENGINE ---
const canvas = document.getElementById('neural-canvas');
const ctx = canvas.getContext('2d');
let frames = [], debris = [];
let mouse = { x: 0, y: 0, speedX: 0, speedY: 0, lastX: 0, lastY: 0 };
let currentCamX = 0, currentCamY = 0;

const FOV = 400, MAX_DEPTH = 3000, SHAFT_RADIUS = 600;
let currentSides = 4, targetSides = 4;

window.addEventListener('mousemove', (e) => {
    mouse.speedX = e.x - mouse.lastX; mouse.speedY = e.y - mouse.lastY;
    mouse.x = e.x; mouse.y = e.y;
    mouse.lastX = e.x; mouse.lastY = e.y;
});

class Frame {
    constructor(z) {
        this.z = z;
        this.thicknessMultiplier = Math.random() * 1.5 + 0.5;
        this.points = [];
        this.generatePoints();
    }
    generatePoints() {
        this.points = [];
        for (let i = 0; i < currentSides; i++) {
            let a = (Math.PI * 2 / currentSides) * i;
            this.points.push({ baseX: Math.cos(a) * SHAFT_RADIUS, baseY: Math.sin(a) * SHAFT_RADIUS, offsetX: 0, offsetY: 0, vx: 0, vy: 0, isGrabbed: false });
        }
    }
    update(speed, sound) {
        this.z -= speed;
        if (this.z < -100) { this.z = MAX_DEPTH; this.generatePoints(); }
        this.points.forEach(p => {
            let scale = FOV / (FOV + this.z);
            let angle = this.z * 0.00005;
            let rx = p.baseX * Math.cos(angle) - p.baseY * Math.sin(angle);
            let ry = p.baseX * Math.sin(angle) + p.baseY * Math.cos(angle);
            let px = (canvas.width/2) + (rx - currentCamX) * scale + (p.offsetX * scale);
            let py = (canvas.height/2) + (ry - currentCamY) * scale + (p.offsetY * scale);

            if (!p.isGrabbed && Math.sqrt((mouse.x - px)**2 + (mouse.y - py)**2) < 50 * scale) p.isGrabbed = true;
            if (p.isGrabbed) {
                p.offsetX = (mouse.x - ((canvas.width/2) + (rx - currentCamX) * scale)) / scale;
                p.offsetY = (mouse.y - ((canvas.height/2) + (ry - currentCamY) * scale)) / scale;
                if (Math.sqrt(p.offsetX**2 + p.offsetY**2) > 250) { p.isGrabbed = false; p.vx = mouse.speedX; p.vy = mouse.speedY; }
            } else {
                p.vx += (-p.offsetX) * 0.08; p.vy += (-p.offsetY) * 0.08;
                p.vx *= 0.85; p.vy *= 0.85;
                p.offsetX += p.vx; p.offsetY += p.vy;
            }
            p.sx = px; p.sy = py;
        });
    }
}

function init() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    frames = []; debris = [];
    for (let i = 0; i < 45; i++) frames.push(new Frame((MAX_DEPTH / 45) * i));
    for (let i = 0; i < 800; i++) debris.push({ x: (Math.random()-0.5)*SHAFT_RADIUS*6, y: (Math.random()-0.5)*SHAFT_RADIUS*6, z: Math.random()*MAX_DEPTH, speed: Math.random()+0.5 });
}
function animate() {
    // 1. Clear the canvas every frame
    ctx.fillStyle = 'black'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let sound = 0; 
    // 2. SAFE AUDIO CHECK: Only get sound data if everything is ready
    if (isAudioInitialized && analyser && dataArray) { 
        analyser.getByteFrequencyData(dataArray); 
        sound = dataArray[5] || 0; 
    }
    
    // 3. CAMERA LOGIC
    currentCamX += ((mouse.x - canvas.width/2)*0.6 - currentCamX)*0.03;
    currentCamY += ((mouse.y - canvas.height/2)*0.6 - currentCamY)*0.03;
    
    // 4. DRAW FRAMES
    frames.sort((a,b) => b.z - a.z);
    frames.forEach((f) => {
        f.update(0.6 + sound*0.02, sound);
        let op = Math.pow(Math.max(0, 1 - (f.z / (MAX_DEPTH*0.45))), 3);
        ctx.strokeStyle = `rgba(255,255,255,${op})`; 
        ctx.lineWidth = Math.max(0.1, 2*op*f.thicknessMultiplier);
        ctx.beginPath();
        f.points.forEach((p, j) => { 
            if (j===0) ctx.moveTo(p.sx, p.sy); 
            else ctx.lineTo(p.sx, p.sy); 
        });
        ctx.closePath(); 
        ctx.stroke();
    });

    // 5. DRAW DEBRIS (THE STARS)
    debris.forEach(d => {
        d.z -= (0.6 * d.speed); 
        if (d.z < -100) d.z = MAX_DEPTH;
        let s = FOV / (FOV + d.z);
        let op = Math.pow(Math.max(0, 1 - (d.z / (MAX_DEPTH*0.7))), 2);
        ctx.fillStyle = `rgba(255,255,255,${op*0.8})`;
        ctx.fillRect((canvas.width/2)+(d.x-currentCamX)*s, (canvas.height/2)+(d.y-currentCamY)*s, 2*s, 2*s);
    });

    // 6. KEEP THE LOOP GOING
    requestAnimationFrame(animate);
}


window.addEventListener('resize', init);
init(); animate();
