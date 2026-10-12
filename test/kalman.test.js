const test = require('node:test');
const assert = require('node:assert');

// Simple JS port of our Kalman logic to run direct node:test verification
class GPSKalmanFilter {
  constructor(processNoise = 3.0) {
    this.processNoise = processNoise;
    this.lat = 0;
    this.lng = 0;
    this.variance = -1;
    this.lastTimestamp = 0;
  }

  update(raw) {
    const accuracy = Math.max(raw.accuracy || 10, 1);
    const measurementVariance = accuracy * accuracy;
    const timestamp = raw.timestamp || Date.now();

    if (this.variance < 0) {
      this.lat = raw.latitude;
      this.lng = raw.longitude;
      this.variance = measurementVariance;
      this.lastTimestamp = timestamp;
      return { latitude: this.lat, longitude: this.lng, accuracy, timestamp };
    }

    const dt = Math.max((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;

    // Prediction
    this.variance += this.processNoise * dt;

    // Kalman gain
    const K = this.variance / (this.variance + measurementVariance);

    // Update
    this.lat += K * (raw.latitude - this.lat);
    this.lng += K * (raw.longitude - this.lng);
    this.variance = (1 - K) * this.variance;

    return {
      latitude: Number(this.lat.toFixed(6)),
      longitude: Number(this.lng.toFixed(6)),
      accuracy: Math.sqrt(this.variance),
      timestamp,
    };
  }
}

test('GPS Kalman Filter: Reduces measurement variance over consecutive noisy readings', () => {
  const filter = new GPSKalmanFilter(2.0);
  const trueLat = 37.7749;
  const trueLng = -122.4194;

  const first = filter.update({ latitude: 37.7755, longitude: -122.4180, accuracy: 25, timestamp: 1000 });
  assert.strictEqual(first.latitude, 37.7755);

  // Feed noisy samples around the true point
  let last;
  for (let i = 1; i <= 10; i++) {
    const jitter = (Math.sin(i) * 0.0005);
    last = filter.update({
      latitude: trueLat + jitter,
      longitude: trueLng + jitter,
      accuracy: 20,
      timestamp: 1000 + i * 1000,
    });
  }

  // Filtered estimate variance must be significantly lower than raw measurement variance
  assert.ok(last.accuracy < 20, `Expected accuracy ${last.accuracy} to be < 20`);
  assert.ok(Math.abs(last.latitude - trueLat) < 0.001, 'Estimated latitude converged near true latitude');
});
