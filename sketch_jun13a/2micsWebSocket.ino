// ==================== COMPLETE ESP32 MICROPHONE + WEBSOCKET SYSTEM ====================
// This is the COMPLETE code - replace your entire Arduino file with this

#include "driver/adc.h"
#include "esp_adc_cal.h"
#include <arduinoFFT.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

// ==================== WIFI CONFIGURATION ====================
const char* ssid = "NjrCkiNaAIHvdVFh";
const char* password = "JDFAvizJDFAviz";

// ==================== HARDWARE CONFIGURATION ====================
#define NUM_MICS 2

adc1_channel_t mic_pins[NUM_MICS] = {
    ADC1_CHANNEL_7,  // GPIO35 - Microphone 1 (Left)
    ADC1_CHANNEL_6   // GPIO34 - Microphone 2 (Right)
};

const char* mic_names[NUM_MICS] = {"Left", "Right"};

#define DEFAULT_VREF 1100
#define REF_SILENCE_MV 600.0

// ==================== WEBSOCKET SERVER ====================
WebSocketsServer webSocket = WebSocketsServer(81);

// ==================== SAMPLING CONFIGURATION ====================
esp_adc_cal_characteristics_t adc_chars;
unsigned long lastSampleTime = 0;
const float sampleRate = 5000;
const float interval = (1.0f / sampleRate) * 1e6;
const int N = 5;
const uint16_t n = 512;

// ==================== DATA STORAGE ====================
float signalMatrix[NUM_MICS][N][n];
int windowIndex = 0;
int sampleIndex = 0;

// FFT arrays
float vReal[n];
float vImag[n];
ArduinoFFT<float> FFT = ArduinoFFT<float>(vReal, vImag, n, sampleRate);

// ==================== SETUP FUNCTION ====================
void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("=== ESP32 TWO MICROPHONE SYSTEM ===");
    Serial.println("Microphone 1 (Left):  GPIO35");
    Serial.println("Microphone 2 (Right): GPIO34");
    Serial.println();
    
    // Configure ADC
    adc1_config_width(ADC_WIDTH_BIT_12);
    
    // Configure both microphone channels
    for (int mic = 0; mic < NUM_MICS; mic++) {
        adc1_config_channel_atten(mic_pins[mic], ADC_ATTEN_DB_11);
        Serial.print("✓ Configured ");
        Serial.print(mic_names[mic]);
        Serial.print(" microphone on GPIO");
        
        int gpio_num = (mic_pins[mic] == ADC1_CHANNEL_7) ? 35 : 34;
        Serial.println(gpio_num);
    }
    
    // Calibrate ADC
    esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_11, 
                            ADC_WIDTH_BIT_12, DEFAULT_VREF, &adc_chars);
    
    Serial.println("✓ ADC calibrated");
    
    // Setup WiFi and WebSocket
    setupWiFiAndWebSocket();
    
    Serial.println("Starting synchronized sampling...");
    Serial.println();
}

// ==================== WIFI AND WEBSOCKET SETUP ====================
void setupWiFiAndWebSocket() {
    // Connect to WiFi
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.print("✅ Connected! IP address: ");
    Serial.println(WiFi.localIP());
    
    // Start WebSocket server
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
    Serial.println("✅ WebSocket server started on port 81");
    Serial.println();
    Serial.println("🌐 COPY THIS IP TO YOUR WEB BROWSER:");
    Serial.print("    ");
    Serial.println(WiFi.localIP());
    Serial.println();
}

// ==================== WEBSOCKET EVENT HANDLER ====================
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("🔴 [%u] Client Disconnected!\n", num);
            break;
        case WStype_CONNECTED:
            Serial.printf("🟢 [%u] Client Connected from %s\n", num, webSocket.remoteIP(num).toString().c_str());
            break;
        case WStype_TEXT:
            Serial.printf("📨 [%u] Received: %s\n", num, payload);
            break;
        default:
            break;
    }
}

// ==================== MAIN LOOP ====================
void loop() {
    unsigned long now = micros();
    
    // Handle WebSocket events
    webSocket.loop();
    
    // Check if it's time for the next sample
    if (now - lastSampleTime >= interval) {
        lastSampleTime = now;
        
        // Sample both microphones simultaneously
        for (int mic = 0; mic < NUM_MICS; mic++) {
            int raw = adc1_get_raw(mic_pins[mic]);
            uint32_t voltage_mv = esp_adc_cal_raw_to_voltage(raw, &adc_chars);
            signalMatrix[mic][windowIndex][sampleIndex] = voltage_mv;
        }
        
        sampleIndex++;
        
        // Check if current window is complete
        if (sampleIndex >= n) {
            sampleIndex = 0;
            windowIndex++;
            
            // Check if all windows are filled
            if (windowIndex >= N) {
                windowIndex = 0;
                processBothMicrophones();
            }
        }
    }
}

// ==================== PROCESSING FUNCTION ====================
void processBothMicrophones() {
    float micResults[NUM_MICS];
    
    Serial.println("=== PROCESSING BOTH MICROPHONES ===");
    
    // Process each microphone
    for (int mic = 0; mic < NUM_MICS; mic++) {
        float res = 0.0;
        
        for (int w = 0; w < N; w++) {
            // Copy window data to FFT arrays
            for (int s = 0; s < n; s++) {
                vReal[s] = signalMatrix[mic][w][s];
                vImag[s] = 0.0;
            }
            
            // Perform FFT processing
            FFT.windowing(FFTWindow::Hamming, FFTDirection::Forward);
            FFT.compute(FFTDirection::Forward);
            FFT.complexToMagnitude();
            
            // Calculate energy in voice frequency range
            float energy = 0.0;
            for (int k = 0; k < n; k++) {
                float freq = (k * sampleRate) / n;
                if (freq > 300 && freq < 3400) {
                    energy += vReal[k] * vReal[k];
                }
            }
            res += energy;
        }
        
        res /= N;
        micResults[mic] = 10.0 * log10(res / 1.0 + 1e-12);
        
        Serial.print(mic_names[mic]);
        Serial.print(" mic: ");
        Serial.print(micResults[mic], 2);
        Serial.println(" dB");
    }
    
    // Calculate difference
    float difference = micResults[0] - micResults[1];
    
    Serial.print("Difference (L-R): ");
    Serial.print(difference, 2);
    Serial.print(" dB");
    
    // Direction indication
    if (abs(difference) < 2.0) {
        Serial.println(" → CENTERED");
    } else if (difference > 0) {
        Serial.print(" → LEFT (");
        Serial.print(difference, 1);
        Serial.println(" dB stronger)");
    } else {
        Serial.print(" → RIGHT (");
        Serial.print(-difference, 1);
        Serial.println(" dB stronger)");
    }
    
    // Send data via WebSocket
    sendAudioDataViaWebSocket(micResults[0], micResults[1], difference);
    
    Serial.println("----------------------------------------");
}

// ==================== WEBSOCKET DATA TRANSMISSION ====================
void sendAudioDataViaWebSocket(float leftMic, float rightMic, float difference) {
    // Create JSON object
    StaticJsonDocument<200> doc;
    doc["leftMic"] = leftMic;
    doc["rightMic"] = rightMic;
    doc["difference"] = difference;
    doc["timestamp"] = millis();
    doc["averageLevel"] = (leftMic + rightMic) / 2.0;
    
    // Convert to string
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Send to all connected clients
    webSocket.broadcastTXT(jsonString);
    
    // Optional: Debug output (uncomment to see data being sent)
    // Serial.print("📤 Sent: ");
    // Serial.println(jsonString);
}

/*
🚀 SETUP CHECKLIST:

✅ 1. INSTALL LIBRARIES (Tools > Manage Libraries):
   - WebSockets by Markus Sattler
   - ArduinoJson by Benoit Blanchon
   - arduinoFFT by Enrique Condes

✅ 2. HARDWARE CONNECTIONS:
   Left Mic:  VCC→3.3V, GND→GND, OUT→GPIO35
   Right Mic: VCC→3.3V, GND→GND, OUT→GPIO34

✅ 3. WiFi credentials are already set in this code

✅ 4. UPLOAD PROCESS:
   - Select ESP32 board
   - Upload this complete code
   - Open Serial Monitor (115200 baud)
   - Copy the IP address shown

✅ 5. WEB BROWSER:
   - Enter the ESP32 IP in your web interface
   - Click "Connect to ESP32"
   - Should show "Connected" status

🔧 TROUBLESHOOTING:
- If libraries missing: Install them from Library Manager
- If WiFi fails: Check network name and password
- If no audio: Adjust microphone gains with screwdriver
- If WebSocket fails: Check IP address and port 81

📊 EXPECTED OUTPUT:
=== PROCESSING BOTH MICROPHONES ===
Left mic: 45.23 dB
Right mic: 41.87 dB
Difference (L-R): 3.36 dB → LEFT (3.4 dB stronger)
*/