'use client';

import * as React from 'react';
import { addDays, format } from 'date-fns';
import { enUS, es, ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { useTranslations, useLocale } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  date,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const t = useTranslations('dateRangePicker');
  const locale = useLocale();
  const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(date);

  // Get date-fns locale
  const getDateLocale = () => {
    switch (locale) {
      case 'pt-br':
        return ptBR;
      case 'es':
        return es;
      default:
        return enUS;
    }
  };

  const handleSelect = (range: DateRange | undefined) => {
    setSelectedDate(range);
    onDateChange?.(range);
  };

  const handlePreset = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'year') => {
    const today = new Date();
    let range: DateRange | undefined;

    switch (preset) {
      case 'today':
        range = { from: today, to: today };
        break;
      case 'yesterday':
        const yesterday = addDays(today, -1);
        range = { from: yesterday, to: yesterday };
        break;
      case 'week':
        range = { from: addDays(today, -7), to: today };
        break;
      case 'month':
        range = { from: addDays(today, -30), to: today };
        break;
      case 'year':
        range = { from: addDays(today, -365), to: today };
        break;
    }

    handleSelect(range);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate?.from ? (
              selectedDate.to ? (
                <>
                  {format(selectedDate.from, 'LLL dd, y', { locale: getDateLocale() })} -{' '}
                  {format(selectedDate.to, 'LLL dd, y', { locale: getDateLocale() })}
                </>
              ) : (
                format(selectedDate.from, 'LLL dd, y', { locale: getDateLocale() })
              )
            ) : (
              <span>{t('placeholder')}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets sidebar */}
            <div className="flex flex-col gap-1 border-r p-3">
              <div className="px-2 py-1.5 text-sm font-semibold">{t('presets')}</div>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => handlePreset('today')}
              >
                {t('today')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => handlePreset('yesterday')}
              >
                {t('yesterday')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => handlePreset('week')}
              >
                {t('last7Days')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => handlePreset('month')}
              >
                {t('last30Days')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => handlePreset('year')}
              >
                {t('last365Days')}
              </Button>
            </div>

            {/* Calendar */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={selectedDate?.from}
                selected={selectedDate}
                onSelect={handleSelect}
                numberOfMonths={2}
                locale={getDateLocale()}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
