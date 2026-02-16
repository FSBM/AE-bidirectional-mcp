#!/usr/bin/env python3
"""Flipkart Product Reveal — AE Project Builder via MCP Bridge"""
import json, time, sys

BRIDGE_CMD = "/Users/shyamkrishnanmn/Documents/ae-mcp-bridge/ae_command.json"
BRIDGE_RES = "/Users/shyamkrishnanmn/Documents/ae-mcp-bridge/ae_mcp_result.json"
ASSETS = "/Users/shyamkrishnanmn/Documents/Remotion-test/flip-kart-assets/"

def send(command, args, wait=5):
    cmd = {"command": command, "args": args, 
           "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z"), "status": "pending"}
    with open(BRIDGE_CMD, "w") as f:
        json.dump(cmd, f, indent=2)
    time.sleep(wait)
    with open(BRIDGE_RES, "r") as f:
        result = f.read()
    r = json.loads(result)
    status = r.get("status", r.get("success", "?"))
    print(f"  [{command}] {status} — {r.get('message', '')[:80]}")
    if status == "error":
        print(f"    ERROR: {r.get('message','')}")
    return r

# ========== PHASE 1: Use known comp index ==========
print("\n===== PHASE 1: Using known comp index =====")
comp_idx = 5  # Known from prior discovery

# ========== PHASE 2: Add layers to composition ==========
print("\n===== PHASE 2: Adding layers to composition =====")

# Add layers — last added ends up on top
# Order: Background first (will be moved to back), then overlays, then foreground elements

send("addFootageToComp", {
    "compIndex": comp_idx, "itemName": "Bg-1.png",
    "layerName": "Background", "moveToBack": True
})

send("addFootageToComp", {
    "compIndex": comp_idx, "itemName": "F-bg-1.png",
    "layerName": "FK_BG_Overlay"
})

send("addFootageToComp", {
    "compIndex": comp_idx, "itemName": "box.png",
    "layerName": "Hero_Product_Box",
    "position": [540, 750], "scale": [85, 85]
})

send("addFootageToComp", {
    "compIndex": comp_idx, "itemName": "Sale logo.png",
    "layerName": "Sale_Logo",
    "position": [540, 350], "scale": [55, 55]
})

send("addFootageToComp", {
    "compIndex": comp_idx, "itemName": "Rectangle price holder.png",
    "layerName": "Price_Holder",
    "position": [540, 1400], "scale": [130, 130]
})

send("addFootageToComp", {
    "compIndex": comp_idx, "itemName": "cursor.png",
    "layerName": "Cursor",
    "position": [1300, 1500], "scale": [250, 250]
})

# ========== Get layer indices ==========
print("\n===== Checking layer order =====")
layers = send("getLayerInfo", {})
layer_map = {}
for l in layers.get("layers", []):
    layer_map[l["name"]] = l["index"]
    print(f"  Layer {l['index']}: {l['name']}")

# ========== PHASE 3: Animations ==========
print("\n===== PHASE 3: Animations =====")

# --- Background: Subtle slow zoom ---
bg_idx = layer_map.get("Background", 6)
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": bg_idx,
    "propertyName": "Scale", "timeInSeconds": 0, "value": [100, 100]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": bg_idx,
    "propertyName": "Scale", "timeInSeconds": 10, "value": [110, 110]
})

# --- FK BG Overlay: Fade in ---
fk_idx = layer_map.get("FK_BG_Overlay", 5)
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": fk_idx,
    "propertyName": "Opacity", "timeInSeconds": 0, "value": 0
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": fk_idx,
    "propertyName": "Opacity", "timeInSeconds": 1.0, "value": 70
})

# --- Sale Logo: Slide in from top + scale bounce ---
sale_idx = layer_map.get("Sale_Logo", 3)
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": sale_idx,
    "propertyName": "Position", "timeInSeconds": 0, "value": [540, -400]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": sale_idx,
    "propertyName": "Position", "timeInSeconds": 1.2, "value": [540, 350]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": sale_idx,
    "propertyName": "Scale", "timeInSeconds": 0.8, "value": [0, 0]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": sale_idx,
    "propertyName": "Scale", "timeInSeconds": 1.5, "value": [60, 60]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": sale_idx,
    "propertyName": "Scale", "timeInSeconds": 1.8, "value": [55, 55]
})

# --- Hero Product Box: Scale reveal + float ---
box_idx = layer_map.get("Hero_Product_Box", 4)
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": box_idx,
    "propertyName": "Scale", "timeInSeconds": 0.5, "value": [0, 0]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": box_idx,
    "propertyName": "Scale", "timeInSeconds": 2.0, "value": [90, 90]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": box_idx,
    "propertyName": "Scale", "timeInSeconds": 2.4, "value": [85, 85]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": box_idx,
    "propertyName": "Opacity", "timeInSeconds": 0.5, "value": 0
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": box_idx,
    "propertyName": "Opacity", "timeInSeconds": 1.5, "value": 100
})
# Float expression
send("setLayerExpression", {
    "compIndex": comp_idx, "layerIndex": box_idx,
    "propertyName": "Position",
    "expressionString": "value + [0, Math.sin(time * 2) * 15]"
})

# --- Price Holder: Pop up from below (3.5s - 5s) ---
price_idx = layer_map.get("Price_Holder", 2)
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": price_idx,
    "propertyName": "Position", "timeInSeconds": 3.5, "value": [540, 2200]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": price_idx,
    "propertyName": "Position", "timeInSeconds": 4.5, "value": [540, 1350]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": price_idx,
    "propertyName": "Position", "timeInSeconds": 4.8, "value": [540, 1400]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": price_idx,
    "propertyName": "Scale", "timeInSeconds": 3.5, "value": [0, 0]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": price_idx,
    "propertyName": "Scale", "timeInSeconds": 4.5, "value": [140, 140]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": price_idx,
    "propertyName": "Scale", "timeInSeconds": 5.0, "value": [130, 130]
})

# --- Cursor: Move in, click, move out (3s - 7s) ---
cur_idx = layer_map.get("Cursor", 1)
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": cur_idx,
    "propertyName": "Position", "timeInSeconds": 3.0, "value": [1300, 1500]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": cur_idx,
    "propertyName": "Position", "timeInSeconds": 4.0, "value": [620, 1400]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": cur_idx,
    "propertyName": "Position", "timeInSeconds": 6.0, "value": [620, 1400]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": cur_idx,
    "propertyName": "Position", "timeInSeconds": 7.0, "value": [1300, 1500]
})
# Click scale effect
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": cur_idx,
    "propertyName": "Scale", "timeInSeconds": 4.3, "value": [250, 250]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": cur_idx,
    "propertyName": "Scale", "timeInSeconds": 4.5, "value": [200, 200]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": cur_idx,
    "propertyName": "Scale", "timeInSeconds": 4.7, "value": [250, 250]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": cur_idx,
    "propertyName": "Scale", "timeInSeconds": 5.0, "value": [200, 200]
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": cur_idx,
    "propertyName": "Scale", "timeInSeconds": 5.2, "value": [250, 250]
})

# ========== PHASE 4: Add text layers + effects ==========
print("\n===== PHASE 4: Text layers & effects =====")

# Price text
send("createTextLayer", {
    "compName": "Flipkart_Product_Reveal",
    "text": "₹999", "position": [540, 1420],
    "fontSize": 64, "color": [1, 1, 1],
    "fontFamily": "Arial-BoldMT", "alignment": "center",
    "duration": 10
})

# CTA text
send("createTextLayer", {
    "compName": "Flipkart_Product_Reveal",
    "text": "SHOP NOW", "position": [540, 1700],
    "fontSize": 48, "color": [1, 0.84, 0],
    "fontFamily": "Arial-BoldMT", "alignment": "center",
    "duration": 10
})

# Subtitle
send("createTextLayer", {
    "compName": "Flipkart_Product_Reveal",
    "text": "Limited Time Offer!", "position": [540, 1580],
    "fontSize": 36, "color": [1, 1, 1],
    "fontFamily": "Arial", "alignment": "center",
    "duration": 10
})

# Get updated layer list
print("\n===== Updated layer list =====")
layers2 = send("getLayerInfo", {})
layer_map2 = {}
for l in layers2.get("layers", []):
    layer_map2[l["name"]] = l["index"]
    print(f"  Layer {l['index']}: {l['name']}")

# Animate text layers
price_txt_idx = layer_map2.get("₹999", 1)
cta_idx = layer_map2.get("SHOP NOW", 2)
sub_idx = layer_map2.get("Limited Time Offer!", 3)

# Price text fade in
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": price_txt_idx,
    "propertyName": "Opacity", "timeInSeconds": 4.0, "value": 0
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": price_txt_idx,
    "propertyName": "Opacity", "timeInSeconds": 4.8, "value": 100
})

# CTA fade in + pulse
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": cta_idx,
    "propertyName": "Opacity", "timeInSeconds": 5.0, "value": 0
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": cta_idx,
    "propertyName": "Opacity", "timeInSeconds": 5.8, "value": 100
})
send("setLayerExpression", {
    "compIndex": comp_idx, "layerIndex": cta_idx,
    "propertyName": "Scale",
    "expressionString": "t = Math.max(time - 5.8, 0); s = 100 + Math.sin(t * 4) * 5; [s, s]"
})

# Subtitle fade in
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": sub_idx,
    "propertyName": "Opacity", "timeInSeconds": 5.5, "value": 0
})
send("setLayerKeyframe", {
    "compIndex": comp_idx, "layerIndex": sub_idx,
    "propertyName": "Opacity", "timeInSeconds": 6.3, "value": 100
})

# ========== PHASE 5: Effects ==========
print("\n===== PHASE 5: Effects =====")

# Drop shadow on product box
box_idx2 = layer_map2.get("Hero_Product_Box", box_idx)
send("applyEffectTemplate", {
    "compIndex": comp_idx, "layerIndex": box_idx2,
    "templateName": "drop-shadow"
})

# Drop shadow on price holder
price_h_idx2 = layer_map2.get("Price_Holder", price_idx)
send("applyEffectTemplate", {
    "compIndex": comp_idx, "layerIndex": price_h_idx2,
    "templateName": "drop-shadow"
})

# ========== PHASE 6: Render Queue ==========
print("\n===== PHASE 6: Add to render queue =====")
send("executeCustomScript", {
    "code": """
        var comp = null;
        for(var i=1;i<=app.project.numItems;i++){
            if(app.project.item(i).name=='Flipkart_Product_Reveal'){comp=app.project.item(i);break;}
        }
        if(comp){
            var rq = app.project.renderQueue.items.add(comp);
            var om = rq.outputModule(1);
            om.file = new File('~/Desktop/Flipkart_Product_Reveal_v1.mov');
            'Added to render queue: ~/Desktop/Flipkart_Product_Reveal_v1.mov';
        } else { 'Comp not found'; }
    """
})

print("\n===== DONE! Flipkart Product Reveal created! =====")
print("Check After Effects — the composition should be ready.")
print("Render output will be at: ~/Desktop/Flipkart_Product_Reveal_v1.mov")
