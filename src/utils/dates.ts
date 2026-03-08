import { format, startOfYear, addDays, isLeapYear } from 'date-fns'
import { YEAR } from '../constants'

/** Parse a YYYY-MM-DD string as local midnight (not UTC). */
function parseLocal(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

export function generateYearDays(year = YEAR): string[] {
  const start = startOfYear(new Date(year, 0, 1))
  const totalDays = isLeapYear(start) ? 366 : 365
  return Array.from({ length: totalDays }, (_, i) =>
    format(addDays(start, i), 'yyyy-MM-dd')
  )
}

export function dayIndexOf(dateStr: string, year = YEAR): number {
  const start = startOfYear(new Date(year, 0, 1))
  const date = parseLocal(dateStr)
  return Math.round((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDateHeader(dateStr: string, columnWidth: number): string {
  const date = parseLocal(dateStr)
  if (columnWidth >= 100) {
    return format(date, 'EEE d')
  } else if (columnWidth >= 40) {
    return format(date, 'd')
  }
  return ''
}

export function getMonthLabel(dateStr: string): string {
  return format(parseLocal(dateStr), 'MMM')
}

export function isFirstOfMonth(dateStr: string): boolean {
  return dateStr.endsWith('-01')
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
