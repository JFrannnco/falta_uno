let selectedLocation = ''
let selectedLatitude: number | null = null
let selectedLongitude: number | null = null

export const setSelectedLocation = (
  value: string,
  latitude: number | null = null,
  longitude: number | null = null
) => {
  selectedLocation = value
  selectedLatitude = latitude
  selectedLongitude = longitude
}

export const getSelectedLocation = () => {
  return selectedLocation
}

export const getSelectedCoords = () => {
  return {
    latitude: selectedLatitude,
    longitude: selectedLongitude,
  }
}

export const clearSelectedLocation = () => {
  selectedLocation = ''
  selectedLatitude = null
  selectedLongitude = null
}
