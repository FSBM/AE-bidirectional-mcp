// Debug test: minimal version to identify the failure point
var result = "START";
try {
    // Step 1: Clear
    while (app.project.numItems > 0) {
        app.project.item(1).remove();
    }
    result += " | CLEARED:" + app.project.numItems;

    // Step 2: Create comp
    var comp = app.project.items.addComp("Debug_Test", 1080, 1920, 1, 10, 30);
    result += " | COMP:" + comp.name;

    // Step 3: Import a file
    var ASSETS_DIR = "/Users/shyamkrishnanmn/Documents/Remotion-test/flip-kart-assets/";
    var io = new ImportOptions(new File(ASSETS_DIR + "Bg-1.png"));
    var bgFile = app.project.importFile(io);
    result += " | IMPORT:" + bgFile.name;

    // Step 4: Add to comp
    var layer = comp.layers.add(bgFile);
    result += " | LAYER:" + layer.name;

    result += " | ITEMS:" + app.project.numItems;
    result += " | LAYERS:" + comp.numLayers;
} catch(e) {
    result += " | ERROR:" + e.toString();
}
// Write result to a file so we can read it
var outFile = new File("~/Desktop/ae_debug_result.txt");
outFile.open("w");
outFile.write(result);
outFile.close();
result;
