import {
    AbsoluteFill,
    Audio,
    Img,
    interpolate,
    Sequence,
    spring,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';
import React from 'react';

/**
 * Laptop 10 Sec Variation
 * 
 * Assets required in public/ folder (or adjust staticFile paths):
 * - Moving background.png
 * - laptop.png
 * - alexguz-groove-funk-296391.mp3
 * - logo.png (assumed)
 * - light-leak.png (assumed)
 */

const FPS = 30;
const DURATION_IN_FRAMES = 300; // 10 seconds

const COLORS = {
    YELLOW_WAVE: '#FFC72C',
    TEXT_PRIMARY: '#FFFFFF',
    TEXT_SECONDARY: '#333333',
};

// --- Reusable Components ---

const MovingBackground: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Slow horizontal drift: 0 to -150px over 10s
    // Identify direction: 10s is durationInFrames
    const x = interpolate(frame, [0, durationInFrames], [0, -150]);

    return (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
            <Img
                src={staticFile('Moving background.png')}
                style={{
                    width: '120%', // Scale to allow movement
                    height: '100%',
                    objectFit: 'cover',
                    transform: `translateX(${x}px)`,
                    filter: 'blur(10px)', // Simulating directional blur for motion
                }}
            />
        </AbsoluteFill>
    );
};

const LightLeakOverlay: React.FC = () => {
    return (
        <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: 0.3 }}>
            {/* Placeholder for light leak */}
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(45deg, transparent 40%, rgba(255,200,0,0.2) 50%, transparent 60%)',
                }}
            />
        </AbsoluteFill>
    );
};

const LaptopProduct: React.FC<{
    scale?: number;
    translateX?: number;
    opacity?: number;
}> = ({ scale = 1, translateX = 0, opacity = 1 }) => {
    return (
        <Img
            src={staticFile('laptop.png')}
            style={{
                width: 800,
                height: 'auto',
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) scale(${scale}) translateX(${translateX}px)`,
                opacity,
            }}
        />
    );
};

const IntroScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Phase 1: Background Zoom 102 -> 100
    const bgScale = interpolate(frame, [0, 20], [1.02, 1], {
        extrapolateRight: 'clamp',
    });

    // Phase 2: Waves & Logo (0:20 - 1:00) -> Frames 20 - 60
    const waveOpacity = interpolate(frame, [20, 40], [0, 1], {
        extrapolateRight: 'clamp',
    });
    const logoY = spring({
        frame: frame - 20,
        fps,
        from: 100,
        to: 0,
        config: { damping: 12 },
    });

    // Phase 3: Laptop Entry (1:00 - 1:50) -> Frames 60 - 90
    const laptopScale = interpolate(frame, [60, 90], [0.9, 1], {
        extrapolateRight: 'clamp',
    });
    const laptopOpacity = interpolate(frame, [60, 70], [0, 1], {
        extrapolateRight: 'clamp',
    });

    return (
        <AbsoluteFill style={{ transform: `scale(${bgScale})` }}>
            {/* Simulated Yellow Wave */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 300,
                    backgroundColor: COLORS.YELLOW_WAVE,
                    opacity: waveOpacity,
                    transform: `translateY(${logoY}px)`, // Parallax effect
                    borderRadius: '100% 100% 0 0', // Simple wave shape
                }}
            />

            {/* Logo */}
            <div style={{
                position: 'absolute',
                bottom: 50,
                left: '50%',
                transform: `translateX(-50%) translateY(${logoY}px)`,
                color: 'black',
                fontSize: 40,
                fontWeight: 'bold'
            }}>
                LOGO
            </div>

            <LaptopProduct scale={laptopScale} opacity={laptopOpacity} />
        </AbsoluteFill>
    );
};

const ProductScene: React.FC<{
    text: string;
    price: string;
    featureHighlight?: string;
}> = ({ text, price }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const opacity = interpolate(frame, [0, 15], [0, 1]);
    const slideUp = spring({
        frame,
        fps,
        from: 50,
        to: 0,
    });

    return (
        <AbsoluteFill>
            <LaptopProduct />
            <div
                style={{
                    position: 'absolute',
                    top: 200,
                    left: 100,
                    opacity,
                    transform: `translateY(${slideUp}px)`,
                }}
            >
                <h1 style={{ color: COLORS.TEXT_PRIMARY, fontSize: 60, margin: 0 }}>{text}</h1>
                <h2 style={{ color: COLORS.YELLOW_WAVE, fontSize: 50, margin: 0 }}>{price}</h2>
            </div>
        </AbsoluteFill>
    );
};

const OutroScene: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
            <h1 style={{ color: 'black', fontSize: 80 }}>SHOP NOW</h1>
            <h2 style={{ color: '#0070f3' }}>Flipkart / Amazon</h2>
        </AbsoluteFill>
    );
};

// --- Transition Component ---

const SimpleDistortedZoomOut: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    // Logic: Scale 1 -> 0.6 (End)
    // Or Scale 1.5 -> 1 (Start)
    // This component wraps a scene. We need to know if it's entering or exiting?
    // Simplified: Just static render for now, assuming external sequence handles transitions
    // or we can animate based on frame being near end.

    return <AbsoluteFill>{children}</AbsoluteFill>;
};


// --- Main Composition ---

export const LaptopTenSecVariation: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            <Audio
                src={staticFile('alexguz-groove-funk-296391.mp3')}
                volume={(f) => interpolate(f, [0, 5, 290, 300], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
            />

            <MovingBackground />
            <LightLeakOverlay />

            {/* Detailed Scene Sequencing */}

            {/* Intro: 0 - 1.5s (0 - 45 frames) */}
            <Sequence from={0} durationInFrames={45}>
                <IntroScene />
            </Sequence>

            {/* F1: 1.5 - 3.0s (45 - 90 frames) */}
            <Sequence from={45} durationInFrames={45}>
                <SimpleDistortedZoomOut>
                    <ProductScene text="Main Feature" price="$999" />
                </SimpleDistortedZoomOut>
            </Sequence>

            {/* F2: 3.0 - 4.5s (90 - 135 frames) */}
            <Sequence from={90} durationInFrames={45}>
                <SimpleDistortedZoomOut>
                    <ProductScene text="Detail View" price="$999" />
                </SimpleDistortedZoomOut>
            </Sequence>

            {/* F3: 4.5 - 6.0s (135 - 180 frames) */}
            <Sequence from={135} durationInFrames={45}>
                <SimpleDistortedZoomOut>
                    <ProductScene text="Feature 1" price="" />
                </SimpleDistortedZoomOut>
            </Sequence>

            {/* F4: 6.0 - 7.5s (180 - 225 frames) */}
            <Sequence from={180} durationInFrames={45}>
                <SimpleDistortedZoomOut>
                    <ProductScene text="Feature 2" price="" />
                </SimpleDistortedZoomOut>
            </Sequence>

            {/* F5: 7.5 - 9.0s (225 - 270 frames) */}
            <Sequence from={225} durationInFrames={45}>
                <SimpleDistortedZoomOut>
                    <ProductScene text="Feature 3" price="" />
                </SimpleDistortedZoomOut>
            </Sequence>

            {/* Outro: 9.0 - 10.0s (270 - 300 frames) */}
            <Sequence from={270} durationInFrames={30}>
                <OutroScene />
            </Sequence>
        </AbsoluteFill>
    );
};
