#!/usr/bin/env python3
"""
Launcher: Sends the V2 ExtendScript to After Effects via the MCP bridge.
Writes a single 'executeCustomScript' command that loads and runs flipkart_sale_v2.jsx
"""

import json
import os
import time

BRIDGE_DIR = os.path.expanduser("~/Documents/ae-mcp-bridge")
CMD_FILE = os.path.join(BRIDGE_DIR, "ae_command.json")
RESULT_FILE = os.path.join(BRIDGE_DIR, "ae_mcp_result.json")

SCRIPT_PATH = "/Users/shyamkrishnanmn/Documents/Video-Automation/after-effects-mcp/flipkart_sale_v2.jsx"

def clear_result():
    """Clear previous result file"""
    if os.path.exists(RESULT_FILE):
        os.remove(RESULT_FILE)

def send_command(script, args, timeout=60):
    """Write command to bridge and wait for result"""
    clear_result()
    cmd = {
        "command": script,
        "args": args,
        "id": f"v2_launch_{int(time.time() * 1000)}"
    }
    with open(CMD_FILE, 'w') as f:
        json.dump(cmd, f)
    
    print(f"Command sent. Waiting up to {timeout}s for AE to execute...")
    start = time.time()
    while time.time() - start < timeout:
        if os.path.exists(RESULT_FILE):
            try:
                with open(RESULT_FILE, 'r') as f:
                    result = json.load(f)
                if result.get("status") == "completed":
                    return result
            except (json.JSONDecodeError, IOError):
                pass
        time.sleep(2)
        elapsed = int(time.time() - start)
        if elapsed % 10 == 0 and elapsed > 0:
            print(f"  ...still waiting ({elapsed}s)")
    
    print("Timeout — check After Effects manually")
    return None

print("=" * 60)
print("  Flipkart Sale V2 — Remotion-Quality Build")
print("=" * 60)
print()
print(f"Script: {SCRIPT_PATH}")
print(f"Bridge: {CMD_FILE}")
print()

# Send the command to load and execute the .jsx file
code = f'$.evalFile("{SCRIPT_PATH}");'
print("Sending executeCustomScript command...")
result = send_command("executeCustomScript", {"code": code}, timeout=90)

if result:
    status = result.get("status", "unknown")
    data = result.get("data", "")
    error = result.get("error", "")
    
    print()
    print(f"Status: {status}")
    if data:
        print(f"Result: {data}")
    if error:
        print(f"Error: {error}")
    print()
    
    if status == "completed" and not error:
        print("SUCCESS! Video built in After Effects.")
        print("  -> Composition: Flipkart_Sale_V2")
        print("  -> Output: ~/Desktop/Flipkart_Sale_V2.mov")
        print("  -> Open AE to preview and render")
    else:
        print("Something went wrong. Check After Effects for errors.")
else:
    print("No response received. Make sure:")
    print("  1. After Effects is running")
    print("  2. The MCP Bridge panel is open and polling")
    print("  3. Check AE's ExtendScript console for errors")
