// init.js - Initialization script for loading and help system

// Initialize loading screen and help system
document.addEventListener('DOMContentLoaded', function() {
    // Loading screen functionality
    initializeLoadingScreen();
    
    // Help system functionality
    initializeHelpSystem();
    
    console.log('✅ Initialization script loaded');
});

/**
 * Initialize loading screen with progress simulation
 */
function initializeLoadingScreen() {
    const progressBar = document.getElementById('progressBar');
    const loadingStatus = document.getElementById('loadingStatus');
    const loadingScreen = document.getElementById('loadingScreen');
    
    if (!progressBar || !loadingStatus || !loadingScreen) {
        console.warn('⚠️ Loading screen elements not found');
        return;
    }
    
    let progress = 0;
    const loadingSteps = [
        'Loading Three.js...',
        'Initializing 3D Scene...',
        'Setting up Audio System...',
        'Loading ML Integration...',
        'Connecting to ESP32...',
        'Finalizing Setup...'
    ];
    
    function updateProgress() {
        if (progress < 100) {
            // Simulate realistic loading with variable increments
            const increment = Math.random() * 20 + 5; // 5-25% increments
            progress = Math.min(progress + increment, 100);
            
            // Update progress bar
            progressBar.style.width = progress + '%';
            
            // Update status text based on progress
            const stepIndex = Math.floor((progress / 100) * loadingSteps.length);
            if (stepIndex < loadingSteps.length) {
                loadingStatus.textContent = loadingSteps[stepIndex];
            }
            
            // Continue loading with realistic timing
            const delay = 200 + Math.random() * 300; // 200-500ms delays
            setTimeout(updateProgress, delay);
        } else {
            // Loading complete
            loadingStatus.textContent = 'Ready!';
            
            // Hide loading screen after a brief delay
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 800);
        }
    }
    
    // Start loading simulation
    setTimeout(updateProgress, 500);
}

/**
 * Initialize help system
 */
function initializeHelpSystem() {
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const helpClose = document.getElementById('helpClose');
    
    if (!helpBtn || !helpModal || !helpClose) {
        console.warn('⚠️ Help system elements not found');
        return;
    }
    
    function showHelp() {
        helpModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        console.log('📖 Help modal opened');
    }
    
    function hideHelp() {
        helpModal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scrolling
        console.log('📖 Help modal closed');
    }
    
    // Event listeners
    helpBtn.addEventListener('click', showHelp);
    helpClose.addEventListener('click', hideHelp);
    
    // Close help when clicking outside the modal content
    helpModal.addEventListener('click', function(e) {
        if (e.target === helpModal) {
            hideHelp();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // F1 key for help
        if (e.key === 'F1') {
            e.preventDefault();
            if (helpModal.classList.contains('hidden')) {
                showHelp();
            } else {
                hideHelp();
            }
        }
        
        // Escape key to close help
        if (e.key === 'Escape' && !helpModal.classList.contains('hidden')) {
            hideHelp();
        }
    });
    
    console.log('✅ Help system initialized');
}

/**
 * Check if all required scripts are loaded
 */
function checkScriptDependencies() {
    const dependencies = [
        { name: 'Three.js', check: () => typeof THREE !== 'undefined' },
        { name: 'Chart.js', check: () => typeof Chart !== 'undefined' },
        { name: 'ML Integration', check: () => typeof MLIntegration !== 'undefined' }
    ];
    
    const missing = dependencies.filter(dep => !dep.check());
    
    if (missing.length > 0) {
        console.warn('⚠️ Missing dependencies:', missing.map(d => d.name).join(', '));
        
        // Show warning to user
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff9800;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            z-index: 10001;
            font-weight: 500;
        `;
        warningDiv.textContent = `Warning: Missing dependencies - ${missing.map(d => d.name).join(', ')}`;
        document.body.appendChild(warningDiv);
        
        // Auto-remove warning after 5 seconds
        setTimeout(() => {
            if (warningDiv.parentNode) {
                warningDiv.parentNode.removeChild(warningDiv);
            }
        }, 5000);
        
        return false;
    }
    
    console.log('✅ All script dependencies loaded');
    return true;
}

/**
 * Initialize performance monitoring
 */
function initializePerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', function() {
        if (performance && performance.timing) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`📊 Page load time: ${loadTime}ms`);
            
            // Log performance metrics
            const metrics = {
                'DNS Lookup': performance.timing.domainLookupEnd - performance.timing.domainLookupStart,
                'TCP Connection': performance.timing.connectEnd - performance.timing.connectStart,
                'DOM Ready': performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                'Page Load': loadTime
            };
            
            console.table(metrics);
        }
    });
    
    // Monitor memory usage (if available)
    if (performance && performance.memory) {
        setInterval(() => {
            const memory = performance.memory;
            const memoryInfo = {
                'Used': Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
                'Total': Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
                'Limit': Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
            };
            
            // Only log if memory usage is high
            const usagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            if (usagePercent > 0.8) {
                console.warn('⚠️ High memory usage:', memoryInfo);
            }
        }, 30000); // Check every 30 seconds
    }
}

/**
 * Setup error handling
 */
function setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', function(event) {
        console.error('🚨 Global Error:', event.error);
        
        // Show user-friendly error message for critical errors
        if (event.error && event.error.message) {
            const isCritical = event.error.message.includes('THREE') || 
                             event.error.message.includes('ML') ||
                             event.error.message.includes('WebSocket');
            
            if (isCritical) {
                showErrorNotification('A critical error occurred. Please refresh the page.');
            }
        }
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
        console.error('🚨 Unhandled Promise Rejection:', event.reason);
        
        // Prevent the error from appearing in console (optional)
        // event.preventDefault();
    });
}

/**
 * Show error notification to user
 */
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10002;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
        font-weight: 500;
    `;
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>⚠️ ${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 10000);
}

/**
 * Setup browser compatibility checks
 */
function checkBrowserCompatibility() {
    const requiredFeatures = [
        { name: 'WebGL', check: () => !!window.WebGLRenderingContext },
        { name: 'WebSocket', check: () => !!window.WebSocket },
        { name: 'Canvas', check: () => !!document.createElement('canvas').getContext },
        { name: 'ES6', check: () => {
            try {
                new Function('(a = 0) => a');
                return true;
            } catch (err) {
                return false;
            }
        }}
    ];
    
    const unsupported = requiredFeatures.filter(feature => !feature.check());
    
    if (unsupported.length > 0) {
        const message = `Your browser doesn't support: ${unsupported.map(f => f.name).join(', ')}. Please use a modern browser.`;
        console.error('❌ Browser compatibility issues:', unsupported);
        showErrorNotification(message);
        return false;
    }
    
    console.log('✅ Browser compatibility check passed');
    return true;
}

/**
 * Initialize debug helpers
 */
function initializeDebugHelpers() {
    // Only in development/debug mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Add debug info to console
        console.log(`
🎛️ Meeting Room Visualization Debug Info
==========================================
Environment: Development
User Agent: ${navigator.userAgent}
Screen: ${screen.width}x${screen.height}
Viewport: ${window.innerWidth}x${window.innerHeight}
WebGL: ${!!window.WebGLRenderingContext ? 'Supported' : 'Not Supported'}
WebSocket: ${!!window.WebSocket ? 'Supported' : 'Not Supported'}
==========================================
        `);
        
        // Global debug functions
        window.debugInfo = function() {
            return {
                performance: performance.timing,
                memory: performance.memory,
                screen: { width: screen.width, height: screen.height },
                viewport: { width: window.innerWidth, height: window.innerHeight },
                userAgent: navigator.userAgent
            };
        };
        
        window.clearCache = function() {
            localStorage.clear();
            sessionStorage.clear();
            console.log('🧹 Cache cleared');
        };
    }
}

// Initialize all systems when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting initialization sequence...');
    
    // Check browser compatibility first
    if (!checkBrowserCompatibility()) {
        return; // Stop initialization if browser is incompatible
    }
    
    // Setup error handling
    setupErrorHandling();
    
    // Initialize performance monitoring
    initializePerformanceMonitoring();
    
    // Initialize debug helpers
    initializeDebugHelpers();
    
    // Check script dependencies after a brief delay
    setTimeout(() => {
        checkScriptDependencies();
    }, 1000);
    
    console.log('✅ Initialization sequence complete');
});