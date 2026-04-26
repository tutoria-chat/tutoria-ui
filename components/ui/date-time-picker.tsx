"use client"

import * as React from "react"
import { CalendarIcon, ClockIcon, XIcon } from "lucide-react"
import { format, isValid, setHours, setMinutes } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DateTimePickerProps {
  /**
   * For datetime mode (showTime=true, default): ISO datetime-local string e.g. "2026-05-20T14:30"
   * For date-only mode (showTime=false): ISO date string e.g. "2026-05-20"
   */
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Minimum selectable date */
  fromDate?: Date
  /** Show time columns (hours + minutes). Default: true */
  showTime?: boolean
}

function parseValue(value?: string): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return isValid(d) ? d : undefined
}

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toDateOnly(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  fromDate,
  showTime = true,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parseValue(value)

  const defaultPlaceholder = showTime ? "Pick a date & time" : "Pick a date"

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return
    if (showTime) {
      const base = selected ?? new Date()
      const next = setMinutes(setHours(day, base.getHours()), base.getMinutes())
      onChange(toDatetimeLocal(next))
    } else {
      onChange(toDateOnly(day))
      setOpen(false)
    }
  }

  const handleHour = (h: number) => {
    const base = selected ?? new Date()
    onChange(toDatetimeLocal(setHours(base, h)))
  }

  const handleMinute = (m: number) => {
    const base = selected ?? new Date()
    onChange(toDatetimeLocal(setMinutes(base, m)))
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
  }

  const displayLabel = selected
    ? showTime
      ? format(selected, "PPP '·' HH:mm")
      : format(selected, "PPP")
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
          <span className="flex-1 truncate">
            {displayLabel ?? (placeholder ?? defaultPlaceholder)}
          </span>
          {selected && (
            <XIcon
              className="ml-2 h-4 w-4 shrink-0 opacity-40 hover:opacity-100 transition-opacity"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-xl"
        align="start"
        sideOffset={6}
      >
        <div className={cn("flex divide-x rounded-md overflow-hidden")}>
          {/* Calendar */}
          <div className="p-2">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={handleDaySelect}
              fromDate={fromDate}
              captionLayout="dropdown"
              initialFocus
            />
          </div>

          {/* Time picker — only when showTime=true */}
          {showTime && (
            <div className="flex divide-x">
              {/* Hours */}
              <div className="flex flex-col">
                <div className="flex items-center justify-center gap-1 px-3 py-2 border-b bg-muted/40">
                  <ClockIcon className="h-3 w-3 opacity-50" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hr</span>
                </div>
                <ScrollArea className="h-[252px] w-[52px]">
                  <div className="flex flex-col py-1">
                    {HOURS.map((h) => {
                      const isActive = selected?.getHours() === h
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleHour(h)}
                          className={cn(
                            "mx-1 my-0.5 rounded-md px-1 py-1.5 text-sm tabular-nums transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "hover:bg-accent text-foreground"
                          )}
                        >
                          {String(h).padStart(2, "0")}
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Minutes */}
              <div className="flex flex-col">
                <div className="flex items-center justify-center px-3 py-2 border-b bg-muted/40">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min</span>
                </div>
                <ScrollArea className="h-[252px] w-[52px]">
                  <div className="flex flex-col py-1">
                    {MINUTES.map((m) => {
                      const isActive = selected ? Math.floor(selected.getMinutes() / 5) * 5 === m : false
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleMinute(m)}
                          className={cn(
                            "mx-1 my-0.5 rounded-md px-1 py-1.5 text-sm tabular-nums transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "hover:bg-accent text-foreground"
                          )}
                        >
                          {String(m).padStart(2, "0")}
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        {/* Footer — only for datetime mode (date-only closes on day select) */}
        {showTime && selected && (
          <div className="border-t px-3 py-2 flex items-center justify-between bg-muted/20">
            <span className="text-xs text-muted-foreground">
              {format(selected, "PPP '·' HH:mm")}
            </span>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              Confirm
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
