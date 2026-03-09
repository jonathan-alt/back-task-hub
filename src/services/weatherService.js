const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

export async function getWeather(city) {
  if (!city) {
    const error = new Error('City is required')
    error.status = 400
    throw error
  }

  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    const error = new Error('OpenWeather API key not configured')
    error.status = 503
    throw error
  }

  const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`

  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch weather data')
    error.status = response.status === 404 ? 404 : 502
    throw error
  }

  return {
    city: data.name,
    country: data.sys.country,
    temperature: data.main.temp,
    feelsLike: data.main.feels_like,
    description: data.weather[0].description,
    humidity: data.main.humidity,
  }
}
