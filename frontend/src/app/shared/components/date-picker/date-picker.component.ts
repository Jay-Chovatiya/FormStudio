import {
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  input,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FieldTypes } from '../../../core/models/field-types';

export type DatePickerMode = 'Date' | 'DateTime';
export type CalendarView = 'days' | 'months' | 'years';

interface CalendarDay {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  dateString: string; // YYYY-MM-DD
}

@Component({
  selector: 'app-date-picker',
  imports: [],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
})
export class DatePickerComponent implements ControlValueAccessor {
  readonly mode = input<DatePickerMode | FieldTypes>('Date');
  readonly placeholder = input<string>('');
  readonly min = input<string>(''); // YYYY-MM-DD
  readonly max = input<string>(''); // YYYY-MM-DD
  readonly id = input<string>('');

  // Internal reactive state
  readonly isOpen = signal(false);
  readonly isDisabled = signal(false);
  readonly isTouched = signal(false);
  readonly positionAbove = signal(false);
  readonly alignRight = signal(false);

  // Selected date/time state
  readonly selectedDate = signal<Date | null>(null);

  // View state for navigating calendar
  readonly viewYear = signal<number>(new Date().getFullYear());
  readonly viewMonth = signal<number>(new Date().getMonth());
  readonly viewMode = signal<CalendarView>('days');
  readonly yearRangeStart = signal<number>(Math.floor(new Date().getFullYear() / 12) * 12);

  // Time state in 24-hour format
  readonly selectedHour = signal<number>(12);
  readonly selectedMinute = signal<number>(0);

  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  readonly shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Formatted display string for input box
  readonly displayValue = computed(() => {
    const date = this.selectedDate();
    if (!date) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = this.shortMonthNames[date.getMonth()];
    const year = date.getFullYear();

    if (this.mode() === 'DateTime') {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    }

    return `${day} ${month} ${year}`;
  });

  // Effective placeholder
  readonly effectivePlaceholder = computed(() => {
    const custom = this.placeholder();
    if (custom) return custom;
    return this.mode() === 'DateTime' ? 'Select date and time...' : 'Select date...';
  });

  // Calendar days grid
  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const selected = this.selectedDate();
    const today = new Date();
    const todayStr = this.formatDateIso(today);
    const selectedStr = selected ? this.formatDateIso(selected) : '';
    const minVal = this.min();
    const maxVal = this.max();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const iso = this.formatDateIso(prevDate);
      days.push({
        day: d,
        month: prevDate.getMonth(),
        year: prevDate.getFullYear(),
        isCurrentMonth: false,
        isToday: iso === todayStr,
        isSelected: iso === selectedStr,
        isDisabled: this.isDateDisabled(iso, minVal, maxVal),
        dateString: iso,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const curDate = new Date(year, month, d);
      const iso = this.formatDateIso(curDate);
      days.push({
        day: d,
        month: month,
        year: year,
        isCurrentMonth: true,
        isToday: iso === todayStr,
        isSelected: iso === selectedStr,
        isDisabled: this.isDateDisabled(iso, minVal, maxVal),
        dateString: iso,
      });
    }

    // Next month padding days to fill 35 or 42 cells
    const totalFilled = days.length;
    const totalTarget = totalFilled <= 35 ? 35 : 42;
    const remaining = totalTarget - totalFilled;

    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const iso = this.formatDateIso(nextDate);
      days.push({
        day: d,
        month: nextDate.getMonth(),
        year: nextDate.getFullYear(),
        isCurrentMonth: false,
        isToday: iso === todayStr,
        isSelected: iso === selectedStr,
        isDisabled: this.isDateDisabled(iso, minVal, maxVal),
        dateString: iso,
      });
    }

    return days;
  });

  // Year range grid for year selector (12 years)
  readonly yearsGrid = computed<number[]>(() => {
    const start = this.yearRangeStart();
    const years: number[] = [];
    for (let i = 0; i < 12; i++) {
      years.push(start + i);
    }
    return years;
  });

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly elementRef: ElementRef) {}

  // ControlValueAccessor implementation
  writeValue(value: string | null | undefined): void {
    if (!value) {
      this.selectedDate.set(null);
      return;
    }

    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      this.selectedDate.set(parsed);
      this.viewYear.set(parsed.getFullYear());
      this.viewMonth.set(parsed.getMonth());
      this.selectedHour.set(parsed.getHours());
      this.selectedMinute.set(parsed.getMinutes());
      this.yearRangeStart.set(Math.floor(parsed.getFullYear() / 12) * 12);
    } else {
      this.selectedDate.set(null);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
    if (isDisabled) {
      this.isOpen.set(false);
    }
  }

  // Toggle and popup handling
  togglePicker(): void {
    if (this.isDisabled()) return;
    if (this.isOpen()) {
      this.closePicker();
    } else {
      this.openPicker();
    }
  }

  openPicker(): void {
    if (this.isDisabled()) return;
    const current = this.selectedDate() || new Date();
    this.viewYear.set(current.getFullYear());
    this.viewMonth.set(current.getMonth());
    this.viewMode.set('days');
    this.updateDropdownPosition();
    this.isOpen.set(true);
  }

  updateDropdownPosition(): void {
    if (typeof window === 'undefined') return;

    const host = this.elementRef.nativeElement as HTMLElement;
    const triggerEl = (host.querySelector('.fs-datepicker-trigger') as HTMLElement) || host;
    const rect = triggerEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    // Estimate height required: DateTime mode (~420px), Date mode (~340px)
    const neededHeight = this.mode() === 'DateTime' ? 420 : 340;

    let spaceBelow = viewportHeight - rect.bottom;
    let spaceAbove = rect.top;

    // Check if an ancestor scrollable container restricts space
    let parent = host.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (['auto', 'scroll', 'hidden'].includes(style.overflowY)) {
        const parentRect = parent.getBoundingClientRect();
        const parentSpaceBelow = parentRect.bottom - rect.bottom;
        const parentSpaceAbove = rect.top - parentRect.top;
        if (parentSpaceBelow < spaceBelow) {
          spaceBelow = parentSpaceBelow;
        }
        if (parentSpaceAbove < spaceAbove) {
          spaceAbove = parentSpaceAbove;
        }
      }
      parent = parent.parentElement;
    }

    // If there is not enough space below, and more space above, flip to top
    const shouldPlaceAbove = spaceBelow < neededHeight && spaceAbove > spaceBelow;
    this.positionAbove.set(shouldPlaceAbove);

    // Prevent overflow off the right edge of viewport
    const shouldAlignRight = (viewportWidth - rect.left < 310) && (rect.right >= 310);
    this.alignRight.set(shouldAlignRight);
  }

  closePicker(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.isTouched.set(true);
      this.onTouched();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen()) {
      this.updateDropdownPosition();
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isOpen()) {
      this.updateDropdownPosition();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const clickedInside = this.elementRef.nativeElement.contains(event.target as Node);
    if (!clickedInside) {
      this.closePicker();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.closePicker();
    }
  }

  // Navigation handlers
  prevMonth(): void {
    if (this.viewMode() === 'days') {
      const currentMonth = this.viewMonth();
      if (currentMonth === 0) {
        this.viewMonth.set(11);
        this.viewYear.update((y) => y - 1);
      } else {
        this.viewMonth.update((m) => m - 1);
      }
    } else if (this.viewMode() === 'months') {
      this.viewYear.update((y) => y - 1);
    } else if (this.viewMode() === 'years') {
      this.yearRangeStart.update((y) => y - 12);
    }
  }

  nextMonth(): void {
    if (this.viewMode() === 'days') {
      const currentMonth = this.viewMonth();
      if (currentMonth === 11) {
        this.viewMonth.set(0);
        this.viewYear.update((y) => y + 1);
      } else {
        this.viewMonth.update((m) => m + 1);
      }
    } else if (this.viewMode() === 'months') {
      this.viewYear.update((y) => y + 1);
    } else if (this.viewMode() === 'years') {
      this.yearRangeStart.update((y) => y + 12);
    }
  }

  toggleViewMode(): void {
    if (this.viewMode() === 'days') {
      this.viewMode.set('months');
    } else if (this.viewMode() === 'months') {
      this.yearRangeStart.set(Math.floor(this.viewYear() / 12) * 12);
      this.viewMode.set('years');
    } else {
      this.viewMode.set('days');
    }
  }

  selectMonth(monthIndex: number): void {
    this.viewMonth.set(monthIndex);
    this.viewMode.set('days');
  }

  selectYear(year: number): void {
    this.viewYear.set(year);
    this.viewMode.set('months');
  }

  // Date Selection
  selectDay(day: CalendarDay): void {
    if (day.isDisabled) return;

    let hour = this.selectedHour();
    let minute = this.selectedMinute();

    // If updating month/year from padding days
    this.viewYear.set(day.year);
    this.viewMonth.set(day.month);

    const newDate = new Date(day.year, day.month, day.day, hour, minute);
    this.selectedDate.set(newDate);

    if (this.mode() !== 'DateTime') {
      this.emitValue(newDate);
      this.closePicker();
    } else {
      // In datetime mode, keep popup open so user can adjust time, but emit current selection
      this.emitValue(newDate);
    }
  }

  // 24-Hour Time Steppers & Input Handlers
  stepHour(delta: number): void {
    let next = (this.selectedHour() + delta) % 24;
    if (next < 0) next = 23;
    this.setHour(next);
  }

  stepMinute(delta: number): void {
    let next = (this.selectedMinute() + delta) % 60;
    if (next < 0) next = 59;
    this.setMinute(next);
  }

  onHourInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.min(23, val));
      this.setHour(clamped);
    }
  }

  onMinuteInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.min(59, val));
      this.setMinute(clamped);
    }
  }

  setTimePreset(hour: number, minute: number): void {
    this.selectedHour.set(hour);
    this.selectedMinute.set(minute);
    this.syncTimeToSelectedDate();
  }

  private setHour(hour: number): void {
    this.selectedHour.set(hour);
    this.syncTimeToSelectedDate();
  }

  private setMinute(minute: number): void {
    this.selectedMinute.set(minute);
    this.syncTimeToSelectedDate();
  }

  private syncTimeToSelectedDate(): void {
    let current = this.selectedDate();
    if (!current) {
      current = new Date();
      current.setHours(this.selectedHour(), this.selectedMinute(), 0, 0);
      this.selectedDate.set(current);
    } else {
      const updated = new Date(current);
      updated.setHours(this.selectedHour(), this.selectedMinute(), 0, 0);
      this.selectedDate.set(updated);
    }
    this.emitValue(this.selectedDate()!);
  }

  // Action Bar Handlers
  pickToday(): void {
    const now = new Date();
    this.viewYear.set(now.getFullYear());
    this.viewMonth.set(now.getMonth());
    this.selectedHour.set(now.getHours());
    this.selectedMinute.set(now.getMinutes());
    this.selectedDate.set(now);
    this.emitValue(now);

    if (this.mode() !== 'DateTime') {
      this.closePicker();
    }
  }

  clearValue(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedDate.set(null);
    this.emitValue(null);
    this.isTouched.set(true);
    this.onTouched();
  }

  applyAndClose(): void {
    if (!this.selectedDate()) {
      this.pickToday();
    }
    this.closePicker();
  }

  // Helpers
  private isDateDisabled(dateIso: string, min?: string, max?: string): boolean {
    if (min && dateIso < min) return true;
    if (max && dateIso > max) return true;
    return false;
  }

  private formatDateIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private emitValue(date: Date | null): void {
    if (!date) {
      this.onChange(null);
      return;
    }

    const isoDate = this.formatDateIso(date);
    if (this.mode() !== 'DateTime') {
      this.onChange(isoDate);
    } else {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const isoDateTime = `${isoDate}T${hours}:${minutes}`;
      this.onChange(isoDateTime);
    }
  }
}
