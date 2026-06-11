// Mapbox configuration for municipality dashboard
// Read Mapbox token from Vite env (VITE_MAPBOX_TOKEN)

export const MAPBOX_CONFIG = {
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
  
  // Default map style - you can change this to other Mapbox styles
  mapStyle: 'mapbox://styles/mapbox/streets-v12',
  
  // Alternative styles:
  // 'mapbox://styles/mapbox/light-v11'
  // 'mapbox://styles/mapbox/dark-v11'
  // 'mapbox://styles/mapbox/satellite-v9'
  // 'mapbox://styles/mapbox/satellite-streets-v12'
  // 'mapbox://styles/mapbox/outdoors-v12'
  
  // Default center (Turkey approximate center - you can adjust for your municipality)
  defaultCenter: [35.2433, 38.9637], // [longitude, latitude]
  
  // Default zoom level
  defaultZoom: 6,
  
  // Map constraints
  minZoom: 2,
  maxZoom: 18,
  
  // Marker colors
  markerColors: {
    report: '#ef4444',      // Red for reports
    groupActive: '#10b981',  // Green for active groups
    groupPending: '#6b7280', // Gray for pending groups
    user: '#3b82f6'         // Blue for user location
  }
}

export const hasMapboxToken = () => !!MAPBOX_CONFIG.mapboxToken

// Helper function to get municipality-specific center
export const getMunicipalityCenter = (municipalityName) => {
  // You can extend this with specific coordinates for different municipalities
  const centers = {
    'istanbul': [28.9784, 41.0082],
    'ankara': [32.8597, 39.9334],
    'izmir': [27.1428, 38.4237],
    // Add more municipalities as needed
  }
  
  return centers[municipalityName?.toLowerCase()] || MAPBOX_CONFIG.defaultCenter
}
