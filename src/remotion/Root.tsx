import React from 'react';
import { Composition } from 'remotion';
import { GalleryShowcase, GalleryShowcaseProps } from './compositions/GalleryShowcase';

// Configuration
const FPS = 30;
const DURATION_PER_THEME = 3; // seconds
const TRANSITION_DURATION = 0.5; // seconds

const defaultGalleryProps: GalleryShowcaseProps = {
  themeScreenshots: [],
  themeNames: [],
  businessName: 'Your Business',
  durationPerTheme: DURATION_PER_THEME,
  transitionDuration: TRANSITION_DURATION,
};

// Type assertion to satisfy Remotion's strict typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GalleryShowcaseComponent = GalleryShowcase as any;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GalleryShowcase"
        component={GalleryShowcaseComponent}
        durationInFrames={calculateDuration(10)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultGalleryProps}
      />

      <Composition
        id="GalleryShowcaseSquare"
        component={GalleryShowcaseComponent}
        durationInFrames={calculateDuration(10)}
        fps={FPS}
        width={1080}
        height={1080}
        defaultProps={defaultGalleryProps}
      />

      <Composition
        id="GalleryShowcaseVertical"
        component={GalleryShowcaseComponent}
        durationInFrames={calculateDuration(10)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultGalleryProps}
      />
    </>
  );
};

function calculateDuration(themeCount: number): number {
  const totalSeconds = themeCount * DURATION_PER_THEME + (themeCount - 1) * TRANSITION_DURATION;
  return Math.ceil(totalSeconds * FPS);
}

export default RemotionRoot;
