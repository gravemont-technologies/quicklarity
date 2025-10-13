// Calendar event generator - Google Calendar + ICS fallback
const ical = require('ical-generator');
const { google } = require('googleapis');

async function generateCalendarEvents(plan, calendarOAuthToken) {
  const now = new Date();
  
  // Generate 3 strategic events
  const events = [
    {
      title: '🚀 Strategic Plan Kickoff',
      description: `Review your strategic plan:\n\n${plan.executiveSummary}\n\nTop Priority: ${plan.topPriorities?.[0]?.taskTitle || 'Review plan'}`,
      start: addDays(now, 3, 9),
      end: addDays(now, 3, 10)
    },
    {
      title: '🔄 Mid-Point Review',
      description: `Check progress on:\n${(plan.topPriorities || []).slice(0, 3).map(p => `- ${p.taskTitle}`).join('\n')}`,
      start: addDays(now, 21, 14),
      end: addDays(now, 21, 15)
    },
    {
      title: '✅ Final Review',
      description: `Celebrate wins!\n\nNext steps:\n${(plan.nextSteps || []).slice(0, 3).join('\n')}`,
      start: addDays(now, 42, 10),
      end: addDays(now, 42, 11.5)
    }
  ];
  
  // Try Google Calendar if OAuth provided
  if (calendarOAuthToken) {
    try {
      await createGoogleCalendarEvents(events, calendarOAuthToken);
      console.log('  → Google Calendar events created');
    } catch (error) {
      console.warn('  → Google Calendar failed:', error.message);
    }
  }
  
  // Generate ICS files (always)
  const icsLinks = events.map((event, i) => generateICS(event, i));
  
  return { icsLinks };
}

function addDays(date, days, hour) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  newDate.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
  return newDate;
}

function generateICS(event, index) {
  const calendar = ical({ name: 'Strategic Clarity Engine' });
  calendar.createEvent({
    start: event.start,
    end: event.end,
    summary: event.title,
    description: event.description
  });
  
  const icsContent = calendar.toString();
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
}

async function createGoogleCalendarEvents(events, accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth });
  
  for (const event of events) {
    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.title,
        description: event.description,
        start: { dateTime: event.start.toISOString(), timeZone: 'UTC' },
        end: { dateTime: event.end.toISOString(), timeZone: 'UTC' },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 1440 },
            { method: 'popup', minutes: 30 }
          ]
        }
      }
    });
  }
}

module.exports = { generateCalendarEvents };

