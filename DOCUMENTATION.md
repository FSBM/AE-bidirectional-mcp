# After Effects MCP Server - Project Documentation

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Architecture](#2-architecture)
- [3. System Components](#3-system-components)
- [4. Communication Flow](#4-communication-flow)
- [5. Project Structure](#5-project-structure)
- [6. Tech Stack](#6-tech-stack)
- [7. MCP Server (index.ts)](#7-mcp-server-indexts)
- [8. Bridge Panel (mcp-bridge-auto.jsx)](#8-bridge-panel-mcp-bridge-autojsx)
- [9. Python Automation Layer](#9-python-automation-layer)
- [10. Installation & Setup](#10-installation--setup)
- [11. Data Flow & File-Based IPC](#11-data-flow--file-based-ipc)
- [12. Available MCP Tools](#12-available-mcp-tools)
- [13. Effect Templates](#13-effect-templates)
- [14. Use Case: Video Ad Automation](#14-use-case-video-ad-automation)
- [15. Error Handling & Reliability](#15-error-handling--reliability)
- [16. Configuration Reference](#16-configuration-reference)

---

## 1. Project Overview

The **After Effects MCP Server** is a bridge system that enables AI assistants (like Claude) and external applications to programmatically control **Adobe After Effects** through the **Model Context Protocol (MCP)**. It abstracts After Effects' scripting complexity into a clean, tool-based interface.

### What Problem Does It Solve?

Adobe After Effects is a powerful motion graphics tool, but automating it requires deep knowledge of ExtendScript (a legacy JavaScript dialect). This project provides:

- A **standardized API** (via MCP) for controlling After Effects
- **AI-powered video automation** - Claude or other LLMs can create/modify compositions
- **Batch variation generation** - Create multiple versions of video ads programmatically
- **Cross-language support** - Control AE from TypeScript, Python, or any MCP client

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "External Clients"
        A[Claude / AI Assistant]
        B[Cursor IDE]
        C[Custom MCP Client]
    end

    subgraph "MCP Server Layer"
        D[Node.js MCP Server<br/>index.ts]
    end

    subgraph "File-Based IPC"
        E[ae_command.json]
        F[ae_mcp_result.json]
    end

    subgraph "Adobe After Effects"
        G[MCP Bridge Panel<br/>mcp-bridge-auto.jsx]
        H[Composition Engine]
        I[Layer System]
        J[Effect Pipeline]
        K[Render Queue]
    end

    subgraph "Python Automation"
        L[Introspection Scripts]
        M[Variation Scripts]
        N[Build Scripts]
    end

    A -->|MCP Protocol<br/>stdio| D
    B -->|MCP Protocol<br/>stdio| D
    C -->|MCP Protocol<br/>stdio| D

    D -->|Write Command| E
    E -->|Read Command<br/>every 2s| G
    G -->|Write Result| F
    F -->|Poll Result| D

    G --> H
    G --> I
    G --> J
    G --> K

    L -->|Write Command| E
    M -->|Write Command| E
    N -->|Write Command| E

    style D fill:#4a90d9,stroke:#2c5f8a,color:#fff
    style G fill:#9b59b6,stroke:#6c3483,color:#fff
    style E fill:#f39c12,stroke:#d68910,color:#fff
    style F fill:#f39c12,stroke:#d68910,color:#fff
```

---

## 2. Architecture

The system follows a **three-tier architecture** connected through file-based inter-process communication (IPC).

```mermaid
graph LR
    subgraph "Tier 1: Client"
        T1[AI Assistant / App]
    end

    subgraph "Tier 2: Server"
        T2[MCP Server<br/>Node.js + TypeScript]
    end

    subgraph "Tier 3: Execution"
        T3[After Effects<br/>Bridge Panel + ExtendScript]
    end

    T1 <-->|"MCP Protocol<br/>(JSON-RPC over stdio)"| T2
    T2 <-->|"File-Based IPC<br/>(JSON files on disk)"| T3

    style T1 fill:#3498db,stroke:#2471a3,color:#fff
    style T2 fill:#2ecc71,stroke:#229954,color:#fff
    style T3 fill:#e74c3c,stroke:#c0392b,color:#fff
```

### Why File-Based IPC?

| Approach | Pros | Cons |
|----------|------|------|
| **File-Based (chosen)** | Works with AE's sandboxed scripting, simple, debuggable, reliable | Slower (2s polling), disk I/O |
| Network Sockets | Faster, real-time | AE ExtendScript has limited socket support |
| CEP/UXP Panels | Native integration | Complex setup, version-dependent |

The file-based approach was chosen because After Effects' ExtendScript has reliable file I/O but limited networking capabilities. JSON files on disk provide a universal, debuggable bridge.

---

## 3. System Components

```mermaid
graph TD
    subgraph "Component Map"
        direction TB

        subgraph "MCP Server"
            S1[index.ts<br/>Main Server]
            S2[Tool Definitions<br/>Zod Schemas]
            S3[File I/O Manager<br/>Command/Result Queue]
        end

        subgraph "Bridge Panel"
            B1[mcp-bridge-auto.jsx<br/>ScriptUI Panel]
            B2[Command Dispatcher<br/>20+ Commands]
            B3[Built-in Functions<br/>Create/Modify/Query]
            B4[Effect Templates<br/>Presets Library]
        end

        subgraph "ExtendScript Modules"
            E1[createComposition.jsx]
            E2[createTextLayer.jsx]
            E3[createShapeLayer.jsx]
            E4[createSolidLayer.jsx]
            E5[setLayerProperties.jsx]
            E6[applyEffect.jsx]
            E7[getProjectInfo.jsx]
        end

        subgraph "Python Scripts"
            P1[Introspection<br/>Analyze Projects]
            P2[Variation<br/>Create Variants]
            P3[Utilities<br/>Fix/Verify/Debug]
        end

        subgraph "Installer"
            I1[install-bridge.js<br/>Cross-Platform]
        end

        S1 --> S2
        S1 --> S3
        B1 --> B2
        B2 --> B3
        B2 --> B4
        B2 --> E1
        B2 --> E2
        B2 --> E3
        B2 --> E4
        B2 --> E5
        B2 --> E6
        B2 --> E7
        I1 -->|Copies to AE| B1
    end
```

---

## 4. Communication Flow

### Command Lifecycle

```mermaid
sequenceDiagram
    participant Client as AI Client (Claude)
    participant MCP as MCP Server (Node.js)
    participant FS as File System
    participant AE as After Effects (Bridge Panel)

    Client->>MCP: MCP Tool Call (e.g., create-composition)
    MCP->>MCP: Validate parameters (Zod schema)
    MCP->>FS: Write ae_command.json<br/>{status: "pending", command: "...", params: {...}}
    MCP->>MCP: Start polling for result

    loop Every 2 seconds
        AE->>FS: Check ae_command.json
    end

    AE->>FS: Read command (status == "pending")
    AE->>FS: Update status to "running"
    AE->>AE: Execute ExtendScript function
    AE->>FS: Write ae_mcp_result.json<br/>{result: {...}, timestamp: "..."}

    MCP->>FS: Read ae_mcp_result.json
    MCP->>MCP: Validate result freshness (< 30s)
    MCP->>Client: Return result via MCP protocol
```

### Command Status State Machine

```mermaid
stateDiagram-v2
    [*] --> Pending: Command written to file
    Pending --> Running: Bridge panel picks up command
    Running --> Completed: Execution succeeds
    Running --> Error: Execution fails
    Completed --> [*]: Result returned to client
    Error --> [*]: Error returned to client

    note right of Pending: ae_command.json<br/>status = "pending"
    note right of Running: ae_command.json<br/>status = "running"
    note right of Completed: ae_mcp_result.json<br/>written with timestamp
```

---

## 5. Project Structure

```
after-effects-mcp/
│
├── src/                              # Source code (TypeScript + ExtendScript)
│   ├── index.ts                      # Main MCP server implementation
│   └── scripts/                      # ExtendScript files for After Effects
│       ├── mcp-bridge-auto.jsx       # Bridge panel (core - 2400+ lines)
│       ├── createComposition.jsx     # Composition creation
│       ├── createTextLayer.jsx       # Text layer creation
│       ├── createShapeLayer.jsx      # Shape layer creation
│       ├── createSolidLayer.jsx      # Solid/adjustment layer creation
│       ├── setLayerProperties.jsx    # Layer property modification
│       ├── getProjectInfo.jsx        # Project metadata retrieval
│       ├── getLayerInfo.jsx          # Layer information retrieval
│       ├── listCompositions.jsx      # Composition listing
│       ├── applyEffect.jsx           # Effect application
│       └── applyEffectTemplate.jsx   # Effect preset application
│
├── build/                            # Compiled output (generated by tsc)
│
├── assets/                           # Project assets & AE project files
│   ├── new-file-to-modify/           # Laptop project files
│   │   └── Laptop 10 Sec folder/    # Main AE project & footage
│   └── new-video-assets/             # Additional assets (backgrounds, etc.)
│
├── guideline-doc/                    # Internal documentation/guidelines
│
├── *.py                              # Python automation scripts (root)
│   ├── create_variation.py           # Generic composition variation creator
│   ├── create_laptop10sec_variation.py  # Laptop-specific variation
│   ├── introspect_laptop10sec.py     # Composition structure analyzer
│   ├── introspect_bg_comps.py        # Background comp analyzer
│   ├── build_flipkart_reveal.py      # Flipkart reveal animation builder
│   └── ...                           # Other utility scripts
│
├── *.jsx                             # Standalone ExtendScript files (root)
│   ├── flipkart_sale_v2.jsx          # Full Flipkart sale animation
│   ├── flipkart-reveal-setup.jsx     # Reveal animation setup
│   └── ...                           # Debug/test scripts
│
├── package.json                      # Node.js dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── install-bridge.js                 # Bridge panel installer
├── .gitignore                        # Git ignore rules
├── LICENSE                           # MIT License
└── README.md                         # Project readme
```

### File Type Breakdown

```mermaid
pie title "Codebase Composition by File Type"
    "TypeScript (.ts)" : 1
    "ExtendScript (.jsx)" : 15
    "Python (.py)" : 10
    "JavaScript (.js)" : 1
    "Config (JSON/etc)" : 4
```

---

## 6. Tech Stack

```mermaid
graph TD
    subgraph "Runtime & Languages"
        N[Node.js v14+]
        TS[TypeScript 5.2]
        ES[ExtendScript / JSX]
        PY[Python 3.x]
    end

    subgraph "Core Libraries"
        MCP["@modelcontextprotocol/sdk 1.0<br/>MCP Protocol Implementation"]
        ZOD["Zod 3.22<br/>Schema Validation"]
        NF["node-fetch 3.3<br/>HTTP Client"]
    end

    subgraph "Dev Tools"
        TSC[TypeScript Compiler]
        CF[copyfiles<br/>Build Artifact Copy]
        NPM[npm<br/>Package Manager]
    end

    subgraph "Target Platform"
        AE[Adobe After Effects<br/>2021 - 2026]
    end

    N --> TS
    TS --> MCP
    TS --> ZOD
    TS --> NF
    TSC --> TS
    CF --> TSC
    ES --> AE
    PY -->|File I/O| ES

    style MCP fill:#e74c3c,stroke:#c0392b,color:#fff
    style AE fill:#00005b,stroke:#000040,color:#fff
```

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | >= 14.x | Runtime for MCP server |
| TypeScript | ^5.2.2 | Type-safe server code |
| MCP SDK | ^1.0.0 | Model Context Protocol implementation |
| Zod | ^3.22.2 | Runtime schema validation for tool parameters |
| node-fetch | ^3.3.2 | HTTP client (for potential external APIs) |
| ExtendScript | ES3-based | After Effects native scripting |
| Python | 3.x | High-level automation scripts |
| copyfiles | ^2.4.1 | Cross-platform file copying during build |

---

## 7. MCP Server (index.ts)

The MCP server is the central hub that translates MCP tool calls into After Effects commands.

### Server Initialization Flow

```mermaid
flowchart TD
    A[Start: npm start] --> B[Initialize MCP Server<br/>name: 'aftereffects-mcp']
    B --> C[Register Tools]
    C --> D[Register Resources]
    D --> E[Register Prompts]
    E --> F[Connect via stdio transport]
    F --> G[Listening for MCP calls...]

    C --> C1[run-script]
    C --> C2[create-composition]
    C --> C3[setLayerKeyframe]
    C --> C4[setLayerExpression]
    C --> C5[apply-effect]
    C --> C6[apply-effect-template]
    C --> C7[get-results]
    C --> C8[get-help]

    D --> D1["aftereffects://compositions"]

    E --> E1[list-compositions]
    E --> E2[analyze-composition]
    E --> E3[create-composition guide]
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `writeCommandFile(command, params)` | Serializes command + params to `ae_command.json` with "pending" status |
| `waitForBridgeResult(timeout)` | Polls `ae_mcp_result.json` until result appears or timeout (default 5s) |
| `readResultsFromTempFile()` | Reads and parses the result JSON file |
| `clearResultsFile()` | Clears stale results before new commands |

### Tool Parameter Validation

All MCP tools use **Zod schemas** for parameter validation at runtime:

```typescript
// Example: create-composition tool schema
{
  name: z.string(),          // Composition name
  width: z.number(),         // Width in pixels (e.g., 1920)
  height: z.number(),        // Height in pixels (e.g., 1080)
  duration: z.number(),      // Duration in seconds
  frameRate: z.number()      // Frames per second (e.g., 30)
}
```

---

## 8. Bridge Panel (mcp-bridge-auto.jsx)

The bridge panel is the heart of the system - a ScriptUI panel running inside After Effects that continuously monitors for commands and executes them.

### Panel Lifecycle

```mermaid
flowchart TD
    A[After Effects Launched] --> B["Window > mcp-bridge-auto.jsx"]
    B --> C[Panel Opens<br/>ScriptUI Window]
    C --> D[Create UI<br/>Status, Log, Buttons]
    D --> E[Start Auto-Check Timer<br/>Interval: 2000ms]

    E --> F{Check ae_command.json}
    F -->|No command / not pending| G[Wait 2 seconds]
    G --> F

    F -->|Command found<br/>status == pending| H[Update status to 'running']
    H --> I[Dispatch to handler function]
    I --> J{Command Type?}

    J -->|createComposition| K1[Create AE Composition]
    J -->|createTextLayer| K2[Create Text Layer]
    J -->|createShapeLayer| K3[Create Shape Layer]
    J -->|setLayerProperties| K4[Modify Layer Props]
    J -->|setLayerKeyframe| K5[Add Keyframe]
    J -->|applyEffect| K6[Apply Effect]
    J -->|executeCustomScript| K7[Run Arbitrary Script]
    J -->|...20+ more| K8[Other Commands]

    K1 --> L[Write result to ae_mcp_result.json]
    K2 --> L
    K3 --> L
    K4 --> L
    K5 --> L
    K6 --> L
    K7 --> L
    K8 --> L

    L --> G
```

### Supported Commands

```mermaid
mindmap
  root((Bridge Panel<br/>Commands))
    Creation
      createComposition
      createTextLayer
      createShapeLayer
      createSolidLayer
    Modification
      setLayerProperties
      setLayerKeyframe
      setLayerExpression
    Effects
      applyEffect
      applyEffectTemplate
      bridgeTestEffects
    Query
      listCompositions
      getProjectInfo
      getLayerInfo
    Media
      importFootage
      addFootageToComp
    Advanced
      executeCustomScript
      logToPanel
```

### Layer Property System

The `setLayerProperties` function can modify these properties on any layer:

| Category | Properties |
|----------|------------|
| **Transform** | position, scale, rotation, anchorPoint, opacity |
| **Timing** | inPoint, outPoint, startTime |
| **Text** | text, fontSize, font, fillColor, justification |
| **Layer** | name, label, enabled, solo, shy |
| **3D** | threeDLayer, position (x,y,z) |

---

## 9. Python Automation Layer

The Python scripts provide high-level automation workflows that orchestrate multiple After Effects operations.

### Automation Workflow

```mermaid
flowchart LR
    subgraph "Phase 1: Introspect"
        I1[introspect_laptop10sec.py] --> I2[Analyze Comp Structure]
        I2 --> I3[Map Layers & Sub-Comps]
        I3 --> I4[Export Structure JSON]
    end

    subgraph "Phase 2: Plan"
        P1[Define Variation<br/>Text, Colors, Timing] --> P2[Generate ExtendScript]
    end

    subgraph "Phase 3: Execute"
        E1[Write Command JSON] --> E2[Bridge Panel Executes]
        E2 --> E3[Read Result]
        E3 --> E4{More Steps?}
        E4 -->|Yes| E1
        E4 -->|No| E5[Variation Complete]
    end

    I4 --> P1
    P2 --> E1

    style I1 fill:#3498db,stroke:#2471a3,color:#fff
    style P1 fill:#f39c12,stroke:#d68910,color:#fff
    style E5 fill:#2ecc71,stroke:#229954,color:#fff
```

### Python Script Reference

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `introspect_laptop10sec.py` | Analyze "Laptop 10 Sec" composition | AE project file | Layer tree structure |
| `introspect_bg_comps.py` | Analyze background compositions | AE project | Background layer details |
| `introspect_subcomps.py` | Examine nested sub-compositions | AE project | Sub-comp hierarchy |
| `create_variation.py` | Create generic composition variation | Variation config | New AE composition |
| `create_laptop10sec_variation.py` | Create Laptop 10s variant | Text/timing params | Modified composition |
| `build_flipkart_reveal.py` | Build Flipkart reveal animation | Animation params | Animated composition |
| `fix_timing.py` | Adjust animation timing | Timing corrections | Updated keyframes |
| `verify_variation.py` | Validate created variations | Expected vs actual | Pass/fail report |

---

## 10. Installation & Setup

### Installation Flow

```mermaid
flowchart TD
    A[Clone Repository] --> B[npm install]
    B --> C[npm run build<br/>tsc + copyfiles]
    C --> D[npm run install-bridge]

    D --> E{Detect OS}
    E -->|macOS| F[Scan /Applications/<br/>Adobe After Effects *]
    E -->|Windows| G["Scan C:\\Program Files\\<br/>Adobe After Effects *"]

    F --> H{AE Found?}
    G --> H

    H -->|Yes| I[Copy mcp-bridge-auto.jsx<br/>to ScriptUI Panels/]
    H -->|No| J[Error: AE not found]

    I --> K[Configure MCP Client<br/>Add server to config]
    K --> L[npm start]
    L --> M[Open AE > Window ><br/>mcp-bridge-auto.jsx]
    M --> N[System Ready]

    style N fill:#2ecc71,stroke:#229954,color:#fff
    style J fill:#e74c3c,stroke:#c0392b,color:#fff
```

### MCP Client Configuration

Add this to your MCP client configuration (Claude Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "AfterEffectsMCP": {
      "command": "node",
      "args": ["/path/to/after-effects-mcp/build/index.js"]
    }
  }
}
```

### Supported After Effects Versions

| Version | Year | Status |
|---------|------|--------|
| AE 2021 | v18.x | Supported |
| AE 2022 | v22.x | Supported |
| AE 2023 | v23.x | Supported |
| AE 2024 | v24.x | Supported |
| AE 2025 | v25.x | Supported (floating panel only) |
| AE 2026 | v26.x | Supported (floating panel only) |

---

## 11. Data Flow & File-Based IPC

### File Locations

All IPC happens through files in `~/Documents/ae-mcp-bridge/`:

```
~/Documents/ae-mcp-bridge/
├── ae_command.json       # Commands from server/scripts to AE
└── ae_mcp_result.json    # Results from AE back to server/scripts
```

### Command File Format (ae_command.json)

```json
{
  "command": "createTextLayer",
  "params": {
    "compName": "My Composition",
    "text": "Hello World",
    "fontSize": 72,
    "fontName": "Arial",
    "color": [1, 1, 1],
    "position": [960, 540]
  },
  "status": "pending",
  "timestamp": "2026-02-16T10:30:00.000Z"
}
```

### Result File Format (ae_mcp_result.json)

```json
{
  "result": {
    "success": true,
    "layerName": "Hello World",
    "layerIndex": 1,
    "compName": "My Composition"
  },
  "timestamp": "2026-02-16T10:30:02.000Z"
}
```

### Timing Diagram

```mermaid
gantt
    title Command Execution Timeline
    dateFormat ss
    axisFormat %S s

    section MCP Server
    Write command file       :a1, 00, 1s
    Polling for result       :a2, 01, 4s

    section File System
    Command file on disk     :b1, 00, 3s
    Result file on disk      :b2, 03, 2s

    section Bridge Panel
    Detect command (2s poll) :c1, 02, 1s
    Execute in AE            :c2, 02, 1s
    Write result             :c3, 03, 1s
```

### Timing Constants

| Parameter | Value | Description |
|-----------|-------|-------------|
| Poll Interval | 2000ms | How often bridge checks for commands |
| Result Timeout | 5000ms | Max wait for result before timeout |
| Stale Threshold | 30000ms | Result older than this triggers warning |

---

## 12. Available MCP Tools

### Tool Overview

```mermaid
graph TD
    subgraph "Composition Tools"
        T1["create-composition<br/>Create new comp with<br/>size, fps, duration, color"]
    end

    subgraph "Script Tools"
        T2["run-script<br/>Execute predefined<br/>ExtendScript in AE"]
        T3["get-results<br/>Retrieve last<br/>command results"]
        T4["get-help<br/>Get usage help<br/>for commands"]
    end

    subgraph "Animation Tools"
        T5["setLayerKeyframe<br/>Set property keyframe<br/>at specific time"]
        T6["setLayerExpression<br/>Apply/remove JS<br/>expressions on properties"]
    end

    subgraph "Effect Tools"
        T7["apply-effect<br/>Apply effect by<br/>name or matchName"]
        T8["apply-effect-template<br/>Apply predefined<br/>effect presets"]
    end

    subgraph "Test Tools"
        T9["test-animation<br/>Run animation<br/>test suite"]
        T10["run-bridge-test<br/>Test bridge<br/>connectivity"]
    end
```

### Detailed Tool Reference

| Tool | Parameters | Description |
|------|-----------|-------------|
| `create-composition` | name, width, height, duration, frameRate | Creates a new AE composition |
| `run-script` | scriptName, params (optional) | Runs a predefined ExtendScript file |
| `setLayerKeyframe` | compName, layerName, propertyName, time, value | Sets a keyframe on a layer property |
| `setLayerExpression` | compName, layerName, propertyName, expression, remove | Applies or removes an expression |
| `apply-effect` | compName, layerName, effectName, matchName | Applies a native AE effect |
| `apply-effect-template` | compName, layerName, templateName, params | Applies a predefined effect template |
| `get-results` | (none) | Returns the last command's result |
| `get-help` | (none) | Returns help documentation |

---

## 13. Effect Templates

The bridge panel includes predefined effect templates for common operations:

```mermaid
graph TD
    subgraph "Blur Effects"
        E1["Gaussian Blur<br/>Params: blurriness"]
        E2["Directional Blur<br/>Params: blurriness, direction"]
    end

    subgraph "Color Effects"
        E3["Color Balance<br/>Params: shadow/mid/highlight RGB"]
        E4["Brightness & Contrast<br/>Params: brightness, contrast"]
        E5["Curves<br/>Params: curve points"]
    end

    subgraph "Stylize Effects"
        E6["Glow<br/>Params: threshold, radius, intensity"]
        E7["Drop Shadow<br/>Params: opacity, distance, softness, color"]
    end

    subgraph "Composite Templates"
        E8["Cinematic Look<br/>= Curves + Glow + Vignette"]
        E9["Text Pop<br/>= Drop Shadow + Glow + Stroke"]
    end
```

| Template | Effect(s) Applied | Key Parameters |
|----------|------------------|----------------|
| Gaussian Blur | Gaussian Blur | blurriness (px) |
| Directional Blur | CC Directional Blur | blurriness, direction (degrees) |
| Color Balance | Color Balance (HLS) | shadow/midtone/highlight RGB values |
| Brightness & Contrast | Brightness & Contrast | brightness (-150 to 150), contrast (-150 to 150) |
| Curves | Curves | Channel curve control points |
| Glow | Glow | threshold, radius, intensity |
| Drop Shadow | Drop Shadow | opacity, distance, softness, color |
| Cinematic Look | Curves + Glow + Vignette | Combined parameters |
| Text Pop | Shadow + Glow + Stroke | Combined parameters |

---

## 14. Use Case: Video Ad Automation

The project is actively used to automate video advertisement creation (Dell laptop promotions, Flipkart campaigns).

### Ad Creation Pipeline

```mermaid
flowchart TD
    A[Template AE Project<br/>Laptop 10 Sec.aep] --> B[Introspect Structure]
    B --> C[Identify Editable Layers<br/>Text, Images, Colors]

    C --> D{Variation Type}

    D -->|Text Change| E1[Update Headlines<br/>Product Names, CTAs]
    D -->|Visual Change| E2[Swap Backgrounds<br/>Change Colors/Effects]
    D -->|Timing Change| E3[Adjust Animation<br/>Speed, Duration]
    D -->|Full Variant| E4[All of the Above]

    E1 --> F[Execute via Bridge Panel]
    E2 --> F
    E3 --> F
    E4 --> F

    F --> G[New Composition Created]
    G --> H[Verify Output]
    H --> I[Add to Render Queue]

    style A fill:#9b59b6,stroke:#6c3483,color:#fff
    style G fill:#2ecc71,stroke:#229954,color:#fff
```

### Project Composition Structure

```mermaid
graph TD
    Main["Laptop-10Sec - 13th Feb<br/>(Main Comp - 10s)"]

    Main --> F1["F1 - Product Reveal<br/>(Sub-Comp)"]
    Main --> F2["F2 - Features<br/>(Sub-Comp)"]
    Main --> F3["F3 - Outro/CTA<br/>(Sub-Comp)"]
    Main --> BG["Background Layers<br/>(Animations)"]
    Main --> TR["Transitions<br/>(Between Scenes)"]

    F1 --> F1a[Product Image]
    F1 --> F1b[Product Name Text]
    F1 --> F1c[Price Text]

    F2 --> F2a[Feature List]
    F2 --> F2b[Feature Icons]

    F3 --> F3a[CTA Button]
    F3 --> F3b[Logo]
    F3 --> F3c[Brand Colors]

    style Main fill:#e74c3c,stroke:#c0392b,color:#fff
    style F1 fill:#3498db,stroke:#2471a3,color:#fff
    style F2 fill:#3498db,stroke:#2471a3,color:#fff
    style F3 fill:#3498db,stroke:#2471a3,color:#fff
```

---

## 15. Error Handling & Reliability

### Error Handling Strategy

```mermaid
flowchart TD
    A[Command Received] --> B{Valid JSON?}
    B -->|No| C[Return Parse Error]
    B -->|Yes| D{Valid Parameters?}
    D -->|No| E[Return Validation Error<br/>via Zod]
    D -->|Yes| F[Write Command File]
    F --> G{Bridge Running?}
    G -->|No Command Pickup| H[Timeout after 5s]
    H --> I[Return Timeout Error]
    G -->|Yes| J[Execute in AE]
    J --> K{AE Error?}
    K -->|Yes| L[Catch Error + Line Number]
    L --> M[Write Error to Result File]
    K -->|No| N[Write Success to Result File]
    N --> O{Result Fresh?}
    O -->|> 30s old| P[Stale Result Warning]
    O -->|< 30s old| Q[Return Result]

    style C fill:#e74c3c,stroke:#c0392b,color:#fff
    style E fill:#e74c3c,stroke:#c0392b,color:#fff
    style I fill:#f39c12,stroke:#d68910,color:#fff
    style M fill:#e74c3c,stroke:#c0392b,color:#fff
    style Q fill:#2ecc71,stroke:#229954,color:#fff
```

### Reliability Mechanisms

| Mechanism | Description |
|-----------|-------------|
| **Status Tracking** | Commands have `pending` -> `running` -> `completed` status to prevent double-execution |
| **Timestamp Validation** | Results include timestamps; stale results (>30s) trigger warnings |
| **Error Capture** | ExtendScript try/catch blocks capture errors with line numbers |
| **File Locking** | Status field prevents concurrent command execution |
| **Graceful Fallback** | Missing result files return informative error messages, not crashes |
| **Logging** | Bridge panel has a built-in log UI for debugging |

---

## 16. Configuration Reference

### npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `build` | `tsc && copyfiles -u 1 "src/scripts/**/*" build` | Compile TS + copy JSX scripts to build/ |
| `start` | `node build/index.js` | Start the MCP server |
| `install-bridge` | `node install-bridge.js` | Install bridge panel to After Effects |
| `postinstall` | `npm run build` | Auto-build after npm install |

### TypeScript Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| target | ES2022 | Modern JS output |
| module | Node16 | ES module support |
| strict | true | Full type checking |
| outDir | ./build | Output directory |

### Environment Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | v14.x | v18+ |
| After Effects | 2021 | 2024+ |
| OS | macOS / Windows | Any |
| Disk Space | ~50MB | ~100MB (with assets) |

---

## Appendix: Quick Reference Card

```
START SERVER:       npm start
BUILD PROJECT:      npm run build
INSTALL TO AE:      npm run install-bridge

COMMAND FILE:       ~/Documents/ae-mcp-bridge/ae_command.json
RESULT FILE:        ~/Documents/ae-mcp-bridge/ae_mcp_result.json

BRIDGE PANEL:       After Effects > Window > mcp-bridge-auto.jsx
POLL INTERVAL:      2 seconds
RESULT TIMEOUT:     5 seconds
```

---

*This documentation was generated for the After Effects MCP Server project (v1.0.0).*
