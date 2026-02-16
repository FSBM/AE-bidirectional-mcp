// ============================================================
// Flipkart Sale V2 - Remotion-Quality Animated Ad
// Replicates spring physics, parallax pan, price countdown,
// bezier cursor, constellation lines, motion blur from Remotion
// ============================================================
(function() {
    app.beginUndoGroup("Flipkart Sale V2");

    // ===== CONFIGURATION =====
    var ASSETS_DIR = "/Users/shyamkrishnanmn/Documents/Remotion-test/flip-kart-assets/";
    var FPS = 30;
    var DUR = 10;
    var W = 1080;
    var H = 1920;

    // ===== CLEAR PROJECT =====
    while (app.project.numItems > 0) {
        app.project.item(1).remove();
    }

    // ===== CREATE COMPOSITION =====
    var comp = app.project.items.addComp("Flipkart_Sale_V2", W, H, 1, DUR, FPS);
    comp.bgColor = [0, 0, 0];

    // ===== IMPORT ASSETS =====
    function importFile(name) {
        var io = new ImportOptions(new File(ASSETS_DIR + name));
        return app.project.importFile(io);
    }

    var bgFile = importFile("Bg-1.png");
    var fgFile = importFile("F-bg-1.png");
    var boxFile = importFile("box.png");
    var saleFile = importFile("Sale logo.png");
    var priceHolderFile = importFile("Rectangle price holder.png");
    var cursorFile = importFile("cursor.png");

    // ===== HELPER =====
    function addFootage(file, name) {
        var layer = comp.layers.add(file);
        layer.name = name;
        return layer;
    }

    // ===== EXPRESSION TEMPLATES =====
    // Spring Bounce (apply on top of keyframes) — matches Remotion spring(damping=12)
    var springExpr = [
        'var amp = 0.06;',
        'var freq = 3.0;',
        'var decay = 6.0;',
        'var n = 0;',
        'if (numKeys > 0) {',
        '  n = nearestKey(time).index;',
        '  if (key(n).time > time) n--;',
        '}',
        'var t = 0;',
        'if (n > 0) { t = time - key(n).time; }',
        'if (n > 0 && t < 1.5) {',
        '  var v = velocityAtTime(key(n).time - thisComp.frameDuration/10);',
        '  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);',
        '} else {',
        '  value;',
        '}'
    ].join('\n');

    // Stronger spring (damping=8) for product/price
    var springStrong = [
        'var amp = 0.08;',
        'var freq = 2.5;',
        'var decay = 4.0;',
        'var n = 0;',
        'if (numKeys > 0) {',
        '  n = nearestKey(time).index;',
        '  if (key(n).time > time) n--;',
        '}',
        'var t = 0;',
        'if (n > 0) { t = time - key(n).time; }',
        'if (n > 0 && t < 2) {',
        '  var v = velocityAtTime(key(n).time - thisComp.frameDuration/10);',
        '  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);',
        '} else {',
        '  value;',
        '}'
    ].join('\n');

    // Hover float (after entry settles)
    var floatExpr = [
        'var settle = 2;',
        'if (time > settle) {',
        '  var elapsed = time - settle;',
        '  var floatY = Math.sin(elapsed * 1.5) * 8;',
        '  value + [0, floatY];',
        '} else {',
        '  value;',
        '}'
    ].join('\n');

    // Easing presets — Position is spatial, so uses 1 element for temporal ease
    // All other props (Scale, Opacity, Sliders) also use matching dimension count
    function ease1(spd, inf) { return [new KeyframeEase(spd, inf)]; }
    function easeNone() { return ease1(0, 33); }
    function easeExpOut() { return ease1(0, 85); }
    function easeBez() { return ease1(0, 70); }

    // ============================================================
    // BUILD LAYERS
    // ============================================================

    // ---------- 1. BG PARALLAX ----------
    // Remotion: ParallaxBackground — 300% width, horizontal pan, velocity blur, flicker
    var bgLayer = addFootage(bgFile, "BG_Parallax");
    bgLayer.startTime = 0;
    bgLayer.outPoint = DUR;
    bgLayer.anchorPoint.setValue([540, 960]);
    bgLayer.scale.setValue([220, 220]); // oversized for panning headroom
    // Pan right-to-left over full duration
    bgLayer.position.setValueAtTime(0, [1100, 960]);
    bgLayer.position.setValueAtTime(DUR, [-20, 960]);
    // Graceful ease
    bgLayer.position.setTemporalEaseAtKey(1, easeNone(), easeExpOut());
    bgLayer.position.setTemporalEaseAtKey(2, easeExpOut(), easeNone());
    // Brightness flicker — Remotion: Math.sin(frame * flickerSpeed) * amplitude + 1
    bgLayer.opacity.expression = [
        'var flicker = Math.sin(time * 3) * 1.5 + 98;',
        'flicker;'
    ].join('\n');
    // Directional Blur for motion feel
    try {
        var dirBlur = bgLayer.Effects.addProperty("ADBE Directional Blur");
        dirBlur.property("Direction").setValue(0);
        dirBlur.property("Blur Length").setValueAtTime(0, 4);
        dirBlur.property("Blur Length").setValueAtTime(DUR * 0.5, 1);
        dirBlur.property("Blur Length").setValueAtTime(DUR, 4);
    } catch(e) {}

    // ---------- 2. FOREGROUND OVERLAY ----------
    // F-bg-1.png as screen-blended overlay (like fire overlay in Remotion)
    var fgLayer = addFootage(fgFile, "FG_Overlay");
    fgLayer.startTime = 0;
    fgLayer.outPoint = DUR;
    fgLayer.position.setValue([540, 960]);
    fgLayer.scale.setValue([100, 100]);
    fgLayer.blendingMode = BlendingMode.SCREEN;
    fgLayer.opacity.setValueAtTime(0, 0);
    fgLayer.opacity.setValueAtTime(0.5, 55);
    fgLayer.opacity.setValueAtTime(8, 55);
    fgLayer.opacity.setValueAtTime(DUR, 0);

    // ---------- 3. GLOW LAYER ----------
    // Soft orange glow behind product — Remotion: fire overlay with screen blend
    var glowLayer = comp.layers.addSolid([1.0, 0.5, 0.0], "Glow_BG", W, W, 1);
    glowLayer.position.setValue([540, 780]);
    glowLayer.scale.setValue([130, 100]);
    glowLayer.blendingMode = BlendingMode.SCREEN;
    glowLayer.opacity.setValueAtTime(0, 0);
    glowLayer.opacity.setValueAtTime(0.8, 0);
    glowLayer.opacity.setValueAtTime(1.5, 45);
    glowLayer.opacity.setValueAtTime(8.5, 45);
    glowLayer.opacity.setValueAtTime(DUR, 0);
    try {
        var glowBlur = glowLayer.Effects.addProperty("ADBE Gaussian Blur 2");
        glowBlur.property("Blurriness").setValue(90);
    } catch(e) {}
    // Pulsing glow — Remotion: subtle ambient brightness oscillation
    glowLayer.opacity.expression = [
        'var base = value;',
        'var pulse = Math.sin(time * 2.5) * 6;',
        'Math.max(0, base + pulse);'
    ].join('\n');

    // ---------- 4. HERO PRODUCT ----------
    // Remotion: Easing.out(Easing.exp) entry + spring landing + motion blur trail
    var productLayer = addFootage(boxFile, "Hero_Product");
    productLayer.startTime = 0;
    productLayer.outPoint = DUR;
    productLayer.anchorPoint.setValue([540, 960]);
    // Exponential ease-out entry from below (like LaptopAnimation)
    productLayer.position.setValueAtTime(0, [540, 2800]);
    productLayer.position.setValueAtTime(0.3, [540, 2800]);
    productLayer.position.setValueAtTime(1.3, [540, 960]);
    productLayer.position.setTemporalEaseAtKey(2, easeNone(), easeExpOut());
    productLayer.position.setTemporalEaseAtKey(3, easeExpOut(), easeNone());
    // Spring bounce + hover float expression (spring landing like Remotion)
    productLayer.position.expression = [
        '// Spring bounce on keyframes',
        'var amp = 0.07;',
        'var freq = 2.5;',
        'var decay = 5.0;',
        'var n = 0;',
        'if (numKeys > 0) {',
        '  n = nearestKey(time).index;',
        '  if (key(n).time > time) n--;',
        '}',
        'var t = 0;',
        'if (n > 0) { t = time - key(n).time; }',
        'var springVal = value;',
        'if (n > 0 && t < 2) {',
        '  var v = velocityAtTime(key(n).time - thisComp.frameDuration/10);',
        '  springVal = value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);',
        '}',
        '// Hover float after settling',
        'if (time > 2.5) {',
        '  var elapsed = time - 2.5;',
        '  springVal = springVal + [0, Math.sin(elapsed * 1.5) * 6];',
        '}',
        'springVal;'
    ].join('\n');
    // Scale overshoot on landing
    productLayer.scale.setValueAtTime(0.3, [115, 115]);
    productLayer.scale.setValueAtTime(1.3, [100, 100]);
    productLayer.scale.expression = springStrong;
    // Fade in
    productLayer.opacity.setValueAtTime(0, 0);
    productLayer.opacity.setValueAtTime(0.5, 100);
    // Drop Shadow — Remotion: filter: drop-shadow(0 20px 30px rgba(0,0,0,0.8))
    try {
        var prodShadow = productLayer.Effects.addProperty("ADBE Drop Shadow");
        prodShadow.property("Opacity").setValue(200);
        prodShadow.property("Direction").setValue(180);
        prodShadow.property("Distance").setValue(25);
        prodShadow.property("Softness").setValue(40);
    } catch(e) {}
    // CC Force Motion Blur for entry
    try {
        var ccBlur = productLayer.Effects.addProperty("CC Force Motion Blur");
        ccBlur.property("Motion Blur Samples").setValue(8);
        ccBlur.property("Override Shutter Angle").setValue(180);
    } catch(e) {}

    // ---------- 5. SALE LOGO ----------
    // Remotion Scene1: logo at top with spring entry
    var saleLayer = addFootage(saleFile, "Sale_Logo");
    saleLayer.startTime = 0;
    saleLayer.outPoint = DUR;
    saleLayer.anchorPoint.setValue([540, 960]);
    saleLayer.scale.setValue([80, 80]);
    // Spring slide from left — Remotion: spring({from: -500, to: 0, damping: 12})
    saleLayer.position.setValueAtTime(0, [-600, 960]);
    saleLayer.position.setValueAtTime(0.15, [-600, 960]);
    saleLayer.position.setValueAtTime(0.9, [540, 960]);
    saleLayer.position.setTemporalEaseAtKey(2, easeNone(), easeExpOut());
    saleLayer.position.setTemporalEaseAtKey(3, easeExpOut(), easeNone());
    saleLayer.position.expression = springExpr;
    saleLayer.opacity.setValueAtTime(0, 0);
    saleLayer.opacity.setValueAtTime(0.3, 100);

    // ---------- 6. CONSTELLATION LINES ----------
    // Remotion Scene2: strokeDashoffset animated lines
    var linesLayer = comp.layers.addShape();
    linesLayer.name = "Constellation_Lines";
    linesLayer.startTime = 0;
    linesLayer.outPoint = DUR;

    // Line 1 — top area
    var grp1 = linesLayer.property("Contents").addProperty("ADBE Vector Group");
    grp1.name = "Line1";
    var pp1 = grp1.property("Contents").addProperty("ADBE Vector Shape - Group");
    var s1 = new Shape();
    s1.vertices = [[60, 250], [350, 450], [650, 200], [1020, 380]];
    s1.closed = false;
    pp1.property("Path").setValue(s1);
    var st1 = grp1.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
    st1.property("Color").setValue([1, 1, 1]);
    st1.property("Stroke Width").setValue(1.5);
    st1.property("Opacity").setValue(35);
    var tr1 = grp1.property("Contents").addProperty("ADBE Vector Filter - Trim");
    tr1.property("End").setValueAtTime(0.5, 0);
    tr1.property("End").setValueAtTime(3.5, 100);

    // Line 2 — middle area
    var grp2 = linesLayer.property("Contents").addProperty("ADBE Vector Group");
    grp2.name = "Line2";
    var pp2 = grp2.property("Contents").addProperty("ADBE Vector Shape - Group");
    var s2 = new Shape();
    s2.vertices = [[120, 1050], [480, 850], [780, 1100], [1000, 900]];
    s2.closed = false;
    pp2.property("Path").setValue(s2);
    var st2 = grp2.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
    st2.property("Color").setValue([0.7, 0.85, 1]);
    st2.property("Stroke Width").setValue(1.5);
    st2.property("Opacity").setValue(30);
    var tr2 = grp2.property("Contents").addProperty("ADBE Vector Filter - Trim");
    tr2.property("End").setValueAtTime(1.5, 0);
    tr2.property("End").setValueAtTime(4.5, 100);

    // Line 3 — diagonal sweep
    var grp3 = linesLayer.property("Contents").addProperty("ADBE Vector Group");
    grp3.name = "Line3";
    var pp3 = grp3.property("Contents").addProperty("ADBE Vector Shape - Group");
    var s3 = new Shape();
    s3.vertices = [[950, 150], [600, 650], [250, 1300], [100, 1750]];
    s3.closed = false;
    pp3.property("Path").setValue(s3);
    var st3 = grp3.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
    st3.property("Color").setValue([0.5, 0.7, 1]);
    st3.property("Stroke Width").setValue(1);
    st3.property("Opacity").setValue(20);
    var tr3 = grp3.property("Contents").addProperty("ADBE Vector Filter - Trim");
    tr3.property("End").setValueAtTime(2, 0);
    tr3.property("End").setValueAtTime(6, 100);

    // Line 4 — bottom connector
    var grp4 = linesLayer.property("Contents").addProperty("ADBE Vector Group");
    grp4.name = "Line4";
    var pp4 = grp4.property("Contents").addProperty("ADBE Vector Shape - Group");
    var s4 = new Shape();
    s4.vertices = [[80, 1600], [400, 1500], [700, 1650], [1000, 1550]];
    s4.closed = false;
    pp4.property("Path").setValue(s4);
    var st4 = grp4.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
    st4.property("Color").setValue([1, 0.9, 0.5]);
    st4.property("Stroke Width").setValue(1);
    st4.property("Opacity").setValue(25);
    var tr4 = grp4.property("Contents").addProperty("ADBE Vector Filter - Trim");
    tr4.property("End").setValueAtTime(3, 0);
    tr4.property("End").setValueAtTime(7, 100);

    linesLayer.opacity.setValue(70);

    // ---------- 7. PRICE TRACK LINE ----------
    // Remotion PriceTimeline: animated track line
    var trackLine = comp.layers.addShape();
    trackLine.name = "Price_Track";
    var trackGrp = trackLine.property("Contents").addProperty("ADBE Vector Group");
    var trackPath = trackGrp.property("Contents").addProperty("ADBE Vector Shape - Group");
    var trackShape = new Shape();
    trackShape.vertices = [[-380, 0], [380, 0]];
    trackShape.closed = false;
    trackPath.property("Path").setValue(trackShape);
    var trackStrokeObj = trackGrp.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
    trackStrokeObj.property("Color").setValue([1, 1, 1]);
    trackStrokeObj.property("Stroke Width").setValue(3);
    trackStrokeObj.property("Opacity").setValue(40);
    trackLine.position.setValue([540, 1580]);
    var trackTrim = trackGrp.property("Contents").addProperty("ADBE Vector Filter - Trim");
    trackTrim.property("End").setValueAtTime(2.8, 0);
    trackTrim.property("End").setValueAtTime(3.6, 100);
    trackLine.opacity.setValueAtTime(2.5, 0);
    trackLine.opacity.setValueAtTime(3.2, 80);
    // Glow effect on track — try expression on stroke opacity
    try {
        trackStrokeObj.property("Opacity").expression = [
            'if (time > 3) {',
            '  40 + Math.sin(time * 4) * 10;',
            '} else { value; }'
        ].join('\n');
    } catch(e) {
        // Shape stroke opacity may not support expressions in some versions
    }

    // ---------- 8. PRICE SLIDER DOT ----------
    // Remotion PriceTimeline: glowing dot that slides along track
    var dotLayer = comp.layers.addShape();
    dotLayer.name = "Price_Dot";
    var dotGrp = dotLayer.property("Contents").addProperty("ADBE Vector Group");
    var dotEllipse = dotGrp.property("Contents").addProperty("ADBE Vector Shape - Ellipse");
    dotEllipse.property("Size").setValue([22, 22]);
    var dotFill = dotGrp.property("Contents").addProperty("ADBE Vector Graphic - Fill");
    dotFill.property("Color").setValue([1, 1, 1]);
    // Outer glow ring
    var dotStrokeRing = dotGrp.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
    dotStrokeRing.property("Color").setValue([1, 1, 1]);
    dotStrokeRing.property("Stroke Width").setValue(3);
    dotStrokeRing.property("Opacity").setValue(40);
    // Slide position — Remotion: dotStartPos to dotEndPos with easeType
    dotLayer.position.setValueAtTime(3.0, [170, 1580]);
    dotLayer.position.setValueAtTime(5.5, [910, 1580]);
    dotLayer.position.setTemporalEaseAtKey(1, easeNone(), easeBez());
    dotLayer.position.setTemporalEaseAtKey(2, easeBez(), easeNone());
    dotLayer.opacity.setValueAtTime(2.8, 0);
    dotLayer.opacity.setValueAtTime(3.2, 100);
    // Pulsing glow — Remotion: glowIntensity animation
    dotLayer.scale.expression = [
        'var glow = Math.sin(time * 5) * 12 + 100;',
        '[glow, glow];'
    ].join('\n');

    // ---------- 9. PRICE HOLDER ----------
    // Spring entry from bottom — Remotion Scene2: priceCardY spring(damping=14)
    var priceHolderLayer = addFootage(priceHolderFile, "Price_Holder");
    priceHolderLayer.anchorPoint.setValue([334.5, 111]);
    priceHolderLayer.scale.setValue([155, 155]);
    priceHolderLayer.position.setValueAtTime(2.5, [540, 2200]);
    priceHolderLayer.position.setValueAtTime(2.8, [540, 2200]);
    priceHolderLayer.position.setValueAtTime(3.5, [540, 1510]);
    priceHolderLayer.position.setTemporalEaseAtKey(2, easeNone(), easeExpOut());
    priceHolderLayer.position.setTemporalEaseAtKey(3, easeExpOut(), easeNone());
    priceHolderLayer.position.expression = springStrong;
    priceHolderLayer.opacity.setValueAtTime(2.5, 0);
    priceHolderLayer.opacity.setValueAtTime(3.0, 100);
    try {
        var phShadow = priceHolderLayer.Effects.addProperty("ADBE Drop Shadow");
        phShadow.property("Opacity").setValue(170);
        phShadow.property("Direction").setValue(180);
        phShadow.property("Distance").setValue(12);
        phShadow.property("Softness").setValue(25);
    } catch(e) {}

    // ---------- 10. PRICE TEXT (animated countdown) ----------
    // Remotion PriceTimeline: animated price 93490→47999 with easing
    var priceText = comp.layers.addText("99,999");
    var ptd = priceText.property("Source Text").value;
    ptd.resetCharStyle();
    ptd.fontSize = 62;
    ptd.fillColor = [1, 1, 1];
    ptd.font = "Arial-BoldMT";
    ptd.justification = ParagraphJustification.CENTER_JUSTIFY;
    priceText.property("Source Text").setValue(ptd);
    priceText.name = "Price_Text";
    priceText.position.setValue([555, 1520]);
    // Slider Control for price animation
    priceText.Effects.addProperty("ADBE Slider Control");
    var sliderProp = priceText.Effects("Slider Control").property("Slider");
    sliderProp.setValueAtTime(3.0, 99999);
    sliderProp.setValueAtTime(5.5, 29999);
    sliderProp.setTemporalEaseAtKey(1, easeNone(), easeExpOut());
    sliderProp.setTemporalEaseAtKey(2, easeExpOut(), easeNone());
    // sourceText expression — animates price display with Indian formatting
    priceText.property("Source Text").expression = [
        'var s = effect("Slider Control")("Slider");',
        'var n = Math.round(s);',
        'var thousands = Math.floor(n / 1000);',
        'var remainder = n % 1000;',
        'var padded = remainder < 100 ? (remainder < 10 ? "00" + remainder : "0" + remainder) : "" + remainder;',
        'var rupee = String.fromCharCode(8377);',
        'rupee + thousands + "," + padded;'
    ].join('\n');
    priceText.opacity.setValueAtTime(3.0, 0);
    priceText.opacity.setValueAtTime(3.4, 100);
    // Pop scale at end of countdown — Remotion: popScale with Easing.out(Easing.back(2))
    priceText.scale.setValueAtTime(5.3, [100, 100]);
    priceText.scale.setValueAtTime(5.6, [112, 112]);
    priceText.scale.setValueAtTime(5.9, [100, 100]);
    priceText.scale.expression = springExpr;

    // ---------- 11. OLD PRICE ----------
    // Remotion Scene2: strikethrough original price
    var oldPrice = comp.layers.addText("99,999");
    var opd = oldPrice.property("Source Text").value;
    opd.resetCharStyle();
    opd.fontSize = 34;
    opd.fillColor = [0.65, 0.65, 0.65];
    opd.font = "Arial-BoldMT";
    opd.justification = ParagraphJustification.CENTER_JUSTIFY;
    oldPrice.property("Source Text").setValue(opd);
    oldPrice.name = "Old_Price";
    oldPrice.position.setValue([430, 1520]);
    oldPrice.opacity.setValueAtTime(5.3, 0);
    oldPrice.opacity.setValueAtTime(5.8, 75);

    // Strikethrough line
    var strikeLine = comp.layers.addShape();
    strikeLine.name = "Strikethrough";
    var stGrp = strikeLine.property("Contents").addProperty("ADBE Vector Group");
    var stPathProp = stGrp.property("Contents").addProperty("ADBE Vector Shape - Group");
    var stShape = new Shape();
    stShape.vertices = [[-70, 0], [70, 0]];
    stShape.closed = false;
    stPathProp.property("Path").setValue(stShape);
    var stStroke = stGrp.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
    stStroke.property("Color").setValue([0.9, 0.2, 0.2]);
    stStroke.property("Stroke Width").setValue(2.5);
    strikeLine.position.setValue([430, 1515]);
    var stTrim = stGrp.property("Contents").addProperty("ADBE Vector Filter - Trim");
    stTrim.property("End").setValueAtTime(5.5, 0);
    stTrim.property("End").setValueAtTime(6.0, 100);
    strikeLine.opacity.setValueAtTime(5.3, 0);
    strikeLine.opacity.setValueAtTime(5.8, 100);

    // ---------- 12. CTA BACKGROUND ----------
    // Flipkart blue rounded rect — Remotion: backgroundColor '#2874f0'
    var ctaBg = comp.layers.addShape();
    ctaBg.name = "CTA_BG";
    var ctaGrp = ctaBg.property("Contents").addProperty("ADBE Vector Group");
    var ctaRect = ctaGrp.property("Contents").addProperty("ADBE Vector Shape - Rect");
    ctaRect.property("Size").setValue([420, 80]);
    ctaRect.property("Roundness").setValue(40);
    var ctaFill = ctaGrp.property("Contents").addProperty("ADBE Vector Graphic - Fill");
    ctaFill.property("Color").setValue([0.157, 0.455, 0.941]);
    ctaBg.position.setValue([540, 1730]);
    // Pop-in — matches Remotion spring entry
    ctaBg.scale.setValueAtTime(6.0, [0, 0]);
    ctaBg.scale.setValueAtTime(6.4, [105, 105]);
    ctaBg.scale.setValueAtTime(6.6, [100, 100]);
    ctaBg.scale.expression = springExpr;
    ctaBg.opacity.setValueAtTime(5.8, 0);
    ctaBg.opacity.setValueAtTime(6.2, 100);
    // Pulse after settling
    ctaBg.scale.expression = [
        '// Spring on keyframes',
        'var amp = 0.06;',
        'var freq = 3.0;',
        'var decay = 6.0;',
        'var n = 0;',
        'if (numKeys > 0) {',
        '  n = nearestKey(time).index;',
        '  if (key(n).time > time) n--;',
        '}',
        'var t = 0;',
        'if (n > 0) { t = time - key(n).time; }',
        'var result = value;',
        'if (n > 0 && t < 1.5) {',
        '  var v = velocityAtTime(key(n).time - thisComp.frameDuration/10);',
        '  result = value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);',
        '}',
        '// Continuous pulse after 7.5s',
        'if (time > 7.5) {',
        '  var p = Math.sin((time - 7.5) * 4) * 4;',
        '  result = result + [p, p];',
        '}',
        'result;'
    ].join('\n');

    // ---------- 13. CTA TEXT ----------
    var ctaText = comp.layers.addText("SHOP NOW");
    var ctd = ctaText.property("Source Text").value;
    ctd.resetCharStyle();
    ctd.fontSize = 34;
    ctd.fillColor = [1, 1, 1];
    ctd.font = "Arial-BoldMT";
    ctd.justification = ParagraphJustification.CENTER_JUSTIFY;
    ctaText.property("Source Text").setValue(ctd);
    ctaText.name = "CTA_Text";
    ctaText.position.setValue([540, 1730]);
    ctaText.opacity.setValueAtTime(6.0, 0);
    ctaText.opacity.setValueAtTime(6.4, 100);
    // Mirror CTA_BG pulse
    ctaText.scale.expression = [
        'if (time > 7.5) {',
        '  var p = Math.sin((time - 7.5) * 4) * 4 + 100;',
        '  [p, p];',
        '} else {',
        '  [100, 100];',
        '}'
    ].join('\n');

    // ---------- 14. CURSOR ----------
    // Remotion Scene2: bezier(0.25, 0.1, 0.25, 1) move + click bounce
    var cursorLayer = addFootage(cursorFile, "Cursor");
    cursorLayer.scale.setValue([200, 200]);
    // Bezier path to CTA button
    cursorLayer.position.setValueAtTime(6.5, [1200, 2100]);
    cursorLayer.position.setValueAtTime(7.5, [650, 1730]);
    // Set bezier ease — cubic-bezier(0.25, 0.1, 0.25, 1) approximation
    cursorLayer.position.setTemporalEaseAtKey(1, ease1(0, 40), ease1(0, 80));
    cursorLayer.position.setTemporalEaseAtKey(2, ease1(0, 80), ease1(0, 40));
    // Click bounce — Remotion: cursorScale [80, 85, 90] → [1, 0.8, 1]
    cursorLayer.scale.setValueAtTime(7.5, [200, 200]);
    cursorLayer.scale.setValueAtTime(7.7, [160, 160]);
    cursorLayer.scale.setValueAtTime(7.9, [200, 200]);
    cursorLayer.scale.expression = springExpr;
    cursorLayer.opacity.setValueAtTime(6.3, 0);
    cursorLayer.opacity.setValueAtTime(6.8, 100);
    cursorLayer.opacity.setValueAtTime(9, 100);
    cursorLayer.opacity.setValueAtTime(9.5, 0);

    // ---------- 15. TITLE TEXT ----------
    // Remotion Scene1: bold hero text with spring + text shadow
    var titleText = comp.layers.addText("MEGA SALE");
    var ttd = titleText.property("Source Text").value;
    ttd.resetCharStyle();
    ttd.fontSize = 100;
    ttd.fillColor = [1, 1, 1];
    ttd.font = "Arial-BoldMT";
    ttd.justification = ParagraphJustification.CENTER_JUSTIFY;
    try { ttd.tracking = 80; } catch(e) {}
    titleText.property("Source Text").setValue(ttd);
    titleText.name = "Title_Text";
    // Spring drop from top
    titleText.position.setValueAtTime(0, [540, -200]);
    titleText.position.setValueAtTime(0.2, [540, -200]);
    titleText.position.setValueAtTime(0.8, [540, 280]);
    titleText.position.setTemporalEaseAtKey(2, easeNone(), easeExpOut());
    titleText.position.setTemporalEaseAtKey(3, easeExpOut(), easeNone());
    titleText.position.expression = springExpr;
    titleText.opacity.setValueAtTime(0, 0);
    titleText.opacity.setValueAtTime(0.4, 100);
    // Fade out for scene 2
    titleText.opacity.setValueAtTime(7, 100);
    titleText.opacity.setValueAtTime(8, 0);
    try {
        var titleShadow = titleText.Effects.addProperty("ADBE Drop Shadow");
        titleShadow.property("Opacity").setValue(220);
        titleShadow.property("Direction").setValue(180);
        titleShadow.property("Distance").setValue(8);
        titleShadow.property("Softness").setValue(20);
    } catch(e) {}

    // ---------- 16. SUBTITLE TEXT ----------
    // Remotion: "SMARTEST AI..." style text with spring fade
    var subText = comp.layers.addText("UP TO 80% OFF");
    var subd = subText.property("Source Text").value;
    subd.resetCharStyle();
    subd.fontSize = 48;
    subd.fillColor = [1, 0.85, 0];
    subd.font = "Arial-BoldMT";
    subd.justification = ParagraphJustification.CENTER_JUSTIFY;
    subText.property("Source Text").setValue(subd);
    subText.name = "Subtitle_Text";
    subText.position.setValueAtTime(0.6, [540, 500]);
    subText.position.setValueAtTime(1.1, [540, 400]);
    subText.position.expression = springExpr;
    subText.opacity.setValueAtTime(0.5, 0);
    subText.opacity.setValueAtTime(1.0, 100);
    subText.opacity.setValueAtTime(7, 100);
    subText.opacity.setValueAtTime(8, 0);

    // ---------- 17. "NOW AT LOWEST PRICES" CTA ----------
    // Remotion Scene1: Flipkart blue pill badge
    var badgeShape = comp.layers.addShape();
    badgeShape.name = "Badge_BG";
    var badgeGrp = badgeShape.property("Contents").addProperty("ADBE Vector Group");
    var badgeRect = badgeGrp.property("Contents").addProperty("ADBE Vector Shape - Rect");
    badgeRect.property("Size").setValue([650, 70]);
    badgeRect.property("Roundness").setValue(35);
    var badgeFill = badgeGrp.property("Contents").addProperty("ADBE Vector Graphic - Fill");
    badgeFill.property("Color").setValue([0.157, 0.455, 0.941]);
    badgeShape.position.setValue([540, 1820]);
    badgeShape.scale.setValueAtTime(1.5, [0, 0]);
    badgeShape.scale.setValueAtTime(2.0, [100, 100]);
    badgeShape.scale.expression = springExpr;
    badgeShape.opacity.setValueAtTime(1.3, 0);
    badgeShape.opacity.setValueAtTime(1.8, 100);

    var badgeText = comp.layers.addText("NOW AT LOWEST PRICES");
    var btd = badgeText.property("Source Text").value;
    btd.resetCharStyle();
    btd.fontSize = 30;
    btd.fillColor = [1, 1, 1];
    btd.font = "Arial-BoldMT";
    btd.justification = ParagraphJustification.CENTER_JUSTIFY;
    badgeText.property("Source Text").setValue(btd);
    badgeText.name = "Badge_Text";
    badgeText.position.setValue([540, 1820]);
    badgeText.opacity.setValueAtTime(1.6, 0);
    badgeText.opacity.setValueAtTime(2.0, 100);

    // ---------- 18. CLICK FLASH ----------
    // White flash on cursor click
    var flashLayer = comp.layers.addSolid([1, 1, 1], "Click_Flash", W, H, 1);
    flashLayer.startTime = 0;
    flashLayer.outPoint = DUR;
    flashLayer.blendingMode = BlendingMode.ADD;
    flashLayer.opacity.setValueAtTime(0, 0);
    flashLayer.opacity.setValueAtTime(7.65, 0);
    flashLayer.opacity.setValueAtTime(7.7, 30);
    flashLayer.opacity.setValueAtTime(7.9, 0);

    // ============================================================
    // REORDER LAYERS (1 = top of stack)
    // ============================================================
    var layerOrder = [
        "Click_Flash",
        "Cursor",
        "CTA_Text",
        "CTA_BG",
        "Strikethrough",
        "Old_Price",
        "Price_Text",
        "Price_Dot",
        "Price_Track",
        "Price_Holder",
        "Badge_Text",
        "Badge_BG",
        "Subtitle_Text",
        "Title_Text",
        "Constellation_Lines",
        "Sale_Logo",
        "Hero_Product",
        "Glow_BG",
        "FG_Overlay",
        "BG_Parallax"
    ];

    for (var i = 0; i < layerOrder.length; i++) {
        try {
            var lyr = comp.layer(layerOrder[i]);
            if (lyr) lyr.moveTo(i + 1);
        } catch(e) {}
    }

    // ============================================================
    // SCENE 2 ENHANCEMENTS (6-10s)
    // ============================================================
    // Product zooms slightly — Remotion: laptopScale spring
    productLayer.scale.setValueAtTime(6.5, [100, 100]);
    productLayer.scale.setValueAtTime(8, [106, 106]);

    // Badge fades out at scene 2
    badgeShape.opacity.setValueAtTime(6, 100);
    badgeShape.opacity.setValueAtTime(7, 0);
    badgeText.opacity.setValueAtTime(6, 100);
    badgeText.opacity.setValueAtTime(7, 0);

    // End card: final price pops
    priceText.scale.setValueAtTime(8.5, [100, 100]);
    priceText.scale.setValueAtTime(9, [115, 115]);
    priceText.scale.setValueAtTime(9.5, [110, 110]);

    // ============================================================
    // RENDER QUEUE
    // ============================================================
    var renderItem = app.project.renderQueue.items.add(comp);
    var outputModule = renderItem.outputModule(1);
    var outputFile = new File("~/Desktop/Flipkart_Sale_V2.mov");
    outputModule.file = outputFile;

    app.endUndoGroup();

    "BUILD COMPLETE: Flipkart_Sale_V2 — " + comp.numLayers + " layers, " + DUR + "s @ " + FPS + "fps";
})();
