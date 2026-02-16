# LLM-Driven After Effects Automation

This document outlines the workflow and architecture for automating Adobe After Effects using Large Language Models (LLMs) within this project.

## 1. High-Level Concept: "The LLM as Director"

In this system, the **LLM (Large Language Model)** acts as the **Director** and **Lead Developer**. It does not interact with the After Effects UI directly (e.g., clicking buttons). Instead, it **writes code** that After Effects executes.

The LLM is responsible for:
1.  **Understanding** the user's creative intent (e.g., "Change the background to blue").
2.  **Introspecting** the current state of the After Effects project to understand layer names, indices, and properties.
3.  **Generating** robust, atomic scripts (Python + ExtendScript) to perform the changes.
4.  **Executing** and **Verifying** the changes via the bridge system.

## 2. The Automation Pipeline

The workflow follows a strict 4-step cycle: **Introspect -> Plan -> Generate -> Execute**.

### Step 1: Introspection (The "Eyes")
Before making changes, the LLM must "see" what is inside the project. Since it cannot look at the screen, it runs **Introspection Scripts**.

-   **Mechanism**: The LLM runs a Python script (e.g., `introspect_laptop10sec.py`) which sends a command to AE to dump the project structure (layers, comps, props) into a JSON file.
-   **Result**: The LLM reads this JSON to know that "Background Layer" is Layer #5 in "Comp A".

### Step 2: Planning
The LLM devises a plan based on the introspection data.
-   *User Request*: "Make the background move."
-   *LLM Plan*:
    1.  Duplicate "Comp A" to preserve the original.
    2.  Locate "Background Layer" (known from Step 1).
    3.  Add "Transform" effect.
    4.  Set keyframes on Position (0s: [0,0], 10s: [100,0]).

### Step 3: Generation (The "Hands")
The LLM writes a self-contained **Python Script** (e.g., `create_moving_bg_variation.py`) that encapsulates the plan.
-   This script contains **ExtendScript** (Adobe's JavaScript) embedded as a string.
-   It handles error checking (try/catch) and logging within the script itself.

### Step 4: Execution (The Bridge)
The Python script is executed, triggering the **Bridge System**:

1.  **Python** writes a JSON command to `~/Documents/ae-mcp-bridge/ae_command.json`.
2.  **Bridge Panel (in AE)** detects the modification to the file.
3.  **Bridge Panel** executes the embedded ExtendScript payload.
4.  **After Effects** performs the actions (creates comps, layers, keyframes).
5.  **Bridge Panel** writes the result (success/fail) to `~/Documents/ae-mcp-bridge/ae_mcp_result.json`.
6.  **Python** reads the result file and reports back to the LLM.

## 3. Architecture Diagram

```mermaid
graph TD
    User[User Intent] --> LLM[LLM (Claude/Agent)]
    
    subgraph "Host System (Python)"
        LLM -->|Writes| PyScript[Automation Script\n(create_variation.py)]
        PyScript -->|Writes| CmdJSON[ae_command.json]
        ResJSON[ae_mcp_result.json] -->|Reads| PyScript
    end
    
    subgraph "Adobe After Effects"
        Bridge[Bridge Panel\n(mcp-bridge-auto.jsx)]
        Engine[ExtendScript Engine]
        
        CmdJSON -->|Reads (Poll)| Bridge
        Bridge -->|Executes| Engine
        Engine -->|Modifies| Project[Active Project]
        Bridge -->|Writes| ResJSON
    end
```

## 4. Key Components

### 1. The Bridge (`mcp-bridge-auto.jsx`)
A permanent panel running in After Effects. It acts as the local server, listening for commands from the "outside world" (files).

### 2. Introspection Scripts
Scripts like `introspect_laptop10sec.py`. These are crucial. Without them, the LLM is "blind" and will guess layer names, leading to errors.
*   **Best Practice**: Always introspect before assuming a layer name exists.

### 3. Variation Scripts
Scripts like `create_moving_bg_variation.py`. These are the "workers".
*   **Pattern**: They typically duplicate a "Master Comp" to a new "Variation Comp" (e.g., "Laptop-10Sec-Variant-1") and apply changes there. This ensures non-destructive editing.

## 5. Example Walkthrough: `create_moving_bg_variation.py`

This script demonstrates the sophisticated capabilities of the LLM-driven approach:

1.  **Find & Duplicate**: It searches for the composition "Laptop-10Sec - 13th Feb" and duplicates it to "Laptop-10Sec-MovingBG-Variation".
2.  **Recursive Search**: It finds all sub-compositions (F1, F2... F6) and duplicates them too, replacing the references in the main comp. This is a complex operation that handles nested dependencies.
3.  **Asset Injection**: It locates "Moving background.png" in the project bin and adds it to the new compositions.
4.  **Animation**: It calculates the duration and sets Keyframes for Position (parallax effect) and Scale programmatically.
5.  **Cleanup**: It iterates through layers to disable old backgrounds ("desk", "background"), preventing visual clutter.
6.  **Feedback**: It outputs a JSON result indicating exactly what was changed, which the LLM reads to confirm success.

## 6. Why use this approach?

-   **Reliability**: Using file-based IPC avoids network permissions issues common in corporate environments or legacy AE versions.
-   **State Awareness**: The Introspection->Generation loop allows the LLM to handle complex projects where layer indices shift.
-   **Verification**: The system returns explicit success/error messages, allowing the LLM to self-correct (e.g., "Layer 'BG' not found" -> LLM retries with 'Background').
