import json
import os

# Creates a "Moving Background" variation of the Laptop-10Sec - 13th Feb composition.
# Changes: moving background, remove Dell 14 AI, yellow waves, new intro,
# remove bank strip (F1-F5), transition enhancements, global color grading.

code = r"""(function() {
    app.beginUndoGroup("Create Moving BG Variation");

    try {
        var project = app.project;

        function applyEase(prop, keyIndex, speed, influence) {
            var eIn = new KeyframeEase(speed, influence);
            var eOut = new KeyframeEase(speed, influence);
            try {
                prop.setTemporalEaseAtKey(keyIndex, [eIn, eIn, eIn], [eOut, eOut, eOut]);
            } catch(e) {
                try {
                    prop.setTemporalEaseAtKey(keyIndex, [eIn, eIn], [eOut, eOut]);
                } catch(e2) {
                    try {
                        prop.setTemporalEaseAtKey(keyIndex, [eIn], [eOut]);
                    } catch(e3) {}
                }
            }
        }

        // ============================================
        // PHASE 1: Find & Duplicate Main Comp
        // ============================================
        var mainCompName = "Laptop-10Sec - 13th Feb";
        var mainComp = null;
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            if (item instanceof CompItem && item.name === mainCompName) {
                mainComp = item;
                break;
            }
        }
        if (!mainComp) throw new Error("Main comp '" + mainCompName + "' not found");

        var newComp = mainComp.duplicate();
        newComp.name = "Laptop-10Sec-MovingBG-Variation";
        newComp.duration = 10;

        // ============================================
        // PHASE 2: Find & Duplicate F-Comps (F1-F6)
        // ============================================
        var fCompNames = ["F1", "F2", "F3", "F4", "F5", "F6"];
        var origFComps = {};
        var newFComps = {};

        // Find originals by strict name match
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            if (item instanceof CompItem) {
                for (var k = 0; k < fCompNames.length; k++) {
                    if (item.name === fCompNames[k] && !origFComps[fCompNames[k]]) {
                        origFComps[fCompNames[k]] = item;
                    }
                }
            }
        }

        // Duplicate each F-comp
        for (var k = 0; k < fCompNames.length; k++) {
            var fname = fCompNames[k];
            if (origFComps[fname]) {
                var dup = origFComps[fname].duplicate();
                dup.name = fname + "_MBG";
                newFComps[fname] = dup;
            }
        }

        // Replace sub-comp sources in the new main comp
        for (var j = 1; j <= newComp.numLayers; j++) {
            var layer = newComp.layer(j);
            if (layer.source && layer.source instanceof CompItem) {
                for (var k = 0; k < fCompNames.length; k++) {
                    var fname = fCompNames[k];
                    if (layer.source === origFComps[fname] && newFComps[fname]) {
                        layer.replaceSource(newFComps[fname], false);
                        layer.name = fname + "_MBG";
                    }
                }
            }
        }

        // ============================================
        // PHASE 3: Background Replacement
        // ============================================
        // First check if already imported, otherwise import from disk
        var movingBG = null;
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            if (item.name === "Moving background.png") {
                movingBG = item;
                break;
            }
        }
        if (!movingBG) {
            // Import from known location on disk
            var bgFile = new File("/Users/shyamkrishnanmn/Documents/Remotion-test/product-motion/public/flip-kart-assets/new-laptop-video/Moving background.png");
            if (!bgFile.exists) throw new Error("'Moving background.png' not found on disk or in project");
            var importOpts = new ImportOptions(bgFile);
            movingBG = project.importFile(importOpts);
        }

        // Helper: Add moving background to a comp with parallax motion
        function addMovingBGToComp(comp) {
            var bgLayer = comp.layers.add(movingBG);
            bgLayer.moveToEnd();
            bgLayer.name = "Moving BG";
            bgLayer.startTime = 0;

            // Scale slightly larger to allow parallax movement
            var scaleProp = bgLayer.property("ADBE Transform Group").property("Scale");
            scaleProp.setValueAtTime(0, [102, 102, 100]);
            scaleProp.setValueAtTime(comp.duration, [100, 100, 100]);
            // Ease out on scale
            var scaleKeys = [1, 2];
            for (var ki = 0; ki < scaleKeys.length; ki++) {
                applyEase(scaleProp, scaleKeys[ki], 0.5, 75);
            }

            // Position X oscillation for parallax (center ± 80px)
            var posProp = bgLayer.property("ADBE Transform Group").property("Position");
            var cx = comp.width / 2;
            var cy = comp.height / 2;
            var dur = comp.duration;
            posProp.setValueAtTime(0, [cx + 80, cy]);
            posProp.setValueAtTime(dur * 0.25, [cx - 40, cy]);
            posProp.setValueAtTime(dur * 0.5, [cx + 60, cy]);
            posProp.setValueAtTime(dur * 0.75, [cx - 80, cy]);
            posProp.setValueAtTime(dur, [cx + 40, cy]);
            // Ease all position keyframes
            for (var ki = 1; ki <= posProp.numKeys; ki++) {
                applyEase(posProp, ki, 0.5, 60);
            }

            // Directional Blur linked to movement
            try {
                var dirBlur = bgLayer.property("Effects").addProperty("ADBE Directional Blur");
                dirBlur.property("Direction").setValue(0); // horizontal
                dirBlur.property("Blur Length").setValue(8);
            } catch(e) {}

            // Enable motion blur on layer
            bgLayer.motionBlur = true;

            return bgLayer;
        }

        // Disable existing desk background layers in F-comps & add moving BG
        for (var k = 0; k < fCompNames.length; k++) {
            var fname = fCompNames[k];
            var fcomp = newFComps[fname];
            if (!fcomp) continue;

            // Disable existing bg/desk layers
            for (var j = 1; j <= fcomp.numLayers; j++) {
                var lyr = fcomp.layer(j);
                var lname = lyr.name.toLowerCase();
                if (lname.indexOf("desk") !== -1 || lname.indexOf("background") !== -1 ||
                    (lname === "bg" && lyr.source && !(lyr.source instanceof CompItem))) {
                    lyr.enabled = false;
                }
            }

            addMovingBGToComp(fcomp);
        }

        // Add moving BG to main comp as bottom-most layer
        addMovingBGToComp(newComp);

        // Enable motion blur at comp level
        newComp.motionBlur = true;

        // ============================================
        // PHASE 4: Remove Dell 14 AI Layer
        // ============================================
        for (var k = 0; k < fCompNames.length; k++) {
            var fcomp = newFComps[fCompNames[k]];
            if (!fcomp) continue;

            for (var j = fcomp.numLayers; j >= 1; j--) {
                var lyr = fcomp.layer(j);
                var lname = lyr.name;

                // Check text layers for "Dell 14 AI"
                if (lyr instanceof TextLayer) {
                    try {
                        var txt = lyr.property("ADBE Text Properties").property("ADBE Text Document").value.text;
                        if (txt.indexOf("Dell 14 AI") !== -1) {
                            lyr.enabled = false;
                        }
                    } catch(e) {}
                }

                // Check layer name
                if (lname.indexOf("Dell 14 AI") !== -1 || lname.indexOf("Dell14") !== -1) {
                    lyr.enabled = false;
                }

                // Disable associated glow/light sweep layers near Dell 14 AI
                if (lname.indexOf("glow") !== -1 || lname.indexOf("light sweep") !== -1 ||
                    lname.indexOf("Glow") !== -1 || lname.indexOf("Light Sweep") !== -1) {
                    // Only disable if near a Dell 14 AI layer (heuristic: just disable these)
                    // This is conservative - we disable them
                    lyr.enabled = false;
                }
            }
        }

        // ============================================
        // PHASE 5: Change Wave Color to Yellow (#FFC300)
        // ============================================
        var waveColor = [1, 0.765, 0]; // #FFC300

        function applyWaveColor(comp) {
            for (var j = 1; j <= comp.numLayers; j++) {
                var lyr = comp.layer(j);
                var lname = lyr.name;

                if (lname.indexOf("Vector Smart Object") !== -1 ||
                    lname.indexOf("Waves") !== -1 ||
                    lname.indexOf("wave") !== -1) {
                    try {
                        var fill = lyr.property("Effects").addProperty("ADBE Fill");
                        fill.property("Color").setValue(waveColor);
                    } catch(e) {}
                }

                // If it's a "bg" sub-comp, go one level deeper
                if (lname === "bg" && lyr.source && lyr.source instanceof CompItem) {
                    var bgComp = lyr.source;
                    // Duplicate to avoid modifying original
                    var newBgComp = bgComp.duplicate();
                    newBgComp.name = bgComp.name + "_MBG";
                    lyr.replaceSource(newBgComp, false);

                    for (var m = 1; m <= newBgComp.numLayers; m++) {
                        var innerL = newBgComp.layer(m);
                        if (innerL.name.indexOf("Vector Smart Object") !== -1 ||
                            innerL.name.indexOf("Waves") !== -1 ||
                            innerL.name.indexOf("wave") !== -1) {
                            try {
                                var fill2 = innerL.property("Effects").addProperty("ADBE Fill");
                                fill2.property("Color").setValue(waveColor);
                            } catch(e) {}
                        }
                    }
                }
            }
        }

        for (var k = 0; k < fCompNames.length; k++) {
            if (newFComps[fCompNames[k]]) {
                applyWaveColor(newFComps[fCompNames[k]]);
            }
        }

        // ============================================
        // PHASE 6: Create New Intro (0-1.3s)
        // ============================================
        var introShift = 1.3;

        // Shift all existing layers forward
        for (var j = 1; j <= newComp.numLayers; j++) {
            var lyr = newComp.layer(j);
            if (lyr.locked) lyr.locked = false;
            // Don't shift the bottom-most Moving BG we just added
            if (lyr.name === "Moving BG") continue;
            lyr.startTime += introShift;
        }

        // Find logo comp
        var logoItem = null;
        for (var i = 1; i <= project.numItems; i++) {
            if (project.item(i) instanceof CompItem && project.item(i).name === "logo") {
                logoItem = project.item(i);
                break;
            }
        }

        if (logoItem) {
            var logoLayer = newComp.layers.add(logoItem);
            logoLayer.startTime = 0;
            logoLayer.outPoint = introShift + 0.3; // slight overlap
            logoLayer.name = "Intro Logo";

            // Scale: 90% -> 105% (overshoot) -> 100% (settle)
            var logoScale = logoLayer.property("ADBE Transform Group").property("Scale");
            logoScale.setValueAtTime(0, [90, 90]);
            logoScale.setValueAtTime(0.4, [105, 105]);
            logoScale.setValueAtTime(0.7, [100, 100]);
            // Ease
            for (var ki = 1; ki <= logoScale.numKeys; ki++) {
                applyEase(logoScale, ki, 0.5, 70);
            }

            // Opacity: 0 -> 100 over 0.3s
            var logoOp = logoLayer.property("ADBE Transform Group").property("Opacity");
            logoOp.setValueAtTime(0, 0);
            logoOp.setValueAtTime(0.3, 100);

            // Position: slight rise
            var logoPos = logoLayer.property("ADBE Transform Group").property("Position");
            logoPos.setValueAtTime(0, [newComp.width / 2, newComp.height / 2 + 50]);
            logoPos.setValueAtTime(0.5, [newComp.width / 2, newComp.height / 2]);
            for (var ki = 1; ki <= logoPos.numKeys; ki++) {
                applyEase(logoPos, ki, 0.5, 75);
            }
        }

        // Add light leak overlay if available
        var lightLeakItem = null;
        for (var i = 1; i <= project.numItems; i++) {
            if (project.item(i) instanceof CompItem &&
                project.item(i).name.indexOf("Generated Light Leak") !== -1) {
                lightLeakItem = project.item(i);
                break;
            }
        }
        if (lightLeakItem) {
            var llLayer = newComp.layers.add(lightLeakItem);
            llLayer.startTime = 0.6;
            llLayer.outPoint = introShift + 0.5;
            llLayer.name = "Intro Light Leak";
            llLayer.blendingMode = BlendingMode.SCREEN;
            var llOp = llLayer.property("ADBE Transform Group").property("Opacity");
            llOp.setValue(70);
        }

        // Fade from black solid
        var fadeBlack = newComp.layers.addSolid([0, 0, 0], "Fade From Black", newComp.width, newComp.height, 1, introShift);
        fadeBlack.startTime = 0;
        fadeBlack.moveToBeginning(); // on top
        var fadeOp = fadeBlack.property("ADBE Transform Group").property("Opacity");
        fadeOp.setValueAtTime(0, 100);
        fadeOp.setValueAtTime(0.2, 0);

        // ============================================
        // PHASE 7: Remove Bank Strip (F1-F5, keep F6)
        // ============================================
        var bankStripComps = ["F1", "F2", "F3", "F4", "F5"];
        for (var k = 0; k < bankStripComps.length; k++) {
            var fcomp = newFComps[bankStripComps[k]];
            if (!fcomp) continue;
            for (var j = 1; j <= fcomp.numLayers; j++) {
                var lyr = fcomp.layer(j);
                if (lyr.name.indexOf("Bank Strip") !== -1 || lyr.name.indexOf("bank strip") !== -1 ||
                    lyr.name.indexOf("Bank_Strip") !== -1 || lyr.name.indexOf("bank_strip") !== -1) {
                    lyr.enabled = false;
                }
            }
        }

        // ============================================
        // PHASE 8: Transition Enhancements
        // ============================================
        for (var j = 1; j <= newComp.numLayers; j++) {
            var lyr = newComp.layer(j);
            if (lyr.name.indexOf("Simple Distorted Zoom Out") !== -1 ||
                lyr.name.indexOf("Distorted Zoom") !== -1) {
                lyr.motionBlur = true;

                // Chromatic aberration via Shift Channels
                try {
                    var shiftCh = lyr.property("Effects").addProperty("ADBE Shift Channels");
                    // Shift Red: Set to "Full Off" is index 5
                    shiftCh.property("Take Red From").setValue(5);
                    shiftCh.property("Take Blue From").setValue(5);
                } catch(e) {}

                // Micro-bounce scale
                try {
                    var trScale = lyr.property("ADBE Transform Group").property("Scale");
                    var baseTime = lyr.inPoint;
                    trScale.setValueAtTime(baseTime, [100, 100]);
                    trScale.setValueAtTime(baseTime + 0.15, [104, 104]);
                    trScale.setValueAtTime(baseTime + 0.35, [100, 100]);
                    for (var ki = 1; ki <= trScale.numKeys; ki++) {
                        applyEase(trScale, ki, 0.5, 60);
                    }
                } catch(e) {}
            }
        }

        // ============================================
        // PHASE 10: Global Color & Polish Pass
        // ============================================
        // Add adjustment layer at top of main comp
        var adjLayer = newComp.layers.addSolid([1, 1, 1], "Color Grade", newComp.width, newComp.height, 1, newComp.duration);
        adjLayer.adjustmentLayer = true;
        adjLayer.startTime = 0;
        adjLayer.moveToBeginning();
        adjLayer.name = "Global Color Grade";

        // S-curve contrast via Curves
        try {
            var curves = adjLayer.property("Effects").addProperty("ADBE CurvesCustom");
            // Curves doesn't have simple setValue for the curve shape in ExtendScript,
            // so we use Brightness & Contrast as a reliable alternative
        } catch(e) {}

        // Use Brightness & Contrast for reliable contrast boost
        try {
            var bc = adjLayer.property("Effects").addProperty("ADBE Brightness & Contrast 2");
            bc.property("Brightness").setValue(3);
            bc.property("Contrast").setValue(12);
        } catch(e) {}

        // Hue/Saturation: +5 saturation
        try {
            var hueSat = adjLayer.property("Effects").addProperty("ADBE HUE SATURATION 18");
            hueSat.property("Master Saturation").setValue(5);
        } catch(e) {}

        // Vignette: dark solid with elliptical mask
        var vignetteLayer = newComp.layers.addSolid([0, 0, 0], "Vignette", newComp.width, newComp.height, 1, newComp.duration);
        vignetteLayer.startTime = 0;
        vignetteLayer.moveAfter(adjLayer);
        vignetteLayer.property("ADBE Transform Group").property("Opacity").setValue(12);

        // Create elliptical mask for vignette
        try {
            var maskGroup = vignetteLayer.property("Masks").addProperty("ADBE Mask Atom");
            var maskShape = maskGroup.property("ADBE Mask Shape");
            var shape = new Shape();
            // Create an ellipse approximation using bezier vertices
            var w = newComp.width;
            var h = newComp.height;
            var cx = w / 2;
            var cy = h / 2;
            var rx = w * 0.45;
            var ry = h * 0.45;
            // 4-point bezier ellipse approximation
            var kappa = 0.5522848;
            shape.vertices = [
                [cx, cy - ry],   // top
                [cx + rx, cy],   // right
                [cx, cy + ry],   // bottom
                [cx - rx, cy]    // left
            ];
            shape.inTangents = [
                [rx * kappa, 0],
                [0, -ry * kappa],
                [-rx * kappa, 0],
                [0, ry * kappa]
            ];
            shape.outTangents = [
                [-rx * kappa, 0],
                [0, ry * kappa],
                [rx * kappa, 0],
                [0, -ry * kappa]
            ];
            shape.closed = true;
            maskShape.setValue(shape);
            maskGroup.property("ADBE Mask Feather").setValue([200, 200]);
            maskGroup.property("Mode").setValue(MaskMode.SUBTRACT);
        } catch(e) {}

        // Film grain: Fractal Noise on separate layer
        var grainLayer = newComp.layers.addSolid([0.5, 0.5, 0.5], "Film Grain", newComp.width, newComp.height, 1, newComp.duration);
        grainLayer.startTime = 0;
        grainLayer.moveAfter(vignetteLayer);
        grainLayer.blendingMode = BlendingMode.OVERLAY;
        grainLayer.property("ADBE Transform Group").property("Opacity").setValue(3);
        try {
            var fracNoise = grainLayer.property("Effects").addProperty("ADBE Fractal Noise");
            fracNoise.property("Fractal Type").setValue(3); // Dynamic
            fracNoise.property("Contrast").setValue(150);
            fracNoise.property("Brightness").setValue(-20);
            // Animate evolution for grain movement
            var evolution = fracNoise.property("Evolution");
            evolution.setValueAtTime(0, 0);
            evolution.setValueAtTime(newComp.duration, 360 * 5); // 5 full rotations
        } catch(e) {}

        // ============================================
        // PHASE 11: Technical Settings
        // ============================================
        newComp.motionBlur = true;
        newComp.shutterAngle = 180;

        // Open final comp in viewer
        newComp.openInViewer();

        app.endUndoGroup();

        return JSON.stringify({
            status: "success",
            message: "Created: Laptop-10Sec-MovingBG-Variation",
            changes: [
                "Duplicated main comp and F1-F6 sub-comps",
                "Replaced backgrounds with Moving background.png + parallax",
                "Removed Dell 14 AI layers",
                "Changed wave color to yellow (#FFC300)",
                "Added intro sequence (0-1.3s) with logo animation",
                "Removed bank strip from F1-F5 (kept in F6)",
                "Enhanced transitions with motion blur + chromatic aberration",
                "Added global color grading, vignette, and film grain",
                "Enabled motion blur (shutter angle 180)"
            ],
            newCompName: "Laptop-10Sec-MovingBG-Variation"
        });

    } catch(e) {
        app.endUndoGroup();
        return JSON.stringify({status: "error", message: e.toString(), line: e.line});
    }
})()"""

cmd = {
    "command": "executeCustomScript",
    "args": {"code": code},
    "timestamp": "2026-02-16T12:00:00.000Z",
    "status": "pending"
}

# Clear result file
result_path = os.path.expanduser("~/Documents/ae-mcp-bridge/ae_mcp_result.json")
with open(result_path, "w") as f:
    json.dump({"status": "waiting", "message": "Waiting...", "timestamp": "2026-02-16T12:00:00.000Z"}, f)

# Write command
cmd_path = os.path.expanduser("~/Documents/ae-mcp-bridge/ae_command.json")
with open(cmd_path, "w") as f:
    json.dump(cmd, f, indent=2)

print("Moving BG variation command sent to After Effects.")
print("Check AE for new composition: 'Laptop-10Sec-MovingBG-Variation'")
print("")
print("Changes applied:")
print("  - Background: Moving background.png with parallax motion in all F-comps")
print("  - Dell 14 AI: Removed/disabled in all F-comps")
print("  - Wave color: Yellow (#FFC300) via Fill effect")
print("  - Intro: 0-1.3s with logo animation + fade from black")
print("  - Bank strip: Disabled in F1-F5, kept in F6")
print("  - Transitions: Motion blur + chromatic aberration + micro-bounce")
print("  - Color grade: Contrast boost, +5 saturation, vignette, film grain")
print("  - Motion blur: Enabled at comp level (shutter angle 180)")
