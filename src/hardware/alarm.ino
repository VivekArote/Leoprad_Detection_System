const int buzzerPin = 9; // Connect the POSITIVE (+) leg of the buzzer to Pin 9

void setup() {
  // Use the same baud rate as your Node.js SerialPort configuration
  Serial.begin(9600);
  
  pinMode(buzzerPin, OUTPUT);
  
  // Test beep on startup so you know the hardware is working
  digitalWrite(buzzerPin, HIGH);
  delay(200);
  digitalWrite(buzzerPin, LOW);
}

void loop() {
  // Check if Node.js has sent any data
  if (Serial.available() > 0) {
    char signal = Serial.read();

    // If 'H' (High) is received from Node.js
    if (signal == 'H') {
      triggerAlarm();
    }
  }
}

void triggerAlarm() {
  // Rapid alert pattern: 5 quick beeps
  for (int i = 0; i < 5; i++) {
    digitalWrite(buzzerPin, HIGH);
    delay(100);
    digitalWrite(buzzerPin, LOW);
    delay(100);
  }
}