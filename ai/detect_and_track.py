import time
import requests
import json
import random

# Configuration
BACKEND_URL = "http://localhost:5000/api/vehicle/update"
VEHICLE_ID = "AP16-AMB-9999" # AP Registration for Vijayawada

# Mock Path: VIJAYAWADA (Benz Circle -> Ramesh Hospital)
# 1. Start: Near Benz Circle (16.5062, 80.6480)
# 2. Moving along MG Road
# 3. End: Ramesh Hospital (16.5020, 80.6400)

route_path = [
    [16.5080, 80.6500], # Approaching Benz Circle
    [16.5070, 80.6490],
    [16.5062, 80.6480], # ** At Benz Circle (Trigger Signal) **
    [16.5050, 80.6460], # MG Road
    [16.5040, 80.6440],
    [16.5030, 80.6420],
    [16.5020, 80.6400], # ** Arrive Ramesh Hospital **
    [16.5020, 80.6400]  # Stopped
]

def simulate_movement():
    print(f"🚑 Starting MARG-AI Simulation for Vehicle {VEHICLE_ID}...")
    print("📍 Route: Benz Circle -> Ramesh Hospital (Vijayawada)")
    
    for coord in route_path:
        payload = {
            "id": VEHICLE_ID,
            "lat": coord[0],
            "lng": coord[1]
        }
        
        try:
            response = requests.post(BACKEND_URL, json=payload)
            if response.status_code == 200:
                data = response.json()
                triggered = data.get('triggeredSignal')
                status = f"🟢 Signal Triggered: {triggered}" if triggered else "⚪ Cruising"
                print(f"📍 [{coord[0]:.4f}, {coord[1]:.4f}] | {status}")
            else:
                print(f"❌ Failed to update: {response.status_code}")
        except Exception as e:
            print(f"⚠️ Error connecting to backend: {e}")
            
        time.sleep(2) # Wait 2 seconds before next move

    print("✅ Destination Reached.")

if __name__ == "__main__":
    simulate_movement()
