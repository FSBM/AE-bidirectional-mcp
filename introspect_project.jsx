// introspect_project.jsx
// Deep introspection of the current AE project - captures full "template DNA"

(function() {
    var project = app.project;
    var result = {
        projectName: project.file ? project.file.name : "Untitled",
        numItems: project.numItems,
        compositions: [],
        footage: [],
        folders: []
    };

    // Helper: get keyframe data for a property
    function getKeyframes(prop) {
        var kfs = [];
        if (prop && prop.numKeys > 0) {
            for (var k = 1; k <= prop.numKeys; k++) {
                var kfData = {
                    time: prop.keyTime(k),
                    value: prop.keyValue(k)
                };
                try {
                    kfData.inInterp = prop.keyInInterpolationType(k);
                    kfData.outInterp = prop.keyOutInterpolationType(k);
                } catch(e) {}
                kfs.push(kfData);
            }
        }
        return kfs;
    }

    // Helper: get transform and key properties
    function getLayerProperties(layer) {
        var props = {};
        var names = ["Position", "Scale", "Rotation", "Opacity", "Anchor Point"];
        for (var i = 0; i < names.length; i++) {
            try {
                var p = layer.property("ADBE Transform Group").property(names[i]);
                if (p) {
                    props[names[i]] = {
                        value: p.value,
                        numKeys: p.numKeys,
                        keyframes: getKeyframes(p)
                    };
                    if (p.expression && p.expression.length > 0) {
                        props[names[i]].expression = p.expression;
                    }
                }
            } catch(e) {}
        }
        return props;
    }

    // Helper: get effects on a layer
    function getEffects(layer) {
        var effects = [];
        try {
            if (layer.effect && layer.effect.numProperties > 0) {
                for (var i = 1; i <= layer.effect.numProperties; i++) {
                    var fx = layer.effect(i);
                    var fxData = {
                        name: fx.name,
                        matchName: fx.matchName,
                        enabled: fx.enabled,
                        params: []
                    };
                    // Get effect parameters (first 20 to avoid huge output)
                    for (var j = 1; j <= Math.min(fx.numProperties, 20); j++) {
                        try {
                            var param = fx.property(j);
                            if (param && param.propertyValueType !== PropertyValueType.NO_VALUE) {
                                fxData.params.push({
                                    name: param.name,
                                    value: param.value
                                });
                            }
                        } catch(e) {}
                    }
                    effects.push(fxData);
                }
            }
        } catch(e) {}
        return effects;
    }

    // Helper: determine layer type
    function getLayerType(layer) {
        if (layer instanceof TextLayer) return "Text";
        if (layer instanceof ShapeLayer) return "Shape";
        if (layer instanceof CameraLayer) return "Camera";
        if (layer instanceof LightLayer) return "Light";
        if (!layer.source) return "Null";
        if (layer.source instanceof CompItem) return "PreComp";
        if (layer.source instanceof FootageItem) {
            if (layer.source.mainSource instanceof SolidSource) return "Solid";
            return "Footage";
        }
        return "Unknown";
    }

    // Helper: get text content
    function getTextContent(layer) {
        try {
            if (layer instanceof TextLayer) {
                var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
                var doc = textProp.value;
                return {
                    text: doc.text,
                    font: doc.font,
                    fontSize: doc.fontSize,
                    fillColor: doc.fillColor,
                    strokeColor: doc.strokeColor,
                    tracking: doc.tracking
                };
            }
        } catch(e) {}
        return null;
    }

    // Process key compositions (limit to important ones)
    var keyComps = ["laptop", "F1", "F2", "F3", "BG", "price", "product", "range", 
                    "logo", "date", "copy", "selection box", "start position", "end position",
                    "f", "Simple Distorted Zoom Out", "Generated Light Leak 1"];

    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        
        if (item instanceof CompItem) {
            // Check if this is a key comp
            var isKey = false;
            for (var k = 0; k < keyComps.length; k++) {
                if (item.name === keyComps[k]) { isKey = true; break; }
            }
            if (!isKey) continue;

            var compData = {
                name: item.name,
                id: item.id,
                width: item.width,
                height: item.height,
                duration: item.duration,
                frameRate: item.frameRate,
                bgColor: item.bgColor,
                numLayers: item.numLayers,
                layers: []
            };

            for (var j = 1; j <= item.numLayers; j++) {
                var layer = item.layer(j);
                var layerData = {
                    index: j,
                    name: layer.name,
                    type: getLayerType(layer),
                    enabled: layer.enabled,
                    inPoint: layer.inPoint,
                    outPoint: layer.outPoint,
                    startTime: layer.startTime,
                    transform: getLayerProperties(layer),
                    effects: getEffects(layer)
                };

                // Add text content if text layer
                var textContent = getTextContent(layer);
                if (textContent) layerData.textContent = textContent;

                // Add source info
                if (layer.source) {
                    layerData.sourceName = layer.source.name;
                    if (layer.source instanceof CompItem) {
                        layerData.sourceCompName = layer.source.name;
                    }
                    if (layer.source instanceof FootageItem && layer.source.file) {
                        layerData.sourceFile = layer.source.file.fsName;
                    }
                }

                // Parent info
                if (layer.parent) {
                    layerData.parentName = layer.parent.name;
                    layerData.parentIndex = layer.parent.index;
                }

                // Track matte
                try {
                    layerData.trackMatteType = layer.trackMatteType;
                } catch(e) {}

                compData.layers.push(layerData);
            }

            result.compositions.push(compData);
        }
    }

    return JSON.stringify(result);
})();
