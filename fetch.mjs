import axios from 'axios'

/**
 * @param {string} url
 * @param {object} [options]
 */
export async function fetch(url, options = {}) {
  const response = await axios
    .get(url, {
      responseType: 'arraybuffer',
      ...options,
    })
    .catch((e) => {
      console.log(e.response.data)
      return e.response
    })
  return response.data
}
