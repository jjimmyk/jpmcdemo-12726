import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Search, Plus, Edit2, Trash2, ChevronDown, ChevronRight, CalendarIcon, Route, Box, MapPin, Map } from 'lucide-react';
import { toast } from 'sonner';
import svgPaths from '../../imports/svg-7hg6d30srz';

interface ResourcesPhaseProps {
  data: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
  onComplete: () => void;
  onPrevious?: () => void;
}

interface Resource {
  id: string;
  name: string;
  description: string;
  identifier: string;
  quantity: string;
  dateOrdered: string;
  timeOrdered: string;
  eta: string;
  etaTime: string;
  status: string;
}

export function ResourcesPhase({ data, onDataChange, onComplete, onPrevious }: ResourcesPhaseProps) {
  const [resources, setResources] = useState<Resource[]>(
    data.resources || [
      {
        id: '1',
        name: 'TSA K9 Explosive Detection Teams – Unit Delta',
        description: 'Specialized K9 explosive detection teams for enhanced screening operations at MetLife Stadium. 8 handler/dog teams trained in stadium environment screening, crowd management, and rapid deployment protocols for suspicious package response.',
        identifier: 'K9 Detection Unit',
        quantity: '8 handler/dog teams',
        dateOrdered: new Date().toISOString(),
        timeOrdered: '06:20',
        eta: new Date(Date.now() + 2 * 3600000).toISOString(),
        etaTime: 'Next 2h',
        status: 'In Transit'
      },
      {
        id: '2',
        name: 'FBI Joint Terrorism Task Force – Tactical Response Team',
        description: 'Elite tactical response unit with counter-terrorism expertise for elevated threat response. Includes tactical operators, intelligence analysts, and specialized equipment for rapid intervention and threat neutralization during World Cup operations.',
        identifier: 'JTTF Tactical Unit',
        quantity: '12 operators + support',
        dateOrdered: new Date().toISOString(),
        timeOrdered: '03:45',
        eta: new Date(Date.now() + 4 * 3600000).toISOString(),
        etaTime: 'Next 4h',
        status: 'In Transit'
      },
      {
        id: '3',
        name: 'CBRN Detection Equipment – Mobile Laboratory',
        description: 'Advanced chemical, biological, radiological, and nuclear detection systems for venue perimeter and entry point monitoring. Includes portable mass spectrometry, radiation detection, and bio-agent identification capabilities.',
        identifier: 'CBRN Mobile Lab',
        quantity: '2 mobile units + 6 technicians',
        dateOrdered: new Date().toISOString(),
        timeOrdered: '08:30',
        eta: new Date().toISOString(),
        etaTime: 'Now',
        status: 'Onsite'
      },
      {
        id: '4',
        name: 'CBP Air & Marine Operations – Surveillance Aircraft',
        description: 'Multi-mission aircraft for airspace monitoring and TFR enforcement during match operations. Equipped with advanced surveillance systems, thermal imaging, and real-time communication links to Joint Operations Center.',
        identifier: 'Air Surveillance',
        quantity: '2 aircraft + aircrews',
        dateOrdered: new Date().toISOString(),
        timeOrdered: '11:15',
        eta: new Date(Date.now() + 6 * 3600000).toISOString(),
        etaTime: '18:00',
        status: 'Deployed'
      }
    ]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  
  // Form state for resource (add or edit)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    identifier: '',
    quantity: '',
    dateOrdered: new Date().toISOString(),
    timeOrdered: '00:00',
    etaDate: '',
    etaTime: '00:00',
    status: '',
  });

  // Generate time options (every 15 minutes)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        times.push(`${h}:${m}`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Helper to format date for display
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  // Helper to parse date string back to Date object
  const parseDateString = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const updateData = (newResources: Resource[]) => {
    setResources(newResources);
    onDataChange({ ...data, resources: newResources });
  };

  const openAddResourceSheet = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${Math.floor(now.getMinutes() / 15) * 15}`.padStart(5, '0');
    
    setEditingResourceId(null);
    setFormData({
      name: '',
      description: '',
      identifier: '',
      quantity: '',
      dateOrdered: now.toISOString(),
      timeOrdered: currentTime,
      etaDate: '',
      etaTime: '00:00',
      status: '',
    });
    setIsSheetOpen(true);
  };

  const openEditResourceSheet = (id: string) => {
    const resource = resources.find(r => r.id === id);
    if (resource) {
      setEditingResourceId(id);
      setFormData({
        name: resource.name,
        description: resource.description,
        identifier: resource.identifier,
        quantity: resource.quantity,
        dateOrdered: resource.dateOrdered,
        timeOrdered: resource.timeOrdered,
        etaDate: resource.eta || '',
        etaTime: resource.etaTime || '00:00',
        status: resource.status,
      });
      setIsSheetOpen(true);
    }
  };

  const saveResource = () => {
    if (!formData.name || !formData.identifier || !formData.quantity || !formData.status) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingResourceId) {
      // Update existing resource
      const updatedResources = resources.map(r => 
        r.id === editingResourceId ? {
          ...r,
          name: formData.name,
          description: formData.description,
          identifier: formData.identifier,
          quantity: formData.quantity,
          dateOrdered: formData.dateOrdered,
          timeOrdered: formData.timeOrdered,
          eta: formData.etaDate,
          etaTime: formData.etaTime,
          status: formData.status,
        } : r
      );
      updateData(updatedResources);
      toast.success('Resource updated successfully');
    } else {
      // Add new resource
      const newResource: Resource = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        identifier: formData.identifier,
        quantity: formData.quantity,
        dateOrdered: formData.dateOrdered,
        timeOrdered: formData.timeOrdered,
        eta: formData.etaDate,
        etaTime: formData.etaTime,
        status: formData.status,
      };
      
      updateData([...resources, newResource]);
      toast.success('Resource added successfully');
    }
    
    setIsSheetOpen(false);
    setEditingResourceId(null);
  };

  const deleteResource = (id: string) => {
    updateData(resources.filter(r => r.id !== id));
    toast.success('Resource deleted successfully');
  };

  const toggleResource = (resourceId: string) => {
    setExpandedResources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  };

  // Filter resources based on search term
  const filteredResources = resources.filter(resource => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    return resource.name.toLowerCase().includes(searchLower) ||
           resource.identifier.toLowerCase().includes(searchLower) ||
           resource.description.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-6">
      {/* Header Section - Sticky */}
      <div className="sticky top-0 z-10 bg-[#222529] rounded-lg border border-[#6e757c] relative">
        <div className="flex items-center justify-between px-[13px] py-3 w-full border-b-2 border-border rounded-t-lg rounded-b-none">
          {/* Title and Search */}
          <div className="flex items-center gap-4">
            <p className="caption text-nowrap text-white whitespace-pre">
              Resources
            </p>
            
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
          </div>

          {/* Add Resource Button */}
          <button
            onClick={openAddResourceSheet}
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
              Add Resource
            </p>
          </button>
        </div>
      </div>

      {/* Resources List */}
      <div className="space-y-4">
        {filteredResources.map((resource) => (
          <div
            key={resource.id}
            className="border border-border rounded-lg overflow-hidden"
            style={{ 
              background: 'linear-gradient(90deg, rgba(2, 163, 254, 0.08) 0%, rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, rgb(20, 23, 26) 0%, rgb(20, 23, 26) 100%)'
            }}
          >
            {/* Resource Header */}
            <div className={`p-3 ${expandedResources.has(resource.id) ? 'border-b border-border' : ''}`}>
              <div className="flex items-start justify-between">
                <div 
                  className="flex items-start gap-2 flex-1 cursor-pointer"
                  onClick={() => toggleResource(resource.id)}
                >
                  {expandedResources.has(resource.id) ? (
                    <ChevronDown className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="caption text-white">{resource.name}</span>
                    {!expandedResources.has(resource.id) && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="caption text-white">
                          {resource.identifier} • Qty: {resource.quantity}
                        </span>
                        {resource.status && (
                          <div className="flex items-center gap-1.5">
                            {resource.status === 'Onsite' && (
                              <>
                                <MapPin className="h-3 w-3" style={{ color: '#12B76A' }} />
                                <span className="caption" style={{ color: '#12B76A' }}>Onsite</span>
                              </>
                            )}
                            {resource.status === 'In Transit' && (
                              <>
                                <Route className="h-3 w-3" style={{ color: '#FEC84B' }} />
                                <span className="caption" style={{ color: '#FEC84B' }}>In Transit</span>
                              </>
                            )}
                            {resource.status === 'Deployed' && (
                              <>
                                <Box className="h-3 w-3" style={{ color: '#72D4D4' }} />
                                <span className="caption" style={{ color: '#72D4D4' }}>Deployed</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle map action here
                    }}
                    className="p-1 hover:bg-muted/30 rounded transition-colors"
                  >
                    <Map className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditResourceSheet(resource.id);
                    }}
                    className="p-1 hover:bg-muted/30 rounded transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteResource(resource.id);
                    }}
                    className="p-1 hover:bg-muted/30 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Resource Details (Expanded) */}
            {expandedResources.has(resource.id) && (
              <div className="p-4 space-y-4 bg-card/50">
                {/* Description */}
                {resource.description && (
                  <div>
                    <label className="text-white mb-1 block">Description</label>
                    <p className="caption text-white">{resource.description}</p>
                  </div>
                )}

                {/* Resource Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white mb-1 block">Resource Type</label>
                    <p className="caption text-white">{resource.identifier}</p>
                  </div>
                  <div>
                    <label className="text-white mb-1 block">Quantity</label>
                    <p className="caption text-white">{resource.quantity}</p>
                  </div>
                  <div>
                    <label className="text-white mb-1 block">Date/Time Ordered</label>
                    <p className="caption text-white">
                      {resource.dateOrdered && resource.timeOrdered 
                        ? `${formatDateDisplay(resource.dateOrdered)} ${resource.timeOrdered}` 
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-white mb-1 block">ETA</label>
                    <p className="caption text-white">
                      {resource.eta && resource.etaTime 
                        ? `${formatDateDisplay(resource.eta)} ${resource.etaTime}` 
                        : resource.eta 
                        ? formatDateDisplay(resource.eta)
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-white mb-1 block">Status</label>
                    <div className="flex items-center gap-2">
                      {resource.status === 'Onsite' && (
                        <>
                          <MapPin className="h-4 w-4" style={{ color: '#12B76A' }} />
                          <span className="caption" style={{ color: '#12B76A' }}>Onsite</span>
                        </>
                      )}
                      {resource.status === 'In Transit' && (
                        <>
                          <Route className="h-4 w-4" style={{ color: '#FEC84B' }} />
                          <span className="caption" style={{ color: '#FEC84B' }}>In Transit</span>
                        </>
                      )}
                      {resource.status === 'Deployed' && (
                        <>
                          <Box className="h-4 w-4" style={{ color: '#72D4D4' }} />
                          <span className="caption" style={{ color: '#72D4D4' }}>Deployed</span>
                        </>
                      )}
                      {!resource.status && (
                        <span className="text-white caption">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Resource Side Panel */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[640px] bg-card overflow-y-auto px-6">
          <SheetHeader>
            <SheetTitle>{editingResourceId ? 'Edit Resource' : 'Add Resource'}</SheetTitle>
            <SheetDescription>
              {editingResourceId 
                ? 'Update the resource information below.'
                : 'Fill in the form below to add a new resource to the incident.'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6 pb-6">
            {/* Resource Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Resource Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Mobile Generator Sets (MHE)"
                className="bg-input-background border-border"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-input-background border-border min-h-[120px] resize-none"
              />
            </div>

            {/* Resource Identifier */}
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-foreground">
                Resource Type <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.identifier} onValueChange={(value) => setFormData({ ...formData, identifier: value })}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Emergency Response Vessel">Emergency Response Vessel</SelectItem>
                  <SelectItem value="Well Control Team">Well Control Team</SelectItem>
                  <SelectItem value="ROV Operations">ROV Operations</SelectItem>
                  <SelectItem value="Helicopter Transport">Helicopter Transport</SelectItem>
                  <SelectItem value="Supply Vessel">Supply Vessel</SelectItem>
                  <SelectItem value="Crane Barge">Crane Barge</SelectItem>
                  <SelectItem value="Dive Support Vessel">Dive Support Vessel</SelectItem>
                  <SelectItem value="Oil Spill Response">Oil Spill Response</SelectItem>
                  <SelectItem value="Structural Engineers">Structural Engineers</SelectItem>
                  <SelectItem value="Platform Maintenance">Platform Maintenance</SelectItem>
                  <SelectItem value="Subsea Repair">Subsea Repair</SelectItem>
                  <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
                  <SelectItem value="Medical Personnel">Medical Personnel</SelectItem>
                  <SelectItem value="Environmental Monitoring">Environmental Monitoring</SelectItem>
                  <SelectItem value="Weather Forecasting">Weather Forecasting</SelectItem>
                  <SelectItem value="Marine Coordination">Marine Coordination</SelectItem>
                </SelectContent>
              </Select>
              <button className="text-accent hover:text-accent/80 text-sm mt-2">
                Add Custom Resource Type
              </button>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-foreground">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="bg-input-background border-border"
              />
            </div>

            {/* Date Time Ordered */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Date Time Ordered</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left bg-input-background border-border hover:bg-input-background/80"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dateOrdered ? formatDateDisplay(formData.dateOrdered) : <span className="text-muted-foreground">Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDateString(formData.dateOrdered)}
                      onSelect={(date) => setFormData({ ...formData, dateOrdered: date ? date.toISOString() : new Date().toISOString() })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Time:</Label>
                <Select value={formData.timeOrdered} onValueChange={(value) => setFormData({ ...formData, timeOrdered: value })}>
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ETA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">ETA</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left bg-input-background border-border hover:bg-input-background/80"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.etaDate ? formatDateDisplay(formData.etaDate) : <span className="text-muted-foreground">Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDateString(formData.etaDate)}
                      onSelect={(date) => setFormData({ ...formData, etaDate: date ? date.toISOString() : '' })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Time:</Label>
                <Select value={formData.etaTime} onValueChange={(value) => setFormData({ ...formData, etaTime: value })}>
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-foreground">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Onsite">Onsite</SelectItem>
                  <SelectItem value="Deployed">Deployed</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={saveResource}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {editingResourceId ? 'Update Resource' : 'Add Resource'}
              </Button>
              <Button
                onClick={() => setIsSheetOpen(false)}
                variant="outline"
                className="flex-1 border-border"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
