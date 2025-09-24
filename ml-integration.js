// ml-integration.js
// ML Integration Module for Meeting Room Visualization
// Author: Dilbar Isakova

/**
 * ML Integration System
 * Handles communication with ML model server and enhances sphere visualization
 */
class MLIntegration {
    constructor() {
        this.mlSocket = null;
        this.isMLConnected = false;
        this.predictions = {};
        this.spatialAnalysis = {};
        this.predictionHistory = [];
        
        // ML visualization elements
        this.mlOverlay = null;
        this.spatialIndicators = {};
        
        // Configuration
        this.config = {
            defaultHost: 'localhost',
            defaultPort: 8765,
            reconnectInterval: 5000,
            maxReconnectAttempts: 10,
            predictionUpdateInterval: 1000
        };
        
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        
        console.log('🧠 ML Integration Module loaded');
    }
    
    /**
     * Initialize ML Integration System
     */
    async initialize() {
        try {
            this.initializeMLUI();
            this.injectMLStyles();
            this.setupEventListeners();
            console.log('✅ ML Integration initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize ML Integration:', error);
            return false;
        }
    }
    
    /**
     * Create ML insights UI panel
     */
    initializeMLUI() {
        // Remove existing panel if present
        const existingPanel = document.getElementById('mlInsightsPanel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        // Create ML insights panel
        const mlPanel = document.createElement('div');
        mlPanel.id = 'mlInsightsPanel';
        mlPanel.className = 'ml-insights-panel';
        mlPanel.innerHTML = `
            <div class="ml-panel-header">
                <h4>🧠 ML Insights</h4>
                <button class="ml-minimize-btn" id="mlMinimizeBtn">−</button>
            </div>
            
            <div class="ml-panel-content" id="mlPanelContent">
                <div class="ml-connection-status" id="mlConnectionStatus">
                    <span class="status-indicator disconnected"></span>
                    <span class="status-text">Disconnected</span>
                    <span class="connection-info" id="connectionInfo"></span>
                </div>
                
                <div class="ml-predictions" id="mlPredictions">
                    <div class="prediction-item">
                        <label>Meeting Type:</label>
                        <div class="prediction-value">
                            <span id="meetingTypePrediction">--</span>
                            <span class="confidence-text" id="meetingTypeConfidenceText">--</span>
                        </div>
                        <div class="confidence-bar">
                            <div class="confidence-fill" id="meetingTypeConfidence"></div>
                        </div>
                    </div>
                    
                    <div class="prediction-item">
                        <label>Energy Level:</label>
                        <div class="prediction-value">
                            <span id="energyLevelPrediction">--</span>
                            <span class="confidence-text" id="energyLevelConfidenceText">--</span>
                        </div>
                        <div class="confidence-bar">
                            <div class="confidence-fill" id="energyLevelConfidence"></div>
                        </div>
                    </div>
                    
                    <div class="prediction-item">
                        <label>Speaker Count:</label>
                        <div class="prediction-value">
                            <span id="speakerCountPrediction">--</span>
                            <span class="confidence-text" id="speakerCountConfidenceText">--</span>
                        </div>
                        <div class="confidence-bar">
                            <div class="confidence-fill" id="speakerCountConfidence"></div>
                        </div>
                    </div>
                    
                    <div class="prediction-item engagement-item">
                        <label>Engagement Score:</label>
                        <div class="prediction-value">
                            <span id="engagementScorePrediction">--</span>
                            <span class="engagement-label" id="engagementLabel">--</span>
                        </div>
                        <div class="engagement-meter">
                            <div class="engagement-fill" id="engagementScoreFill"></div>
                            <div class="engagement-scale">
                                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="spatial-analysis" id="spatialAnalysis">
                    <h5>🎯 Spatial Analysis</h5>
                    <div class="spatial-indicators">
                        <div class="spatial-indicator" id="leftIndicator">
                            <span class="direction-label">LEFT</span>
                            <div class="direction-bar">
                                <div class="direction-fill left-fill" id="leftFill"></div>
                            </div>
                            <span class="direction-percent" id="leftPercent">0%</span>
                        </div>
                        <div class="spatial-indicator" id="centerIndicator">
                            <span class="direction-label">CENTER</span>
                            <div class="direction-bar">
                                <div class="direction-fill center-fill" id="centerFill"></div>
                            </div>
                            <span class="direction-percent" id="centerPercent">0%</span>
                        </div>
                        <div class="spatial-indicator" id="rightIndicator">
                            <span class="direction-label">RIGHT</span>
                            <div class="direction-bar">
                                <div class="direction-fill right-fill" id="rightFill"></div>
                            </div>
                            <span class="direction-percent" id="rightPercent">0%</span>
                        </div>
                    </div>
                    <div class="dominant-side" id="dominantSide">
                        <strong>Dominant: <span id="dominantDirection">--</span></strong>
                        <div class="speaker-switches">
                            Switches: <span id="speakerSwitches">0</span>
                        </div>
                    </div>
                </div>
                
                <div class="ml-controls">
                    <button id="connectMLBtn" class="ml-btn primary">🔌 Connect ML Server</button>
                    <button id="requestPredictionBtn" class="ml-btn secondary" disabled>🧠 Get Insights</button>
                </div>
                
                <div class="ml-stats" id="mlStats">
                    <div class="stat-item">
                        <span class="stat-label">Predictions:</span>
                        <span class="stat-value" id="predictionCount">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Buffer:</span>
                        <span class="stat-value" id="bufferSize">0</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(mlPanel);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Connect button
        const connectBtn = document.getElementById('connectMLBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.handleConnectClick());
        }
        
        // Request prediction button
        const requestBtn = document.getElementById('requestPredictionBtn');
        if (requestBtn) {
            requestBtn.addEventListener('click', () => this.requestPrediction());
        }
        
        // Minimize button
        const minimizeBtn = document.getElementById('mlMinimizeBtn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.togglePanel());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault();
                this.togglePanel();
            }
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                this.requestPrediction();
            }
        });
    }
    
    /**
     * Handle connect button click
     */
    handleConnectClick() {
        if (this.isMLConnected) {
            this.disconnect();
        } else {
            // Show connection dialog
            this.showConnectionDialog();
        }
    }
    
    /**
     * Show connection configuration dialog
     */
    showConnectionDialog() {
        const host = prompt('ML Server Host:', this.config.defaultHost);
        const port = prompt('ML Server Port:', this.config.defaultPort);
        
        if (host && port) {
            this.connectToMLServer(host, parseInt(port));
        }
    }
    
    /**
     * Connect to ML server
     */
    connectToMLServer(host = this.config.defaultHost, port = this.config.defaultPort) {
        const wsUrl = `ws://${host}:${port}`;
        console.log('🔌 Connecting to ML server:', wsUrl);
        
        this.updateMLConnectionStatus('Connecting...', 'connecting', `${host}:${port}`);
        
        try {
            // Close existing connection
            if (this.mlSocket) {
                this.mlSocket.close();
            }
            
            this.mlSocket = new WebSocket(wsUrl);
            
            this.mlSocket.onopen = () => {
                this.handleMLConnection(host, port);
            };
            
            this.mlSocket.onmessage = (event) => {
                this.handleMLMessage(event);
            };
            
            this.mlSocket.onclose = (event) => {
                this.handleMLDisconnection(event);
            };
            
            this.mlSocket.onerror = (error) => {
                this.handleMLError(error);
            };
            
        } catch (error) {
            console.error('❌ Failed to connect to ML server:', error);
            this.updateMLConnectionStatus('Failed', 'error', error.message);
        }
    }
    
    /**
     * Handle successful ML connection
     */
    handleMLConnection(host, port) {
        this.isMLConnected = true;
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        
        this.updateMLConnectionStatus('Connected', 'connected', `${host}:${port}`);
        console.log('✅ Connected to ML server');
        
        // Update UI
        document.getElementById('connectMLBtn').textContent = '🔌 Disconnect';
        document.getElementById('requestPredictionBtn').disabled = false;
        
        // Start sending audio data
        this.startMLDataStreaming();
    }
    
    /**
     * Handle ML disconnection
     */
    handleMLDisconnection(event) {
        this.isMLConnected = false;
        this.updateMLConnectionStatus('Disconnected', 'disconnected', 
            event.reason || 'Connection closed');
        console.log('🔴 ML server connection closed');
        
        // Update UI
        document.getElementById('connectMLBtn').textContent = '🔌 Connect ML Server';
        document.getElementById('requestPredictionBtn').disabled = true;
        
        // Attempt reconnection
        this.attemptReconnection();
    }
    
    /**
     * Handle ML connection error
     */
    handleMLError(error) {
        console.error('❌ ML server connection error:', error);
        this.updateMLConnectionStatus('Error', 'error', 'Connection failed');
    }
    
    /**
     * Attempt automatic reconnection
     */
    attemptReconnection() {
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
            
            this.reconnectTimer = setTimeout(() => {
                this.connectToMLServer();
            }, this.config.reconnectInterval);
        } else {
            console.log('❌ Max reconnection attempts reached');
        }
    }
    
    /**
     * Disconnect from ML server
     */
    disconnect() {
        if (this.mlSocket) {
            this.mlSocket.close();
        }
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.reconnectAttempts = 0;
    }
    
    /**
     * Update ML connection status display
     */
    updateMLConnectionStatus(status, className, info = '') {
        const statusEl = document.getElementById('mlConnectionStatus');
        if (!statusEl) return;
        
        const indicator = statusEl.querySelector('.status-indicator');
        const statusText = statusEl.querySelector('.status-text');
        const infoEl = statusEl.querySelector('.connection-info');
        
        if (indicator) {
            indicator.className = `status-indicator ${className}`;
        }
        if (statusText) {
            statusText.textContent = status;
        }
        if (infoEl && info) {
            infoEl.textContent = info;
        }
    }
    
    /**
     * Start streaming audio data to ML server
     */
    startMLDataStreaming() {
        // Hook into existing WebSocket message handler
        if (typeof socket !== 'undefined' && socket) {
            const originalOnMessage = socket.onmessage;
            
            socket.onmessage = (event) => {
                // Call original handler first
                if (originalOnMessage) {
                    originalOnMessage.call(socket, event);
                }
                
                // Forward to ML server
                this.forwardAudioDataToML(event);
            };
        } else {
            console.warn('⚠️ Main WebSocket not available for data streaming');
        }
    }
    
    /**
     * Forward audio data to ML server
     */
    forwardAudioDataToML(event) {
        if (!this.isMLConnected || this.mlSocket.readyState !== WebSocket.OPEN) {
            return;
        }
        
        try {
            const data = JSON.parse(event.data);
            
            // Forward audio data to ML server
            const mlMessage = {
                type: 'audio_data',
                leftMic: data.leftMic || 0,
                rightMic: data.rightMic || 0,
                difference: data.difference || 0,
                averageLevel: data.averageLevel || ((data.leftMic || 0) + (data.rightMic || 0)) / 2,
                timestamp: data.timestamp || Date.now()
            };
            
            this.mlSocket.send(JSON.stringify(mlMessage));
        } catch (e) {
            console.error('❌ Error forwarding to ML server:', e);
        }
    }
    
    /**
     * Handle ML server messages
     */
    handleMLMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'ml_predictions') {
                this.handleMLPredictions(data);
            } else if (data.type === 'error') {
                console.error('ML Server Error:', data.message);
            }
        } catch (e) {
            console.error('❌ Error parsing ML message:', e);
        }
    }
    
    /**
     * Handle ML predictions
     */
    handleMLPredictions(data) {
        console.log('📊 Received ML predictions:', data);
        
        this.predictions = data.predictions || {};
        this.spatialAnalysis = data.spatial_analysis || {};
        this.predictionHistory.push(data);
        
        // Keep only last 50 predictions
        if (this.predictionHistory.length > 50) {
            this.predictionHistory.shift();
        }
        
        // Update UI
        this.updatePredictionUI();
        this.updateSpatialUI();
        this.updateStats(data);
        
        // Update sphere visualization
        this.updateSphereWithMLData();
        
        // Trigger custom event for other modules
        this.dispatchMLEvent('predictions', data);
    }
    
    /**
     * Update prediction UI elements
     */
    updatePredictionUI() {
        // Meeting Type
        this.updatePredictionItem('meetingType', this.predictions.meeting_type);
        
        // Energy Level
        this.updatePredictionItem('energyLevel', this.predictions.energy_level);
        
        // Speaker Count
        this.updatePredictionItem('speakerCount', this.predictions.speaker_count);
        
        // Engagement Score
        this.updateEngagementScore(this.predictions.engagement_score);
    }
    
    /**
     * Update individual prediction item
     */
    updatePredictionItem(itemName, prediction) {
        if (!prediction) return;
        
        const predictionEl = document.getElementById(`${itemName}Prediction`);
        const confidenceEl = document.getElementById(`${itemName}Confidence`);
        const confidenceTextEl = document.getElementById(`${itemName}ConfidenceText`);
        
        if (predictionEl) {
            predictionEl.textContent = prediction.value || 'Unknown';
        }
        
        if (confidenceEl && confidenceTextEl) {
            const confidence = (prediction.confidence || 0) * 100;
            confidenceEl.style.width = `${confidence}%`;
            confidenceEl.className = `confidence-fill ${this.getConfidenceClass(confidence)}`;
            confidenceTextEl.textContent = `${confidence.toFixed(1)}%`;
        }
    }
    
    /**
     * Update engagement score display
     */
    updateEngagementScore(engagement) {
        if (!engagement) return;
        
        const score = engagement.value || 0;
        const predictionEl = document.getElementById('engagementScorePrediction');
        const fillEl = document.getElementById('engagementScoreFill');
        const labelEl = document.getElementById('engagementLabel');
        
        if (predictionEl) {
            predictionEl.textContent = `${score.toFixed(1)}/100`;
        }
        
        if (fillEl) {
            fillEl.style.width = `${score}%`;
            fillEl.className = `engagement-fill ${this.getEngagementClass(score)}`;
        }
        
        if (labelEl) {
            labelEl.textContent = this.getEngagementLabel(score);
        }
    }
    
    /**
     * Update spatial analysis UI
     */
    updateSpatialUI() {
        if (!this.spatialAnalysis) return;
        
        const leftPct = this.spatialAnalysis.left_dominance_pct || 0;
        const rightPct = this.spatialAnalysis.right_dominance_pct || 0;
        const centerPct = this.spatialAnalysis.center_pct || 0;
        const switches = this.spatialAnalysis.speaker_switches || 0;
        
        // Update bars and percentages
        this.updateSpatialBar('left', leftPct);
        this.updateSpatialBar('center', centerPct);
        this.updateSpatialBar('right', rightPct);
        
        // Update dominant side
        const dominantSide = this.spatialAnalysis.dominant_side || 'center';
        const dominantEl = document.getElementById('dominantDirection');
        const switchesEl = document.getElementById('speakerSwitches');
        
        if (dominantEl) {
            dominantEl.textContent = dominantSide.toUpperCase();
        }
        if (switchesEl) {
            switchesEl.textContent = switches;
        }
        
        // Update dominant side styling
        const dominantContainer = document.getElementById('dominantSide');
        if (dominantContainer) {
            dominantContainer.className = `dominant-side ${dominantSide}`;
        }
    }
    
    /**
     * Update spatial bar
     */
    updateSpatialBar(direction, percentage) {
        const fillEl = document.getElementById(`${direction}Fill`);
        const percentEl = document.getElementById(`${direction}Percent`);
        
        if (fillEl) {
            fillEl.style.width = `${percentage}%`;
        }
        if (percentEl) {
            percentEl.textContent = `${percentage.toFixed(1)}%`;
        }
    }
    
    /**
     * Update statistics display
     */
    updateStats(data) {
        const predictionCountEl = document.getElementById('predictionCount');
        const bufferSizeEl = document.getElementById('bufferSize');
        
        if (predictionCountEl) {
            predictionCountEl.textContent = this.predictionHistory.length;
        }
        if (bufferSizeEl) {
            bufferSizeEl.textContent = data.buffer_size || 0;
        }
    }
    
    /**
     * Update sphere visualization with ML data
     */
    updateSphereWithMLData() {
        // Only update if we have the necessary objects from main.js
        if (typeof audioShaderMaterial === 'undefined' || typeof THREE === 'undefined') {
            return;
        }
        
        this.updateSphereColor();
        this.updateSphereEffects();
        this.updateSpatialIndicators();
    }
    
    /**
     * Update sphere color based on ML predictions
     */
    updateSphereColor() {
        const meetingType = this.predictions.meeting_type?.value;
        let baseColor = new THREE.Color(0x53c566); // Default green
        let hue = 0.3; // Default hue for HSL
        
        switch (meetingType) {
            case 'discussion':
                baseColor = new THREE.Color(0x53c566); // Green
                hue = 0.3;
                break;
            case 'presentation':
                baseColor = new THREE.Color(0x3366ff); // Blue
                hue = 0.67;
                break;
            case 'brainstorm':
                baseColor = new THREE.Color(0xff8800); // Orange
                hue = 0.08;
                break;
            case 'argument':
                baseColor = new THREE.Color(0xff4444); // Red
                hue = 0.0;
                break;
        }
        
        // Update shader uniforms if available
        if (audioShaderMaterial && audioShaderMaterial.uniforms) {
            if (audioShaderMaterial.uniforms.baseColor) {
                audioShaderMaterial.uniforms.baseColor.value = baseColor;
            }
            if (audioShaderMaterial.uniforms.meetingTypeHue) {
                audioShaderMaterial.uniforms.meetingTypeHue.value = hue;
            }
        }
    }
    
    /**
     * Update sphere effects based on energy and engagement
     */
    updateSphereEffects() {
        const energyLevel = this.predictions.energy_level?.value;
        const engagementScore = this.predictions.engagement_score?.value || 50;
        
        let intensity = 1.0;
        switch (energyLevel) {
            case 'low': intensity = 0.6; break;
            case 'medium': intensity = 1.0; break;
            case 'high': intensity = 1.4; break;
        }
        
        const pulseSpeed = 1.0 + (engagementScore / 100) * 2.0;
        
        // Update shader uniforms if available
        if (audioShaderMaterial && audioShaderMaterial.uniforms) {
            if (audioShaderMaterial.uniforms.energyIntensity) {
                audioShaderMaterial.uniforms.energyIntensity.value = intensity;
            }
            if (audioShaderMaterial.uniforms.pulseSpeed) {
                audioShaderMaterial.uniforms.pulseSpeed.value = pulseSpeed;
            }
            if (audioShaderMaterial.uniforms.engagementScore) {
                audioShaderMaterial.uniforms.engagementScore.value = engagementScore;
            }
        }
    }
    
    /**
     * Update spatial indicators on sphere
     */
    updateSpatialIndicators() {
        this.clearSpatialIndicators();
        
        if (!this.spatialAnalysis.dominant_side || typeof THREE === 'undefined' || typeof scene === 'undefined') {
            return;
        }
        
        const leftPct = this.spatialAnalysis.left_dominance_pct || 0;
        const rightPct = this.spatialAnalysis.right_dominance_pct || 0;
        
        // Create indicators for significant dominance
        if (leftPct > 30) {
            this.createSpatialIndicator('left', leftPct);
        }
        if (rightPct > 30) {
            this.createSpatialIndicator('right', rightPct);
        }
    }
    
    /**
     * Create 3D spatial indicator
     */
    createSpatialIndicator(side, intensity) {
        if (typeof THREE === 'undefined' || typeof scene === 'undefined') {
            return;
        }
        
        try {
            const arrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
            const arrowMaterial = new THREE.MeshBasicMaterial({
                color: side === 'left' ? 0xff3333 : 0x3333ff,
                transparent: true,
                opacity: 0.7
            });
            
            const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
            
            // Position arrow
            const x = side === 'left' ? -1.2 : 1.2;
            arrow.position.set(x, 0, 0);
            arrow.rotation.z = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
            
            // Scale based on intensity
            const scale = 0.5 + (intensity / 100) * 0.5;
            arrow.scale.setScalar(scale);
            
            // Add animation data
            arrow.userData = { 
                pulseSpeed: 2 + (intensity / 50), 
                originalScale: scale,
                side: side
            };
            
            scene.add(arrow);
            this.spatialIndicators[side] = arrow;
        } catch (error) {
            console.error('Error creating spatial indicator:', error);
        }
    }
    
    /**
     * Clear spatial indicators
     */
    clearSpatialIndicators() {
        Object.values(this.spatialIndicators).forEach(indicator => {
            if (typeof scene !== 'undefined') {
                scene.remove(indicator);
            }
            if (indicator.geometry) indicator.geometry.dispose();
            if (indicator.material) indicator.material.dispose();
        });
        this.spatialIndicators = {};
    }
    
    /**
     * Animate spatial indicators
     */
    animateSpatialIndicators() {
        Object.values(this.spatialIndicators).forEach(indicator => {
            if (indicator.userData) {
                const time = Date.now() * 0.001;
                const pulse = Math.sin(time * indicator.userData.pulseSpeed) * 0.2 + 1.0;
                indicator.scale.setScalar(indicator.userData.originalScale * pulse);
            }
        });
    }
    
    /**
     * Toggle panel minimize/maximize
     */
    togglePanel() {
        const panel = document.getElementById('mlPanelContent');
        const btn = document.getElementById('mlMinimizeBtn');
        
        if (panel && btn) {
            const isMinimized = panel.style.display === 'none';
            panel.style.display = isMinimized ? 'block' : 'none';
            btn.textContent = isMinimized ? '−' : '+';
        }
    }
    
    /**
     * Request immediate prediction
     */
    requestPrediction() {
        if (this.isMLConnected && this.mlSocket.readyState === WebSocket.OPEN) {
            const message = { type: 'request_prediction' };
            this.mlSocket.send(JSON.stringify(message));
            console.log('🧠 Requested immediate prediction');
        } else {
            console.warn('⚠️ ML server not connected');
        }
    }
    
    /**
     * Dispatch custom ML event
     */
    dispatchMLEvent(eventType, data) {
        const event = new CustomEvent('ml-prediction', {
            detail: { type: eventType, data: data }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Get confidence class for styling
     */
    getConfidenceClass(confidence) {
        if (confidence > 80) return 'high-confidence';
        if (confidence > 60) return 'medium-confidence';
        return 'low-confidence';
    }
    
    /**
     * Get engagement class for styling
     */
    getEngagementClass(score) {
        if (score > 75) return 'high-engagement';
        if (score > 50) return 'medium-engagement';
        if (score > 25) return 'low-engagement';
        return 'very-low-engagement';
    }
    
    /**
     * Get engagement label
     */
    getEngagementLabel(score) {
        if (score > 75) return 'Highly Engaged';
        if (score > 50) return 'Engaged';
        if (score > 25) return 'Moderately Engaged';
        return 'Low Engagement';
    }
    
    /**
     * Inject CSS styles for ML UI
     */
    injectMLStyles() {
        const styleId = 'ml-integration-styles';
        
        // Remove existing styles
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .ml-insights-panel {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 340px;
                max-height: 90vh;
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #444;
                border-radius: 12px;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                font-size: 13px;
                z-index: 1000;
                backdrop-filter: blur(15px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                overflow: hidden;
            }
            
            .ml-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: rgba(76, 175, 80, 0.1);
                border-bottom: 1px solid #444;
            }
            
            .ml-panel-header h4 {
                margin: 0;
                color: #4CAF50;
                font-size: 16px;
                font-weight: 600;
            }
            
            .ml-minimize-btn {
                background: none;
                border: none;
                color: #ccc;
                font-size: 18px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            
            .ml-minimize-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }
            
            .ml-panel-content {
                padding: 15px;
                max-height: calc(90vh - 60px);
                overflow-y: auto;
            }
            
            .ml-connection-status {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                font-size: 12px;
            }
            
            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 8px;
                animation: pulse 2s infinite;
            }
            
            .status-indicator.connected { 
                background: #4CAF50;
                box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
            }
            .status-indicator.disconnected { 
                background: #757575;
                animation: none;
            }
            .status-indicator.connecting { 
                background: #FF9800;
                animation: pulse 0.5s infinite;
            }
            .status-indicator.error { 
                background: #f44336;
                animation: pulse 1s infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            .status-text {
                font-weight: 500;
                margin-right: 8px;
            }
            
            .connection-info {
                color: #aaa;
                font-size: 11px;
            }
            
            .ml-predictions {
                margin-bottom: 20px;
            }
            
            .prediction-item {
                margin-bottom: 16px;
                padding: 12px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 8px;
                border-left: 3px solid transparent;
                transition: all 0.3s ease;
            }
            
            .prediction-item:hover {
                background: rgba(255, 255, 255, 0.06);
            }
            
            .prediction-item.engagement-item {
                border-left-color: #4CAF50;
            }
            
            .prediction-item label {
                display: block;
                font-weight: 600;
                margin-bottom: 6px;
                color: #E0E0E0;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .prediction-value {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
            }
            
            .prediction-value span:first-child {
                font-size: 15px;
                font-weight: 600;
                color: white;
            }
            
            .confidence-text {
                font-size: 11px;
                color: #aaa;
            }
            
            .engagement-label {
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 10px;
                color: white;
                font-weight: 500;
            }
            
            .confidence-bar {
                width: 100%;
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
            }
            
            .confidence-fill {
                height: 100%;
                border-radius: 3px;
                transition: width 0.5s ease;
                position: relative;
            }
            
            .confidence-fill.high-confidence { 
                background: linear-gradient(90deg, #4CAF50, #66BB6A);
            }
            .confidence-fill.medium-confidence { 
                background: linear-gradient(90deg, #FF9800, #FFB74D);
            }
            .confidence-fill.low-confidence { 
                background: linear-gradient(90deg, #f44336, #EF5350);
            }
            
            .engagement-meter {
                position: relative;
                width: 100%;
                height: 16px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                overflow: hidden;
                margin-top: 6px;
            }
            
            .engagement-fill {
                height: 100%;
                border-radius: 8px;
                transition: width 0.5s ease;
                position: relative;
            }
            
            .engagement-fill.very-low-engagement { 
                background: linear-gradient(90deg, #f44336, #E57373);
            }
            .engagement-fill.low-engagement { 
                background: linear-gradient(90deg, #FF5722, #FF8A65);
            }
            .engagement-fill.medium-engagement { 
                background: linear-gradient(90deg, #FF9800, #FFB74D);
            }
            .engagement-fill.high-engagement { 
                background: linear-gradient(90deg, #4CAF50, #81C784);
            }
            
            .engagement-scale {
                position: absolute;
                top: 20px;
                left: 0;
                right: 0;
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                color: #888;
            }
            
            .spatial-analysis {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #444;
            }
            
            .spatial-analysis h5 {
                margin: 0 0 12px 0;
                color: #4CAF50;
                font-size: 14px;
                font-weight: 600;
            }
            
            .spatial-indicators {
                margin-bottom: 12px;
            }
            
            .spatial-indicator {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                font-size: 11px;
            }
            
            .direction-label {
                width: 55px;
                font-weight: 600;
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .direction-bar {
                flex: 1;
                margin: 0 10px;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .direction-fill {
                height: 100%;
                border-radius: 4px;
                transition: width 0.4s ease;
            }
            
            .left-fill {
                background: linear-gradient(90deg, #f44336, #FF5722);
            }
            
            .center-fill {
                background: linear-gradient(90deg, #4CAF50, #66BB6A);
            }
            
            .right-fill {
                background: linear-gradient(90deg, #2196F3, #42A5F5);
            }
            
            .direction-percent {
                width: 35px;
                text-align: right;
                font-size: 10px;
                font-weight: 500;
                color: #ccc;
            }
            
            .dominant-side {
                text-align: center;
                padding: 10px;
                border-radius: 8px;
                font-size: 12px;
                margin-bottom: 10px;
                transition: all 0.3s ease;
            }
            
            .dominant-side.left { 
                background: rgba(244, 67, 54, 0.15);
                border: 1px solid rgba(244, 67, 54, 0.3);
            }
            .dominant-side.right { 
                background: rgba(33, 150, 243, 0.15);
                border: 1px solid rgba(33, 150, 243, 0.3);
            }
            .dominant-side.center { 
                background: rgba(76, 175, 80, 0.15);
                border: 1px solid rgba(76, 175, 80, 0.3);
            }
            
            .speaker-switches {
                font-size: 11px;
                color: #aaa;
                margin-top: 4px;
            }
            
            .ml-controls {
                display: flex;
                gap: 8px;
                margin: 15px 0;
            }
            
            .ml-btn {
                flex: 1;
                padding: 10px 12px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .ml-btn.primary {
                background: #2196F3;
                color: white;
            }
            
            .ml-btn.primary:hover {
                background: #1976D2;
                transform: translateY(-1px);
            }
            
            .ml-btn.secondary {
                background: rgba(255, 255, 255, 0.1);
                color: #ccc;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .ml-btn.secondary:hover:not(:disabled) {
                background: rgba(255, 255, 255, 0.15);
                color: white;
            }
            
            .ml-btn:disabled {
                background: rgba(255, 255, 255, 0.05);
                color: #666;
                cursor: not-allowed;
                transform: none;
            }
            
            .ml-stats {
                display: flex;
                justify-content: space-between;
                padding: 10px 12px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 6px;
                font-size: 11px;
            }
            
            .stat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
            }
            
            .stat-label {
                color: #aaa;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .stat-value {
                color: white;
                font-weight: 600;
                font-size: 14px;
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .ml-insights-panel {
                    width: 300px;
                    right: 5px;
                    top: 5px;
                }
            }
            
            /* Custom scrollbar */
            .ml-panel-content::-webkit-scrollbar {
                width: 6px;
            }
            
            .ml-panel-content::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
            }
            
            .ml-panel-content::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
            }
            
            .ml-panel-content::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Get current predictions (public API)
     */
    getPredictions() {
        return this.predictions;
    }
    
    /**
     * Get current spatial analysis (public API)
     */
    getSpatialAnalysis() {
        return this.spatialAnalysis;
    }
    
    /**
     * Get prediction history (public API)
     */
    getPredictionHistory() {
        return this.predictionHistory;
    }
    
    /**
     * Check if ML server is connected (public API)
     */
    isConnected() {
        return this.isMLConnected;
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.disconnect();
        this.clearSpatialIndicators();
        
        const panel = document.getElementById('mlInsightsPanel');
        if (panel) {
            panel.remove();
        }
        
        const styles = document.getElementById('ml-integration-styles');
        if (styles) {
            styles.remove();
        }
        
        console.log('🧠 ML Integration destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MLIntegration;
}

// Global instance for direct access
window.MLIntegration = MLIntegration;