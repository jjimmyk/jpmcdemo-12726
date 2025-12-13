import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ChevronDown, ChevronRight, Edit2, Trash2, Map, Maximize2 } from 'lucide-react';
import svgPaths from '../imports/svg-7hg6d30srz';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

type DataLayersProps = {
  className?: string;
  style?: React.CSSProperties;
  orientation?: 'vertical' | 'horizontal';
  onHandlePointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onCollapse?: () => void;
};

export function DataLayers({ className, style, orientation = 'vertical', onHandlePointerDown, onCollapse }: DataLayersProps) {
  const [myArcGISExpanded, setMyArcGISExpanded] = React.useState(false);
  const [weatherExpanded, setWeatherExpanded] = React.useState(false);
  const [resourcesExpanded, setResourcesExpanded] = React.useState(false);
  const [tacticsExpanded, setTacticsExpanded] = React.useState(false);
  const [grsExpanded, setGrsExpanded] = React.useState(false);
  const [vesselsExpanded, setVesselsExpanded] = React.useState(false);
  const [expandedLayers, setExpandedLayers] = React.useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = React.useState('');
  const [layerToggles, setLayerToggles] = React.useState({
    weather: { radar: true, warnings: true },
    resources: { staging: true, facilities: true },
    tactics: { booms: true, skimmers: false },
    grs: { priority: true, anchor: false },
    vessels: { ais: true, patrol: false },
  });
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [info, setInfo] = React.useState<{
    title: string;
    source: string;
    owner: string;
    created: string;
    lastUpdated: string;
    timezone: string;
    frequency: string;
  } | null>(null);
  const [layerModalOpen, setLayerModalOpen] = React.useState(false);
  const [layerModalCategory, setLayerModalCategory] = React.useState<string | null>(null);
  const [individualLayerModalOpen, setIndividualLayerModalOpen] = React.useState(false);
  const [selectedIndividualLayer, setSelectedIndividualLayer] = React.useState<string | null>(null);

  const toggleLayer = (layerId: string) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  const openLayerModal = (category: string) => {
    setLayerModalCategory(category);
    setLayerModalOpen(true);
  };

  const openIndividualLayerModal = (layerName: string) => {
    setSelectedIndividualLayer(layerName);
    setIndividualLayerModalOpen(true);
  };

  const getLayersForCategory = (category: string) => {
    switch (category) {
      case 'weather':
        return [
          { name: 'Radar Precipitation', checked: layerToggles.weather.radar },
          { name: 'Active Weather Warnings', checked: layerToggles.weather.warnings }
        ];
      case 'resources':
        return [
          { name: 'Staging Areas', checked: layerToggles.resources.staging },
          { name: 'Critical Facilities', checked: layerToggles.resources.facilities }
        ];
      case 'tactics':
        return [
          { name: 'Boom Deployment Lines', checked: layerToggles.tactics.booms },
          { name: 'Skimmer Operations', checked: layerToggles.tactics.skimmers }
        ];
      case 'grs':
        return [
          { name: 'Priority Protection Areas', checked: layerToggles.grs.priority },
          { name: 'Boom Anchor Points', checked: layerToggles.grs.anchor }
        ];
      case 'vessels':
        return [
          { name: 'AIS Vessel Tracks', checked: layerToggles.vessels.ais },
          { name: 'Patrol Sectors', checked: layerToggles.vessels.patrol }
        ];
      default:
        return [];
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'weather': return 'Weather';
      case 'resources': return 'Resources';
      case 'tactics': return 'Tactics';
      case 'grs': return 'Geographic Response Strategies';
      case 'vessels': return 'Vessel Tracks';
      default: return '';
    }
  };

  // Get nested objects for each layer
  const getLayerObjects = (layerName: string): string[] => {
    switch (layerName) {
      case 'Radar Precipitation':
        return ['NEXRAD Station KHGX', 'NEXRAD Station KLCH', 'NEXRAD Station KLIX', 'Composite Mosaic'];
      case 'Active Weather Warnings':
        return ['Gale Warning Zone 1', 'Gale Warning Zone 2', 'Small Craft Advisory Zone 3', 'Marine Weather Statement'];
      case 'Staging Areas':
        return ['Venice Launch Complex', 'Grand Isle Staging Base', 'Cocodrie Equipment Yard', 'Port Fourchon Logistics Hub'];
      case 'Critical Facilities':
        return ['MCBH Kaneohe Bay', 'Tesoro Hawaii Power Plant', 'Honolulu Water Treatment', 'Emergency Operations Center'];
      case 'Boom Deployment Lines':
        return ['Bayou Dularge Boom Line', 'Terrebonne Bay Containment', 'Timbalier Island Protection', 'Grand Isle Shoreline Boom'];
      case 'Skimmer Operations':
        return ['Skimmer Vessel Alpha-1', 'Skimmer Vessel Bravo-2', 'Skimmer Vessel Charlie-3', 'Recovery Platform Delta'];
      case 'Open Action Items':
        return ['Task 204-A: Boom Extension', 'Task 204-B: Wildlife Monitoring', 'Task 204-C: Equipment Procurement', 'Task 215-A: Shoreline Assessment'];
      case 'Completed Action Items':
        return ['Task 201-A: Initial Containment', 'Task 202-B: Unified Command Setup', 'Task 203-C: Personnel Mobilization'];
      case 'Priority Protection Areas':
        return ['Barataria Bay Wetlands', 'Timbalier Island Bird Sanctuary', 'Queen Bess Island Rookery', 'Coastal Marsh Critical Habitat'];
      case 'Boom Anchor Points':
        return ['Anchor Point A-1 (Bayou)', 'Anchor Point A-2 (Channel)', 'Anchor Point B-1 (Pass)', 'Anchor Point B-2 (Inlet)'];
      case 'AIS Vessel Tracks':
        return ['Commercial Traffic', 'Response Vessels', 'Fishing Vessels', 'Recreational Craft'];
      case 'Patrol Sectors':
        return ['Inner Harbor Patrol Zone', 'Outer Bay Patrol Zone', 'Channel Security Zone', 'Exclusion Zone Perimeter'];
      default:
        return ['Object 1', 'Object 2', 'Object 3'];
    }
  };

  const openLayerInfo = (title: string) => {
    // Provide plausible metadata per layer title
    const presets: Record<
      string,
      { source: string; owner: string; created: string; lastUpdated: string; timezone: string; frequency: string }
    > = {
      'Radar Precipitation': {
        source: 'NOAA NEXRAD Composite',
        owner: 'NOAA',
        created: '2022-01-01 00:00',
        lastUpdated: '2025-11-15 14:05',
        timezone: 'UTC',
        frequency: 'Every 5 minutes'
      },
      'Active Weather Warnings': {
        source: 'NOAA Weather Alerts (CAP)',
        owner: 'NOAA',
        created: '2020-05-12 08:00',
        lastUpdated: '2025-11-15 14:02',
        timezone: 'UTC',
        frequency: 'Real-time'
      },
      'Staging Areas': {
        source: 'Incident Logistics GIS (IMS)',
        owner: 'Unified Command - Logistics',
        created: '2025-11-14 09:15',
        lastUpdated: '2025-11-15 13:40',
        timezone: 'UTC',
        frequency: 'Hourly'
      },
      'Critical Facilities': {
        source: 'State Infrastructure GIS',
        owner: 'State EOC - Infrastructure',
        created: '2024-06-01 12:00',
        lastUpdated: '2025-11-15 12:00',
        timezone: 'UTC',
        frequency: 'Daily'
      },
      'Boom Deployment Lines': {
        source: 'Operations Section (Field Mapping)',
        owner: 'Operations - Marine Branch',
        created: '2025-11-15 06:00',
        lastUpdated: '2025-11-15 13:55',
        timezone: 'UTC',
        frequency: 'Ad hoc (as reported)'
      },
      'Skimmer Operations': {
        source: 'Operations Section (Marine)',
        owner: 'Operations - Marine Branch',
        created: '2025-11-15 05:30',
        lastUpdated: '2025-11-15 13:50',
        timezone: 'UTC',
        frequency: 'Ad hoc (as reported)'
      },
      'Open Action Items': {
        source: 'Planning Section (ICS-204/215)',
        owner: 'Planning Section',
        created: '2025-11-14 18:00',
        lastUpdated: '2025-11-15 13:30',
        timezone: 'UTC',
        frequency: 'Per operational update'
      },
      'Completed Action Items': {
        source: 'Planning Section (ICS-204/215)',
        owner: 'Planning Section',
        created: '2025-11-14 18:00',
        lastUpdated: '2025-11-15 13:10',
        timezone: 'UTC',
        frequency: 'Per operational update'
      },
      'Priority Protection Areas': {
        source: 'Environmental Unit (GRP/GRS)',
        owner: 'Environmental Unit',
        created: '2023-03-10 10:00',
        lastUpdated: '2025-11-15 12:45',
        timezone: 'UTC',
        frequency: 'Daily'
      },
      'Boom Anchor Points': {
        source: 'Environmental Unit (Field Survey)',
        owner: 'Environmental Unit',
        created: '2025-11-12 11:25',
        lastUpdated: '2025-11-15 12:20',
        timezone: 'UTC',
        frequency: 'Ad hoc (as surveyed)'
      },
      'AIS Vessel Tracks': {
        source: 'AIS Feed (USCG / Commercial AIS)',
        owner: 'USCG / AIS Providers',
        created: '2019-01-01 00:00',
        lastUpdated: '2025-11-15 14:05',
        timezone: 'UTC',
        frequency: 'Every minute'
      },
      'Patrol Sectors': {
        source: 'USCG Sector Command',
        owner: 'USCG Sector Command',
        created: '2025-11-10 07:00',
        lastUpdated: '2025-11-15 13:25',
        timezone: 'UTC',
        frequency: 'Per shift'
      }
    };
    const meta = presets[title] ?? {
      source: 'Unknown',
      owner: 'Unknown',
      created: 'N/A',
      lastUpdated: 'N/A',
      timezone: 'UTC',
      frequency: 'N/A'
    };
    setInfo({ title, ...meta });
    setInfoOpen(true);
  };

  // counts: selected/total per category
  const weatherSelected = Object.values(layerToggles.weather).filter(Boolean).length;
  const weatherTotal = Object.keys(layerToggles.weather).length;
  const resourcesSelected = Object.values(layerToggles.resources).filter(Boolean).length;
  const resourcesTotal = Object.keys(layerToggles.resources).length;
  const tacticsSelected = Object.values(layerToggles.tactics).filter(Boolean).length;
  const tacticsTotal = Object.keys(layerToggles.tactics).length;
  const grsSelected = Object.values(layerToggles.grs).filter(Boolean).length;
  const grsTotal = Object.keys(layerToggles.grs).length;
  const vesselsSelected = Object.values(layerToggles.vessels).filter(Boolean).length;
  const vesselsTotal = Object.keys(layerToggles.vessels).length;

  return (
    <Card className={`${className ?? ''} flex flex-col relative`} style={style} role="complementary" aria-label="Data Layers">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="relative h-[26px] w-[195px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="box-border w-full h-[26px] bg-transparent border border-[#6e757c] rounded-[4px] px-[26px] py-[3.25px] caption text-white placeholder:text-white focus:outline-none focus:border-accent"
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
          <div className="ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hover:bg-muted"
              onClick={() => onCollapse && onCollapse()}
              title="Collapse data layers"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-[26px] px-3 bg-transparent border-border text-white hover:bg-muted/50"
          >
            + Add Category
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-[26px] px-3 bg-transparent border-border text-white hover:bg-muted/50"
          >
            + Add Layer
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-2">
        {/* My ArcGIS */}
        <div
          className="border border-border rounded-lg overflow-hidden"
          style={{
            background:
              'linear-gradient(90deg, rgba(2, 163, 254, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)',
            ...(orientation === 'horizontal' ? { minWidth: '320px' } : {})
          }}
        >
          <div className={`p-3 ${myArcGISExpanded ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between">
              <div
                className="flex items-start gap-2 flex-1"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => setMyArcGISExpanded((v) => !v)}
                >
                  {myArcGISExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <Label
                  className="cursor-pointer"
                  onClick={() => setMyArcGISExpanded((v) => !v)}
                >
                  My ArcGIS
                </Label>
              </div>
            </div>
          </div>
          {myArcGISExpanded && (
            <div className="p-3 space-y-2">
              {/* Empty for now */}
            </div>
          )}
        </div>

        {/* Weather */}
        <div
          className="border border-border rounded-lg overflow-hidden"
          style={{
            background:
              'linear-gradient(90deg, rgba(2, 163, 254, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)',
            ...(orientation === 'horizontal' ? { minWidth: '320px' } : {})
          }}
        >
          <div className={`p-3 ${weatherExpanded ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between">
              <div
                className="flex items-start gap-2 flex-1"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => setWeatherExpanded((v) => !v)}
                >
                  {weatherExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <Checkbox
                  checked={weatherSelected === weatherTotal}
                  onCheckedChange={(v) => {
                    const allChecked = !!v;
                    setLayerToggles((prev) => ({
                      ...prev,
                      weather: { radar: allChecked, warnings: allChecked },
                    }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginTop: '3px' }}
                />
                <Label
                  className="cursor-pointer"
                  onClick={() => setWeatherExpanded((v) => !v)}
                >
                  Weather
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 hover:bg-muted"
                  onClick={() => openLayerModal('weather')}
                  title="View all layers"
                >
                  <Maximize2 className="w-3 h-3 text-white" />
                </Button>
              </div>
            </div>
          </div>
          {weatherExpanded && (
            <div className="p-3 space-y-2">
              <div className="border border-border/30 rounded-md overflow-hidden bg-card/30">
                <div className="flex items-center gap-3 py-3 px-3">
                  <Checkbox
                    checked={layerToggles.weather.radar}
                    onCheckedChange={(v) =>
                      setLayerToggles((prev) => ({
                        ...prev,
                        weather: { ...prev.weather, radar: !!v },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleLayer('weather-radar')}
                    className="flex items-center gap-1 flex-1 bg-transparent p-0"
                  >
                    {expandedLayers.has('weather-radar') ? (
                      <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />
                    )}
                    <Label className="cursor-pointer flex-1">Radar Precipitation</Label>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIndividualLayerModal('Radar Precipitation');
                    }}
                    title="View layer details"
                  >
                    <Maximize2 className="w-3 h-3 text-white" />
                  </Button>
                  <span
                    className="inline-block w-3 h-3 rounded-[2px]"
                    style={{ backgroundColor: 'rgba(0,123,255,0.35)', border: '1px solid rgba(255,255,255,0.6)' }}
                    aria-hidden
                  />
                </div>
                {expandedLayers.has('weather-radar') && (
                  <div className="px-4 py-4">
                    <div className="text-sm leading-none text-white">
                      Last Updated: 2025-11-15 14:05 UTC
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Type: data layer
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Sources: CART, PRATUS
                    </div>
                  </div>
                )}
              </div>
              <div className="border border-border/30 rounded-md overflow-hidden bg-card/30">
                <div className="flex items-center gap-3 py-3 px-3">
                  <Checkbox
                    checked={layerToggles.weather.warnings}
                    onCheckedChange={(v) =>
                      setLayerToggles((prev) => ({
                        ...prev,
                        weather: { ...prev.weather, warnings: !!v },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleLayer('weather-warnings')}
                    className="flex items-center gap-1 flex-1 bg-transparent p-0"
                  >
                    {expandedLayers.has('weather-warnings') ? (
                      <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />
                    )}
                    <Label className="cursor-pointer flex-1">Active Weather Warnings</Label>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIndividualLayerModal('Active Weather Warnings');
                    }}
                    title="View layer details"
                  >
                    <Maximize2 className="w-3 h-3 text-white" />
                  </Button>
                  <span
                    className="inline-block w-3 h-3 rounded-[2px]"
                    style={{ backgroundColor: 'rgba(220,53,69,0.15)', border: '1px solid rgba(255,255,255,0.6)' }}
                    aria-hidden
                  />
                </div>
                {expandedLayers.has('weather-warnings') && (
                  <div className="px-4 py-4">
                    <div className="text-sm leading-none text-white">
                      Last Updated: 2025-11-15 14:02 UTC
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Type: feature layer
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Sources: FSLTP
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Resources */}
        <div
          className="border border-border rounded-lg overflow-hidden"
          style={{
            background:
              'linear-gradient(90deg, rgba(2, 163, 254, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)',
            ...(orientation === 'horizontal' ? { minWidth: '320px' } : {})
          }}
        >
          <div className={`p-3 ${resourcesExpanded ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between">
              <div
                className="flex items-start gap-2 flex-1"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => setResourcesExpanded((v) => !v)}
                >
                  {resourcesExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <Checkbox
                  checked={resourcesSelected === resourcesTotal}
                  onCheckedChange={(v) => {
                    const allChecked = !!v;
                    setLayerToggles((prev) => ({
                      ...prev,
                      resources: { staging: allChecked, facilities: allChecked },
                    }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginTop: '3px' }}
                />
                <Label
                  className="cursor-pointer"
                  onClick={() => setResourcesExpanded((v) => !v)}
                >
                  Resources
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 hover:bg-muted"
                  onClick={() => openLayerModal('resources')}
                  title="View all layers"
                >
                  <Maximize2 className="w-3 h-3 text-white" />
                </Button>
              </div>
            </div>
          </div>
          {resourcesExpanded && (
            <div className="p-3 space-y-2">
              <div className="border border-border/30 rounded-md overflow-hidden bg-card/30">
                <div className="flex items-center gap-3 py-3 px-3">
                  <Checkbox
                    checked={layerToggles.resources.staging}
                    onCheckedChange={(v) =>
                      setLayerToggles((prev) => ({
                        ...prev,
                        resources: { ...prev.resources, staging: !!v },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleLayer('resources-staging')}
                    className="flex items-center gap-1 flex-1 bg-transparent p-0"
                  >
                    {expandedLayers.has('resources-staging') ? (
                      <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />
                    )}
                    <Label className="cursor-pointer flex-1">Staging Areas</Label>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIndividualLayerModal('Staging Areas');
                    }}
                    title="View layer details"
                  >
                    <Maximize2 className="w-3 h-3 text-white" />
                  </Button>
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: '#22c55e', border: '1px solid rgba(255,255,255,0.6)' }}
                    aria-hidden
                  />
                </div>
                {expandedLayers.has('resources-staging') && (
                  <div className="px-4 py-4">
                    <div className="text-sm leading-none text-white">
                      Last Updated: 2025-11-15 13:40 UTC
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Type: feature layer
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Sources: FSLTP
                    </div>
                  </div>
                )}
              </div>
              <div className="border border-border/30 rounded-md overflow-hidden bg-card/30">
                <div className="flex items-center gap-3 py-3 px-3">
                  <Checkbox
                    checked={layerToggles.resources.facilities}
                    onCheckedChange={(v) =>
                      setLayerToggles((prev) => ({
                        ...prev,
                        resources: { ...prev.resources, facilities: !!v },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleLayer('resources-facilities')}
                    className="flex items-center gap-1 flex-1 bg-transparent p-0"
                  >
                    {expandedLayers.has('resources-facilities') ? (
                      <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />
                    )}
                    <Label className="cursor-pointer flex-1">Critical Facilities</Label>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIndividualLayerModal('Critical Facilities');
                    }}
                    title="View layer details"
                  >
                    <Maximize2 className="w-3 h-3 text-white" />
                  </Button>
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: '#a855f7', border: '1px solid rgba(255,255,255,0.6)' }}
                    aria-hidden
                  />
                </div>
                {expandedLayers.has('resources-facilities') && (
                  <div className="px-4 py-4">
                    <div className="text-sm leading-none text-white">
                      Last Updated: 2025-11-15 12:00 UTC
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Type: feature layer
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Sources: FSLTP
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tactics */}
        <div
          className="border border-border rounded-lg overflow-hidden"
          style={{
            background:
              'linear-gradient(90deg, rgba(2, 163, 254, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)',
            ...(orientation === 'horizontal' ? { minWidth: '320px' } : {})
          }}
        >
          <div className={`p-3 ${tacticsExpanded ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between">
              <div
                className="flex items-start gap-2 flex-1"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => setTacticsExpanded((v) => !v)}
                >
                  {tacticsExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <Checkbox
                  checked={tacticsSelected === tacticsTotal}
                  onCheckedChange={(v) => {
                    const allChecked = !!v;
                    setLayerToggles((prev) => ({
                      ...prev,
                      tactics: { booms: allChecked, skimmers: allChecked },
                    }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginTop: '3px' }}
                />
                <Label
                  className="cursor-pointer"
                  onClick={() => setTacticsExpanded((v) => !v)}
                >
                  Tactics
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 hover:bg-muted"
                  onClick={() => openLayerModal('tactics')}
                  title="View all layers"
                >
                  <Maximize2 className="w-3 h-3 text-white" />
                </Button>
              </div>
            </div>
          </div>
          {tacticsExpanded && (
            <div className="p-3 space-y-2">
              <div className="border border-border/30 rounded-md overflow-hidden bg-card/30">
                <div className="flex items-center gap-3 py-3 px-3">
                  <Checkbox
                    checked={layerToggles.tactics.booms}
                    onCheckedChange={(v) =>
                      setLayerToggles((prev) => ({
                        ...prev,
                        tactics: { ...prev.tactics, booms: !!v },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleLayer('tactics-booms')}
                    className="flex items-center gap-1 flex-1 bg-transparent p-0"
                  >
                    {expandedLayers.has('tactics-booms') ? (
                      <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />
                    )}
                    <Label className="cursor-pointer flex-1">Boom Deployment Lines</Label>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIndividualLayerModal('Boom Deployment Lines');
                    }}
                    title="View layer details"
                  >
                    <Maximize2 className="w-3 h-3 text-white" />
                  </Button>
                  <span
                    className="inline-block"
                    style={{
                      width: '24px',
                      height: '6px',
                      backgroundColor: '#f59e0b',
                      border: '1px solid rgba(255,255,255,0.6)',
                      borderRadius: '3px'
                    }}
                    aria-hidden
                    title="Line symbol"
                  />
                </div>
                {expandedLayers.has('tactics-booms') && (
                  <div className="px-4 py-4">
                    <div className="text-sm leading-none text-white">
                      Last Updated: 2025-11-15 13:55 UTC
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Type: feature layer
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Sources: FSLTP
                    </div>
                  </div>
                )}
              </div>
              <div className="border border-border/30 rounded-md overflow-hidden bg-card/30">
                <div className="flex items-center gap-3 py-3 px-3">
                  <Checkbox
                    checked={layerToggles.tactics.skimmers}
                    onCheckedChange={(v) =>
                      setLayerToggles((prev) => ({
                        ...prev,
                        tactics: { ...prev.tactics, skimmers: !!v },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleLayer('tactics-skimmers')}
                    className="flex items-center gap-1 flex-1 bg-transparent p-0"
                  >
                    {expandedLayers.has('tactics-skimmers') ? (
                      <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />
                    )}
                    <Label className="cursor-pointer flex-1">Skimmer Operations</Label>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIndividualLayerModal('Skimmer Operations');
                    }}
                    title="View layer details"
                  >
                    <Maximize2 className="w-3 h-3 text-white" />
                  </Button>
                  <span
                    className="inline-block"
                    style={{
                      width: '24px',
                      height: '6px',
                      backgroundImage:
                        'repeating-linear-gradient(90deg, #3b82f6 0 8px, transparent 8px 12px)',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255,255,255,0.6)',
                      borderRadius: '3px'
                    }}
                    aria-hidden
                    title="Dashed line symbol"
                  />
                </div>
                {expandedLayers.has('tactics-skimmers') && (
                  <div className="px-4 py-4">
                    <div className="text-sm leading-none text-white">
                      Last Updated: 2025-11-15 13:50 UTC
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Type: feature layer
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Sources: FSLTP
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Geographic Response Strategies */}
        <div
          className="border border-border rounded-lg overflow-hidden"
          style={{
            background:
              'linear-gradient(90deg, rgba(2, 163, 254, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)',
            ...(orientation === 'horizontal' ? { minWidth: '320px' } : {})
          }}
        >
          <div className={`p-3 ${grsExpanded ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between">
              <div
                className="flex items-start gap-2 flex-1"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => setGrsExpanded((v) => !v)}
                >
                  {grsExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <Checkbox
                  checked={grsSelected === grsTotal}
                  onCheckedChange={(v) => {
                    const allChecked = !!v;
                    setLayerToggles((prev) => ({
                      ...prev,
                      grs: { priority: allChecked, anchor: allChecked },
                    }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginTop: '3px' }}
                />
                <Label
                  className="cursor-pointer"
                  onClick={() => setGrsExpanded((v) => !v)}
                >
                  Geographic Response Strategies
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 hover:bg-muted"
                  onClick={() => openLayerModal('grs')}
                  title="View all layers"
                >
                  <Maximize2 className="w-3 h-3 text-white" />
                </Button>
              </div>
            </div>
          </div>
          {grsExpanded && (
            <div className="p-3 space-y-2">
              <div className="border border-border/30 rounded-md overflow-hidden bg-card/30">
                <div className="flex items-center gap-3 py-3 px-3">
                  <Checkbox
                    checked={layerToggles.grs.priority}
                    onCheckedChange={(v) =>
                      setLayerToggles((prev) => ({
                        ...prev,
                        grs: { ...prev.grs, priority: !!v },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleLayer('grs-priority')}
                    className="flex items-center gap-1 flex-1 bg-transparent p-0"
                  >
                    {expandedLayers.has('grs-priority') ? (
                      <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />
                    )}
                    <Label className="cursor-pointer flex-1">Priority Protection Areas</Label>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIndividualLayerModal('Priority Protection Areas');
                    }}
                    title="View layer details"
                  >
                    <Maximize2 className="w-3 h-3 text-white" />
                  </Button>
                  <span
                    className="inline-block w-3 h-3 rounded-[2px]"
                    style={{ backgroundColor: 'rgba(13,148,136,0.35)', border: '1px solid #0d9488' }}
                    aria-hidden
                  />
                </div>
                {expandedLayers.has('grs-priority') && (
                  <div className="px-4 py-4">
                    <div className="text-sm leading-none text-white">
                      Last Updated: 2025-11-15 12:45 UTC
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Type: feature layer
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Sources: FSLTP
                    </div>
                  </div>
                )}
              </div>
              <div className="border border-border/30 rounded-md overflow-hidden bg-card/30">
                <div className="flex items-center gap-3 py-3 px-3">
                  <Checkbox
                    checked={layerToggles.grs.anchor}
                    onCheckedChange={(v) =>
                      setLayerToggles((prev) => ({
                        ...prev,
                        grs: { ...prev.grs, anchor: !!v },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleLayer('grs-anchor')}
                    className="flex items-center gap-1 flex-1 bg-transparent p-0"
                  >
                    {expandedLayers.has('grs-anchor') ? (
                      <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />
                    )}
                    <Label className="cursor-pointer flex-1">Boom Anchor Points</Label>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIndividualLayerModal('Boom Anchor Points');
                    }}
                    title="View layer details"
                  >
                    <Maximize2 className="w-3 h-3 text-white" />
                  </Button>
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: '#ef4444', border: '1px solid rgba(255,255,255,0.6)' }}
                    aria-hidden
                  />
                </div>
                {expandedLayers.has('grs-anchor') && (
                  <div className="px-4 py-4">
                    <div className="text-sm leading-none text-white">
                      Last Updated: 2025-11-15 12:20 UTC
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Type: feature layer
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Sources: FSLTP
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vessel Tracks */}
        <div
          className="border border-border rounded-lg overflow-hidden"
          style={{
            background:
              'linear-gradient(90deg, rgba(2, 163, 254, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)',
            ...(orientation === 'horizontal' ? { minWidth: '320px' } : {})
          }}
        >
          <div className={`p-3 ${vesselsExpanded ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between">
              <div
                className="flex items-start gap-2 flex-1"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => setVesselsExpanded((v) => !v)}
                >
                  {vesselsExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <Checkbox
                  checked={vesselsSelected === vesselsTotal}
                  onCheckedChange={(v) => {
                    const allChecked = !!v;
                    setLayerToggles((prev) => ({
                      ...prev,
                      vessels: { ais: allChecked, patrol: allChecked },
                    }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginTop: '3px' }}
                />
                <Label
                  className="cursor-pointer"
                  onClick={() => setVesselsExpanded((v) => !v)}
                >
                  Vessel Tracks
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 hover:bg-muted"
                  onClick={() => openLayerModal('vessels')}
                  title="View all layers"
                >
                  <Maximize2 className="w-3 h-3 text-white" />
                </Button>
              </div>
            </div>
          </div>
          {vesselsExpanded && (
            <div className="p-3 space-y-2">
              <div className="border border-border/30 rounded-md overflow-hidden bg-card/30">
                <div className="flex items-center gap-3 py-3 px-3">
                  <Checkbox
                    checked={layerToggles.vessels.ais}
                    onCheckedChange={(v) =>
                      setLayerToggles((prev) => ({
                        ...prev,
                        vessels: { ...prev.vessels, ais: !!v },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleLayer('vessels-ais')}
                    className="flex items-center gap-1 flex-1 bg-transparent p-0"
                  >
                    {expandedLayers.has('vessels-ais') ? (
                      <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />
                    )}
                    <Label className="cursor-pointer flex-1">AIS Vessel Tracks</Label>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIndividualLayerModal('AIS Vessel Tracks');
                    }}
                    title="View layer details"
                  >
                    <Maximize2 className="w-3 h-3 text-white" />
                  </Button>
                  <span
                    className="inline-block"
                    style={{
                      width: '24px',
                      height: '6px',
                      backgroundColor: '#22c55e',
                      border: '1px solid rgba(255,255,255,0.6)',
                      borderRadius: '3px'
                    }}
                    aria-hidden
                    title="Line symbol"
                  />
                </div>
                {expandedLayers.has('vessels-ais') && (
                  <div className="px-4 py-4">
                    <div className="text-sm leading-none text-white">
                      Last Updated: 2025-11-15 14:05 UTC
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Type: data layer
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Sources: CART, PRATUS
                    </div>
                  </div>
                )}
              </div>
              <div className="border border-border/30 rounded-md overflow-hidden bg-card/30">
                <div className="flex items-center gap-3 py-3 px-3">
                  <Checkbox
                    checked={layerToggles.vessels.patrol}
                    onCheckedChange={(v) =>
                      setLayerToggles((prev) => ({
                        ...prev,
                        vessels: { ...prev.vessels, patrol: !!v },
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleLayer('vessels-patrol')}
                    className="flex items-center gap-1 flex-1 bg-transparent p-0"
                  >
                    {expandedLayers.has('vessels-patrol') ? (
                      <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white flex-shrink-0" />
                    )}
                    <Label className="cursor-pointer flex-1">Patrol Sectors</Label>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      openIndividualLayerModal('Patrol Sectors');
                    }}
                    title="View layer details"
                  >
                    <Maximize2 className="w-3 h-3 text-white" />
                  </Button>
                  <span
                    className="inline-block"
                    style={{
                      width: '24px',
                      height: '6px',
                      backgroundImage:
                        'repeating-linear-gradient(90deg, #ec4899 0 8px, transparent 8px 12px)',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255,255,255,0.6)',
                      borderRadius: '3px'
                    }}
                    aria-hidden
                    title="Dashed line symbol"
                  />
                </div>
                {expandedLayers.has('vessels-patrol') && (
                  <div className="px-4 py-4">
                    <div className="text-sm leading-none text-white">
                      Last Updated: 2025-11-15 13:25 UTC
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Type: web map
                    </div>
                    <div className="text-sm leading-none text-white mt-3">
                      Sources: FSLTP
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{info?.title ?? 'Layer Details'}</DialogTitle>
          </DialogHeader>
          <div className="dl-expanded-content space-y-2 text-white">
            <div className="flex items-center justify-between">
              <span>Data Source</span>
              <span>{info?.source ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Data Owner</span>
              <span>{info?.owner ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Created</span>
              <span>{info?.created ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Updated</span>
              <span>{info?.lastUpdated ?? '—'} {info?.timezone ? `(${info.timezone})` : ''}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Update Frequency</span>
              <span>{info?.frequency ?? '—'}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Layer Modal */}
      <Dialog open={layerModalOpen} onOpenChange={setLayerModalOpen}>
        <DialogContent className="bg-[#222529] border-[#6e757c] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {layerModalCategory ? getCategoryDisplayName(layerModalCategory) : 'Layers'}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              All layers in this category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {layerModalCategory && getLayersForCategory(layerModalCategory).map((layer, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border border-border/30 rounded-md bg-card/30"
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={layer.checked} disabled />
                  <span className="text-sm text-white">{layer.name}</span>
                </div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: layer.checked ? '#22c55e' : '#6e757c',
                    border: '1px solid rgba(255,255,255,0.6)'
                  }}
                  title={layer.checked ? 'Active' : 'Inactive'}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Individual Layer Modal */}
      <Dialog open={individualLayerModalOpen} onOpenChange={setIndividualLayerModalOpen}>
        <DialogContent className="bg-[#222529] border-[#6e757c] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedIndividualLayer || 'Layer Details'}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Layer information and metadata
            </DialogDescription>
          </DialogHeader>
          {selectedIndividualLayer && (() => {
            const presets: Record<
              string,
              { source: string; owner: string; created: string; lastUpdated: string; timezone: string; frequency: string; type: string }
            > = {
              'Radar Precipitation': {
                source: 'NOAA NEXRAD Composite',
                owner: 'NOAA',
                created: '2022-01-01 00:00',
                lastUpdated: '2025-11-15 14:05',
                timezone: 'UTC',
                frequency: 'Every 5 minutes',
                type: 'data layer'
              },
              'Active Weather Warnings': {
                source: 'NOAA Weather Alerts (CAP)',
                owner: 'NOAA',
                created: '2020-05-12 08:00',
                lastUpdated: '2025-11-15 14:02',
                timezone: 'UTC',
                frequency: 'Real-time',
                type: 'feature layer'
              },
              'Staging Areas': {
                source: 'Incident Logistics GIS (IMS)',
                owner: 'Unified Command - Logistics',
                created: '2025-11-14 09:15',
                lastUpdated: '2025-11-15 13:40',
                timezone: 'UTC',
                frequency: 'Hourly',
                type: 'feature layer'
              },
              'Critical Facilities': {
                source: 'State Infrastructure GIS',
                owner: 'State EOC - Infrastructure',
                created: '2024-06-01 12:00',
                lastUpdated: '2025-11-15 12:00',
                timezone: 'UTC',
                frequency: 'Daily',
                type: 'feature layer'
              },
              'Boom Deployment Lines': {
                source: 'Operations Section (Field Mapping)',
                owner: 'Operations - Marine Branch',
                created: '2025-11-15 06:00',
                lastUpdated: '2025-11-15 13:55',
                timezone: 'UTC',
                frequency: 'Ad hoc (as reported)',
                type: 'feature layer'
              },
              'Skimmer Operations': {
                source: 'Operations Section (Marine)',
                owner: 'Operations - Marine Branch',
                created: '2025-11-15 05:30',
                lastUpdated: '2025-11-15 13:50',
                timezone: 'UTC',
                frequency: 'Ad hoc (as reported)',
                type: 'feature layer'
              },
              'Priority Protection Areas': {
                source: 'Environmental Unit (GRP/GRS)',
                owner: 'Environmental Unit',
                created: '2023-03-10 10:00',
                lastUpdated: '2025-11-15 12:45',
                timezone: 'UTC',
                frequency: 'Daily',
                type: 'feature layer'
              },
              'Boom Anchor Points': {
                source: 'Environmental Unit (Field Survey)',
                owner: 'Environmental Unit',
                created: '2025-11-12 11:25',
                lastUpdated: '2025-11-15 12:20',
                timezone: 'UTC',
                frequency: 'Ad hoc (as surveyed)',
                type: 'feature layer'
              },
              'AIS Vessel Tracks': {
                source: 'AIS Feed (USCG / Commercial AIS)',
                owner: 'USCG / AIS Providers',
                created: '2019-01-01 00:00',
                lastUpdated: '2025-11-15 14:05',
                timezone: 'UTC',
                frequency: 'Every minute',
                type: 'data layer'
              },
              'Patrol Sectors': {
                source: 'USCG Sector Command',
                owner: 'USCG Sector Command',
                created: '2025-11-10 07:00',
                lastUpdated: '2025-11-15 13:25',
                timezone: 'UTC',
                frequency: 'Per shift',
                type: 'web map'
              }
            };
            const meta = presets[selectedIndividualLayer] ?? {
              source: 'Unknown',
              owner: 'Unknown',
              created: 'N/A',
              lastUpdated: 'N/A',
              timezone: 'UTC',
              frequency: 'N/A',
              type: 'data layer'
            };
            
            return (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between p-2 border-b border-border/30">
                  <span className="text-sm text-white/70">Data Source</span>
                  <span className="text-sm text-white">{meta.source}</span>
                </div>
                <div className="flex items-center justify-between p-2 border-b border-border/30">
                  <span className="text-sm text-white/70">Data Owner</span>
                  <span className="text-sm text-white">{meta.owner}</span>
                </div>
                <div className="flex items-center justify-between p-2 border-b border-border/30">
                  <span className="text-sm text-white/70">Created</span>
                  <span className="text-sm text-white">{meta.created}</span>
                </div>
                <div className="flex items-center justify-between p-2 border-b border-border/30">
                  <span className="text-sm text-white/70">Last Updated</span>
                  <span className="text-sm text-white">{meta.lastUpdated} ({meta.timezone})</span>
                </div>
                <div className="flex items-center justify-between p-2 border-b border-border/30">
                  <span className="text-sm text-white/70">Type</span>
                  <span className="text-sm text-white">{meta.type}</span>
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm text-white/70">Update Frequency</span>
                  <span className="text-sm text-white">{meta.frequency}</span>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
}


