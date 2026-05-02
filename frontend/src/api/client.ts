import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
})

// Add X-User-Id header to every request if user is logged in
client.interceptors.request.use((config) => {
  const userId = sessionStorage.getItem('userId')
  if (userId) {
    config.headers['X-User-Id'] = userId
  }
  return config
})

export default client
