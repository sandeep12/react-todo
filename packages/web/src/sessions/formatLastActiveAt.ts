const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatLastActiveAt(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)

  if (Number.isNaN(date.getTime())) {
    return isoTimestamp
  }

  return formatter.format(date)
}
