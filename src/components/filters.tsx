'use client'

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { regions, municipalities } from '@/lib/locations';
import { Card } from './ui/card';
import { MapPin, Building } from 'lucide-react';

export function Filters() {
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

    return (
        <Card className="p-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" /> REGION
                    </label>
                    <Select onValueChange={setSelectedRegion}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Regions" />
                        </SelectTrigger>
                        <SelectContent>
                            {regions.map(region => (
                                <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Building className="h-4 w-4" /> MUNICIPALITY/DISTRICT
                    </label>
                    <Select disabled={!selectedRegion}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Municipalities" />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedRegion && municipalities[selectedRegion]?.map(muni => (
                                <SelectItem key={muni} value={muni}>{muni}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
    )
}
