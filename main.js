import * as THREE from 'https://esm.sh/three@0.150.1';
import { OrbitControls } from 'https://esm.sh/three@0.150.1/examples/jsm/controls/OrbitControls.js';

// ==================== DATA MANAGEMENT ====================
let socket = null;
let isConnected = false;
let currentVisualizationMode = 'audio';
let isUsingRealData = false;
let realDataIndex = 0;
let realDataInterval = null;

// Your real audio data (sample from your JSON file)
const realAudioData = [
  { leftMic: 65.28131, rightMic: 64.00206, difference: 1.279251, timestamp: 31760, averageLevel: 64.64169 },
  { leftMic: 79.34417, rightMic: 77.49582, difference: 1.848351, timestamp: 32329, averageLevel: 78.42 },
  { leftMic: 78.9958, rightMic: 77.05477, difference: 1.941032, timestamp: 32898, averageLevel: 78.02528 },
  { leftMic: 80.15926, rightMic: 76.47696, difference: 3.682304, timestamp: 33467, averageLevel: 78.31812 },
  { leftMic: 64.52422, rightMic: 62.68034, difference: 1.843872, timestamp: 34037, averageLevel: 63.60228 },
  { leftMic: 60.22626, rightMic: 57.11316, difference: 3.113106, timestamp: 34606, averageLevel: 58.66971 },
  { leftMic: 64.67999, rightMic: 60.26571, difference: 4.414284, timestamp: 35174, averageLevel: 62.47285 },
  { leftMic: 61.50063, rightMic: 69.33022, difference: -7.829597, timestamp: 35744, averageLevel: 65.41542 },
  { leftMic: 61.74264, rightMic: 57.81614, difference: 3.926506, timestamp: 36313, averageLevel: 59.77939 },
  { leftMic: 66.41251, rightMic: 62.53497, difference: 3.877533, timestamp: 36882, averageLevel: 64.47374 },
  { leftMic: 58.61408, rightMic: 56.82501, difference: 1.789074, timestamp: 37451, averageLevel: 57.71954 },
  { leftMic: 63.57136, rightMic: 63.49818, difference: 0.073185, timestamp: 38019, averageLevel: 63.53477 },
  { leftMic: 58.69188, rightMic: 62.33962, difference: -3.647743, timestamp: 38588, averageLevel: 60.51575 },
  { leftMic: 66.77727, rightMic: 57.9609, difference: 8.816368, timestamp: 39157, averageLevel: 62.36908 },
  { leftMic: 58.68637, rightMic: 57.16035, difference: 1.526012, timestamp: 39726, averageLevel: 57.92336 },
  { leftMic: 62.08194, rightMic: 58.29345, difference: 3.78849, timestamp: 40294, averageLevel: 60.18769 },
  { leftMic: 60.54304, rightMic: 64.01344, difference: -3.470402, timestamp: 40862, averageLevel: 62.27824 },
  { leftMic: 63.13842, rightMic: 56.65139, difference: 6.48703, timestamp: 41431, averageLevel: 59.89491 },
  { leftMic: 65.54337, rightMic: 67.53646, difference: -1.993095, timestamp: 42000, averageLevel: 66.53992 },
  { leftMic: 59.1659, rightMic: 56.8936, difference: 2.272297, timestamp: 42569, averageLevel: 58.02975 },
  { leftMic: 60.43228, rightMic: 58.23365, difference: 2.198624, timestamp: 43138, averageLevel: 59.33297 },
  { leftMic: 58.46306, rightMic: 63.95316, difference: -5.490101, timestamp: 43707, averageLevel: 61.20811 },
  { leftMic: 61.26706, rightMic: 58.11365, difference: 3.153408, timestamp: 44277, averageLevel: 59.69035 },
  { leftMic: 59.77499, rightMic: 56.70489, difference: 3.070103, timestamp: 44846, averageLevel: 58.23994 },
  { leftMic: 68.34287, rightMic: 62.94946, difference: 5.39341, timestamp: 45415, averageLevel: 65.64616 },
  { leftMic: 63.37411, rightMic: 65.75256, difference: -2.378456, timestamp: 45983, averageLevel: 64.56334 },
  { leftMic: 64.10213, rightMic: 59.5455, difference: 4.556637, timestamp: 46552, averageLevel: 61.82381 },
  { leftMic: 67.45844, rightMic: 62.23965, difference: 5.218796, timestamp: 47121, averageLevel: 64.84904 },
  { leftMic: 63.56491, rightMic: 61.56581, difference: 1.9991, timestamp: 47690, averageLevel: 62.56536 },
  { leftMic: 58.21941, rightMic: 56.96675, difference: 1.252659, timestamp: 48260, averageLevel: 57.59308 },
  { leftMic: 67.77153, rightMic: 56.87166, difference: 10.89987, timestamp: 48829, averageLevel: 62.32159 },
  { leftMic: 67.9611, rightMic: 65.8859, difference: 2.075195, timestamp: 49398, averageLevel: 66.9235 },
  { leftMic: 65.74673, rightMic: 60.66909, difference: 5.077637, timestamp: 49967, averageLevel: 63.20791 },
  { leftMic: 61.97755, rightMic: 63.25973, difference: -1.282181, timestamp: 50536, averageLevel: 62.61864 },
  { leftMic: 61.34126, rightMic: 63.51197, difference: -2.170704, timestamp: 51105, averageLevel: 62.42661 },
  { leftMic: 59.62077, rightMic: 55.89122, difference: 3.729549, timestamp: 51674, averageLevel: 57.756 },
  { leftMic: 68.23725, rightMic: 59.7625, difference: 8.474747, timestamp: 52243, averageLevel: 63.99988 },
  { leftMic: 59.04652, rightMic: 60.21888, difference: -1.172359, timestamp: 52812, averageLevel: 59.6327 },
  { leftMic: 67.4917, rightMic: 62.15364, difference: 5.338062, timestamp: 53381, averageLevel: 64.82267 },
  { leftMic: 58.28509, rightMic: 58.98389, difference: -0.698803, timestamp: 53950, averageLevel: 58.63449 },
  { leftMic: 62.84859, rightMic: 61.83966, difference: 1.008934, timestamp: 54519, averageLevel: 62.34413 },
  { leftMic: 66.16009, rightMic: 61.44525, difference: 4.71484, timestamp: 55088, averageLevel: 63.80267 },
  { leftMic: 60.35979, rightMic: 58.37453, difference: 1.985264, timestamp: 55657, averageLevel: 59.36716 },
  { leftMic: 63.84782, rightMic: 59.66077, difference: 4.187054, timestamp: 56226, averageLevel: 61.7543 },
  { leftMic: 60.28234, rightMic: 57.40012, difference: 2.882221, timestamp: 56795, averageLevel: 58.84123 },
  { leftMic: 58.11824, rightMic: 63.09507, difference: -4.976826, timestamp: 57365, averageLevel: 60.60666 },
  { leftMic: 70.30201, rightMic: 70.273, difference: 0.029007, timestamp: 57934, averageLevel: 70.28751 },
  { leftMic: 61.52678, rightMic: 66.64159, difference: -5.114819, timestamp: 58503, averageLevel: 64.08418 },
  { leftMic: 59.35138, rightMic: 59.19534, difference: 0.15604, timestamp: 59073, averageLevel: 59.27336 },
  { leftMic: 62.2223, rightMic: 57.8775, difference: 4.344795, timestamp: 59642, averageLevel: 60.0499 }
];

let audioData = {
  leftMic: 0,
  rightMic: 0,
  difference: 0,
  averageLevel: 0
};

let co2Data = {
  level: 420, // ppm
  trend: 'stable',
  change: 0, // ppm/min
  history: new Array(100).fill(420)
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

const pointLight1 = new THREE.PointLight(0xffffff, 0.6, 50);
pointLight1.position.set(-3, 2, 4);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 0.4, 50);
pointLight2.position.set(4, -3, -2);
scene.add(pointLight2);

// ==================== ENVIRONMENT ====================
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const outerRadius = 3.2;
const innerRadius = 1.2;
const tableGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 8);
const tableMaterial = new THREE.MeshStandardMaterial({ color: 0xf5deb3, side: THREE.DoubleSide });
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.rotation.x = -Math.PI / 2;
table.position.y = 0.75;
scene.add(table);

// ==================== CHAIRS AND PEOPLE ====================
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

// ==================== SPHERE CHART MAPPING ====================
let offscreenCanvas = null;
let offscreenContext = null;
let sphereChartTexture = null;
let sphereChartMaterial = null;

function initializeOffscreenCanvas() {
  // Create offscreen canvas for chart rendering
  offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = 1024;
  offscreenCanvas.height = 1024;
  offscreenContext = offscreenCanvas.getContext('2d');
  
  // Create texture from the canvas
  sphereChartTexture = new THREE.CanvasTexture(offscreenCanvas);
  sphereChartTexture.flipY = false;
  
  // Create material that will use the chart texture
  sphereChartMaterial = new THREE.MeshBasicMaterial({
    map: sphereChartTexture,
    transparent: true,
    opacity: 0.9
  });
}

function createSphereChart(mode) {
  // Initialize offscreen canvas if not already done
  if (!offscreenCanvas) {
    initializeOffscreenCanvas();
  }
  
  // Clear the canvas
  offscreenContext.clearRect(0, 0, 1024, 1024);
  
  // Set background
  offscreenContext.fillStyle = 'rgba(42, 42, 42, 0.1)';
  offscreenContext.fillRect(0, 0, 1024, 1024);
  
  // Use real data if available, otherwise generate sample data
  const dataToUse = isUsingRealData ? realAudioData : generateChartSampleData();
  
  switch (mode) {
    case 'stereo':
      drawStereoChartOnCanvas(offscreenContext, dataToUse);
      break;
    case 'activity':
      drawActivityChartOnCanvas(offscreenContext, dataToUse);
      break;
    case 'balance':
      drawBalanceChartOnCanvas(offscreenContext, dataToUse);
      break;
    case 'heatmap':
      drawHeatmapChartOnCanvas(offscreenContext, dataToUse);
      break;
  }
  
  // Update the texture
  sphereChartTexture.needsUpdate = true;
  
  // Replace sphere material with chart texture
  glowingSphere.material = sphereChartMaterial;
}

function drawStereoChartOnCanvas(ctx, audioData) {
  const width = 1024;
  const height = 1024;
  const padding = 100;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Stereo Audio Levels', width / 2, 80);
  
  // Subtitle
  ctx.font = '32px Arial';
  ctx.fillStyle = '#cccccc';
  ctx.fillText('Left vs Right Microphone', width / 2, 130);
  
  // Find data range
  const allValues = audioData.flatMap(d => [d.leftMic, d.rightMic]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue;
  
  // Draw axes
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 3;
  ctx.beginPath();
  // Y-axis
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  // X-axis
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  
  // Draw grid lines
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const y = padding + (chartHeight * i) / 5;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }
  
  // Draw data lines
  const stepX = chartWidth / (audioData.length - 1);
  
  // Left microphone line
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 4;
  ctx.beginPath();
  audioData.forEach((d, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((d.leftMic - minValue) / valueRange) * chartHeight;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  
  // Right microphone line
  ctx.strokeStyle = '#764ba2';
  ctx.lineWidth = 4;
  ctx.beginPath();
  audioData.forEach((d, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((d.rightMic - minValue) / valueRange) * chartHeight;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  
  // Legend
  ctx.fillStyle = '#667eea';
  ctx.fillRect(padding, height - 80, 30, 15);
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Left Mic', padding + 40, height - 65);
  
  ctx.fillStyle = '#764ba2';
  ctx.fillRect(padding + 200, height - 80, 30, 15);
  ctx.fillStyle = 'white';
  ctx.fillText('Right Mic', padding + 240, height - 65);
}

function drawActivityChartOnCanvas(ctx, audioData) {
  const width = 1024;
  const height = 1024;
  const padding = 100;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Meeting Activity', width / 2, 80);
  
  // Subtitle
  ctx.font = '32px Arial';
  ctx.fillStyle = '#cccccc';
  ctx.fillText('Average Audio Levels', width / 2, 130);
  
  // Find data range
  const averageLevels = audioData.map(d => d.averageLevel);
  const minValue = Math.min(...averageLevels);
  const maxValue = Math.max(...averageLevels);
  const valueRange = maxValue - minValue;
  
  // Draw axes
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  
  // Draw bars
  const barWidth = chartWidth / audioData.length;
  audioData.forEach((d, i) => {
    const intensity = Math.max(0, Math.min(1, (d.averageLevel - 55) / 23));
    const alpha = 0.3 + intensity * 0.7;
    
    ctx.fillStyle = `rgba(102, 126, 234, ${alpha})`;
    const x = padding + i * barWidth;
    const barHeight = ((d.averageLevel - minValue) / valueRange) * chartHeight;
    const y = height - padding - barHeight;
    
    ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
    
    // Bar outline
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y, barWidth - 2, barHeight);
  });
}

function drawBalanceChartOnCanvas(ctx, audioData) {
  const width = 1024;
  const height = 1024;
  const padding = 100;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Audio Balance', width / 2, 80);
  
  // Subtitle
  ctx.font = '32px Arial';
  ctx.fillStyle = '#cccccc';
  ctx.fillText('Left-Right Differences', width / 2, 130);
  
  // Create histogram
  const differences = audioData.map(d => d.difference);
  const bins = {};
  const binSize = 2;
  
  differences.forEach(diff => {
    const bin = Math.floor(diff / binSize) * binSize;
    bins[bin] = (bins[bin] || 0) + 1;
  });
  
  const binKeys = Object.keys(bins).map(k => parseFloat(k)).sort((a, b) => a - b);
  const maxCount = Math.max(...Object.values(bins));
  
  // Draw axes
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  
  // Draw histogram bars
  const barWidth = chartWidth / binKeys.length;
  binKeys.forEach((bin, i) => {
    const count = bins[bin];
    const barHeight = (count / maxCount) * chartHeight;
    const x = padding + i * barWidth;
    const y = height - padding - barHeight;
    
    ctx.fillStyle = 'rgba(118, 75, 162, 0.6)';
    ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
    
    ctx.strokeStyle = '#764ba2';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y, barWidth - 2, barHeight);
  });
}

function drawHeatmapChartOnCanvas(ctx, audioData) {
  const width = 1024;
  const height = 1024;
  const padding = 100;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Audio Heatmap', width / 2, 80);
  
  // Subtitle
  ctx.font = '32px Arial';
  ctx.fillStyle = '#cccccc';
  ctx.fillText('Intensity Over Time', width / 2, 130);
  
  // Create time segments
  const segmentSize = 10;
  const segments = [];
  
  for (let i = 0; i < audioData.length; i += segmentSize) {
    const segment = audioData.slice(i, i + segmentSize);
    const avgLevel = segment.reduce((sum, d) => sum + d.averageLevel, 0) / segment.length;
    segments.push(avgLevel);
  }
  
  // Draw heatmap
  const cellWidth = chartWidth / segments.length;
  const cellHeight = chartHeight / 10;
  
  for (let i = 0; i < segments.length; i++) {
    for (let j = 0; j < 10; j++) {
      const intensity = Math.max(0, Math.min(1, (segments[i] - 55) / 23));
      const hue = 240 - (intensity * 120); // Blue to red
      
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      const x = padding + i * cellWidth;
      const y = padding + j * cellHeight;
      ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
    }
  }
}

function updateSphereCharts() {
  // Update sphere charts if in chart mode
  if (['stereo', 'activity', 'balance', 'heatmap'].includes(currentVisualizationMode)) {
    createSphereChart(currentVisualizationMode);
  }
}

// ==================== VISUALIZATION SHADERS ====================
const sphereRadius = 0.6;
const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 128, 128);

// Audio visualization shader
const audioShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    leftAudio: { value: 0.0 },
    rightAudio: { value: 0.0 },
    centerMix: { value: 0.0 },
    baseColor: { value: new THREE.Color(0x53c566) },
    leftColor: { value: new THREE.Color(0xff3333) },
    rightColor: { value: new THREE.Color(0x3333ff) }
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
    uniform vec3 baseColor;
    uniform vec3 leftColor;
    uniform vec3 rightColor;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
      float leftInfluence = max(0.0, -vPosition.x + 0.3);
      float rightInfluence = max(0.0, vPosition.x + 0.3);
      float centerInfluence = 1.0 - abs(vPosition.x);
      
      vec3 leftAudioColor = leftColor * leftAudio * leftInfluence;
      vec3 rightAudioColor = rightColor * rightAudio * rightInfluence;
      vec3 centerMixColor = baseColor * centerMix * centerInfluence;
      
      vec3 finalColor = baseColor * 0.7 + leftAudioColor * 0.4 + rightAudioColor * 0.4 + centerMixColor * 0.2;
      
      float pulse = sin(time * 3.0) * 0.1 + 0.9;
      finalColor *= pulse;
      
      float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
      finalColor += fresnel * 0.2;
      
      gl_FragColor = vec4(finalColor, 0.9);
    }
  `,
  transparent: true
});

// CO2 visualization shader
const co2ShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    co2Level: { value: 420.0 },
    co2Trend: { value: 0.0 },
    baseColor: { value: new THREE.Color(0x53c566) }
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
    uniform float co2Level;
    uniform float co2Trend;
    uniform vec3 baseColor;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    // Simple noise function
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      // Map CO2 level to color (400-1000 ppm range)
      float normalizedCO2 = (co2Level - 400.0) / 600.0;
      normalizedCO2 = clamp(normalizedCO2, 0.0, 1.0);
      
      // Color gradient from green to red based on CO2 level
      vec3 goodColor = vec3(0.2, 0.8, 0.2);
      vec3 moderateColor = vec3(0.8, 0.8, 0.2);
      vec3 poorColor = vec3(0.8, 0.4, 0.2);
      vec3 badColor = vec3(0.8, 0.2, 0.2);
      
      vec3 co2Color;
      if (normalizedCO2 < 0.33) {
        co2Color = mix(goodColor, moderateColor, normalizedCO2 * 3.0);
      } else if (normalizedCO2 < 0.66) {
        co2Color = mix(moderateColor, poorColor, (normalizedCO2 - 0.33) * 3.0);
      } else {
        co2Color = mix(poorColor, badColor, (normalizedCO2 - 0.66) * 3.0);
      }
      
      // Add flowing effect based on CO2 trend
      float flowEffect = sin(vUv.y * 10.0 + time * 2.0 + co2Trend * 5.0) * 0.1;
      
      // Add noise for atmospheric effect
      float noiseEffect = noise(vUv * 20.0 + time * 0.5) * 0.2;
      
      vec3 finalColor = co2Color + flowEffect + noiseEffect;
      
      // Pulsing effect
      float pulse = sin(time * 1.5) * 0.1 + 0.9;
      finalColor *= pulse;
      
      gl_FragColor = vec4(finalColor, 0.85);
    }
  `,
  transparent: true
});

// Particle system for particle mode
const particleCount = 2000;
const particles = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3;
  // Position particles within sphere
  const phi = Math.acos(-1 + (2 * Math.random()));
  const theta = Math.sqrt(particleCount * Math.PI) * phi;
  const radius = sphereRadius * 0.9 * Math.random();
  
  particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
  particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  particlePositions[i3 + 2] = radius * Math.cos(phi);
  
  particleColors[i3] = Math.random();
  particleColors[i3 + 1] = Math.random();
  particleColors[i3 + 2] = Math.random();
}

particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particles.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

const particleMaterial = new THREE.PointsMaterial({
  size: 0.02,
  vertexColors: true,
  transparent: true,
  opacity: 0.8
});

const particleSystem = new THREE.Points(particles, particleMaterial);

// Wave geometry for wave mode
const waveGeometry = new THREE.SphereGeometry(sphereRadius, 64, 64);
const waveMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    dataValue: { value: 0.5 }
  },
  vertexShader: `
    uniform float time;
    uniform float dataValue;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      vPosition = position;
      vNormal = normal;
      
      // Wave displacement
      vec3 pos = position;
      float displacement = sin(pos.y * 10.0 + time * 2.0) * 0.1 * dataValue;
      pos += normal * displacement;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform float dataValue;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      vec3 color = vec3(0.2, 0.6, 0.8);
      color += sin(vPosition.y * 5.0 + time) * 0.2;
      gl_FragColor = vec4(color, 0.8);
    }
  `,
  transparent: true
});

// Main sphere mesh
let glowingSphere = new THREE.Mesh(sphereGeometry, audioShaderMaterial);

// Create sphere group
const sphereGroup = new THREE.Group();
sphereGroup.add(glowingSphere);

// Stand setup
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

// ==================== VISUALIZATION SWITCHING ====================
function switchVisualization(mode) {
  currentVisualizationMode = mode;
  
  // Handle chart modes - now render on sphere instead of overlay
  if (['stereo', 'activity', 'balance', 'heatmap'].includes(mode)) {
    createSphereChart(mode);
    document.getElementById('audioDataDisplay').classList.remove('hidden');
    document.getElementById('co2DataDisplay').classList.add('hidden');
    return;
  }
  
  // Remove current visualization
  sphereGroup.remove(glowingSphere);
  if (sphereGroup.children.includes(particleSystem)) {
    sphereGroup.remove(particleSystem);
  }
  
  // Add new visualization
  switch (mode) {
    case 'audio':
      glowingSphere = new THREE.Mesh(sphereGeometry, audioShaderMaterial);
      sphereGroup.add(glowingSphere);
      document.getElementById('audioDataDisplay').classList.remove('hidden');
      document.getElementById('co2DataDisplay').classList.add('hidden');
      break;
      
    case 'co2':
      glowingSphere = new THREE.Mesh(sphereGeometry, co2ShaderMaterial);
      sphereGroup.add(glowingSphere);
      document.getElementById('audioDataDisplay').classList.add('hidden');
      document.getElementById('co2DataDisplay').classList.remove('hidden');
      break;
      
    case 'particles':
      glowingSphere = new THREE.Mesh(sphereGeometry, audioShaderMaterial);
      glowingSphere.material.transparent = true;
      glowingSphere.material.opacity = 0.3;
      sphereGroup.add(glowingSphere);
      sphereGroup.add(particleSystem);
      document.getElementById('audioDataDisplay').classList.remove('hidden');
      document.getElementById('co2DataDisplay').classList.add('hidden');
      break;
      
    case 'waves':
      glowingSphere = new THREE.Mesh(waveGeometry, waveMaterial);
      sphereGroup.add(glowingSphere);
      document.getElementById('audioDataDisplay').classList.remove('hidden');
      document.getElementById('co2DataDisplay').classList.add('hidden');
      break;
  }
  
  updateShapeColor();
}

// ==================== DATA UPDATES ====================
function updateShapeColor() {
  if (peopleCount < sphereColors.length) {
    const currentColor = new THREE.Color(sphereColors[peopleCount]);
    
    if (glowingSphere.material.uniforms && glowingSphere.material.uniforms.baseColor) {
      glowingSphere.material.uniforms.baseColor.value = currentColor;
    }
  }
}

function updateAudioDisplay() {
  document.getElementById('leftMicValue').textContent = audioData.leftMic.toFixed(1) + ' dB';
  document.getElementById('rightMicValue').textContent = audioData.rightMic.toFixed(1) + ' dB';
  document.getElementById('differenceValue').textContent = audioData.difference.toFixed(1) + ' dB';
  
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

function updateCO2Display() {
  document.getElementById('co2Value').textContent = co2Data.level.toFixed(0) + ' ppm';
  document.getElementById('co2Trend').textContent = co2Data.trend;
  document.getElementById('co2Change').textContent = co2Data.change.toFixed(1) + ' ppm/min';
  
  const co2El = document.getElementById('co2Indicator');
  if (co2Data.level <= 600) {
    co2El.textContent = '🌱 GOOD AIR QUALITY';
    co2El.className = 'co2-indicator co2-good';
  } else if (co2Data.level <= 800) {
    co2El.textContent = '⚠️ MODERATE';
    co2El.className = 'co2-indicator co2-moderate';
  } else if (co2Data.level <= 1000) {
    co2El.textContent = '⚠️ POOR';
    co2El.className = 'co2-indicator co2-poor';
  } else {
    co2El.textContent = '🚨 BAD AIR QUALITY';
    co2El.className = 'co2-indicator co2-bad';
  }
}

function updateVisualizationData() {
  const time = Date.now() * 0.001;
  let visualizationAudioData = audioData;
  let visualizationCO2Data = co2Data;
  
  // Use demo data for visualization effects only when disconnected
  if (!isConnected) {
    const demoData = generateDemoVisualizationData();
    visualizationAudioData = demoData.audio;
    visualizationCO2Data = demoData.co2;
  }
  
  switch (currentVisualizationMode) {
    case 'audio':
    case 'particles':
      if (glowingSphere.material.uniforms) {
        const leftLevel = Math.max(0, Math.min(1, (visualizationAudioData.leftMic + 60) / 80));
        const rightLevel = Math.max(0, Math.min(1, (visualizationAudioData.rightMic + 60) / 80));
        const avgLevel = (leftLevel + rightLevel) / 2;
        const difference = visualizationAudioData.difference;
        const centerMix = Math.max(0, 1 - Math.abs(difference) / 10);
        
        glowingSphere.material.uniforms.time.value = time;
        glowingSphere.material.uniforms.leftAudio.value = leftLevel;
        glowingSphere.material.uniforms.rightAudio.value = rightLevel;
        glowingSphere.material.uniforms.centerMix.value = centerMix * avgLevel;
      }
      
      // Update particle system
      if (currentVisualizationMode === 'particles' && particleSystem) {
        updateParticles(visualizationAudioData);
      }
      break;
      
    case 'co2':
      if (glowingSphere.material.uniforms) {
        glowingSphere.material.uniforms.time.value = time;
        glowingSphere.material.uniforms.co2Level.value = visualizationCO2Data.level;
        glowingSphere.material.uniforms.co2Trend.value = visualizationCO2Data.change;
      }
      break;
      
    case 'waves':
      if (glowingSphere.material.uniforms) {
        glowingSphere.material.uniforms.time.value = time;
        const dataValue = currentVisualizationMode === 'co2' ? 
          (visualizationCO2Data.level - 400) / 600 : 
          (visualizationAudioData.leftMic + visualizationAudioData.rightMic + 120) / 160;
        glowingSphere.material.uniforms.dataValue.value = Math.max(0, Math.min(1, dataValue));
      }
      break;
  }
}

function updateParticles(data) {
  const positions = particleSystem.geometry.attributes.position.array;
  const colors = particleSystem.geometry.attributes.color.array;
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    
    // Move particles based on audio data
    const audioInfluence = (data.leftMic + data.rightMic + 120) / 160;
    positions[i3] += (Math.random() - 0.5) * 0.002 * audioInfluence;
    positions[i3 + 1] += (Math.random() - 0.5) * 0.002 * audioInfluence;
    positions[i3 + 2] += (Math.random() - 0.5) * 0.002 * audioInfluence;
    
    // Keep particles within sphere
    const distance = Math.sqrt(positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2);
    if (distance > sphereRadius * 0.9) {
      const factor = (sphereRadius * 0.9) / distance;
      positions[i3] *= factor;
      positions[i3 + 1] *= factor;
      positions[i3 + 2] *= factor;
    }
    
    // Update colors based on audio
    const leftInfluence = Math.max(0, -positions[i3] + 0.3);
    const rightInfluence = Math.max(0, positions[i3] + 0.3);
    
    colors[i3] = leftInfluence * audioInfluence; // Red
    colors[i3 + 1] = 0.5 * audioInfluence; // Green
    colors[i3 + 2] = rightInfluence * audioInfluence; // Blue
  }
  
  particleSystem.geometry.attributes.position.needsUpdate = true;
  particleSystem.geometry.attributes.color.needsUpdate = true;
}

// ==================== REAL DATA PLAYBACK ====================
function startRealDataPlayback() {
  if (realDataInterval) {
    clearInterval(realDataInterval);
  }
  
  isUsingRealData = true;
  realDataIndex = 0;
  document.getElementById('dataSource').textContent = 'Real Meeting Data';
  
  console.log('🎬 Starting real data playback');
  
  realDataInterval = setInterval(() => {
    if (realDataIndex >= realAudioData.length) {
      realDataIndex = 0; // Loop the data
    }
    
    const currentData = realAudioData[realDataIndex];
    
    // Update audio data with real values
    audioData = {
      leftMic: currentData.leftMic,
      rightMic: currentData.rightMic,
      difference: currentData.difference,
      averageLevel: currentData.averageLevel
    };
    
    // Update displays
    updateAudioDisplay();
    
    realDataIndex++;
  }, 500); // Update every 500ms for smooth visualization
}

function stopRealDataPlayback() {
  if (realDataInterval) {
    clearInterval(realDataInterval);
    realDataInterval = null;
  }
  
  isUsingRealData = false;
  document.getElementById('dataSource').textContent = 'Demo Mode';
  
  // Reset to default values
  resetDisplaysToDefault();
  
  console.log('⏹️ Stopped real data playback');
}

// ==================== DEMO DATA GENERATION ====================
function generateDemoVisualizationData() {
  // If using real data, return the current real data for visualization
  if (isUsingRealData) {
    const demoCO2Level = 450 + Math.sin(Date.now() * 0.0001) * 100;
    return {
      audio: audioData, // Use real audio data
      co2: { level: demoCO2Level, change: 0 }
    };
  }
  
  // Only generate demo data for visualization effects, not for display
  const time = Date.now() * 0.001;
  
  // Demo audio data for visualization only (not displayed)
  const demoAudioData = {
    leftMic: -30 + Math.sin(time * 2.1) * 20,
    rightMic: -30 + Math.sin(time * 1.7 + 1.2) * 18,
    difference: 0,
    averageLevel: 0
  };
  demoAudioData.difference = demoAudioData.leftMic - demoAudioData.rightMic;
  demoAudioData.averageLevel = (demoAudioData.leftMic + demoAudioData.rightMic) / 2;
  
  // Demo CO2 data for visualization only (not displayed)
  const baseCO2 = 450 + Math.sin(time * 0.1) * 100;
  const noiseCO2 = Math.sin(time * 0.5) * 20;
  const demoCO2Level = Math.max(400, Math.min(1000, baseCO2 + noiseCO2));
  
  // Return demo data for visualization purposes only
  return {
    audio: demoAudioData,
    co2: { level: demoCO2Level, change: 0 }
  };
}

function resetDisplaysToDefault() {
  // Reset audio display to default values
  document.getElementById('leftMicValue').textContent = '-- dB';
  document.getElementById('rightMicValue').textContent = '-- dB';
  document.getElementById('differenceValue').textContent = '-- dB';
  
  const directionEl = document.getElementById('directionIndicator');
  directionEl.textContent = '🎯 CENTERED';
  directionEl.className = 'direction-indicator center';
  
  // Reset CO2 display to default values
  document.getElementById('co2Value').textContent = '-- ppm';
  document.getElementById('co2Trend').textContent = '--';
  document.getElementById('co2Change').textContent = '-- ppm/min';
  
  const co2El = document.getElementById('co2Indicator');
  co2El.textContent = '🌱 GOOD AIR QUALITY';
  co2El.className = 'co2-indicator co2-good';
}

// ==================== CHART VISUALIZATION SYSTEM ====================
let currentChart = null;
let chartMode = null;

function showChartVisualization(mode) {
  // Show overlay
  document.getElementById('chartOverlay').classList.remove('hidden');
  
  // Set chart title and subtitle based on mode
  const chartInfo = {
    stereo: {
      title: 'Stereo Audio Levels Over Time',
      subtitle: 'Left vs Right microphone levels showing speaker positioning'
    },
    activity: {
      title: 'Meeting Activity Timeline',
      subtitle: 'Average audio levels indicating conversation intensity'
    },
    balance: {
      title: 'Audio Balance Distribution',
      subtitle: 'Left-Right channel differences'
    },
    heatmap: {
      title: 'Audio Intensity Heatmap',
      subtitle: 'Color-coded audio levels by time segments'
    }
  };
  
  document.getElementById('chartTitle').textContent = chartInfo[mode].title;
  document.getElementById('chartSubtitle').textContent = chartInfo[mode].subtitle;
  
  // Create the appropriate chart
  chartMode = mode;
  createChart(mode);
}

function hideChartVisualization() {
  document.getElementById('chartOverlay').classList.add('hidden');
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }
}

function createChart(mode) {
  // Destroy existing chart
  if (currentChart) {
    currentChart.destroy();
  }
  
  const ctx = document.getElementById('dynamicChart').getContext('2d');
  
  // Use real data if available, otherwise generate sample data
  const dataToUse = isUsingRealData ? realAudioData : generateChartSampleData();
  
  switch (mode) {
    case 'stereo':
      createStereoChart(ctx, dataToUse);
      break;
    case 'activity':
      createActivityChart(ctx, dataToUse);
      break;
    case 'balance':
      createBalanceChart(ctx, dataToUse);
      break;
    case 'heatmap':
      createHeatmapChart(ctx, dataToUse);
      break;
  }
}

function generateChartSampleData() {
  // Generate sample data for charts when real data isn't available
  const data = [];
  for (let i = 0; i < 100; i++) {
    data.push({
      leftMic: 56 + Math.random() * 24 + Math.sin(i / 10) * 5,
      rightMic: 55 + Math.random() * 37 + Math.cos(i / 8) * 8,
      difference: (Math.random() - 0.5) * 20,
      averageLevel: 56 + Math.random() * 22,
      timestamp: Date.now() + i * 1000
    });
  }
  return data;
}

function createStereoChart(ctx, audioData) {
  const timeLabels = audioData.map((_, i) => {
    const minutes = Math.floor(i / 10);
    const seconds = (i % 10) * 6;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }).filter((_, i) => i % 5 === 0);

  currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeLabels,
      datasets: [{
        label: 'Left Microphone',
        data: audioData.map(d => d.leftMic).filter((_, i) => i % 5 === 0),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        fill: true,
        tension: 0.4
      }, {
        label: 'Right Microphone',
        data: audioData.map(d => d.rightMic).filter((_, i) => i % 5 === 0),
        borderColor: '#764ba2',
        backgroundColor: 'rgba(118, 75, 162, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Audio Level (dB)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time'
          }
        }
      }
    }
  });
}

function createActivityChart(ctx, audioData) {
  const timeLabels = audioData.map((_, i) => {
    const minutes = Math.floor(i / 10);
    const seconds = (i % 10) * 6;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }).filter((_, i) => i % 3 === 0);

  currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: timeLabels,
      datasets: [{
        label: 'Average Audio Level',
        data: audioData.map(d => d.averageLevel).filter((_, i) => i % 3 === 0),
        backgroundColor: audioData.map(d => {
          const intensity = Math.max(0, Math.min(1, (d.averageLevel - 55) / 23));
          return `rgba(102, 126, 234, ${0.3 + intensity * 0.7})`;
        }).filter((_, i) => i % 3 === 0),
        borderColor: '#667eea',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Audio Level (dB)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time'
          }
        }
      }
    }
  });
}

function createBalanceChart(ctx, audioData) {
  const differences = audioData.map(d => d.difference);
  
  // Create histogram bins
  const bins = {};
  const binSize = 2;
  differences.forEach(diff => {
    const bin = Math.floor(diff / binSize) * binSize;
    bins[bin] = (bins[bin] || 0) + 1;
  });

  const binKeys = Object.keys(bins).map(k => parseFloat(k)).sort((a, b) => a - b);
  const binCounts = binKeys.map(k => bins[k]);

  currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: binKeys.map(k => `${k.toFixed(0)}dB`),
      datasets: [{
        label: 'Frequency',
        data: binCounts,
        backgroundColor: 'rgba(118, 75, 162, 0.6)',
        borderColor: '#764ba2',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Frequency'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Left-Right Difference (dB)'
          }
        }
      }
    }
  });
}

function createHeatmapChart(ctx, audioData) {
  // Create time segments
  const segmentSize = 10;
  const segments = [];
  
  for (let i = 0; i < audioData.length; i += segmentSize) {
    const segment = audioData.slice(i, i + segmentSize);
    const avgLevel = segment.reduce((sum, d) => sum + d.averageLevel, 0) / segment.length;
    const minutes = Math.floor(i / 60);
    const seconds = Math.floor((i % 60) * 0.6);
    segments.push({
      time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      level: avgLevel
    });
  }

  currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: segments.map(s => s.time),
      datasets: [{
        label: 'Intensity',
        data: segments.map(s => s.level),
        backgroundColor: segments.map(s => {
          const intensity = Math.max(0, Math.min(1, (s.level - 55) / 23));
          const hue = 240 - (intensity * 120); // Blue to red
          return `hsl(${hue}, 70%, 60%)`;
        }),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Average Audio Level (dB)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time Segments'
          }
        }
      }
    }
  });
}

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
        
        // Handle different data types
        if (data.leftMic !== undefined && data.rightMic !== undefined) {
          audioData = {
            leftMic: data.leftMic || 0,
            rightMic: data.rightMic || 0,
            difference: data.difference || 0,
            averageLevel: (data.leftMic + data.rightMic) / 2
          };
          updateAudioDisplay();
        }
        
        if (data.co2 !== undefined) {
          co2Data.level = data.co2;
          // Update history for trend calculation
          co2Data.history.push(co2Data.level);
          if (co2Data.history.length > 100) {
            co2Data.history.shift();
          }
          updateCO2Display();
        }
        
        updateVisualizationData();
      } catch (e) {
        console.error('❌ Error parsing data:', e);
      }
    };
    
    socket.onclose = function(event) {
      isConnected = false;
      updateConnectionStatus('Disconnected', 'disconnected');
      console.log('🔴 Disconnected from ESP32');
      
      // Reset displays to default when disconnected (only if not using real data)
      if (!isUsingRealData) {
        resetDisplaysToDefault();
      }
    };
    
    socket.onerror = function(error) {
      console.error('❌ WebSocket error:', error);
      updateConnectionStatus('Connection Error', 'disconnected');
      
      // Reset displays to default on connection error (only if not using real data)
      if (!isUsingRealData) {
        resetDisplaysToDefault();
      }
    };
    
  } catch (error) {
    console.error('❌ Failed to connect:', error);
    updateConnectionStatus('Connection Failed', 'disconnected');
    
    // Reset displays to default on connection failure (only if not using real data)
    if (!isUsingRealData) {
      resetDisplaysToDefault();
    }
  }
}

function updateConnectionStatus(text, className) {
  const statusEl = document.getElementById('connectionStatus');
  statusEl.textContent = text;
  statusEl.className = `connection-status ${className}`;
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
  
  // Create new sphere with the same material
  glowingSphere = new THREE.Mesh(newGeometry, oldMaterial);
  sphereGroup.add(glowingSphere);
  
  sphereGroup.position.copy(oldPosition);
  sphereGroup.scale.copy(oldScale);
  
  updateShapeColor();
}

// ==================== EVENT LISTENERS ====================
document.getElementById('connectBtn').addEventListener('click', connectToESP32);

document.getElementById('loadDataBtn').addEventListener('click', () => {
  if (isUsingRealData) {
    stopRealDataPlayback();
  } else {
    startRealDataPlayback();
  }
  
  // Update button text
  const btn = document.getElementById('loadDataBtn');
  btn.textContent = isUsingRealData ? '⏹️ Stop Real Data' : '📊 Load Real Data';
});

document.getElementById('addPersonBtn').addEventListener('click', () => {
  if (peopleCount < maxPeople) {
    addPersonToChair(peopleCount);
    peopleCount++;
    updateShapeColor();
  } else {
    alert("Room is full!");
  }
});

document.getElementById('changeShapeBtn').addEventListener('click', () => {
  if (currentShape === 'sphere') {
    const geo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 64);
    replaceSphereWith(geo);
    currentShape = 'cylinder';
  } else if (currentShape === 'cylinder') {
    const geo = new THREE.CylinderGeometry(0.3, 0.6, 1.2, 64);
    replaceSphereWith(geo);
    currentShape = 'cone';
  } else {
    const geo = new THREE.SphereGeometry(0.6, 128, 128);
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

// Visualization mode switching
document.querySelectorAll('.viz-option').forEach(option => {
  option.addEventListener('click', () => {
    // Remove active class from all options
    document.querySelectorAll('.viz-option').forEach(opt => opt.classList.remove('active'));
    
    // Add active class to clicked option
    option.classList.add('active');
    
    // Switch visualization
    const mode = option.dataset.mode;
    switchVisualization(mode);
    
    console.log(`Switched to ${mode} visualization`);
  });
});

// Close chart overlay
document.getElementById('closeChart').addEventListener('click', () => {
  hideChartVisualization();
  
  // Reset to audio 3D mode
  document.querySelectorAll('.viz-option').forEach(opt => opt.classList.remove('active'));
  document.querySelector('.viz-option[data-mode="audio"]').classList.add('active');
  switchVisualization('audio');
});

// ==================== ANIMATION LOOP ====================
function animate() {
  requestAnimationFrame(animate);
  
  // Update visualization data
  updateVisualizationData();
  
  // Update sphere charts periodically (every 2 seconds)
  if (Date.now() % 2000 < 16) { // Roughly every 2 seconds
    updateSphereCharts();
  }
  
  controls.update();
  renderer.render(scene, camera);
}

// ==================== WINDOW RESIZE ====================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== INITIALIZATION ====================
console.log('🚀 Enhanced Meeting Room Application loaded');
console.log('📡 Ready to connect to ESP32');
console.log('🎨 Multiple visualization modes available');

// Initialize offscreen canvas
initializeOffscreenCanvas();

// Start animation loop
animate();

// Initialize displays to default values
resetDisplaysToDefault();