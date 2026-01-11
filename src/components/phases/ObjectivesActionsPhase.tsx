import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Checkbox } from '../ui/checkbox';
import { Edit2, Trash2, ChevronRight, ChevronDown, Map, Check, X, Filter } from 'lucide-react';
import svgPaths from '../../imports/svg-7hg6d30srz';

interface Action {
  id: string;
  description: string;
  status: string;
  assignee?: string;
  time?: string;
  date?: string;
  timezone?: string;
}

interface Objective {
  id: string;
  title: string;
  type: 'Operational' | 'Managerial';
  actions: Action[];
  childIncidents?: Objective[];
}

interface ObjectivesActionsPhaseProps {
  data?: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
  onComplete: () => void;
  onPrevious?: () => void;
  onRecommendActions?: () => void;
  onZoomToLocation?: (center: string, scale: string) => void;
  onAddAIContext?: (itemName: string) => void;
  onApplyDataLayerFilter?: (incident: string) => void;
}

export function ObjectivesActionsPhase({ data = {}, onDataChange, onComplete, onPrevious, onRecommendActions, onZoomToLocation, onAddAIContext, onApplyDataLayerFilter }: ObjectivesActionsPhaseProps) {
  // Helper functions for severity (defined before state to use in initial sort)
  const getIncidentSeverityHelper = (id: string): 'Minor' | 'Moderate' | 'Serious' | 'Severe' | 'Critical' => {
    switch (id) {
      case '1': return 'Serious';
      case '1a': return 'Moderate';
      case '1b': return 'Serious';
      case '2': return 'Moderate';
      case '3': return 'Moderate';
      case '3a': return 'Moderate';
      case '3b': return 'Minor';
      case '4': return 'Minor';
      case '5': return 'Severe';
      case '6': return 'Serious';
      default: return 'Moderate';
    }
  };

  const getSeverityRankHelper = (severity: string): number => {
    switch (severity) {
      case 'Critical': return 5;
      case 'Severe': return 4;
      case 'Serious': return 3;
      case 'Moderate': return 2;
      case 'Minor': return 1;
      default: return 0;
    }
  };

  const initialObjectives = data.objectives || [
    {
      id: '1',
      title: 'Oahu Substation Fire',
      type: 'Operational',
      actions: [],
      childIncidents: [
        {
          id: '1a',
          title: 'Ewa Beach Distribution Network Outage',
          type: 'Operational',
          actions: []
        },
        {
          id: '1b',
          title: 'West Oahu Residential Grid Restoration',
          type: 'Operational',
          actions: []
        }
      ]
    },
    {
      id: '2',
      title: 'Maui Solar Array Inverter Failure',
      type: 'Operational',
      actions: []
    },
    {
      id: '3',
      title: 'Big Island Battery Storage Malfunction',
      type: 'Operational',
      actions: [],
      childIncidents: [
        {
          id: '3a',
          title: 'Kailua-Kona Commercial Sector Power Fluctuation',
          type: 'Operational',
          actions: []
        },
        {
          id: '3b',
          title: 'West Hawaii Renewable Integration Stabilization',
          type: 'Operational',
          actions: []
        }
      ]
    },
    {
      id: '4',
      title: 'Kauai Transmission Line Damage',
      type: 'Operational',
      actions: []
    },
    {
      id: '5',
      title: 'Honolulu Harbor Substation Flooding',
      type: 'Operational',
      actions: []
    },
    {
      id: '6',
      title: 'Molokai Wind Farm Emergency Shutdown',
      type: 'Operational',
      actions: []
    }
  ];

  // Sort by severity (Severe at top, then Serious, etc.)
  const sortedObjectives = initialObjectives.sort((a, b) => {
    const severityA = getIncidentSeverityHelper(a.id);
    const severityB = getIncidentSeverityHelper(b.id);
    return getSeverityRankHelper(severityB) - getSeverityRankHelper(severityA);
  });

  const [objectives, setObjectives] = useState<Objective[]>(sortedObjectives);

  const [editingObjective, setEditingObjective] = useState<string | null>(null);
  const [editingObjectiveOriginal, setEditingObjectiveOriginal] = useState<Objective | null>(null);
  const [editingAction, setEditingAction] = useState<{ objectiveId: string; actionId: string } | null>(null);
  const [editingActionOriginal, setEditingActionOriginal] = useState<Action | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());
  const [expandedChildIncidents, setExpandedChildIncidents] = useState<Set<string>>(new Set());
  const [isAddIncidentModalOpen, setIsAddIncidentModalOpen] = useState(false);
  const [selectedIncidentTypes, setSelectedIncidentTypes] = useState<string[]>([]);
  const [isIncidentTypePopoverOpen, setIsIncidentTypePopoverOpen] = useState(false);
  const [selectedAORs, setSelectedAORs] = useState<string[]>([]);
  const [isAORPopoverOpen, setIsAORPopoverOpen] = useState(false);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [isSeverityPopoverOpen, setIsSeverityPopoverOpen] = useState(false);
  
  type IncidentDetails = {
    description: string;
    location: string;
    status: 'Active' | 'Contained' | 'Monitoring';
    startTime: string;
    estimatedVolume: string;
    shorelineImpact: string;
    responsibleParty: string;
    incidentCommander: string;
    lastUpdate: string;
  };

  // Available incident types
  const incidentTypes = [
    'Pipeline Spill',
    'Platform Leak',
    'Tanker Spill',
    'Barge Collision',
    'Sheen/Surface Oil',
    'Pipeline Release',
    'Vessel Incident',
    'Other'
  ];

  // Available AORs
  const aors = [
    'Gulf Coast Region',
    'Southeast Region',
    'Northeast Region',
    'Pacific Northwest Region',
    'Alaska Region'
  ];

  // Available severities
  const severities = [
    'Critical',
    'Severe',
    'Serious',
    'Moderate',
    'Minor'
  ];

  // Get incident type based on objective title
  const getIncidentType = (objective: Objective): string => {
    const title = objective.title.toLowerCase();
    if (title.includes('pipeline spill') || title.includes('pipeline release')) {
      return title.includes('release') ? 'Pipeline Release' : 'Pipeline Spill';
    }
    if (title.includes('platform') && title.includes('leak')) return 'Platform Leak';
    if (title.includes('tanker') && title.includes('spill')) return 'Tanker Spill';
    if (title.includes('barge') && title.includes('collision')) return 'Barge Collision';
    if (title.includes('sheen')) return 'Sheen/Surface Oil';
    if (title.includes('vessel')) return 'Vessel Incident';
    return 'Other';
  };

  // Get AOR based on objective title
  const getIncidentAOR = (objective: Objective): string => {
    const title = objective.title.toLowerCase();
    if (title.includes('gulf coast') || title.includes('louisiana') || title.includes('bayou')) {
      return 'Gulf Coast Region';
    }
    if (title.includes('southeast') || title.includes('florida') || title.includes('delaware')) {
      return 'Southeast Region';
    }
    if (title.includes('northeast') || title.includes('delaware river')) {
      return 'Northeast Region';
    }
    if (title.includes('pacific') || title.includes('washington') || title.includes('oregon')) {
      return 'Pacific Northwest Region';
    }
    if (title.includes('alaska')) {
      return 'Alaska Region';
    }
    return 'Gulf Coast Region'; // Default
  };

  // Get severity level for each incident
  const getIncidentSeverity = (id: string): 'Minor' | 'Moderate' | 'Serious' | 'Severe' | 'Critical' => {
    switch (id) {
      case '1': return 'Serious'; // Oahu Substation Fire
      case '1a': return 'Moderate'; // Ewa Beach Distribution Network Outage (child)
      case '1b': return 'Serious'; // West Oahu Residential Grid Restoration (child)
      case '2': return 'Moderate'; // Maui Solar Array Inverter Failure
      case '3': return 'Moderate'; // Big Island Battery Storage Malfunction
      case '3a': return 'Moderate'; // Kailua-Kona Commercial Sector Power Fluctuation (child)
      case '3b': return 'Minor'; // West Hawaii Renewable Integration Stabilization (child, preventive)
      case '4': return 'Minor'; // Kauai Transmission Line Damage
      case '5': return 'Severe'; // Honolulu Harbor Substation Flooding
      case '6': return 'Serious'; // Molokai Wind Farm Emergency Shutdown
      default: return 'Moderate';
    }
  };

  // Get severity rank (higher number = more severe)
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

  // Get color for severity level
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

  // Get map coordinates for each incident location
  const getIncidentCoordinates = (id: string): { center: string; scale: string } => {
    switch (id) {
      case '1': // Kapolei Power Grid, Oahu
        return { center: '-158.0581,21.3354', scale: '144447.638572' };
      case '1a': // Ewa Beach Distribution Network, Oahu (child incident)
        return { center: '-158.0072,21.3156', scale: '72223.819286' };
      case '1b': // West Oahu Residential Grid (child incident)
        return { center: '-158.0400,21.3700', scale: '72223.819286' };
      case '2': // Kahului Energy Complex, Maui
        return { center: '-156.4729,20.8893', scale: '144447.638572' };
      case '3': // Kona Grid, Big Island
        return { center: '-155.9969,19.6400', scale: '72223.819286' };
      case '3a': // Kailua-Kona Commercial Sector (child incident)
        return { center: '-155.9969,19.6400', scale: '36111.909643' };
      case '3b': // West Hawaii Renewable Integration (child incident)
        return { center: '-155.9969,19.7297', scale: '144447.638572' };
      case '4': // Kauai Transmission Line
        return { center: '-159.3741,21.9812', scale: '144447.638572' };
      case '5': // Honolulu Harbor Substation
        return { center: '-157.8671,21.3045', scale: '144447.638572' };
      case '6': // Molokai Wind Farm
        return { center: '-157.0226,21.1444', scale: '144447.638572' };
      default:
        return { center: '-157.8581,21.3099', scale: '72223.819286' }; // Default to Honolulu
    }
  };

  // Get data layer incident filter value for each incident
  const getIncidentFilterValue = (id: string): string => {
    // Map incident IDs to their incident filter values
    switch (id) {
      case '1':
        return 'oahu-substation-fire';
      case '1a':
        return 'ewa-beach-outage';
      case '1b':
        return 'west-oahu-restoration';
      case '3':
        return 'kona-battery-storage';
      case '3a':
        return 'kailua-kona-power-quality';
      case '3b':
        return 'west-hawaii-renewable';
      default:
        return 'oahu-substation-fire';
    }
  };

  const getIncidentDetails = (id: string): IncidentDetails => {
    switch (id) {
      case '1':
        return {
          description: 'Substation transformer fire impacting West Oahu power grid; mobile substation deployment and emergency restoration operations underway.',
          location: 'Kapolei, Oahu',
          status: 'Active',
          startTime: 'Today 06:40',
          estimatedVolume: '~45 MW capacity affected',
          shorelineImpact: 'N/A - Grid infrastructure incident',
          responsibleParty: 'Hawaiian Electric Company (HECO)',
          incidentCommander: 'HECO Emergency Operations',
          lastUpdate: 'Mobile substation en route; backup generators deployed'
        };
      case '2':
        return {
          description: 'Solar array inverter failure causing renewable generation loss; grid stability analysis and replacement operations in progress.',
          location: 'Kahului, Maui',
          status: 'Active',
          startTime: 'Yesterday 22:15',
          estimatedVolume: '~12 MW solar capacity offline',
          shorelineImpact: 'N/A - Renewable energy infrastructure',
          responsibleParty: 'Maui Electric Company (MECO)',
          incidentCommander: 'MECO Grid Operations',
          lastUpdate: 'Replacement inverters arriving; demand response activated'
        };
      case '3':
        return {
          description: 'Battery storage system malfunction affecting grid frequency regulation; isolation procedures complete with backup systems engaged.',
          location: 'Kona, Big Island',
          status: 'Active',
          startTime: 'Today 05:20',
          estimatedVolume: '~20 MWh storage capacity',
          shorelineImpact: 'N/A - Energy storage facility',
          responsibleParty: 'Hawaii Electric Light Company (HELCO)',
          incidentCommander: 'HELCO System Operations',
          lastUpdate: 'System isolated; alternative frequency regulation active'
        };
      case '4':
        return {
          description: 'Hurricane-damaged transmission lines requiring emergency repairs; aerial surveys and line crew deployment in progress.',
          location: 'North Shore, Kauai',
          status: 'Monitoring',
          startTime: 'Today 07:10',
          estimatedVolume: '~8 transmission towers damaged',
          shorelineImpact: 'N/A - Transmission infrastructure',
          responsibleParty: 'Kauai Island Utility Cooperative (KIUC)',
          incidentCommander: 'KIUC Emergency Response',
          lastUpdate: 'Damage assessment underway; temporary routing established'
        };
      case '5':
        return {
          description: 'Storm surge flooding at harbor substation; emergency pumping and flood barrier deployment to protect critical equipment.',
          location: 'Honolulu Harbor, Oahu',
          status: 'Active',
          startTime: 'Today 03:55',
          estimatedVolume: '~3 feet water depth',
          shorelineImpact: 'Coastal infrastructure vulnerability',
          responsibleParty: 'Hawaiian Electric Company (HECO)',
          incidentCommander: 'HECO Waterfront Operations',
          lastUpdate: 'Pumping operations active; flood barriers being installed'
        };
      case '6':
        return {
          description: 'Wind farm emergency shutdown impacting island generation; turbine control system resets and backup diesel activation in progress.',
          location: 'Molokai',
          status: 'Active',
          startTime: 'Today 04:30',
          estimatedVolume: '~6 MW wind capacity offline',
          shorelineImpact: 'N/A - Wind energy infrastructure',
          responsibleParty: 'Maui Electric Company (MECO)',
          incidentCommander: 'MECO Molokai Operations',
          lastUpdate: 'Turbine restart sequence initiated; diesel backup online'
        };
      case '1a':
        return {
          description: 'Secondary distribution network outage affecting Ewa Beach area; service restoration prioritized for critical facilities.',
          location: 'Ewa Beach, Oahu',
          status: 'Active',
          startTime: 'Today 09:15',
          estimatedVolume: '~15 MW distribution capacity',
          shorelineImpact: 'N/A - Distribution network',
          responsibleParty: 'Hawaiian Electric Company (parent incident)',
          incidentCommander: 'HECO Distribution Operations',
          lastUpdate: 'Emergency circuits activated; restoration in progress'
        };
      case '1b':
        return {
          description: 'West Oahu residential grid restoration requiring coordinated switching operations; priority service restoration for hospitals and emergency services.',
          location: 'West Oahu Region',
          status: 'Active',
          startTime: 'Today 11:30',
          estimatedVolume: '~25,000 customers affected',
          shorelineImpact: 'N/A - Residential grid infrastructure',
          responsibleParty: 'Hawaiian Electric Company (parent incident)',
          incidentCommander: 'HECO Emergency Restoration',
          lastUpdate: 'Critical facilities restored; residential restoration phased approach'
        };
      case '3a':
        return {
          description: 'Commercial sector power quality issues in Kailua-Kona; voltage stabilization and load balancing operations ongoing.',
          location: 'Kailua-Kona, Big Island',
          status: 'Active',
          startTime: 'Today 07:45',
          estimatedVolume: 'Power quality fluctuations',
          shorelineImpact: 'N/A - Commercial grid segment',
          responsibleParty: 'Hawaii Electric Light Company (parent incident)',
          incidentCommander: 'HELCO Grid Stability Team',
          lastUpdate: 'Voltage regulation equipment deployed; monitoring continuous'
        };
      case '3b':
        return {
          description: 'Renewable energy integration stabilization measures for West Hawaii grid; frequency and voltage control systems being optimized.',
          location: 'West Hawaii, Big Island',
          status: 'Monitoring',
          startTime: 'Today 08:20',
          estimatedVolume: 'Preventive stabilization',
          shorelineImpact: 'N/A - Grid integration systems',
          responsibleParty: 'Hawaii Electric Light Company (parent incident)',
          incidentCommander: 'HELCO Renewable Integration',
          lastUpdate: 'Grid stabilization active; renewable output being modulated'
        };
      default:
        return {
          description: 'Grid infrastructure incident requiring emergency response and restoration operations.',
          location: 'Hawaii',
          status: 'Active',
          startTime: 'Today 04:30',
          estimatedVolume: 'TBD',
          shorelineImpact: 'N/A - Grid infrastructure',
          responsibleParty: 'Hawaiian Electric Companies',
          incidentCommander: 'Emergency Operations Center',
          lastUpdate: 'Response operations in progress'
        };
    }
  };

  // Helper functions for action items
  type ActionItem = {
    title: string;
    assignedTo: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Completed' | 'In Progress' | 'Pending' | 'Overdue';
    dueDate: string;
    location: string;
    description: string;
    taskId: string;
    startedAt?: string;
    completedAt?: string;
  };

  const getActionsForIncident = (incidentId: string): ActionItem[] => {
    switch (incidentId) {
      case '1': // Oahu Substation Fire
        return [
          {
            title: 'Deploy mobile substation to restore power',
            assignedTo: 'Operations - Grid Response Team',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/16/2025 18:00',
            location: 'Kapolei Substation Site, Oahu',
            description: 'Deploy mobile substation unit to restore power to Kapolei grid. Coordinate with HECO engineering for connection protocols and load balancing.',
            taskId: 'ICS-204-A-015',
            startedAt: '11/15/2025 14:30'
          },
          {
            title: 'Assess fire damage to transformer bank',
            assignedTo: 'Engineering Unit',
            priority: 'High',
            status: 'Pending',
            dueDate: '11/16/2025 08:00',
            location: 'Kapolei Power Grid Infrastructure',
            description: 'Complete comprehensive damage assessment of transformer bank and switching equipment. Document replacement requirements and timeline estimates.',
            taskId: 'ICS-215-E-022'
          },
          {
            title: 'Mobilize backup power generators for critical facilities',
            assignedTo: 'Logistics Section',
            priority: 'Medium',
            status: 'In Progress',
            dueDate: '11/15/2025 22:00',
            location: 'West Oahu Critical Infrastructure',
            description: 'Transport and install backup generators at hospitals, water pumping stations, and emergency services facilities. Ensure fuel reserves are adequate.',
            taskId: 'ICS-204-L-008',
            startedAt: '11/15/2025 16:00'
          }
        ];
      case '2': // Maui Solar Array Inverter Failure
        return [
          {
            title: 'Replace failed inverter units',
            assignedTo: 'Operations - Renewable Energy Team',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/16/2025 12:00',
            location: 'Kahului Solar Farm, Maui',
            description: 'Transport and install replacement inverter units at solar array. Ensure all safety protocols and grid synchronization tests are completed.',
            taskId: 'ICS-204-O-031',
            startedAt: '11/15/2025 10:00'
          },
          {
            title: 'Conduct grid stability analysis',
            assignedTo: 'Engineering Unit - Grid Operations',
            priority: 'High',
            status: 'Pending',
            dueDate: '11/15/2025 16:00',
            location: 'Maui Energy Control Center',
            description: 'Execute comprehensive grid stability analysis to assess impact of solar array outage. Develop load redistribution plan.',
            taskId: 'ICS-215-E-018'
          },
          {
            title: 'Activate demand response program',
            assignedTo: 'Operations - Load Management',
            priority: 'Medium',
            status: 'Completed',
            dueDate: '11/15/2025 14:00',
            location: 'Maui County Service Area',
            description: 'Activate voluntary demand response program to reduce peak load. Coordinate with commercial and industrial customers.',
            taskId: 'ICS-204-S-012',
            startedAt: '11/15/2025 08:00',
            completedAt: '11/15/2025 13:45'
          }
        ];
      case '3': // Big Island Battery Storage Malfunction
        return [
          {
            title: 'Isolate malfunctioning battery modules',
            assignedTo: 'Operations - Energy Storage Team',
            priority: 'High',
            status: 'Completed',
            dueDate: '11/15/2025 08:00',
            location: 'Kona Battery Storage Facility',
            description: 'Isolate affected battery modules from grid to prevent system instability. Verify isolation procedures and safety systems.',
            taskId: 'ICS-204-M-005',
            startedAt: '11/15/2025 05:30',
            completedAt: '11/15/2025 07:50'
          },
          {
            title: 'Deploy backup frequency regulation resources',
            assignedTo: 'Operations - Grid Stability Team',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/15/2025 18:00',
            location: 'Big Island Grid Operations',
            description: 'Activate alternative frequency regulation resources to compensate for battery storage outage. Monitor grid frequency stability continuously.',
            taskId: 'ICS-204-R-011',
            startedAt: '11/15/2025 09:00'
          },
          {
            title: 'Develop battery system repair plan',
            assignedTo: 'Planning Section - Technical Specialist',
            priority: 'Medium',
            status: 'Pending',
            dueDate: '11/15/2025 20:00',
            location: 'Unified Operations Center',
            description: 'Work with equipment manufacturer to develop comprehensive repair plan for battery storage system. Review warranty and replacement options.',
            taskId: 'ICS-215-P-007'
          }
        ];
      case '4': // Kauai Transmission Line Damage
        return [
          {
            title: 'Conduct damage assessment of transmission towers',
            assignedTo: 'Engineering Unit - Transmission Team',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/15/2025 16:00',
            location: 'North Shore Transmission Corridor, Kauai',
            description: 'Inspect transmission towers and lines for hurricane damage. Document structural integrity issues and prioritize repair locations.',
            taskId: 'ICS-215-E-024',
            startedAt: '11/15/2025 08:00'
          },
          {
            title: 'Deploy line crews for emergency repairs',
            assignedTo: 'Operations - Transmission Repair',
            priority: 'Medium',
            status: 'In Progress',
            dueDate: '11/15/2025 15:00',
            location: 'Kauai Transmission Network',
            description: 'Deploy line repair crews to priority damage sites. Establish temporary power routing to restore service to critical areas.',
            taskId: 'ICS-204-M-019',
            startedAt: '11/15/2025 10:30'
          },
          {
            title: 'Execute aerial survey of transmission corridor',
            assignedTo: 'Operations - Aerial Inspection Team',
            priority: 'High',
            status: 'Pending',
            dueDate: '11/15/2025 14:00',
            location: 'Kauai Island-wide',
            description: 'Deploy drone and helicopter surveys to assess full extent of transmission line damage across the island. Provide imagery for repair planning.',
            taskId: 'ICS-204-U-003'
          }
        ];
      case '5': // Honolulu Harbor Substation Flooding
        return [
          {
            title: 'Pump water from substation facility',
            assignedTo: 'Operations - Emergency Response',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/15/2025 20:00',
            location: 'Honolulu Harbor Substation',
            description: 'Deploy high-capacity pumps to remove storm surge water from substation. Coordinate with harbor operations and ensure safety protocols.',
            taskId: 'ICS-204-M-027',
            startedAt: '11/15/2025 06:00'
          },
          {
            title: 'Install temporary flood barriers',
            assignedTo: 'Operations - Infrastructure Protection',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/15/2025 18:00',
            location: 'Honolulu Harbor Critical Infrastructure',
            description: 'Establish temporary flood protection barriers around critical electrical equipment to prevent additional storm surge impacts.',
            taskId: 'ICS-204-B-014',
            startedAt: '11/15/2025 08:30'
          },
          {
            title: 'Activate waterfront resilience measures',
            assignedTo: 'Engineering Unit',
            priority: 'High',
            status: 'Pending',
            dueDate: '11/15/2025 16:00',
            location: 'Honolulu Harbor Energy Infrastructure',
            description: 'Implement pre-planned waterfront resilience measures for harbor area substations. Coordinate with Coast Guard and harbor operations.',
            taskId: 'ICS-215-E-016'
          }
        ];
      case '6': // Molokai Wind Farm Emergency Shutdown
        return [
          {
            title: 'Reset wind turbine control systems',
            assignedTo: 'Operations - Wind Energy Team',
            priority: 'High',
            status: 'In Progress',
            dueDate: '11/15/2025 17:00',
            location: 'Molokai Wind Farm',
            description: 'Systematically reset and restart wind turbine control systems following emergency shutdown. Verify all safety systems before reconnecting to grid.',
            taskId: 'ICS-204-G-022',
            startedAt: '11/15/2025 09:00'
          },
          {
            title: 'Deploy backup diesel generation',
            assignedTo: 'Operations - Thermal Generation',
            priority: 'High',
            status: 'Pending',
            dueDate: '11/15/2025 19:00',
            location: 'Molokai Power Station',
            description: 'Activate backup diesel generators to compensate for wind farm outage. Ensure adequate fuel supply and load distribution.',
            taskId: 'ICS-204-R-018'
          },
          {
            title: 'Conduct grid stability impact assessment',
            assignedTo: 'Engineering Unit - Grid Analysis',
            priority: 'Medium',
            status: 'In Progress',
            dueDate: '11/16/2025 10:00',
            location: 'Molokai Grid Operations',
            description: 'Assess impact of wind farm shutdown on island grid stability. Develop contingency plans for extended outage scenario.',
            taskId: 'ICS-215-W-009',
            startedAt: '11/15/2025 11:00'
          }
        ];
      default:
        return [];
    }
  };

  const getPriorityColorForAction = (priority: string): string => {
    switch (priority) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#22c55e';
      default: return '#6e757c';
    }
  };

  const getStatusColorForAction = (status: string): string => {
    switch (status) {
      case 'Completed': return '#22c55e';
      case 'In Progress': return '#3B82F6';
      case 'Pending': return '#facc15';
      case 'Overdue': return '#EF4444';
      default: return '#6e757c';
    }
  };
  const [showRecommended, setShowRecommended] = useState<Set<string>>(new Set());

  // Plausible IACI-centric assignees for an ongoing cyber attack
  const officialNames: string[] = [
    'IACI‑CERT Incident Lead',
    'IACInet Intelligence Lead',
    'Sector ISAC Analyst',
    'Member Organization SOC Lead',
    'CISA Central Liaison',
    'FBI Cyber Task Force Liaison',
    'SRMA Sector Liaison',
    'OT/ICS Security Lead',
    'Cloud Provider CSIRT',
    'Legal & Privacy Counsel',
    'Public Affairs (JIC)',
    'CISO, Member Organization'
  ];

  const getRecommendedActionsForObjective = (objectiveTitle: string): Action[] => {
    const title = objectiveTitle.toLowerCase();
    const makeId = (suffix: number) => `${Date.now()}-${suffix}`;

    // Life safety / rescue / sheltering
    if (
      title.includes('life') ||
      title.includes('rescue') ||
      title.includes('evacu') ||
      title.includes('shelter') ||
      title.includes('stabilize')
    ) {
      return [
        {
          id: makeId(1),
          description: 'Conduct high-water rescues and welfare checks in Cape Fear and Neuse basin communities; stage boats and HMMWVs at county EOCs (next 12–24 hrs).',
          status: 'Current',
        },
        {
          id: makeId(2),
          description: 'Sustain shelter operations for ~15,000 evacuees; ensure ADA access, medical triage, and behavioral health; coordinate supply chain (cots, blankets, meds).',
          status: 'Current',
        },
        {
          id: makeId(3),
          description: 'Execute targeted evacuations for neighborhoods with crest forecasts > major flood stage; issue IPAWS alerts and door-to-door notifications.',
          status: 'Current',
        },
        {
          id: makeId(4),
          description: 'Establish missing-persons tracking and reunification workflow with ARC and local PSAPs; update every 4 hours.',
          status: 'Planned (24h)',
        },
      ];
    }

    // Critical infrastructure / power / water / transportation
    if (
      title.includes('infrastructure') ||
      title.includes('power') ||
      title.includes('water') ||
      title.includes('transport') ||
      title.includes('corridor') ||
      title.includes('restore')
    ) {
      return [
        {
          id: makeId(1),
          description: 'Prioritize power restoration for hospitals, water/wastewater plants, and shelters; deploy generators and fuel support where grid access is delayed.',
          status: 'Current',
        },
        {
          id: makeId(2),
          description: 'Issue/maintain boil-water advisories; distribute bottled water; deploy mobile testing teams to impacted systems in six affected counties.',
          status: 'Current',
        },
        {
          id: makeId(3),
          description: 'Clear debris from priority routes; conduct bridge inspections; plan phased reopening of I‑95 and US‑70 when waters recede and safety checks pass.',
          status: 'Current',
        },
        {
          id: makeId(4),
          description: 'Stand up debris management sites and hazardous waste segregation in coordination with NCDEQ and county public works.',
          status: 'Planned (48–72h)',
        },
      ];
    }

    // Unified command / situational awareness / FEMA coordination
    if (
      title.includes('unified') ||
      title.includes('situational') ||
      title.includes('awareness') ||
      title.includes('fema') ||
      title.includes('command') ||
      title.includes('coordination')
    ) {
      return [
        {
          id: makeId(1),
          description: 'Activate Unified Command (NCEM, FEMA, NCNG, NCDOT, NCDEQ, utilities); set operational period schedule and SITREP cadence (AM/PM).',
          status: 'Current',
        },
        {
          id: makeId(2),
          description: 'Publish twice-daily river forecasts and flood-inundation maps; synchronize evacuation zones and public messaging with county PIOs.',
          status: 'Current',
        },
        {
          id: makeId(3),
          description: 'Establish regional logistics staging areas; track mission assignments (rescue, sheltering, debris) and resource requests in WebEOC.',
          status: 'Current',
        },
        {
          id: makeId(4),
          description: 'Coordinate federal assistance under DR‑4393‑NC; align state mission tasks with FEMA resource offerings (USAR, IA/PA, commodities).',
          status: 'Planned (24–48h)',
        },
      ];
    }

    // Fallback: generic flood-response actions
    return [
      { id: makeId(1), description: 'Validate life safety priorities; confirm rescue/sheltering posture and unmet needs with county EOCs.', status: 'Current' },
      { id: makeId(2), description: 'Update power/water restoration timelines; identify critical facilities needing generators or fuel resupply.', status: 'Current' },
      { id: makeId(3), description: 'Publish unified public messaging on travel restrictions, boil-water advisories, and assistance programs.', status: 'Planned (24h)' },
    ];
  };

  const updateData = (newObjectives: Objective[]) => {
    setObjectives(newObjectives);
    onDataChange({ ...data, objectives: newObjectives });
  };

  const addObjective = (position: 'top' | 'bottom' = 'bottom') => {
    const newObjective: Objective = {
      id: Date.now().toString(),
      title: '',
      type: 'Operational',
      actions: []
    };
    if (position === 'top') {
      updateData([newObjective, ...objectives]);
    } else {
      updateData([...objectives, newObjective]);
    }
    // Set the new objective to editing mode and expand it
    setEditingObjectiveOriginal({ ...newObjective });
    setEditingObjective(newObjective.id);
    setExpandedObjectives(prev => new Set([...prev, newObjective.id]));
  };

  const updateObjectiveTitle = (id: string, title: string) => {
    const updated = objectives.map(obj =>
      obj.id === id ? { ...obj, title } : obj
    );
    updateData(updated);
  };

  const updateObjectiveType = (id: string, type: 'Operational' | 'Managerial') => {
    const updated = objectives.map(obj =>
      obj.id === id ? { ...obj, type } : obj
    );
    updateData(updated);
  };

  const deleteObjective = (id: string) => {
    updateData(objectives.filter(obj => obj.id !== id));
  };

  const startEditingObjective = (objective: Objective) => {
    setEditingObjectiveOriginal({ ...objective });
    setEditingObjective(objective.id);
  };

  const saveObjectiveEdit = () => {
    setEditingObjective(null);
    setEditingObjectiveOriginal(null);
  };

  const cancelObjectiveEdit = () => {
    if (editingObjectiveOriginal) {
      const updated = objectives.map(obj =>
        obj.id === editingObjectiveOriginal.id ? editingObjectiveOriginal : obj
      );
      updateData(updated);
    }
    setEditingObjective(null);
    setEditingObjectiveOriginal(null);
  };

  const addAction = (objectiveId: string) => {
    const newAction: Action = {
      id: Date.now().toString(),
      description: '',
      status: 'Current',
      assignee: '',
      time: '',
      date: '',
      timezone: 'UTC'
    };
    const updated = objectives.map(obj =>
      obj.id === objectiveId 
        ? { ...obj, actions: [...obj.actions, newAction] }
        : obj
    );
    updateData(updated);
  };

  const updateAction = (objectiveId: string, actionId: string, field: keyof Action, value: string) => {
    const updated = objectives.map(obj =>
      obj.id === objectiveId
        ? {
            ...obj,
            actions: obj.actions.map(action =>
              action.id === actionId ? { ...action, [field]: value } : action
            )
          }
        : obj
    );
    updateData(updated);
  };

  const deleteAction = (objectiveId: string, actionId: string) => {
    const updated = objectives.map(obj =>
      obj.id === objectiveId
        ? { ...obj, actions: obj.actions.filter(action => action.id !== actionId) }
        : obj
    );
    updateData(updated);
  };

  const startEditingAction = (objectiveId: string, action: Action) => {
    setEditingActionOriginal({ ...action });
    setEditingAction({ objectiveId, actionId: action.id });
  };

  const saveActionEdit = () => {
    setEditingAction(null);
    setEditingActionOriginal(null);
  };

  const cancelActionEdit = () => {
    if (editingActionOriginal && editingAction) {
      const updated = objectives.map(obj =>
        obj.id === editingAction.objectiveId
          ? {
              ...obj,
              actions: obj.actions.map(action =>
                action.id === editingAction.actionId ? editingActionOriginal : action
              )
            }
          : obj
      );
      updateData(updated);
    }
    setEditingAction(null);
    setEditingActionOriginal(null);
  };

  

  const toggleObjective = (objectiveId: string) => {
    setExpandedObjectives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(objectiveId)) {
        newSet.delete(objectiveId);
      } else {
        newSet.add(objectiveId);
      }
      return newSet;
    });
  };

  const toggleChildIncident = (childId: string) => {
    setExpandedChildIncidents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(childId)) {
        newSet.delete(childId);
      } else {
        newSet.add(childId);
      }
      return newSet;
    });
  };

  const toggleRecommended = (objectiveId: string) => {
    setShowRecommended(prev => {
      const next = new Set(prev);
      const enabling = !next.has(objectiveId);
      if (enabling) {
        next.add(objectiveId);
        onRecommendActions && onRecommendActions();
        // If no actions, generate context-aware actions based on the objective title
        const updated = objectives.map(obj => {
          if (obj.id !== objectiveId) return obj;
          const hasActions = obj.actions && obj.actions.length > 0;
          const actionsToUse = hasActions ? obj.actions : getRecommendedActionsForObjective(obj.title);
          return {
            ...obj,
            actions: actionsToUse.map((action, idx) => ({
              ...action,
              assignee:
                action.assignee && action.assignee.trim().length > 0
                  ? action.assignee
                  : officialNames[idx % officialNames.length],
            })),
          };
        });
        updateData(updated);
      } else {
        next.delete(objectiveId);
      }
      return next;
    });
  };

  // Filter objectives based on search term and incident type
  const filteredObjectives = objectives.filter(objective => {
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        objective.title.toLowerCase().includes(searchLower) ||
        objective.actions.some(action => 
          action.description.toLowerCase().includes(searchLower)
        );
      if (!matchesSearch) return false;
    }
    
    // Filter by incident type
    if (selectedIncidentTypes.length > 0) {
      const incidentType = getIncidentType(objective);
      if (!selectedIncidentTypes.includes(incidentType)) return false;
    }
    
    // Filter by AOR
    if (selectedAORs.length > 0) {
      const aor = getIncidentAOR(objective);
      if (!selectedAORs.includes(aor)) return false;
    }
    
    // Filter by severity
    if (selectedSeverities.length > 0) {
      const severity = getIncidentSeverity(objective.id);
      if (!selectedSeverities.includes(severity)) return false;
    }
    
    return true;
  });

  // Handler for incident type selection
  const toggleIncidentType = (type: string) => {
    setSelectedIncidentTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearIncidentTypeFilter = () => {
    setSelectedIncidentTypes([]);
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

  // Handler for severity selection
  const toggleSeverity = (severity: string) => {
    setSelectedSeverities(prev => 
      prev.includes(severity) 
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
  };

  const clearSeverityFilter = () => {
    setSelectedSeverities([]);
  };

  return (
    <div className="space-y-6">
      {/* Header Section - Sticky */}
      <div className="sticky top-0 z-10 bg-[#222529] rounded-lg border border-[#6e757c] relative">
        <div className="flex items-center justify-between px-[13px] py-3 w-full border-b-2 border-border rounded-t-lg rounded-b-none">
          {/* Title */}
          <div className="relative shrink-0 flex items-center gap-2">
            <p className="caption text-nowrap text-white whitespace-pre">
              Incidents
            </p>
            <span className="caption text-white">
              ({objectives.filter(obj => getIncidentDetails(obj.id).status === 'Active').length} active)
            </span>
          </div>

          {/* Search and Add Objective Button */}
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

            {/* Add Objective Button */}
            <button
              onClick={() => setIsAddIncidentModalOpen(true)}
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
                Add Incident
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section - Three Columns */}
      <div className="flex gap-3">
        {/* Incident Type Filter */}
        <div className="flex-1 space-y-2 px-4 py-3 bg-[#222529] rounded-lg border border-[#6e757c]">
          <span className="caption text-white whitespace-nowrap block">Incident Type:</span>
          <div className="flex items-center gap-2">
            <Popover open={isIncidentTypePopoverOpen} onOpenChange={setIsIncidentTypePopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex-1 h-[24px] bg-transparent border border-[#6e757c] rounded-[4px] px-2 caption text-white focus:outline-none focus:border-accent cursor-pointer flex items-center justify-between"
                  style={{ 
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '18px'
                  }}
                >
                  {selectedIncidentTypes.length === 0 
                    ? 'All Types' 
                    : selectedIncidentTypes.length === 1 
                    ? selectedIncidentTypes[0]
                    : `${selectedIncidentTypes.length} types selected`}
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 bg-[#222529] border-[#6e757c]" align="start">
                <Command className="bg-[#222529]">
                  <CommandInput 
                    placeholder="Search incident type..." 
                    className="h-9 caption text-white"
                    style={{ 
                      fontFamily: "'Open Sans', sans-serif",
                      fontSize: '12px',
                      fontWeight: 400,
                      lineHeight: '18px'
                    }}
                  />
                  <CommandList>
                    <CommandEmpty className="caption text-white/70 p-2">No incident type found.</CommandEmpty>
                    <CommandGroup>
                      {incidentTypes.map((type) => (
                        <CommandItem
                          key={type}
                          value={type}
                          onSelect={() => toggleIncidentType(type)}
                          className="caption text-white cursor-pointer hover:bg-[#14171a] data-[selected=true]:bg-[#14171a]"
                          style={{ 
                            fontFamily: "'Open Sans', sans-serif",
                            fontSize: '12px',
                            fontWeight: 400,
                            lineHeight: '18px'
                          }}
                        >
                          <Checkbox
                            checked={selectedIncidentTypes.includes(type)}
                            className="mr-2 h-3 w-3 border-white data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                          />
                          {type}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedIncidentTypes.length > 0 && (
              <button
                onClick={clearIncidentTypeFilter}
                className="p-1 hover:bg-muted/30 rounded transition-colors"
                title="Clear filter"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* AOR Filter */}
        <div className="flex-1 space-y-2 px-4 py-3 bg-[#222529] rounded-lg border border-[#6e757c]">
          <span className="caption text-white whitespace-nowrap block">AOR:</span>
          <div className="flex items-center gap-2">
            <Popover open={isAORPopoverOpen} onOpenChange={setIsAORPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex-1 h-[24px] bg-transparent border border-[#6e757c] rounded-[4px] px-2 caption text-white focus:outline-none focus:border-accent cursor-pointer flex items-center justify-between"
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
                    : `${selectedAORs.length} AORs selected`}
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 bg-[#222529] border-[#6e757c]" align="start">
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

        {/* Severity Filter */}
        <div className="flex-1 space-y-2 px-4 py-3 bg-[#222529] rounded-lg border border-[#6e757c]">
          <span className="caption text-white whitespace-nowrap block">Severity:</span>
          <div className="flex items-center gap-2">
            <Popover open={isSeverityPopoverOpen} onOpenChange={setIsSeverityPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex-1 h-[24px] bg-transparent border border-[#6e757c] rounded-[4px] px-2 caption text-white focus:outline-none focus:border-accent cursor-pointer flex items-center justify-between"
                  style={{ 
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '18px'
                  }}
                >
                  {selectedSeverities.length === 0 
                    ? 'All Severities' 
                    : selectedSeverities.length === 1 
                    ? selectedSeverities[0]
                    : `${selectedSeverities.length} severities selected`}
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 bg-[#222529] border-[#6e757c]" align="start">
                <Command className="bg-[#222529]">
                  <CommandInput 
                    placeholder="Search severity..." 
                    className="h-9 caption text-white"
                    style={{ 
                      fontFamily: "'Open Sans', sans-serif",
                      fontSize: '12px',
                      fontWeight: 400,
                      lineHeight: '18px'
                    }}
                  />
                  <CommandList>
                    <CommandEmpty className="caption text-white/70 p-2">No severity found.</CommandEmpty>
                    <CommandGroup>
                      {severities.map((severity) => (
                        <CommandItem
                          key={severity}
                          value={severity}
                          onSelect={() => toggleSeverity(severity)}
                          className="caption text-white cursor-pointer hover:bg-[#14171a] data-[selected=true]:bg-[#14171a]"
                          style={{ 
                            fontFamily: "'Open Sans', sans-serif",
                            fontSize: '12px',
                            fontWeight: 400,
                            lineHeight: '18px'
                          }}
                        >
                          <Checkbox
                            checked={selectedSeverities.includes(severity)}
                            className="mr-2 h-3 w-3 border-white data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                          />
                          {severity}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedSeverities.length > 0 && (
              <button
                onClick={clearSeverityFilter}
                className="p-1 hover:bg-muted/30 rounded transition-colors"
                title="Clear filter"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Objectives List */}
      <div className="space-y-4">
        {filteredObjectives.map((objective) => (
          <div
            key={objective.id}
            className="border border-border rounded-lg overflow-hidden"
            style={{ 
              background: 'linear-gradient(90deg, rgba(104, 118, 238, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)'
            }}
          >
            {/* Objective Header */}
            <div className={`p-3 ${expandedObjectives.has(objective.id) ? 'border-b border-border' : ''}`}>
              {editingObjective === objective.id ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={objective.type}
                      onValueChange={(value) => updateObjectiveType(objective.id, value as 'Operational' | 'Managerial')}
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
                          value="Managerial"
                          className="!text-[12px]"
                          style={{ fontFamily: "'Open Sans', sans-serif", lineHeight: '1.5' }}
                        >
                          M
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={objective.title}
                      onChange={(e) => updateObjectiveTitle(objective.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveObjectiveEdit();
                        if (e.key === 'Escape') cancelObjectiveEdit();
                      }}
                      placeholder="Enter objective text"
                      autoFocus
                      className="bg-input-background border-border text-card-foreground caption"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveObjectiveEdit();
                      }}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 h-[22.75px] px-3"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelObjectiveEdit();
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
                    onClick={() => {
                      toggleObjective(objective.id);
                      if (onAddAIContext) {
                        onAddAIContext(objective.title);
                      }
                    }}
                  >
                    {expandedObjectives.has(objective.id) ? (
                      <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className="caption text-white">{objective.title}</span>
                    </div>
                  </div>
              <div className="flex items-center gap-2">
                <span 
                  className="caption px-2 py-0.5 rounded"
                  style={{ 
                    backgroundColor: `${getSeverityColor(getIncidentSeverity(objective.id))}20`,
                    color: getSeverityColor(getIncidentSeverity(objective.id)),
                    border: `1px solid ${getSeverityColor(getIncidentSeverity(objective.id))}60`
                  }}
                >
                  {getIncidentSeverity(objective.id)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Apply data layer filter
                    if (onApplyDataLayerFilter) {
                      const incident = getIncidentFilterValue(objective.id);
                      onApplyDataLayerFilter(incident);
                    }
                  }}
                  className="p-1 hover:bg-muted/30 rounded transition-colors"
                  title="Filter incident"
                >
                  <Filter className="w-3 h-3 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Zoom to incident location
                    if (onZoomToLocation) {
                      const coords = getIncidentCoordinates(objective.id);
                      onZoomToLocation(coords.center, coords.scale);
                    }
                  }}
                  className="p-1 hover:bg-muted/30 rounded transition-colors"
                  title="Zoom to incident location"
                >
                  <Map className="w-3 h-3 text-white" />
                </button>
              </div>
                </div>
              )}
            </div>

            {/* Incident Details Section */}
            {expandedObjectives.has(objective.id) && (
              <div className="p-4 space-y-4 bg-card/50">
                {(() => {
                  const d = getIncidentDetails(objective.id);
                  return (
                    <>
                      {/* Incident Workspace Button */}
                      <div className="mb-4 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="bg-[#01669f] h-[22.75px] rounded-[4px] px-4 hover:bg-[#01669f]/90 transition-colors flex items-center justify-center"
                        >
                          <p className="caption text-nowrap text-white">Incident Workspace</p>
                        </button>
                      </div>
                      
                      {/* Incident Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="caption text-white/70 mb-1 block">Type</label>
                          <p className="caption text-white">Operational</p>
                        </div>
                        <div>
                          <label className="caption text-white/70 mb-1 block">Current Operational Period</label>
                          <p className="caption text-white">Period 3</p>
                        </div>
                        <div>
                          <label className="caption text-white/70 mb-1 block">Start Time</label>
                          <p className="caption text-white">{d.startTime}</p>
                        </div>
                        <div>
                          <label className="caption text-white/70 mb-1 block">Incident Commander</label>
                          <p className="caption text-white">{d.incidentCommander}</p>
                        </div>
                        <div>
                          <label className="caption text-white/70 mb-1 block">Location</label>
                          <p className="caption text-white">{d.location}</p>
                        </div>
                        <div>
                          <label className="caption text-white/70 mb-1 block">Severity</label>
                          <p className="caption text-white">{getIncidentSeverityHelper(objective.id)}</p>
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

      {/* Add Incident Modal */}
      <Dialog open={isAddIncidentModalOpen} onOpenChange={setIsAddIncidentModalOpen}>
        <DialogContent className="bg-[#222529] border-[#6e757c]">
          <DialogHeader>
            <DialogTitle className="caption text-white">placeholder modal</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
