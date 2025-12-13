import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Edit2, Trash2, ChevronRight, ChevronDown, Map } from 'lucide-react';
import svgPaths from '../../imports/svg-7hg6d30srz';

interface Event {
  id: string;
  title: string;
  type: 'Operational' | 'Training' | 'Community';
}

interface EventsPhaseProps {
  data?: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
  onComplete: () => void;
  onPrevious?: () => void;
}

export function EventsPhase({ data = {}, onDataChange, onComplete, onPrevious, onZoomToLocation }: EventsPhaseProps) {
  const [events, setEvents] = useState<Event[]>(data.events || [
    {
      id: '1',
      title: 'FIFA World Cup 2026 — Mercedes-Benz Stadium, Atlanta, GA',
      type: 'Operational'
    },
    {
      id: '2',
      title: 'Super Bowl LXI — SoFi Stadium, Los Angeles, CA',
      type: 'Operational'
    },
    {
      id: '3',
      title: 'State Fair of Texas — Fair Park, Dallas, TX',
      type: 'Community'
    },
    {
      id: '4',
      title: 'Boston Marathon — Downtown Boston, MA',
      type: 'Community'
    },
    {
      id: '5',
      title: 'Republican National Convention — Fiserv Forum, Milwaukee, WI',
      type: 'Operational'
    },
    {
      id: '6',
      title: 'New Year\'s Eve Celebration — Times Square, New York, NY',
      type: 'Community'
    }
  ]);

  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editingEventOriginal, setEditingEventOriginal] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set(events.map(e => e.id)));

  // Get map coordinates for each event location
  const getEventCoordinates = (id: string): { center: string; scale: string } => {
    switch (id) {
      case '1': // Mercedes-Benz Stadium, Atlanta, GA
        return { center: '-84.4008,33.7554', scale: '72223.819286' };
      case '2': // SoFi Stadium, Los Angeles, CA
        return { center: '-118.3378,33.9535', scale: '72223.819286' };
      case '3': // Fair Park, Dallas, TX
        return { center: '-96.7611,32.7854', scale: '72223.819286' };
      case '4': // Downtown Boston, MA (marathon route)
        return { center: '-71.0589,42.3601', scale: '72223.819286' };
      case '5': // Fiserv Forum, Milwaukee, WI
        return { center: '-87.9172,43.0451', scale: '72223.819286' };
      case '6': // Times Square, New York, NY
        return { center: '-73.9855,40.7580', scale: '72223.819286' };
      default:
        return { center: '-74.006,40.7128', scale: '72223.819286' }; // Default to NYC
    }
  };

  type EventDetails = {
    description: string;
    location: string;
    status: 'Planning' | 'Active' | 'Completed';
    startDate: string;
    endDate: string;
    expectedAttendees: string;
    securityLevel: string;
    leadAgency: string;
    eventCoordinator: string;
    lastUpdate: string;
  };

  const getEventDetails = (id: string): EventDetails => {
    switch (id) {
      case '1':
        return {
          description: 'Major international soccer tournament with multiple host venues across North America; heightened security posture with international law enforcement coordination.',
          location: 'Mercedes-Benz Stadium, Atlanta, GA',
          status: 'Planning',
          startDate: 'June 11, 2026',
          endDate: 'July 19, 2026',
          expectedAttendees: '~75,000 per match',
          securityLevel: 'SEAR Level 1',
          leadAgency: 'U.S. Secret Service / DHS',
          eventCoordinator: 'Atlanta FIFA Security Task Force',
          lastUpdate: 'Venue assessment complete; perimeter planning in progress'
        };
      case '2':
        return {
          description: 'National Football League championship game; extensive multi-agency coordination with CBP air support and enhanced crowd screening protocols.',
          location: 'SoFi Stadium, Los Angeles, CA',
          status: 'Planning',
          startDate: 'February 7, 2027',
          endDate: 'February 7, 2027',
          expectedAttendees: '~70,000 stadium / millions viewing',
          securityLevel: 'SEAR Level 1',
          leadAgency: 'U.S. Secret Service',
          eventCoordinator: 'LA Super Bowl Public Safety Command',
          lastUpdate: 'Traffic management plan under review; credentialing system active'
        };
      case '3':
        return {
          description: 'Annual state fair with carnival rides, livestock exhibits, concerts, and food vendors; large daily crowds requiring traffic control and medical standby.',
          location: 'Fair Park, Dallas, TX',
          status: 'Active',
          startDate: 'September 24, 2026',
          endDate: 'October 17, 2026',
          expectedAttendees: '~2.5 million total (24-day event)',
          securityLevel: 'State/Local coordination',
          leadAgency: 'Dallas Police Department',
          eventCoordinator: 'State Fair of Texas Security',
          lastUpdate: 'Daily operations ongoing; EMS on standby at 4 medical tents'
        };
      case '4':
        return {
          description: 'World-renowned marathon with 30,000 runners and spectator crowds along 26.2-mile route; rolling road closures and medical support stations every 2 miles.',
          location: 'Downtown Boston, MA',
          status: 'Planning',
          startDate: 'April 18, 2027',
          endDate: 'April 18, 2027',
          expectedAttendees: '~30,000 runners / 500,000 spectators',
          securityLevel: 'Enhanced (post-2013 protocols)',
          leadAgency: 'Boston Police Department / FBI',
          eventCoordinator: 'Boston Athletic Association',
          lastUpdate: 'Route surveillance plan finalized; bag check protocols confirmed'
        };
      case '5':
        return {
          description: 'Major political convention with high-profile attendees; multi-layered security including vehicle checkpoints, credentialing, and airspace restrictions.',
          location: 'Fiserv Forum, Milwaukee, WI',
          status: 'Planning',
          startDate: 'July 15, 2024',
          endDate: 'July 18, 2024',
          expectedAttendees: '~50,000 delegates/media/guests',
          securityLevel: 'National Special Security Event (NSSE)',
          leadAgency: 'U.S. Secret Service',
          eventCoordinator: 'Milwaukee RNC 2024 Security Command',
          lastUpdate: 'Inner perimeter construction underway; FAA TFR published'
        };
      case '6':
      default:
        return {
          description: 'Iconic New Year\'s Eve ball drop celebration with dense pedestrian crowds, multi-hour street closures, and elevated counter-terrorism posture.',
          location: 'Times Square, New York, NY',
          status: 'Planning',
          startDate: 'December 31, 2026',
          endDate: 'January 1, 2027',
          expectedAttendees: '~1 million in Times Square area',
          securityLevel: 'SEAR Level 2',
          leadAgency: 'NYPD / FBI JTTF',
          eventCoordinator: 'Times Square Alliance / NYPD',
          lastUpdate: 'Pedestrian flow modeling complete; staging areas designated'
        };
    }
  };

  const updateData = (newEvents: Event[]) => {
    setEvents(newEvents);
    onDataChange({ ...data, events: newEvents });
  };

  const addEvent = (position: 'top' | 'bottom' = 'bottom') => {
    const newEvent: Event = {
      id: Date.now().toString(),
      title: '',
      type: 'Operational'
    };
    if (position === 'top') {
      updateData([newEvent, ...events]);
    } else {
      updateData([...events, newEvent]);
    }
    setEditingEventOriginal({ ...newEvent });
    setEditingEvent(newEvent.id);
    setExpandedEvents(prev => new Set([...prev, newEvent.id]));
  };

  const updateEventTitle = (id: string, title: string) => {
    const updated = events.map(evt =>
      evt.id === id ? { ...evt, title } : evt
    );
    updateData(updated);
  };

  const updateEventType = (id: string, type: 'Operational' | 'Training' | 'Community') => {
    const updated = events.map(evt =>
      evt.id === id ? { ...evt, type } : evt
    );
    updateData(updated);
  };

  const deleteEvent = (id: string) => {
    updateData(events.filter(evt => evt.id !== id));
  };

  const startEditingEvent = (event: Event) => {
    setEditingEventOriginal({ ...event });
    setEditingEvent(event.id);
  };

  const saveEventEdit = () => {
    setEditingEvent(null);
    setEditingEventOriginal(null);
  };

  const cancelEventEdit = () => {
    if (editingEventOriginal) {
      const updated = events.map(evt =>
        evt.id === editingEventOriginal.id ? editingEventOriginal : evt
      );
      updateData(updated);
    }
    setEditingEvent(null);
    setEditingEventOriginal(null);
  };

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // Filter events based on search term
  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return event.title.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-6">
      {/* Header Section - Sticky */}
      <div className="sticky top-0 z-10 bg-[#222529] rounded-lg border border-[#6e757c] relative">
        <div className="flex items-center justify-between px-[13px] py-3 w-full border-b-2 border-border rounded-t-lg rounded-b-none">
          {/* Title */}
          <div className="relative shrink-0 flex items-center gap-2">
            <p className="caption text-nowrap text-white whitespace-pre">
              Events
            </p>
            <span className="caption text-white">
              ({events.filter(evt => getEventDetails(evt.id).status === 'Active').length} active)
            </span>
          </div>

          {/* Search and Add Event Button */}
          <div className="flex items-center gap-[29px]">
            {/* Search Input */}
            <div className="relative h-[26px] w-[195px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="box-border w-full h-[26px] bg-transparent border border-[#6e757c] rounded-[4px] px-[26px] py-[3.25px] caption text-white placeholder:text-[#6e757c] focus:outline-none focus:border-accent"
              />
              <div className="absolute left-[8px] size-[11.375px] top-[7.44px] pointer-events-none">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                  <g>
                    <path d={svgPaths.p3a3bec00} stroke="#6E757C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.710938" />
                    <path d={svgPaths.p380aaa80} stroke="#6E757C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.710938" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Add Event Button */}
            <button
              onClick={() => addEvent('top')}
              className="bg-[#01669f] h-[22.75px] rounded-[4px] w-[130.625px] hover:bg-[#01669f]/90 transition-colors flex items-center justify-center relative"
            >
              <div className="absolute left-[16px] size-[13px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
                  <g>
                    <path d="M2.70833 6.5H10.2917" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
                    <path d="M6.5 2.70833V10.2917" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
                  </g>
                </svg>
              </div>
              <p className="caption text-nowrap text-white ml-[21px]">
                Add Event
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="border border-border rounded-lg overflow-hidden"
            style={{ 
              background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)'
            }}
          >
            {/* Event Header */}
            <div className={`p-3 ${expandedEvents.has(event.id) ? 'border-b border-border' : ''}`}>
              {editingEvent === event.id ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={event.type}
                      onValueChange={(value) => updateEventType(event.id, value as 'Operational' | 'Training' | 'Community')}
                    >
                      <SelectTrigger 
                        className="w-14 h-[22px] bg-input-background border-border !text-[12px] flex-shrink-0"
                        style={{ fontFamily: "'Open Sans', sans-serif", lineHeight: '1.5' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent onClick={(e) => e.stopPropagation()}>
                        <SelectItem 
                          value="Operational"
                          className="!text-[12px]"
                          style={{ fontFamily: "'Open Sans', sans-serif", lineHeight: '1.5' }}
                        >
                          O
                        </SelectItem>
                        <SelectItem 
                          value="Training"
                          className="!text-[12px]"
                          style={{ fontFamily: "'Open Sans', sans-serif", lineHeight: '1.5' }}
                        >
                          T
                        </SelectItem>
                        <SelectItem 
                          value="Community"
                          className="!text-[12px]"
                          style={{ fontFamily: "'Open Sans', sans-serif", lineHeight: '1.5' }}
                        >
                          C
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={event.title}
                      onChange={(e) => updateEventTitle(event.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEventEdit();
                        if (e.key === 'Escape') cancelEventEdit();
                      }}
                      placeholder="Enter event name"
                      autoFocus
                      className="bg-input-background border-border text-card-foreground caption"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveEventEdit();
                      }}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 h-[22.75px] px-3"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEventEdit();
                      }}
                      variant="outline"
                      size="sm"
                      className="border-border h-[22.75px] px-3"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div 
                    className="flex items-start gap-2 flex-1 cursor-pointer"
                    onClick={() => toggleEvent(event.id)}
                  >
                    {expandedEvents.has(event.id) ? (
                      <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className="caption text-white">{event.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="bg-[#01669f] h-[22.75px] rounded-[4px] w-[130.625px] hover:bg-[#01669f]/90 transition-colors flex items-center justify-center mr-2"
                    >
                      <p className="caption text-nowrap text-white">Event Workspace</p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Zoom to event location
                        if (onZoomToLocation) {
                          const coords = getEventCoordinates(event.id);
                          onZoomToLocation(coords.center, coords.scale);
                        }
                      }}
                      className="p-1 hover:bg-muted/30 rounded transition-colors"
                      title="Zoom to event location"
                    >
                      <Map className="w-3 h-3 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingEvent(event);
                      }}
                      className="p-1 hover:bg-muted/30 rounded transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEvent(event.id);
                      }}
                      className="p-1 hover:bg-muted/30 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Event Details Section */}
            {expandedEvents.has(event.id) && (
              <div className="p-4 space-y-4 bg-card/50">
                {(() => {
                  const d = getEventDetails(event.id);
                  return (
                    <>
                      {d.description && (
                        <div>
                          <label className="text-white mb-1 block">Description</label>
                          <p className="caption text-white">{d.description}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-white mb-1 block">Location</label>
                          <p className="caption text-white">{d.location}</p>
                        </div>
                        <div>
                          <label className="text-white mb-1 block">Status</label>
                          <p className="caption text-white">{d.status}</p>
                        </div>
                        <div>
                          <label className="text-white mb-1 block">Start Date</label>
                          <p className="caption text-white">{d.startDate}</p>
                        </div>
                        <div>
                          <label className="text-white mb-1 block">End Date</label>
                          <p className="caption text-white">{d.endDate}</p>
                        </div>
                        <div>
                          <label className="text-white mb-1 block">Expected Attendees</label>
                          <p className="caption text-white">{d.expectedAttendees}</p>
                        </div>
                        <div>
                          <label className="text-white mb-1 block">Security Level</label>
                          <p className="caption text-white">{d.securityLevel}</p>
                        </div>
                        <div>
                          <label className="text-white mb-1 block">Lead Agency</label>
                          <p className="caption text-white">{d.leadAgency}</p>
                        </div>
                        <div>
                          <label className="text-white mb-1 block">Event Coordinator</label>
                          <p className="caption text-white">{d.eventCoordinator}</p>
                        </div>
                        <div className="col-span-2">
                          <label className="text-white mb-1 block">Last Update</label>
                          <p className="caption text-white">{d.lastUpdate}</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

