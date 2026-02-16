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

    if (!comp) return JSON.stringify({ status: "error", message: "Comp not found" });

    var layers = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var l = comp.layer(i);
        layers.push({
            index: i,
            name: l.name,
            source: l.source ? l.source.name : "null",
            enabled: l.enabled,
            locked: l.locked
        });
    }

    return JSON.stringify({
        status: "success",
        report: {
            name: comp.name,
            layers: layers
        }
    });
})();
