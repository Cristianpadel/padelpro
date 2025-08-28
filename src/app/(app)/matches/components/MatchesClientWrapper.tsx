"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const MatchesPageContent = dynamic(() => import('./MatchesPageContent'), { ssr: false });

const MatchesClientWrapper: React.FC = () => {
	return <MatchesPageContent />;
};

export default MatchesClientWrapper;

