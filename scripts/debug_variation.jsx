(function () {
    var compName = "Laptop-10Sec-NewVariation";
    var comp = null;

    // Find comp
    for (var i = 1; i <= app.project.numItems; i++) {
        if (app.project.item(i).name === compName && app.project.item(i) instanceof CompItem) {
            comp = app.project.item(i);
            break;
        }
    }

    if (!comp) return JSON.stringify({ status: "error", message: "Comp not found: " + compName });

    var report = {
        name: comp.name,
        numLayers: comp.numLayers,
        layers: []
    };

    for (var i = 1; i <= comp.numLayers; i++) {
        var l = comp.layer(i);
        var layerInfo = {
            index: i,
            name: l.name,
            enabled: l.enabled,
            sourceName: l.source ? l.source.name : "null"
        };

        // Check for effects
        if (l.effect && l.effect.numProperties > 0) {
            layerInfo.effects = [];
            for (var j = 1; j <= l.effect.numProperties; j++) {
                layerInfo.effects.push(l.effect.property(j).name);
            }
        }

        report.layers.push(layerInfo);
    }

    return JSON.stringify({ status: "success", report: report }, null, 2);
})();
