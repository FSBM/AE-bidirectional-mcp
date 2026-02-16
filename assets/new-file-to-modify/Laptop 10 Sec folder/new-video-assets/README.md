# Laptop 10 Sec Variation - Remotion Component

This folder contains the `LaptopTenSecVariation.tsx` component, which implements the "Laptop 10 Sec – Moving Background Variation" video.

## Usage

1.  **Copy the Component**: Move `LaptopTenSecVariation.tsx` to your Remotion project's `src/` directory (e.g., `src/compositions/LaptopTenSecVariation.tsx`).
2.  **Install Dependencies**: Ensure your Remotion project has `@remotion/react` and `react` installed.
3.  **Add Assets**: Place the following assets in your Remotion project's `public/` folder:
    *   `Moving background.png`
    *   `laptop.png`
    *   `alexguz-groove-funk-296391.mp3`
    *   `logo.png` (if available)
4.  **Register Composition**: Add the following to your `src/Root.tsx`:

```tsx
import { Composition } from 'remotion';
import { LaptopTenSecVariation } from './LaptopTenSecVariation';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LaptopTenSecVariation"
        component={LaptopTenSecVariation}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
```

## Features Implemented

*   **Structure**: Intro (1.5s) -> F1-F5 (1.5s each) -> Outro (1.0s).
*   **Moving Background**: Simulates horizontal drift.
*   **Transitions**: Placeholder logic for "Simple Distorted Zoom Out".
*   **Intro**: Custom animation mirroring the original outro logic (reversed).
