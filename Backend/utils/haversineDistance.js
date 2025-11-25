/**
 * Haversine Distance Calculator
 *
 * Calculates the great-circle distance between two points on Earth
 * specified by latitude and longitude coordinates.
 *
 * This is commonly used to measure "as-the-crow-flies" distance between
 * two geographic locations.
 *
 * @module utils/haversineDistance
 */

/**
 * Calculates the distance between two points on Earth using the Haversine formula
 *
 * The Haversine formula determines the great-circle distance between two points
 * on a sphere given their longitudes and latitudes.
 *
 * Formula:
 * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 * c = 2 ⋅ atan2( √a, √(1−a) )
 * d = R ⋅ c
 *
 * Where:
 * - φ is latitude, λ is longitude
 * - R is earth's radius (mean radius = 6,371km = 6,371,000m)
 *
 * @param {Number} lat1 - Latitude of point 1 (in decimal degrees)
 * @param {Number} lon1 - Longitude of point 1 (in decimal degrees)
 * @param {Number} lat2 - Latitude of point 2 (in decimal degrees)
 * @param {Number} lon2 - Longitude of point 2 (in decimal degrees)
 * @returns {Number} Distance between the two points in meters
 *
 * @example
 * // Calculate distance between New York and Los Angeles
 * const distance = haversineDistance(40.7128, -74.0060, 34.0522, -118.2437);
 * console.log(distance); // ~3936000 meters (3936 km)
 *
 * @example
 * // Check if two locations are within 1km radius
 * const dist = haversineDistance(17.3850, 78.4867, 17.3900, 78.4900);
 * if (dist <= 1000) {
 *   console.log('Within 1km radius');
 * }
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  // Validate inputs
  if (
    typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' || typeof lon2 !== 'number'
  ) {
    throw new TypeError('All coordinates must be numbers');
  }

  if (
    lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
    lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180
  ) {
    throw new RangeError('Coordinates out of valid range (lat: -90 to 90, lon: -180 to 180)');
  }

  // Earth's mean radius in meters
  const R = 6371000;

  // Convert degrees to radians
  const toRadians = (degrees) => degrees * (Math.PI / 180);

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  // Haversine formula
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in meters
  const distance = R * c;

  return distance;
}

/**
 * Checks if a point is within a specified radius of a center point
 *
 * @param {Number} centerLat - Latitude of center point
 * @param {Number} centerLon - Longitude of center point
 * @param {Number} pointLat - Latitude of point to check
 * @param {Number} pointLon - Longitude of point to check
 * @param {Number} radiusMeters - Radius in meters
 * @returns {Boolean} True if point is within radius, false otherwise
 *
 * @example
 * const isNearby = isWithinRadius(17.3850, 78.4867, 17.3900, 78.4900, 1000);
 * console.log(isNearby); // true or false
 */
function isWithinRadius(centerLat, centerLon, pointLat, pointLon, radiusMeters) {
  const distance = haversineDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusMeters;
}

/**
 * Formats distance to human-readable string
 *
 * @param {Number} meters - Distance in meters
 * @returns {String} Formatted distance string
 *
 * @example
 * formatDistance(500); // "500 m"
 * formatDistance(1500); // "1.50 km"
 * formatDistance(25000); // "25.00 km"
 */
function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Calculates the bounding box for a given point and radius
 * Useful for optimizing database queries before using Haversine
 *
 * @param {Number} lat - Latitude of center point
 * @param {Number} lon - Longitude of center point
 * @param {Number} radiusMeters - Radius in meters
 * @returns {Object} Bounding box with minLat, maxLat, minLon, maxLon
 *
 * @example
 * const bbox = getBoundingBox(17.3850, 78.4867, 10000);
 * // Use bbox for MongoDB query optimization:
 * // db.locations.find({
 * //   lat: { $gte: bbox.minLat, $lte: bbox.maxLat },
 * //   lon: { $gte: bbox.minLon, $lte: bbox.maxLon }
 * // })
 */
function getBoundingBox(lat, lon, radiusMeters) {
  // Earth's radius in meters
  const R = 6371000;

  // Convert to radians
  const latRad = lat * (Math.PI / 180);
  const lonRad = lon * (Math.PI / 180);

  // Angular distance in radians
  const angularDistance = radiusMeters / R;

  // Calculate bounds
  const minLat = lat - (angularDistance * (180 / Math.PI));
  const maxLat = lat + (angularDistance * (180 / Math.PI));

  // Account for longitude compression at higher latitudes
  const minLon = lon - (angularDistance * (180 / Math.PI)) / Math.cos(latRad);
  const maxLon = lon + (angularDistance * (180 / Math.PI)) / Math.cos(latRad);

  return {
    minLat,
    maxLat,
    minLon,
    maxLon
  };
}

module.exports = {
  haversineDistance,
  isWithinRadius,
  formatDistance,
  getBoundingBox
};
