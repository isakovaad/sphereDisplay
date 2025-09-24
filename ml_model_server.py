#!/usr/bin/env python3
"""
ML Model Integration Server
Provides real-time ML predictions via WebSocket for spherical visualization
Compatible with trained meeting room ML models

Usage:
    python ml_model_server.py --models-dir ./trained_models --host localhost --port 8765

Requirements:
    pip install asyncio websockets numpy pandas scikit-learn
"""

import asyncio
import websockets
import json
import numpy as np
import pandas as pd
import pickle
from pathlib import Path
from datetime import datetime, timedelta
from collections import deque
import time
import threading
from typing import Dict, Any, Optional, List
import logging
import argparse
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('ml_server.log')
    ]
)
logger = logging.getLogger(__name__)

class MLModelServer:
    def __init__(self, models_dir="./trained_models", host="localhost", port=8765):
        self.models_dir = Path(models_dir)
        self.host = host
        self.port = port
        
        # Data storage
        self.audio_buffer = deque(maxlen=150)  # Store last 150 samples (about 2.5 minutes at 1Hz)
        self.prediction_history = deque(maxlen=100)
        
        # ML components
        self.models = {}
        self.encoders = {}
        self.scalers = {}
        self.feature_columns = []
        
        # Real-time tracking
        self.last_prediction_time = 0
        self.prediction_interval = 5.0  # Predict every 5 seconds
        self.min_samples_for_prediction = 10  # Minimum samples needed
        
        # Connected clients
        self.clients = set()
        
        # Server statistics
        self.stats = {
            'start_time': time.time(),
            'predictions_made': 0,
            'samples_processed': 0,
            'clients_connected': 0,
            'errors': 0
        }
        
        logger.info(f"Initializing ML Model Server")
        logger.info(f"Models directory: {self.models_dir}")
        logger.info(f"Server address: {self.host}:{self.port}")
        
    def load_models(self):
        """Load the latest trained models"""
        try:
            if not self.models_dir.exists():
                logger.error(f"Models directory does not exist: {self.models_dir}")
                return False
            
            # Find the latest model files by timestamp
            model_files = list(self.models_dir.glob("*_model_*.pkl"))
            encoder_files = list(self.models_dir.glob("label_encoders_*.pkl"))
            scaler_files = list(self.models_dir.glob("feature_scalers_*.pkl"))
            feature_files = list(self.models_dir.glob("feature_columns_*.pkl"))
            
            if not model_files:
                logger.error("No trained models found!")
                logger.info("Please ensure you have trained models in the following format:")
                logger.info("  - speaker_count_model_YYYYMMDD_HHMMSS.pkl")
                logger.info("  - meeting_type_model_YYYYMMDD_HHMMSS.pkl")
                logger.info("  - energy_level_model_YYYYMMDD_HHMMSS.pkl")
                logger.info("  - engagement_score_model_YYYYMMDD_HHMMSS.pkl")
                return False
            
            # Extract timestamps and find the latest
            timestamps = []
            for model_file in model_files:
                try:
                    # Extract timestamp from filename (last part before .pkl)
                    timestamp = model_file.stem.split('_')[-2] + '_' + model_file.stem.split('_')[-1]
                    timestamps.append(timestamp)
                except IndexError:
                    continue
            
            if not timestamps:
                logger.error("Could not extract timestamps from model files!")
                return False
                
            latest_timestamp = max(timestamps)
            logger.info(f"Loading models with timestamp: {latest_timestamp}")
            
            # Load models
            models_loaded = 0
            for model_file in model_files:
                if latest_timestamp in model_file.stem:
                    try:
                        # Extract model name (everything before _model_)
                        model_name = '_'.join(model_file.stem.split('_')[:-2])
                        
                        with open(model_file, 'rb') as f:
                            self.models[model_name] = pickle.load(f)
                        logger.info(f"✓ Loaded {model_name} model")
                        models_loaded += 1
                    except Exception as e:
                        logger.error(f"Failed to load model {model_file}: {e}")
            
            # Load encoders
            encoder_file = None
            for ef in encoder_files:
                if latest_timestamp in ef.stem:
                    encoder_file = ef
                    break
            
            if encoder_file and encoder_file.exists():
                try:
                    with open(encoder_file, 'rb') as f:
                        self.encoders = pickle.load(f)
                    logger.info(f"✓ Loaded label encoders ({len(self.encoders)} encoders)")
                except Exception as e:
                    logger.error(f"Failed to load encoders: {e}")
            
            # Load scalers
            scaler_file = None
            for sf in scaler_files:
                if latest_timestamp in sf.stem:
                    scaler_file = sf
                    break
                    
            if scaler_file and scaler_file.exists():
                try:
                    with open(scaler_file, 'rb') as f:
                        self.scalers = pickle.load(f)
                    logger.info(f"✓ Loaded feature scalers ({len(self.scalers)} scalers)")
                except Exception as e:
                    logger.error(f"Failed to load scalers: {e}")
            
            # Load feature columns
            feature_file = None
            for ff in feature_files:
                if latest_timestamp in ff.stem:
                    feature_file = ff
                    break
                    
            if feature_file and feature_file.exists():
                try:
                    with open(feature_file, 'rb') as f:
                        self.feature_columns = pickle.load(f)
                    logger.info(f"✓ Loaded feature columns ({len(self.feature_columns)} features)")
                except Exception as e:
                    logger.error(f"Failed to load feature columns: {e}")
            
            if models_loaded == 0:
                logger.error("No models were successfully loaded!")
                return False
            
            logger.info(f"✅ Successfully loaded {models_loaded} models")
            logger.info(f"📊 Available models: {list(self.models.keys())}")
            return True
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            return False
    
    def extract_features_from_buffer(self) -> Optional[Dict[str, float]]:
        """Extract ML features from current audio buffer"""
        if len(self.audio_buffer) < self.min_samples_for_prediction:
            return None
        
        try:
            # Convert buffer to lists for processing
            audio_samples = list(self.audio_buffer)
            left_levels = np.array([s.get('leftMic', 0) for s in audio_samples])
            right_levels = np.array([s.get('rightMic', 0) for s in audio_samples])
            differences = np.array([s.get('difference', 0) for s in audio_samples])
            avg_levels = np.array([s.get('averageLevel', 0) for s in audio_samples])
            
            # Handle edge cases
            if len(left_levels) == 0:
                return None
            
            # Extract features (matching your training feature extraction)
            features = {
                # Volume statistics
                'avg_volume': float(np.mean(avg_levels)),
                'max_volume': float(np.max(avg_levels)),
                'min_volume': float(np.min(avg_levels)),
                'volume_std': float(np.std(avg_levels)),
                'volume_range': float(np.ptp(avg_levels)),
                'volume_median': float(np.median(avg_levels)),
                'volume_25th': float(np.percentile(avg_levels, 25)),
                'volume_75th': float(np.percentile(avg_levels, 75)),
                
                # Stereo positioning features
                'avg_stereo_diff': float(np.mean(np.abs(differences))),
                'max_stereo_diff': float(np.max(np.abs(differences))),
                'min_stereo_diff': float(np.min(np.abs(differences))),
                'stereo_variation': float(np.std(differences)),
                'stereo_bias': float(np.mean(differences)),
                
                # Activity features
                'high_activity_ratio': float(np.sum(avg_levels > (np.mean(avg_levels) + np.std(avg_levels))) / len(avg_levels)),
                'low_activity_ratio': float(np.sum(avg_levels < (np.mean(avg_levels) - np.std(avg_levels))) / len(avg_levels)),
                'silence_ratio': float(np.sum(avg_levels < 40) / len(avg_levels)),
                'peak_count': float(len([i for i in range(1, len(avg_levels)-1) 
                                      if avg_levels[i] > avg_levels[i-1] and avg_levels[i] > avg_levels[i+1]])),
                
                # Temporal patterns
                'volume_changes': float(np.sum(np.abs(np.diff(avg_levels)) > 5) / len(avg_levels)) if len(avg_levels) > 1 else 0.0,
                'stereo_switches': float(np.sum(np.abs(np.diff(differences)) > 3) / len(avg_levels)) if len(differences) > 1 else 0.0,
                'rapid_changes': float(np.sum(np.abs(np.diff(avg_levels)) > 10) / len(avg_levels)) if len(avg_levels) > 1 else 0.0,
                
                # Advanced features
                'left_dominance': float(np.sum(differences > 2) / len(differences)),
                'right_dominance': float(np.sum(differences < -2) / len(differences)),
                'center_ratio': float(np.sum(np.abs(differences) < 2) / len(differences)),
                'dynamic_range': float(np.std(avg_levels) / np.mean(avg_levels)) if np.mean(avg_levels) > 0 else 0.0,
                
                # Session features
                'session_length': float(len(audio_samples)),
                'avg_sample_interval': float(np.mean(np.diff([s.get('timestamp', i*1000) for i, s in enumerate(audio_samples)]))) if len(audio_samples) > 1 else 1000.0,
                
                # Enhanced features for engagement
                'activity_variance': float(np.var(avg_levels > np.mean(avg_levels))),
                'speaker_alternation': float(len(np.where(np.diff(np.sign(differences)))[0])),
                'engagement_complexity': float(np.sum(np.abs(np.diff(avg_levels, 2)))) if len(avg_levels) > 2 else 0.0
            }
            
            # Energy distribution features (5 bins)
            energy_bins = np.histogram(avg_levels, bins=5)[0]
            for i, count in enumerate(energy_bins):
                features[f'energy_bin_{i}'] = float(count / len(avg_levels))
            
            # Stereo distribution features (5 bins)  
            stereo_bins = np.histogram(differences, bins=5)[0]
            for i, count in enumerate(stereo_bins):
                features[f'stereo_bin_{i}'] = float(count / len(differences))
            
            # Ensure no NaN or infinite values
            for key, value in features.items():
                if np.isnan(value) or np.isinf(value):
                    features[key] = 0.0
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return None
    
    def make_predictions(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Make predictions using trained models"""
        predictions = {}
        
        try:
            # Convert features to DataFrame
            feature_df = pd.DataFrame([features])
            
            # Ensure all required columns are present
            for col in self.feature_columns:
                if col not in feature_df.columns:
                    feature_df[col] = 0.0
            
            # Reorder columns to match training
            feature_df = feature_df[self.feature_columns]
            
            # Make predictions for each model
            for model_name, model in self.models.items():
                try:
                    # Scale features if scaler exists
                    if model_name in self.scalers:
                        scaled_features = self.scalers[model_name].transform(feature_df)
                    else:
                        scaled_features = feature_df.values
                    
                    # Make prediction
                    if model_name == 'engagement_score':
                        # Regression model
                        prediction = model.predict(scaled_features)[0]
                        
                        # Ensure engagement score is within reasonable bounds
                        prediction = max(0, min(100, prediction))
                        
                        predictions[model_name] = {
                            'value': float(prediction),
                            'confidence': 0.85,  # Fixed confidence for regression
                            'type': 'regression'
                        }
                    else:
                        # Classification model
                        prediction = model.predict(scaled_features)[0]
                        probabilities = model.predict_proba(scaled_features)[0]
                        
                        # Decode prediction
                        if model_name in self.encoders:
                            predicted_class = self.encoders[model_name].inverse_transform([prediction])[0]
                            all_classes = self.encoders[model_name].classes_
                        else:
                            predicted_class = str(prediction)
                            all_classes = [str(prediction)]
                        
                        predictions[model_name] = {
                            'value': predicted_class,
                            'confidence': float(np.max(probabilities)),
                            'probabilities': {
                                self.encoders[model_name].inverse_transform([i])[0]: float(prob) 
                                for i, prob in enumerate(probabilities)
                            } if model_name in self.encoders else {},
                            'type': 'classification'
                        }
                        
                except Exception as e:
                    logger.error(f"Error predicting {model_name}: {e}")
                    predictions[model_name] = {'error': str(e)}
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error making predictions: {e}")
            return {'error': str(e)}
    
    def get_spatial_analysis(self) -> Dict[str, Any]:
        """Analyze spatial audio patterns for sphere visualization"""
        if len(self.audio_buffer) < 5:
            return {
                'dominant_side': 'center',
                'left_dominance_pct': 0.0,
                'right_dominance_pct': 0.0,
                'center_pct': 100.0,
                'average_bias': 0.0,
                'spatial_activity': 0.0,
                'speaker_switches': 0
            }
        
        try:
            # Use recent samples for spatial analysis
            recent_samples = list(self.audio_buffer)[-30:]  # Last 30 samples
            differences = [s.get('difference', 0) for s in recent_samples]
            
            if not differences:
                return {
                    'dominant_side': 'center',
                    'left_dominance_pct': 0.0,
                    'right_dominance_pct': 0.0,
                    'center_pct': 100.0,
                    'average_bias': 0.0,
                    'spatial_activity': 0.0,
                    'speaker_switches': 0
                }
            
            # Analyze directional tendencies
            left_dominant_count = sum(1 for d in differences if d > 2)
            right_dominant_count = sum(1 for d in differences if d < -2)
            center_count = sum(1 for d in differences if abs(d) <= 2)
            
            total_samples = len(differences)
            
            # Calculate percentages
            left_pct = (left_dominant_count / total_samples) * 100
            right_pct = (right_dominant_count / total_samples) * 100
            center_pct = (center_count / total_samples) * 100
            
            # Determine dominant side
            if left_dominant_count > right_dominant_count and left_dominant_count > center_count:
                dominant_side = 'left'
            elif right_dominant_count > left_dominant_count and right_dominant_count > center_count:
                dominant_side = 'right'
            else:
                dominant_side = 'center'
            
            # Calculate speaker switches (sign changes in differences)
            speaker_switches = 0
            for i in range(1, len(differences)):
                if np.sign(differences[i]) != np.sign(differences[i-1]) and abs(differences[i]) > 1:
                    speaker_switches += 1
            
            return {
                'dominant_side': dominant_side,
                'left_dominance_pct': float(left_pct),
                'right_dominance_pct': float(right_pct),
                'center_pct': float(center_pct),
                'average_bias': float(np.mean(differences)),
                'spatial_activity': float(np.std(differences)),
                'speaker_switches': int(speaker_switches)
            }
            
        except Exception as e:
            logger.error(f"Error in spatial analysis: {e}")
            return {
                'dominant_side': 'center',
                'left_dominance_pct': 0.0,
                'right_dominance_pct': 0.0,
                'center_pct': 100.0,
                'average_bias': 0.0,
                'spatial_activity': 0.0,
                'speaker_switches': 0,
                'error': str(e)
            }
    
    async def handle_client(self, websocket, path):
        """Handle WebSocket client connections"""
        client_id = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        self.clients.add(websocket)
        self.stats['clients_connected'] += 1
        logger.info(f"✅ Client connected: {client_id} (Total: {len(self.clients)})")
        
        try:
            # Send welcome message with server info
            welcome_msg = {
                'type': 'welcome',
                'server_info': {
                    'models_loaded': list(self.models.keys()),
                    'features_count': len(self.feature_columns),
                    'prediction_interval': self.prediction_interval,
                    'server_stats': self.stats
                }
            }
            await websocket.send(json.dumps(welcome_msg))
            
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.handle_message(websocket, data)
                    
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON from {client_id}")
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': 'Invalid JSON format'
                    }))
                except Exception as e:
                    logger.error(f"Error processing message from {client_id}: {e}")
                    self.stats['errors'] += 1
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"🔴 Client disconnected: {client_id}")
        except Exception as e:
            logger.error(f"Error handling client {client_id}: {e}")
        finally:
            self.clients.remove(websocket)
            logger.info(f"Client removed: {client_id} (Remaining: {len(self.clients)})")
    
    async def handle_message(self, websocket, data):
        """Handle different types of messages from clients"""
        message_type = data.get('type')
        
        if message_type == 'audio_data':
            # Store audio data
            audio_sample = {
                'leftMic': float(data.get('leftMic', 0)),
                'rightMic': float(data.get('rightMic', 0)),
                'difference': float(data.get('difference', 0)),
                'averageLevel': float(data.get('averageLevel', 0)),
                'timestamp': data.get('timestamp', time.time() * 1000)
            }
            self.audio_buffer.append(audio_sample)
            self.stats['samples_processed'] += 1
            
            # Check if it's time for new predictions
            current_time = time.time()
            if current_time - self.last_prediction_time >= self.prediction_interval:
                await self.process_and_broadcast_predictions()
                self.last_prediction_time = current_time
        
        elif message_type == 'request_prediction':
            # Force immediate prediction
            await self.process_and_broadcast_predictions()
        
        elif message_type == 'get_stats':
            # Send server statistics
            stats_msg = {
                'type': 'server_stats',
                'stats': self.stats,
                'buffer_size': len(self.audio_buffer),
                'clients_connected': len(self.clients)
            }
            await websocket.send(json.dumps(stats_msg))
        
        elif message_type == 'ping':
            # Respond to ping
            await websocket.send(json.dumps({'type': 'pong'}))
    
    async def process_and_broadcast_predictions(self):
        """Process current audio buffer and broadcast ML predictions"""
        try:
            # Extract features
            features = self.extract_features_from_buffer()
            if not features:
                logger.debug("Insufficient data for prediction")
                return
            
            # Make predictions
            predictions = self.make_predictions(features)
            
            # Get spatial analysis
            spatial_analysis = self.get_spatial_analysis()
            
            # Update statistics
            self.stats['predictions_made'] += 1
            
            # Create response
            response = {
                'type': 'ml_predictions',
                'timestamp': datetime.now().isoformat(),
                'predictions': predictions,
                'spatial_analysis': spatial_analysis,
                'buffer_size': len(self.audio_buffer),
                'features_used': len(features),
                'server_stats': {
                    'predictions_made': self.stats['predictions_made'],
                    'samples_processed': self.stats['samples_processed'],
                    'uptime': time.time() - self.stats['start_time']
                }
            }
            
            # Store in history
            self.prediction_history.append(response)
            
            # Broadcast to all clients
            if self.clients:
                message = json.dumps(response)
                disconnected_clients = []
                
                for client in self.clients:
                    try:
                        await client.send(message)
                    except websockets.exceptions.ConnectionClosed:
                        disconnected_clients.append(client)
                    except Exception as e:
                        logger.error(f"Error sending to client: {e}")
                        disconnected_clients.append(client)
                
                # Remove disconnected clients
                for client in disconnected_clients:
                    self.clients.discard(client)
                
                logger.info(f"📊 Broadcasted predictions to {len(self.clients)} clients")
            
        except Exception as e:
            logger.error(f"Error processing predictions: {e}")
            self.stats['errors'] += 1
    
    async def start_server(self):
        """Start the WebSocket server"""
        logger.info(f"🚀 Starting ML Model Server on {self.host}:{self.port}")
        
        # Load models first
        if not self.load_models():
            logger.error("❌ Failed to load models! Cannot start server.")
            return False
        
        logger.info(f"📊 Loaded models: {list(self.models.keys())}")
        logger.info(f"🔧 Prediction interval: {self.prediction_interval}s")
        logger.info(f"📈 Feature count: {len(self.feature_columns)}")
        
        try:
            async with websockets.serve(self.handle_client, self.host, self.port):
                logger.info("✅ ML Model Server is running...")
                logger.info(f"🌐 Connect your web interface to: ws://{self.host}:{self.port}")
                logger.info("Press Ctrl+C to stop the server")
                
                # Keep server running
                await asyncio.Future()  # Run forever
                
        except Exception as e:
            logger.error(f"❌ Server error: {e}")
            return False

def main():
    """Main function to start the ML model server"""
    parser = argparse.ArgumentParser(description='ML Model Integration Server for Meeting Room Visualization')
    parser.add_argument('--models-dir', default='./trained_models', 
                       help='Directory containing trained models (default: ./trained_models)')
    parser.add_argument('--host', default='localhost', 
                       help='Server host address (default: localhost)')
    parser.add_argument('--port', type=int, default=8765, 
                       help='Server port (default: 8765)')
    parser.add_argument('--prediction-interval', type=float, default=5.0,
                       help='Prediction interval in seconds (default: 5.0)')
    parser.add_argument('--min-samples', type=int, default=10,
                       help='Minimum samples needed for prediction (default: 10)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Print startup banner
    print("""
╔══════════════════════════════════════════════════════════════╗
║                    ML Model Server v1.0                     ║
║              Meeting Room Visualization System              ║
╚══════════════════════════════════════════════════════════════╝
""")
    
    # Create and configure server
    server = MLModelServer(
        models_dir=args.models_dir,
        host=args.host,
        port=args.port
    )
    
    server.prediction_interval = args.prediction_interval
    server.min_samples_for_prediction = args.min_samples
    
    try:
        # Start the server
        asyncio.run(server.start_server())
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
        print("\n✅ ML Model Server stopped gracefully")
    except Exception as e:
        logger.error(f"❌ Fatal server error: {e}")
        print(f"\n❌ Server failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()