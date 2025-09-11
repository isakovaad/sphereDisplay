import * as THREE from 'https://esm.sh/three@0.150.1';
import { OrbitControls } from 'https://esm.sh/three@0.150.1/examples/jsm/controls/OrbitControls.js';

// ==================== DATA MANAGEMENT ====================
let socket = null;
let isConnected = false;
let currentVisualizationMode = 'audio';
let isUsingRealData = false;
let realDataIndex = 0;
let realDataInterval = null;


// real audio data for better LEFT/RIGHT/CENTERED color demonstration
const realAudioData = [
  // ==================== STRONG RIGHT PHASE (Green Dominant) ====================
  // Right microphone much louder - should show GREEN sphere with orange accents
  { leftMic: 55.0, rightMic: 70.0, difference: -15.0, timestamp: 31000, averageLevel: 62.5 },
  { leftMic: 54.5, rightMic: 72.5, difference: -18.0, timestamp: 31500, averageLevel: 63.5 },
  { leftMic: 56.0, rightMic: 74.0, difference: -18.0, timestamp: 32000, averageLevel: 65.0 },
  { leftMic: 53.0, rightMic: 71.0, difference: -18.0, timestamp: 32500, averageLevel: 62.0 },
  { leftMic: 55.5, rightMic: 73.5, difference: -18.0, timestamp: 33000, averageLevel: 64.5 },
  { leftMic: 54.0, rightMic: 69.0, difference: -15.0, timestamp: 33500, averageLevel: 61.5 },
  { leftMic: 56.5, rightMic: 75.0, difference: -18.5, timestamp: 34000, averageLevel: 65.75 },
  { leftMic: 55.0, rightMic: 73.0, difference: -18.0, timestamp: 34500, averageLevel: 64.0 },
  
  // ==================== TRANSITION TO CENTERED ====================
  // Gradual transition to balanced audio
  { leftMic: 58.0, rightMic: 68.0, difference: -10.0, timestamp: 35000, averageLevel: 63.0 },
  { leftMic: 60.0, rightMic: 65.0, difference: -5.0, timestamp: 35500, averageLevel: 62.5 },
  { leftMic: 62.0, rightMic: 64.0, difference: -2.0, timestamp: 36000, averageLevel: 63.0 },
  
  // ==================== PERFECTLY CENTERED PHASE (Balanced Colors) ====================
  // Nearly identical levels - should show beautiful orange-to-green gradient
  { leftMic: 65.0, rightMic: 65.1, difference: -0.1, timestamp: 36500, averageLevel: 65.05 },
  { leftMic: 67.0, rightMic: 67.2, difference: -0.2, timestamp: 37000, averageLevel: 67.1 },
  { leftMic: 69.0, rightMic: 68.8, difference: 0.2, timestamp: 37500, averageLevel: 68.9 },
  { leftMic: 66.5, rightMic: 66.3, difference: 0.2, timestamp: 38000, averageLevel: 66.4 },
  { leftMic: 68.0, rightMic: 68.1, difference: -0.1, timestamp: 38500, averageLevel: 68.05 },
  { leftMic: 70.0, rightMic: 70.0, difference: 0.0, timestamp: 39000, averageLevel: 70.0 },
  { leftMic: 67.5, rightMic: 67.6, difference: -0.1, timestamp: 39500, averageLevel: 67.55 },
  { leftMic: 69.5, rightMic: 69.4, difference: 0.1, timestamp: 40000, averageLevel: 69.45 },
  
  // ==================== TRANSITION TO LEFT ====================
  // Moving towards left dominance
  { leftMic: 68.0, rightMic: 65.0, difference: 3.0, timestamp: 40500, averageLevel: 66.5 },
  { leftMic: 70.0, rightMic: 62.0, difference: 8.0, timestamp: 41000, averageLevel: 66.0 },
  
  // ==================== STRONG LEFT PHASE (Orange Dominant) ====================
  // Left microphone much louder - should show ORANGE sphere with green accents
  { leftMic: 75.0, rightMic: 57.0, difference: 18.0, timestamp: 41500, averageLevel: 66.0 },
  { leftMic: 78.0, rightMic: 55.0, difference: 23.0, timestamp: 42000, averageLevel: 66.5 },
  { leftMic: 76.5, rightMic: 56.5, difference: 20.0, timestamp: 42500, averageLevel: 66.5 },
  { leftMic: 79.0, rightMic: 54.0, difference: 25.0, timestamp: 43000, averageLevel: 66.5 },
  { leftMic: 77.0, rightMic: 58.0, difference: 19.0, timestamp: 43500, averageLevel: 67.5 },
  { leftMic: 80.0, rightMic: 55.5, difference: 24.5, timestamp: 44000, averageLevel: 67.75 },
  { leftMic: 76.0, rightMic: 57.5, difference: 18.5, timestamp: 44500, averageLevel: 66.75 },
  { leftMic: 78.5, rightMic: 56.0, difference: 22.5, timestamp: 45000, averageLevel: 67.25 },
  
  // ==================== QUICK SWITCHES (Rapid Color Changes) ====================
  // Rapid switching between left and right for dynamic color demonstration
  { leftMic: 75.0, rightMic: 58.0, difference: 17.0, timestamp: 45200, averageLevel: 66.5 },   // LEFT
  { leftMic: 56.0, rightMic: 73.0, difference: -17.0, timestamp: 45400, averageLevel: 64.5 },  // RIGHT
  { leftMic: 77.0, rightMic: 55.0, difference: 22.0, timestamp: 45600, averageLevel: 66.0 },   // LEFT
  { leftMic: 54.0, rightMic: 75.0, difference: -21.0, timestamp: 45800, averageLevel: 64.5 },  // RIGHT
  { leftMic: 78.0, rightMic: 56.0, difference: 22.0, timestamp: 46000, averageLevel: 67.0 },   // LEFT
  { leftMic: 55.0, rightMic: 76.0, difference: -21.0, timestamp: 46200, averageLevel: 65.5 },  // RIGHT
  { leftMic: 79.0, rightMic: 57.0, difference: 22.0, timestamp: 46400, averageLevel: 68.0 },   // LEFT
  { leftMic: 56.0, rightMic: 77.0, difference: -21.0, timestamp: 46600, averageLevel: 66.5 },  // RIGHT
  
  // ==================== RETURN TO CENTERED ====================
  // Smooth transition back to balanced
  { leftMic: 65.0, rightMic: 70.0, difference: -5.0, timestamp: 47000, averageLevel: 67.5 },
  { leftMic: 68.0, rightMic: 69.0, difference: -1.0, timestamp: 47500, averageLevel: 68.5 },
  { leftMic: 69.5, rightMic: 69.8, difference: -0.3, timestamp: 48000, averageLevel: 69.65 },
  { leftMic: 70.0, rightMic: 70.0, difference: 0.0, timestamp: 48500, averageLevel: 70.0 },
  
  // ==================== MODERATE VARIATIONS ====================
  // Smaller differences for subtle color blending demonstration
  { leftMic: 68.0, rightMic: 72.0, difference: -4.0, timestamp: 49000, averageLevel: 70.0 },   // Slight RIGHT
  { leftMic: 72.0, rightMic: 68.0, difference: 4.0, timestamp: 49500, averageLevel: 70.0 },    // Slight LEFT
  { leftMic: 69.0, rightMic: 71.0, difference: -2.0, timestamp: 50000, averageLevel: 70.0 },   // Barely RIGHT
  { leftMic: 71.0, rightMic: 69.0, difference: 2.0, timestamp: 50500, averageLevel: 70.0 },    // Barely LEFT
  { leftMic: 70.0, rightMic: 70.5, difference: -0.5, timestamp: 51000, averageLevel: 70.25 },  // Nearly CENTERED
  
  // ==================== FINAL DRAMATIC SEQUENCE ====================
  // End with strong alternating pattern
  { leftMic: 82.0, rightMic: 54.0, difference: 28.0, timestamp: 51500, averageLevel: 68.0 },   // STRONG LEFT
  { leftMic: 53.0, rightMic: 81.0, difference: -28.0, timestamp: 52000, averageLevel: 67.0 },  // STRONG RIGHT
  { leftMic: 70.0, rightMic: 70.0, difference: 0.0, timestamp: 52500, averageLevel: 70.0 },    // PERFECT CENTER
  { leftMic: 80.0, rightMic: 55.0, difference: 25.0, timestamp: 53000, averageLevel: 67.5 },   // STRONG LEFT
  { leftMic: 55.0, rightMic: 80.0, difference: -25.0, timestamp: 53500, averageLevel: 67.5 },  // STRONG RIGHT
  { leftMic: 69.8, rightMic: 70.2, difference: -0.4, timestamp: 54000, averageLevel: 70.0 }    // FINAL CENTER
];

let audioData = {
  leftMic: 0,
  rightMic: 0,
  difference: 0,
  averageLevel: 0
};

// let co2Data = {
//   level: 420, // ppm
//   trend: 'stable',
//   change: 0, // ppm/min
//   history: new Array(100).fill(420)
// };

// ==================== THREE.JS SCENE SETUP ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f0f0f0');

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);


// ==================== ENHANCED MATERIALS ====================
const materials = {
  chairSeat: new THREE.MeshStandardMaterial({
    color: 0x2c2c2c,
    roughness: 0.3,
    metalness: 0.1,
    envMapIntensity: 0.5
  }),
  
  chairBack: new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.4,
    metalness: 0.0
  }),
  
  chairLegs: new THREE.MeshStandardMaterial({
    color: 0xe8e8e8,
    roughness: 0.2,
    metalness: 0.8,
    envMapIntensity: 1.0
  }),
  
  tableWood: new THREE.MeshStandardMaterial({
    color: 0xd4a574,
    roughness: 0.6,
    metalness: 0.0,
    envMapIntensity: 0.3
  }),
  
  floorCarpet: new THREE.MeshStandardMaterial({
    color: 0x2e5cb8,
    roughness: 0.9,
    metalness: 0.0
  })
};

// ==================== ARCHITECTURAL BACKGROUND ====================
// Add this section after your materials definition (around line 105)
function createArchitecturalBackground() {
  const backgroundGroup = new THREE.Group();
  
  // Room dimensions - higher ceiling
  const wallHeight = 6;
  const roomSize = 15;
  
  // Wall materials
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.8,
    metalness: 0.0
  });
  
  const accentWallMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8e8e8,
    roughness: 0.9,
    metalness: 0.0
  });
  
  // Back wall
  const backWallGeometry = new THREE.PlaneGeometry(roomSize, wallHeight);
  const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
  backWall.position.set(0, wallHeight/2, -roomSize/2);
  backWall.receiveShadow = true;
  backgroundGroup.add(backWall);
  
  // Front wall (with opening)
  const frontWallLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize/3, wallHeight), 
    wallMaterial
  );
  frontWallLeft.position.set(-roomSize/3, wallHeight/2, roomSize/2);
  frontWallLeft.rotation.y = Math.PI;
  frontWallLeft.receiveShadow = true;
  backgroundGroup.add(frontWallLeft);
  
  const frontWallRight = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize/3, wallHeight), 
    wallMaterial
  );
  frontWallRight.position.set(roomSize/3, wallHeight/2, roomSize/2);
  frontWallRight.rotation.y = Math.PI;
  frontWallRight.receiveShadow = true;
  backgroundGroup.add(frontWallRight);
  
  // Side walls
  const leftWallGeometry = new THREE.PlaneGeometry(roomSize, wallHeight);
  const leftWall = new THREE.Mesh(leftWallGeometry, accentWallMaterial);
  leftWall.position.set(-roomSize/2, wallHeight/2, 0);
  leftWall.rotation.y = Math.PI/2;
  leftWall.receiveShadow = true;
  backgroundGroup.add(leftWall);
  
  const rightWall = new THREE.Mesh(leftWallGeometry, accentWallMaterial);
  rightWall.position.set(roomSize/2, wallHeight/2, 0);
  rightWall.rotation.y = -Math.PI/2;
  rightWall.receiveShadow = true;
  backgroundGroup.add(rightWall);
  
  // Simple flat ceiling (no grid)
  const ceilingGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.7,
    metalness: 0.0
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.position.set(0, wallHeight, 0);
  ceiling.rotation.x = Math.PI/2;
  ceiling.receiveShadow = true;
  backgroundGroup.add(ceiling);
  
  // WHITEBOARD on LEFT WALL (replacing the black painting)
  const whiteboardMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.0
  });
  
  const whiteboardFrameMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.3,
    metalness: 0.8
  });


  // Whiteboard frame on LEFT wall
  const whiteboardFrame = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 3.6, 0.05),
    whiteboardFrameMaterial
  );
  whiteboardFrame.position.set(-roomSize/2 + 0.04, 3.2, 0); 
  whiteboardFrame.rotation.y = Math.PI/2; 
  whiteboardFrame.castShadow = true;
  backgroundGroup.add(whiteboardFrame);
  
  // Whiteboard surface on LEFT wall (double size: 4.4m x 3.2m)
  const whiteboard = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 3.2),
    whiteboardMaterial
  );
  whiteboard.position.set(-roomSize/2 + 0.08, 3.2, 0); 
  whiteboard.rotation.y = Math.PI/2; 
  backgroundGroup.add(whiteboard);
  
  return backgroundGroup;
}



// Enhanced architectural elements with two plants and corrected whiteboard
function createArchitecturalElements() {
  const elementsGroup = new THREE.Group();
  
  // Modern light fixtures (higher up due to higher ceiling)
  const lightFixtureMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.3,
    metalness: 0.8
  });
  
  // Pendant lights (positioned higher)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const x = Math.cos(angle) * 6;
    const z = Math.sin(angle) * 6;
    
    // Light fixture body
    const fixture = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 0.2, 16),
      lightFixtureMaterial
    );
    fixture.position.set(x, 5, z);
    fixture.castShadow = true;
    elementsGroup.add(fixture);
    
    // Suspension cable
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 1, 8),
      lightFixtureMaterial
    );
    cable.position.set(x, 5.5, z);
    elementsGroup.add(cable);
    
    // Add point light for each fixture
    const pointLight = new THREE.PointLight(0xffffff, 0.3, 10);
    pointLight.position.set(x, 4.8, z);
    pointLight.castShadow = true;
    elementsGroup.add(pointLight);
  }
  
  // Plant materials
  const potMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.0
  });

  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x228b22,
    roughness: 0.7,
    metalness: 0.0
  });

  const flowerMaterial = new THREE.MeshStandardMaterial({
    color: 0xff69b4,
    roughness: 0.4,
    metalness: 0.0
  });

  // Two plant positions under the blackboard on back wall (further apart)
  const plantPositions = [
    { x: -5.5, z: -6.5 }, // Left side under back wall board (moved further left)
    { x: 5.5, z: -6.5 }   // Right side under back wall board (moved further right)
  ];

  plantPositions.forEach((plantPos) => {
    // Pot
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.25, 0.4, 16),
      potMaterial
    );
    pot.position.set(plantPos.x, 0.2, plantPos.z);
    pot.castShadow = true;
    pot.receiveShadow = true;
    elementsGroup.add(pot);
    
    // Plant stem
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x2d5016 })
    );
    stem.position.set(plantPos.x, 0.8, plantPos.z);
    stem.castShadow = true;
    elementsGroup.add(stem);
    
    // Leaves
    for (let i = 0; i < 5; i++) {
      const leafAngle = (i / 5) * Math.PI * 2;
      const leafRadius = 0.2 + Math.random() * 0.1;
      const leafHeight = 0.6 + i * 0.1;
      
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 6),
        leafMaterial
      );
      leaf.position.set(
        plantPos.x + Math.cos(leafAngle) * leafRadius,
        leafHeight,
        plantPos.z + Math.sin(leafAngle) * leafRadius
      );
      leaf.scale.set(1.5, 0.5, 0.8);
      leaf.castShadow = true;
      elementsGroup.add(leaf);
    }
    
    // Flowers
    for (let i = 0; i < 3; i++) {
      const flowerAngle = Math.random() * Math.PI * 2;
      const flowerRadius = 0.15;
      const flowerHeight = 1.0 + Math.random() * 0.2;
      
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 6),
        flowerMaterial
      );
      flower.position.set(
        plantPos.x + Math.cos(flowerAngle) * flowerRadius,
        flowerHeight,
        plantPos.z + Math.sin(flowerAngle) * flowerRadius
      );
      flower.castShadow = true;
      elementsGroup.add(flower);
    }
  });
  
  // BLACK BOARD on BACK WALL (centered)
  const blackboardMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000, // Black surface instead of white
    roughness: 0.1,
    metalness: 0.0
  });
  
  const whiteboardFrameMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.3,
    metalness: 0.8
  });
  
  const roomSize = 15; // Match the room size from background
  
  // Blackboard frame on BACK wall
  const blackboardFrame = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 2.0, 0.05),
    whiteboardFrameMaterial
  );
  blackboardFrame.position.set(0, 3.0, -roomSize/2 + 0.04); // BACK wall, centered
  blackboardFrame.castShadow = true;
  elementsGroup.add(blackboardFrame);
  
  // Blackboard surface on BACK wall
  const blackboard = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 1.8),
    blackboardMaterial
  );
  blackboard.position.set(0, 3.0, -roomSize/2 + 0.08); // BACK wall, centered
  elementsGroup.add(blackboard);
  
  // Floor-to-ceiling windows (unchanged)
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1,
    metalness: 0.0
  });
  
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.4,
    metalness: 0.6
  });
  
  // Right wall windows
  for (let i = 0; i < 3; i++) {
    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 5.5, 2),
      frameMaterial
    );
    windowFrame.position.set(7.4, 2.75, (i - 1) * 4);
    windowFrame.castShadow = true;
    elementsGroup.add(windowFrame);
    
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 5.3),
      glassMaterial
    );
    glass.position.set(7.45, 2.75, (i - 1) * 4);
    glass.rotation.y = -Math.PI/2;
    elementsGroup.add(glass);
  }
  
  return elementsGroup;
}

// Enhanced environment setup (same as before)
function setupEnhancedEnvironment() {
  // Remove old background if it exists
  scene.children.forEach(child => {
    if (child.userData && child.userData.isBackground) {
      scene.remove(child);
    }
    if (child.userData && child.userData.isArchitectural) {
      scene.remove(child);
    }
  });
  
  // Create and add new background
  const background = createArchitecturalBackground();
  background.userData.isBackground = true;
  scene.add(background);
  
  // Create and add architectural elements
  const elements = createArchitecturalElements();
  elements.userData.isArchitectural = true;
  scene.add(elements);
  
  console.log('🏢 Enhanced architectural background with higher ceiling, paintings, and plants added');
}


function createModernTable() {
  const table = new THREE.Group();
  
  const tableShape = new THREE.Shape();
  const radius = 3.2;
  const centerRadius = 1.2;
  
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    const waveOffset = Math.sin(angle * 3) * 0.1;
    const currentRadius = radius + waveOffset;
    const x = Math.cos(angle) * currentRadius;
    const y = Math.sin(angle) * currentRadius;
    
    if (i === 0) {
      tableShape.moveTo(x, y);
    } else {
      tableShape.lineTo(x, y);
    }
  }
  
  const holePath = new THREE.Path();
  for (let i = 0; i <= 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const x = Math.cos(angle) * centerRadius;
    const y = Math.sin(angle) * centerRadius;
    
    if (i === 0) {
      holePath.moveTo(x, y);
    } else {
      holePath.lineTo(x, y);
    }
  }
  tableShape.holes.push(holePath);
  
  const extrudeSettings = {
    depth: 0.08,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 2,
    bevelSize: 0.02,
    bevelThickness: 0.01
  };
  
  const tableGeometry = new THREE.ExtrudeGeometry(tableShape, extrudeSettings);
  
  const tableTop = new THREE.Mesh(tableGeometry, materials.tableWood);
  tableTop.rotation.x = -Math.PI / 2;
  tableTop.position.y = 0.75;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  table.add(tableTop);

  // ========== ADD 4 TABLE LEGS ==========
  const legGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.75, 16);
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a574, 
    roughness: 0.6,
    metalness: 0.1
  });
  
  // Position legs around the table (not at the very edge to avoid chair collision)
  const legDistance = 2.8; // Distance from center to legs
  const legPositions = [
    [legDistance, 0.375, 0],           // Right
    [-legDistance, 0.375, 0],          // Left  
    [0, 0.375, legDistance],           // Back
    [0, 0.375, -legDistance]           // Front
  ];
  
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    table.add(leg);
  });

  return table;
}

const table = createModernTable();
scene.add(table);


// ==================== LIGHTING ====================

const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
mainLight.position.set(10, 15, 5);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 50;
mainLight.shadow.camera.left = -15;
mainLight.shadow.camera.right = 15;
mainLight.shadow.camera.top = 15;
mainLight.shadow.camera.bottom = -15;
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
fillLight.position.set(-8, 10, -5);
scene.add(fillLight);

const accentLight1 = new THREE.PointLight(0xffffff, 0.4, 20);
accentLight1.position.set(5, 3, 5);
scene.add(accentLight1);

const accentLight2 = new THREE.PointLight(0xf0f8ff, 0.3, 15);
accentLight2.position.set(-4, 2, -4);
scene.add(accentLight2);


// ==================== ENVIRONMENT ====================
const floorGeometry = new THREE.PlaneGeometry(20, 20, 50, 50);
const floorPositions = floorGeometry.attributes.position.array;
for (let i = 0; i < floorPositions.length; i += 3) {
  const x = floorPositions[i];
  const z = floorPositions[i + 1];
  const noise = (Math.sin(x * 2) + Math.cos(z * 2)) * 0.005;
  floorPositions[i + 2] += noise;
}
floorGeometry.attributes.position.needsUpdate = true;
floorGeometry.computeVertexNormals();

const floor = new THREE.Mesh(floorGeometry, materials.floorCarpet);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);


// ==================== CHAIR ====================
function createModernChair() {
  const chair = new THREE.Group();
  
  // Chair materials
  const seatMaterial = new THREE.MeshStandardMaterial({
    color: 0x4CAF50, // Green seat like reference image
    roughness: 0.4,
    metalness: 0.1
  });
  
  const backrestMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080, // Gray backrest
    roughness: 0.6,
    metalness: 0.1
  });
  
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0, // Light gray frame
    roughness: 0.2,
    metalness: 0.7
  });
  
  // ========== SEAT ==========
  // Create rounded seat cushion
  const seatGeometry = new THREE.BoxGeometry(0.5, 0.08, 0.48);
  // Add some padding effect by modifying vertices
  const seatPositions = seatGeometry.attributes.position.array;
  for (let i = 0; i < seatPositions.length; i += 3) {
    const x = seatPositions[i];
    const z = seatPositions[i + 2];
    const y = seatPositions[i + 1];
    
    // Round the edges
    const edgeDistance = Math.max(Math.abs(x) - 0.2, Math.abs(z) - 0.2);
    if (edgeDistance > 0) {
      seatPositions[i + 1] = y - edgeDistance * 0.1; // Slightly lower at edges
    }
  }
  seatGeometry.attributes.position.needsUpdate = true;
  seatGeometry.computeVertexNormals();
  
  const seat = new THREE.Mesh(seatGeometry, seatMaterial);
  seat.position.y = 0.46;
  seat.castShadow = true;
  seat.receiveShadow = true;
  chair.add(seat);

  // ========== BACKREST ==========
  // Main backrest
  const backrestGeometry = new THREE.BoxGeometry(0.45, 0.6, 0.08);
  const backrestPositions = backrestGeometry.attributes.position.array;
  
  // Shape the backrest with ergonomic curve
  for (let i = 0; i < backrestPositions.length; i += 3) {
    const x = backrestPositions[i];
    const y = backrestPositions[i + 1];
    const z = backrestPositions[i + 2];
    
    // Add slight curve to the back
    if (z > 0) { // Front face
      backrestPositions[i + 2] = z + Math.pow((y + 0.3) / 0.6, 2) * 0.05;
    }
    
    // Round the top corners
    if (y > 0.2) {
      const cornerFactor = Math.max(0, Math.abs(x) - 0.15) / 0.1;
      backrestPositions[i + 1] = y - cornerFactor * 0.1;
    }
  }
  backrestGeometry.attributes.position.needsUpdate = true;
  backrestGeometry.computeVertexNormals();
  
  const backrest = new THREE.Mesh(backrestGeometry, backrestMaterial);
  backrest.position.set(0, 0.76, -0.2);
  backrest.rotation.x = -0.1; // Slight lean back
  backrest.castShadow = true;
  backrest.receiveShadow = true;
  chair.add(backrest);

  // ========== ARMRESTS ==========
  // Armrest pads
  const armrestPadGeometry = new THREE.BoxGeometry(0.25, 0.06, 0.08);
  const armrestHeight = 0.65;
  
  // Left armrest
  const leftArmrestPad = new THREE.Mesh(armrestPadGeometry, seatMaterial);
  leftArmrestPad.position.set(-0.3, armrestHeight, -0.05);
  leftArmrestPad.castShadow = true;
  leftArmrestPad.receiveShadow = true;
  chair.add(leftArmrestPad);
  
  // Right armrest
  const rightArmrestPad = new THREE.Mesh(armrestPadGeometry, seatMaterial);
  rightArmrestPad.position.set(0.3, armrestHeight, -0.05);
  rightArmrestPad.castShadow = true;
  rightArmrestPad.receiveShadow = true;
  chair.add(rightArmrestPad);

  // ========== CHAIR LEGS (4 simple legs) ==========
  const legGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.46, 12);
  const legPositions = [
    [0.2, 0.23, 0.18],   // Front right
    [-0.2, 0.23, 0.18],  // Front left
    [0.2, 0.23, -0.18],  // Back right
    [-0.2, 0.23, -0.18]  // Back left
  ];
  
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, frameMaterial);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    chair.add(leg);
  });
  
  // Optional: Add cross braces for stability (like many office chairs)
  const braceGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.28, 8);
  
  // Front brace
  const frontBrace = new THREE.Mesh(braceGeometry, frameMaterial);
  frontBrace.position.set(0, 0.15, 0.18);
  frontBrace.rotation.z = Math.PI / 2;
  frontBrace.castShadow = true;
  chair.add(frontBrace);
  
  // Back brace
  const backBrace = new THREE.Mesh(braceGeometry, frameMaterial);
  backBrace.position.set(0, 0.15, -0.18);
  backBrace.rotation.z = Math.PI / 2;
  backBrace.castShadow = true;
  chair.add(backBrace);

  // ========== ARMREST SUPPORTS ==========
  // Connect armrests to seat
  const armSupportGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8);
  
  // Left armrest support
  const leftArmSupport = new THREE.Mesh(armSupportGeometry, frameMaterial);
  leftArmSupport.position.set(-0.25, 0.56, -0.15);
  leftArmSupport.castShadow = true;
  chair.add(leftArmSupport);
  
  // Right armrest support
  const rightArmSupport = new THREE.Mesh(armSupportGeometry, frameMaterial);
  rightArmSupport.position.set(0.25, 0.56, -0.15);
  rightArmSupport.castShadow = true;
  chair.add(rightArmSupport);

  // ========== BACKREST SUPPORT ==========
  // Connect backrest to seat mechanism
  const backSupportGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8);
  const backSupport = new THREE.Mesh(backSupportGeometry, frameMaterial);
  backSupport.position.set(0, 0.535, -0.15);
  backSupport.rotation.x = -0.1;
  backSupport.castShadow = true;
  chair.add(backSupport);

  // ========== SEAT MECHANISM (Simplified) ==========
  // Add some detail under the seat - simpler design
  const mechanismGeometry = new THREE.BoxGeometry(0.15, 0.04, 0.12);
  const mechanism = new THREE.Mesh(mechanismGeometry, frameMaterial);
  mechanism.position.set(0, 0.38, -0.05);
  mechanism.castShadow = true;
  chair.add(mechanism);

  return chair;
}

// ==================== ENHANCED MATERIALS FOR CHAIRS ====================
// Update your materials object to include better chair materials
const enhancedMaterials = {
  chairSeat: new THREE.MeshStandardMaterial({
    color: 0x4CAF50, // Green like reference image
    roughness: 0.4,
    metalness: 0.1,
    envMapIntensity: 0.5
  }),
  
  chairBack: new THREE.MeshStandardMaterial({
    color: 0x808080, // Gray backrest
    roughness: 0.6,
    metalness: 0.1
  }),
  
  chairFrame: new THREE.MeshStandardMaterial({
    color: 0xc0c0c0, // Light metallic gray
    roughness: 0.2,
    metalness: 0.8,
    envMapIntensity: 1.0
  }),
  
  chairWheels: new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.1
  }),
  
  // Keep your existing materials
  tableWood: new THREE.MeshStandardMaterial({
    color: 0xd4a574,
    roughness: 0.6,
    metalness: 0.0,
    envMapIntensity: 0.3
  }),
  
  floorCarpet: new THREE.MeshStandardMaterial({
    color: 0x4a90e2,
    roughness: 0.9,
    metalness: 0.0
  })
};

// ==================== CHAIR CREATION WITH VARIATIONS ====================
// Function to create chairs with slight variations
function createChairWithVariation(index) {
  const chair = createModernChair();
  
  // Add slight variations to make chairs look more natural
  const colorVariations = [
    0x4CAF50, // Green
    // 0x2196F3, // Blue  
    // 0xFF9800, // Orange
    // 0x9C27B0, // Purple
    // 0xF44336, // Red
    // 0x00BCD4, // Cyan
    // 0x8BC34A, // Light Green
    // 0xFFC107, // Amber
    // 0x607D8B, // Blue Gray
    // 0x795548  // Brown
  ];
  
  // Update seat color for variety
  const seatColor = colorVariations[index % colorVariations.length];
  chair.children.forEach(child => {
    if (child.material && child.material.color && child.position.y > 0.4) {
      // This is likely the seat or armrest pad
      if (child.geometry.type === 'BoxGeometry' && 
          (Math.abs(child.position.y - 0.46) < 0.1 || Math.abs(child.position.y - 0.65) < 0.1)) {
        child.material = child.material.clone();
        child.material.color.setHex(seatColor);
      }
    }
  });
  
  return chair;
}




const numChairs = 10;
const chairPositions = [];
for (let i = 0; i < numChairs; i++) {
  const angle = (i / numChairs) * Math.PI * 2;
  const x = Math.cos(angle) * 3.5;
  const z = Math.sin(angle) * 3.5;
  chairPositions.push({ x, z, angle });
  
  const chair = createChairWithVariation(i); // Use the variation function
  chair.position.set(x, 0, z);
  chair.rotation.y = Math.atan2(-x, -z);
  chair.userData.isChair = true;
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
  const material = new THREE.MeshStandardMaterial({ color: 0x19337F });
  const person = new THREE.Mesh(geometry, material);
  const { x, z, angle } = chairPositions[index];
  person.position.set(x, 0.4 + personHeight / 2, z);
  person.rotation.y = -angle + Math.PI;
  person.castShadow = true;    // Add this line
  person.receiveShadow = true; // Add this line
  scene.add(person);
}


// ==================== SPHERE CHART MAPPING ====================
let offscreenCanvas = null;
let offscreenContext = null;
let sphereChartTexture = null;
let sphereChartMaterial = null;

function initializeOffscreenCanvas() {
  offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = 1024;
  offscreenCanvas.height = 1024;
  offscreenContext = offscreenCanvas.getContext('2d');
  
  sphereChartTexture = new THREE.CanvasTexture(offscreenCanvas);
  sphereChartTexture.flipY = false;
  
  // Add these properties for better wrapping
  sphereChartTexture.wrapS = THREE.RepeatWrapping;
  sphereChartTexture.wrapT = THREE.RepeatWrapping;
  sphereChartTexture.repeat.set(1, 1);
  
  sphereChartMaterial = new THREE.MeshBasicMaterial({
    map: sphereChartTexture,
    transparent: false,
    opacity: 1.0
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
  // offscreenContext.fillStyle = 'rgba(42, 42, 42, 0.1)';
  offscreenContext.fillRect(0, 0, 1024, 1024);
  // Use people count for background color
  const bgColor = sphereColors[peopleCount] || 0x53c566;
  const r = (bgColor >> 16) & 255;
  const g = (bgColor >> 8) & 255;
  const b = bgColor & 255;
  offscreenContext.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
  
  // Use real data if available, otherwise generate sample data
  const dataToUse = isUsingRealData ? realAudioData : generateChartSampleData();
  
  switch (mode) {
    case 'stereo':
      drawStereoChartOnCanvas(offscreenContext, dataToUse);
      break;
    case 'activity':
      drawActivityChartOnCanvas(offscreenContext, dataToUse);
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
  const padding = 80;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  const centerY = height / 2;

    // Use people count to change background color
  const bgColor = sphereColors[peopleCount] || 0x53c566;
  const r = (bgColor >> 16) & 255;
  const g = (bgColor >> 8) & 255; 
  const b = bgColor & 255;
  
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`; // Use people-based color
  ctx.fillRect(0, 0, width, height);

  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(15, 15, 30, 0.95)';
  ctx.fillRect(0, 0, width, height);
  
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Directional Audio', width / 2, 60);
  
  // Draw center reference line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(padding, centerY);
  ctx.lineTo(width - padding, centerY);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Labels
  ctx.fillStyle = '#FF4444';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('LEFT', 20, centerY - 150);
  
  ctx.fillStyle = '#44FF44';
  ctx.fillText('RIGHT', 20, centerY + 180);
  
  // Draw directional visualization
  const stepX = chartWidth / Math.max(1, audioData.length - 1);
  
  // Store previous positions for line continuity
  let prevLeftY = centerY;
  let prevRightY = centerY;
  
  audioData.forEach((d, i) => {
    const x = padding + i * stepX;
    const difference = d.difference || 0;
    const avgLevel = d.averageLevel || 60;
    
    // Calculate directional positions - bigger differences = further from center
    const maxOffset = chartHeight * 0.35;
    
    // LEFT side (positive difference) - goes UP from center
    let leftY = centerY;
    let rightY = centerY;
    
    if (difference > 0) {
      // Left is louder - move left line UP, right line slightly down
      const leftStrength = Math.min(difference / 25, 1); // Normalize to 0-1
      leftY = centerY - (leftStrength * maxOffset);
      rightY = centerY + (leftStrength * maxOffset * 0.3); // Slight movement
    } else if (difference < 0) {
      // Right is louder - move right line DOWN, left line slightly up  
      const rightStrength = Math.min(Math.abs(difference) / 25, 1);
      rightY = centerY + (rightStrength * maxOffset);
      leftY = centerY - (rightStrength * maxOffset * 0.3); // Slight movement
    }
    
    // Intensity affects line thickness and glow
    const intensity = Math.max(0.1, Math.min(1, (avgLevel - 50) / 30));
    
    // Draw LEFT line segment
    if (i > 0) {
      const leftThickness = difference > 2 ? 8 + intensity * 6 : 3 + intensity * 2;
      ctx.strokeStyle = difference > 5 ? '#FF2222' : '#FF6666';
      ctx.lineWidth = leftThickness;
      ctx.shadowColor = '#FF4444';
      ctx.shadowBlur = difference > 0 ? 15 : 5;
      
      ctx.beginPath();
      ctx.moveTo(padding + (i-1) * stepX, prevLeftY);
      ctx.lineTo(x, leftY);
      ctx.stroke();
    }
    
    // Draw RIGHT line segment  
    if (i > 0) {
      const rightThickness = difference < -2 ? 8 + intensity * 6 : 3 + intensity * 2;
      ctx.strokeStyle = difference < -5 ? '#22FF22' : '#66FF66';
      ctx.lineWidth = rightThickness;
      ctx.shadowColor = '#44FF44';
      ctx.shadowBlur = difference < 0 ? 15 : 5;
      
      ctx.beginPath();
      ctx.moveTo(padding + (i-1) * stepX, prevRightY);
      ctx.lineTo(x, rightY);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
    
    // Update previous positions
    prevLeftY = leftY;
    prevRightY = rightY;
    
    // Draw connection line when there's significant difference
    if (Math.abs(difference) > 3) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.4})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, leftY);
      ctx.lineTo(x, rightY);
      ctx.stroke();
    }
  });
  
  // Legend
  ctx.fillStyle = '#FF4444';
  ctx.fillRect(padding, height - 60, 30, 15);
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Left Mic', padding + 40, height - 47);
  
  ctx.fillStyle = '#44FF44';
  ctx.fillRect(padding + 200, height - 60, 30, 15);
  ctx.fillText('Right Mic', padding + 240, height - 47);
}



function drawActivityChartOnCanvas(ctx, audioData) {
  const width = 1024;
  const height = 1024;
  const padding = 80;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(15, 15, 30, 0.95)';
  ctx.fillRect(0, 0, width, height);
  
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Activity Direction', width / 2, 60);
  
  // Draw axes
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  
  // Calculate bar dimensions
  const barWidth = Math.max(2, chartWidth / audioData.length);
  const maxLevel = Math.max(...audioData.map(d => d.averageLevel));
  const minLevel = Math.min(...audioData.map(d => d.averageLevel));
  const levelRange = maxLevel - minLevel;
  
  audioData.forEach((d, i) => {
    const x = padding + i * barWidth;
    const difference = d.difference || 0;
    const avgLevel = d.averageLevel || 60;
    
    // Base bar height
    const normalizedLevel = Math.max(0.1, Math.min(1, (avgLevel - minLevel) / levelRange));
    const baseBarHeight = normalizedLevel * chartHeight * 0.7;
    
    // Directional modification - stronger direction = taller bar
    const directionBoost = 1 + (Math.abs(difference) / 20);
    const finalBarHeight = Math.min(baseBarHeight * directionBoost, chartHeight * 0.9);
    const y = height - padding - finalBarHeight;
    
    // Color based on direction with intensity
    let color, glowColor;
    const absDir = Math.abs(difference);
    
    if (difference > 8) {
      color = '#FF2222'; // Strong left = bright red
      glowColor = '#FF4444';
    } else if (difference > 3) {
      color = '#FF6666'; // Left = red
      glowColor = '#FF6666';
    } else if (difference < -8) {
      color = '#22FF22'; // Strong right = bright green  
      glowColor = '#44FF44';
    } else if (difference < -3) {
      color = '#66FF66'; // Right = green
      glowColor = '#66FF66';
    } else {
      color = '#4488FF'; // Centered = blue
      glowColor = '#6699FF';
    }
    
    // Enhanced visual effects for direction
    const intensity = normalizedLevel;
    const shadowBlur = 5 + intensity * 15 + absDir * 2;
    
    ctx.fillStyle = color;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.fillRect(x, y, barWidth - 1, finalBarHeight);
    
    // Add bright border for emphasis
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = Math.max(1, absDir / 5);
    ctx.shadowBlur = 0;
    ctx.strokeRect(x, y, barWidth - 1, finalBarHeight);
  });
  
  ctx.shadowBlur = 0;
  
  // Enhanced Legend
  const legendY = height - 40;
  
  ctx.fillStyle = '#FF4444';
  ctx.fillRect(padding, legendY, 15, 10);
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('L', padding + 20, legendY + 8);
  
  ctx.fillStyle = '#4488FF';
  ctx.fillRect(padding + 50, legendY, 15, 10);
  ctx.fillText('C', padding + 70, legendY + 8);
  
  ctx.fillStyle = '#44FF44';
  ctx.fillRect(padding + 100, legendY, 15, 10);
  ctx.fillText('R', padding + 120, legendY + 8);
}





function updateSphereCharts() {
  // Update sphere charts if in chart mode
  if (['stereo', 'activity'].includes(currentVisualizationMode)) {
    createSphereChart(currentVisualizationMode);
  }
}

// ==================== VISUALIZATION SHADERS ====================
const sphereRadius = 0.6;
const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 128, 128);

// Modify UV coordinates for better chart wrapping
const uvAttribute = sphereGeometry.attributes.uv;
const uvArray = uvAttribute.array;

for (let i = 0; i < uvArray.length; i += 2) {
  // Stretch U coordinate to cover full width multiple times
  uvArray[i] = (uvArray[i] * 2) % 1;
  // Keep V coordinate as is for vertical mapping
}

uvAttribute.needsUpdate = true;

const audioShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    leftAudio: { value: 0.0 },
    rightAudio: { value: 0.0 },
    centerMix: { value: 0.0 },
    audioDirection: { value: 0.0 }, // -1 = RIGHT, 0 = CENTER, +1 = LEFT
    baseColor: { value: new THREE.Color(0x53c566) },
    leftColor: { value: new THREE.Color(0xff6600) },  // Orange for LEFT
    rightColor: { value: new THREE.Color(0x4CAF50) }, // Green for RIGHT
    accentColor: { value: new THREE.Color(0x87CEEB) } // Light blue for accents
  },
  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      
      // Calculate world position for better spatial effects
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform float leftAudio;
    uniform float rightAudio;
    uniform float centerMix;
    uniform float audioDirection;
    uniform vec3 baseColor;
    uniform vec3 leftColor;
    uniform vec3 rightColor;
    uniform vec3 accentColor;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    // Enhanced noise function for organic patterns
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    float smoothNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float a = noise(i);
      float b = noise(i + vec2(1.0, 0.0));
      float c = noise(i + vec2(0.0, 1.0));
      float d = noise(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    void main() {
      // Create smooth spatial zones for color distribution
      float leftZone = smoothstep(0.1, -0.8, vPosition.x);    // Left side strength
      float rightZone = smoothstep(-0.1, 0.8, vPosition.x);   // Right side strength
      float centerZone = 1.0 - smoothstep(-0.3, 0.3, abs(vPosition.x)); // Center strength
      
      // Add some organic noise for natural color blending
      vec2 noiseCoord = vUv * 8.0 + time * 0.2;
      float organicNoise = smoothNoise(noiseCoord) * 0.3;
      
      // Start with base color
      vec3 finalColor = baseColor * 0.7; // Slightly dimmed base
      
      // === LEFT DETECTION (audioDirection > 0.3) ===
      if (audioDirection > 0.3) {
        float leftStrength = audioDirection; // 0.3 to 1.0
        
        // Primary orange dominance with spatial variation
        float orangeAmount = leftStrength * (0.8 + leftZone * 0.2 + organicNoise);
        finalColor = mix(finalColor, leftColor, orangeAmount);
        
        // Subtle green accents (10-25% depending on position)
        float greenAccent = (0.1 + rightZone * 0.15) * leftStrength;
        finalColor = mix(finalColor, rightColor, greenAccent);
        
        // Add some beautiful shimmer on the left side
        float shimmer = sin(time * 3.0 + vPosition.x * 5.0) * 0.1 + 0.9;
        finalColor *= shimmer;
      }
      
      // === RIGHT DETECTION (audioDirection < -0.3) ===
      else if (audioDirection < -0.3) {
        float rightStrength = abs(audioDirection); // 0.3 to 1.0
        
        // Primary green dominance with spatial variation  
        float greenAmount = rightStrength * (0.8 + rightZone * 0.2 + organicNoise);
        finalColor = mix(finalColor, rightColor, greenAmount);
        
        // Subtle orange accents (10-25% depending on position)
        float orangeAccent = (0.1 + leftZone * 0.15) * rightStrength;
        finalColor = mix(finalColor, leftColor, orangeAccent);
        
        // Add some beautiful shimmer on the right side
        float shimmer = sin(time * 3.0 - vPosition.x * 5.0) * 0.1 + 0.9;
        finalColor *= shimmer;
      }
      
      // === CENTERED AUDIO (-0.3 <= audioDirection <= 0.3) ===
      else {
        // When in demo mode (low audio influence), heavily favor baseColor
        float audioInfluence = abs(audioDirection);
        float baseColorInfluence = 1.0 - audioInfluence;
        
        if (baseColorInfluence > 0.8) {
          // Strong base color influence - this is demo mode
          finalColor = mix(finalColor, baseColor, 0.9);
          
          // Add subtle animated variations based on baseColor
          float colorPulse = sin(time * 2.0) * 0.1 + 0.9;
          finalColor *= colorPulse;
          
          // Add some organic texture
          finalColor = mix(finalColor, baseColor * 1.2, organicNoise * 0.3);
        } else {
          // Beautiful balanced color mixing for actual audio
          float balance = 0.5 + audioDirection * 0.5;
          float spatialBalance = (vPosition.x + 1.0) * 0.5;
          float finalBalance = mix(balance, spatialBalance, 0.6);
          vec3 balancedColor = mix(leftColor, rightColor, finalBalance);
          float centerIntensity = 0.7 + centerMix * 0.3 + organicNoise;
          finalColor = mix(finalColor, balancedColor, centerIntensity);
          float centerHighlight = centerZone * (0.2 + sin(time * 2.0) * 0.1);
          finalColor = mix(finalColor, accentColor, centerHighlight);
          float centerPulse = sin(time * 1.5) * 0.15 + 0.85;
          finalColor *= centerPulse;
        }
      }

      
      // === GENERAL ENHANCEMENTS ===
      
      // Add audio-reactive brightness
      float audioIntensity = (leftAudio + rightAudio) * 0.5;
      float brightnessMult = 0.8 + audioIntensity * 0.4;
      finalColor *= brightnessMult;
      
      // Add subtle vertical gradient for depth
      float verticalGradient = (vPosition.y + 1.0) * 0.5; // -1:1 -> 0:1
      finalColor *= (0.9 + verticalGradient * 0.2);
      
      // Ensure colors never get too dark
      finalColor = max(finalColor, vec3(0.2));
      
      // Add slight saturation boost for more vibrant colors
      float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
      vec3 saturated = mix(vec3(luminance), finalColor, 1.3);
      finalColor = mix(finalColor, saturated, 0.3);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
  transparent: false,
  side: THREE.DoubleSide
});



// Audio Wave Visualization - like the flowing waves in your image
const waveGeometry = new THREE.SphereGeometry(sphereRadius, 128, 128);
const waveMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    leftAudio: { value: 0.5 },
    rightAudio: { value: 0.5 },
    difference: { value: 0.0 },
    averageLevel: { value: 0.5 },
    baseColor: { value: new THREE.Color(0x53c566) },
    waveIntensity: { value: 1.0 },
    waveSpeed: { value: 1.0 }
  },
  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vElevation;
    
    uniform float time;
    uniform float leftAudio;
    uniform float rightAudio;
    uniform float averageLevel;
    uniform float waveIntensity;
    uniform float waveSpeed;
    
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      
      // Create much more pronounced wave displacement
      vec3 pos = position;
      
      // LEFT WAVE - moves on left side of sphere (negative X)
      float leftSide = smoothstep(0.2, -0.8, position.x); // Strong on left side
      float leftWave = sin(position.x * 3.0 + position.z * 2.0 + time * waveSpeed * 3.0) * 
                       sin(position.y * 2.0 + time * waveSpeed * 2.0) * 
                       leftAudio * leftSide * 0.15; // Much larger displacement
      
      // RIGHT WAVE - moves on right side of sphere (positive X)  
      float rightSide = smoothstep(-0.2, 0.8, position.x); // Strong on right side
      float rightWave = sin(position.x * 2.5 + position.z * 3.0 + time * waveSpeed * 2.5) * 
                        sin(position.y * 1.8 + time * waveSpeed * 1.8) * 
                        rightAudio * rightSide * 0.15; // Much larger displacement
      
      // Combine waves with audio reactivity
      float totalWave = (leftWave + rightWave) * waveIntensity * (0.8 + averageLevel * 0.4);
      
      // Apply displacement along surface normal for visible bumps
      pos += normal * totalWave;
      vElevation = totalWave;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform float leftAudio;
    uniform float rightAudio;
    uniform float difference;
    uniform float averageLevel;
    uniform vec3 baseColor;
    uniform float waveIntensity;
    uniform float waveSpeed;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      float timeModified = time * waveSpeed;
      
      // Define clear LEFT and RIGHT zones
      float leftZone = smoothstep(0.3, -0.7, vPosition.x);   // Left side strength
      float rightZone = smoothstep(-0.3, 0.7, vPosition.x);  // Right side strength
      
      // LEFT WAVE PATTERN - Orange/Red colors
      vec2 leftCoord = vUv * 8.0;
      leftCoord.x += timeModified * 0.5;
      leftCoord.y += sin(timeModified * 1.2) * 0.2;
      
      float leftPattern = sin(leftCoord.x * 4.0 + timeModified * 2.0) * 
                         sin(leftCoord.y * 3.0 + timeModified * 1.5) * 0.5 + 0.5;
      leftPattern *= leftAudio * leftZone;
      
      // RIGHT WAVE PATTERN - Blue/Cyan colors  
      vec2 rightCoord = vUv * 6.0;
      rightCoord.x -= timeModified * 0.4;
      rightCoord.y += cos(timeModified * 1.0) * 0.3;
      
      float rightPattern = sin(rightCoord.x * 3.5 + timeModified * 1.8) * 
                          sin(rightCoord.y * 4.0 + timeModified * 2.2) * 0.5 + 0.5;
      rightPattern *= rightAudio * rightZone;
      
      // Define distinct colors for each channel
      vec3 leftColor = vec3(1.0, 0.4, 0.1);    // Bright orange for LEFT
      vec3 rightColor = vec3(0.1, 0.6, 1.0);   // Bright blue for RIGHT
      vec3 centerColor = vec3(0.5, 0.8, 0.5);  // Green for center/base
      
      // Start with base color
      vec3 finalColor = mix(centerColor, baseColor, 0.5);
      
      // Add LEFT wave colors
      if (leftPattern > 0.1) {
        float leftIntensity = leftPattern * 2.0;
        finalColor = mix(finalColor, leftColor, leftIntensity);
      }
      
      // Add RIGHT wave colors
      if (rightPattern > 0.1) {
        float rightIntensity = rightPattern * 2.0;
        finalColor = mix(finalColor, rightColor, rightIntensity);
      }
      
      // Enhance with elevation (raised areas are brighter)
      float elevationBoost = 1.0 + abs(vElevation) * 8.0;
      finalColor *= elevationBoost;
      
      // Add overall activity pulsing
      float activityPulse = 0.8 + averageLevel * 0.4 + sin(timeModified * 3.0) * 0.1;
      finalColor *= activityPulse;
      
      // Add directional bias based on audio difference
      if (abs(difference) > 0.1) {
        if (difference > 0.1) {
          // Left is louder - enhance left colors
          finalColor = mix(finalColor, leftColor, abs(difference) * 0.3);
        } else {
          // Right is louder - enhance right colors  
          finalColor = mix(finalColor, rightColor, abs(difference) * 0.3);
        }
      }
      
      // Ensure visible colors
      finalColor = max(finalColor, vec3(0.3));
      finalColor = min(finalColor, vec3(1.2));
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
  transparent: false,
  side: THREE.DoubleSide
});




let waveParticleSystem = null;

function createWaveParticleSystem() {
  const particleCount = 2000;
  const geometry = new THREE.BufferGeometry();
  
  // Create particle positions and attributes
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const phases = new Float32Array(particleCount);
  
  // Initialize particles in a sphere-like distribution
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    
    // Spherical distribution
    const radius = 0.8 + Math.random() * 0.4; // Slightly outside the main sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
    
    // Random colors (will be overridden by shader)
    colors[i3] = Math.random();
    colors[i3 + 1] = Math.random();
    colors[i3 + 2] = Math.random();
    
    // Random size and phase
    sizes[i] = Math.random() * 3.0 + 1.0;
    phases[i] = Math.random() * Math.PI * 2;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  
  // Particle material with custom shader
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      leftAudio: { value: 0.5 },
      rightAudio: { value: 0.5 },
      difference: { value: 0.0 },
      averageLevel: { value: 0.5 },
      waveIntensity: { value: 1.0 }
    },
    vertexShader: `
      attribute float size;
      attribute float phase;
      
      uniform float time;
      uniform float leftAudio;
      uniform float rightAudio;
      uniform float averageLevel;
      uniform float difference;
      uniform float waveIntensity;
      
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        // Calculate wave influence on particle
        float waveOffset = sin(position.x * 3.0 + time * 2.0 + phase) * 0.1;
        waveOffset += sin(position.z * 4.0 + time * 1.5 + phase) * 0.08;
        
        // Audio reactivity
        float audioReactivity = 0.5 + averageLevel * 0.5;
        waveOffset *= audioReactivity * waveIntensity;
        
        // Apply wave displacement
        vec3 newPosition = position + normal * waveOffset;
        
        // Directional flow based on stereo difference
        newPosition.x += difference * 0.2 * sin(time + phase);
        
        vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Particle size based on distance and audio
        float baseSize = size * (1.0 + averageLevel * 0.5);
        gl_PointSize = baseSize * (300.0 / -mvPosition.z);
        
        // Color based on position and audio
        float colorPhase = (position.x + position.z) * 0.5 + time * 0.3;
        
        if (difference > 0.1) {
          // Left bias - warmer colors
          vColor = vec3(1.0, 0.5 + sin(colorPhase) * 0.3, 0.2);
        } else if (difference < -0.1) {
          // Right bias - cooler colors
          vColor = vec3(0.2, 0.7 + sin(colorPhase) * 0.2, 1.0);
        } else {
          // Balanced - purple/cyan gradient
          float gradientPos = sin(colorPhase) * 0.5 + 0.5;
          vColor = mix(vec3(0.6, 0.2, 0.8), vec3(0.2, 0.8, 1.0), gradientPos);
        }
        
        // Alpha based on audio activity and wave position
        vAlpha = 0.3 + averageLevel * 0.4 + abs(waveOffset) * 2.0;
        vAlpha = clamp(vAlpha, 0.0, 0.8);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        // Create soft circular particles
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        if (dist > 0.5) discard;
        
        // Soft edge falloff
        float alpha = (1.0 - dist * 2.0) * vAlpha;
        alpha = smoothstep(0.0, 0.3, alpha);
        
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  waveParticleSystem = new THREE.Points(geometry, particleMaterial);
  return waveParticleSystem;
}




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
stand.castShadow = true;     // Add this line
stand.receiveShadow = true;  // Add this line

scene.add(stand);
scene.add(sphereGroup);

// ==================== VISUALIZATION SWITCHING ====================
function switchVisualization(mode) {
  currentVisualizationMode = mode;

  // Handle chart modes - rendering on sphere instead of overlay
  if (['stereo', 'activity'].includes(mode)) {
    createSphereChart(mode);
    document.getElementById('audioDataDisplay').classList.remove('hidden');
    return;
  }

  // Remove current visualization
  sphereGroup.remove(glowingSphere);
  
  switch (mode) {
    case 'audio':
      glowingSphere = new THREE.Mesh(sphereGeometry, audioShaderMaterial);
      sphereGroup.add(glowingSphere);
      document.getElementById('audioDataDisplay').classList.remove('hidden');
      break;
      
    case 'waves':
    // Remove any existing wave particle system
    if (waveParticleSystem && sphereGroup.children.includes(waveParticleSystem)) {
      sphereGroup.remove(waveParticleSystem);
    }
    
    // Create HIGH RESOLUTION geometry for smooth wave displacement
    const highResWaveGeometry = new THREE.SphereGeometry(sphereRadius, 256, 128); // Much higher resolution
    glowingSphere = new THREE.Mesh(highResWaveGeometry, waveMaterial);
    
    // Ensure proper material settings
    glowingSphere.material.transparent = false;
    glowingSphere.material.opacity = 1.0;
    glowingSphere.material.side = THREE.DoubleSide;
    
    sphereGroup.add(glowingSphere);
    document.getElementById('audioDataDisplay').classList.remove('hidden');
    
    console.log('🌊 Enhanced waves mode activated - waves should be clearly visible');
    
    // Force immediate update to show waves
    setTimeout(() => {
      if (glowingSphere.material.uniforms) {
        glowingSphere.material.uniforms.leftAudio.value = 0.8;
        glowingSphere.material.uniforms.rightAudio.value = 0.8;
        glowingSphere.material.uniforms.averageLevel.value = 0.8;
        glowingSphere.material.uniforms.waveIntensity.value = 1.5;
        console.log('🌊 Wave uniforms initialized for immediate visibility');
      }
    }, 100);
    break;
  }
  
  updateShapeColor();
}



// ==================== DATA UPDATES ====================
function updateShapeColor() {
  // Only change colors when NOT connected to real data (demo mode)
  if (!isConnected && !isUsingRealData) {
    if (peopleCount < sphereColors.length) {
      const currentColor = new THREE.Color(sphereColors[peopleCount]);
      
      console.log(`Updating sphere color for ${peopleCount} people:`, currentColor.getHexString());
      
      // Handle different visualization modes
      switch (currentVisualizationMode) {
        case 'audio':
          // Update the baseColor uniform for audio shader
          if (glowingSphere.material.uniforms && glowingSphere.material.uniforms.baseColor) {
            glowingSphere.material.uniforms.baseColor.value.copy(currentColor);
            glowingSphere.material.uniforms.baseColor.needsUpdate = true;
          }
          break;
          
        case 'waves':
          // For wave shader, update baseColor uniform
          if (glowingSphere.material.uniforms) {
            if (!glowingSphere.material.uniforms.baseColor) {
              glowingSphere.material.uniforms.baseColor = { value: new THREE.Color() };
            }
            glowingSphere.material.uniforms.baseColor.value.copy(currentColor);
          }
          break;
          
        case 'stereo':
        case 'activity':
          // For chart modes - recreate charts with new background color
          createSphereChart(currentVisualizationMode);
          break;
          
        default:
          // For basic materials or unknown modes
          if (glowingSphere.material.color) {
            glowingSphere.material.color.copy(currentColor);
          } else if (glowingSphere.material.uniforms && glowingSphere.material.uniforms.baseColor) {
            glowingSphere.material.uniforms.baseColor.value.copy(currentColor);
          }
          break;
      }
      
      // Force material update
      glowingSphere.material.needsUpdate = true;
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


function updateVisualizationData() {
  const time = Date.now() * 0.001;
  let visualizationAudioData = audioData;
  
  // Use demo data only when both ESP32 disconnected AND not using real data
  if (!isConnected && !isUsingRealData) {
    const demoData = generateDemoVisualizationData();
    visualizationAudioData = demoData.audio;
  }

  switch (currentVisualizationMode) {
    case 'audio':
      if (glowingSphere.material.uniforms) {
        const leftMic = visualizationAudioData.leftMic || 0;
        const rightMic = visualizationAudioData.rightMic || 0;
        const difference = visualizationAudioData.difference || 0;
        const avgLevel = visualizationAudioData.averageLevel || 0;
        
        const leftLevel = Math.max(0, Math.min(1, (leftMic + 60) / 80));
        const rightLevel = Math.max(0, Math.min(1, (rightMic + 60) / 80));
        const centerMix = Math.max(0, Math.min(1, (avgLevel + 60) / 80));
        
        let audioDirection = 0;
        
        if (isConnected || isUsingRealData) {
          if (Math.abs(difference) > 2.0) {
            if (difference > 2.0) {
              audioDirection = 1.0;
            } else if (difference < -2.0) {
              audioDirection = -1.0;
            }
          }
        }
        
        glowingSphere.material.uniforms.time.value = time;
        glowingSphere.material.uniforms.leftAudio.value = leftLevel;
        glowingSphere.material.uniforms.rightAudio.value = rightLevel;
        glowingSphere.material.uniforms.centerMix.value = centerMix;
        glowingSphere.material.uniforms.audioDirection.value = audioDirection;
      }
      break;
      
    case 'waves':
      if (glowingSphere.material.uniforms) {
        glowingSphere.material.uniforms.time.value = time;
        
        // Get current audio data
        const leftMic = visualizationAudioData.leftMic || 0;
        const rightMic = visualizationAudioData.rightMic || 0;
        const difference = visualizationAudioData.difference || 0;
        const avgLevel = visualizationAudioData.averageLevel || 0;
        
        // Process for better wave visibility - use wider range
        let leftLevel = Math.max(0.4, Math.min(1, (leftMic + 20) / 60));
        let rightLevel = Math.max(0.4, Math.min(1, (rightMic + 20) / 60));
        let normalizedAvgLevel = Math.max(0.5, Math.min(1, (avgLevel + 20) / 60));
        let normalizedDifference = Math.max(-1, Math.min(1, difference / 8));
        
        // ALWAYS show waves - even in demo mode make them dramatic
        if (!isConnected && !isUsingRealData) {
          // Create strong demo waves that are clearly visible
          const leftBase = 0.8 + Math.sin(time * 1.5) * 0.2;
          const rightBase = 0.8 + Math.cos(time * 1.2) * 0.2;
          const diffBase = Math.sin(time * 0.8) * 0.6;
          
          leftLevel = Math.max(leftLevel, leftBase);
          rightLevel = Math.max(rightLevel, rightBase);
          normalizedAvgLevel = Math.max(normalizedAvgLevel, (leftBase + rightBase) / 2);
          normalizedDifference = diffBase;
          
          console.log('Demo Wave Data:', {
            left: leftLevel.toFixed(2),
            right: rightLevel.toFixed(2),
            avg: normalizedAvgLevel.toFixed(2),
            diff: normalizedDifference.toFixed(2)
          });
        }
        
        // Update all wave uniforms
        glowingSphere.material.uniforms.leftAudio.value = leftLevel;
        glowingSphere.material.uniforms.rightAudio.value = rightLevel;
        glowingSphere.material.uniforms.difference.value = normalizedDifference;
        glowingSphere.material.uniforms.averageLevel.value = normalizedAvgLevel;
        
        // Set wave parameters for visibility
        glowingSphere.material.uniforms.waveIntensity.value = 1.5; // Higher intensity
        glowingSphere.material.uniforms.waveSpeed.value = 1.2;     // Faster waves
        
        // Force material update
        glowingSphere.material.needsUpdate = true;
      }
      break;
  }
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
    
    // FORCE UPDATE CHARTS IF IN CHART MODE
    if (['stereo', 'activity'].includes(currentVisualizationMode)) {
      createSphereChart(currentVisualizationMode);
    }
    
    realDataIndex++;
  }, 150); // Faster updates for more responsive charts
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
    return {
      audio: audioData // Use real audio data only
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
  
  // Return demo data for visualization purposes only
  return {
    audio: demoAudioData
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


function connectToESP32() {
  const ip = document.getElementById('esp32IP').value;
  const wsUrl = `ws://${ip}:81`;
  
  console.log('Attempting to connect to:', wsUrl);
  
   try {
    socket = new WebSocket(wsUrl);
    
    socket.onopen = function(event) {
      isConnected = true;
      updateConnectionStatus('Connected', 'connected');
      console.log('Connected to ESP32');
    };
    
    socket.onmessage = function(event) {
      try {
        console.log('Received data:', event.data);
        const data = JSON.parse(event.data);
        
        // Handle ONLY audio data types - REMOVED CO2 handling
        if (data.leftMic !== undefined && data.rightMic !== undefined) {
          audioData = {
            leftMic: data.leftMic || 0,
            rightMic: data.rightMic || 0,
            difference: data.difference || 0,
            averageLevel: (data.leftMic + data.rightMic) / 2
          };
          updateAudioDisplay();
        }
        
        updateVisualizationData();
      } catch (e) {
        console.error('Error parsing data:', e);
      }
    };
    

    socket.onclose = function(event) {
      isConnected = false;
      updateConnectionStatus('Disconnected', 'disconnected');
      console.log('Disconnected from ESP32');
      
      // Reset displays to default when disconnected (only if not using real data)
      if (!isUsingRealData) {
        resetDisplaysToDefault();
      }
    };
    
    socket.onerror = function(error) {
      console.error('WebSocket error:', error);
      updateConnectionStatus('Connection Error', 'disconnected');
      
      // Reset displays to default on connection error (only if not using real data)
      if (!isUsingRealData) {
        resetDisplaysToDefault();
      }
    };
    
  } catch (error) {
    console.error('Failed to connect:', error);
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
  stand.castShadow = true;     // Add this line
  stand.receiveShadow = true;  // Add this line

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
setupEnhancedEnvironment();

// Start animation loop
animate();

// Initialize displays to default values
resetDisplaysToDefault();