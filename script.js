// --- INTERFACE SETUP ---
const input = document.getElementById('prompt-input');
const body = document.body;
const statusMsg = document.getElementById('status-msg');
const tensionAudio = document.getElementById('stem-tension');
const stampedeAudio = document.getElementById('stem-stampede');
const artifact = document.getElementById('artifact-overlay');
const userQuote = document.getElementById('user-quote');

// --- WEB AUDIO API ---
let audioCtx;
let analyser;
let dataArray;
let isAudioInitialized = false;

function initAudio() {
    if (isAudioInitialized) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.smoothingTimeConstant = 0.8; 
    analyser.fftSize = 256; 
    
    const tensionSource = audioCtx.createMediaElementSource(tensionAudio);
    const stampedeSource = audioCtx.createMediaElementSource(stampedeAudio);
    
    tensionSource.connect(analyser);
    stampedeSource.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    isAudioInitialized = true;
}

document.addEventListener('mousedown', () => {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (tensionAudio.paused) tensionAudio.play();
}, { once: true });

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const val = input.value.trim();
        if (!val) return;
        statusMsg.style.opacity = "1";
        input.disabled = true;
        setTimeout(() => { triggerStampede(val); }, 1000);
    }
});
async function triggerStampede(promptText) {
    body.classList.add('stampede');
    statusMsg.style.opacity = "0";
    
    tensionAudio.pause();
    stampedeAudio.currentTime = 0;
    stampedeAudio.play();

    // 1. Show the artifact overlay immediately, but with a loading state
    userQuote.innerText = "COMMUNING WITH THE VOID...";
    artifact.classList.add('opacity-100', 'pointer-events-auto');

    try {
        // 2. Call the hidden AI backend
        const response = await fetch('/api/oracle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: promptText })
        });

        const data = await response.json();

        // 3. Once the AI responds, type it out or display it
        setTimeout(() => {
            userQuote.innerText = `"${data.reply}"`;
        }, 1500); // Slight delay so it hits with the heavy part of the beat

    } catch (error) {
        setTimeout(() => {
            userQuote.innerText = "THE MACHINE REFUSES YOUR OFFERING.";
        }, 1500);
    }
}

}

// --- TRUE PLUCKABLE 3D ABYSS ENGINE ---
const canvas = document.getElementById('neural-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Mouse Tracking (Added velocity tracking for the snaps)
let mouse = { 
    x: canvas.width / 2, 
    y: canvas.height / 2, 
    speedX: 0,
    speedY: 0,
    lastX: canvas.width / 2,
    lastY: canvas.height / 2 
};
let currentCamX = 0; 
let currentCamY = 0; 

window.addEventListener('mousemove', (event) => {
    mouse.speedX = event.x - mouse.lastX;
    mouse.speedY = event.y - mouse.lastY;
    mouse.x = event.x;
    mouse.y = event.y;
    mouse.lastX = event.x;
    mouse.lastY = event.y;
});

const FOV = 400; 
const MAX_DEPTH = 3000; 
const SHAFT_RADIUS = 600; 

let currentSides = 4; 
let targetSides = 4;
let glitchTimer = 0;

class Frame {
    constructor(z) {
        this.z = z;
        this.points = [];
        this.thicknessMultiplier = Math.random() * 1.5 + 0.5; 
        this.generatePoints();
    }

    generatePoints() {
        this.points = [];
        for (let i = 0; i < currentSides; i++) {
            let angle = (Math.PI * 2 / currentSides) * i;
            let x = Math.cos(angle) * SHAFT_RADIUS;
            let y = Math.sin(angle) * SHAFT_RADIUS;
            
            // Every single corner of the building is now a physics object
            this.points.push({ 
                baseX: x, 
                baseY: y,
                offsetX: 0, 
                offsetY: 0,
                vx: 0, 
                vy: 0,
                isGrabbed: false,
                screenX: 0,
                screenY: 0
            });
        }
    }

    update(speed, soundForce) {
        this.z -= speed;

        if (this.z < -100) {
            this.z = MAX_DEPTH;
            this.thicknessMultiplier = Math.random() * 1.5 + 0.5; 
            this.generatePoints(); 
        }

        if (soundForce > 190) {
            this.points.forEach(p => {
                p.vx += (Math.random() - 0.5) * (soundForce * 0.05);
                p.vy += (Math.random() - 0.5) * (soundForce * 0.05);
            });
        }
    }
}

let frames = [];
let numFrames = 45;
for (let i = 0; i < numFrames; i++) {
    frames.push(new Frame((MAX_DEPTH / numFrames) * i));
}

let debris = [];
let numDebris = 800; 
for (let i = 0; i < numDebris; i++) {
    debris.push({
        x: (Math.random() - 0.5) * SHAFT_RADIUS * 6.0, 
        y: (Math.random() - 0.5) * SHAFT_RADIUS * 6.0,
        z: Math.random() * MAX_DEPTH,
        speed: Math.random() * 1.5 + 0.5,
        baseSize: Math.random() * 2.5 + 1.0 
    });
}

function animateEngine() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let soundForce = 0;
    if (isAudioInitialized) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i = 0; i < 15; i++) { sum += dataArray[i]; }
        soundForce = sum / 15;
    }

    let baseSpeed = 0.6 + (soundForce * 0.02);

    // Camera smoothing
    let targetCamX = (mouse.x - canvas.width / 2) * 0.6;
    let targetCamY = (mouse.y - canvas.height / 2) * 0.6;
    currentCamX += (targetCamX - currentCamX) * 0.03;
    currentCamY += (targetCamY - currentCamY) * 0.03;

    if (soundForce > 200 && glitchTimer === 0) {
        targetSides = [3, 4, 6, 8][Math.floor(Math.random() * 4)];
        glitchTimer = 60; 
    }
    if (glitchTimer > 0) glitchTimer--;

    if (Math.abs(currentSides - targetSides) > 0.05) {
        currentSides += (targetSides - currentSides) * 0.02;
        frames.forEach(f => f.generatePoints());
    }

    frames.sort((a, b) => b.z - a.z);

    // DRAW THE PLUCKABLE ABYSS
    for (let i = 0; i < frames.length; i++) {
        let frame = frames[i];
        frame.update(baseSpeed, soundForce);

        let frameStress = 0;

        // 1. Calculate the Spring Physics for all vertices in this frame
        for (let j = 0; j < frame.points.length; j++) {
            let p = frame.points[j];

            // Apply the slow 3D twist
            let angleOffset = frame.z * 0.00005;
            let rotatedX = p.baseX * Math.cos(angleOffset) - p.baseY * Math.sin(angleOffset);
            let rotatedY = p.baseX * Math.sin(angleOffset) + p.baseY * Math.cos(angleOffset);

            // Calculate raw projection (where the building SHOULD be)
            let scale = FOV / (FOV + frame.z);
            let projBaseX = (canvas.width / 2) + ((rotatedX - currentCamX) * scale);
            let projBaseY = (canvas.height / 2) + ((rotatedY - currentCamY) * scale);

            // Current position INCLUDING spring offset
            let currentProjX = projBaseX + (p.offsetX * scale);
            let currentProjY = projBaseY + (p.offsetY * scale);

            // Distance to mouse cursor
            let dist = Math.sqrt((mouse.x - currentProjX)**2 + (mouse.y - currentProjY)**2);

            // Grab the wall if mouse gets close
            if (!p.isGrabbed && dist < 50 * scale) {
                p.isGrabbed = true;
            }

            if (p.isGrabbed) {
                // Stretch the 3D vertex toward the mouse
                p.offsetX = (mouse.x - projBaseX) / scale;
                p.offsetY = (mouse.y - projBaseY) / scale;

                // If pulled too far, violently SNAP
                let stretchDist = Math.sqrt(p.offsetX**2 + p.offsetY**2);
                if (stretchDist > 250) { 
                    p.isGrabbed = false;
                    p.vx = (mouse.speedX * 2) / scale;
                    p.vy = (mouse.speedY * 2) / scale;
                }
            } else {
                // Spring physics: pull back to shape and vibrate
                p.vx += (-p.offsetX) * 0.08; // Tension
                p.vy += (-p.offsetY) * 0.08;
                p.vx *= 0.85; // Friction
                p.vy *= 0.85;
                p.offsetX += p.vx;
                p.offsetY += p.vy;
            }

            // Save final screen coordinates for drawing
            p.screenX = projBaseX + (p.offsetX * scale);
            p.screenY = projBaseY + (p.offsetY * scale);

            // Track how aggressively this specific frame is vibrating
            frameStress = Math.max(frameStress, Math.abs(p.vx) + Math.abs(p.vy));
            if (p.isGrabbed) frameStress += 15;
        }

        // 2. Styling and Fading
        let architectureDepthThreshold = MAX_DEPTH * 0.45;
        let depthRatio = Math.max(0, 1 - (frame.z / architectureDepthThreshold));
        depthRatio = Math.pow(depthRatio, 3); 
        let opacity = depthRatio;

        // If the structure is being violently plucked or vibrating, it glows red
        if (frameStress > 5 || (frame.z < 300 && Math.random() > 0.98)) {
            ctx.strokeStyle = `rgba(255, 0, 0, ${Math.min(1, opacity + 0.5)})`;
        } else {
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        }
        
        ctx.lineWidth = Math.max(0.1, (2 * depthRatio) * frame.thicknessMultiplier); 

        // 3. Draw the distorted horizontal floor rings
        ctx.beginPath();
        for (let j = 0; j < frame.points.length; j++) {
            let p = frame.points[j];
            if (j === 0) {
                ctx.moveTo(p.screenX, p.screenY);
            } else {
                ctx.lineTo(p.screenX, p.screenY);
            }
        }
        ctx.lineTo(frame.points[0].screenX, frame.points[0].screenY); 
        ctx.stroke();

        // 4. Draw the distorted vertical walls connecting the frames
        if (i > 0) {
            let prevFrame = frames[i - 1];
            ctx.beginPath();
            if (Math.round(currentSides) === Math.round(targetSides)) {
                for (let j = 0; j < frame.points.length; j++) {
                    ctx.moveTo(frame.points[j].screenX, frame.points[j].screenY);
                    ctx.lineTo(prevFrame.points[j].screenX, prevFrame.points[j].screenY);
                }
            }
            ctx.strokeStyle = `rgba(161, 161, 170, ${opacity * 0.4})`; 
            ctx.stroke();
        }
    }

    // DRAW DUST FIELD
    ctx.fillStyle = 'white';
    for (let i = 0; i < debris.length; i++) {
        let d = debris[i];
        d.z -= (baseSpeed * d.speed);
        
        if (d.z < -100) {
            d.z = MAX_DEPTH;
            d.x = (Math.random() - 0.5) * SHAFT_RADIUS * 6.0;
            d.y = (Math.random() - 0.5) * SHAFT_RADIUS * 6.0;
        }

        let scale = FOV / (FOV + d.z);
        let screenX = (canvas.width / 2) + ((d.x - currentCamX) * scale);
        let screenY = (canvas.height / 2) + ((d.y - currentCamY) * scale);
        
        let size = Math.max(1.0, d.baseSize * scale); 
        let debrisDepthThreshold = MAX_DEPTH * 0.70; 
        let depthRatioDebris = Math.pow(Math.max(0, 1 - (d.z / debrisDepthThreshold)), 2);
        
        ctx.fillStyle = `rgba(255, 255, 255, ${depthRatioDebris * 0.85})`;
        ctx.beginPath();
        ctx.rect(screenX, screenY, size, size); 
        ctx.fill();
    }

    requestAnimationFrame(animateEngine);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Start Engine
animateEngine();
