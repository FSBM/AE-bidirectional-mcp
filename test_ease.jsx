// Test setTemporalEaseAtKey
var result = "";
try {
    // Clean
    while (app.project.numItems > 0) app.project.item(1).remove();

    var comp = app.project.items.addComp("EaseTest", 1080, 1920, 1, 10, 30);
    var solid = comp.layers.addSolid([1,0,0], "TestSolid", 1080, 1920, 1);

    // Set 2 keyframes on position
    solid.position.setValueAtTime(0, [540, 960]);
    solid.position.setValueAtTime(5, [200, 500]);
    result += "Keys: " + solid.position.numKeys;

    // Try easing with different speed values
    try {
        var e1 = [new KeyframeEase(0, 33), new KeyframeEase(0, 33)];
        var e2 = [new KeyframeEase(0, 85), new KeyframeEase(0, 85)];
        solid.position.setTemporalEaseAtKey(1, e1, e2);
        result += " | Ease1:OK";
    } catch(e) {
        result += " | Ease1:FAIL(" + e.message + ")";
    }

    // Try with non-zero speed
    try {
        var e3 = [new KeyframeEase(100, 33), new KeyframeEase(100, 33)];
        var e4 = [new KeyframeEase(100, 85), new KeyframeEase(100, 85)];
        solid.position.setTemporalEaseAtKey(2, e3, e4);
        result += " | Ease2:OK";
    } catch(e) {
        result += " | Ease2:FAIL(" + e.message + ")";
    }

} catch(e) {
    result += " | MAIN_ERROR:" + e.message;
}

var f = new File("~/Desktop/ae_ease_test.txt");
f.open("w"); f.write(result); f.close();
result;
