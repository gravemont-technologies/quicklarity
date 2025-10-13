import ical, { ICalCalendar, ICalEventData } from 'ical-generator';
import { StrategicPlan, CalendarEvent } from '../../../shared/types';
import { google } from 'googleapis';

/**
 * Generate calendar events from strategic plan
 * 
 * Creates 3 key events:
 * 1. Week 1 kickoff
 * 2. Mid-point check-in (Week 3-4)
 * 3. Final review (Week 6-8)
 */
export async function generateCalendarEvents(
  plan: StrategicPlan,
  googleToken?: string
): Promise<CalendarEvent[]> {
  
  const now = new Date();
  
  // Event 1: Kickoff (3 days from now)
  const kickoffDate = new Date(now);
  kickoffDate.setDate(kickoffDate.getDate() + 3);
  kickoffDate.setHours(9, 0, 0, 0); // 9 AM
  
  const kickoffEnd = new Date(kickoffDate);
  kickoffEnd.setHours(10, 0, 0, 0); // 1 hour duration
  
  const kickoffEvent: CalendarEvent = {
    title: '🚀 Strategic Plan Kickoff',
    description: `Review your strategic plan and align on priorities:\n\n${plan.executiveSummary}\n\nTop Priority: ${plan.topPriorities[0]?.taskTitle}`,
    startDate: kickoffDate.toISOString(),
    endDate: kickoffEnd.toISOString(),
  };
  
  // Event 2: Mid-point check-in (3 weeks from now)
  const midpointDate = new Date(now);
  midpointDate.setDate(midpointDate.getDate() + 21);
  midpointDate.setHours(14, 0, 0, 0); // 2 PM
  
  const midpointEnd = new Date(midpointDate);
  midpointEnd.setHours(15, 0, 0, 0);
  
  const midpointEvent: CalendarEvent = {
    title: '🔄 Strategic Plan Mid-Point Review',
    description: `Check progress on:\n${plan.topPriorities.slice(0, 3).map(p => `- ${p.taskTitle}`).join('\n')}\n\nAdjust course if needed.`,
    startDate: midpointDate.toISOString(),
    endDate: midpointEnd.toISOString(),
  };
  
  // Event 3: Final review (6 weeks from now)
  const finalDate = new Date(now);
  finalDate.setDate(finalDate.getDate() + 42);
  finalDate.setHours(10, 0, 0, 0);
  
  const finalEnd = new Date(finalDate);
  finalEnd.setHours(11, 30, 0, 0);
  
  const finalEvent: CalendarEvent = {
    title: '✅ Strategic Plan Final Review',
    description: `Celebrate wins and plan next phase!\n\nReview:\n${plan.nextSteps.slice(0, 3).join('\n')}`,
    startDate: finalDate.toISOString(),
    endDate: finalEnd.toISOString(),
  };
  
  const events = [kickoffEvent, midpointEvent, finalEvent];
  
  // If Google Calendar token provided, attempt to create events
  if (googleToken) {
    await createGoogleCalendarEvents(events, googleToken);
  }
  
  return events;
}

/**
 * Create events in Google Calendar (optional)
 */
async function createGoogleCalendarEvents(
  events: CalendarEvent[],
  accessToken: string
): Promise<void> {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    const calendar = google.calendar({ version: 'v3', auth });
    
    for (const event of events) {
      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: event.title,
          description: event.description,
          start: {
            dateTime: event.startDate,
            timeZone: 'UTC',
          },
          end: {
            dateTime: event.endDate,
            timeZone: 'UTC',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 }, // 1 day before
              { method: 'popup', minutes: 30 }, // 30 min before
            ],
          },
        },
      });
    }
    
    console.log('Successfully created Google Calendar events');
    
  } catch (error: any) {
    console.warn('Failed to create Google Calendar events:', error.message);
    // Don't throw - calendar creation is optional
  }
}

/**
 * Generate ICS file for a single event
 */
export function generateICSFile(event: CalendarEvent): string {
  const cal = ical({
    name: 'Strategic Clarity Engine',
    timezone: 'UTC',
  });
  
  cal.createEvent({
    start: new Date(event.startDate),
    end: new Date(event.endDate),
    summary: event.title,
    description: event.description,
    location: event.location,
  });
  
  return cal.toString();
}

