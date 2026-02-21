export function formatDate(date, withTime = false) {
  if (!date) return '-'
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }
  if (withTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
    options.month = 'short' // Shorter month for comments
  }
  return new Date(date).toLocaleDateString('id-ID', options)
}
