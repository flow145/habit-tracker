import type { Duration } from 'date-fns'
import {
  add,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isValid,
  parseISO,
  sub,
} from 'date-fns'

export type DayString = `${number}-${number}-${number}`

/** This adapter gives Date a fixed calendar zone, including for dates skipped by a local zone */
class CalendarDate extends Date {
  override getDate() {
    return super.getUTCDate()
  }
  override getDay() {
    return super.getUTCDay()
  }
  override getFullYear() {
    return super.getUTCFullYear()
  }
  override getHours() {
    return super.getUTCHours()
  }
  override getMilliseconds() {
    return super.getUTCMilliseconds()
  }
  override getMinutes() {
    return super.getUTCMinutes()
  }
  override getMonth() {
    return super.getUTCMonth()
  }
  override getSeconds() {
    return super.getUTCSeconds()
  }
  override getTimezoneOffset() {
    return 0
  }
  override setDate(value: number) {
    return super.setUTCDate(value)
  }
  override setFullYear(...args: [year: number, month?: number, date?: number]) {
    return super.setUTCFullYear(...args)
  }
  override setHours(...args: [hours: number, minutes?: number, seconds?: number, ms?: number]) {
    return super.setUTCHours(...args)
  }
  override setMilliseconds(value: number) {
    return super.setUTCMilliseconds(value)
  }
  override setMinutes(...args: [minutes: number, seconds?: number, ms?: number]) {
    return super.setUTCMinutes(...args)
  }
  override setMonth(...args: [month: number, date?: number]) {
    return super.setUTCMonth(...args)
  }
  override setSeconds(...args: [seconds: number, ms?: number]) {
    return super.setUTCSeconds(...args)
  }
}

const parseCalendarDate = (value: DayString) =>
  parseISO(value, { in: (timestamp) => new CalendarDate(timestamp) })

/** A calendar date with no time or time-zone identity. */
export class Day {
  readonly value: DayString

  constructor(value: DayString | Date = new Date()) {
    if (value instanceof Date) {
      if (!isValid(value)) throw new RangeError('Invalid date')
      this.value = format(value, 'yyyy-MM-dd') as DayString
      return
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      format(parseCalendarDate(value), 'yyyy-MM-dd') !== value
    )
      throw new RangeError(`Invalid calendar date: ${value}`)

    this.value = value
  }

  private toDate(): Date {
    return parseCalendarDate(this.value)
  }

  add(duration: Duration): Day {
    return new Day(add(this.toDate(), duration))
  }

  subtract(duration: Duration): Day {
    return new Day(sub(this.toDate(), duration))
  }

  differenceInDays(other: Day): number {
    return differenceInCalendarDays(this.toDate(), other.toDate())
  }

  format(pattern: string): string {
    return format(this.toDate(), pattern)
  }

  [Symbol.toPrimitive](): DayString {
    return this.value
  }

  static eachDayOfInterval(start: Day, end: Day): Day[] {
    if (end < start) return []
    return eachDayOfInterval({ start: start.toDate(), end: end.toDate() }).map(
      (date) => new Day(date),
    )
  }
}
