'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { FilterX } from 'lucide-react';

export function Filters() {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r bg-card p-4 lg:flex">
      <h2 className="font-headline text-lg font-semibold">Filters</h2>
      <Separator className="my-4" />

      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* View Filter */}
        <div className="space-y-2">
          <Label className="font-semibold">View</Label>
          <RadioGroup defaultValue="available" className="space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="available" id="r1" />
              <Label htmlFor="r1">Available</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="my-bookings" id="r2" />
              <Label htmlFor="r2">My Bookings</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="confirmed" id="r3" />
              <Label htmlFor="r3">Confirmed</Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Time Filter */}
        <div className="space-y-2">
          <Label className="font-semibold">Time of Day</Label>
          <RadioGroup defaultValue="all" className="space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="t-all" />
              <Label htmlFor="t-all">Any</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mornings" id="t-mornings" />
              <Label htmlFor="t-mornings">Mornings</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="midday" id="t-midday" />
              <Label htmlFor="t-midday">Midday</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="afternoons" id="t-afternoons" />
              <Label htmlFor="t-afternoons">Afternoons</Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Level Filter */}
        <div className="space-y-2">
          <Label htmlFor="level-select" className="font-semibold">
            Level
          </Label>
          <Select>
            <SelectTrigger id="level-select">
              <SelectValue placeholder="Any Level" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(12)].map((_, i) => (
                <SelectItem key={i} value={`${(i + 2) * 0.5}`}>
                  {(i + 2) * 0.5}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Favorite Instructors Filter */}
        <div className="flex items-center justify-between">
          <Label htmlFor="fav-instructors" className="font-semibold">
            Favorite Instructors
          </Label>
          <Switch id="fav-instructors" />
        </div>
      </div>

      <Separator className="my-4" />
      <Button variant="ghost">
        <FilterX className="mr-2 h-4 w-4" /> Clear All Filters
      </Button>
    </aside>
  );
}
