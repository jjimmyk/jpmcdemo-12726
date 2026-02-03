import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight, Edit2, Trash2, RefreshCw, Check, Download, Plus, ExternalLink } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  const [selectedRegion, setSelectedRegion] = useState<string>('sector-new-york');
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
  const [selectedRegionDraft, setSelectedRegionDraft] = useState<string>('sector-new-york');
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
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [modalDraftTab, setModalDraftTab] = useState<number>(1);
  const [modalDraftContents, setModalDraftContents] = useState<Record<number, string>>({
    1: '',
    2: '',
    3: '',
    4: '',
    5: ''
  });
  const [draftDataSources, setDraftDataSources] = useState<string[]>([]);
  const [dataSourcesOpen, setDataSourcesOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [filesSubmenuOpen, setFilesSubmenuOpen] = useState(false);
  const filesItemRef = useRef<HTMLDivElement>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [filePreviewModal, setFilePreviewModal] = useState<string | null>(null);
  
  // Modal-specific data sources state
  const [modalDataSourcesOpen, setModalDataSourcesOpen] = useState(false);
  const [modalSelectedFiles, setModalSelectedFiles] = useState<string[]>([]);
  const [modalFilesSubmenuOpen, setModalFilesSubmenuOpen] = useState(false);
  const modalFilesItemRef = useRef<HTMLDivElement>(null);
  const [modalSubmenuPosition, setModalSubmenuPosition] = useState<{ top: number; left: number } | null>(null);
  
  // SITREP tabs state
  const [activeSitrepTab, setActiveSitrepTab] = useState<number>(1);
  const [activeDraftTab, setActiveDraftTab] = useState<number>(1);
  
  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filesSubmenuOpen && filesItemRef.current && !filesItemRef.current.contains(target)) {
        // Check if click is outside both the Files item and the submenu
        const submenuElement = document.querySelector('[data-submenu="files"]');
        if (submenuElement && !submenuElement.contains(target)) {
          setFilesSubmenuOpen(false);
        }
      }
      if (modalFilesSubmenuOpen && modalFilesItemRef.current && !modalFilesItemRef.current.contains(target)) {
        // Check if click is outside both the Files item and the submenu (modal version)
        const submenuElement = document.querySelector('[data-submenu="files-modal"]');
        if (submenuElement && !submenuElement.contains(target)) {
          setModalFilesSubmenuOpen(false);
        }
      }
    };

    if (filesSubmenuOpen || modalFilesSubmenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [filesSubmenuOpen, modalFilesSubmenuOpen]);
  
  // Draft content for each tab
  const [draftTabContents, setDraftTabContents] = useState<Record<number, string>>({
    1: '',
    2: '',
    3: '',
    4: '',
    5: ''
  });
  
  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

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
    { id: 'platform-shutdown-alpha', name: 'Platform Alpha Emergency Shutdown - Block 847' },
    { id: 'pipeline-leak-response', name: 'Subsea Pipeline Leak Response - Deepwater Corridor' },
    { id: 'hurricane-preparedness', name: 'Hurricane Delta Production Shutdown Protocol' },
    { id: 'well-control-incident', name: 'Well Control Event - Mobile Drilling Unit Genesis' },
    { id: 'vessel-collision-response', name: 'Supply Vessel Collision - Platform Bravo' }
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
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="caption text-white/70 text-xs block">
                        Authored by LCDR Sarah Mitchell at 14:30 UTC 19 DEC 2025
                      </span>
                      <span className="caption text-white/70 text-xs block">
                        Approved by CDR Thomas Bradley at 15:00 UTC 19 DEC 2025
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSitrepViewMode('drafts');
                        setIsAddingDraft(true);
                      }}
                      className="bg-[#01669f] h-[22.75px] rounded-[4px] px-3 hover:bg-[#01669f]/90 transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="text-white text-xs">+</span>
                      <span className="caption text-white">Add Draft</span>
                    </button>
                  </div>
                  
                  {/* SITREP Tabs */}
                  <div className="flex items-center gap-1 mt-3 border-b border-border">
                    {[1, 2, 3, 4, 5].map((tabNum) => {
                      const isActive = tabNum === activeSitrepTab;
                      return (
                        <button
                          key={tabNum}
                          onClick={() => setActiveSitrepTab(tabNum)}
                          className={`relative px-4 py-2 transition-colors whitespace-nowrap ${
                            isActive
                              ? 'text-accent'
                              : 'text-foreground hover:text-accent'
                          }`}
                        >
                          <span className="caption">Tab {tabNum}</span>
                          {/* Active indicator line */}
                          {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {sitrepLastUpdated && (
                    <span className="caption text-white/70 block">
                      Last updated {sitrepLastUpdated} by {sitrepLastUpdatedBy}
                    </span>
                  )}
                  {filterMode === 'region' && selectedRegion === 'west-coast' && (
                    <div className="space-y-1 mt-2">
                      <p className="caption text-white/70 text-xs">
                        Written by: CAPT Jennifer Morrison at 08:45 UTC 19 DEC 2025
                      </p>
                      <p className="caption text-white/70 text-xs">
                        Approved by: CDR Thomas Bradley at 09:30 UTC 19 JUN 2026
                      </p>
                    </div>
                  )}
                </div>

                {/* Content - View or Edit mode */}
                {sitrepEditMode ? (
                  <>
                    <Textarea
                      value={sitrepDraft}
                      onChange={(e) => setSitrepDraft(e.target.value)}
                      placeholder="Enter situation report..."
                      className="bg-input-background border-border min-h-[240px] resize-none"
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
                  <>
                    {filterMode === 'region' && selectedRegion === 'west-coast' ? (
                      <div className="bg-input-background border border-border rounded p-3 min-h-[240px]">
                        <div className="caption text-white whitespace-pre-wrap">
                          {activeSitrepTab === 1 && (
                            <div>
                              <p className="font-semibold mb-2">Part 1: Executive Summary</p>
                              <p>This is placeholder content for Part 1 of the SITREP. This section would typically contain an executive summary of the situation report, providing a high-level overview of the current operational status, key developments, and critical information for decision-makers.</p>
                            </div>
                          )}
                          {activeSitrepTab === 2 && (
                            <div>
                              <p className="font-semibold mb-2">Part 2: Current Situation</p>
                              <p>This is placeholder content for Part 2 of the SITREP. This section would detail the current operational situation including weather conditions, vessel traffic, port status, and any active incidents or concerns affecting the area of responsibility.</p>
                            </div>
                          )}
                          {activeSitrepTab === 3 && (
                            <div>
                              <p className="font-semibold mb-2">Part 3: Operational Status</p>
                              <p>This is placeholder content for Part 3 of the SITREP. This section would provide detailed information about unit deployments, ongoing operations, search and rescue activities, and the operational readiness of all assets in the region.</p>
                            </div>
                          )}
                          {activeSitrepTab === 4 && (
                            <div>
                              <p className="font-semibold mb-2">Part 4: Resources & Assets</p>
                              <p>This is placeholder content for Part 4 of the SITREP. This section would outline available resources, asset allocation, equipment status, personnel readiness, and any resource constraints or logistical considerations.</p>
                            </div>
                          )}
                          {activeSitrepTab === 5 && (
                            <div>
                              <p className="font-semibold mb-2">Part 5: Notable Events & Next Steps</p>
                              <p>This is placeholder content for Part 5 of the SITREP. This section would highlight significant events from the operational period, completed exercises or assessments, and outline planned activities and next operational steps.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-input-background border border-border rounded p-3 min-h-[480px]">
                        <p className="caption text-white whitespace-pre-wrap">
                          {filterMode === 'region' && selectedRegion === 'sector-new-york' 
                            ? (sitrepContent || `SITUATION REPORT - SECTOR NEW YORK
DHS World Cup Security Operations - NYC Metro Area
DTG: 281430Z JUN 2026

EXECUTIVE SUMMARY:
Sector New York maintains elevated security posture for FIFA World Cup 2026 operations. All maritime security zones active around NYC waterfront venues. Enhanced port security protocols in effect. Coordination with NYPD, Port Authority, and international maritime partners operating at full capacity. No credible maritime threats identified in past 24 hours.

CURRENT SITUATION:
- Weather: Partly cloudy, seas 2-3 ft, winds SW 10-15 kts, visibility 8+ nm
- Maritime Security Zones: 7 of 7 active (Hudson River, East River, NY Harbor)
- Vessel Traffic: 127 commercial vessels monitored, 18 spectator vessels permitted
- Personnel: 85 DHS maritime agents, 12 USCG vessels on patrol, 240 NYPD Harbor Unit
- Air Support: 2 CBP helicopters on station, 1 USCG MH-65 on standby

OPERATIONAL STATUS:
Port Security Operations: All ferry terminals implementing enhanced screening. Cargo operations proceeding normally with additional CBP inspections. No delays reported at major terminals.

Maritime Patrol Operations: USCG cutters maintaining continuous presence in Upper Bay and East River. Small boat teams positioned at stadium-adjacent waterways. AIS monitoring 100% of vessel traffic.

Waterborne Spectator Management: Permitted spectator vessels (18) checked in and escorted to designated viewing areas. No unauthorized vessels within restricted zones. Harbor Police enforcing 500-meter security perimeter.

CBRN Maritime Detection: Radiation detection buoys deployed at key chokepoints. Mobile CBRN teams aboard patrol vessels. All readings within normal parameters.

NOTABLE EVENTS:
- Completed pre-match maritime security sweep (all zones clear)
- Interdicted 3 unauthorized recreational vessels attempting to enter security zone
- Coordinated VIP yacht arrival for FIFA delegation at Pier 79
- Joint exercise with NYPD Harbor Unit demonstrated rapid response capability

NEXT 4 HOURS:
- Monitor increased ferry traffic during match conclusion
- Maintain security zones through post-match dispersal
- Coordinate with TSA for waterfront transit security
- Prepare for evening VIP yacht departures

POC: Sector New York Command Center +1-212-668-7000 | sectny.ops@uscg.mil`)
                            : `SITUATION REPORT - FIFA WORLD CUP 2026 SECURITY OPERATIONS
DHS Northeast Region - MetLife Stadium Complex
DTG: 281400Z JUN 2026

EXECUTIVE SUMMARY:
All security checkpoints operational for USA vs Mexico quarterfinal match. Enhanced threat posture maintained with no credible threats identified in past 24 hours. Screening operations proceeding on schedule. 68,000 spectators expected. Coordination with state/local law enforcement and international partners remains strong.

CURRENT SITUATION:
- Weather: Clear skies, temp 78°F, winds light and variable, excellent visibility
- Security Checkpoints: 24 of 24 operational (100% capacity)
- Screening Rate: 2,400 persons/hour average across all entry points
- Personnel: 240 DHS agents on-site, 850 state/local LEO coordinated
- Air Space: TFR active 30nm radius, 2 CBP Air interdiction assets overhead

OPERATIONAL STATUS:
TSA Screening Operations: All 16 magnetometer lanes operational. Enhanced explosive trace detection deployed. K-9 teams positioned at primary screening zones. Average wait time 18 minutes.

CBP Credential Verification: Document authentication teams processing international spectators and credentialed personnel. 2,847 credentials verified, 3 counterfeit documents interdicted.

Secret Service Protection Detail: CAT teams positioned at venue perimeter. Counter-sniper teams deployed at elevated positions. POTUS/VIP arrivals scheduled for 1445L.

CBRN Detection Network: 12 radiation portal monitors active at all entry points. Bio-detection systems operational in HVAC systems. All readings nominal.

NOTABLE EVENTS:
- Completed pre-match security sweep (all public areas clear)
- Successfully processed early entry VIP delegation of 150 FIFA officials
- Counter-UAS system detected and neutralized 2 unauthorized drone incursions
- Joint Terrorism Task Force maintains real-time intelligence sharing with FBI

NEXT 4 HOURS:
- Monitor crowd arrival surge (peak expected 1300-1430L)
- Coordinate mass transit security with TSA Surface Division
- Maintain elevated surveillance posture through match conclusion
- Prepare for post-match egress security operations

POC: DHS Operations Center +1-202-282-8000 | worldcup.ops@hq.dhs.gov`}
                        </p>
                      </div>
                    )}
                  </>
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
                    <div className="bg-input-background border border-border rounded p-3 min-h-[240px] flex items-center justify-center">
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
                      onClick={() => setIsDraftModalOpen(true)}
                      className="bg-[#01669f] h-[22.75px] rounded-[4px] px-3 hover:bg-[#01669f]/90 transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="text-white text-xs">+</span>
                      <span className="caption text-white">Add Draft</span>
                    </button>
                  </div>

                  {/* Add Draft Form */}
                  {isAddingDraft && (
                    <div className="space-y-3 p-3 bg-background/50 border border-border rounded">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <Label className="text-white text-sm">New Draft SITREP</Label>
                      </div>

                      {/* Draft SITREP Tabs */}
                      <div className="flex items-center gap-1 border-b border-border">
                        {[1, 2, 3, 4, 5].map((tabNum) => {
                          const isActive = tabNum === activeDraftTab;
                          return (
                            <button
                              key={tabNum}
                              onClick={() => setActiveDraftTab(tabNum)}
                              className={`relative px-4 py-2 transition-colors whitespace-nowrap ${
                                isActive
                                  ? 'text-accent'
                                  : 'text-foreground hover:text-accent'
                              }`}
                            >
                              <span className="caption">Tab {tabNum}</span>
                              {/* Active indicator line */}
                              {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Generate Button and Data Sources */}
                      <div className="flex gap-2">
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
                          <span className="text-xs font-medium">Generate Draft: Tab {activeDraftTab}</span>
                        </button>
                        
                        {/* Data Sources Multi-Select */}
                        <Popover open={dataSourcesOpen} onOpenChange={setDataSourcesOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-[28px] justify-start text-left font-normal bg-input-background border-border text-white"
                            >
                              {draftDataSources.length > 0 
                                ? `${draftDataSources.length} source${draftDataSources.length > 1 ? 's' : ''} selected` 
                                : 'Select data sources'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-[200px] p-0 bg-[#222529] border-[#6e757c]" style={{ zIndex: 9999 }}>
                            <Command className="bg-[#222529]">
                              <CommandList>
                                <CommandEmpty className="text-white">No sources found.</CommandEmpty>
                                <CommandGroup>
                                  {['Web', 'USCG Organization Data', 'Incident Data'].map((source) => (
                                    <CommandItem
                                      key={source}
                                      onSelect={() => {
                                        setDraftDataSources(prev =>
                                          prev.includes(source)
                                            ? prev.filter(s => s !== source)
                                            : [...prev, source]
                                        );
                                      }}
                                      className="text-white"
                                    >
                                      <Checkbox
                                        checked={draftDataSources.includes(source)}
                                        className="mr-2"
                                      />
                                      {source}
                                    </CommandItem>
                                  ))}
                                  
                                  {/* Files Item */}
                                  <div ref={filesItemRef}>
                                    <CommandItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                      }}
                                      onMouseEnter={() => {
                                        if (filesItemRef.current) {
                                          const rect = filesItemRef.current.getBoundingClientRect();
                                          setSubmenuPosition({
                                            top: rect.top,
                                            left: rect.right + 4
                                          });
                                        }
                                        setFilesSubmenuOpen(true);
                                      }}
                                      className="text-white cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={selectedFiles.length > 0}
                                        className="mr-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const checked = selectedFiles.length === 0;
                                          if (checked) {
                                            setSelectedFiles(['File Alpha', 'File Bravo', 'File Charlie', 'File Delta', 'File Echo']);
                                            if (!draftDataSources.includes('Files')) {
                                              setDraftDataSources(prev => [...prev, 'Files']);
                                            }
                                          } else {
                                            setSelectedFiles([]);
                                            setDraftDataSources(prev => prev.filter(s => s !== 'Files'));
                                          }
                                        }}
                                      />
                                      <span className="flex-1">Files</span>
                                      <ChevronRight className="w-4 h-4 ml-auto" />
                                    </CommandItem>
                                  </div>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        
                        {/* Files Submenu - Rendered Outside */}
                        {filesSubmenuOpen && submenuPosition && (
                          <div 
                            data-submenu="files"
                            className="fixed w-[200px] bg-[#222529] border border-[#6e757c] rounded-md shadow-lg"
                            style={{ 
                              zIndex: 10001,
                              left: `${submenuPosition.left}px`,
                              top: `${submenuPosition.top}px`
                            }}
                          >
                            <Command className="bg-[#222529]">
                              <CommandList>
                                <CommandGroup>
                                  {['File Alpha', 'File Bravo', 'File Charlie', 'File Delta', 'File Echo'].map((file) => (
                                    <CommandItem
                                      key={file}
                                      onSelect={() => {
                                        setSelectedFiles(prev => {
                                          const newFiles = prev.includes(file)
                                            ? prev.filter(f => f !== file)
                                            : [...prev, file];
                                          
                                          // Update data sources based on file selection
                                          if (newFiles.length > 0 && !draftDataSources.includes('Files')) {
                                            setDraftDataSources(prevSources => [...prevSources, 'Files']);
                                          } else if (newFiles.length === 0) {
                                            setDraftDataSources(prevSources => prevSources.filter(s => s !== 'Files'));
                                          }
                                          
                                          return newFiles;
                                        });
                                      }}
                                      className="text-white"
                                    >
                                      <Checkbox
                                        checked={selectedFiles.includes(file)}
                                        className="mr-2"
                                      />
                                      <span className="flex-1">{file}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFilePreviewModal(file);
                                        }}
                                        className="ml-2 p-1 hover:bg-muted/50 rounded transition-colors"
                                        title="Open in modal"
                                      >
                                        <ExternalLink className="w-3 h-3 text-white" />
                                      </button>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </div>
                        )}
                      </div>

                      <Textarea
                        value={draftTabContents[activeDraftTab]}
                        onChange={(e) => setDraftTabContents({
                          ...draftTabContents,
                          [activeDraftTab]: e.target.value
                        })}
                        placeholder={`Enter content for Tab ${activeDraftTab}...`}
                        className="bg-input-background border-border resize-none"
                        style={{ minHeight: '240px', height: '240px' }}
                      />
                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            // Save draft logic would go here
                            setIsAddingDraft(false);
                            setDraftTabContents({ 1: '', 2: '', 3: '', 4: '', 5: '' });
                            setActiveDraftTab(1);
                            setSelectedTemplate('');
                          }}
                          className="bg-primary hover:bg-primary/90 px-6 py-0.5 h-auto text-sm"
                        >
                          Save Draft
                        </Button>
                        <Button
                          onClick={() => {
                            setIsAddingDraft(false);
                            setDraftTabContents({ 1: '', 2: '', 3: '', 4: '', 5: '' });
                            setActiveDraftTab(1);
                            setSelectedTemplate('');
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
                    <div className="bg-input-background border border-border rounded p-3 min-h-[240px] flex items-center justify-center">
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
                  {/* Only show these sections for non-Active Incidents items */}
                  {source.id !== 'src0' && (
                    <>
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
                    </>
                  )}
                  
                  {/* Child Incidents - Only for Active Incidents item */}
                  {source.id === 'src0' && (
                    <div className="mt-4">
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
                                <span className="caption text-white">Platform Charlie Gas Leak — Block 892 Production Facility</span>
                                {!expandedChildIncidents.has('child-incident-1') && (
                                  <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-red-500" />
                                      <span className="caption text-red-500">Critical</span>
                                    </div>
                                    <span className="caption text-white/70">Emergency Response Active</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {expandedChildIncidents.has('child-incident-1') && (
                            <div className="p-3 space-y-3 bg-card/30">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Incident Category</label>
                                  <p className="caption text-white">Offshore Production Facility Emergency</p>
                                </div>
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Operational Period</label>
                                  <p className="caption text-white">OP-4: 12/20/2025 06:00 - 12/20/2025 18:00</p>
                                </div>
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Incident Commander</label>
                                  <p className="caption text-white">Robert Martinez, ExxonMobil</p>
                                </div>
                                <div>
                                  <label className="caption text-white/70 mb-1 block">SITREP</label>
                                  <p className="caption text-white">SITREP #8 - Published 12/20/2025 13:45</p>
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
                                <span className="caption text-white">Subsea Pipeline Inspection — Deepwater Export Line 7</span>
                                {!expandedChildIncidents.has('child-incident-2') && (
                                  <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                                      <span className="caption text-orange-500">Major</span>
                                    </div>
                                    <span className="caption text-white/70">ROV Survey in Progress</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {expandedChildIncidents.has('child-incident-2') && (
                            <div className="p-3 space-y-3 bg-card/30">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Incident Category</label>
                                  <p className="caption text-white">Subsea Infrastructure Inspection</p>
                                </div>
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Operational Period</label>
                                  <p className="caption text-white">OP-4: 12/20/2025 06:00 - 12/20/2025 18:00</p>
                                </div>
                                <div>
                                  <label className="caption text-white/70 mb-1 block">Incident Commander</label>
                                  <p className="caption text-white">Jennifer Chen, ExxonMobil</p>
                                </div>
                                <div>
                                  <label className="caption text-white/70 mb-1 block">SITREP</label>
                                  <p className="caption text-white">SITREP #5 - Published 12/20/2025 12:15</p>
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

      {/* Draft SITREP Modal */}
      <Dialog open={isDraftModalOpen} onOpenChange={setIsDraftModalOpen}>
        <DialogContent className="bg-[#222529] border-[#6e757c] text-white overflow-hidden flex flex-col" style={{ maxWidth: '71vw', maxHeight: '71vh', width: '71vw' }}>
          <DialogHeader>
            <DialogTitle className="text-white">New Draft SITREP: AOR Alpha</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Draft SITREP Tabs */}
            <div className="flex items-center gap-1 border-b border-border">
              {[1, 2, 3, 4, 5].map((tabNum) => {
                const isActive = tabNum === modalDraftTab;
                const tabNames: { [key: number]: string } = {
                  1: 'Contact Info',
                  2: 'Executive Summary',
                  3: 'Tab 3',
                  4: 'Tab 4',
                  5: 'Tab 5'
                };
                return (
                  <button
                    key={tabNum}
                    onClick={() => setModalDraftTab(tabNum)}
                    className={`relative px-4 py-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-accent'
                        : 'text-foreground hover:text-accent'
                    }`}
                  >
                    <span className="caption">{tabNames[tabNum]}</span>
                    {/* Active indicator line */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
                    )}
                  </button>
                );
              })}
              
              {/* Add Section Button */}
              <button
                onClick={() => {
                  // Placeholder - does nothing for now
                  console.log('Add section clicked');
                }}
                className="px-3 py-2 text-white/70 hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <span className="text-lg leading-none">+</span>
                <span className="caption text-xs">Add Section</span>
              </button>
            </div>

            {/* Data Sources and Generate Button */}
            <div className="flex gap-3">
              {/* Data Sources Multi-Select */}
              <Popover open={modalDataSourcesOpen} onOpenChange={setModalDataSourcesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-[28px] justify-start text-left font-normal bg-input-background border-border text-white"
                  >
                    {draftDataSources.length > 0 
                      ? `${draftDataSources.length} source${draftDataSources.length > 1 ? 's' : ''} selected` 
                      : '+ Select data sources'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[200px] p-0 bg-[#222529] border-[#6e757c]" style={{ zIndex: 9999 }}>
                  <Command className="bg-[#222529]">
                    <CommandList>
                      <CommandEmpty className="text-white">No sources found.</CommandEmpty>
                      <CommandGroup>
                        {['Web', 'USCG Organization Data', 'Incident Data'].map((source) => (
                          <CommandItem
                            key={source}
                            onSelect={() => {
                              setDraftDataSources(prev =>
                                prev.includes(source)
                                  ? prev.filter(s => s !== source)
                                  : [...prev, source]
                              );
                            }}
                            className="text-white"
                          >
                            <Checkbox
                              checked={draftDataSources.includes(source)}
                              className="mr-2"
                            />
                            {source}
                          </CommandItem>
                        ))}
                        
                        {/* Files Item */}
                        <div ref={modalFilesItemRef}>
                          <CommandItem
                            onSelect={(e) => {
                              e.preventDefault();
                            }}
                            onMouseEnter={() => {
                              if (modalFilesItemRef.current) {
                                const rect = modalFilesItemRef.current.getBoundingClientRect();
                                setModalSubmenuPosition({
                                  top: rect.top,
                                  left: rect.right + 4
                                });
                              }
                              setModalFilesSubmenuOpen(true);
                            }}
                            className="text-white cursor-pointer"
                          >
                            <Checkbox
                              checked={modalSelectedFiles.length > 0}
                              className="mr-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                const checked = modalSelectedFiles.length === 0;
                                if (checked) {
                                  setModalSelectedFiles(['File Alpha', 'File Bravo', 'File Charlie', 'File Delta', 'File Echo']);
                                  if (!draftDataSources.includes('Files')) {
                                    setDraftDataSources(prev => [...prev, 'Files']);
                                  }
                                } else {
                                  setModalSelectedFiles([]);
                                  setDraftDataSources(prev => prev.filter(s => s !== 'Files'));
                                }
                              }}
                            />
                            <span className="flex-1">Files</span>
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          </CommandItem>
                        </div>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Generate Button */}
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
                <span className="text-xs font-medium">Generate Draft: {
                  modalDraftTab === 1 ? 'Contact Info' :
                  modalDraftTab === 2 ? 'Executive Summary' :
                  `Tab ${modalDraftTab}`
                }</span>
              </button>
              
              {/* Files Submenu - Rendered Outside */}
              {modalFilesSubmenuOpen && modalSubmenuPosition && (
                <div 
                  data-submenu="files-modal"
                  className="fixed w-[200px] bg-[#222529] border border-[#6e757c] rounded-md shadow-lg"
                  style={{ 
                    zIndex: 10001,
                    left: `${modalSubmenuPosition.left}px`,
                    top: `${modalSubmenuPosition.top}px`
                  }}
                >
                  <Command className="bg-[#222529]">
                    <CommandList>
                      <CommandGroup>
                        {['File Alpha', 'File Bravo', 'File Charlie', 'File Delta', 'File Echo'].map((file) => (
                          <CommandItem
                            key={file}
                            onSelect={() => {
                              setModalSelectedFiles(prev => {
                                const newFiles = prev.includes(file)
                                  ? prev.filter(f => f !== file)
                                  : [...prev, file];
                                
                                // Update data sources based on file selection
                                if (newFiles.length > 0 && !draftDataSources.includes('Files')) {
                                  setDraftDataSources(prevSources => [...prevSources, 'Files']);
                                } else if (newFiles.length === 0) {
                                  setDraftDataSources(prevSources => prevSources.filter(s => s !== 'Files'));
                                }
                                
                                return newFiles;
                              });
                            }}
                            className="text-white"
                          >
                            <Checkbox
                              checked={modalSelectedFiles.includes(file)}
                              className="mr-2"
                            />
                            <span className="flex-1">{file}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilePreviewModal(file);
                              }}
                              className="ml-2 p-1 hover:bg-muted/50 rounded transition-colors"
                              title="Open in modal"
                            >
                              <ExternalLink className="w-3 h-3 text-white" />
                            </button>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>

            {/* Text Styler/Editor Placeholder */}
            <div className="text-white/50 text-sm">
              [placeholder for text styler/editor component eg tinyMCE]
            </div>

            <div className="relative">
              <Textarea
                value={modalDraftContents[modalDraftTab]}
                onChange={(e) => setModalDraftContents({
                  ...modalDraftContents,
                  [modalDraftTab]: e.target.value
                })}
                placeholder={`Enter content for ${
                  modalDraftTab === 1 ? 'Contact Info' :
                  modalDraftTab === 2 ? 'Executive Summary' :
                  `Tab ${modalDraftTab}`
                }...`}
                className="bg-input-background border-border text-white resize-none"
                style={{ minHeight: '20vh' }}
              />
              <div className="absolute bottom-2 right-2 text-white/50 text-xs">
                Word Limit {modalDraftTab === 2 ? '250' : '100'}
              </div>
            </div>
            
            {/* Attach Files Button */}
            <div className="flex gap-3 items-center">
              <button
                onClick={() => {
                  // Attach files logic (placeholder for now)
                  console.log('Attach files clicked');
                }}
                className="text-white hover:text-white border border-white rounded-[4px] px-3 py-1.5 transition-colors flex items-center gap-1"
              >
                <span className="text-lg leading-none">+</span>
                <span className="text-sm">Attach Files to Section: {
                  modalDraftTab === 1 ? 'Contact Info' :
                  modalDraftTab === 2 ? 'Executive Summary' :
                  `Tab ${modalDraftTab}`
                }</span>
              </button>
              
              {/* Attached File Placeholder */}
              <button
                onClick={() => {
                  // Placeholder - does nothing for now
                  console.log('Document Alpha.pdf clicked');
                }}
                className="text-white bg-[#14171a] border border-[#6e757c] rounded-[4px] px-3 py-1.5 hover:bg-[#1a1d21] transition-colors"
              >
                <span className="text-sm">Document Alpha.pdf</span>
              </button>
            </div>
            
            {/* Preview Approval Workflow */}
            <div className="space-y-3">
              <Label className="text-white text-sm">Preview Approval Workflow</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-full text-white font-medium text-sm"
                    style={{ backgroundColor: '#60a5fa' }}
                  >
                    1
                  </div>
                  <span className="text-sm text-white font-medium">Draft Creation</span>
                </div>
                <div className="flex-1 h-[2px] bg-border"></div>
                <div className="flex items-center gap-2">
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-full text-white font-medium text-sm"
                    style={{ backgroundColor: '#6b7280' }}
                  >
                    2
                  </div>
                  <span className="text-sm text-white/70">Section Chief</span>
                </div>
                <div className="flex-1 h-[2px] bg-border"></div>
                <div className="flex items-center gap-2">
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-full text-white font-medium text-sm"
                    style={{ backgroundColor: '#6b7280' }}
                  >
                    3
                  </div>
                  <span className="text-sm text-white/70">Incident Commander</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  // Save draft logic would go here
                  setIsDraftModalOpen(false);
                  setModalDraftContents({ 1: '', 2: '', 3: '', 4: '', 5: '' });
                  setModalDraftTab(1);
                }}
                className="bg-primary hover:bg-primary/90 px-6 py-0.5 h-auto text-sm"
              >
                Save Draft
              </Button>
              <Button
                onClick={() => {
                  setIsDraftModalOpen(false);
                  setModalDraftContents({ 1: '', 2: '', 3: '', 4: '', 5: '' });
                  setModalDraftTab(1);
                }}
                variant="outline"
                className="border-border px-6 py-0.5 h-auto text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      <Dialog open={filePreviewModal !== null} onOpenChange={() => setFilePreviewModal(null)}>
        <DialogContent className="bg-[#222529] border-[#6e757c] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{filePreviewModal}</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <p className="text-white/70">Placeholder for PDF preview</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
