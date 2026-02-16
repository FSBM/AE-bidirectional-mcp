import json
import os

code = r"""(function(){
var project = app.project;
var result = {projectName: project.file ? project.file.name : "Untitled", mainComp: null, subComps: []};

function getKF(prop) {
    var kfs = [];
    if (prop && prop.numKeys > 0) {
        for (var k = 1; k <= prop.numKeys; k++) {
            kfs.push({t: prop.keyTime(k), v: prop.keyValue(k)});
        }
    }
    return kfs;
}

function getTF(layer) {
    var props = {};
    var names = ["Position", "Scale", "Rotation", "Opacity", "Anchor Point"];
    for (var i = 0; i < names.length; i++) {
        try {
            var p = layer.property("ADBE Transform Group").property(names[i]);
            if (p) {
                props[names[i]] = {v: p.value, nk: p.numKeys, kf: getKF(p)};
                if (p.expression && p.expression.length > 0) {
                    props[names[i]].expr = p.expression;
                }
            }
        } catch(e) {}
    }
    return props;
}

function getFX(layer) {
    var effects = [];
    try {
        if (layer.effect && layer.effect.numProperties > 0) {
            for (var i = 1; i <= layer.effect.numProperties; i++) {
                var fx = layer.effect(i);
                effects.push({name: fx.name, mn: fx.matchName, on: fx.enabled});
            }
        }
    } catch(e) {}
    return effects;
}

function getLT(layer) {
    if (layer instanceof TextLayer) return "Text";
    if (layer instanceof ShapeLayer) return "Shape";
    if (!layer.source) return "Null";
    if (layer.source instanceof CompItem) return "PreComp";
    if (layer.source instanceof FootageItem) {
        if (layer.source.mainSource instanceof SolidSource) return "Solid";
        return "Footage";
    }
    return "Unknown";
}

function getTC(layer) {
    try {
        if (layer instanceof TextLayer) {
            var tp = layer.property("ADBE Text Properties").property("ADBE Text Document");
            var d = tp.value;
            return {text: d.text, font: d.font, size: d.fontSize, color: d.fillColor};
        }
    } catch(e) {}
    return null;
}

function readComp(comp) {
    var cd = {name: comp.name, id: comp.id, w: comp.width, h: comp.height, dur: comp.duration, fps: comp.frameRate, nl: comp.numLayers, layers: []};
    for (var j = 1; j <= comp.numLayers; j++) {
        var layer = comp.layer(j);
        var ld = {i: j, name: layer.name, type: getLT(layer), on: layer.enabled, inp: layer.inPoint, out: layer.outPoint, st: layer.startTime, tf: getTF(layer), fx: getFX(layer)};
        var tc = getTC(layer);
        if (tc) ld.tc = tc;
        if (layer.source) {
            ld.src = layer.source.name;
            if (layer.source instanceof CompItem) ld.srcComp = layer.source.name;
        }
        if (layer.parent) { ld.parent = layer.parent.name; }
        cd.layers.push(ld);
    }
    return cd;
}

// Find main laptop comp
for (var i = 1; i <= project.numItems; i++) {
    var item = project.item(i);
    if (item instanceof CompItem && item.name === "laptop" && item.numLayers === 7) {
        result.mainComp = readComp(item);
        // Read sub-comps referenced by main comp
        for (var j = 1; j <= item.numLayers; j++) {
            var layer = item.layer(j);
            if (layer.source && layer.source instanceof CompItem) {
                result.subComps.push(readComp(layer.source));
            }
        }
        break;
    }
}

return JSON.stringify(result);
})()"""

cmd = {
    "command": "executeCustomScript",
    "args": {"code": code},
    "timestamp": "2026-02-16T10:22:01.000Z",
    "status": "pending"
}

# Clear result file
result_path = os.path.expanduser("~/Documents/ae-mcp-bridge/ae_mcp_result.json")
with open(result_path, "w") as f:
    json.dump({"status": "waiting", "message": "Waiting...", "timestamp": "2026-02-16T10:22:00.000Z"}, f)

# Write command
cmd_path = os.path.expanduser("~/Documents/ae-mcp-bridge/ae_command.json")
with open(cmd_path, "w") as f:
    json.dump(cmd, f, indent=2)

print("Command written successfully")
