#include <Keypad.h>
#include <LiquidCrystal.h>
#include <Servo.h>
#include <DHT.h>
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
#define alcoholSensor A0
#define PIRPin  2
#define servoPin 11
#define redPin 22
#define greenPin 23
#define bluePin 24
#define buttonPin 25
#define DHTPin 12
#define DHTTYPE DHT11
int val = 0;
const int rs = 45, en = 44, d4 = 43, d5 = 42, d6 = 41, d7 = 40;
LiquidCrystal lcd(rs, en, d4, d5, d6, d7);
Servo servoM;
bool motionState = false; // We start with no motion detected.
bool lcdNewPin = true;
bool bacTextPrinted = false;
bool bacText2Printed = false;
bool servoMoved = false;
bool doorLocked = false;
bool doorLockedOut = true;
int ledStatus = 2; //led state 0=Off, 1=On, 2=Sensor
int currentState = 0; //O=Passcode, 1=Alcohol, 2=Open,3=Pending Re-lock
String password = "1345";
int bacLevel;
String enteredPassword; //Array to store entered password
const long interval = 750;
unsigned long previousMillis = 0;
unsigned long previousMillisDoorLock = 0;
DHT dht(DHTPin, DHTTYPE);

void setup() {
  // Configure the pins as input or output:
  pinMode(PIRPin, INPUT);
  pinMode(alcoholSensor, INPUT);
  pinMode(buttonPin, INPUT_PULLUP);
  dht.begin();
  lcd.begin(16,2);
  lcdInitial();
  // Begin serial communication at a baud rate of 9600:
  Serial.begin(9600);
}
void loop() {
  float temp = dht.readTemperature(); //reads Temp
  float hum = dht.readHumidity(); //reads humidity
  ledState();
  if (currentState == 0) {
    printSerial(temp, hum);
    togglePinPad();
  } 
  else if (currentState == 1) {
    printSerial(temp, hum);
    toggleAlcohol();
  }
  else if (currentState == 2) {
   printSerial(temp, hum);
    doorMotion(180);
  }
  else if (currentState == 3) {
    printSerial(temp, hum);
    lockDoor();
  }
}

void ledState() {
  Serial.println(ledStatus);
  if (Serial.available() > 0) {
    String portIncoming = Serial.readString();
    if (portIncoming.startsWith("LEDOFF")) {
        ledStatus = 0;
    }
    else if(portIncoming.startsWith("LEDON")) {
        ledStatus = 1;
    }
    else if (portIncoming.startsWith("LEDSENSOR")) {
        ledStatus = 2;
    }
    if (ledStatus == 0) {
      setColour(0,0,0);
    }
    else if (ledStatus == 1) {
      setColour(255,255,255);
    }
  }
  if (ledStatus == 2) {
      // Check the motion sensor
    val = digitalRead(PIRPin);
    if (val == HIGH) {
      setColour(255,255,255);
      if (motionState == false) {
        Serial.print("Motion detected");
        Serial.print(" ");
        motionState = true;
      }
    
    } 
  else {
      setColour(0,0,0);
      if (motionState == true) {
        motionState = false;
      }
    }
  }
}


void printSerial(float temp, float hum) {
    Serial.print(temp);
    Serial.print(" ");
    Serial.print(hum);
    Serial.print(" ");
    if(!doorLockedOut) {
      Serial.println("Unlocked"); 
      }
    else if(doorLockedOut) {
      Serial.println("Locked");
  }
}
void lcdInitial() {
  lcd.print("Please Enter Pin");
  lcd.setCursor(0,1);
  lcd.print("Then Press 'D'");
}
void togglePinPad() {
   char customKey = customKeypad.getKey();
  if (customKey == '1' || customKey == '2' || customKey == '3' || customKey == '4' || customKey == '5' || customKey == '6' || customKey == '7' || customKey == '8' || customKey == '9' || customKey == '0'){
    enteredPassword += customKey;
    if (lcdNewPin) {
      lcd.clear();
      lcdNewPin = false;
    }
    lcd.print("*");
  }
  if (customKey == 'C') {
    enteredPassword = "";
    lcd.clear();
    lcd.print("Pin Cleared");
    lcd.setCursor(0,1);
    lcd.print("Please Enter Pin");
    lcdNewPin = true;
  }
  if (customKey == 'D') {
    
  if (enteredPassword == password) {
    enteredPassword = "";
    currentState = 1;
  }
  else {
    lcd.clear();
    lcd.print("Incorrect Pin");
    lcd.setCursor(0,1);
    lcd.print("Please Try Again");
     lcdNewPin = true;
    enteredPassword = "";
  }
  }
}

int toggleAlcohol()  {
  if (bacText2Printed == false) {
        lcd.clear();
      lcd.print("Blow for 5s");
    lcd.setCursor(0,1);
    lcd.print("Then Press Btn");
    bacText2Printed = true;
  }
  if (digitalRead(buttonPin) == LOW) {
  bacLevel = analogRead(alcoholSensor);
  Serial.print(bacLevel);
  Serial.print(" ");
  delay(2);
    if (bacLevel > 200) {
      lcd.clear();
      lcd.print("Alcohol Detected");
      lcd.setCursor(0,1);
      lcd.print("Please Wait");
      delay(500);
      lcd.clear();
      lcd.print("Door Locked");
      lcd.setCursor(0,1);
      lcd.print("Please Try Again");
      delay(500);
      currentState = 0;
      enteredPassword = "";
      bacText2Printed = false;
      bacTextPrinted = false;
      lcdNewPin = true;
      lcd.clear();
      lcdInitial();
  } 
    else {
      lcd.clear();
      lcd.print("No Alcohol Detected");
      lcd.setCursor(0,1);
      lcd.print("Door Unlocked");
      doorLockedOut = false;
      currentState = 2;
    }
  }
}
void setColour(int redVal, int greenVal, int blueVal) {
  analogWrite(redPin, redVal);
  analogWrite(greenPin, greenVal);
  analogWrite(bluePin, blueVal);
}
void doorMotion(int angle) {
  unsigned long currentMillis = millis();
  if(servoMoved == false)
  {
    servoM.attach(11);
    servoM.write(angle);
    previousMillis = currentMillis;
    servoMoved = true;
  }
  if (servoMoved == true && currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    servoM.detach();
    servoMoved = false;
    currentState = 3;
  }}
void lockDoor() {
  unsigned long currentMillis = millis();
  if (digitalRead(buttonPin) == LOW) {
      doorLocked = true;
      doorLockedOut = true;
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("Door is Locked.");
      doorMotion(0);
      previousMillisDoorLock = currentMillis;
  }
  if(doorLocked == true && currentMillis - previousMillisDoorLock >= interval){
      previousMillisDoorLock = currentMillis;
      servoM.detach();
      currentState = 0;
      bacText2Printed = false;
      bacTextPrinted = false;
      servoMoved = false;
      lcd.clear();
      lcdInitial();
      lcdNewPin = true;
      doorLocked = false;
    }
}
