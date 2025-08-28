"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import MatchDisplay from '@/components/classfinder/MatchDisplay';
import type { Match, User, MatchDayEvent, ViewPreference, TimeOfDayFilterType, SortOption, MatchPadelLevel } from '@/types';
import { getMockClubs, fetchMatches, getMockCurrentUser, fetchMatchDayEventsForDate } from '@/lib/mockData';

const MatchesPageContent: React.FC = () => {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [allMatches, setAllMatches] = useState<Match[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [timeSlotFilter, setTimeSlotFilter] = useState<TimeOfDayFilterType>('all');
	const [selectedLevel, setSelectedLevel] = useState<MatchPadelLevel | 'all'>('all');
	const [sortBy, setSortBy] = useState<SortOption>('time');
	const [viewPreference, setViewPreference] = useState<ViewPreference>('normal');
	const [filterAlsoConfirmedMatches, setFilterAlsoConfirmedMatches] = useState(false);
	const [matchDayEvents, setMatchDayEvents] = useState<MatchDayEvent[]>([]);
	const [refreshKey, setRefreshKey] = useState(0);

	useEffect(() => {
		setCurrentUser(getMockCurrentUser());
		const load = async () => {
			setIsLoading(true);
			const matches = await fetchMatches();
			setAllMatches(matches);
			setIsLoading(false);
		};
		load();
	}, []);

	useEffect(() => {
		const loadEvents = async () => {
			if (!selectedDate) { setMatchDayEvents([]); return; }
			const events = await fetchMatchDayEventsForDate(selectedDate);
			setMatchDayEvents(events);
		};
		loadEvents();
	}, [selectedDate]);

	const handleBookingSuccess = useCallback(() => {
		setRefreshKey(k => k + 1);
	}, []);

	return (
		<MatchDisplay
			currentUser={currentUser}
			onBookingSuccess={handleBookingSuccess}
			filterByClubId={null}
			filterByGratisOnly={false}
			filterByLiberadasOnly={false}
			filterByPuntosOnly={false}
			filterByProOnly={false}
			onDeactivateGratisFilter={undefined}
			matchShareCode={null}
			matchIdFilter={null}
			selectedDate={selectedDate}
			onDateChange={setSelectedDate}
			timeSlotFilter={timeSlotFilter}
			selectedLevel={selectedLevel}
			sortBy={sortBy}
			filterAlsoConfirmedMatches={filterAlsoConfirmedMatches}
			viewPreference={viewPreference}
			proposalView={'join'}
			refreshKey={refreshKey}
			allMatches={allMatches}
			isLoading={isLoading}
			matchDayEvents={matchDayEvents}
			dateStripIndicators={{}}
			dateStripDates={[]}
			onViewPrefChange={() => {}}
			showPointsBonus={true}
		/>
	);
};

export default MatchesPageContent;

