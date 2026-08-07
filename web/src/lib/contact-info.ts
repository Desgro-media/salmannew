export const LOCATION_NAME = "MARKAZ COMPLEX";
export const LOCATION_ADDRESS =
  "Markaz Complex, Mavoor Rd, Opposite New Bus Stand, Arayidathupalam, Kozhikode, Kerala 673004";
export const LOCATION_MAPS_QUERY = encodeURIComponent(LOCATION_ADDRESS);
export const LOCATION_MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${LOCATION_MAPS_QUERY}`;
export const LOCATION_MAPS_EMBED_URL = `https://www.google.com/maps?q=${LOCATION_MAPS_QUERY}&output=embed`;
