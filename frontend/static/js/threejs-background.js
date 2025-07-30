// AI Job Chommie - Three.js Background Module
// Handles 3D background animations and effects

let scene, camera, renderer, particles, torus, octa;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Initialize Three.js background
function initializeThreeJSBackground() {
    const heroContainer = document.querySelector('.hero-container');
    if (!heroContainer) {
        console.warn('Hero container not found, skipping Three.js');
        return;
    }
    
    if (typeof THREE === 'undefined') {
        console.warn('Three.js not loaded, skipping 3D background');
        return;
    }
    
    try {
        console.log('Initializing Three.js background...');
        
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.style.position = 'fixed';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '-1';
        renderer.domElement.style.pointerEvents = 'none';
        
        // Add to hero container
        heroContainer.appendChild(renderer.domElement);
        
        // Create particles
        createParticles();
        
        // Create geometric shapes
        createGeometricShapes();
        
        // Position camera
        camera.position.z = 100;
        
        // Start animation loop
        animate();
        
        console.log('Three.js background initialized');
    } catch (error) {
        console.warn('Three.js initialization error (non-critical):', error);
    }
}

// Create particle system
function createParticles() {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 400;
        positions[i + 1] = (Math.random() - 0.5) * 400;
        positions[i + 2] = (Math.random() - 0.5) * 400;
        
        // Cyberpunk colors
        const colorChoice = Math.random();
        if (colorChoice < 0.33) {
            colors[i] = 0; colors[i + 1] = 1; colors[i + 2] = 1; // Cyan
        } else if (colorChoice < 0.66) {
            colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1; // Magenta
        } else {
            colors[i] = 1; colors[i + 1] = 1; colors[i + 2] = 0; // Yellow
        }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// Create geometric shapes
function createGeometricShapes() {
    // Create torus
    const torusGeometry = new THREE.TorusGeometry(40, 15, 8, 32);
    const torusMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.position.set(-50, 0, -50);
    scene.add(torus);
    
    // Create octahedron
    const octaGeometry = new THREE.OctahedronGeometry(30);
    const octaMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        wireframe: true,
        transparent: true,
        opacity: 0.4
    });
    octa = new THREE.Mesh(octaGeometry, octaMaterial);
    octa.position.set(50, 30, -80);
    scene.add(octa);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (!scene || !camera || !renderer) return;
    
    // Rotate particles
    if (particles) {
        particles.rotation.x += 0.001;
        particles.rotation.y += 0.002;
    }
    
    // Rotate geometric shapes
    if (torus) {
        torus.rotation.x += 0.01;
        torus.rotation.y += 0.01;
    }
    
    if (octa) {
        octa.rotation.x -= 0.005;
        octa.rotation.y += 0.008;
    }
    
    // Mouse interaction
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
}

// Mouse move handler
function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.1;
    mouseY = (event.clientY - windowHalfY) * 0.1;
}

// Window resize handler
function onWindowResize() {
    if (!camera || !renderer) return;
    
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Event listeners
document.addEventListener('mousemove', onDocumentMouseMove, false);
window.addEventListener('resize', onWindowResize, false);

// Export Three.js functions
window.ThreeJSBackground = {
    initializeThreeJSBackground,
    onWindowResize
};