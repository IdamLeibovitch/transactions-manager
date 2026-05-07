import dayjs from 'dayjs'

export type TimeParts = {
  hour: string
  minute: string
}

export function formatTimeInputValue(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    timeZone,
  }).formatToParts(date)

  const hour = readPart(parts, 'hour') === '24' ? '00' : readPart(parts, 'hour')

  return `${hour}:${readPart(parts, 'minute')}`
}

export function isValidHour(value: string) {
  return /^\d{1,2}$/.test(value) && Number(value) >= 0 && Number(value) <= 23
}

export function isValidMinute(value: string) {
  return /^\d{1,2}$/.test(value) && Number(value) >= 0 && Number(value) <= 59
}

export function isValidTime(value: TimeParts) {
  return isValidHour(value.hour) && isValidMinute(value.minute)
}

export function toDayjsTime(value: TimeParts) {
  if (!isValidTime(value)) {
    return dayjs().hour(0).minute(0).second(0)
  }

  return dayjs().hour(Number(value.hour)).minute(Number(value.minute)).second(0)
}

export function toTimeParts(value: string): TimeParts {
  const [hour, minute] = value.split(':')

  return { hour, minute }
}

export function toTimeString(value: TimeParts) {
  return `${value.hour.padStart(2, '0')}:${value.minute.padStart(2, '0')}`
}

export function toUtcIsoStringForTimeZone(time: string, timeZone: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const { day, month, year } = getDatePartsInTimeZone(new Date(), timeZone)
  const tentativeUtc = Date.UTC(year, month - 1, day, hours, minutes, 0)
  const offset = getOffsetMinutes(timeZone, new Date(tentativeUtc))
  const adjustedUtc = tentativeUtc - offset * 60_000
  const verifiedOffset = getOffsetMinutes(timeZone, new Date(adjustedUtc))

  return new Date(tentativeUtc - verifiedOffset * 60_000).toISOString()
}

export function wrapNumber(value: number, min: number, max: number) {
  if (value > max) {
    return min
  }

  if (value < min) {
    return max
  }

  return value
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date)

  return {
    day: Number(readPart(parts, 'day')),
    month: Number(readPart(parts, 'month')),
    year: Number(readPart(parts, 'year')),
  }
}

function getOffsetMinutes(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date)
  const asUtc = Date.UTC(
    Number(readPart(parts, 'year')),
    Number(readPart(parts, 'month')) - 1,
    Number(readPart(parts, 'day')),
    Number(readPart(parts, 'hour')),
    Number(readPart(parts, 'minute')),
    Number(readPart(parts, 'second')),
  )

  return (asUtc - date.getTime()) / 60_000
}

function readPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? '00'
}
