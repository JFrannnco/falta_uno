let selectedLocation = ''

export const setSelectedLocation = (value: string) => {
  selectedLocation = value
}

export const getSelectedLocation = () => {
  return selectedLocation
}

export const clearSelectedLocation = () => {
  selectedLocation = ''
}