import json
import os

# This script creates a variation of the dell laptop ad by:
# 1. Duplicating the main "laptop" comp
# 2. Changing headline text in F1
# 3. Adjusting timing to be snappier  
# 4. Modifying some visual properties

code = r"""(function() {
    app.beginUndoGroup("Create Dell Laptop Ad Variation");
    
    var project = app.project;
    var mainComp = null;
    
    // Find the main "laptop" comp
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (item instanceof CompItem && item.name === "laptop" && item.numLayers === 7) {
            mainComp = item;
            break;
        }
    }
    
    if (!mainComp) return JSON.stringify({error: "Main laptop comp not found"});
    
    // Duplicate the main comp
    var newComp = mainComp.duplicate();
    newComp.name = "Dell Laptop Ad - Variation 2";
    newComp.duration = 7; // Set to exactly 7 seconds
    
    // ============================================
    // Now we need to modify the sub-compositions
    // We'll duplicate the key sub-comps so changes don't affect the original
    // ============================================
    
    // Find and duplicate F1
    var origF1 = null;
    var origF2 = null;
    var origF3 = null;
    
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (item instanceof CompItem) {
            if (item.name === "F1" && item.id === 3224) origF1 = item;
            if (item.name === "F2" && item.id === 3994) origF2 = item;
            if (item.name === "F3" && item.id === 4192) origF3 = item;
        }
    }
    
    // Duplicate F1 for our variation
    var newF1 = origF1.duplicate();
    newF1.name = "F1_V2";
    
    // Duplicate F2 for our variation  
    var newF2 = origF2.duplicate();
    newF2.name = "F2_V2";
    
    // Duplicate F3 for our variation
    var newF3 = origF3.duplicate();
    newF3.name = "F3_V2";
    
    // ============================================
    // Replace sub-comp references in the new main comp
    // ============================================
    for (var j = 1; j <= newComp.numLayers; j++) {
        var layer = newComp.layer(j);
        if (layer.source && layer.source instanceof CompItem) {
            if (layer.source.name === "F1" && layer.source.id === 3224) {
                layer.replaceSource(newF1, false);
                layer.name = "F1_V2";
            }
            if (layer.source.name === "F2" && layer.source.id === 3994) {
                layer.replaceSource(newF2, false);
                layer.name = "F2_V2";
            }
            if (layer.source.name === "F3" && layer.source.id === 4192) {
                layer.replaceSource(newF3, false);
                layer.name = "F3_V2";
            }
        }
    }
    
    // ============================================
    // CHANGE 1: Modify headline text in F1_V2
    // ============================================
    for (var j = 1; j <= newF1.numLayers; j++) {
        var layer = newF1.layer(j);
        if (layer instanceof TextLayer && layer.name.indexOf("RTX 3050 Gaming") === 0 && layer.enabled) {
            var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
            var textDoc = textProp.value;
            textDoc.text = "Mega Deals on\nDell Inspiron Laptops";
            textDoc.fillColor = [1, 0.92, 0.016]; // Flipkart yellow
            textDoc.fontSize = 62;
            textProp.setValue(textDoc);
            layer.name = "Headline V2";
        }
    }
    
    // ============================================
    // CHANGE 2: Modify timing in the main comp - make it snappier
    // Shift F2 to start slightly earlier, F3 slightly earlier
    // ============================================
    for (var j = 1; j <= newComp.numLayers; j++) {
        var layer = newComp.layer(j);
        // Adjust F2 timing - start a tiny bit earlier
        if (layer.name === "F2_V2") {
            layer.startTime = 1.5;
            layer.inPoint = 1.5;
        }
        // Adjust F3 timing
        if (layer.name === "F3_V2") {
            layer.startTime = 4.5;
            layer.inPoint = 4.5;
        }
        // Adjust transition timing
        if (layer.name === "Simple Distorted Zoom Out") {
            layer.inPoint = 1.2;
        }
        // Light leak timing
        if (layer.name === "Generated Light Leak 1") {
            layer.inPoint = 4.0;
        }
    }
    
    // ============================================
    // CHANGE 3: Add a Curves effect on F2_V2 for different color grade
    // ============================================
    // Add a subtle Brightness & Contrast adjustment to F2's product layer
    for (var j = 1; j <= newF2.numLayers; j++) {
        var layer = newF2.layer(j);
        if (layer.name === "product" && layer.source instanceof CompItem) {
            // Add Brightness & Contrast effect  
            var fx = layer.effect.addProperty("ADBE Brightness & Contrast 2");
            fx.property("Brightness").setValue(15);
            fx.property("Contrast").setValue(25);
        }
    }
    
    // ============================================
    // CHANGE 4: Modify the price/copy section in F2
    // ============================================
    // Find the "copy" sub-comp inside F2 and look for text layers
    var copyComp = null;
    for (var j = 1; j <= newF2.numLayers; j++) {
        var layer = newF2.layer(j);
        if (layer.name === "copy" && layer.source instanceof CompItem) {
            // Duplicate the copy comp for our variation
            var newCopy = layer.source.duplicate();
            newCopy.name = "copy_V2";
            layer.replaceSource(newCopy, false);
            copyComp = newCopy;
            break;
        }
    }
    
    // ============================================
    // CHANGE 5: Add a subtle scale pulse animation to the logo in F3
    // ============================================
    for (var j = 1; j <= newF3.numLayers; j++) {
        var layer = newF3.layer(j);
        if (layer.name === "logo" && layer.source instanceof CompItem) {
            // Add a gentle scale overshoot by adding keyframes
            var scaleProp = layer.property("ADBE Transform Group").property("Scale");
            // Clear any existing expression temporarily and add keyframes
            // Actually, the logo already has an AC expression for bounce-in
            // Let's leave it and instead add a Glow effect for visual punch
            var glowFx = layer.effect.addProperty("ADBE Glo2");
            glowFx.property("Glow Threshold").setValue(60);
            glowFx.property("Glow Radius").setValue(15);
            glowFx.property("Glow Intensity").setValue(0.5);
        }
    }
    
    // ============================================
    // CHANGE 6: Modify the bank strip position in F3 for visual variation
    // ============================================
    for (var j = 1; j <= newF3.numLayers; j++) {
        var layer = newF3.layer(j);
        if (layer.name === "Bank Strip_Eng 1440x200 copy.png") {
            // Adjust position - move it slightly higher
            var posProp = layer.property("ADBE Transform Group").property("Position");
            if (posProp.numKeys >= 2) {
                // Modify the end keyframe to be higher
                posProp.setValueAtKey(2, [540, 1480, 0]);
            }
            // Make it fade in faster
            var opProp = layer.property("ADBE Transform Group").property("Opacity");
            if (opProp.numKeys >= 2) {
                opProp.setValueAtKey(1, 0);
                opProp.setValueAtKey(2, 100);
                // Adjust timing for faster fade
                opProp.setValueAtTime(0.2, 100);
            }
        }
    }
    
    // Set the new comp as active
    newComp.openInViewer();
    
    app.endUndoGroup();
    
    return JSON.stringify({
        status: "success",
        message: "Created variation: Dell Laptop Ad - Variation 2",
        changes: [
            "Duplicated main comp and sub-comps (F1, F2, F3)",
            "Changed headline: 'Mega Deals on Dell Inspiron Laptops' with Flipkart yellow",
            "Adjusted timing: snappier transitions (F2 at 1.5s, F3 at 4.5s)",
            "Added Brightness/Contrast boost to product in F2",
            "Added subtle Glow effect to logo in F3",
            "Adjusted bank strip position and fade speed in F3"
        ],
        newCompName: "Dell Laptop Ad - Variation 2"
    });
})()""" 

cmd = {
    "command": "executeCustomScript",
    "args": {"code": code},
    "timestamp": "2026-02-16T10:25:01.000Z",
    "status": "pending"
}

# Clear result file
result_path = os.path.expanduser("~/Documents/ae-mcp-bridge/ae_mcp_result.json")
with open(result_path, "w") as f:
    json.dump({"status": "waiting", "message": "Waiting...", "timestamp": "2026-02-16T10:25:00.000Z"}, f)

# Write command
cmd_path = os.path.expanduser("~/Documents/ae-mcp-bridge/ae_command.json")
with open(cmd_path, "w") as f:
    json.dump(cmd, f, indent=2)

print("Variation creation command sent to After Effects")
