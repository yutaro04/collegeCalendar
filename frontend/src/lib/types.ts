export interface CalendarEvent {
  id: string;
  calendarName: string;
  title: string;
  description: string;
  location: string;
  startISO: string;
  endISO: string;
  dateKey: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  displayDate: string; // M/d
  isAllDay: boolean;
  color: string;
}

export interface EventsResponse {
  success: boolean;
  events: CalendarEvent[];
  lastSync: string;
  error?: string;
}
