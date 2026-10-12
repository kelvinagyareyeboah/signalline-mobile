/**
 * 2D Kalman Filter for Real-Time GPS Telemetry Smoothing
 * 
 * Mitigates GPS multipath errors, atmospheric noise, and hardware jitter.
 * Produces optimal minimum mean square error (MMSE) estimates of coordinates.
 */
export interface KalmanPoint {
  latitude: number;
  longitude: number;
  accuracy?: number; // in meters
  timestamp: number; // in ms
}

export class GPSKalmanFilter {
  // State: [lat, lng]
  private lat: number = 0;
  private lng: number = 0;

  // Estimate error covariance
  private variance: number = -1;

  // Process noise covariance (meters/sec squared) - represents person/vehicle acceleration capability
  private processNoise: number = 3.0;

  private lastTimestamp: number = 0;

  constructor(processNoise: number = 3.0) {
    this.processNoise = processNoise;
  }

  /**
   * Resets the filter state with an initial coordinate
   */
  public reset(point?: KalmanPoint): void {
    if (point) {
      this.lat = point.latitude;
      this.lng = point.longitude;
      this.variance = (point.accuracy || 10) * (point.accuracy || 10);
      this.lastTimestamp = point.timestamp || Date.now();
    } else {
      this.variance = -1;
    }
  }

  /**
   * Processes a raw GPS measurement and outputs a smoothed coordinate.
   * 
   * @param raw Raw measurement with lat, lng, accuracy (meters), and timestamp
   * @returns Smoothed KalmanPoint
   */
  public update(raw: KalmanPoint): KalmanPoint {
    const accuracy = Math.max(raw.accuracy || 10, 1);
    const measurementVariance = accuracy * accuracy;
    const timestamp = raw.timestamp || Date.now();

    // If uninitialized, initialize with first measurement
    if (this.variance < 0) {
      this.lat = raw.latitude;
      this.lng = raw.longitude;
      this.variance = measurementVariance;
      this.lastTimestamp = timestamp;
      return {
        latitude: this.lat,
        longitude: this.lng,
        accuracy,
        timestamp,
      };
    }

    // Time delta in seconds
    const dt = Math.max((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;

    // 1. Prediction Step:
    // State estimate remains the same (assuming static or coasting velocity model)
    // Estimate error variance increases with process noise over time
    this.variance += this.processNoise * dt;

    // 2. Innovation / Kalman Gain Calculation:
    // K = P / (P + R)
    const K = this.variance / (this.variance + measurementVariance);

    // 3. State Update Step:
    // x = x + K * (z - x)
    this.lat += K * (raw.latitude - this.lat);
    this.lng += K * (raw.longitude - this.lng);

    // 4. Covariance Update Step:
    // P = (1 - K) * P
    this.variance = (1 - K) * this.variance;

    return {
      latitude: Number(this.lat.toFixed(6)),
      longitude: Number(this.lng.toFixed(6)),
      accuracy: Math.sqrt(this.variance),
      timestamp,
    };
  }

  public getCurrentEstimate(): { latitude: number; longitude: number } | null {
    if (this.variance < 0) return null;
    return { latitude: this.lat, longitude: this.lng };
  }
}

// Global filter instance for user's own location
export const myLocationKalmanFilter = new GPSKalmanFilter(3.0);

// Contact filter cache so each contact has their own continuous smoothing track
export const contactKalmanFilters = new Map<string, GPSKalmanFilter>();

export function filterContactLocation(contactId: string, point: KalmanPoint): KalmanPoint {
  let filter = contactKalmanFilters.get(contactId);
  if (!filter) {
    filter = new GPSKalmanFilter(4.0); // Slightly more dynamic for moving contacts
    contactKalmanFilters.set(contactId, filter);
  }
  return filter.update(point);
}
