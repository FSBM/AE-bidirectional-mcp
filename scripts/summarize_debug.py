import json
import os

try:
    with open(os.path.expanduser("~/Documents/ae-mcp-bridge/ae_mcp_result.json"), "r") as f:
        data = json.load(f)
        
    if data.get("status") == "success":
        report = json.loads(data.get("result")).get("report")
        if report:
            print(f"Comp: {report.get('name')}")
            print("-" * 30)
            if report.get("layers"):
                for l in report.get("layers"):
                    print(f"{l.get('index')}: '{l.get('name')}' (Src: '{l.get('source')}') [E:{l.get('enabled')} L:{l.get('locked')}]")
            else:
                print("No layers found or report structure weird.")
        else:
            print("No report object in result:", data.get("result"))
    else:
        print("Error in result:", data)
except Exception as e:
    print("Error reading/parsing:", e)
