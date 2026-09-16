import type { Location } from './types';

export interface MapCameraTarget {
  center: [number, number];
  zoom: number;
}

/**
 * The opening frame centered on Nigeria.
 * Nigeria coordinates: [longitude, latitude] = [8.6753, 9.0820]
 * This provides a focused view on Nigerian projects.
 */
const atlasHome: [number, number] = [8.6753, 9.0820];

export function getMapCameraTarget(
  focus: Location | null,
  variant: 'atlas' | 'report' | undefined,
  containerWidth: number,
): MapCameraTarget {
  const location = focus?.scope === 'worldwide' ? null : focus;
  return {
    center: location ? [location.longitude, location.latitude] : atlasHome,
    zoom: location
      ? variant === 'report'
        ? 4
        : 2.5
      : containerWidth < 640
        ? 5
        : 5.5,
  };
}

export function sameMapCameraTarget(
  previous: MapCameraTarget | null,
  next: MapCameraTarget,
): boolean {
  return (
    previous?.center[0] === next.center[0] &&
    previous.center[1] === next.center[1] &&
    previous.zoom === next.zoom
  );
}

/**
 * The idle drift. Slowed down significantly for Nigeria-focused view.
 * A gentle rotation keeps the globe feeling dynamic without being distracting.
 */
export const spinDegreesPerSecond = 0.8;

/** How long the globe waits after a touch before it drifts again. */
export const spinResumeDelay = 3000;

/**
 * Degrees of longitude to give back for one animation frame. The drift eases
 * out as the reader zooms in, and stops at zoom level 5 (Nigeria country view).
 * A long frame gap - a stalled tab, a slow paint - is clamped so the globe 
 * resumes where it left off instead of lurching.
 */
export function getGlobeSpinStep(zoom: number, elapsedMs: number): number {
  if (zoom >= 5) return 0;
  const easing = zoom <= 3 ? 1 : (5 - zoom) / 2;
  return (
    (spinDegreesPerSecond * easing * Math.min(Math.max(elapsedMs, 0), 100)) /
    1000
  );
}

/** Keeps a drifting centre inside the normal longitude range. */
export function wrapLongitude(longitude: number): number {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}
