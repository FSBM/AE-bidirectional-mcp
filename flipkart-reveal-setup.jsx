// Flipkart Sale Ad — Full Project Setup Script
// Run this in After Effects via File > Scripts > Run Script File
// or via the mcp-bridge-auto panel's executeCustomScript command

(function() {
    app.beginUndoGroup("Flipkart Sale Ad Setup");

    var assetsFolder = "/Users/shyamkrishnanmn/Documents/Remotion-test/flip-kart-assets/";

    // ===== Phase 1: Clean slate (remove old comps if desired) =====
    // Uncomment below to clear project first:
    // while(app.project.numItems > 0) { app.project.item(1).remove(); }

    // ===== Phase 2: Create Main Composition (1080x1920 portrait, 10s, 30fps) =====
    var comp = app.project.items.addComp("Flipkart_Product_Reveal", 1080, 1920, 1, 10, 30);
    comp.bgColor = [0, 0, 0];

    // ===== Phase 3: Import all assets =====
    function importFile(name) {
        var f = new File(assetsFolder + name);
        if (!f.exists) { alert("File not found: " + f.fsName); return null; }
        var io = new ImportOptions(f);
        return app.project.importFile(io);
    }

    var bgItem = importFile("Bg-1.png");
    var fBgItem = importFile("F-bg-1.png");
    var boxItem = importFile("box.png");
    var cursorItem = importFile("cursor.png");
    var saleLogoItem = importFile("Sale logo.png");
    var priceHolderItem = importFile("Rectangle price holder.png");

    // ===== Phase 4: Add layers to composition (bottom to top order) =====

    // --- Layer: Background (Bg-1.png) — bottom layer ---
    var bgLayer = comp.layers.add(bgItem);
    bgLayer.name = "Background";
    // Assets are 1080x1920, comp is 1080x1920 — perfect fit, no scaling needed
    bgLayer.startTime = 0;
    bgLayer.outPoint = 10;

    // --- Layer: Flipkart Background overlay (F-bg-1.png) ---
    var fBgLayer = comp.layers.add(fBgItem);
    fBgLayer.name = "Flipkart_BG_Overlay";
    fBgLayer.startTime = 0;
    fBgLayer.outPoint = 10;
    fBgLayer.property("Opacity").setValue(70); // Semi-transparent overlay

    // --- Layer: Box / Hero Product (box.png) ---
    var boxLayer = comp.layers.add(boxItem);
    boxLayer.name = "Hero_Product_Box";
    boxLayer.startTime = 0;
    boxLayer.outPoint = 10;
    // Position product in upper-center area
    boxLayer.property("Position").setValue([540, 750]);
    boxLayer.property("Scale").setValue([85, 85]);

    // --- Layer: Sale Logo (Sale logo.png) ---
    var saleLayer = comp.layers.add(saleLogoItem);
    saleLayer.name = "Sale_Logo";
    saleLayer.startTime = 0;
    saleLayer.outPoint = 10;
    // Position sale logo at the top
    saleLayer.property("Position").setValue([540, 350]);
    saleLayer.property("Scale").setValue([55, 55]);

    // --- Layer: Price Holder (Rectangle price holder.png) ---
    var priceLayer = comp.layers.add(priceHolderItem);
    priceLayer.name = "Price_Holder";
    priceLayer.startTime = 0;
    priceLayer.outPoint = 10;
    // Position just below the product
    priceLayer.property("Position").setValue([540, 1350]);
    priceLayer.property("Scale").setValue([120, 120]);

    // --- Layer: Cursor (cursor.png) ---
    var cursorLayer = comp.layers.add(cursorItem);
    cursorLayer.name = "Cursor";
    cursorLayer.startTime = 0;
    cursorLayer.outPoint = 10;
    // Start off-screen right
    cursorLayer.property("Position").setValue([1300, 1000]);
    cursorLayer.property("Scale").setValue([200, 200]); // Scale up since cursor is only 55x61

    // ===== Phase 5: Animations =====

    // --- Sale Logo: Slide in from top + scale pop (0s - 1.5s) ---
    var salePosP = saleLayer.property("Position");
    salePosP.setValueAtTime(0, [540, -300]);
    salePosP.setValueAtTime(1.2, [540, 350]);

    var saleScaleP = saleLayer.property("Scale");
    saleScaleP.setValueAtTime(0.8, [0, 0]);
    saleScaleP.setValueAtTime(1.5, [60, 60]);
    saleScaleP.setValueAtTime(1.8, [55, 55]); // Settle bounce

    // --- Hero Product Box: Scale reveal (1s - 2.5s) ---
    var boxScaleP = boxLayer.property("Scale");
    boxScaleP.setValueAtTime(0.5, [0, 0]);
    boxScaleP.setValueAtTime(2.0, [90, 90]);
    boxScaleP.setValueAtTime(2.4, [85, 85]); // Settle

    var boxOpacP = boxLayer.property("Opacity");
    boxOpacP.setValueAtTime(0.5, 0);
    boxOpacP.setValueAtTime(1.5, 100);

    // Float / levitation expression on box
    boxLayer.property("Position").expression =
        "value + [0, Math.sin(time * 2) * 15]";

    // --- F-bg overlay: Fade in (0s - 1s) ---
    var fBgOpac = fBgLayer.property("Opacity");
    fBgOpac.setValueAtTime(0, 0);
    fBgOpac.setValueAtTime(1.0, 70);

    // --- Price Holder: Pop up from below (4s - 5s) ---
    var pricePosP = priceLayer.property("Position");
    pricePosP.setValueAtTime(3.5, [540, 2200]);
    pricePosP.setValueAtTime(4.5, [540, 1300]);
    pricePosP.setValueAtTime(4.8, [540, 1350]); // Bounce settle

    var priceScaleP = priceLayer.property("Scale");
    priceScaleP.setValueAtTime(3.5, [0, 0]);
    priceScaleP.setValueAtTime(4.5, [130, 130]);
    priceScaleP.setValueAtTime(5.0, [120, 120]); // Settle

    // --- Cursor: Move in and click (3s - 6s) ---
    var curPosP = cursorLayer.property("Position");
    curPosP.setValueAtTime(3.0, [1300, 1500]);
    curPosP.setValueAtTime(4.0, [600, 1350]);  // Move to price holder
    curPosP.setValueAtTime(6.0, [600, 1350]);  // Hold
    curPosP.setValueAtTime(7.0, [1300, 1500]); // Move off screen

    // Cursor click effect (scale pulse)
    var curScaleP = cursorLayer.property("Scale");
    curScaleP.setValueAtTime(4.3, [200, 200]);
    curScaleP.setValueAtTime(4.5, [160, 160]); // Click down
    curScaleP.setValueAtTime(4.7, [200, 200]); // Click up
    curScaleP.setValueAtTime(5.0, [160, 160]); // Second click down
    curScaleP.setValueAtTime(5.2, [200, 200]); // Second click up

    // --- Background: Subtle slow zoom (0s - 10s) ---
    var bgScaleP = bgLayer.property("Scale");
    bgScaleP.setValueAtTime(0, [100, 100]);
    bgScaleP.setValueAtTime(10, [110, 110]);

    // ===== Phase 6: Add Text layers for CTA =====

    // Price text
    var priceText = comp.layers.addText("₹999");
    priceText.name = "Price_Text";
    var ptDoc = priceText.property("ADBE Text Properties").property("ADBE Text Document").value;
    ptDoc.fontSize = 72;
    ptDoc.fillColor = [1, 1, 1];
    ptDoc.font = "Arial-BoldMT";
    ptDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
    priceText.property("ADBE Text Properties").property("ADBE Text Document").setValue(ptDoc);
    priceText.property("Position").setValue([540, 1370]);
    priceText.startTime = 0;
    priceText.outPoint = 10;

    var ptOpac = priceText.property("Opacity");
    ptOpac.setValueAtTime(4.0, 0);
    ptOpac.setValueAtTime(4.8, 100);

    // "SHOP NOW" CTA button text
    var ctaText = comp.layers.addText("SHOP NOW");
    ctaText.name = "CTA_Shop_Now";
    var ctaDoc = ctaText.property("ADBE Text Properties").property("ADBE Text Document").value;
    ctaDoc.fontSize = 48;
    ctaDoc.fillColor = [1, 0.84, 0];
    ctaDoc.font = "Arial-BoldMT";
    ctaDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
    ctaText.property("ADBE Text Properties").property("ADBE Text Document").setValue(ctaDoc);
    ctaText.property("Position").setValue([540, 1700]);
    ctaText.startTime = 0;
    ctaText.outPoint = 10;

    // CTA fade + pulse
    var ctaOpac = ctaText.property("Opacity");
    ctaOpac.setValueAtTime(5.0, 0);
    ctaOpac.setValueAtTime(5.8, 100);

    // CTA pulsing scale expression (starts after appearing)
    ctaText.property("Scale").expression =
        "t = Math.max(time - 5.8, 0); s = 100 + Math.sin(t * 4) * 5; [s, s]";

    // "Limited Offer" subtitle
    var subText = comp.layers.addText("Limited Time Offer!");
    subText.name = "Subtitle_Offer";
    var subDoc = subText.property("ADBE Text Properties").property("ADBE Text Document").value;
    subDoc.fontSize = 36;
    subDoc.fillColor = [1, 1, 1];
    subDoc.font = "Arial";
    subDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
    subText.property("ADBE Text Properties").property("ADBE Text Document").setValue(subDoc);
    subText.property("Position").setValue([540, 1550]);
    subText.startTime = 0;
    subText.outPoint = 10;

    var subOpac = subText.property("Opacity");
    subOpac.setValueAtTime(5.5, 0);
    subOpac.setValueAtTime(6.3, 100);

    // ===== Phase 7: Apply Effects =====

    // Drop shadow on product box
    try {
        var dsFx = boxLayer.property("Effects").addProperty("ADBE Drop Shadow");
        dsFx.property("Opacity").setValue(180);
        dsFx.property("Direction").setValue(135);
        dsFx.property("Distance").setValue(20);
        dsFx.property("Softness").setValue(30);
    } catch(e) { /* Effect may not be available */ }

    // Glow on sale logo (if available)
    try {
        var glowFx = saleLayer.property("Effects").addProperty("ADBE Glow");
        glowFx.property("Glow Threshold").setValue(60);
        glowFx.property("Glow Radius").setValue(20);
        glowFx.property("Glow Intensity").setValue(1);
    } catch(e) { /* Effect may not be available */ }

    // ===== Phase 8: Add to Render Queue =====
    try {
        var rqItem = app.project.renderQueue.items.add(comp);
        // Set output module to a common format
        var om = rqItem.outputModule(1);
        // Try to set output file path
        var outputFile = new File("~/Desktop/Flipkart_Product_Reveal_v1.mov");
        om.file = outputFile;
    } catch(e) { /* Render queue setup may vary by AE version */ }

    app.endUndoGroup();

    // Write result for bridge
    var resultObj = {
        status: "success",
        message: "Flipkart Product Reveal project created successfully!",
        composition: "Flipkart_Product_Reveal (1080x1920, 10s, 30fps)",
        layers: [
            "Background (Bg-1.png)",
            "Flipkart_BG_Overlay (F-bg-1.png, 70% opacity)",
            "Hero_Product_Box (box.png, animated scale + float)",
            "Sale_Logo (Sale logo.png, slide-in + bounce)",
            "Price_Holder (Rectangle price holder.png, pop-up)",
            "Cursor (cursor.png, click animation)",
            "Price_Text (₹999)",
            "CTA_Shop_Now (SHOP NOW, pulsing)",
            "Subtitle_Offer (Limited Time Offer!)"
        ],
        animations: [
            "Sale Logo: slide from top (0-1.2s) + scale bounce",
            "Product Box: scale reveal (0.5-2.4s) + floating expression",
            "Background: slow zoom (0-10s)",
            "FBG Overlay: fade in (0-1s)",
            "Price Holder: pop up from below (3.5-5s) + elastic bounce",
            "Cursor: move in (3-4s), click (4.3-5.2s), move out (6-7s)",
            "Price Text: fade in (4-4.8s)",
            "SHOP NOW: fade in (5-5.8s) + pulse expression",
            "Limited Time Offer: fade in (5.5-6.3s)"
        ],
        effects: ["Drop Shadow on Product Box", "Glow on Sale Logo"],
        renderOutput: "~/Desktop/Flipkart_Product_Reveal_v1.mov"
    };

    // Return result string
    return JSON.stringify(resultObj, null, 2);
})();
