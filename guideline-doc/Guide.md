After Effects MCP servers can read, understand, and remix your .aep projects — here's exactly how
Yes, the pipeline works today. After Effects MCP servers can introspect existing .aep projects down to individual keyframe easing curves, serialize that structure as JSON for an LLM to reason over, and then execute AI-generated ExtendScript to create variations — all driven by Claude or Cursor. The critical enabler is arbitrary ExtendScript execution, which every major AE MCP server supports. ExtendScript can read and write virtually every property in an AE project: layer transforms, keyframe values and interpolation, effect parameters, expressions, text styling, and footage sources. For your Flipkart ad workflow producing 20–30 videos daily, the most practical path combines an AE MCP server (for live project manipulation) with a Lottie JSON export pipeline (for portable AI-readable animation data) and Nexrender or Plainly (for headless batch rendering at scale).

The four AE MCP servers and what each actually does
Five MCP server implementations exist, but four matter. Dakkshin/after-effects-mcp (~200 stars, actively maintained) is the most battle-tested. It uses a file-based polling bridge: a JSX panel inside AE checks for command files every few seconds, executes them, and writes response files. Its killer tool is run-script, which executes arbitrary ExtendScript — meaning any operation AE's scripting API supports is available to the LLM. It also offers dedicated setLayerKeyframe and setLayerExpression tools for common operations.
p10q/ae-mcp (by Tom Harada) is the most comprehensive, exposing 30+ purpose-built tools organized by category: list_compositions, get_layer, get_composition, add_keyframe, update_layer_property, nine expression tools, batch operations, and full render queue control. It communicates via a CEP extension with 200ms polling — near real-time. For introspection specifically, this server is the strongest because it has dedicated tools for reading project structure rather than relying solely on raw script execution.
mikechambers/adb-mcp (~430 stars) is Adobe's community champion — a multi-app server covering Photoshop, Premiere, InDesign, Illustrator, and After Effects. AE support is newer and less documented than the Photoshop/Premiere modules, but it uses the same CEP-to-WebSocket-proxy architecture and can execute ExtendScript through the CEP bridge. sunqirui1987/ae-mcp is a Go-based outlier with Manim integration for mathematical animations and explicit arbitrary scripting support.
Every server requires After Effects to be running — none can parse .aep binary files standalone. They all act as bridges between the LLM and AE's live scripting engine.
Server
Stars
Arbitrary ExtendScript
Dedicated introspection tools
Best for
Dakkshin/after-effects-mcp
~200
✅ run-script
Minimal (use run-script)
Simplest setup, most community support
p10q/ae-mcp
~6
✅ via bridge
✅ 30+ tools (list_layers, get_layer, etc.)
Deep introspection, batch ops
mikechambers/adb-mcp
~430
✅ via CEP
Limited for AE
Multi-Adobe-app workflows
sunqirui1987/ae-mcp
5
✅ explicit tool
Moderate
Shape layer detail, Manim

ExtendScript can read and write everything that matters
ExtendScript's API provides hierarchical access to the complete project structure: app.project → CompItem → Layer → Property → Keyframe. This is not an approximation — you can read every keyframe value, time, interpolation type, temporal ease, and spatial tangent on every property of every layer in every composition. You can read text content with full styling (font, size, color, tracking, leading, per-character styles in AE 24.3+). You can read footage source file paths. You can recursively traverse the entire property tree of any layer, including all effect parameters.
For serializing to JSON, the ae-to-json library (240+ GitHub stars, by Jam3/Experience-Monks) already does this — it exports complete project structure including compositions, layers, properties, and keyframes with timing and easing. Bodymovin (the Lottie exporter) demonstrates the same principle at even larger scale. The key caveat: ExtendScript runs on ECMAScript 3, so you need a json2.js polyfill, and serializing large projects can be slow (minutes for complex files).
For modification, ExtendScript can duplicate compositions (including deep/recursive duplication of nested pre-comps), swap layer sources (layer.replaceSource()), change text content and styling, add/remove/modify effects, set keyframe values at any time with custom easing, modify timing and durations, and create entirely new compositions from scratch with programmatically added layers. Here's what the code looks like for a typical "create variation" operation:
// Duplicate a comp, change text, swap product image, adjust timing
var sourceComp = app.project.item(1);
var variation = sourceComp.duplicate();
variation.name = "Flipkart_Ad_Variation_6";

// Swap product image
var productLayer = variation.layer("Product");
var newFootage = app.project.importFile(new ImportOptions(File("/path/to/new_product.png")));
productLayer.replaceSource(newFootage, false);

// Change headline text
var titleLayer = variation.layer("Title");
var textDoc = titleLayer.property("Source Text").value;
textDoc.text = "New Sale Price!";
textDoc.fillColor = [1, 0.2, 0]; // orange
titleLayer.property("Source Text").setValue(textDoc);

The only things ExtendScript cannot do: read actual pixel data (requires C++ plugins), access CUSTOM_VALUE property types (opaque binary data from effects like Mesh Warp), or use modern JavaScript syntax without shims.
How an LLM actually understands and modifies AE projects
The workflow for "AI reads project → AI creates variation" has three proven components and one gap. The proven components: (1) ExtendScript can serialize project structure to JSON, (2) LLMs can read and reason about that JSON, and (3) LLMs can generate valid ExtendScript to modify projects. The gap is that no turnkey end-to-end pipeline exists yet — you need to assemble it yourself.
A typical serialized AE project for a simple ad template produces 10–50KB of JSON — trivially within any modern LLM's context window. Even medium-complexity projects (dozens of layers, multiple compositions, heavy keyframes) produce 100KB–1MB, still well within Claude's 200K-token context. The structure is semantic enough for LLMs to reason about: layer names like "Product_Image", "Price_Text", "Background_Gradient" carry meaning. Keyframe data with times and values is structured numerically. Effect parameters have descriptive names.
This has been demonstrated in practice. A Medium article by Alon Chitayat showed ChatGPT reading Lottie JSON and correctly describing the animation ("five colorful circles that move in a bouncy and playful way"), then generating valid Lottie JSON for new animations. The commercial AE GPT plugin ($40, aescripts.com) already integrates ChatGPT, Gemini, and Claude inside After Effects — it analyzes the active composition's layers, effects, and timeline structure, then generates expressions and modifications. Buoy (buoy.tools) positions itself as an "AI co-pilot for After Effects" handling natural-language batch operations.
For your specific use case of reading 4–5 templates, RAG is probably overkill. Direct context is sufficient: serialize each template's structure as a "project summary" JSON (layer inventory, animation timeline, effect chain, design tokens like colors/fonts, spatial relationships), feed all 4–5 summaries into a single Claude prompt (~50–250KB total), and ask it to generate ExtendScript for variation #6. A hierarchical summarization approach works best: Level 1 is a project overview (comp names, durations, layer counts), Level 2 adds layer details (names, types, in/out points), Level 3 includes property values, and Level 4 has full keyframe data. For pattern recognition across templates, Levels 1–3 are usually sufficient.
The practical step-by-step workflow for your Flipkart ads
Here is what works today, assembled from existing tools:
Step 1: Extract project DNA. Open each .aep in After Effects with the Dakkshin MCP server running. Use Claude to execute ExtendScript that serializes the project structure — layer names, composition hierarchy, keyframe patterns, effect parameters, text content, footage paths, color values. Save each as a JSON "template DNA" file. Alternatively, export each via Bodymovin to Lottie JSON for the animation-pattern layer.
Step 2: Feed templates to Claude. Provide all 4–5 template DNA files as context. Ask Claude to identify common patterns: "These are Flipkart product ad templates. Identify the animation vocabulary (entrance/exit patterns, easing curves, timing relationships), design system (colors, fonts, spacing), and structural conventions (layer naming, composition hierarchy)."
Step 3: Generate variation. Describe what you want changed: new product, different background color, modified animation timing. Claude generates an ExtendScript that either (a) duplicates an existing template comp and modifies it, or (b) creates a new composition from scratch following the identified patterns.
Step 4: Execute via MCP. The MCP server sends the generated ExtendScript to After Effects. The script runs, creating the new composition. Claude can then introspect the result and iterate.
Step 5: Render at scale. For batch rendering 20–30 variations, use Nexrender (open-source, 1700+ GitHub stars) or Plainly (SaaS built on Nexrender, $69/month). These accept JSON job specifications that define which layers to modify and render headlessly via aerender.
The Lottie round-trip is a compelling alternative for simpler templates: export to Lottie JSON → LLM reads and generates modified Lottie → import back to AE via LottieFiles plugin or render directly via lottie-web. This bypasses the need for AE to be running during the AI analysis phase. However, Lottie doesn't support AE effects, expressions, particles, or 3D — so fidelity depends on your template complexity.
Alternative approaches worth considering
Standalone .aep parsers exist but are limited. The Python aep_parser (PyPI) and Go-based boltframe/aftereffects-aep-parser (113 stars) can extract structural metadata from binary .aep files without AE running — layer names, composition hierarchy, property names. But the .aep format has no official Adobe specification; these parsers are reverse-engineered and cannot reliably extract complete keyframe data. They're useful for structural inventory, not full introspection.
Cavalry (cavalry.com, by former Autodesk MASH creators) is the most AI-friendly motion design tool available. Its procedural, node-based architecture means animations are inherently parametric — change one value and everything cascades. It has a full JavaScript API for programmatic control. However, it cannot import AE projects, so you'd need to rebuild your templates from scratch. For a team producing 20–30 videos daily with established AE templates, this rebuild cost is significant.
Remotion + Lottie hybrid may be your strongest play given you already use Remotion. The workflow: export AE templates to Lottie via Bodymovin → use Remotion's official @remotion/lottie package to render Lottie animations → have Claude generate Remotion component variations that modify Lottie parameters programmatically. This keeps your existing Remotion infrastructure, adds AE's design fidelity via Lottie, and lets Claude operate on a format it demonstrably understands.
AI-native e-commerce video tools are emerging fast. Scalio (scalio.app) generates ads specifically for Amazon, Flipkart, and Myntra with marketplace-guideline compliance. Pippit (by ByteDance/CapCut) generates videos from product URLs. Adyogi specializes in Indian marketplace ad automation. These could complement or eventually replace custom AE template pipelines for certain ad types, though they sacrifice creative control.
What to build: a "template DNA" system beats RAG
Rather than building a RAG system with vector embeddings of animation data (which adds complexity without clear benefit for 4–5 templates), build an "Animation DNA Extractor" — an ExtendScript that runs against each template and produces a structured JSON capturing:
Design tokens: color palette, fonts, sizes extracted from actual layer values
Motion vocabulary: entrance/exit animation patterns described semantically ("slide from left, 0.8s, ease-out cubic")
Structural blueprint: layer hierarchy with types, parent relationships, track mattes
Timing map: when each animation event occurs relative to the composition timeline
Parametric surfaces: which values change between variations (product image path, price text, background color) vs. which stay fixed (animation curves, composition structure, effect chains)
This "DNA document" for each template becomes the context Claude uses to understand your design system. Academic work on timeslice grammars (grammar-based procedural animations) validates this approach — representing animations as parameterized transformation rules that generate families of related outputs.
Conclusion
The technology stack exists today to build your "read 5 AE files → AI creates variation #6" pipeline. ExtendScript provides complete read/write access to every meaningful property in an AE project. AE MCP servers (particularly Dakkshin's and p10q's) bridge that capability to Claude and Cursor. LLMs demonstrably understand serialized animation data in both Lottie JSON and custom project-summary formats. The missing piece is the integration glue: a well-designed "template DNA extractor" script and a structured prompting workflow that lets Claude reason about animation patterns across multiple templates. For your Flipkart operation at 20–30 videos/day, the highest-leverage first step is installing Dakkshin/after-effects-mcp, writing an ExtendScript that serializes your 4–5 templates as structured JSON, feeding those to Claude, and asking it to generate ExtendScript variations — then scaling with Nexrender for headless rendering. The Remotion + Lottie hybrid path is the strongest long-term play given your existing infrastructure.

