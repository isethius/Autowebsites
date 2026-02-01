import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from 'remotion';

export interface GalleryShowcaseProps {
  themeScreenshots: string[]; // URLs or paths to theme screenshots
  themeNames: string[];
  businessName: string;
  durationPerTheme?: number; // seconds
  transitionDuration?: number; // seconds
  showThemeNames?: boolean;
  showProgress?: boolean;
  primaryColor?: string;
  accentColor?: string;
}

export const GalleryShowcase: React.FC<GalleryShowcaseProps> = ({
  themeScreenshots,
  themeNames,
  businessName,
  durationPerTheme = 3,
  transitionDuration = 0.5,
  showThemeNames = true,
  showProgress = true,
  primaryColor = '#667eea',
  accentColor = '#764ba2',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const framesPerTheme = durationPerTheme * fps;
  const transitionFrames = transitionDuration * fps;
  const themeCount = themeScreenshots.length;

  if (themeCount === 0) {
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ color: 'white', fontSize: 48, fontWeight: 'bold' }}>
          No themes to display
        </div>
      </AbsoluteFill>
    );
  }

  // Calculate which theme is currently showing
  const currentThemeIndex = Math.floor(frame / framesPerTheme);
  const frameWithinTheme = frame % framesPerTheme;
  const safeCurrentIndex = Math.min(currentThemeIndex, themeCount - 1);
  const nextIndex = Math.min(safeCurrentIndex + 1, themeCount - 1);

  // Calculate transition progress
  const isTransitioning = frameWithinTheme >= framesPerTheme - transitionFrames;
  const transitionProgress = isTransitioning
    ? (frameWithinTheme - (framesPerTheme - transitionFrames)) / transitionFrames
    : 0;

  // Progress through entire video
  const totalFrames = themeCount * framesPerTheme;
  const overallProgress = Math.min(frame / totalFrames, 1);

  return (
    <AbsoluteFill style={{ background: '#0a0a0a' }}>
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${primaryColor}22, ${accentColor}22)`,
        }}
      />

      {/* Current theme screenshot */}
      <ThemeSlide
        screenshotUrl={themeScreenshots[safeCurrentIndex]}
        themeName={themeNames[safeCurrentIndex] || `Theme ${safeCurrentIndex + 1}`}
        opacity={1 - transitionProgress}
        scale={1 + transitionProgress * 0.05}
        showName={showThemeNames}
        primaryColor={primaryColor}
        width={width}
        height={height}
        frame={frameWithinTheme}
        fps={fps}
      />

      {/* Next theme (during transition) */}
      {isTransitioning && safeCurrentIndex < themeCount - 1 && (
        <ThemeSlide
          screenshotUrl={themeScreenshots[nextIndex]}
          themeName={themeNames[nextIndex] || `Theme ${nextIndex + 1}`}
          opacity={transitionProgress}
          scale={1.05 - transitionProgress * 0.05}
          showName={showThemeNames}
          primaryColor={primaryColor}
          width={width}
          height={height}
          frame={0}
          fps={fps}
        />
      )}

      {/* Header */}
      <Header
        businessName={businessName}
        primaryColor={primaryColor}
        accentColor={accentColor}
        frame={frame}
        fps={fps}
      />

      {/* Theme counter */}
      <ThemeCounter
        current={safeCurrentIndex + 1}
        total={themeCount}
        primaryColor={primaryColor}
        width={width}
      />

      {/* Progress bar */}
      {showProgress && (
        <ProgressBar
          progress={overallProgress}
          primaryColor={primaryColor}
          accentColor={accentColor}
          width={width}
          height={height}
        />
      )}

      {/* Call to action on last theme */}
      {safeCurrentIndex === themeCount - 1 && frameWithinTheme > framesPerTheme * 0.5 && (
        <CallToAction
          frame={frameWithinTheme - framesPerTheme * 0.5}
          fps={fps}
          primaryColor={primaryColor}
          width={width}
          height={height}
        />
      )}
    </AbsoluteFill>
  );
};

interface ThemeSlideProps {
  screenshotUrl: string;
  themeName: string;
  opacity: number;
  scale: number;
  showName: boolean;
  primaryColor: string;
  width: number;
  height: number;
  frame: number;
  fps: number;
}

const ThemeSlide: React.FC<ThemeSlideProps> = ({
  screenshotUrl,
  themeName,
  opacity,
  scale,
  showName,
  primaryColor,
  width,
  height,
  frame,
  fps,
}) => {
  // Subtle zoom animation
  const zoomProgress = interpolate(frame, [0, fps * 3], [1, 1.02], {
    extrapolateRight: 'clamp',
  });

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `scale(${scale})`,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '80px 60px',
      }}
    >
      {/* Screenshot container with frame */}
      <div
        style={{
          width: '100%',
          height: '100%',
          maxWidth: width * 0.85,
          maxHeight: height * 0.75,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
          border: '3px solid rgba(255,255,255,0.1)',
          transform: `scale(${zoomProgress}) translateY(${(1 - slideIn) * 50}px)`,
          opacity: slideIn,
        }}
      >
        <Img
          src={screenshotUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top',
          }}
        />
      </div>

      {/* Theme name label */}
      {showName && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: `translateX(-50%) translateY(${(1 - slideIn) * 30}px)`,
            opacity: slideIn,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            padding: '16px 32px',
            borderRadius: 12,
            border: `2px solid ${primaryColor}`,
          }}
        >
          <span
            style={{
              color: 'white',
              fontSize: 28,
              fontWeight: 600,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {themeName}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

interface HeaderProps {
  businessName: string;
  primaryColor: string;
  accentColor: string;
  frame: number;
  fps: number;
}

const Header: React.FC<HeaderProps> = ({
  businessName,
  primaryColor,
  accentColor,
  frame,
  fps,
}) => {
  const fadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '24px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
        opacity: fadeIn,
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: 'white',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <span
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {businessName}
        </span>
      </div>
      <div
        style={{
          fontSize: 18,
          color: 'rgba(255,255,255,0.7)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        Website Redesign Preview
      </div>
    </div>
  );
};

interface ThemeCounterProps {
  current: number;
  total: number;
  primaryColor: string;
  width: number;
}

const ThemeCounter: React.FC<ThemeCounterProps> = ({
  current,
  total,
  primaryColor,
  width,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        right: 40,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            background: i < current ? primaryColor : 'rgba(255,255,255,0.3)',
            transition: 'background 0.3s',
          }}
        />
      ))}
    </div>
  );
};

interface ProgressBarProps {
  progress: number;
  primaryColor: string;
  accentColor: string;
  width: number;
  height: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  primaryColor,
  accentColor,
  width,
  height,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        background: 'rgba(255,255,255,0.1)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  );
};

interface CallToActionProps {
  frame: number;
  fps: number;
  primaryColor: string;
  width: number;
  height: number;
}

const CallToAction: React.FC<CallToActionProps> = ({
  frame,
  fps,
  primaryColor,
  width,
  height,
}) => {
  const fadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const slideUp = interpolate(frame, [0, fps * 0.5], [30, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity: fadeIn,
        transform: `translateY(${slideUp}px)`,
      }}
    >
      <div
        style={{
          background: primaryColor,
          padding: '20px 48px',
          borderRadius: 12,
          boxShadow: `0 10px 40px ${primaryColor}66`,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 700,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Let's discuss your favorite design
        </span>
      </div>
    </div>
  );
};

export default GalleryShowcase;
