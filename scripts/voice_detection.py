import speech_recognition as sr
import google.generativeai as genai
import os
import json
import time

# Configure Gemini
# You'll need to set your API key in environment variables or replace here
API_KEY = "YOUR_GEMINI_API_KEY" # Suggested: os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)

def categorize_emergency(text):
    model = genai.GenerativeModel('gemini-pro')
    prompt = f"""
    Analyze the following emergency distress call text and output a JSON object.
    Text: "{text}"
    
    Required Fields:
    - category: (FIRE, MEDICAL, POLICE, ACCIDENT, OTHER)
    - severity: (CRITICAL, HIGH, MEDIUM)
    - summary: A short 1-sentence summary
    - needs_traffic_support: boolean (True if it involves fire engine or ambulance)
    
    Output ONLY valid JSON.
    """
    
    try:
        response = model.generate_content(prompt)
        # Clean response text if it contains markdown code blocks
        clean_json = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_json)
    except Exception as e:
        print(f"Error in categorization: {e}")
        return None

def listen_and_process():
    r = sr.Recognizer()
    
    with sr.Microphone() as source:
        print("\n--- CrisisLink Voice Detection Active ---")
        print("Calibrating background noise...")
        r.adjust_for_ambient_noise(source, duration=1)
        
        print("Ready! Speak your emergency (8 second limit)...")
        # We use timeout to start listening and phrase_time_limit to stop after 8s
        try:
            audio = r.listen(source, timeout=5, phrase_time_limit=8)
            print("Processing speech...")
            
            # Using Google Web Speech API (free/limited, good for demo)
            text = r.recognize_google(audio)
            print(f"Detected Text: \"{text}\"")
            
            print("Categorizing emergency with Gemini...")
            result = categorize_emergency(text)
            
            if result:
                print("\n--- EMERGENGY ANALYSIS RESULT ---")
                print(json.dumps(result, indent=2))
                return result
            
        except sr.WaitTimeoutError:
            print("No speech detected.")
        except sr.UnknownValueError:
            print("Could not understand audio.")
        except sr.RequestError as e:
            print(f"Speech Service Error: {e}")
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Ensure you have the required libraries:
    # pip install SpeechRecognition PyAudio google-generativeai
    listen_and_process()
