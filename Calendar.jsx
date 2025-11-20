
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Download,
  Clock,
  MapPin,
  Users,
  Video,
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays // New import
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchUser();
  }, []);

  const { data: events = [] } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () => base44.entities.Event.list('date'),
    initialData: [],
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['calendarMeetings'],
    queryFn: () => base44.entities.MeetingRoom.list('scheduled_time'),
    initialData: [],
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  const getEventsForDay = (date) => {
    const dayEvents = events.filter(e => {
      try {
        return isSameDay(parseISO(e.date), date) && e.status === 'approved';
      } catch {
        return false;
      }
    });

    const dayMeetings = meetings.filter(m => {
      try {
        return isSameDay(parseISO(m.scheduled_time), date) && m.status === 'scheduled';
      } catch {
        return false;
      }
    });

    return [...dayEvents, ...dayMeetings];
  };

  const generateICS = (event, isMeeting = false) => {
    const startDate = isMeeting ? new Date(event.scheduled_time) : new Date(event.date);
    const endDate = new Date(startDate.getTime() + (isMeeting ? event.duration_minutes * 60000 : 60 * 60000));
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ProSession//Calendar//EN
BEGIN:VEVENT
UID:${event.id}@prosession.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${isMeeting ? (event.is_public ? 'Online Meeting' : 'Private Meeting') : (event.location || 'TBD')}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllToICS = () => {
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ProSession//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:ProSession Events
X-WR-TIMEZONE:UTC
`;

    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    events.filter(e => e.status === 'approved').forEach(event => {
      const startDate = new Date(event.date);
      const endDate = new Date(startDate.getTime() + 60 * 60000); // Assuming 1 hour for generic events
      
      icsContent += `BEGIN:VEVENT
UID:event-${event.id}@prosession.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || 'TBD'}
STATUS:CONFIRMED
END:VEVENT
`;
    });

    meetings.filter(m => m.status === 'scheduled').forEach(meeting => {
      const startDate = new Date(meeting.scheduled_time);
      const endDate = new Date(startDate.getTime() + meeting.duration_minutes * 60000);
      
      icsContent += `BEGIN:VEVENT
UID:meeting-${meeting.id}@prosession.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${meeting.title}
DESCRIPTION:${meeting.description || ''}
LOCATION:Online Meeting
STATUS:CONFIRMED
END:VEVENT
`;
    });

    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ProSession_Calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedDayEvents = getEventsForDay(selectedDate);

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8 space-y-8">
        {/* Premium Header */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl rounded-3xl p-8 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <CalendarDays className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                  Calendar
                </h1>
                <p className="text-blue-200 text-lg">Plan your schedule • Track events • Stay organized</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Instructions */}
        <Card className="border-2 border-slate-700 bg-slate-900 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-400" />
                How to Sync with Outlook/Google Calendar
              </h3>
              <div className="flex gap-3">
                <Button onClick={exportAllToICS} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                  <Download className="w-4 h-4 mr-2" />
                  Sync All Events
                </Button>
                <Link to={createPageUrl("Events")}>
                  <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-800 p-4 rounded-lg">
                <p className="font-semibold mb-2 text-cyan-300">1️⃣ Download Calendar</p>
                <p className="text-slate-400">Click "Sync All Events" to download .ics file with all events</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg">
                <p className="font-semibold mb-2 text-blue-300">2️⃣ Import to Outlook</p>
                <p className="text-slate-400">Open Outlook → File → Open & Export → Import/Export → Import .ics file</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg">
                <p className="font-semibold mb-2 text-purple-300">3️⃣ Google Calendar</p>
                <p className="text-slate-400">Settings → Import & Export → Import the .ics file</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <Card className="lg:col-span-2 border-none shadow-2xl bg-slate-900 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-white">
                  {format(currentDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="text-white border-slate-700 hover:bg-slate-700">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-white border-slate-700 hover:bg-slate-700">
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="text-white border-slate-700 hover:bg-slate-700">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-sm text-slate-400 pb-2">
                    {day}
                  </div>
                ))}

                {/* Empty Days */}
                {emptyDays.map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square"></div>
                ))}

                {/* Calendar Days */}
                {daysInMonth.map(day => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <button
                      key={day.toString()}
                      onClick={() => setSelectedDate(day)}
                      className={`aspect-square p-2 rounded-xl transition-all relative ${
                        isSelected
                          ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg scale-110'
                          : isToday
                          ? 'bg-cyan-900 border-2 border-cyan-500 text-cyan-200'
                          : hasEvents
                          ? 'bg-slate-800 hover:shadow-md'
                          : 'hover:bg-slate-700'
                      }`}
                    >
                      <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {format(day, 'd')}
                      </span>
                      {hasEvents && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-cyan-500'}`}></div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card className="border-none shadow-2xl bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Events for {format(selectedDate, 'MMMM d, yyyy')}
              </CardTitle>
              <p className="text-sm text-slate-400">
                {selectedDayEvents.length} event(s)
              </p>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event) => {
                  const isMeeting = !!event.scheduled_time;
                  
                  return (
                    <div key={event.id} className="p-4 bg-slate-800 rounded-xl border-2 border-slate-700 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-white">{event.title}</h4>
                        {isMeeting ? (
                          <Video className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <CalendarIcon className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-slate-400 mb-3">{event.description}</p>
                      )}
                      
                      <div className="space-y-2 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {format(parseISO(isMeeting ? event.scheduled_time : event.date), 'h:mm a')}
                          {isMeeting && event.duration_minutes && ` (${event.duration_minutes} min)`}
                        </div>
                        
                        {!isMeeting && event.location && (
                          <div className="flex items-center gap-2">
                            {event.is_online ? <Video className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}
                            {event.location}
                          </div>
                        )}
                        
                        {event.registered_users && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            {event.registered_users.length} registered
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs text-white border-slate-600 hover:bg-slate-700"
                          onClick={() => generateICS(event, isMeeting)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Add to Outlook
                        </Button>
                        {isMeeting ? (
                          <Link to={createPageUrl("MeetingRooms")} className="flex-1">
                            <Button size="sm" className="w-full text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                              View
                            </Button>
                          </Link>
                        ) : (
                          <Link to={createPageUrl("Events")} className="flex-1">
                            <Button size="sm" className="w-full text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                              Details
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No events on this day</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
