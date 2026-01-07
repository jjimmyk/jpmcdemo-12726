import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight, Edit2, Trash2, RefreshCw, Check, Download, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import svgPaths from '../../imports/svg-7hg6d30srz';

interface OverviewPhaseProps {
  data: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
  onComplete: () => void;
  onPrevious?: () => void;
  onAddAIContext?: (itemName: string) => void;
}

type DataSourceStatus = 'Active' | 'Delayed' | 'Offline' | 'Maintenance';

interface DataSourceItem {
  id: string;
  name: string;
  status: DataSourceStatus;
  lastUpdated: string;
  updateFrequency: string;
  provider: string;
  description: string;
  dataTypes: string[];
  coverage: string;
  reliability: string;
  dataSources?: string;
}

export function OverviewPhase({ data, onDataChange, onAddAIContext }: OverviewPhaseProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [expandedChildIncidents, setExpandedChildIncidents] = useState<Set<string>>(new Set());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'region' | 'incident'>('region');
  const [selectedRegion, setSelectedRegion] = useState<string>('gulf-coast');
  const [selectedIncident, setSelectedIncident] = useState<string>('oil-spill-alpha');
  const [regionPopoverOpen, setRegionPopoverOpen] = useState(false);
  const [incidentPopoverOpen, setIncidentPopoverOpen] = useState(false);
  const [sitrepContent, setSitrepContent] = useState<string>(data.sitrep || '');
  const [sitrepEditMode, setSitrepEditMode] = useState(false);
  const [sitrepDraft, setSitrepDraft] = useState<string>('');
  const [sitrepLastUpdated, setSitrepLastUpdated] = useState<string>(data.sitrepLastUpdated || '');
  const [sitrepLastUpdatedBy, setSitrepLastUpdatedBy] = useState<string>(data.sitrepLastUpdatedBy || 'John Smith');
  const [filterEditMode, setFilterEditMode] = useState(false);
  const [filterModeDraft, setFilterModeDraft] = useState<'region' | 'incident'>('region');
  const [selectedRegionDraft, setSelectedRegionDraft] = useState<string>('gulf-coast');
  const [selectedIncidentDraft, setSelectedIncidentDraft] = useState<string>('oil-spill-alpha');
  const [sitrepViewMode, setSitrepViewMode] = useState<'latest' | 'historical' | 'drafts'>('latest');
  
  // Historical SITREPs state
  const [historicalSitreps] = useState([
    {
      id: 'hist-1',
      content: 'Operational Period 3 Summary: Hurricane Delta downgraded to Category 2, moving NNE at 18 knots. All vessels accounted for in designated safe harbors. Port Condition ZULU remains in effect for Gulf Coast ports.\n\nDamage Assessment: Minor pier damage at Station Galveston. All units operational. Power restored to 85% of affected areas.\n\nCurrent Operations: SAR helicopter crews on standby. Marine safety zones enforced within 50nm of eye wall.',
      approvedDate: '12/18/2025 09:15',
      approvedBy: 'CAPT Anderson',
      operationalPeriod: 'OP-3'
    },
    {
      id: 'hist-2',
      content: 'Operational Period 2 Summary: Hurricane Delta intensified to Category 3, sustained winds 115 knots. Port Condition ZULU set for all Gulf Coast ports. All commercial traffic suspended.\n\nEvacuations: 450 personnel evacuated from offshore platforms. 23 vessels assisted to safe harbor. Zero casualties reported.\n\nPreparedness: All stations secured. Emergency generators online. Fuel reserves at 100%.',
      approvedDate: '12/17/2025 16:30',
      approvedBy: 'CAPT Anderson',
      operationalPeriod: 'OP-2'
    },
    {
      id: 'hist-3',
      content: 'Operational Period 1 Summary: Hurricane Delta forming 400nm SE of Louisiana coast. Current track forecast landfall in 72-96 hours. Port Condition YANKEE set as precautionary measure.\n\nInitial Actions: All cutters returning to homeport. Aircraft secured in hangars. Personnel recall initiated. Supply chain activation for emergency provisions.\n\nCoordination: Joint calls established with State EOC and FEMA Region 6.',
      approvedDate: '12/16/2025 14:00',
      approvedBy: 'CAPT Rodriguez',
      operationalPeriod: 'OP-1'
    }
  ]);
  
  // Draft SITREPs state
  const [draftSitreps] = useState([
    {
      id: 'draft-1',
      content: 'Current situation: Sector Honolulu monitoring Tropical Storm Olivia, currently 850nm ENE of Oahu moving WSW at 12 knots. Maximum sustained winds 50 knots, central pressure 995mb.\n\nOperational Status: Port Condition YANKEE set for all Hawaiian ports effective 1400L. All recreational vessels ordered to seek safe harbor. Commercial shipping continues with restrictions.\n\nResources: USCG Cutter WALNUT pre-positioned at Sand Island. MH-65 helicopter on standby at Air Station Barbers Point. Search and rescue assets staged.',
      submittedDate: '12/19/2025 14:30',
      status: 'Pending Review'
    }
  ]);
  const [isAddingDraft, setIsAddingDraft] = useState(false);
  const [newDraftContent, setNewDraftContent] = useState('');

  // Region options
  const regions = [
    { id: 'gulf-coast', name: 'Gulf Coast Region' },
    { id: 'southeast', name: 'Southeast Region' },
    { id: 'northeast', name: 'Northeast Region' },
    { id: 'west-coast', name: 'West Coast Region' },
    { id: 'great-lakes', name: 'Great Lakes Region' },
    { id: 'sector-new-york', name: 'Sector New York' }
  ];

  // Incident options
  const incidents = [
    { id: 'grid-outage-alpha', name: 'Grid Outage Alpha - Oahu Substation Failure' },
    { id: 'renewable-integration', name: 'Solar Array Integration - Maui County' },
    { id: 'typhoon-resilience', name: 'Typhoon Olivia Grid Hardening Response' },
    { id: 'battery-storage-beta', name: 'Battery Storage System Beta - Big Island' },
    { id: 'transmission-repair', name: 'Transmission Line Repair - Kauai Emergency' }
  ];

  // Function to generate data based on region and incident
  const generateDataForSelection = (region: string, incident: string, mode: 'region' | 'incident' = 'region'): DataSourceItem[] => {
    const baseTime = new Date();
    const randomMinutes = () => Math.floor(Math.random() * 15);
    
    const regionCoverage = regions.find(r => r.id === region)?.name || 'Unknown Region';
    const incidentName = incidents.find(i => i.id === incident)?.name || 'Unknown Incident';
    
    const items: DataSourceItem[] = [];
    
    // Add Active Incidents item only when filtering by region
    if (mode === 'region') {
      items.push({
        id: 'src0',
        name: `Active Incidents Within ${regionCoverage}`,
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Real-time',
        provider: 'Integrated Emergency Management System',
        description: `Comprehensive list of all active emergency incidents and responses within ${regionCoverage}. Includes incident type, severity, status, responding agencies, affected areas, resource allocation, and operational priorities. Provides regional situational awareness across all concurrent emergency operations.`,
        dataTypes: ['Incident Type', 'Severity Level', 'Status', 'Location', 'Responding Agencies', 'Resources Deployed'],
        coverage: regionCoverage,
        reliability: '99.9% uptime',
        dataSources: 'FEMA IPAWS, State EOC, Local Emergency Dispatch, USCG Command Centers, DHS NIMS'
      });
    }
    
    items.push(
      {
        id: 'src0a',
        name: 'Port Status',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 30 minutes',
        provider: 'U.S. Coast Guard Captain of the Port',
        description: `Port operational status for ${regionCoverage}: Open (with restrictions) or Closed. Includes berth availability, channel restrictions, pilot services, tug requirements, and maritime traffic management for ${incidentName}.`,
        dataTypes: ['Port Condition', 'Channel Status', 'Berth Availability', 'Vessel Traffic', 'Restrictions'],
        coverage: regionCoverage,
        reliability: '99.9% uptime',
        dataSources: 'USCG Sector Command Center, Homeport, Port Authority, Marine Exchange'
      },
      {
        id: 'src0b',
        name: 'HURCON Attainment',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 6 hours',
        provider: 'U.S. Coast Guard',
        description: `Hurricane Condition (HURCON) readiness level for ${regionCoverage} facilities and units. Tracks progression through HURCON 5 (96 hours), HURCON 4 (72 hours), HURCON 3 (48 hours), HURCON 2 (24 hours), to HURCON 1 (12 hours) relative to ${incidentName}.`,
        dataTypes: ['HURCON Level', 'Readiness Status', 'Timeline', 'Resource Positioning', 'Evacuation Status'],
        coverage: regionCoverage,
        reliability: '99.9% uptime',
        dataSources: 'USCG District Command, Sector Operations Centers, Unit Commanders'
      },
      {
        id: 'src0c',
        name: 'Port Condition Status',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 2 hours',
        provider: 'U.S. Coast Guard Sector',
        description: `Comprehensive port readiness condition for ${regionCoverage}. Includes X-RAY (normal operations), YANKEE (heavy weather/high winds expected), ZULU (port closed/severe conditions) designations affecting ${incidentName} maritime operations and emergency response.`,
        dataTypes: ['Port Condition', 'Weather Impact', 'Facility Status', 'Safety Measures', 'Operational Restrictions'],
        coverage: regionCoverage,
        reliability: '99.9% uptime',
        dataSources: 'USCG Captain of the Port, National Weather Service, Port Operations'
      },
      {
        id: 'src0d',
        name: 'COOP Status',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 12 hours',
        provider: 'FEMA/DHS',
        description: `Continuity of Operations (COOP) planning status for ${regionCoverage} critical facilities and government operations. Tracks essential functions, alternate facility activation, personnel accountability, communications redundancy, and resource sustainability for ${incidentName} response.`,
        dataTypes: ['COOP Level', 'Essential Functions', 'Alternate Facilities', 'Personnel Status', 'Communications'],
        coverage: regionCoverage,
        reliability: '99.8% uptime',
        dataSources: 'Federal Emergency Operations, State EOC, Local Emergency Management, Agency COOP Coordinators'
      },
      {
        id: 'src0e',
        name: 'Force Layout',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 4 hours',
        provider: 'U.S. Coast Guard/DoD',
        description: `Pre-staged emergency response assets for ${regionCoverage} including helicopters, fixed-wing aircraft, Catastrophic Incident Search and Rescue (CISAR) teams, unmanned aerial systems (drones), swift water rescue teams, and specialized equipment positioned for rapid deployment to ${incidentName} impact area.`,
        dataTypes: ['Helicopters', 'Fixed-Wing Aircraft', 'CISAR Teams', 'Drones/UAS', 'Swift Water Teams', 'Equipment'],
        coverage: regionCoverage,
        reliability: '99.7% uptime',
        dataSources: 'USCG Air Stations, FEMA Urban Search & Rescue, National Guard, DoD Northern Command, State Emergency Response'
      },
      {
        id: 'src1',
        name: 'Current Weather',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 5 minutes',
        provider: 'NOAA National Weather Service',
        description: `Real-time current weather conditions for ${regionCoverage} including temperature, wind speed and direction, humidity, barometric pressure, visibility, precipitation, and current weather phenomena affecting ${incidentName} operations.`,
        dataTypes: ['Temperature', 'Wind Speed/Direction', 'Humidity', 'Pressure', 'Visibility', 'Precipitation', 'Cloud Cover'],
        coverage: regionCoverage,
        reliability: '99.8% uptime',
        dataSources: 'NOAA Weather Stations, NDBC Buoys, FAA AWOS Network, Regional Airports'
      },
      {
        id: 'src2',
        name: 'Forecast Weather',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 6 hours',
        provider: 'NOAA National Weather Service',
        description: `Weather forecasts for ${incidentName} operational planning including 24-hour, 48-hour, and 7-day forecasts, marine forecasts, severe weather outlooks, and extended outlook for response operations in ${regionCoverage}.`,
        dataTypes: ['24-Hour Forecast', '48-Hour Forecast', '7-Day Outlook', 'Marine Forecast', 'Wave Heights', 'Severe Weather Outlook'],
        coverage: regionCoverage,
        reliability: '99.5% uptime',
        dataSources: 'GFS Model, NAM Model, HRRR Model, WRF-ARW, Wave Watch III, NHC Advisories'
      },
      {
        id: 'src3',
        name: 'News',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 15 minutes',
        provider: 'Multi-Source News Aggregator',
        description: `Aggregated news coverage related to ${incidentName} from local, regional, and national news sources including incident-related news stories, press releases, social media monitoring, and public statements affecting ${regionCoverage}.`,
        dataTypes: ['Local News', 'Regional Coverage', 'National Media', 'Press Releases', 'Social Media', 'Public Statements'],
        coverage: `${regionCoverage} - Local, Regional, and National Media`,
        reliability: '99.9% uptime',
        dataSources: 'AP News Wire, Local TV/Radio, Twitter API, Facebook Graph API, RSS Feeds, Press Release Services'
      },
      {
        id: 'src4',
        name: 'Power Outages',
        status: region === 'gulf-coast' && incident === 'hurricane-delta' ? 'Delayed' : 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Every 10 minutes',
        provider: 'Regional Utility Companies',
        description: `Real-time power outage tracking for ${regionCoverage} operational area including number of customers affected, outage locations, estimated restoration times, critical infrastructure impacts affecting ${incidentName}.`,
        dataTypes: ['Outage Locations', 'Customers Affected', 'Restoration ETAs', 'Critical Infrastructure', 'Crew Status', 'Substation Status'],
        coverage: `${regionCoverage} Service Areas`,
        reliability: region === 'gulf-coast' && incident === 'hurricane-delta' ? '95.0% uptime' : '98.5% uptime',
        dataSources: 'Utility SCADA Systems, OMS Platforms, Field Crew Reports, Smart Meter Networks, Customer Call Centers'
      },
      {
        id: 'src5',
        name: 'Energy Reliability Index',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Hourly',
        provider: 'Regional Energy Infrastructure Monitor',
        description: `Comprehensive energy infrastructure reliability metrics for ${regionCoverage} including grid stability indicators, generation capacity, transmission status, fuel supply levels, and backup power availability supporting ${incidentName} operations.`,
        dataTypes: ['Grid Stability', 'Generation Capacity', 'Transmission Status', 'Fuel Supplies', 'Backup Power', 'Critical Facilities'],
        coverage: `${regionCoverage} Energy Infrastructure`,
        reliability: '99.7% uptime',
        dataSources: 'ISO/RTO Data, EIA-930, Generation Telemetry, Pipeline SCADA, Tank Gauging Systems, Generator Status Feeds'
      },
      {
        id: 'src6',
        name: 'Incident Objectives',
        status: 'Active',
        lastUpdated: new Date(baseTime.getTime() - randomMinutes() * 60000).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
        }).replace(',', ''),
        updateFrequency: 'Per Operational Period',
        provider: 'Unified Command - Planning Section',
        description: `Current operational period incident objectives for ${incidentName} including strategic goals, tactical priorities, safety objectives, resource allocation targets, and completion criteria for response operations in ${regionCoverage}.`,
        dataTypes: ['Strategic Objectives', 'Tactical Priorities', 'Safety Goals', 'Resource Targets', 'Success Metrics', 'Progress Status'],
        coverage: `${incidentName} - All Operations`,
        reliability: '99.9% uptime',
        dataSources: 'ICS-202 Forms, Planning Meeting Minutes, Tactics Meeting Notes, IAP Documentation, UC Meeting Records'
      }
    );
    
    return items;
  };

  const [dataSources, setDataSources] = useState<DataSourceItem[]>(
    data.dataSources || generateDataForSelection('gulf-coast', 'oil-spill-alpha', 'region')
  );

  // Function to manually update data
  const handleUpdate = () => {
    const newData = generateDataForSelection(selectedRegion, selectedIncident, filterMode);
    setDataSources(newData);
    persist(newData);
  };


  const [formData, setFormData] = useState<DataSourceItem>({
    id: '',
    name: '',
    status: 'Active',
    lastUpdated: '',
    updateFrequency: '',
    provider: '',
    description: '',
    dataTypes: [],
    coverage: '',
    reliability: ''
  });

  const persist = (items: DataSourceItem[]) => {
    setDataSources(items);
    onDataChange({ ...data, dataSources: items });
  };

  const startEditSitrep = () => {
    setSitrepDraft(sitrepContent);
    setSitrepEditMode(true);
  };

  const saveSitrep = () => {
    setSitrepContent(sitrepDraft);
    const timestamp = new Date().toLocaleString('en-US', { 
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
    }).replace(',', '');
    setSitrepLastUpdated(timestamp);
    onDataChange({ 
      ...data, 
      sitrep: sitrepDraft,
      sitrepLastUpdated: timestamp,
      sitrepLastUpdatedBy: sitrepLastUpdatedBy
    });
    setSitrepEditMode(false);
  };

  const cancelEditSitrep = () => {
    setSitrepDraft('');
    setSitrepEditMode(false);
  };

  const startEditFilter = () => {
    setFilterModeDraft(filterMode);
    setSelectedRegionDraft(selectedRegion);
    setSelectedIncidentDraft(selectedIncident);
    setFilterEditMode(true);
  };

  const saveFilterChanges = () => {
    setFilterMode(filterModeDraft);
    setSelectedRegion(selectedRegionDraft);
    setSelectedIncident(selectedIncidentDraft);
    const newData = generateDataForSelection(selectedRegionDraft, selectedIncidentDraft, filterModeDraft);
    setDataSources(newData);
    persist(newData);
    setFilterEditMode(false);
  };

  const cancelEditFilter = () => {
    setFilterModeDraft(filterMode);
    setSelectedRegionDraft(selectedRegion);
    setSelectedIncidentDraft(selectedIncident);
    setFilterEditMode(false);
  };

  const toggleSource = (id: string) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleChildIncident = (id: string) => {
    setExpandedChildIncidents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openAddSource = () => {
    setEditingSourceId(null);
    setFormData({
      id: '',
      name: '',
      status: 'Active',
      lastUpdated: new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }).replace(',', ''),
      updateFrequency: '',
      provider: '',
      description: '',
      dataTypes: [],
      coverage: '',
      reliability: ''
    });
    setIsSheetOpen(true);
  };

  const openEditSource = (id: string) => {
    const s = dataSources.find(x => x.id === id);
    if (!s) return;
    setEditingSourceId(id);
    setFormData({ ...s });
    setIsSheetOpen(true);
  };

  const deleteSource = (id: string) => {
    persist(dataSources.filter(s => s.id !== id));
  };

  const saveSource = () => {
    if (!formData.name || !formData.provider) {
      return;
    }
    if (editingSourceId) {
      persist(dataSources.map(s => (s.id === editingSourceId ? { ...formData, id: editingSourceId } : s)));
    } else {
      const id = `${Date.now()}`;
      persist([...dataSources, { ...formData, id }]);
    }
    setIsSheetOpen(false);
    setEditingSourceId(null);
  };

  const filtered = dataSources.filter(s => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(search) ||
      s.provider.toLowerCase().includes(search) ||
      s.status.toLowerCase().includes(search) ||
      s.dataTypes.some(dt => dt.toLowerCase().includes(search))
    );
  });

  const getStatusColor = (status: DataSourceStatus) => {
    switch (status) {
      case 'Active': return '#22c55e';
      case 'Delayed': return '#F59E0B';
      case 'Offline': return '#EF4444';
      case 'Maintenance': return '#6e757c';
      default: return '#6e757c';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#222529] rounded-lg border border-[#6e757c] relative">
        <div className="flex items-center justify-between px-[13px] py-3 w-full border-b-2 border-border rounded-t-lg rounded-b-none">
          <div className="flex items-center gap-4">
            <p className="caption text-nowrap text-white whitespace-pre">Report Sections</p>
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
          </div>
        </div>
      </div>

      {/* Filter Mode Toggle and Dropdown */}
      <div className="space-y-3 px-4 py-3 bg-[#222529] rounded-lg border border-[#6e757c]">
        {/* Toggle Control with Edit Icon */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="caption text-white whitespace-nowrap">Filter by:</span>
            <div className="flex items-center bg-[#14171a] rounded-[4px] border border-[#6e757c] overflow-hidden">
              <button
                onClick={() => filterEditMode && setFilterModeDraft('region')}
                disabled={!filterEditMode}
                className={`caption px-3 py-1 transition-colors ${
                  (filterEditMode ? filterModeDraft : filterMode) === 'region'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-white hover:bg-[#222529]'
                } ${!filterEditMode ? 'cursor-default' : ''}`}
                style={{ 
                  fontFamily: "'Open Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '18px'
                }}
              >
                AOR
              </button>
              <button
                onClick={() => filterEditMode && setFilterModeDraft('incident')}
                disabled={!filterEditMode}
                className={`caption px-3 py-1 transition-colors ${
                  (filterEditMode ? filterModeDraft : filterMode) === 'incident'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-white hover:bg-[#222529]'
                } ${!filterEditMode ? 'cursor-default' : ''}`}
                style={{ 
                  fontFamily: "'Open Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '18px'
                }}
              >
                Incident
              </button>
            </div>
          </div>
          {!filterEditMode && (
            <button
              onClick={startEditFilter}
              className="p-1 hover:bg-muted/30 rounded transition-colors"
              title="Edit Filter"
            >
              <Edit2 className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {/* Conditional Dropdown */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="caption text-white whitespace-nowrap">
              {(filterEditMode ? filterModeDraft : filterMode) === 'region' ? 'AOR:' : 'Incident:'}
            </span>
            {(filterEditMode ? filterModeDraft : filterMode) === 'region' ? (
              <Popover open={filterEditMode && regionPopoverOpen} onOpenChange={(open) => filterEditMode && setRegionPopoverOpen(open)}>
                <PopoverTrigger asChild>
                  <button
                    onClick={(e) => !filterEditMode && e.preventDefault()}
                    className={`flex-1 h-[24px] bg-transparent border border-[#6e757c] rounded-[4px] px-2 caption text-white focus:outline-none focus:border-accent flex items-center justify-between ${
                      filterEditMode ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    style={{ 
                      fontFamily: "'Open Sans', sans-serif",
                      fontSize: '12px',
                      fontWeight: 400,
                      lineHeight: '18px'
                    }}
                  >
                    {regions.find(r => r.id === (filterEditMode ? selectedRegionDraft : selectedRegion))?.name || 'Select region...'}
                    <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-[#222529] border-[#6e757c]" align="start">
                  <Command className="bg-[#222529]">
                    <CommandInput 
                      placeholder="Search region..." 
                      className="h-9 caption text-white"
                      style={{ 
                        fontFamily: "'Open Sans', sans-serif",
                        fontSize: '12px',
                        fontWeight: 400,
                        lineHeight: '18px'
                      }}
                    />
                    <CommandList>
                      <CommandEmpty className="caption text-white/70 p-2">No region found.</CommandEmpty>
                      <CommandGroup>
                        {regions.map((region) => (
                          <CommandItem
                            key={region.id}
                            value={region.name}
                            onSelect={() => {
                              setSelectedRegionDraft(region.id);
                              setRegionPopoverOpen(false);
                            }}
                            className="caption text-white cursor-pointer hover:bg-[#14171a] data-[selected=true]:bg-[#14171a]"
                            style={{ 
                              fontFamily: "'Open Sans', sans-serif",
                              fontSize: '12px',
                              fontWeight: 400,
                              lineHeight: '18px'
                            }}
                          >
                            <Check
                              className={`mr-2 h-3 w-3 ${
                                (filterEditMode ? selectedRegionDraft : selectedRegion) === region.id ? 'opacity-100' : 'opacity-0'
                              }`}
                            />
                            {region.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Popover open={filterEditMode && incidentPopoverOpen} onOpenChange={(open) => filterEditMode && setIncidentPopoverOpen(open)}>
                <PopoverTrigger asChild>
                  <button
                    onClick={(e) => !filterEditMode && e.preventDefault()}
                    className={`flex-1 h-[24px] bg-transparent border border-[#6e757c] rounded-[4px] px-2 caption text-white focus:outline-none focus:border-accent flex items-center justify-between ${
                      filterEditMode ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    style={{ 
                      fontFamily: "'Open Sans', sans-serif",
                      fontSize: '12px',
                      fontWeight: 400,
                      lineHeight: '18px'
                    }}
                  >
                    {incidents.find(i => i.id === (filterEditMode ? selectedIncidentDraft : selectedIncident))?.name || 'Select incident...'}
                    <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0 bg-[#222529] border-[#6e757c]" align="start">
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
                            key={incident.id}
                            value={incident.name}
                            onSelect={() => {
                              setSelectedIncidentDraft(incident.id);
                              setIncidentPopoverOpen(false);
                            }}
                            className="caption text-white cursor-pointer hover:bg-[#14171a] data-[selected=true]:bg-[#14171a]"
                            style={{ 
                              fontFamily: "'Open Sans', sans-serif",
                              fontSize: '12px',
                              fontWeight: 400,
                              lineHeight: '18px'
                            }}
                          >
                            <Check
                              className={`mr-2 h-3 w-3 ${
                                (filterEditMode ? selectedIncidentDraft : selectedIncident) === incident.id ? 'opacity-100' : 'opacity-0'
                              }`}
                            />
                            {incident.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Update and Cancel Buttons - Only visible when in edit mode */}
          {filterEditMode && (
            <div className="flex gap-3">
              <Button
                onClick={saveFilterChanges}
                className="bg-primary hover:bg-primary/90 px-4 h-auto text-xs"
                style={{ paddingTop: '2px', paddingBottom: '2px' }}
              >
                Update
              </Button>
              <Button
                onClick={cancelEditFilter}
                variant="outline"
                className="border-border px-4 h-auto text-xs"
                style={{ paddingTop: '2px', paddingBottom: '2px' }}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Export All Reports Button - Only visible when not in edit mode */}
          {!filterEditMode && (
            <button
              onClick={() => {
                console.log('Exporting all reports for:', filterMode === 'region' 
                  ? regions.find(r => r.id === selectedRegion)?.name 
                  : incidents.find(i => i.id === selectedIncident)?.name);
              }}
              className="bg-[#01669f] h-[22.75px] rounded-[4px] px-3 hover:bg-[#01669f]/90 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3 h-3 text-white" />
              <span className="caption text-white">
                Export Approved Reports for {filterMode === 'region' 
                  ? regions.find(r => r.id === selectedRegion)?.name 
                  : incidents.find(i => i.id === selectedIncident)?.name}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* SITREP Section */}
      <div className="mb-6">
        <div className="border border-border rounded-lg overflow-hidden bg-card/30">
          <div className="p-4 space-y-3">
            {/* SITREP View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#14171a] rounded-[4px] border border-[#6e757c] overflow-hidden">
                <button
                  onClick={() => setSitrepViewMode('latest')}
                  className={`caption px-3 py-1 transition-colors ${
                    sitrepViewMode === 'latest'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-white hover:bg-[#222529]'
                  }`}
                  style={{ 
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '18px'
                  }}
                >
                  Latest
                </button>
                <button
                  onClick={() => setSitrepViewMode('historical')}
                  className={`caption px-3 py-1 transition-colors ${
                    sitrepViewMode === 'historical'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-white hover:bg-[#222529]'
                  }`}
                  style={{ 
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '18px'
                  }}
                >
                  Historical
                </button>
                <button
                  onClick={() => setSitrepViewMode('drafts')}
                  className={`caption px-3 py-1 transition-colors ${
                    sitrepViewMode === 'drafts'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-white hover:bg-[#222529]'
                  }`}
                  style={{ 
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '18px'
                  }}
                >
                  My Drafts
                </button>
              </div>
            </div>

            {sitrepViewMode === 'latest' ? (
              <>
                {/* Header with Edit icon and Last Updated */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-white text-sm font-semibold">
                      SITREP for {filterMode === 'region' 
                        ? regions.find(r => r.id === selectedRegion)?.name 
                        : incidents.find(i => i.id === selectedIncident)?.name}
                    </Label>
                    {!sitrepEditMode && filterMode === 'region' && selectedRegion === 'sector-new-york' && (
                      <Button
                        onClick={startEditSitrep}
                        className="bg-transparent border border-white text-white hover:bg-white/10 h-auto px-1 py-0.5 flex items-center gap-0.5"
                        style={{ fontSize: '6px' }}
                      >
                        <Plus className="w-1.5 h-1.5" />
                        Add Draft
                      </Button>
                    )}
                  </div>
                  {sitrepLastUpdated && (
                    <span className="caption text-white/70 block">
                      Last updated {sitrepLastUpdated} by {sitrepLastUpdatedBy}
                    </span>
                  )}
                </div>

                {/* Content - View or Edit mode */}
                {sitrepEditMode ? (
                  <>
                    <Textarea
                      value={sitrepDraft}
                      onChange={(e) => setSitrepDraft(e.target.value)}
                      placeholder="Enter situation report..."
                      className="bg-input-background border-border min-h-[120px] resize-none"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={saveSitrep}
                        className="bg-primary hover:bg-primary/90 px-6 py-0.5 h-auto text-sm"
                      >
                        {filterMode === 'region' && selectedRegion === 'sector-new-york' 
                          ? 'Submit to East District' 
                          : 'Save'}
                      </Button>
                      <Button
                        onClick={cancelEditSitrep}
                        variant="outline"
                        className="border-border px-6 py-0.5 h-auto text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="bg-input-background border border-border rounded p-3 min-h-[120px]">
                    <p className="caption text-white whitespace-pre-wrap">
                      {filterMode === 'region' && selectedRegion === 'sector-new-york' 
                        ? (sitrepContent || 'No SITREP entered yet. Click Edit to add one.')
                        : 'SITREP editing is only available for Sector Honolulu.'}
                    </p>
                  </div>
                )}
              </>
            ) : sitrepViewMode === 'historical' ? (
              <>
                {/* Historical SITREPs View */}
                <div className="space-y-3">
                  <Label className="text-white text-sm font-semibold">
                    Previous SITREPs
                  </Label>

                  {/* Historical SITREPs List */}
                  {historicalSitreps.length > 0 ? (
                    <div className="space-y-3">
                      {historicalSitreps.map((sitrep) => (
                        <div key={sitrep.id} className="border border-border rounded-lg overflow-hidden bg-background/30">
                          <div className="p-3 space-y-3">
                            <span className="caption text-white/70 text-xs block">
                              Authored by {sitrep.approvedBy} at {sitrep.approvedDate}
                            </span>
                            <p className="caption text-white whitespace-pre-wrap">
                              {sitrep.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-input-background border border-border rounded p-3 min-h-[120px] flex items-center justify-center">
                      <p className="caption text-white/70">
                        No historical SITREPs available.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* My Drafts View */}
                <div className="space-y-3">
                  {/* Header with Add Draft button */}
                  <div className="flex items-center justify-between">
                    <Label className="text-white text-sm font-semibold">
                      My Draft SITREPs
                    </Label>
                    <button
                      onClick={() => setIsAddingDraft(true)}
                      className="bg-[#01669f] h-[22.75px] rounded-[4px] px-3 hover:bg-[#01669f]/90 transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="text-white text-xs">+</span>
                      <span className="caption text-white">Add Draft</span>
                    </button>
                  </div>

                  {/* Add Draft Form */}
                  {isAddingDraft && (
                    <div className="space-y-3 p-3 bg-background/50 border border-border rounded">
                      {/* Header with Generate Button */}
                      <div className="flex items-center justify-between">
                        <Label className="text-white text-sm">New Draft SITREP</Label>
                        <button
                          onClick={() => {
                            // Generate AI draft content (placeholder for now)
                            console.log('Generate draft clicked');
                          }}
                          className="bg-white hover:bg-gray-100 text-black border border-white h-[28px] rounded-[4px] px-4 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg 
                            className="w-4 h-4" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
                            />
                          </svg>
                          <span className="text-xs font-medium">Generate</span>
                        </button>
                      </div>

                      <Textarea
                        value={newDraftContent}
                        onChange={(e) => setNewDraftContent(e.target.value)}
                        placeholder="Enter draft situation report..."
                        className="bg-input-background border-border min-h-[120px] resize-none"
                      />
                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            // Save draft logic would go here
                            setIsAddingDraft(false);
                            setNewDraftContent('');
                          }}
                          className="bg-primary hover:bg-primary/90 px-6 py-0.5 h-auto text-sm"
                        >
                          Save Draft
                        </Button>
                        <Button
                          onClick={() => {
                            setIsAddingDraft(false);
                            setNewDraftContent('');
                          }}
                          variant="outline"
                          className="border-border px-6 py-0.5 h-auto text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Draft SITREPs List */}
                  {draftSitreps.length > 0 ? (
                    <div className="space-y-3">
                      {draftSitreps.map((draft) => (
                        <div key={draft.id} className="border border-border rounded-lg overflow-hidden bg-background/30">
                          <div className="p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="caption text-white font-semibold">Draft SITREP</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="caption text-amber-500 text-xs">{draft.status}</span>
                                  </div>
                                </div>
                                <span className="caption text-white/70 text-xs block">
                                  Submitted: {draft.submittedDate}
                                </span>
                              </div>
                              <button
                                className="p-1 hover:bg-muted/30 rounded transition-colors"
                                title="Edit Draft"
                              >
                                <Edit2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                            <div className="bg-input-background border border-border rounded p-3">
                              <p className="caption text-white whitespace-pre-wrap">
                                {draft.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-input-background border border-border rounded p-3 min-h-[120px] flex items-center justify-center">
                      <p className="caption text-white/70">
                        No draft SITREPs. Click "+ Add Draft" to create one.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Data Sources List */}
      <div className="space-y-4">
        {filtered.map((source) => {
          const isExpanded = expandedSources.has(source.id);
          return (
            <div
              key={source.id}
              className="border border-border rounded-lg overflow-hidden"
              style={{ background: 'linear-gradient(90deg, rgba(2, 163, 254, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)' }}
            >
              <div className={`p-3 ${isExpanded ? 'border-b border-border' : ''}`}>
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-start gap-2 flex-1 cursor-pointer"
                    onClick={() => {
                      toggleSource(source.id);
                      if (onAddAIContext) {
                        onAddAIContext(source.name);
                      }
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className="caption text-white">{source.name}</span>
                      {!isExpanded && (
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(source.status) }} />
                            <span className="caption" style={{ color: getStatusColor(source.status) }}>{source.status}</span>
                          </div>
                          <span className="caption text-white/70">Last updated: {source.lastUpdated}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Export data source:', source.name);
                        // Placeholder for export functionality
                      }}
                      className="p-1 hover:bg-muted/30 rounded transition-colors"
                      title="Export data source"
                    >
                      <Download className="w-3 h-3 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Simulate refresh
                        const updatedSources = dataSources.map(s => 
                          s.id === source.id 
                            ? { ...s, lastUpdated: new Date().toLocaleString('en-US', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                              }).replace(',', '') }
                            : s
                        );
                        persist(updatedSources);
                      }}
                      className="p-1 hover:bg-muted/30 rounded transition-colors"
                      title="Refresh data source"
                    >
                      <RefreshCw className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-4 bg-card/50">
                  {source.description && (
                    <div>
                      <label className="text-white mb-1 block">Description</label>
                      <p className="caption text-white">{source.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-white mb-1 block">Last Updated</label>
                    <p className="caption text-white">{source.lastUpdated}</p>
                  </div>
                  {source.dataSources && (
                    <div>
                      <label className="text-white mb-1 block">Data Sources</label>
                      <p className="caption text-white">{source.dataSources}</p>
                    </div>
                  )}
                  
                  {/* Child Incidents - Only for Active Incidents item */}
                  {source.id === 'src0' && (
                    <div className="mt-4">
                      <label className="caption text-white mb-2 block">Active Incidents</label>
                      <div className="space-y-3">
                        {/* Child Incident 1 */}
                        <div
                          className="border border-border/50 rounded-lg overflow-hidden"
                          style={{ backgroundColor: 'rgba(139, 123, 168, 0.15)' }}
                        >
                          <div
                            className="p-3 cursor-pointer"
                            onClick={() => toggleChildIncident('child-incident-1')}
                          >
                            <div className="flex items-start gap-2">
                              {expandedChildIncidents.has('child-incident-1') ? (
                                <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <span className="caption text-white">Oahu Substation Fire — Kapolei Power Grid</span>
                                {!expandedChildIncidents.has('child-incident-1') && (
                                  <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-red-500" />
                                      <span className="caption text-red-500">Critical</span>
                                    </div>
                                    <span className="caption text-white/70">Emergency Restoration</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {expandedChildIncidents.has('child-incident-1') && (
                            <div className="p-3 space-y-3 bg-card/30">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Incident Type</label>
                                  <p className="caption text-white">Grid Infrastructure Failure</p>
                                </div>
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Severity</label>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="caption text-red-500">Critical</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Status</label>
                                  <p className="caption text-white">Emergency Restoration</p>
                                </div>
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Incident Commander</label>
                                  <p className="caption text-white">Sarah Nakamura, HECO</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Child Incident 2 */}
                        <div
                          className="border border-border/50 rounded-lg overflow-hidden"
                          style={{ backgroundColor: 'rgba(139, 123, 168, 0.15)' }}
                        >
                          <div
                            className="p-3 cursor-pointer"
                            onClick={() => toggleChildIncident('child-incident-2')}
                          >
                            <div className="flex items-start gap-2">
                              {expandedChildIncidents.has('child-incident-2') ? (
                                <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <span className="caption text-white">Maui Wind Farm Turbine Failure — Kahului Energy Complex</span>
                                {!expandedChildIncidents.has('child-incident-2') && (
                                  <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                                      <span className="caption text-orange-500">Major</span>
                                    </div>
                                    <span className="caption text-white/70">Repair Operations</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {expandedChildIncidents.has('child-incident-2') && (
                            <div className="p-3 space-y-3 bg-card/30">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Incident Type</label>
                                  <p className="caption text-white">Renewable Energy Infrastructure</p>
                                </div>
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Severity</label>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                                    <span className="caption text-orange-500">Major</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Status</label>
                                  <p className="caption text-white">Repair Operations</p>
                                </div>
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Incident Commander</label>
                                  <p className="caption text-white">David Tanaka, MECO</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {source.id !== 'src0' && (
                    <div>
                      <label className="text-white mb-1 block">Placeholder Field for Data</label>
                      <p className="caption text-white">Placeholder content</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Data Source Side Panel */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[640px] bg-card overflow-y-auto px-6">
          <SheetHeader>
            <SheetTitle>{editingSourceId ? 'Edit Data Source' : 'Add Data Source'}</SheetTitle>
            <SheetDescription>
              {editingSourceId ? 'Update data source details.' : 'Add a new data source to track.'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6 pb-6">
            <div className="space-y-2">
              <Label className="text-foreground">Name <span className="text-destructive">*</span></Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-input-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Provider <span className="text-destructive">*</span></Label>
              <Input value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} className="bg-input-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Update Frequency</Label>
              <Input value={formData.updateFrequency} onChange={(e) => setFormData({ ...formData, updateFrequency: e.target.value })} className="bg-input-background border-border" placeholder="e.g., Every 5 minutes" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Coverage</Label>
              <Input value={formData.coverage} onChange={(e) => setFormData({ ...formData, coverage: e.target.value })} className="bg-input-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Reliability</Label>
              <Input value={formData.reliability} onChange={(e) => setFormData({ ...formData, reliability: e.target.value })} className="bg-input-background border-border" placeholder="e.g., 99.9% uptime" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-input-background border-border min-h-[120px] resize-none" />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={saveSource} className="flex-1 bg-primary hover:bg-primary/90">{editingSourceId ? 'Update Source' : 'Add Source'}</Button>
              <Button onClick={() => setIsSheetOpen(false)} variant="outline" className="flex-1 border-border">Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
