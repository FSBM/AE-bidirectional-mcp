(function () {
    function getScriptFile() {
        // Fallback or specific path logic if needed
        return new File("assets/new-file-to-modify/Laptop 10 Sec folder/Laptop 10 Sec.aep");
    }

    app.beginUndoGroup("Create Laptop 10 Sec Variation");

    try {
        var project = app.project;

        // 0. Open Project if Empty
        if (project.numItems === 0) {
            var projectFile = new File("/Users/shyamkrishnanmn/Documents/Video-Automation/after-effects-mcp/assets/new-file-to-modify/Laptop 10 Sec folder/Laptop 10 Sec.aep");
            if (projectFile.exists) {
                app.open(projectFile);
                project = app.project; // Update reference
            } else {
                return JSON.stringify({
                    status: "error",
                    message: "Project file not found: " + projectFile.fsName
                });
            }
        }

        var mainCompName = "Laptop-10Sec - 13th Feb";
        var mainComp = null;

        // 1. Find Main Composition
        for (var i = 1; i <= project.numItems; i++) {
            if (project.item(i) instanceof CompItem && project.item(i).name === mainCompName) {
                mainComp = project.item(i);
                break;
            }
        }

        if (!mainComp) {
            // Debug: List comps
            var comps = [];
            for (var k = 1; k <= project.numItems; k++) {
                if (project.item(k) instanceof CompItem) comps.push(project.item(k).name);
            }
            throw new Error("Main composition '" + mainCompName + "' not found. Available Comps: " + comps.join(", "));
        }

        // 2. Duplicate Main Composition
        var newComp = mainComp.duplicate();
        newComp.name = "Laptop-10Sec-NewVariation";
        newComp.openInViewer();

        // 3. Helper: Recursively find layer by name (simplified for top-level)
        function findLayer(comp, namePartial) {
            for (var i = 1; i <= comp.numLayers; i++) {
                if (comp.layer(i).name.indexOf(namePartial) !== -1) {
                    return comp.layer(i);
                }
            }
            return null;
        }

        // 4. Transform Background
        // Goal: Replace 'bg' comp with Placeholder Solid + Drift
        var bgLayer = findLayer(newComp, "bg");
        if (bgLayer) {
            // Create Placeholder Solid
            var solid = newComp.layers.addSolid([0.1, 0.1, 0.1], "Placeholder Moving BG", newComp.width, newComp.height, newComp.pixelAspect, newComp.duration);
            solid.moveAfter(bgLayer);
            bgLayer.enabled = false; // Disable original bg

            // Add Drift Animation (Position)
            // Start: [960, 540] -> End: [810, 540] (150px left)
            var pos = solid.property("Transform").property("Position");
            pos.setValueAtTime(0, [newComp.width / 2, newComp.height / 2]);
            pos.setValueAtTime(newComp.duration, [newComp.width / 2 - 150, newComp.height / 2]);

            // Add Directional Blur
            var blur = solid.effects.addProperty("ADBE Directional Blur");
            blur.property("Direction").setValue(90);
            blur.property("Blur Length").setValue(10);

            // Scale up slightly to avoid edges
            solid.property("Transform").property("Scale").setValue([120, 120]);
        }

        // 5. Remove "Dell 14 AI" Layer
        // User asked to "Completely remove middle laptop layer that contains text".
        // Let's search inside the F-comps.

        // Dictionary of F-comps to duplicate
        var fComps = ["F1", "F2", "F3", "F4", "F5"];
        var newFComps = {};

        // Helper for Array.indexOf
        function arrayContains(arr, val) {
            for (var k = 0; k < arr.length; k++) {
                if (arr[k] === val) return true;
            }
            return false;
        }

        // Find F-comps in project
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            if (arrayContains(fComps, item.name) && item instanceof CompItem) {
                var newF = item.duplicate();
                newF.name = item.name + "_V2";
                newFComps[item.name] = newF;

                // Mod 1: Remove "Dell 14 AI"
                for (var j = 1; j <= newF.numLayers; j++) {
                    var l = newF.layer(j);
                    // Check text layers
                    if (l instanceof TextLayer) {
                        var textDoc = l.property("Source Text").value;
                        if (textDoc.text.indexOf("Dell 14 AI") !== -1) {
                            l.enabled = false;
                            l.name = "DISABLED - Dell 14 AI";
                        }
                    }
                }
            }
        }

        // Replace F-comps in Main Comp with V2s
        for (var i = 1; i <= newComp.numLayers; i++) {
            var l = newComp.layer(i);
            if (l.source && newFComps[l.source.name]) {
                l.replaceSource(newFComps[l.source.name], false);
            }
        }


        // 6. Change Wave Color to Yellow (#FFC72C)
        // Find "Vector Smart Object" or "Waves" layer in the correct comp.

        // Helper to apply yellow to waves
        function applyYellowToWaves(comp) {
            for (var i = 1; i <= comp.numLayers; i++) {
                var l = comp.layer(i);
                if (l.name.indexOf("Vector Smart Object") !== -1 || l.name.indexOf("Waves") !== -1) {
                    try {
                        // Start with Fill
                        var fill = l.effect.addProperty("ADBE Fill");
                        if (fill) {
                            fill.property("Color").setValue([1, 0.78, 0.17]); // #FFC72C normalized
                        }
                    } catch (err) {
                        // Ignore errors for individual layers, maybe it's locked or incompatible
                    }
                }
            }
        }

        // Apply to new F-comps and Main Comp
        applyYellowToWaves(newComp);
        for (var key in newFComps) {
            applyYellowToWaves(newFComps[key]);
        }


        // 7. Intro Sequence (0-1.5s)
        // Shift existing layers
        var shiftAmount = 1.5;
        for (var i = 1; i <= newComp.numLayers; i++) {
            // Don't shift the background solid we just added
            if (newComp.layer(i).name !== "Placeholder Moving BG") {
                newComp.layer(i).locked = false; // Ensure layer is unlocked
                newComp.layer(i).startTime += shiftAmount;
            }
        }

        // Create Intro Elements
        // 1. Logo (Find and reused)
        var logoItem = null;
        for (var i = 1; i <= project.numItems; i++) {
            if (project.item(i).name === "logo" && project.item(i) instanceof CompItem) {
                logoItem = project.item(i);
                break;
            }
        }

        if (logoItem) {
            var introLogo = newComp.layers.add(logoItem);
            introLogo.startTime = 0;
            introLogo.outPoint = 1.6; // Slightly overlap
            // Animate Position (Slide Up)
            var pos = introLogo.property("Transform").property("Position");
            pos.setValueAtTime(0, [newComp.width / 2, newComp.height / 2 + 300]);
            pos.setValueAtTime(1.0, [newComp.width / 2, newComp.height / 2]);
        }

        return JSON.stringify({
            status: "success",
            message: "Created Laptop-10Sec-NewVariation with placeholder BG, yellow waves, text removal, and intro."
        });

    } catch (e) {
        return JSON.stringify({
            status: "error",
            message: e.toString(),
            line: e.line
        });
    }
})();
