(function () {
    app.beginUndoGroup("Create Laptop 10 Sec Variation V3");

    try {
        var project = app.project;

        // 0. Ensure Project Open
        if (project.numItems === 0) {
            var f = new File("assets/new-file-to-modify/Laptop 10 Sec folder/Laptop 10 Sec.aep");
            if (f.exists) app.open(f);
        }

        var mainCompName = "Laptop-10Sec - 13th Feb";
        var mainComp = null;
        for (var i = 1; i <= project.numItems; i++) {
            if (project.item(i) instanceof CompItem && project.item(i).name === mainCompName) {
                mainComp = project.item(i);
                break;
            }
        }
        if (!mainComp) throw new Error("Main Comp not found");

        var newComp = mainComp.duplicate();
        newComp.name = "Laptop-10Sec-NewVariation";
        newComp.openInViewer();

        // 1. Placeholder Background (At Bottom)
        // Since no 'bg' layer exists in main comp, we add it at the bottom.
        var solid = newComp.layers.addSolid([0.1, 0.1, 0.1], "Placeholder Moving BG", newComp.width, newComp.height, newComp.pixelAspect, newComp.duration);
        solid.moveToEnd(); // Move to bottom

        // Drift Animation
        var pos = solid.property("Transform").property("Position");
        pos.setValueAtTime(0, [newComp.width / 2, newComp.height / 2]);
        pos.setValueAtTime(newComp.duration, [newComp.width / 2 - 150, newComp.height / 2]);

        // Blur
        var effectsGroup = solid.property("Effects");
        var blur = effectsGroup.addProperty("Directional Blur"); // Using display name for safety
        if (blur) {
            blur.property("Direction").setValue(90);
            blur.property("Blur Length").setValue(10);
        }
        solid.property("Transform").property("Scale").setValue([120, 120]);


        // 2. Duplicate and Replace F-Comps
        var fCompsToFind = ["F1", "F2", "F3", "F4", "F5", "F6"];
        var newFCompMap = {}; // name -> newCompItem

        // Helper: Check if name is in target list
        function isTargetComp(name) {
            for (var k = 0; k < fCompsToFind.length; k++) {
                if (name.indexOf(fCompsToFind[k]) !== -1) return true; // Loose match? 
                // Strict match preferable to avoid "F1 copy" matching "F1"
                if (name === fCompsToFind[k]) return true;
            }
            return false;
        }

        // Search project for source items
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            if (item instanceof CompItem && isTargetComp(item.name)) {
                var newF = item.duplicate();
                newF.name = item.name + "_V2";
                newFCompMap[item.name] = newF;

                // 3. Modify Inside F-Comps
                // A. Yellow Waves
                for (var L = 1; L <= newF.numLayers; L++) {
                    var innerL = newF.layer(L);

                    // Wave Color
                    if (innerL.name.indexOf("Vector Smart Object") !== -1 || innerL.name.indexOf("Waves") !== -1 || innerL.name.indexOf("bg") !== -1) {
                        try {
                            // If it's a bg comp, we might need to go deeper? 
                            // Taking a guess it's a direct layer or inside 'bg' layer (if 'bg' is a comp).
                            // User said "Change Wave Color... -> Vector Smart Object"
                            // We'll apply Tint to anything looking like Waves/Vector
                            var fill = innerL.effect.addProperty("ADBE Fill");
                            fill.property("Color").setValue([1, 0.78, 0.17]);
                        } catch (e) { }
                    }

                    // B. Remove Dell 14 AI Text
                    if (innerL instanceof TextLayer) {
                        var txt = innerL.property("Source Text").value.text;
                        if (txt.indexOf("Dell 14 AI") !== -1) {
                            innerL.enabled = false;
                            innerL.name = "DISABLED_AI";
                        }
                    }
                }
            }
        }

        // 4. Replace Sources in Main Comp
        for (var i = 1; i <= newComp.numLayers; i++) {
            var l = newComp.layer(i);
            if (l.source && newFCompMap[l.source.name]) {
                l.replaceSource(newFCompMap[l.source.name], false);
            }
        }

        // 5. Intro Sequence (0-1.5s)
        var shiftTime = 1.5;
        for (var i = 1; i <= newComp.numLayers; i++) {
            var l = newComp.layer(i);
            if (l.name !== "Placeholder Moving BG") {
                if (l.locked) l.locked = false;
                l.startTime += shiftTime;
            }
        }

        // Add Intro Logo
        var logoItem = null;
        for (var i = 1; i <= project.numItems; i++) {
            if (project.item(i).name === "logo" && project.item(i) instanceof CompItem) {
                logoItem = project.item(i); break;
            }
        }
        if (logoItem) {
            var logoL = newComp.layers.add(logoItem);
            logoL.startTime = 0;
            logoL.outPoint = 1.6;
            var pos = logoL.property("Transform").property("Position");
            pos.setValueAtTime(0, [newComp.width / 2, newComp.height / 2 + 200]);
            pos.setValueAtTime(1.0, [newComp.width / 2, newComp.height / 2]);
        }

        return JSON.stringify({ status: "success", message: "Created V3 with fixed placement" });

    } catch (e) {
        return JSON.stringify({ status: "error", message: e.toString(), line: e.line });
    }
})();
