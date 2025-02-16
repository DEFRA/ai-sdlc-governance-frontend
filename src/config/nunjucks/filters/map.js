/**
 * Maps an array of objects to an array of values for a specific attribute
 * @param {Array<any>} array - The array to map
 * @param {object} options - The options object containing the attribute name
 * @returns {Array<any>}
 */
export function map(array, options) {
  if (!Array.isArray(array)) {
    return []
  }

  // Handle the way Nunjucks passes the attribute parameter
  const attribute = options?.attribute || options

  if (typeof attribute !== 'string') {
    return array
  }

  return array
    .map((item) => {
      const keys = attribute.split('.')
      return keys.reduce(
        (obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined),
        item
      )
    })
    .filter((item) => item !== undefined)
}
