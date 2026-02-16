(function () {
    app.beginUndoGroup("Fix Variation Step 1: BG");
    try {
        var compName = "Laptop-10Sec-NewVariation";
        var newComp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).name === compName && app.project.item(i) instanceof CompItem) {
                newComp = app.project.item(i);
                break;
            }
        }
        if (!newComp) return JSON.stringify({ status: "error", message: "Comp not found" });

        // Check if BG exists
        var existingBG = null;
        for (var i = 1; i <= newComp.numLayers; i++) {
            if (newComp.layer(i).name === "Placeholder Moving BG") {
                existingBG = newComp.layer(i); break;
            }
        }

        if (!existingBG) {
            // Add Placeholder Solid
            var solid = newComp.layers.addSolid([0.1, 0.1, 0.1], "Placeholder Moving BG", newComp.width, newComp.height, newComp.pixelAspect, newComp.duration);
            solid.moveToEnd();

            // Drift
            var pos = solid.property("Transform").property("Position");
            pos.setValueAtTime(0, [newComp.width / 2, newComp.height / 2]);
            pos.setValueAtTime(newComp.duration, [newComp.width / 2 - 150, newComp.height / 2]);

            // Blur - Using match name safely
            var blur = solid.property("Effects").addProperty("ADBE Directional Blur");
            if (blur) {
                blur.property("Direction").setValue(90);
                blur.property("Blur Length").setValue(10);
            }
            solid.property("Transform").property("Scale").setValue([120, 120]);

            return JSON.stringify({ status: "success", message: "Added BG" });
        } else {
            return JSON.stringify({ status: "success", message: "BG already exists" });
        }

    } catch (e) {
        return JSON.stringify({ status: "error", message: e.toString(), line: e.line });
    }
})();
