import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronDown, ChevronRight, Edit2, Trash2, Map, X, Check, ArrowRightToLine } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import svgPaths from '../../imports/svg-7hg6d30srz';

interface AlertsPhaseProps {
  data: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
  onComplete: () => void;
  onPrevious?: () => void;
  onZoomToLocation?: (center: string, scale: string) => void;
  onAddAIContext?: (itemName: string) => void;
}

type Severity = 'Info' | 'Advisory' | 'Watch' | 'Warning' | 'Stand Down Safety';

interface AlertItem {
  id: string;
  title: string;
  source: string;
  severity: Severity;
  issuedAt: string;   // ISO
  expiresAt?: string; // ISO
  status: 'Active' | 'Cleared' | 'Expired';
  description: string;
  recipients?: string[]; // User emails/IDs
  scheduledTime?: string; // ISO timestamp
  channels?: string[]; // Communication channels
  timeSent?: string; // ISO timestamp
  sentBy?: string; // Name or email of sender
  location?: string; // Location where alert applies
}

export function AlertsPhase({ data, onDataChange, onZoomToLocation, onAddAIContext }: AlertsPhaseProps) {
  // Helper functions for notification severity
  const getNotificationSeverity = (notificationId: string): 'Minor' | 'Moderate' | 'Serious' | 'Severe' | 'Critical' => {
    switch (notificationId) {
      case 'incident-activation-request': return 'Critical';
      case 'boom-data-layer-review': return 'Serious';
      case 'sitrep-review': return 'Moderate';
      case 'safety-check-form': return 'Serious';
      case 'acknowledgement-receipt': return 'Moderate';
      default: return 'Moderate';
    }
  };

  const getSeverityRank = (severity: string): number => {
    switch (severity) {
      case 'Critical': return 5;
      case 'Severe': return 4;
      case 'Serious': return 3;
      case 'Moderate': return 2;
      case 'Minor': return 1;
      default: return 0;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'Critical': return '#DC2626'; // Red-600
      case 'Severe': return '#EA580C'; // Orange-600
      case 'Serious': return '#F59E0B'; // Amber-500
      case 'Moderate': return '#EAB308'; // Yellow-500
      case 'Minor': return '#84CC16'; // Lime-500
      default: return '#6B7280'; // Gray-500
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'historical' | 'sent'>('active');
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [isIncidentPopoverOpen, setIsIncidentPopoverOpen] = useState(false);
  const [selectedAORs, setSelectedAORs] = useState<string[]>([]);
  const [isAORPopoverOpen, setIsAORPopoverOpen] = useState(false);
  
  // State for acknowledgement notification
  const [acknowledgedTimestamp, setAcknowledgedTimestamp] = useState<string | null>(data.acknowledgedTimestamp || null);
  
  // State for safety check form notification
  const [safetyFormSubmitted, setSafetyFormSubmitted] = useState(data.safetyFormSubmitted || false);
  const [safetyFormData, setSafetyFormData] = useState({
    isSafe: data.safetyFormData?.isSafe || '',
    comments: data.safetyFormData?.comments || '',
    submittedAt: data.safetyFormData?.submittedAt || null
  });
  const [safetyCheckArchived, setSafetyCheckArchived] = useState(data.safetyCheckArchived || false);
  const [safetyCheckArchiveModalOpen, setSafetyCheckArchiveModalOpen] = useState(false);

  // State for boom data layer review notification
  const [boomDataLayerReviewed, setBoomDataLayerReviewed] = useState(data.boomDataLayerReviewed || false);
  const [boomDataLayerArchived, setBoomDataLayerArchived] = useState(data.boomDataLayerArchived || false);
  const [boomDataLayerReviewData, setBoomDataLayerReviewData] = useState({
    decision: data.boomDataLayerReviewData?.decision || '',
    comments: data.boomDataLayerReviewData?.comments || '',
    submittedAt: data.boomDataLayerReviewData?.submittedAt || null
  });

  // State for incident activation request notification
  const [incidentActivationResponded, setIncidentActivationResponded] = useState(data.incidentActivationResponded || false);
  const [incidentActivationAccepted, setIncidentActivationAccepted] = useState(data.incidentActivationAccepted || false);
  const [incidentActivationResponse, setIncidentActivationResponse] = useState({
    decision: data.incidentActivationResponse?.decision || '',
    submittedAt: data.incidentActivationResponse?.submittedAt || null
  });

  // State for SITREP review notification
  const [sitrepReviewed, setSitrepReviewed] = useState(data.sitrepReviewed || false);
  const [sitrepArchived, setSitrepArchived] = useState(data.sitrepArchived || false);
  const [sitrepReviewData, setSitrepReviewData] = useState({
    decision: data.sitrepReviewData?.decision || '',
    comments: data.sitrepReviewData?.comments || '',
    submittedAt: data.sitrepReviewData?.submittedAt || null
  });
  const [draftSitrepContent] = useState(
    'SITREP - District East\n\nCurrent Situation: District East maintains elevated readiness posture following Hurricane Delta downgrade. All sectors report normal operations resuming. Port Condition WHISKEY set for Delaware Bay and New York Harbor effective 0800L.\n\nOperational Status: Sector New York has 3 cutters deployed conducting post-storm damage assessment. Sector Delaware Bay reports 2 SAR cases resolved overnight with no casualties. Maritime Safety Zones lifted in outer waters.\n\nResources: 87-ft patrol boats returning to normal patrol schedules. Air Station Atlantic City conducting aerial reconnaissance of affected areas. All facilities report power restored and full operational capability.\n\nSubmitted by: J. Smith (j.smith@uscg.mil)\nSubmitted: 12/19/2025 14:30'
  );

  const [alerts, setAlerts] = useState<AlertItem[]>(
    data.alerts || [
      {
        id: 'al1',
        title: 'Small Craft Advisory – Gale conditions possible',
        source: 'NOAA/NWS',
        severity: 'Advisory',
        issuedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        status: 'Active',
        description: 'Sustained winds 25–33 kt and seas 7–10 ft possible in the outer coastal waters. Mariners should exercise caution; consider delaying small craft operations.',
        timeSent: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
        sentBy: 'j.martinez@uscg.mil',
        location: 'Gulf Coast Outer Waters'
      },
      {
        id: 'al2',
        title: 'Port Condition Yankee – Reduced operations',
        source: 'USCG COTP',
        severity: 'Watch',
        issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'Active',
        description: 'Port Condition YANKEE has been set. Terminal operations are curtailed; ensure vessels are prepared to depart or take safe refuge. Submit updated port status within 2 hours.',
        timeSent: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
        sentBy: 'm.rodriguez@uscg.mil',
        location: 'Houston Ship Channel'
      },
      {
        id: 'al3',
        title: 'Air Quality Alert – Sensitive groups affected',
        source: 'State Environmental Agency',
        severity: 'Info',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'Active',
        description: 'PM2.5 levels elevated near industrial corridors and along the waterfront. Sensitive groups should limit prolonged outdoor exertion.',
        timeSent: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        sentBy: 's.johnson@uscg.mil',
        location: 'LA/Long Beach Port Area'
      }
    ]
  );

  // Available incidents for filtering
  const incidents = [
    'Grid Outage Alpha - Oahu Substation Failure',
    'Solar Array Integration - Maui County',
    'Typhoon Olivia Grid Hardening Response',
    'Battery Storage System Beta - Big Island',
    'Transmission Line Repair - Kauai Emergency',
    'Wind Farm Emergency Shutdown - Molokai'
  ];

  // Available AORs for filtering
  const aors = [
    'District East',
    'District West',
    'Sector New York',
    'Sector Delaware Bay',
    'Sector Galveston',
  ];

  // Handler for incident selection
  const toggleIncident = (incident: string) => {
    setSelectedIncidents(prev => 
      prev.includes(incident) 
        ? prev.filter(i => i !== incident)
        : [...prev, incident]
    );
  };

  const clearIncidentFilter = () => {
    setSelectedIncidents([]);
  };

  // Handler for AOR selection
  const toggleAOR = (aor: string) => {
    setSelectedAORs(prev => 
      prev.includes(aor) 
        ? prev.filter(a => a !== aor)
        : [...prev, aor]
    );
  };

  const clearAORFilter = () => {
    setSelectedAORs([]);
  };

  const [formData, setFormData] = useState<AlertItem>({
    id: '',
    title: '',
    source: '',
    severity: 'Info',
    issuedAt: new Date().toISOString(),
    expiresAt: '',
    status: 'Active',
    description: '',
    recipients: [],
    scheduledTime: new Date().toISOString(),
    channels: [],
    archiveDateTime: '',
  });
  const [enableArchiveDateTime, setEnableArchiveDateTime] = useState(false);

  // State for recipient popovers
  const [individualsPopoverOpen, setIndividualsPopoverOpen] = useState(false);
  const [teamsPopoverOpen, setTeamsPopoverOpen] = useState(false);
  
  // State for send timing mode
  const [sendTimingMode, setSendTimingMode] = useState<'now' | 'scheduled'>('scheduled');

  // State for keep message same across channels
  const [keepMessageSame, setKeepMessageSame] = useState(true);
  
  // State for require acknowledgement
  const [requireAcknowledgement, setRequireAcknowledgement] = useState(false);
  
  // State for accept responses
  const [acceptResponses, setAcceptResponses] = useState(false);
  const [letRecipientsArchive, setLetRecipientsArchive] = useState(false);
  
  // State for active message tab
  const [activeMessageTab, setActiveMessageTab] = useState<string>('');
  
  // State for channel-specific messages
  const [channelMessages, setChannelMessages] = useState<Record<string, string>>({});

  // Set active tab when channels change
  useEffect(() => {
    if (formData.channels && formData.channels.length > 0) {
      // Set to first channel if no active tab or active tab is not in selected channels
      if (!activeMessageTab || !formData.channels.includes(activeMessageTab)) {
        setActiveMessageTab(formData.channels[0]);
      }
    }
  }, [formData.channels, activeMessageTab]);

  // Available communication channels
  const communicationChannels = [
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'sms', label: 'SMS', icon: '💬' },
    { id: 'push', label: 'PRATUS Notification', icon: '🔔' },
    { id: 'teams', label: 'Microsoft Teams', icon: '💼' },
  ];

  // Available individuals for recipient selection
  const availableIndividuals = [
    'john.smith@uscg.mil',
    'sarah.johnson@uscg.mil',
    'mike.williams@noaa.gov',
    'lisa.chen@epa.gov',
    'david.rodriguez@uscg.mil',
    'emily.davis@state.gov',
    'james.wilson@uscg.mil',
    'maria.garcia@noaa.gov',
    'robert.brown@uscg.mil',
    'jennifer.taylor@noaa.gov',
    'michael.anderson@epa.gov',
    'patricia.martinez@state.gov',
  ];

  // Available teams for recipient selection
  const availableTeams = [
    'Operations Section',
    'Planning Section',
    'Logistics Section',
    'Finance/Admin Section',
    'Incident Command Team',
    'Marine Branch',
    'Safety Officers',
    'Public Information Team',
    'Liaison Officers',
    'Environmental Unit',
    'Response Coordinators',
    'Field Operations Team',
  ];

  // Helper functions for recipients
  const toggleRecipient = (recipient: string) => {
    const recipients = formData.recipients || [];
    if (recipients.includes(recipient)) {
      setFormData({ ...formData, recipients: recipients.filter(r => r !== recipient) });
    } else {
      setFormData({ ...formData, recipients: [...recipients, recipient] });
    }
  };

  const removeRecipient = (recipient: string) => {
    setFormData({ ...formData, recipients: formData.recipients?.filter(r => r !== recipient) || [] });
  };

  const toggleChannel = (channelId: string) => {
    const channels = formData.channels || [];
    if (channels.includes(channelId)) {
      setFormData({ ...formData, channels: channels.filter(c => c !== channelId) });
    } else {
      setFormData({ ...formData, channels: [...channels, channelId] });
    }
  };

  // Get map coordinates for each alert based on alert type and content
  const getAlertCoordinates = (alertId: string): { center: string; scale: string } => {
    switch (alertId) {
      case 'al1': // Small Craft Advisory - outer coastal waters
        return { center: '-74.2,40.5', scale: '288895.277144' }; // New York/New Jersey coastal waters
      case 'al2': // Port Condition Yankee - major port
        return { center: '-95.2631,29.7604', scale: '144447.638572' }; // Houston Ship Channel
      case 'al3': // Air Quality Alert - industrial/waterfront area
        return { center: '-118.2437,33.7701', scale: '144447.638572' }; // LA/Long Beach port area
      default:
        return { center: '-74.006,40.7128', scale: '144447.638572' }; // Default to NYC area
    }
  };

  const formatDateDisplay = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return `${d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  };

  const formatMilitaryTimeUTC = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes} UTC`;
  };

  const persist = (items: AlertItem[]) => {
    setAlerts(items);
    onDataChange({ ...data, alerts: items });
  };

  const toggleAlert = (id: string) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openAddAlert = () => {
    setEditingAlertId(null);
    setFormData({
      id: '',
      title: '',
      source: 'Manual Alert',
      severity: 'Info',
      issuedAt: new Date().toISOString(),
      expiresAt: '',
      status: 'Active',
      description: '',
      recipients: [],
      scheduledTime: new Date().toISOString(),
      channels: [],
    });
    setSendTimingMode('scheduled');
    setIsSheetOpen(true);
  };

  const openEditAlert = (id: string) => {
    const a = alerts.find(x => x.id === id);
    if (!a) return;
    setEditingAlertId(id);
    setFormData({ ...a });
    setSendTimingMode(a.scheduledTime ? 'scheduled' : 'now');
    setIsSheetOpen(true);
  };

  const deleteAlert = (id: string) => {
    persist(alerts.filter(a => a.id !== id));
  };

  const saveAlert = () => {
    if (!formData.title) {
      return;
    }
    
    // Update scheduledTime based on send timing mode
    const updatedFormData = {
      ...formData,
      scheduledTime: sendTimingMode === 'now' ? new Date().toISOString() : formData.scheduledTime
    };
    
    if (editingAlertId) {
      persist(alerts.map(a => (a.id === editingAlertId ? { ...updatedFormData, id: editingAlertId } : a)));
    } else {
      const id = `${Date.now()}`;
      persist([...alerts, { ...updatedFormData, id, source: 'Manual Alert' }]);
    }
    setIsSheetOpen(false);
    setEditingAlertId(null);
  };

  const filtered = alerts.filter(a => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      a.title.toLowerCase().includes(s) ||
      (a.sentBy && a.sentBy.toLowerCase().includes(s)) ||
      a.severity.toLowerCase().includes(s) ||
      a.status.toLowerCase().includes(s)
    );
  });

  const severityColor = (sev: Severity) => {
    switch (sev) {
      case 'Warning': return '#EF4444';
      case 'Watch': return '#F59E0B';
      case 'Advisory': return '#3B82F6';
      case 'Stand Down Safety': return '#DC2626';
      default: return '#6e757c';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - similar to Resources */}
      <div className="sticky top-0 z-10 bg-[#222529] rounded-lg border border-[#6e757c] relative">
        <div className="flex items-center justify-between px-[13px] py-3 w-full border-b-2 border-border rounded-t-lg rounded-b-none">
          <div className="flex items-center gap-4">
            <div className="relative">
              <p className="caption text-nowrap text-white whitespace-pre">Notifications</p>
            </div>
          </div>
          <button
            onClick={openAddAlert}
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
            <p className="caption text-nowrap text-white ml-[21px]">Add Notification</p>
          </button>
        </div>
      </div>

      {/* Active/Historical/Sent Toggle */}
      <div className="mb-4 flex w-fit border border-border bg-[#1a1d21] rounded-md overflow-hidden">
        <button
          type="button"
          onClick={() => setViewMode('active')}
          className={`px-2 text-xs font-medium transition-colors ${
            viewMode === 'active'
              ? 'bg-[#01669f] text-white'
              : 'bg-transparent text-foreground hover:bg-muted/50'
          }`}
          style={{ paddingTop: '2px', paddingBottom: '2px' }}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setViewMode('historical')}
          className={`px-2 text-xs font-medium transition-colors border-l border-border ${
            viewMode === 'historical'
              ? 'bg-[#01669f] text-white'
              : 'bg-transparent text-foreground hover:bg-muted/50'
          }`}
          style={{ paddingTop: '2px', paddingBottom: '2px' }}
        >
          Historical
        </button>
        <button
          type="button"
          onClick={() => setViewMode('sent')}
          className={`px-2 text-xs font-medium transition-colors border-l border-border ${
            viewMode === 'sent'
              ? 'bg-[#01669f] text-white'
              : 'bg-transparent text-foreground hover:bg-muted/50'
          }`}
          style={{ paddingTop: '2px', paddingBottom: '2px' }}
        >
          Sent
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative h-[26px] w-[390px]">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            viewMode === 'active' 
              ? 'Search Active Notifications' 
              : viewMode === 'historical' 
              ? 'Search Historical Notifications' 
              : 'Search Sent Notifications'
          }
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

      {/* Incident and AOR Filters */}
      <div className="mb-4 flex items-center gap-2">
        {/* Incident Filter */}
        <div className="flex-1 px-4 py-3 bg-[#222529] rounded-lg border border-[#6e757c]">
          <div className="flex items-center gap-2">
            <span className="caption text-white whitespace-nowrap">Incident:</span>
            <Popover open={isIncidentPopoverOpen} onOpenChange={setIsIncidentPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="w-[180px] h-[24px] bg-transparent border border-[#6e757c] rounded-[4px] px-2 caption text-white focus:outline-none focus:border-accent cursor-pointer flex items-center justify-between"
                  style={{ 
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '18px'
                  }}
                >
                  {selectedIncidents.length === 0 
                    ? 'All Incidents' 
                    : selectedIncidents.length === 1 
                    ? selectedIncidents[0]
                    : `${selectedIncidents.length} selected`}
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 bg-[#222529] border-[#6e757c]" align="start">
                <Command className="bg-[#222529]">
                  <CommandInput 
                    placeholder="Search incident..." 
                    className="h-9 caption text-white"
                    style={{ 
                      fontFamily: "'Open Sans', sans-serif",
                      fontSize: '12px',
                      fontWeight: 400,
                      lineHeight: '18px'
                    }}
                  />
                  <CommandList>
                    <CommandEmpty className="caption text-white/70 p-2">No incident found.</CommandEmpty>
                    <CommandGroup>
                      {incidents.map((incident) => (
                        <CommandItem
                          key={incident}
                          value={incident}
                          onSelect={() => toggleIncident(incident)}
                          className="caption text-white cursor-pointer hover:bg-[#14171a] data-[selected=true]:bg-[#14171a]"
                          style={{ 
                            fontFamily: "'Open Sans', sans-serif",
                            fontSize: '12px',
                            fontWeight: 400,
                            lineHeight: '18px'
                          }}
                        >
                          <Checkbox
                            checked={selectedIncidents.includes(incident)}
                            className="mr-2 h-3 w-3 border-white data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                          />
                          {incident}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedIncidents.length > 0 && (
              <button
                onClick={clearIncidentFilter}
                className="p-1 hover:bg-muted/30 rounded transition-colors"
                title="Clear filter"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* AOR Filter */}
        <div className="flex-1 px-4 py-3 bg-[#222529] rounded-lg border border-[#6e757c]">
          <div className="flex items-center gap-2">
            <span className="caption text-white whitespace-nowrap">AOR:</span>
            <Popover open={isAORPopoverOpen} onOpenChange={setIsAORPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="w-[180px] h-[24px] bg-transparent border border-[#6e757c] rounded-[4px] px-2 caption text-white focus:outline-none focus:border-accent cursor-pointer flex items-center justify-between"
                  style={{ 
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '18px'
                  }}
                >
                  {selectedAORs.length === 0 
                    ? 'All AORs' 
                    : selectedAORs.length === 1 
                    ? selectedAORs[0]
                    : `${selectedAORs.length} selected`}
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 bg-[#222529] border-[#6e757c]" align="start">
                <Command className="bg-[#222529]">
                  <CommandInput 
                    placeholder="Search AOR..." 
                    className="h-9 caption text-white"
                    style={{ 
                      fontFamily: "'Open Sans', sans-serif",
                      fontSize: '12px',
                      fontWeight: 400,
                      lineHeight: '18px'
                    }}
                  />
                  <CommandList>
                    <CommandEmpty className="caption text-white/70 p-2">No AOR found.</CommandEmpty>
                    <CommandGroup>
                      {aors.map((aor) => (
                        <CommandItem
                          key={aor}
                          value={aor}
                          onSelect={() => toggleAOR(aor)}
                          className="caption text-white cursor-pointer hover:bg-[#14171a] data-[selected=true]:bg-[#14171a]"
                          style={{ 
                            fontFamily: "'Open Sans', sans-serif",
                            fontSize: '12px',
                            fontWeight: 400,
                            lineHeight: '18px'
                          }}
                        >
                          <Checkbox
                            checked={selectedAORs.includes(aor)}
                            className="mr-2 h-3 w-3 border-white data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                          />
                          {aor}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedAORs.length > 0 && (
              <button
                onClick={clearAORFilter}
                className="p-1 hover:bg-muted/30 rounded transition-colors"
                title="Clear filter"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alerts List - similar card layout to Resources */}
      {viewMode === 'active' && (
        <div className="space-y-4">
        
        {/* Incident Alpha Activation Request Notification */}
        {!incidentActivationResponded && <div
          className="border border-border rounded-lg overflow-hidden"
          style={{ background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
        >
          <div className={`p-3 ${expandedAlerts.has('incident-activation-request') ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between">
              <div
                className="flex items-start gap-2 flex-1 cursor-pointer"
                onClick={() => {
                  const id = 'incident-activation-request';
                  setExpandedAlerts(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                  });
                }}
              >
                {expandedAlerts.has('incident-activation-request') ? (
                  <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="caption text-white">Incident Alpha Activation Request</span>
                    <span 
                      className="caption px-2 py-0.5 rounded text-xs"
                      style={{ 
                        backgroundColor: `${getSeverityColor(getNotificationSeverity('incident-activation-request'))}20`,
                        color: getSeverityColor(getNotificationSeverity('incident-activation-request')),
                        border: `1px solid ${getSeverityColor(getNotificationSeverity('incident-activation-request'))}60`
                      }}
                    >
                      {getNotificationSeverity('incident-activation-request')}
                    </span>
                  </div>
                  {!expandedAlerts.has('incident-activation-request') && (
                    <div className="space-y-2 mt-1">
                      <div className="flex items-center gap-3">
                        <span className="caption text-white">District Command</span>
                        <span className="caption text-white">{formatMilitaryTimeUTC(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())}</span>
                      </div>
                      {!incidentActivationAccepted ? (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIncidentActivationAccepted(true);
                              onDataChange({
                                ...data,
                                incidentActivationAccepted: true
                              });
                            }}
                            className="bg-primary hover:bg-primary/90 text-white px-3 h-auto text-xs"
                            style={{ paddingTop: '4px', paddingBottom: '4px' }}
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIncidentActivationResponse({
                                decision: 'declined',
                                submittedAt: new Date().toISOString()
                              });
                              setIncidentActivationResponded(true);
                              onDataChange({
                                ...data,
                                incidentActivationResponded: true,
                                incidentActivationResponse: {
                                  decision: 'declined',
                                  submittedAt: new Date().toISOString()
                                }
                              });
                            }}
                            variant="outline"
                            className="border-border text-white px-3 h-auto text-xs"
                            style={{ paddingTop: '4px', paddingBottom: '4px' }}
                          >
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIncidentActivationResponse({
                              decision: 'accepted',
                              submittedAt: new Date().toISOString()
                            });
                            setIncidentActivationResponded(true);
                            onDataChange({
                              ...data,
                              incidentActivationResponded: true,
                              incidentActivationResponse: {
                                decision: 'accepted',
                                submittedAt: new Date().toISOString()
                              }
                            });
                          }}
                          className="bg-primary hover:bg-primary/90 text-white px-3 h-auto text-xs"
                          style={{ paddingTop: '4px', paddingBottom: '4px' }}
                        >
                          Enter Incident Workspace
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {expandedAlerts.has('incident-activation-request') && (
            <div className="p-4 space-y-4 bg-card/50">
              <div>
                <label className="text-white mb-1 block">Incident Alpha Activation Request</label>
                <p className="caption text-white mb-3">
                  Requested by: District Command at {formatMilitaryTimeUTC(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())}
                </p>
                <p className="caption text-white font-semibold">
                  Your Incident Seat: Situation Unit Leader
                </p>
                <div style={{ height: '1rem' }}></div>
                <p className="caption text-white">
                  District Command is requesting activation of Incident Alpha due to elevated threat assessment in the operational area. Review the request details and respond with Accept or Decline.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!incidentActivationAccepted ? (
                  <>
                    <Button
                      onClick={() => {
                        setIncidentActivationAccepted(true);
                        onDataChange({
                          ...data,
                          incidentActivationAccepted: true
                        });
                      }}
                      className="bg-primary hover:bg-primary/90 text-white px-4 h-auto text-xs"
                      style={{ paddingTop: '6px', paddingBottom: '6px' }}
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => {
                        setIncidentActivationResponse({
                          decision: 'declined',
                          submittedAt: new Date().toISOString()
                        });
                        setIncidentActivationResponded(true);
                        onDataChange({
                          ...data,
                          incidentActivationResponded: true,
                          incidentActivationResponse: {
                            decision: 'declined',
                            submittedAt: new Date().toISOString()
                          }
                        });
                      }}
                      variant="outline"
                      className="border-border text-white px-4 h-auto text-xs"
                      style={{ paddingTop: '6px', paddingBottom: '6px' }}
                    >
                      Decline
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      setIncidentActivationResponse({
                        decision: 'accepted',
                        submittedAt: new Date().toISOString()
                      });
                      setIncidentActivationResponded(true);
                      onDataChange({
                        ...data,
                        incidentActivationResponded: true,
                        incidentActivationResponse: {
                          decision: 'accepted',
                          submittedAt: new Date().toISOString()
                        }
                      });
                    }}
                    className="bg-primary hover:bg-primary/90 text-white px-4 h-auto text-xs"
                    style={{ paddingTop: '6px', paddingBottom: '6px' }}
                  >
                    Enter Incident Workspace
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>}
        
        {/* Boom Data Layer Review Notification - Only show if not archived */}
        {!boomDataLayerArchived && <div
          className="border border-border rounded-lg overflow-hidden"
          style={{ background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
        >
          <div className={`p-3 ${expandedAlerts.has('boom-data-layer-review') ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between">
              <div
                className="flex items-start gap-2 flex-1 cursor-pointer"
                onClick={() => {
                  const id = 'boom-data-layer-review';
                  setExpandedAlerts(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                  });
                }}
              >
                {expandedAlerts.has('boom-data-layer-review') ? (
                  <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="caption text-white">Review Requested of Update to Incident Alpha: Boom Data Layer</span>
                    <span 
                      className="caption px-2 py-0.5 rounded text-xs"
                      style={{ 
                        backgroundColor: `${getSeverityColor(getNotificationSeverity('boom-data-layer-review'))}20`,
                        color: getSeverityColor(getNotificationSeverity('boom-data-layer-review')),
                        border: `1px solid ${getSeverityColor(getNotificationSeverity('boom-data-layer-review'))}60`
                      }}
                    >
                      {getNotificationSeverity('boom-data-layer-review')}
                    </span>
                  </div>
                  {!expandedAlerts.has('boom-data-layer-review') && (
                    <div className="space-y-2 mt-1">
                      <div className="flex items-center gap-3">
                        <span className="caption text-white">M. Rodriguez</span>
                        <span className="caption text-white">{formatMilitaryTimeUTC(new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())}</span>
                      </div>
                      {!boomDataLayerReviewed ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAlerts(prev => new Set(prev).add('boom-data-layer-review'));
                          }}
                          className="bg-primary hover:bg-primary/90 text-white px-3 h-auto text-xs"
                          style={{ paddingTop: '4px', paddingBottom: '4px' }}
                        >
                          Review Update
                        </Button>
                      ) : (
                        <p className="caption text-white">
                          Review submitted at {formatDateDisplay(boomDataLayerReviewData.submittedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBoomDataLayerArchived(true);
                  onDataChange({
                    ...data,
                    boomDataLayerArchived: true
                  });
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {expandedAlerts.has('boom-data-layer-review') && (
            <div className="p-4 space-y-4 bg-card/50">
              {!boomDataLayerReviewed ? (
                <>
                  <div>
                    <label className="text-white mb-1 block">Incident Alpha Boom Data Layer Update</label>
                    <p className="caption text-white mb-3">
                      Submitted by: M. Rodriguez at {formatMilitaryTimeUTC(new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())}
                    </p>
                    <Button
                      onClick={() => {
                        console.log('Preview Proposed Data Layer clicked');
                        // Placeholder for functionality
                      }}
                      className="bg-primary hover:bg-primary/90 text-white px-4 h-auto text-xs"
                      style={{ paddingTop: '6px', paddingBottom: '6px', marginTop: '8px' }}
                    >
                      Preview Proposed Data Layer
                    </Button>
                    
                    {/* Legend Section */}
                    <div className="mt-4">
                      <label className="text-white mb-2 block text-xs">Legend</label>
                      <div className="flex items-center gap-3">
                        <span className="caption text-white">Proposed Boom</span>
                        <div 
                          style={{ 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '50%', 
                            backgroundColor: '#ef4444',
                            zIndex: 9999,
                            position: 'relative',
                            border: '3px solid rgba(255, 255, 255, 0.5)',
                            flexShrink: 0
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-white mb-2 block">Decision</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setBoomDataLayerReviewData({ ...boomDataLayerReviewData, decision: 'approve' })}
                          className={`px-4 py-2 rounded border transition-colors ${
                            boomDataLayerReviewData.decision === 'approve'
                              ? 'bg-accent/20 border-accent text-accent'
                              : 'border-border text-white hover:bg-muted/20'
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setBoomDataLayerReviewData({ ...boomDataLayerReviewData, decision: 'deny' })}
                          className={`px-4 py-2 rounded border transition-colors ${
                            boomDataLayerReviewData.decision === 'deny'
                              ? 'bg-accent/20 border-accent text-accent'
                              : 'border-border text-white hover:bg-muted/20'
                          }`}
                        >
                          Deny
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-white mb-2 block">Comments to Submitter</label>
                      <Textarea
                        value={boomDataLayerReviewData.comments}
                        onChange={(e) => setBoomDataLayerReviewData({ ...boomDataLayerReviewData, comments: e.target.value })}
                        placeholder="Enter feedback or additional requirements..."
                        rows={4}
                        className="bg-input-background border-border resize-none text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => {
                        if (boomDataLayerReviewData.decision) {
                          const submittedData = {
                            ...boomDataLayerReviewData,
                            submittedAt: new Date().toISOString()
                          };
                          setBoomDataLayerReviewData(submittedData);
                          setBoomDataLayerReviewed(true);
                          onDataChange({ 
                            ...data, 
                            boomDataLayerReviewed: true,
                            boomDataLayerReviewData: submittedData
                          });
                          // Auto-collapse after submission
                          setExpandedAlerts(prev => {
                            const next = new Set(prev);
                            next.delete('boom-data-layer-review');
                            return next;
                          });
                        }
                      }}
                      disabled={!boomDataLayerReviewData.decision}
                      className="bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Review
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-white mb-1 block">Review Submitted</label>
                    <p className="caption text-white">
                      You {boomDataLayerReviewData.decision === 'approve' ? 'approved' : 'denied'} this update at {formatDateDisplay(boomDataLayerReviewData.submittedAt)}.
                    </p>
                  </div>
                  {boomDataLayerReviewData.comments && (
                    <div>
                      <label className="text-white mb-1 block">Your Comments</label>
                      <p className="caption text-white">{boomDataLayerReviewData.comments}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>}
        
        {/* Safety Check Form Notification - Only show if not archived */}
        {!safetyCheckArchived && <div
          className="border border-border rounded-lg overflow-hidden"
          style={{ background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
        >
          <div className={`p-3 ${expandedAlerts.has('safety-check-form') ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between">
              <div
                className="flex items-start gap-2 flex-1 cursor-pointer"
                onClick={() => {
                  if (!safetyFormSubmitted) {
                    const id = 'safety-check-form';
                    setExpandedAlerts(prev => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id); else next.add(id);
                      return next;
                    });
                  }
                }}
              >
                {expandedAlerts.has('safety-check-form') ? (
                  <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="caption text-white">Safety Check - Personnel Status Report</span>
                    <span 
                      className="caption px-2 py-0.5 rounded text-xs"
                      style={{ 
                        backgroundColor: `${getSeverityColor(getNotificationSeverity('safety-check-form'))}20`,
                        color: getSeverityColor(getNotificationSeverity('safety-check-form')),
                        border: `1px solid ${getSeverityColor(getNotificationSeverity('safety-check-form'))}60`
                      }}
                    >
                      {getNotificationSeverity('safety-check-form')}
                    </span>
                  </div>
                  {!expandedAlerts.has('safety-check-form') && (
                    <div className="space-y-2 mt-1">
                      <div className="flex items-center gap-3">
                        <span className="caption text-white">System</span>
                        <span className="caption text-white">{formatMilitaryTimeUTC(new Date().toISOString())}</span>
                      </div>
                      {!safetyFormSubmitted ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAlerts(prev => new Set(prev).add('safety-check-form'));
                          }}
                          className="bg-primary hover:bg-primary/90 text-white px-3 h-auto text-xs"
                          style={{ paddingTop: '4px', paddingBottom: '4px' }}
                        >
                          Complete Form
                        </Button>
                      ) : (
                        <p className="caption text-white">
                          Status submitted at {formatDateDisplay(safetyFormData.submittedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Edit functionality placeholder
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                  title="Edit notification"
                >
                  <Edit2 className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSafetyCheckArchiveModalOpen(true);
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                  title="Archive for all users"
                >
                  <ArrowRightToLine className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {expandedAlerts.has('safety-check-form') && (
            <div className="p-4 space-y-4 bg-card/50">
              {!safetyFormSubmitted ? (
                <>
                  <div>
                    <label className="text-white mb-1 block">Description</label>
                    <p className="caption text-white">
                      Please complete this safety status form to confirm your current condition and location.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-white mb-2 block">Are you safe?</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSafetyFormData({ ...safetyFormData, isSafe: 'yes' })}
                          className={`px-4 py-2 rounded border transition-colors ${
                            safetyFormData.isSafe === 'yes'
                              ? 'bg-green-500/20 border-green-500 text-green-500'
                              : 'border-border text-white hover:bg-muted/20'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setSafetyFormData({ ...safetyFormData, isSafe: 'no' })}
                          className={`px-4 py-2 rounded border transition-colors ${
                            safetyFormData.isSafe === 'no'
                              ? 'bg-red-500/20 border-red-500 text-red-500'
                              : 'border-border text-white hover:bg-muted/20'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-white mb-2 block">Do you have any comments?</label>
                      <Textarea
                        value={safetyFormData.comments}
                        onChange={(e) => setSafetyFormData({ ...safetyFormData, comments: e.target.value })}
                        placeholder="Enter any additional comments or information..."
                        rows={4}
                        className="bg-input-background border-border resize-none text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => {
                        if (safetyFormData.isSafe) {
                          const submittedData = {
                            ...safetyFormData,
                            submittedAt: new Date().toISOString()
                          };
                          setSafetyFormData(submittedData);
                          setSafetyFormSubmitted(true);
                          onDataChange({ 
                            ...data, 
                            safetyFormSubmitted: true,
                            safetyFormData: submittedData
                          });
                          // Auto-collapse after submission
                          setExpandedAlerts(prev => {
                            const next = new Set(prev);
                            next.delete('safety-check-form');
                            return next;
                          });
                        }
                      }}
                      disabled={!safetyFormData.isSafe}
                      className="bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-white mb-1 block">Form Submitted</label>
                    <p className="caption text-white">
                      Thank you for completing the safety status form.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white mb-1 block">Status</label>
                      <p className="caption text-white capitalize">{safetyFormData.isSafe === 'yes' ? 'Safe' : 'Unsafe'}</p>
                    </div>
                    <div>
                      <label className="text-white mb-1 block">Submitted</label>
                      <p className="caption text-white">{formatDateDisplay(safetyFormData.submittedAt)}</p>
                    </div>
                  </div>

                  {safetyFormData.comments && (
                    <div>
                      <label className="text-white mb-1 block">Comments</label>
                      <p className="caption text-white">{safetyFormData.comments}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>}
        

        {/* SITREP Review Notification - Only show if not archived */}
        {!sitrepArchived && <div
          className="border border-border rounded-lg overflow-hidden"
          style={{ background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
        >
          <div className={`p-3 ${expandedAlerts.has('sitrep-review') ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between">
              <div
                className="flex items-start gap-2 flex-1 cursor-pointer"
                onClick={() => {
                  const id = 'sitrep-review';
                  setExpandedAlerts(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                  });
                }}
              >
                {expandedAlerts.has('sitrep-review') ? (
                  <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="caption text-white">Review Requested of SITREP for District East</span>
                    <span 
                      className="caption px-2 py-0.5 rounded text-xs"
                      style={{ 
                        backgroundColor: `${getSeverityColor(getNotificationSeverity('sitrep-review'))}20`,
                        color: getSeverityColor(getNotificationSeverity('sitrep-review')),
                        border: `1px solid ${getSeverityColor(getNotificationSeverity('sitrep-review'))}60`
                      }}
                    >
                      {getNotificationSeverity('sitrep-review')}
                    </span>
                  </div>
                  {!expandedAlerts.has('sitrep-review') && (
                    <div className="space-y-2 mt-1">
                      <div className="flex items-center gap-3">
                        <span className="caption text-white">J. Smith</span>
                        <span className="caption text-white">{formatMilitaryTimeUTC(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())}</span>
                      </div>
                      {!sitrepReviewed ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAlerts(prev => new Set(prev).add('sitrep-review'));
                          }}
                          className="bg-primary hover:bg-primary/90 text-white px-3 h-auto text-xs"
                          style={{ paddingTop: '4px', paddingBottom: '4px' }}
                        >
                          Review Draft SITREP
                        </Button>
                      ) : (
                        <p className="caption text-white">
                          Review submitted at {formatDateDisplay(sitrepReviewData.submittedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSitrepArchived(true);
                  onDataChange({
                    ...data,
                    sitrepArchived: true
                  });
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {expandedAlerts.has('sitrep-review') && (
            <div className="p-4 space-y-4 bg-card/50">
              {!sitrepReviewed ? (
                <>
                  <div>
                    <label className="text-white mb-1 block">District East SITREP</label>
                    <p className="caption text-white mb-3">
                      Drafted by: J. Smith at {formatMilitaryTimeUTC(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())}
                    </p>
                    <div className="bg-input-background border border-border rounded p-3 max-h-[200px] overflow-y-auto" style={{ marginTop: '13px' }}>
                      <pre className="caption text-white whitespace-pre-wrap font-sans break-words">
                        {draftSitrepContent}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-white mb-2 block">Decision</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSitrepReviewData({ ...sitrepReviewData, decision: 'approve' })}
                          className={`px-4 py-2 rounded border transition-colors ${
                            sitrepReviewData.decision === 'approve'
                              ? 'bg-accent/20 border-accent text-accent'
                              : 'border-border text-white hover:bg-muted/20'
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSitrepReviewData({ ...sitrepReviewData, decision: 'deny' })}
                          className={`px-4 py-2 rounded border transition-colors ${
                            sitrepReviewData.decision === 'deny'
                              ? 'bg-accent/20 border-accent text-accent'
                              : 'border-border text-white hover:bg-muted/20'
                          }`}
                        >
                          Deny
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-white mb-2 block">Comments to Author</label>
                      <Textarea
                        value={sitrepReviewData.comments}
                        onChange={(e) => setSitrepReviewData({ ...sitrepReviewData, comments: e.target.value })}
                        placeholder="Enter feedback or revision requests..."
                        rows={4}
                        className="bg-input-background border-border resize-none text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => {
                        if (sitrepReviewData.decision) {
                          const submittedData = {
                            ...sitrepReviewData,
                            submittedAt: new Date().toISOString()
                          };
                          setSitrepReviewData(submittedData);
                          setSitrepReviewed(true);
                          onDataChange({ 
                            ...data, 
                            sitrepReviewed: true,
                            sitrepReviewData: submittedData
                          });
                          // Auto-collapse after submission
                          setExpandedAlerts(prev => {
                            const next = new Set(prev);
                            next.delete('sitrep-review');
                            return next;
                          });
                        }
                      }}
                      disabled={!sitrepReviewData.decision}
                      className="bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Review
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-white mb-1 block">Review Submitted</label>
                    <p className="caption text-white">
                      Your review decision has been submitted and sent to J. Smith.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white mb-1 block text-xs">Decision</label>
                      <p className="caption text-sm text-accent">
                        {sitrepReviewData.decision === 'approve' ? 'Approved' : 'Denied'}
                      </p>
                    </div>
                    <div>
                      <label className="text-white mb-1 block text-xs">Submitted At</label>
                      <p className="caption text-white text-sm">{formatDateDisplay(sitrepReviewData.submittedAt)}</p>
                    </div>
                  </div>
                  {sitrepReviewData.comments && (
                    <div>
                      <label className="text-white mb-1 block text-xs">Comments</label>
                      <p className="caption text-white text-sm">{sitrepReviewData.comments}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>}
        {/* Acknowledgement Receipt Notification */}
        <div
          className="border border-border rounded-lg overflow-hidden"
          style={{ background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
        >
          <div className={`p-3 ${expandedAlerts.has('acknowledgement-receipt') ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between">
              <div
                className="flex items-start gap-2 flex-1 cursor-pointer"
                onClick={() => {
                  const id = 'acknowledgement-receipt';
                  setExpandedAlerts(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                  });
                }}
              >
                {expandedAlerts.has('acknowledgement-receipt') ? (
                  <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="caption text-white">Acknowledgement Required - Incident Briefing Review</span>
                    <span 
                      className="caption px-2 py-0.5 rounded text-xs"
                      style={{ 
                        backgroundColor: `${getSeverityColor(getNotificationSeverity('acknowledgement-receipt'))}20`,
                        color: getSeverityColor(getNotificationSeverity('acknowledgement-receipt')),
                        border: `1px solid ${getSeverityColor(getNotificationSeverity('acknowledgement-receipt'))}60`
                      }}
                    >
                      {getNotificationSeverity('acknowledgement-receipt')}
                    </span>
                  </div>
                  {!expandedAlerts.has('acknowledgement-receipt') && (
                    <div className="space-y-2 mt-1">
                      <div className="flex items-center gap-3">
                        <span className="caption text-white">System</span>
                        <span className="caption text-white">{formatMilitaryTimeUTC(new Date().toISOString())}</span>
                      </div>
                      {!acknowledgedTimestamp ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            const timestamp = new Date().toISOString();
                            setAcknowledgedTimestamp(timestamp);
                            onDataChange({ ...data, acknowledgedTimestamp: timestamp });
                          }}
                          className="bg-primary hover:bg-primary/90 text-white px-3 h-auto text-xs"
                          style={{ paddingTop: '4px', paddingBottom: '4px' }}
                        >
                          Acknowledge Receipt
                        </Button>
                      ) : (
                        <p className="caption text-white">
                          User acknowledged at {formatDateDisplay(acknowledgedTimestamp)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {expandedAlerts.has('acknowledgement-receipt') && (
            <div className="p-4 space-y-4 bg-card/50">
              <div>
                <label className="text-white mb-1 block">Description</label>
                <p className="caption text-white">
                  Please acknowledge receipt of the incident briefing documentation and confirm your review of all operational procedures.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white mb-1 block">Severity</label>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                    <span className="caption text-white">Info</span>
                  </div>
                </div>
                <div>
                  <label className="text-white mb-1 block">Status</label>
                  <p className="caption text-white">{acknowledgedTimestamp ? 'Acknowledged' : 'Pending'}</p>
                </div>
              </div>

              {!acknowledgedTimestamp ? (
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => {
                      const timestamp = new Date().toISOString();
                      setAcknowledgedTimestamp(timestamp);
                      onDataChange({ ...data, acknowledgedTimestamp: timestamp });
                    }}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Acknowledge Receipt
                  </Button>
                </div>
              ) : (
                <div className="pt-2">
                  <p className="caption text-white">
                    User acknowledged at {formatDateDisplay(acknowledgedTimestamp)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {filtered.map((a) => {
          const isExpanded = expandedAlerts.has(a.id);
          return (
            <div
              key={a.id}
              className="border border-border rounded-lg overflow-hidden"
              style={{ background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
            >
              <div className={`p-3 ${isExpanded ? 'border-b border-border' : ''}`}>
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-start gap-2 flex-1 cursor-pointer"
                    onClick={() => {
                      toggleAlert(a.id);
                      if (onAddAIContext) {
                        onAddAIContext(a.title);
                      }
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className="caption text-white">{a.title}</span>
                      {!isExpanded && (
                        <div className="flex items-center gap-3 mt-1">
                          <span className="caption text-white">{a.sentBy}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColor(a.severity) }} />
                            <span className="caption" style={{ color: severityColor(a.severity) }}>{a.severity}</span>
                          </div>
                          <span className="caption text-white">{formatMilitaryTimeUTC(a.timeSent)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Zoom to alert location
                        if (onZoomToLocation) {
                          const coords = getAlertCoordinates(a.id);
                          onZoomToLocation(coords.center, coords.scale);
                        }
                      }}
                      className="p-1 hover:bg-muted/30 rounded transition-colors"
                      title="Zoom to alert location"
                    >
                      <Map className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-4 bg-card/50">
                  {a.description && (
                    <div>
                      <label className="text-white mb-1 block">Description</label>
                      <p className="caption text-white">{a.description}</p>
                    </div>
                  )}
                  
                  {/* Recipients section */}
                  {a.recipients && a.recipients.length > 0 && (
                    <div>
                      <label className="text-white mb-1 block">Recipients</label>
                      <div className="flex flex-wrap gap-2">
                        {a.recipients.map((recipient) => (
                          <span 
                            key={recipient}
                            className="caption text-white bg-accent/20 px-2 py-1 rounded text-xs"
                          >
                            {recipient}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scheduled time */}
                  {a.scheduledTime && (
                    <div>
                      <label className="text-white mb-1 block">Scheduled Send Time</label>
                      <p className="caption text-white">{formatDateDisplay(a.scheduledTime)}</p>
                    </div>
                  )}

                  {/* Channels */}
                  {a.channels && a.channels.length > 0 && (
                    <div>
                      <label className="text-white mb-1 block">Communication Channels</label>
                      <div className="flex flex-wrap gap-2">
                        {a.channels.map((channelId) => {
                          const channel = communicationChannels.find(c => c.id === channelId);
                          return channel ? (
                            <span 
                              key={channelId}
                              className="caption text-white bg-primary/20 px-2 py-1 rounded text-xs"
                            >
                              {channel.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white mb-1 block">Severity</label>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColor(a.severity) }} />
                        <span className="caption text-white">{a.severity}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-white mb-1 block">Expires</label>
                      <p className="caption text-white">{formatDateDisplay(a.expiresAt)}</p>
                    </div>
                    <div>
                      <label className="text-white mb-1 block">Status</label>
                      <p className="caption text-white">{a.status}</p>
                    </div>
                    {a.location && (
                      <div>
                        <label className="text-white mb-1 block">Location</label>
                        <p className="caption text-white">{a.location}</p>
                      </div>
                    )}
                    {a.timeSent && (
                      <div>
                        <label className="text-white mb-1 block">Time Sent</label>
                        <p className="caption text-white">{formatDateDisplay(a.timeSent)}</p>
                      </div>
                    )}
                    {a.sentBy && (
                      <div>
                        <label className="text-white mb-1 block">Sent By</label>
                        <p className="caption text-white">{a.sentBy}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Historical Notifications View */}
      {viewMode === 'historical' && (
        <div className="space-y-4">
          {/* Boom Data Layer Review Notification - Only show if archived */}
          {boomDataLayerArchived && <div
            className="border border-border rounded-lg overflow-hidden"
            style={{ background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
          >
            <div className={`p-3 ${expandedAlerts.has('boom-data-layer-review-historical') ? 'border-b border-border' : ''}`}>
              <div className="flex items-start justify-between">
                <div
                  className="flex items-start gap-2 flex-1 cursor-pointer"
                  onClick={() => {
                    const id = 'boom-data-layer-review-historical';
                    setExpandedAlerts(prev => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id); else next.add(id);
                      return next;
                    });
                  }}
                >
                  {expandedAlerts.has('boom-data-layer-review-historical') ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="caption text-white">Review Requested of Update to Incident Alpha: Boom Data Layer</span>
                    {!expandedAlerts.has('boom-data-layer-review-historical') && (
                      <div className="space-y-2 mt-1">
                        <div className="flex items-center gap-3">
                          <span className="caption text-white">M. Rodriguez</span>
                          <span className="caption text-white">{formatMilitaryTimeUTC(new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())}</span>
                        </div>
                        <p className="caption text-white">
                          Review submitted at {formatDateDisplay(boomDataLayerReviewData.submittedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {expandedAlerts.has('boom-data-layer-review-historical') && (
              <div className="p-4 space-y-4 bg-card/50">
                <div>
                  <label className="text-white mb-1 block">Review Submitted</label>
                  <p className="caption text-white">
                    You {boomDataLayerReviewData.decision === 'approve' ? 'approved' : 'denied'} this update at {formatDateDisplay(boomDataLayerReviewData.submittedAt)}.
                  </p>
                </div>
                {boomDataLayerReviewData.comments && (
                  <div>
                    <label className="text-white mb-1 block">Your Comments</label>
                    <p className="caption text-white">{boomDataLayerReviewData.comments}</p>
                  </div>
                )}
                <div>
                  <label className="text-white mb-1 block">Incident Alpha Boom Data Layer Update</label>
                  <p className="caption text-white mb-3">
                    Submitted by: M. Rodriguez at {formatMilitaryTimeUTC(new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())}
                  </p>
                </div>
              </div>
            )}
          </div>}

          {/* SITREP Review Notification - Only show if archived */}
          {sitrepArchived && <div
            className="border border-border rounded-lg overflow-hidden"
            style={{ background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
          >
            <div className={`p-3 ${expandedAlerts.has('sitrep-review-historical') ? 'border-b border-border' : ''}`}>
              <div className="flex items-start justify-between">
                <div
                  className="flex items-start gap-2 flex-1 cursor-pointer"
                  onClick={() => {
                    const id = 'sitrep-review-historical';
                    setExpandedAlerts(prev => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id); else next.add(id);
                      return next;
                    });
                  }}
                >
                  {expandedAlerts.has('sitrep-review-historical') ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="caption text-white">Review Requested of SITREP for District East</span>
                    {!expandedAlerts.has('sitrep-review-historical') && (
                      <div className="space-y-2 mt-1">
                        <div className="flex items-center gap-3">
                          <span className="caption text-white">J. Smith</span>
                          <span className="caption text-white">{formatMilitaryTimeUTC(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())}</span>
                        </div>
                        {sitrepReviewed && (
                          <p className="caption text-white">
                            Review submitted at {formatDateDisplay(sitrepReviewData.submittedAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {expandedAlerts.has('sitrep-review-historical') && (
              <div className="p-4 space-y-4 bg-card/50">
                {sitrepReviewed ? (
                  <>
                    <div>
                      <label className="text-white mb-1 block">Review Submitted</label>
                      <p className="caption text-white">
                        Your review decision has been submitted and sent to J. Smith.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white mb-1 block text-xs">Decision</label>
                        <p className="caption text-sm text-accent">
                          {sitrepReviewData.decision === 'approve' ? 'Approved' : 'Denied'}
                        </p>
                      </div>
                      <div>
                        <label className="text-white mb-1 block text-xs">Submitted At</label>
                        <p className="caption text-white text-sm">{formatDateDisplay(sitrepReviewData.submittedAt)}</p>
                      </div>
                    </div>
                    {sitrepReviewData.comments && (
                      <div>
                        <label className="text-white mb-1 block text-xs">Comments</label>
                        <p className="caption text-white text-sm">{sitrepReviewData.comments}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <label className="text-white mb-1 block">District East SITREP</label>
                    <p className="caption text-white mb-3">
                      Drafted by: J. Smith at {formatMilitaryTimeUTC(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())}
                    </p>
                    <div className="bg-input-background border border-border rounded p-3" style={{ marginTop: '13px' }}>
                      <p className="caption text-white whitespace-pre-wrap">
                        {draftSitrepContent}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>}

          {/* Safety Check Notification - Only show if archived */}
          {safetyCheckArchived && <div
            className="border border-border rounded-lg overflow-hidden"
            style={{ background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
          >
            <div className={`p-3 ${expandedAlerts.has('safety-check-historical') ? 'border-b border-border' : ''}`}>
              <div className="flex items-start justify-between">
                <div
                  className="flex items-start gap-2 flex-1 cursor-pointer"
                  onClick={() => {
                    const id = 'safety-check-historical';
                    setExpandedAlerts(prev => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id); else next.add(id);
                      return next;
                    });
                  }}
                >
                  {expandedAlerts.has('safety-check-historical') ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="caption text-white">Safety Check - Personnel Status Report</span>
                    {!expandedAlerts.has('safety-check-historical') && (
                      <div className="space-y-2 mt-1">
                        <div className="flex items-center gap-3">
                          <span className="caption text-white">System</span>
                          <span className="caption text-white">{formatMilitaryTimeUTC(new Date().toISOString())}</span>
                        </div>
                        <p className="caption text-white">
                          Archived for all users
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {expandedAlerts.has('safety-check-historical') && (
              <div className="p-4 space-y-4 bg-card/50">
                <div>
                  <label className="text-white mb-1 block">Notification Archived</label>
                  <p className="caption text-white">
                    This notification has been archived for all users and is no longer visible in Active notifications.
                  </p>
                </div>
                {safetyFormSubmitted && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-white mb-1 block">Status</label>
                        <p className="caption text-white capitalize">{safetyFormData.isSafe === 'yes' ? 'Safe' : 'Unsafe'}</p>
                      </div>
                      <div>
                        <label className="text-white mb-1 block">Submitted</label>
                        <p className="caption text-white">{formatDateDisplay(safetyFormData.submittedAt)}</p>
                      </div>
                    </div>
                    {safetyFormData.comments && (
                      <div>
                        <label className="text-white mb-1 block">Comments</label>
                        <p className="caption text-white">{safetyFormData.comments}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>}
        </div>
      )}

      {/* Sent Notifications View */}
      {viewMode === 'sent' && (
        <div className="space-y-4">
          {/* Safety Assessment Notification */}
          <div
            className="border border-border rounded-lg overflow-hidden"
            style={{ background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
          >
            <div className={`p-3 ${expandedAlerts.has('sent-safety-assessment') ? 'border-b border-border' : ''}`}>
              <div className="flex items-start justify-between">
                <div
                  className="flex items-start gap-2 flex-1 cursor-pointer"
                  onClick={() => {
                    const id = 'sent-safety-assessment';
                    setExpandedAlerts(prev => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id); else next.add(id);
                      return next;
                    });
                  }}
                >
                  {expandedAlerts.has('sent-safety-assessment') ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="caption text-white font-semibold">Safety Assessment - Personnel Status Check</span>
                    {!expandedAlerts.has('sent-safety-assessment') && (
                      <div className="space-y-2 mt-1">
                        <div className="flex items-center gap-3">
                          <span className="caption text-white">Sent: {formatMilitaryTimeUTC(new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="caption text-white font-semibold">38</span>
                            <span className="caption text-white">acknowledged</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="caption text-white font-semibold">35</span>
                            <span className="caption text-white">submitted</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {expandedAlerts.has('sent-safety-assessment') && (
              <div className="p-4 space-y-4 bg-card/50">
                <div>
                  <label className="text-white mb-1 block">Message</label>
                  <p className="caption text-white">
                    Please complete this safety status form to confirm your current condition and location.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white mb-1 block">Acknowledged</label>
                    <p className="caption text-white text-lg font-semibold">38 / 45</p>
                    <p className="caption text-white text-xs">84% acknowledged</p>
                  </div>
                  <div>
                    <label className="text-white mb-1 block">Submitted</label>
                    <p className="caption text-white text-lg font-semibold">35 / 45</p>
                    <p className="caption text-white text-xs">78% submitted</p>
                  </div>
                </div>

                <div>
                  <label className="text-white mb-2 block">Form Submissions Summary</label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 p-3 bg-background rounded border border-border">
                      <div>
                        <p className="caption text-white mb-1">Safe</p>
                        <p className="caption text-white text-lg font-semibold">32 responses</p>
                      </div>
                      <div>
                        <p className="caption text-white mb-1">Unsafe</p>
                        <p className="caption text-white text-lg font-semibold">3 responses</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="caption text-white mb-2">Submissions Log</p>
                      <input
                        type="text"
                        placeholder="Search submissions..."
                        className="w-48 h-6 bg-transparent border border-[#6e757c] rounded px-2 caption text-white placeholder:text-[#6e757c] focus:outline-none focus:border-accent mb-2"
                      />
                      <div className="space-y-2">
                        <div className="p-2 bg-background rounded border border-border">
                          <p className="caption text-white text-xs">
                            "All clear at Station 3. Equipment secured and personnel accounted for."
                          </p>
                          <p className="caption text-white text-xs mt-1">- J. Martinez</p>
                        </div>
                        <div className="p-2 bg-background rounded border border-border">
                          <p className="caption text-white text-xs">
                            "Minor equipment damage in storage area, no injuries. Photos attached."
                          </p>
                          <p className="caption text-white text-xs mt-1">- S. Johnson</p>
                        </div>
                        <div className="p-2 bg-background rounded border border-border">
                          <p className="caption text-white text-xs">
                            "Evacuated to safe zone. All team members present and safe."
                          </p>
                          <p className="caption text-white text-xs mt-1">- M. Rodriguez</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Incident Briefing Acknowledgement */}
          <div
            className="border border-border rounded-lg overflow-hidden"
            style={{ background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
          >
            <div className={`p-3 ${expandedAlerts.has('sent-incident-briefing') ? 'border-b border-border' : ''}`}>
              <div className="flex items-start justify-between">
                <div
                  className="flex items-start gap-2 flex-1 cursor-pointer"
                  onClick={() => {
                    const id = 'sent-incident-briefing';
                    setExpandedAlerts(prev => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id); else next.add(id);
                      return next;
                    });
                  }}
                >
                  {expandedAlerts.has('sent-incident-briefing') ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="caption text-white font-semibold">Incident Briefing - ICS-201 Review Required</span>
                    {!expandedAlerts.has('sent-incident-briefing') && (
                      <div className="space-y-2 mt-1">
                        <div className="flex items-center gap-3">
                          <span className="caption text-white">Sent: {formatMilitaryTimeUTC(new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString())}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="caption text-white font-semibold">25</span>
                            <span className="caption text-white">acknowledged</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {expandedAlerts.has('sent-incident-briefing') && (
              <div className="p-4 space-y-4 bg-card/50">
                <div>
                  <label className="text-white mb-1 block">Message</label>
                  <p className="caption text-white">
                    Please review and acknowledge receipt of the ICS-201 Incident Briefing documentation.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-white mb-1 block">Acknowledged</label>
                    <p className="caption text-white text-lg font-semibold">25 / 30</p>
                    <p className="caption text-white text-xs">83% acknowledged</p>
                  </div>
                </div>

                <div>
                  <p className="caption text-white mb-2">Submissions Log</p>
                  <input
                    type="text"
                    placeholder="Search submissions..."
                    className="w-48 h-6 bg-transparent border border-[#6e757c] rounded px-2 caption text-white placeholder:text-[#6e757c] focus:outline-none focus:border-accent mb-2"
                  />
                  <div className="space-y-2">
                    <div className="p-2 bg-background rounded border border-border flex justify-between items-center">
                      <span className="caption text-white text-xs">First acknowledgement</span>
                      <span className="caption text-white text-xs">2 minutes after sent</span>
                    </div>
                    <div className="p-2 bg-background rounded border border-border flex justify-between items-center">
                      <span className="caption text-white text-xs">Last acknowledgement</span>
                      <span className="caption text-white text-xs">45 minutes after sent</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Emergency Stand Down */}
          <div
            className="border border-border rounded-lg overflow-hidden"
            style={{ background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
          >
            <div className={`p-3 ${expandedAlerts.has('sent-emergency-standdown') ? 'border-b border-border' : ''}`}>
              <div className="flex items-start justify-between">
                <div
                  className="flex items-start gap-2 flex-1 cursor-pointer"
                  onClick={() => {
                    const id = 'sent-emergency-standdown';
                    setExpandedAlerts(prev => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id); else next.add(id);
                      return next;
                    });
                  }}
                >
                  {expandedAlerts.has('sent-emergency-standdown') ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="caption text-white font-semibold">Emergency Stand Down - Immediate Action Required</span>
                    {!expandedAlerts.has('sent-emergency-standdown') && (
                      <div className="space-y-2 mt-1">
                        <div className="flex items-center gap-3">
                          <span className="caption text-white">Sent: {formatMilitaryTimeUTC(new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString())}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="caption text-red-500">Stand Down Safety</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="caption text-white font-semibold">45</span>
                            <span className="caption text-white">acknowledged</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {expandedAlerts.has('sent-emergency-standdown') && (
              <div className="p-4 space-y-4 bg-card/50">
                <div>
                  <label className="text-white mb-1 block">Message</label>
                  <p className="caption text-white">
                    IMMEDIATE STAND DOWN. All personnel cease current operations and report to designated safe areas. This is not a drill.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-white mb-1 block">Acknowledged</label>
                    <p className="caption text-white text-lg font-semibold">45 / 45</p>
                    <p className="caption text-green-500 text-xs">100% acknowledged</p>
                  </div>
                </div>

                <div>
                  <p className="caption text-white mb-2">Submissions Log</p>
                  <input
                    type="text"
                    placeholder="Search submissions..."
                    className="w-48 h-6 bg-transparent border border-[#6e757c] rounded px-2 caption text-white placeholder:text-[#6e757c] focus:outline-none focus:border-accent mb-2"
                  />
                  <div className="space-y-2">
                    <div className="p-2 bg-background rounded border border-border flex justify-between items-center">
                      <span className="caption text-white text-xs">Average acknowledgement time</span>
                      <span className="caption text-green-500 text-xs font-semibold">47 seconds</span>
                    </div>
                    <div className="p-2 bg-background rounded border border-border flex justify-between items-center">
                      <span className="caption text-white text-xs">Fastest acknowledgement</span>
                      <span className="caption text-white text-xs">12 seconds</span>
                    </div>
                    <div className="p-2 bg-background rounded border border-border flex justify-between items-center">
                      <span className="caption text-white text-xs">Slowest acknowledgement</span>
                      <span className="caption text-white text-xs">3 minutes 15 seconds</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Alert Side Panel */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[640px] bg-card overflow-y-auto px-6 [&>button]:text-white">
          <SheetHeader>
            <SheetTitle style={{ marginLeft: '-20px' }}>{editingAlertId ? 'Edit Notification' : 'New Notification'}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 pb-6" style={{ marginTop: 'calc(1.5rem - 20px)' }}>
            {/* Communication Channels */}
            <div className="space-y-2">
              <Label className="text-foreground">Communication Channels <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-3">
                {communicationChannels.map((channel) => {
                  const isSelected = formData.channels?.includes(channel.id);
                  return (
                    <label
                      key={channel.id}
                      className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#01476f]'
                          : 'hover:bg-muted/20'
                      }`}
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleChannel(channel.id)}
                      />
                      
                      {/* Icon */}
                      <div className="w-6 h-6 flex items-center justify-center">
                        {channel.id === 'email' && (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="white"/>
                          </svg>
                        )}
                        {channel.id === 'sms' && (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" fill="white"/>
                          </svg>
                        )}
                        {channel.id === 'push' && (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="white"/>
                          </svg>
                        )}
                        {channel.id === 'voice' && (
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="white"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-white text-xs font-semibold whitespace-nowrap">
                        {channel.label}
                      </span>
                      {/* Info icon */}
                      <div className="w-2.5 h-2.5 bg-white/50 rounded-full"></div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              {/* Keep message same checkbox */}
              <div className="flex items-center gap-2 pb-2">
                <Checkbox
                  id="keep-message-same"
                  checked={keepMessageSame}
                  onCheckedChange={(checked) => setKeepMessageSame(checked as boolean)}
                  className="border-border"
                />
                <label
                  htmlFor="keep-message-same"
                  className="text-sm cursor-pointer text-foreground"
                >
                  Keep message the same across all channels
                </label>
              </div>
              
              <Label className="text-foreground">Notification Message <span className="text-destructive">*</span></Label>
              
              {/* Show tabs when channels are selected */}
              {formData.channels && formData.channels.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {formData.channels.map((channelId) => {
                    const channel = communicationChannels.find(c => c.id === channelId);
                    if (!channel) return null;
                    return (
                      <button
                        key={channelId}
                        type="button"
                        onClick={() => setActiveMessageTab(channelId)}
                        className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                          activeMessageTab === channelId
                            ? 'bg-accent text-white'
                            : 'text-white hover:bg-muted/20'
                        }`}
                      >
                        {channel.label}
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Message field - shared or channel-specific */}
              {formData.channels && formData.channels.length > 0 ? (
                keepMessageSame ? (
                  <Textarea 
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                    placeholder="Enter notification message (will be sent to all selected channels)..."
                    rows={3}
                    className="bg-input-background border-border resize-none" 
                  />
                ) : (
                  formData.channels.map((channelId) => {
                    const channel = communicationChannels.find(c => c.id === channelId);
                    if (!channel || activeMessageTab !== channelId) return null;
                    return (
                      <Textarea
                        key={channelId}
                        value={channelMessages[channelId] || ''}
                        onChange={(e) => setChannelMessages(prev => ({ ...prev, [channelId]: e.target.value }))}
                        placeholder={`Enter custom message for ${channel.label}...`}
                        rows={3}
                        className="bg-input-background border-border resize-none"
                      />
                    );
                  })
                )
              ) : (
                <p className="text-sm text-muted-foreground p-3 border border-border rounded bg-input-background">
                  Please select at least one communication channel above to compose your message.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Upload Files</Label>
            </div>

            {/* Require Acknowledgement checkbox */}
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="require-acknowledgement"
                checked={requireAcknowledgement}
                onCheckedChange={(checked) => setRequireAcknowledgement(checked as boolean)}
                className="border-border"
              />
              <label
                htmlFor="require-acknowledgement"
                className="text-sm cursor-pointer text-foreground"
              >
                Require Recipients to Acknowledge
              </label>
            </div>

            {/* Accept Responses checkbox */}
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="accept-responses"
                checked={acceptResponses}
                onCheckedChange={(checked) => setAcceptResponses(checked as boolean)}
                className="border-border"
              />
              <label
                htmlFor="accept-responses"
                className="text-sm cursor-pointer text-foreground"
              >
                Accept Responses
              </label>
            </div>

            {/* Let Recipients Archive checkbox */}
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="let-recipients-archive"
                checked={letRecipientsArchive}
                onCheckedChange={(checked) => setLetRecipientsArchive(checked as boolean)}
                className="border-border"
              />
              <label
                htmlFor="let-recipients-archive"
                className="text-sm cursor-pointer text-foreground"
              >
                Let Recipients Archive
              </label>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Recipients <span className="text-destructive">*</span></Label>
              <div className="space-y-3">
                {/* Individuals Multi-Select Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Individuals</Label>
                  <Popover open={individualsPopoverOpen} onOpenChange={setIndividualsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className="w-full flex items-center justify-between bg-input-background border border-border rounded-md px-3 py-2 text-sm hover:bg-accent/5"
                      >
                        <span className="text-muted-foreground">
                          {formData.recipients?.filter(r => availableIndividuals.includes(r)).length || 0} selected
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 bg-card border-border" align="start">
                      <Command className="bg-card">
                        <CommandInput 
                          placeholder="Search individuals..." 
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No individual found.</CommandEmpty>
                          <CommandGroup>
                            {availableIndividuals.map((individual) => (
                              <CommandItem
                                key={individual}
                                value={individual}
                                onSelect={() => toggleRecipient(individual)}
                                className="cursor-pointer"
                              >
                                <Checkbox
                                  checked={formData.recipients?.includes(individual)}
                                  className="mr-2"
                                />
                                {individual}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {/* Selected individuals tags */}
                  {formData.recipients?.filter(r => availableIndividuals.includes(r)).length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-input-background border border-border rounded-md">
                      {formData.recipients
                        .filter(r => availableIndividuals.includes(r))
                        .map((individual) => (
                          <div 
                            key={individual}
                            className="flex items-center gap-1 bg-accent/20 text-accent px-2 py-1 rounded text-xs"
                          >
                            <span>{individual}</span>
                            <button
                              onClick={() => removeRecipient(individual)}
                              className="hover:bg-accent/30 rounded p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Teams Multi-Select Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Teams</Label>
                  <Popover open={teamsPopoverOpen} onOpenChange={setTeamsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className="w-full flex items-center justify-between bg-input-background border border-border rounded-md px-3 py-2 text-sm hover:bg-accent/5"
                      >
                        <span className="text-muted-foreground">
                          {formData.recipients?.filter(r => availableTeams.includes(r)).length || 0} selected
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 bg-card border-border" align="start">
                      <Command className="bg-card">
                        <CommandInput 
                          placeholder="Search teams..." 
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No team found.</CommandEmpty>
                          <CommandGroup>
                            {availableTeams.map((team) => (
                              <CommandItem
                                key={team}
                                value={team}
                                onSelect={() => toggleRecipient(team)}
                                className="cursor-pointer"
                              >
                                <Checkbox
                                  checked={formData.recipients?.includes(team)}
                                  className="mr-2"
                                />
                                {team}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {/* Selected teams tags */}
                  {formData.recipients?.filter(r => availableTeams.includes(r)).length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-input-background border border-border rounded-md">
                      {formData.recipients
                        .filter(r => availableTeams.includes(r))
                        .map((team) => (
                          <div 
                            key={team}
                            className="flex items-center gap-1 bg-accent/20 text-accent px-2 py-1 rounded text-xs"
                          >
                            <span>{team}</span>
                            <button
                              onClick={() => removeRecipient(team)}
                              className="hover:bg-accent/30 rounded p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Scheduled Time <span className="text-destructive">*</span></Label>
              <div className="flex w-full border border-border bg-input-background rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSendTimingMode('now')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    sendTimingMode === 'now'
                      ? 'bg-[#01669f] text-white'
                      : 'bg-transparent text-foreground hover:bg-muted/50'
                  }`}
                >
                  Send alert now
                </button>
                <button
                  type="button"
                  onClick={() => setSendTimingMode('scheduled')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-border ${
                    sendTimingMode === 'scheduled'
                      ? 'bg-[#01669f] text-white'
                      : 'bg-transparent text-foreground hover:bg-muted/50'
                  }`}
                >
                  Schedule alert
                </button>
              </div>
              
              {sendTimingMode === 'scheduled' && (
                <div className="mt-3">
                  <Input 
                    type="datetime-local"
                    value={formData.scheduledTime ? new Date(formData.scheduledTime).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: new Date(e.target.value).toISOString() })}
                    className="bg-input-background border-border" 
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Severity</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value as Severity })}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Info">Info</SelectItem>
                  <SelectItem value="Advisory">Advisory</SelectItem>
                  <SelectItem value="Watch">Watch</SelectItem>
                  <SelectItem value="Warning">Warning</SelectItem>
                  <SelectItem value="Stand Down Safety">Stand Down Safety</SelectItem>
                </SelectContent>
              </Select>
              
              {formData.severity === 'Stand Down Safety' && (
                <div className="mt-3 p-3 border border-border rounded bg-input-background">
                  <p className="text-sm text-white font-bold">
                    A Stand Down Safety notification will be sent immediately to recipients via all communication channels available.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Location</Label>
              <Input 
                value={formData.location || ''} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                placeholder="Enter location..."
                className="bg-input-background border-border" 
              />
            </div>

            {/* Archive Date & Time */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-2">
                <Checkbox
                  id="enable-archive-datetime"
                  checked={enableArchiveDateTime}
                  onCheckedChange={(checked) => {
                    setEnableArchiveDateTime(checked as boolean);
                    if (!checked) {
                      setFormData({ ...formData, archiveDateTime: '' });
                    }
                  }}
                  className="border-border"
                />
                <label
                  htmlFor="enable-archive-datetime"
                  className="text-sm cursor-pointer text-foreground"
                >
                  Set Archive Date & Time
                </label>
              </div>
              
              {enableArchiveDateTime && (
                <div className="space-y-2 pl-6">
                  <Label className="text-foreground text-xs">Archive Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.archiveDateTime ? new Date(formData.archiveDateTime).toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value ? new Date(e.target.value).toISOString() : '';
                      setFormData({ ...formData, archiveDateTime: dateValue });
                    }}
                    className="bg-input-background border-border text-white"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Additional Details</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Add any additional context or instructions..."
                className="bg-input-background border-border min-h-[120px] resize-none" 
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={saveAlert} className="flex-1 bg-primary hover:bg-primary/90">
                {editingAlertId ? 'Update Alert' : 'Schedule Alert'}
              </Button>
              <Button onClick={() => setIsSheetOpen(false)} variant="outline" className="flex-1 border-border">
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Safety Check Archive Confirmation Modal */}
      <Dialog open={safetyCheckArchiveModalOpen} onOpenChange={setSafetyCheckArchiveModalOpen}>
        <DialogContent className="bg-[#222529] border-[#6e757c] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Archive Safety Check Notification</DialogTitle>
            <DialogDescription className="text-white/70">
              This will archive the "Safety Check - Personnel Status Report" notification for all users. 
              It will be moved to the Historical tab and will no longer be visible in the Active notifications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button
              onClick={() => setSafetyCheckArchiveModalOpen(false)}
              variant="outline"
              className="border-border text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setSafetyCheckArchived(true);
                setSafetyCheckArchiveModalOpen(false);
                onDataChange({
                  ...data,
                  safetyCheckArchived: true
                });
              }}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Confirm Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

