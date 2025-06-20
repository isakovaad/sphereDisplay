import * as THREE from 'https://esm.sh/three@0.150.1';
import { OrbitControls } from 'https://esm.sh/three@0.150.1/examples/jsm/controls/OrbitControls.js';

// ==================== WEBSOCKET AND AUDIO DATA ====================
let socket = null;
let isConnected = false;
let audioData = {
  leftMic: 0,
  rightMic: 0,
  difference: 0,
  averageLevel: 0
};

// ==================== THREE.JS SCENE SETUP ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f0f0f0');

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// ==================== LIGHTING ====================
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Add enhanced lighting for better sphere rendering
const pointLight1 = new THREE.PointLight(0xffffff, 0.6, 50);
pointLight1.position.set(-3, 2, 4);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 0.4, 50);
pointLight2.position.set(4, -3, -2);
scene.add(pointLight2);

// ==================== FLOOR ====================
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// ==================== TABLE ====================
const outerRadius = 3.2;
const innerRadius = 1.2;
const tableGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 8);
const tableMaterial = new THREE.MeshStandardMaterial({ color: 0xf5deb3, side: THREE.DoubleSide });
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.rotation.x = -Math.PI / 2;
table.position.y = 0.75;
scene.add(table);

// ==================== CHAIR CREATION ====================
function createSimpleChair() {
  const chair = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), new THREE.MeshStandardMaterial({ color: 0x333333 }));
  seat.position.y = 0.4;
  chair.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: 0x555555 }));
  back.position.set(0, 0.65, -0.225);
  chair.add(back);

  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const positions = [[0.2, 0.2], [-0.2, 0.2], [0.2, -0.2], [-0.2, -0.2]];
  for (let [x, z] of positions) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, 0.2, z);
    chair.add(leg);
  }
  return chair;
}

// ==================== ADD CHAIRS AROUND TABLE ====================
const numChairs = 10;
const chairPositions = [];
for (let i = 0; i < numChairs; i++) {
  const angle = (i / numChairs) * Math.PI * 2;
  const x = Math.cos(angle) * 3.5;
  const z = Math.sin(angle) * 3.5;
  chairPositions.push({ x, z, angle });
  
  const chair = createSimpleChair();
  chair.position.set(x, 0, z);
  chair.rotation.y = -angle + Math.PI;
  scene.add(chair);
}

// ==================== PEOPLE MANAGEMENT ====================
let peopleCount = 0;
const maxPeople = 10;
const sphereColors = [
  0x53c566, 0x53c566, 0x3e9d4e, 0xff8800, 0xff6600,
  0xff4400, 0xff2200, 0xff2300, 0xdd2500, 0xbb0000
];

function addPersonToChair(index) {
  const personHeight = 0.6;
  const geometry = new THREE.CylinderGeometry(0.15, 0.15, personHeight, 16);
  const material = new THREE.MeshStandardMaterial({ color: 0x3366ff });
  const person = new THREE.Mesh(geometry, material);
  const { x, z, angle } = chairPositions[index];
  person.position.set(x, 0.4 + personHeight / 2, z);
  person.rotation.y = -angle + Math.PI;
  scene.add(person);
}

// ==================== ENHANCED SPHERE CREATION ====================
const sphereRadius = 0.6;

// Create wave texture using canvas - enhanced for dynamic colors
function createWaveTexture(baseColor = 0x6bf07d) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Convert hex color to RGB
  const r = (baseColor >> 16) & 255;
  const g = (baseColor >> 8) & 255;
  const b = baseColor & 255;
  
  // Create gradient background based on base color
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`);
  gradient.addColorStop(0.3, `rgb(${r}, ${g}, ${b})`);
  gradient.addColorStop(0.6, `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`);
  gradient.addColorStop(1, `rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)})`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // Add wave patterns
  for (let i = 0; i < 8; i++) {
    ctx.globalCompositeOperation = 'overlay';
    ctx.strokeStyle = `rgba(${Math.min(255, r + 100)}, ${Math.min(255, g + 100)}, ${Math.min(255, b + 100)}, ${0.3 + Math.random() * 0.4})`;
    ctx.lineWidth = 2 + Math.random() * 3;
    ctx.beginPath();
    
    for (let x = 0; x <= 512; x += 2) {
      const y = 256 + Math.sin((x + i * 50) * 0.02) * (30 + Math.sin(i) * 20) + 
                Math.sin((x + i * 30) * 0.01) * (15 + Math.cos(i) * 10);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  
  return new THREE.CanvasTexture(canvas);
}

// Enhanced sphere geometry with ultra-high detail
const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 128, 128);
let waveTexture = createWaveTexture(sphereColors[0]);

// Create custom shader material for directional audio coloring
const sphereMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    leftAudio: { value: 0.0 },
    rightAudio: { value: 0.0 },
    centerMix: { value: 0.0 },
    baseTexture: { value: waveTexture },
    leftColor: { value: new THREE.Color(0xff3333) },
    rightColor: { value: new THREE.Color(0x3333ff) },
    centerColor: { value: new THREE.Color(sphereColors[0]) },
    baseColorIntensity: { value: 1.0 }
  },
  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform float leftAudio;
    uniform float rightAudio;
    uniform float centerMix;
    uniform sampler2D baseTexture;
    uniform vec3 leftColor;
    uniform vec3 rightColor;
    uniform vec3 centerColor;
    uniform float baseColorIntensity;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
      vec4 texColor = texture2D(baseTexture, vUv);
      
      // Use base color from people count as the main color
      vec3 baseColor = centerColor * baseColorIntensity;
      
      // Calculate directional influence based on position
      float leftInfluence = max(0.0, -vPosition.x + 0.3);
      float rightInfluence = max(0.0, vPosition.x + 0.3);
      float centerInfluence = 1.0 - abs(vPosition.x);
      
      // Audio-reactive coloring overlays
      vec3 leftAudioColor = leftColor * leftAudio * leftInfluence;
      vec3 rightAudioColor = rightColor * rightAudio * rightInfluence;
      vec3 centerMixColor = baseColor * centerMix * centerInfluence;
      
      // Start with base color and add audio effects
      vec3 finalColor = baseColor * 0.8 + texColor.rgb * 0.2 + 
                       leftAudioColor * 0.5 + 
                       rightAudioColor * 0.5 + 
                       centerMixColor * 0.3;
      
      // Add pulsing effect
      float pulse = sin(time * 3.0) * 0.1 + 0.9;
      finalColor *= pulse;
      
      // Add fresnel glow
      float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
      finalColor += fresnel * 0.2 * (leftAudioColor + rightAudioColor + baseColor);
      
      gl_FragColor = vec4(finalColor, 0.9);
    }
  `,
  transparent: true
});

let glowingSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

// Create enhanced audio level lines inside the sphere
const audioLinesGroup = new THREE.Group();
const linePointsCount = 80;
const lineHistory = {
  left: new Array(linePointsCount).fill(0),
  right: new Array(linePointsCount).fill(0)
};

// Enhanced left audio visualization
const leftAudioLineGroup = new THREE.Group();

// Create multiple line layers for thickness and glow effect
for (let layer = 0; layer < 5; layer++) {
  const leftLineGeometry = new THREE.BufferGeometry();
  const leftLinePositions = new Float32Array(linePointsCount * 3);
  leftLineGeometry.setAttribute('position', new THREE.BufferAttribute(leftLinePositions, 3));
  
  const leftLineMaterial = new THREE.LineBasicMaterial({
    color: layer < 2 ? 0xff6666 : 0xff3333,
    transparent: true,
    opacity: layer === 0 ? 0.9 : (0.7 - layer * 0.15)
  });
  
  const line = new THREE.Line(leftLineGeometry, leftLineMaterial);
  line.position.set(0, 0, (layer - 2) * 0.015);
  line.scale.setScalar(1 + layer * 0.05);
  leftAudioLineGroup.add(line);
}

// Add particle trails for left audio
const leftParticleCount = 20;
const leftParticleGeometry = new THREE.BufferGeometry();
const leftParticlePositions = new Float32Array(leftParticleCount * 3);
leftParticleGeometry.setAttribute('position', new THREE.BufferAttribute(leftParticlePositions, 3));
const leftParticleMaterial = new THREE.PointsMaterial({
  color: 0xff3333,
  size: 0.05,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending
});
const leftParticles = new THREE.Points(leftParticleGeometry, leftParticleMaterial);
leftAudioLineGroup.add(leftParticles);

// Enhanced right audio visualization
const rightAudioLineGroup = new THREE.Group();

// Create multiple line layers for thickness and glow effect
for (let layer = 0; layer < 5; layer++) {
  const rightLineGeometry = new THREE.BufferGeometry();
  const rightLinePositions = new Float32Array(linePointsCount * 3);
  rightLineGeometry.setAttribute('position', new THREE.BufferAttribute(rightLinePositions, 3));
  
  const rightLineMaterial = new THREE.LineBasicMaterial({
    color: layer < 2 ? 0x6666ff : 0x3333ff,
    transparent: true,
    opacity: layer === 0 ? 0.9 : (0.7 - layer * 0.15)
  });
  
  const line = new THREE.Line(rightLineGeometry, rightLineMaterial);
  line.position.set(0, 0, (layer - 2) * 0.015);
  line.scale.setScalar(1 + layer * 0.05);
  rightAudioLineGroup.add(line);
}

// Add particle trails for right audio
const rightParticleCount = 20;
const rightParticleGeometry = new THREE.BufferGeometry();
const rightParticlePositions = new Float32Array(rightParticleCount * 3);
rightParticleGeometry.setAttribute('position', new THREE.BufferAttribute(rightParticlePositions, 3));
const rightParticleMaterial = new THREE.PointsMaterial({
  color: 0x3333ff,
  size: 0.05,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending
});
const rightParticles = new THREE.Points(rightParticleGeometry, rightParticleMaterial);
rightAudioLineGroup.add(rightParticles);

// Position lines inside the sphere - keep them contained within sphere radius
leftAudioLineGroup.position.set(0, 0.1, 0);
leftAudioLineGroup.scale.setScalar(0.8); // Smaller scale to stay inside
rightAudioLineGroup.position.set(0, -0.1, 0);
rightAudioLineGroup.scale.setScalar(0.8); // Smaller scale to stay inside

audioLinesGroup.add(leftAudioLineGroup);
audioLinesGroup.add(rightAudioLineGroup);

// Create line labels inside sphere
const createTextPlane = (text, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 256, 64);
  
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 40);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.8
  });
  
  const geometry = new THREE.PlaneGeometry(0.8, 0.2);
  return new THREE.Mesh(geometry, material);
};

const leftLabel = createTextPlane('LEFT', 0xff3333);
leftLabel.position.set(-0.8, 0.4, 0);
leftLabel.rotation.y = Math.PI / 4; // Angle for better visibility
const rightLabel = createTextPlane('RIGHT', 0x3333ff);
rightLabel.position.set(0.8, -0.4, 0);
rightLabel.rotation.y = -Math.PI / 4; // Angle for better visibility

audioLinesGroup.add(leftLabel);
audioLinesGroup.add(rightLabel);

// Create wireframe overlay
const wireframeGeometry = new THREE.SphereGeometry(sphereRadius * 1.02, 32, 32);
const wireframeMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: 0.1
});
const wireframeSphere = new THREE.Mesh(wireframeGeometry, wireframeMaterial);

// Create sphere group to contain all sphere elements (removed bubbleGroup)
const sphereGroup = new THREE.Group();
sphereGroup.add(glowingSphere);
sphereGroup.add(wireframeSphere);
sphereGroup.add(audioLinesGroup);

// Function to update the shape color based on people count
function updateShapeColor() {
  if (peopleCount < sphereColors.length) {
    const currentColor = new THREE.Color(sphereColors[peopleCount]);
    
    // Update shader uniforms
    if (glowingSphere.material.uniforms) {
      glowingSphere.material.uniforms.centerColor.value = currentColor;
    }
    
    // Update base texture with new color
    waveTexture = createWaveTexture(sphereColors[peopleCount]);
    glowingSphere.material.uniforms.baseTexture.value = waveTexture;
    
    console.log(`Updated color to: ${sphereColors[peopleCount].toString(16)} for ${peopleCount} people`);
  }
}

// ==================== STAND SETUP ====================
const standHeights = [0.6, 1.0, 1.4, 1.8, 2.2];
let currentStandIndex = 2;
sphereGroup.position.set(0, standHeights[currentStandIndex] + sphereRadius, 0);

const standRadius = 0.50;
let standGeometry = new THREE.CylinderGeometry(standRadius, standRadius, standHeights[currentStandIndex], 16);
let standMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
let stand = new THREE.Mesh(standGeometry, standMaterial);
stand.position.set(0, standHeights[currentStandIndex] / 2, 0);

scene.add(stand);
scene.add(sphereGroup);

// ==================== SCREEN ====================
const screenGeometry = new THREE.BoxGeometry(2, 1.2, 0.1);
const screenMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
const screen = new THREE.Mesh(screenGeometry, screenMaterial);
screen.position.set(0, 2, -5);
scene.add(screen);

// ==================== WEBSOCKET FUNCTIONS ====================
function connectToESP32() {
  const ip = document.getElementById('esp32IP').value;
  const wsUrl = `ws://${ip}:81`;
  
  console.log('Attempting to connect to:', wsUrl);
  
  try {
    socket = new WebSocket(wsUrl);
    
    socket.onopen = function(event) {
      isConnected = true;
      updateConnectionStatus('Connected', 'connected');
      console.log('✅ Connected to ESP32');
    };
    
    socket.onmessage = function(event) {
      try {
        console.log('📨 Received data:', event.data);
        const data = JSON.parse(event.data);
        audioData = {
          leftMic: data.leftMic || 0,
          rightMic: data.rightMic || 0,
          difference: data.difference || 0,
          averageLevel: (data.leftMic + data.rightMic) / 2
        };
        updateAudioDisplay();
        updateSphereBasedOnAudio();
      } catch (e) {
        console.error('❌ Error parsing audio data:', e);
      }
    };
    
    socket.onclose = function(event) {
      isConnected = false;
      updateConnectionStatus('Disconnected', 'disconnected');
      console.log('🔴 Disconnected from ESP32');
    };
    
    socket.onerror = function(error) {
      console.error('❌ WebSocket error:', error);
      updateConnectionStatus('Connection Error', 'disconnected');
    };
    
  } catch (error) {
    console.error('❌ Failed to connect:', error);
    updateConnectionStatus('Connection Failed', 'disconnected');
  }
}

function updateConnectionStatus(text, className) {
  const statusEl = document.getElementById('connectionStatus');
  statusEl.textContent = text;
  statusEl.className = `connection-status ${className}`;
}

function updateAudioDisplay() {
  document.getElementById('leftMicValue').textContent = audioData.leftMic.toFixed(1) + ' dB';
  document.getElementById('rightMicValue').textContent = audioData.rightMic.toFixed(1) + ' dB';
  document.getElementById('differenceValue').textContent = audioData.difference.toFixed(1) + ' dB';
  
  // Update direction indicator
  const directionEl = document.getElementById('directionIndicator');
  if (Math.abs(audioData.difference) < 2.0) {
    directionEl.textContent = '🎯 CENTERED';
    directionEl.className = 'direction-indicator center';
  } else if (audioData.difference > 0) {
    directionEl.textContent = '⬅️ LEFT';
    directionEl.className = 'direction-indicator left';
  } else {
    directionEl.textContent = '➡️ RIGHT';
    directionEl.className = 'direction-indicator right';
  }
}

// Enhanced function to update audio level lines and particles
function updateAudioLines(leftLevel, rightLevel) {
  // Shift historical data
  lineHistory.left.shift();
  lineHistory.right.shift();
  
  // Add new data points with enhanced range
  const leftAmplitude = (leftLevel - 0.5) * 0.6; // Reduced amplitude to stay in sphere
  const rightAmplitude = (rightLevel - 0.5) * 0.6;
  
  lineHistory.left.push(leftAmplitude);
  lineHistory.right.push(rightAmplitude);
  
  // Update all left line layers
  leftAudioLineGroup.children.forEach((child, index) => {
    if (child.type === 'Line') {
      const positions = child.geometry.attributes.position.array;
      for (let i = 0; i < linePointsCount; i++) {
        const x = (i / (linePointsCount - 1)) * 0.8 - 0.4; // Contained within sphere
        const y = lineHistory.left[i] + Math.sin((i + Date.now() * 0.01) * 0.2) * 0.08; // Reduced wave motion
        const z = Math.sin(i * 0.3 + Date.now() * 0.005) * 0.04; // Reduced 3D movement
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      child.geometry.attributes.position.needsUpdate = true;
      
      // Enhanced intensity based on audio level
      child.material.opacity = Math.min(1.0, 0.4 + leftLevel * 0.8);
    }
    
    // Update left particles
    if (child.type === 'Points') {
      const positions = child.geometry.attributes.position.array;
      for (let i = 0; i < leftParticleCount; i++) {
        const progress = i / leftParticleCount;
        const x = (progress - 0.5) * 0.6; // Smaller spread
        const y = lineHistory.left[Math.floor(progress * linePointsCount)] + (Math.random() - 0.5) * 0.08;
        const z = (Math.random() - 0.5) * 0.15;
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      child.geometry.attributes.position.needsUpdate = true;
      child.material.opacity = leftLevel * 0.8;
      child.material.size = 0.02 + leftLevel * 0.03; // Smaller particles
    }
  });
  
  // Update all right line layers
  rightAudioLineGroup.children.forEach((child, index) => {
    if (child.type === 'Line') {
      const positions = child.geometry.attributes.position.array;
      for (let i = 0; i < linePointsCount; i++) {
        const x = (i / (linePointsCount - 1)) * 0.8 - 0.4; // Contained within sphere
        const y = lineHistory.right[i] + Math.sin((i + Date.now() * 0.01) * 0.2) * 0.08; // Reduced wave motion
        const z = Math.sin(i * 0.3 + Date.now() * 0.005) * 0.04; // Reduced 3D movement
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      child.geometry.attributes.position.needsUpdate = true;
      
      // Enhanced intensity based on audio level
      child.material.opacity = Math.min(1.0, 0.4 + rightLevel * 0.8);
    }
    
    // Update right particles
    if (child.type === 'Points') {
      const positions = child.geometry.attributes.position.array;
      for (let i = 0; i < rightParticleCount; i++) {
        const progress = i / rightParticleCount;
        const x = (progress - 0.5) * 0.6; // Smaller spread
        const y = lineHistory.right[Math.floor(progress * linePointsCount)] + (Math.random() - 0.5) * 0.08;
        const z = (Math.random() - 0.5) * 0.15;
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      child.geometry.attributes.position.needsUpdate = true;
      child.material.opacity = rightLevel * 0.8;
      child.material.size = 0.02 + rightLevel * 0.03; // Smaller particles
    }
  });
}

function updateSphereBasedOnAudio() {
  if (!isConnected) return;
  
  // Calculate audio levels for interior animations
  const leftLevel = Math.max(0, Math.min(1, (audioData.leftMic + 60) / 80));
  const rightLevel = Math.max(0, Math.min(1, (audioData.rightMic + 60) / 80));
  const avgLevel = (leftLevel + rightLevel) / 2;
  const avgVolume = (audioData.leftMic + audioData.rightMic) / 2;
  const normalizedVolume = Math.max(0, Math.min(1, (avgVolume + 60) / 80));
  const difference = audioData.difference;
  const time = Date.now() * 0.001;
  
  // Calculate directional influence and center mixing
  const centerMix = Math.max(0, 1 - Math.abs(difference) / 10); // More centered = higher mix
  const leftDominance = Math.max(0, difference / 10); // Positive difference = left stronger
  const rightDominance = Math.max(0, -difference / 10); // Negative difference = right stronger
  
  // Update shader uniforms for directional coloring
  if (glowingSphere.material.uniforms) {
    glowingSphere.material.uniforms.time.value = time;
    glowingSphere.material.uniforms.leftAudio.value = leftLevel * (1 + leftDominance);
    glowingSphere.material.uniforms.rightAudio.value = rightLevel * (1 + rightDominance);
    glowingSphere.material.uniforms.centerMix.value = centerMix * avgLevel;
  }
  
  // Update audio level lines
  updateAudioLines(leftLevel, rightLevel);
  
  // Enhanced wireframe effects with directional influence (only opacity changes)
  wireframeSphere.material.opacity = 0.15 + normalizedVolume * 0.25;
  
  // Audio lines group rotation - only internal rotation, not sphere position
  audioLinesGroup.rotation.y += (normalizedVolume * 0.004) + (difference * 0.0005);
  audioLinesGroup.rotation.x = Math.sin(time * 3) * normalizedVolume * 0.05; // Reduced amplitude
}

// ==================== SHAPE CHANGING ====================
let currentShape = 'sphere';
function replaceSphereWith(newGeometry) {
  const oldMaterial = glowingSphere.material;
  const oldPosition = sphereGroup.position.clone();
  const oldScale = sphereGroup.scale.clone();
  
  // Remove old sphere from group
  sphereGroup.remove(glowingSphere);
  glowingSphere.geometry.dispose();
  
  // Create new sphere with the same shader material
  glowingSphere = new THREE.Mesh(newGeometry, oldMaterial);
  sphereGroup.add(glowingSphere);
  
  // Update wireframe
  wireframeSphere.geometry.dispose();
  if (currentShape === 'sphere') {
    wireframeSphere.geometry = new THREE.SphereGeometry(sphereRadius * 1.02, 64, 64);
  } else {
    // For non-spheres, adjust wireframe accordingly
    wireframeSphere.geometry = newGeometry.clone();
    wireframeSphere.geometry.scale(1.02, 1.02, 1.02);
  }
  
  sphereGroup.position.copy(oldPosition);
  sphereGroup.scale.copy(oldScale);
  
  // IMPORTANT: Update color after shape change
  updateShapeColor();
}

// ==================== EVENT LISTENERS ====================
document.getElementById('connectBtn').addEventListener('click', connectToESP32);

document.getElementById('addPersonBtn').addEventListener('click', () => {
  if (peopleCount < maxPeople) {
    addPersonToChair(peopleCount);
    peopleCount++;
    // Update color immediately when person is added
    updateShapeColor();
  } else {
    alert("Room is full!");
  }
});

document.getElementById('changeShapeBtn').addEventListener('click', () => {
  if (currentShape === 'sphere') {
    const geo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 64); // Higher detail
    replaceSphereWith(geo);
    currentShape = 'cylinder';
  } else if (currentShape === 'cylinder') {
    const geo = new THREE.CylinderGeometry(0.3, 0.6, 1.2, 64); // Higher detail
    replaceSphereWith(geo);
    currentShape = 'cone';
  } else {
    const geo = new THREE.SphereGeometry(0.6, 128, 128); // Ultra-high detail
    replaceSphereWith(geo);
    currentShape = 'sphere';
  }
});

document.getElementById('changeCableBtn').addEventListener('click', () => {
  currentStandIndex = (currentStandIndex + 1) % standHeights.length;
  const newHeight = standHeights[currentStandIndex];

  sphereGroup.position.y = newHeight + sphereRadius;

  scene.remove(stand);
  stand.geometry.dispose();

  standGeometry = new THREE.CylinderGeometry(standRadius, standRadius, newHeight, 16);
  stand = new THREE.Mesh(standGeometry, standMaterial);
  stand.position.set(0, newHeight / 2, 0);
  scene.add(stand);
});

// ==================== ANIMATION LOOP ====================
function animate() {
  requestAnimationFrame(animate);
  
  const time = Date.now() * 0.001;
  
  // Update shader time uniform
  if (glowingSphere.material.uniforms) {
    glowingSphere.material.uniforms.time.value = time;
  }
  
  // Demo mode when not connected
  if (!isConnected) {
    // Enhanced demo mode with directional audio simulation
    const demoLeftLevel = 0.5 + Math.sin(time * 2.1) * 0.4;
    const demoRightLevel = 0.5 + Math.sin(time * 1.7 + 1.2) * 0.35;
    const demoDifference = (demoLeftLevel - demoRightLevel) * 5; // Simulate difference in dB
    
    // Update demo audio lines
    updateAudioLines(demoLeftLevel, demoRightLevel);
    
    // Update shader uniforms for demo mode
    if (glowingSphere.material.uniforms) {
      const centerMix = Math.max(0, 1 - Math.abs(demoDifference) / 10);
      const leftDominance = Math.max(0, demoDifference / 10);
      const rightDominance = Math.max(0, -demoDifference / 10);
      
      glowingSphere.material.uniforms.leftAudio.value = demoLeftLevel * (1 + leftDominance);
      glowingSphere.material.uniforms.rightAudio.value = demoRightLevel * (1 + rightDominance);
      glowingSphere.material.uniforms.centerMix.value = centerMix * ((demoLeftLevel + demoRightLevel) / 2);
    }
    
    // Only animate internal audio lines, not sphere position
    audioLinesGroup.rotation.y += 0.001 + demoDifference * 0.0002;
  }
  
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ==================== WINDOW RESIZE ====================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== DEBUG INFO ====================
console.log('🚀 Enhanced Three.js application loaded');
console.log('📡 Ready to connect to ESP32');