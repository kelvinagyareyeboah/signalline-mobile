const test = require('node:test');
const assert = require('node:assert');

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class SpatialGrid {
  constructor(cellPrecision = 0.01) {
    this.cellPrecision = cellPrecision;
    this.grid = new Map();
    this.userLocations = new Map();
  }

  getCellKey(lat, lng) {
    const latCell = Math.floor(lat / this.cellPrecision);
    const lngCell = Math.floor(lng / this.cellPrecision);
    return `${latCell}:${lngCell}`;
  }

  updateLocation(update) {
    this.userLocations.set(update.userId, update);
    const key = this.getCellKey(update.coords.latitude, update.coords.longitude);
    if (!this.grid.has(key)) {
      this.grid.set(key, new Set());
    }
    this.grid.get(key).add(update.userId);
  }

  findNearbyUsers(lat, lng, radiusMeters) {
    const results = [];
    const cellRadius = Math.ceil(radiusMeters / 1000 / (this.cellPrecision * 111));
    const centerLatCell = Math.floor(lat / this.cellPrecision);
    const centerLngCell = Math.floor(lng / this.cellPrecision);

    for (let dLat = -cellRadius; dLat <= cellRadius; dLat++) {
      for (let dLng = -cellRadius; dLng <= cellRadius; dLng++) {
        const cellKey = `${centerLatCell + dLat}:${centerLngCell + dLng}`;
        const userSet = this.grid.get(cellKey);
        if (!userSet) continue;

        for (const userId of userSet) {
          const user = this.userLocations.get(userId);
          if (!user) continue;

          const dist = calculateDistanceMeters(
            lat,
            lng,
            user.coords.latitude,
            user.coords.longitude
          );
          if (dist <= radiusMeters) {
            results.push(user);
          }
        }
      }
    }
    return results;
  }
}

test('SpatialGrid: Accurately finds users within 1000 meters and filters out far users', () => {
  const grid = new SpatialGrid();

  // User A (San Francisco Downtown)
  grid.updateLocation({
    userId: 'user_a',
    coords: { latitude: 37.7749, longitude: -122.4194 }
  });

  // User B (Close: ~300 meters away)
  grid.updateLocation({
    userId: 'user_b',
    coords: { latitude: 37.7770, longitude: -122.4190 }
  });

  // User C (Far: Oakland ~12 kilometers away)
  grid.updateLocation({
    userId: 'user_c',
    coords: { latitude: 37.8044, longitude: -122.2712 }
  });

  const nearby = grid.findNearbyUsers(37.7749, -122.4194, 1000);
  const foundIds = nearby.map(u => u.userId);

  assert.ok(foundIds.includes('user_a'), 'Finds center user');
  assert.ok(foundIds.includes('user_b'), 'Finds user within 1000m');
  assert.ok(!foundIds.includes('user_c'), 'Excludes user in Oakland (>10km)');
});
