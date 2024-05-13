#include <Keypad.h>
#include <LiquidCrystal.h>

const byte ROWS = 4; 
const byte COLS = 4; 
const char password[] = "1345";
char hexaKeys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};

byte rowPins[ROWS] = {3, 4, 5, 6}; 
byte colPins[COLS] = {7, 8, 9, 10}; 

Keypad customKeypad = Keypad(makeKeymap(hexaKeys), rowPins, colPins, ROWS, COLS); 
#define alcoholSensor A0
#define PIRPin  2
#define redPin 22
#define greenPin 23
#define bluePin 24
int val = 0;
const int rs = 45, en = 44, d4 = 43, d5 = 42, d6 = 41, d7 = 40;
LiquidCrystal lcd(rs, en, d4, d5, d6, d7);
bool motionState = false; // We start with no motion detected.

int currentState = 1; //O=Passcode, 1=Alcohol, 2=Open
int bacLevel;

void setup() {
  // Configure the pins as input or output:
  pinMode(PIRPin, INPUT);
  pinMode(alcoholSensor, INPUT);
  lcd.begin(16,2);
  lcd.print("Please Enter Pin");
  lcd.setCursor(0,1);
  lcd.print("Then Press 'D'");
  // Begin serial communication at a baud rate of 9600:
  Serial.begin(9600);
}

void loop() {
   if (currentState == 0) {
      togglePinPad();
   }
   else if (currentState == 1) {
      lcd.clear();
      lcd.print("BAC Time :3");
      toggleAlcohol();
   }
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

void togglePinPad() {
   char customKey = customKeypad.getKey();
  
  if (customKey){
    Serial.print(customKey);
  }
  // Read out the pirPin and store as val:
  val = digitalRead(PIRPin);
}

int toggleAlcohol()  {
  bacLevel = analogRead(alcoholSensor);
  Serial.println(bacLevel);
  delay(200);

}

void setColour(int redVal, int greenVal, int blueVal) {
  analogWrite(redPin, redVal);
  analogWrite(greenPin, greenVal);
  analogWrite(bluePin, blueVal);
}
