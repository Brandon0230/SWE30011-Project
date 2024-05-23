#include <Keypad.h>
#include <LiquidCrystal.h>
#include <Servo.h>
#include <DHT.h>
#include <ctype.h>


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
#define buzzerPin 50
#define buzzerBtn 52

//general
Servo servoM;
DHT dht(DHTPin, DHTTYPE);
const int rs = 45, en = 44, d4 = 43, d5 = 42, d6 = 41, d7 = 40;
LiquidCrystal lcd(rs, en, d4, d5, d6, d7);
int timer1 = 0;


//Security Variables
int unlockProcessState = 0; //Stores the state of the Unlock System
int progressionState = 0; //Stores the state of the progression of a function
bool awaitingButtonPress = false; //Stores if the system is awaiting a button press to change the state
String password = "1234";
String enteredPassword = "";
bool doorUnlocked = false;


//sensor variables
int alcoholValue = 0;
int PIRValue = 0;
bool motionState = false;
bool motionSensorEnabled = true;


void setup(){
    pinMode(PIRPin, INPUT);
    pinMode(alcoholSensor, INPUT);
    pinMode(buttonPin, INPUT_PULLUP);
    pinMode(buzzerPin, INPUT_PULLUP);
    dht.begin();
    lcd.begin(16,2);
    // Begin serial communication at a baud rate of 9600:
    Serial.begin(9600);
    displayStartScreen();
}


void loop(){
    updateSerial();
    updateSensors();
    LockUnlockProcess();
}

void wait(int time){
    unsigned long start = millis();
    while(millis() - start < time){
        updateSerial();
        updateSensors();
        delay(200);
    }
}
void updateSerial(){
    if (Serial.available() > 0){
        String portIncoming = Serial.readString();
            if (portIncoming == "LEDOFF") {
                setColour(0, 0, 0);
            }
             if (portIncoming == "LEDON") {
                setColour(255, 255, 255);
             }
             if (portIncoming == "LEDSENSOR") {
                toggleMotionSensor();
             }
            if (portIncoming == "0") {
                //flick buzzer off
                toggleBuzzer(false);
            }
             if (portIncoming == "1") {
                //flick buzzer on
                toggleBuzzer(true);
             }
        }
  }

void toggleMotionSensor(){
    if (motionSensorEnabled){
        motionSensorEnabled = false;
    } else {
        motionSensorEnabled = true;
    }
}

void updateSensors(){
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    Serial.print(temp);
    Serial.print(" ");
    Serial.print(hum);
    Serial.print(" ");
    if (doorUnlocked){
        Serial.println("Unlocked");
    } else {
        Serial.println("Locked");
    }
    if (motionSensorEnabled){
        PIRValue = digitalRead(PIRPin);
        if (PIRValue == HIGH) {
        setColour(255,255,255);
        if (motionState == false) {
            Serial.print("Motion detected");
            Serial.print(" ");
            motionState = true;
        }
        } else {
        setColour(0,0,0);
        if (motionState == true) {
            motionState = false;
        }
        }
    }
}
void toggleBuzzer(bool state){
    if(state){
        tone(buzzerPin, 1200);
    } else {
        noTone(buzzerPin);
    }
}
void setColour(int redVal, int greenVal, int blueVal) {
  analogWrite(redPin, redVal);
  analogWrite(greenPin, greenVal);
  analogWrite(bluePin, blueVal);
}

void displayStartScreen(){
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Please Enter Pin");
    lcd.setCursor(0,1);
    lcd.print("Then Press 'D'");
}

void LockUnlockProcess(){
    switch (unlockProcessState){
        case 0:
            //Password Mode
            checkKeypad();
            break;
        case 1:
            //AlcoholMode
            checkAlcohol();
            break;
        case 2:
            //doorUnlock/Lock
            if(doorUnlocked){
                lockDoor();
            } else {
                unlockDoor();
            }
    }
    if (awaitingButtonPress){
        if(digitalRead(buttonPin) == LOW){
            awaitingButtonPress = false;
            unlockProcessState++;
            if(unlockProcessState > 2){
                unlockProcessState = 0;
            }
        }
    }
}

void checkKeypad(){
    char key = customKeypad.getKey();
    if (key){
        if(isDigit(key)){
          if (enteredPassword.length() == 0) {
            lcd.clear();
          }
            enteredPassword += key;
            Serial.println(key);
            lcd.print("*");
        }
        switch (key){
            case 'C':
                enteredPassword = "";
                lcd.clear();
                lcd.setCursor(0,0);
                break;
            case 'D':
                if(enteredPassword == password){
                    lcd.clear();
                    lcd.setCursor(0,0);
                    lcd.print("Correct Pin");
                    awaitingButtonPress = true;
                }else{
                    lcd.clear();
                    lcd.setCursor(0,0);
                    lcd.print("Incorrect Pin");
                    enteredPassword = "";
                    wait(2000);
                    lcd.clear();
                }
                break;
        }
    } 
}

void checkAlcohol(){
    bool alcoholDetected = false;
    switch (progressionState){
        case 0:
            lcd.clear();
            lcd.setCursor(0,0);
            lcd.print("Blow into sensor for 5 seconds");
            lcd.setCursor(0,1);
            lcd.print("Press Button  to start");
            if(digitalRead(buttonPin) == LOW){
                progressionState++;
            }
            break;
        case 1:
            lcd.clear();
            lcd.setCursor(0,0);
            lcd.print("Blow...");
            wait(5000);
            alcoholValue = analogRead(alcoholSensor);
            progressionState++;
            break;
        case 2:
            if(alcoholValue > 200){
                alcoholDetected = true;
                lcd.clear();
                lcd.setCursor(0,0);
                lcd.print("Alcohol Detected ");
                lcd.setCursor(0,1);
                lcd.print("Door Locked");
                wait(2000);
                lcd.clear();
                lcd.print("Press Button to continue");
            } else {
                alcoholDetected = false;
                lcd.clear();
                lcd.setCursor(0,0);
                lcd.print("No Alcohol Detected");
                lcd.setCursor(0,1);
                lcd.print("Door Unlocked");
            }
            if(digitalRead(buttonPin) == LOW){
                progressionState++;
            }
            break;
        case 3:
            lcd.clear();
            if (alcoholDetected){
                doorUnlocked = false;
            } else {
                doorUnlocked = true;
            }
            progressionState = 0;
            awaitingButtonPress = true;
            timer1 = millis();
            break;
        
    }
}

void unlockDoor(){
    servoM.attach(11);
    servoM.write(180);
    wait(2000);
}
void lockDoor(){
    if (millis() - timer1 > 5000){
        awaitingButtonPress = true;
        toggleBuzzer(true);
    }
    if (awaitingButtonPress){
        if(digitalRead(buttonPin) == LOW){
            awaitingButtonPress = false;
            lcd.clear();
            lcd.setCursor(0,0);
            lcd.print("Door Locked");
            unlockProcessState = 0;
            servoM.write(0);
            wait(2000);
        }
    }
    
}