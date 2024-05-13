#include <Keypad.h>

const byte ROWS = 4; 
const byte COLS = 4; 

char hexaKeys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};

byte rowPins[ROWS] = {3, 4, 5, 6}; 
byte colPins[COLS] = {7, 8, 9, 10}; 

Keypad customKeypad = Keypad(makeKeymap(hexaKeys), rowPins, colPins, ROWS, COLS); 

#define PIRPin  2
#define redPin 22
#define greenPin 23
#define bluePin 24
int val = 0;
bool motionState = false; // We start with no motion detected.

void setup() {
  // Configure the pins as input or output:
  pinMode(PIRPin, INPUT);

  // Begin serial communication at a baud rate of 9600:
  Serial.begin(9600);
}

void loop() {
    char customKey = customKeypad.getKey();
  
  if (customKey){
    Serial.println(customKey);
  }
  // Read out the pirPin and store as val:
  val = digitalRead(PIRPin);

  // If motion is detected (pirPin = HIGH), do the following:
  if (val == HIGH) {
      setColour(255,255,255);
    // Change the motion state to true (motion detected):
    if (motionState == false) {
      Serial.println("Motion detected");
      motionState = true;
    }
  }

  // If no motion is detected (pirPin = LOW), do the following:
  else {
      setColour(0,0,0);
    // Change the motion state to false (no motion):
    if (motionState == true) {
      Serial.println("Motion ended");
      motionState = false;
    }
  }
}

void setColour(int redVal, int greenVal, int blueVal) {
  analogWrite(redPin, redVal);
  analogWrite(greenPin, greenVal);
  analogWrite(bluePin, blueVal);

}

