"use client";

import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PadelCourt, CourtGridBooking, PadelCourtStatus, TimeSlot, Match } from '@/types'; // Added TimeSlot, Match
import { format, isEqual, addMinutes, startOfDay } from 'date-fns'; // Removed startOfDay as it's passed or handled by parent
import { isSlotEffectivelyCompleted as isActivityConfirmed } from '@/lib/mockData'; // Renamed for clarity

const getBookingStyling = (status: PadelCourtStatus | undefined, type?: CourtGridBooking['type'], activityStatus?: TimeSlot['status'] | Match['status']): string => {
    if (status === 'bloqueo_provisional') return 'bg-gray-200 text-gray-600 border-dashed border-gray-400';
    if (status === 'reservada' || activityStatus === 'confirmed' || activityStatus === 'confirmed_private') {
        if (type === 'clase') return 'bg-blue-500 text-white border-blue-700';
        if (type === 'partida') return 'bg-purple-500 text-white border-purple-700';
        return 'bg-red-500 text-white border-red-700'; // Manual/Mantenimiento
    }
    // For 'proceso_inscripcion' or 'forming'
    if (type === 'clase') return 'bg-blue-200 text-blue-800 border-blue-400';
    if (type === 'partida') return 'bg-purple-200 text-purple-800 border-purple-400';
    if (status === 'mantenimiento' || status === 'desactivada') return 'bg-gray-400 text-white border-gray-500';
    return 'bg-yellow-200 text-yellow-800 border-yellow-400'; // Default for pre-reg/forming if not specified
};

const freeSlotBaseClasses = "bg-background hover:bg-muted cursor-pointer text-foreground border-transparent hover:border-border transition-colors duration-150 ease-in-out rounded-sm hover:shadow-inner";
const freeSlotPastClasses = "bg-gray-100 text-gray-400 pointer-events-none border-gray-200 rounded-sm";


interface BookingGridDisplayProps {
  courts: PadelCourt[];
  timeGrid: Date[];
  getBookingForCell: (courtNumber: number, time: Date) => CourtGridBooking | undefined;
  getBookingDurationInSlots: (booking: CourtGridBooking) => number;
  currentTime: Date;
  currentDate: Date; // For checking if the current cell is in the past relative to selected date
  openManualBookingDialog: (courtNumber: number, startTime: Date) => void;
  timeSlotsInterval: number;
}

const BookingGridDisplay: React.FC<BookingGridDisplayProps> = ({
  courts,
  timeGrid,
  getBookingForCell,
  getBookingDurationInSlots,
  currentTime,
  currentDate,
  openManualBookingDialog,
  timeSlotsInterval
}) => {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="overflow-x-auto border border-border rounded-lg shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 border-r border-border text-xs font-semibold text-muted-foreground w-20 sticky left-0 bg-muted z-10">Hora</th>
              {courts.map(court => (
                <th key={court.id} className="p-2 border-r border-border text-xs font-semibold text-muted-foreground min-w-[100px] whitespace-normal">
                  {court.name} <span className="text-gray-400">(P{court.courtNumber})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeGrid.map((timeSlotStart) => (
              <tr
                key={timeSlotStart.toISOString()}
                className={cn(
                  "border-b border-border",
                  isEqual(
                    new Date(timeSlotStart.getFullYear(), timeSlotStart.getMonth(), timeSlotStart.getDate(), timeSlotStart.getHours(), timeSlotStart.getMinutes()),
                    new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), currentTime.getHours(), Math.floor(currentTime.getMinutes() / timeSlotsInterval) * timeSlotsInterval)
                  ) && isEqual(startOfDay(currentDate), startOfDay(currentTime)) && "bg-primary/10 border-l-4 border-accent"
                )}
              >
                <td className="p-1.5 border-r border-border text-xs text-center text-muted-foreground sticky left-0 bg-background z-10 min-h-[2.5rem] h-[2.5rem]">
                  {format(timeSlotStart, "HH:mm")}
                </td>
                {courts.map(court => {
                  const booking = getBookingForCell(court.courtNumber, timeSlotStart);
                  const isCurrentDay = isEqual(startOfDay(currentDate), startOfDay(currentTime));
                  const timeSlotEnd = addMinutes(timeSlotStart, timeSlotsInterval);
                  const isPastSlot = isCurrentDay && timeSlotEnd <= currentTime;

                  if (booking && isEqual(new Date(booking.startTime), timeSlotStart)) {
                    const durationSlots = getBookingDurationInSlots(booking);
                    const isBookingPast = isCurrentDay && new Date(booking.endTime) <= currentTime;
                    return (
                      <td
                        key={`${court.id}-${timeSlotStart.toISOString()}-booked`}
                        className={cn("border-r border-border relative p-0 align-top")}
                        rowSpan={durationSlots}
                      >
                        <div
                          className={cn(
                            "h-full w-full flex flex-col items-center justify-center text-center leading-tight rounded-md shadow-sm m-0.5 border",
                            isBookingPast ? "bg-gray-200 text-gray-500 border-gray-300" : getBookingStyling(booking.status, booking.type, booking.activityStatus),
                            "p-1",
                            `min-h-[calc(${durationSlots}*2.5rem)]`
                          )}
                          style={{ height: `calc(${durationSlots} * 2.5rem - 2px)` }}
                          // onClick={() => console.log("Clicked booking:", booking)}
                        >
                          <span className="font-semibold text-[10px] break-words line-clamp-2">{booking.title}</span>
                          {booking.provisionalExpiresAt && (
                                <span className="text-[9px] text-gray-500">Expira: {format(new Date(booking.provisionalExpiresAt), 'dd/MM HH:mm')}</span>
                          )}
                          {booking.participants !== undefined && booking.maxParticipants !== undefined && !booking.provisionalExpiresAt && (
                            <span className="text-[9px]">({booking.participants}/{booking.maxParticipants})</span>
                          )}
                        </div>
                      </td>
                    );
                  } else if (booking && new Date(booking.startTime) < timeSlotStart) {
                    return null; // Cell covered by a booking starting earlier
                  }

                  return (
                    <td
                      key={`${court.id}-${timeSlotStart.toISOString()}-free`}
                      className={cn(
                        "p-1 border-r border-border text-xs text-center min-h-[2.5rem] h-[2.5rem]",
                        isPastSlot ? freeSlotPastClasses : freeSlotBaseClasses
                      )}
                      onClick={isPastSlot ? undefined : () => openManualBookingDialog(court.courtNumber, timeSlotStart)}
                    >
                      {/* Content for free slots (e.g., a plus icon if desired) */}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default BookingGridDisplay;
