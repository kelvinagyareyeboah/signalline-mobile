import { Coordinates, UserLocationUpdate } from './types';

/**
 * Haversine formula to compute great-circle distance between two points in meters.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
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

/**
 * SpatialGrid provides an in-memory spatial index mimicking Redis Geospatial (GEOADD / GEOSEARCH).
 * Organizes active user locations into spatial buckets (lat/lng grid cells of ~1km) for fast proximity queries.
 */
export class SpatialGrid {
  private cellPrecision = 0.01; // ~1.1km grid cell size
  private grid: Map<string, Set<string>> = new Map();
  private userLocations: Map<string, UserLocationUpdate> = new Map();

  private getCellKey(lat: number, lng: number): string {
    const latCell = Math.floor(lat / this.cellPrecision);
    const lngCell = Math.floor(lng / this.cellPrecision);
    return `${latCell}:${lngCell}`;
  }

  /**
   * Adds or updates user coordinates in the spatial grid (GEOADD equivalent).
   */
  public updateLocation(update: UserLocationUpdate): void {
    const existing = this.userLocations.get(update.userId);
    if (existing) {
      const oldCellKey = this.getCellKey(existing.coords.latitude, existing.coords.longitude);
      const oldBucket = this.grid.get(oldCellKey);
      if (oldBucket) {
        oldBucket.delete(update.userId);
        if (oldBucket.size === 0) {
          this.grid.delete(oldCellKey);
        }
      }
    }

    if (update.isSharing) {
      this.userLocations.set(update.userId, update);
      const newCellKey = this.getCellKey(update.coords.latitude, update.coords.longitude);
      if (!this.grid.has(newCellKey)) {
        this.grid.set(newCellKey, new Set());
      }
      this.grid.get(newCellKey)!.add(update.userId);
    } else {
      this.userLocations.delete(update.userId);
    }
  }

  /**
   * Remove user from the spatial grid on disconnect or stop sharing.
   */
  public removeUser(userId: string): void {
    const existing = this.userLocations.get(userId);
    if (existing) {
      const cellKey = this.getCellKey(existing.coords.latitude, existing.coords.longitude);
      const bucket = this.grid.get(cellKey);
      if (bucket) {
        bucket.delete(userId);
        if (bucket.size === 0) {
          this.grid.delete(cellKey);
        }
      }
      this.userLocations.delete(userId);
    }
  }

  /**
   * Find all users within radiusMeters of (lat, lng) (GEOSEARCH equivalent).
   */
  public findNearbyUsers(
    lat: number,
    lng: number,
    radiusMeters: number,
    excludeUserId?: string
  ): UserLocationUpdate[] {
    const results: UserLocationUpdate[] = [];
    const cellRadius = Math.ceil(radiusMeters / 1000 / (this.cellPrecision * 111));
    const centerLatCell = Math.floor(lat / this.cellPrecision);
    const centerLngCell = Math.floor(lng / this.cellPrecision);

    // Search adjacent grid cells
    for (let dLat = -cellRadius; dLat <= cellRadius; dLat++) {
      for (let dLng = -cellRadius; dLng <= cellRadius; dLng++) {
        const cellKey = `${centerLatCell + dLat}:${centerLngCell + dLng}`;
        const userSet = this.grid.get(cellKey);
        if (!userSet) continue;

        for (const userId of userSet) {
          if (excludeUserId && userId === excludeUserId) continue;
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

  /**
   * Get all actively sharing locations.
   */
  public getAllActiveLocations(): UserLocationUpdate[] {
    return Array.from(this.userLocations.values());
  }
}
