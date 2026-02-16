import json
import os
import sys
import time

def send_command(code):
    cmd = {
        "command": "executeCustomScript",
        "args": {"code": code},
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "status": "pending"
    }

    # Clear result file
    result_path = os.path.expanduser("~/Documents/ae-mcp-bridge/ae_mcp_result.json")
    with open(result_path, "w") as f:
        json.dump({"status": "waiting", "message": "Waiting...", "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z")}, f)

    # Write command
    cmd_path = os.path.expanduser("~/Documents/ae-mcp-bridge/ae_command.json")
    with open(cmd_path, "w") as f:
        json.dump(cmd, f, indent=2)

    print("Command sent to After Effects. Waiting for response...")

    # Wait for response (timeout 60s)
    for _ in range(60):
        time.sleep(1)
        if os.path.exists(result_path):
            try:
                with open(result_path, "r") as f:
                    data = json.load(f)
                    if data.get("status") != "waiting":
                        return data
            except:
                pass
    
    return {"status": "timeout", "message": "No response from AE"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python send_ae_command.py <script_file_or_code>")
        sys.exit(1)

    input_arg = sys.argv[1]
    
    if os.path.exists(input_arg):
        with open(input_arg, "r") as f:
            code = f.read()
    else:
        code = input_arg

    # Wrap in IIFE if not already
    if not code.strip().startswith("(function"):
        code = f"(function() {{ {code} }})()"

    result = send_command(code)
    print(json.dumps(result, indent=2))
