// Wrapper that runs flipkart_sale_v2.jsx and catches errors
var logFile = new File("~/Desktop/ae_v2_log.txt");
logFile.open("w");
logFile.writeln("V2 Build Log - " + new Date().toString());
logFile.writeln("========================");

try {
    $.evalFile("/Users/shyamkrishnanmn/Documents/Video-Automation/after-effects-mcp/flipkart_sale_v2.jsx");
    logFile.writeln("SUCCESS");
    logFile.writeln("Items: " + app.project.numItems);
    if (app.project.numItems > 0) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            logFile.writeln("  Item " + i + ": " + item.name + " [" + item.typeName + "]");
            if (item.typeName === "Composition") {
                logFile.writeln("    Layers: " + item.numLayers);
                for (var j = 1; j <= item.numLayers; j++) {
                    logFile.writeln("      L" + j + ": " + item.layer(j).name);
                }
            }
        }
    }
} catch(e) {
    logFile.writeln("ERROR: " + e.toString());
    logFile.writeln("Error message: " + e.message);
    logFile.writeln("Line: " + e.line);
    logFile.writeln("File: " + e.fileName);
    logFile.writeln("--- Project state after error ---");
    logFile.writeln("Items: " + app.project.numItems);
    for (var i = 1; i <= Math.min(app.project.numItems, 10); i++) {
        var itm = app.project.item(i);
        logFile.writeln("  Item " + i + ": " + itm.name + " [" + itm.typeName + "]");
    }
}
logFile.close();
"done";
