import React, { createContext, useContext, useMemo, useReducer } from 'react';

const WALKERS = [
 { id: 'w1', name: 'Jessica Park', emoji: '‍', suburb: 'Surry Hills', distance: 0.4, rating: 4.9, reviewCount: 287, pricePerWalk: 28, pricePer30: 18, available: true, nextSlot: 'Today 7am', dogs: 'Up to 3', badge: 'Top Rated', badgeColor: '#F59E0B', services: ['Solo walk', 'Group walk', 'Drop-in visit'], bio: 'Professional dog walker for 5 years. First aid certified. GPS tracked every walk.', tags: ['GPS tracking', 'Insured', 'Small dogs', 'Large dogs'] },
 { id: 'w2', name: 'Tom Bradley', emoji: '��‍', suburb: 'Newtown', distance: 1.1, rating: 4.8, reviewCount: 194, pricePerWalk: 25, pricePer30: 16, available: true, nextSlot: 'Today 8am', dogs: 'Up to 4', badge: 'Popular', badgeColor: '#6366F1', services: ['Group walk', 'Solo walk'], bio: 'Former vet nurse. Great with anxious and reactive dogs.', tags: ['Reactive dogs ok', 'Vet background', 'Large groups'] },
 { id: 'w3', name: 'Mei Lin', emoji: '', suburb: 'Glebe', distance: 1.4, rating: 5.0, reviewCount: 76, pricePerWalk: 35, pricePer30: 22, available: false, nextSlot: 'Tomorrow 7am', dogs: 'Solo only', badge: 'Premium', badgeColor: '#8B5CF6', services: ['Solo walk only'], bio: 'Solo walks only — your dog gets 100% of my attention.', tags: ['Solo only', 'Premium', 'Photo updates'] },
 { id: 'w4', name: 'Marcus Chen', emoji: '', suburb: 'Paddington', distance: 1.9, rating: 4.7, reviewCount: 312, pricePerWalk: 22, pricePer30: 15, available: true, nextSlot: 'Today 6am', dogs: 'Up to 5', badge: null, services: ['Group walk', 'Drop-in'], bio: 'I love dogs! Early morning and after-work walks my specialty.', tags: ['Early morning', 'After work', 'Budget friendly'] },
 { id: 'w5', name: 'Sophie Reed', emoji: '‍', suburb: 'Leichhardt', distance: 2.3, rating: 4.8, reviewCount: 145, pricePerWalk: 28, pricePer30: 18, available: true, nextSlot: 'Today 3pm', dogs: 'Up to 3', badge: null, services: ['Solo walk', 'Group walk', 'Puppy visits'], bio: 'Specialise in puppies and seniors. Patience and love guaranteed.', tags: ['Puppies', 'Senior dogs', 'Afternoon walks'] },
 { id: 'w6', name: 'Ryan Murphy', emoji: '‍', suburb: 'Marrickville', distance: 2.7, rating: 4.6, reviewCount: 98, pricePerWalk: 20, pricePer30: 13, available: true, nextSlot: 'Today 5pm', dogs: 'Up to 6', badge: 'Budget', badgeColor: '#10B981', services: ['Group walk'], bio: 'Great with big groups! Most affordable rates in the area.', tags: ['Budget', 'Large groups', 'Evening walks'] },
 { id: 'w7', name: 'Priya Kapoor', emoji: '‍', suburb: 'Balmain', distance: 3.1, rating: 4.9, reviewCount: 223, pricePerWalk: 30, pricePer30: 20, available: false, nextSlot: 'Tomorrow 8am', dogs: 'Up to 3', badge: 'Certified', badgeColor: '#0EA5E9', services: ['Solo walk', 'Group walk', 'Training walk'], bio: 'Certified dog trainer. Walks include basic training reinforcement.', tags: ['Dog trainer', 'Training walks', 'Certified'] },
 { id: 'w8', name: 'Alex Turner', emoji: '', suburb: 'Rozelle', distance: 3.4, rating: 4.7, reviewCount: 167, pricePerWalk: 24, pricePer30: 16, available: true, nextSlot: 'Today 2pm', dogs: 'Up to 4', badge: null, services: ['Group walk', 'Drop-in visit'], bio: 'Reliable and punctual. Photo updates after every walk.', tags: ['Photo updates', 'Reliable', 'Weekend available'] },
 { id: 'w9', name: 'Chloe Nguyen', emoji: '‍', suburb: 'Darlinghurst', distance: 0.8, rating: 4.9, reviewCount: 131, pricePerWalk: 32, pricePer30: 21, available: true, nextSlot: 'Today 1pm', dogs: 'Up to 2', badge: 'Top Rated', badgeColor: '#F59E0B', services: ['Solo walk', 'Puppy visit'], bio: 'Boutique dog walking with premium care, updates, and tidy handovers.', tags: ['Premium care', 'Photo updates', 'Puppies'] },
 { id: 'w10', name: 'Ben Carter', emoji: '‍', suburb: 'Redfern', distance: 1.6, rating: 4.5, reviewCount: 88, pricePerWalk: 19, pricePer30: 12, available: true, nextSlot: 'Today 4pm', dogs: 'Up to 5', badge: 'Budget', badgeColor: '#10B981', services: ['Group walk', 'Drop-in visit'], bio: 'Affordable weekday walks with flexible pickup windows and solid reliability.', tags: ['Budget', 'Flexible pickup', 'Weekdays'] },
 { id: 'w11', name: 'Lucia Gomez', emoji: '‍', suburb: 'Erskineville', distance: 2.1, rating: 4.8, reviewCount: 156, pricePerWalk: 27, pricePer30: 17, available: false, nextSlot: 'Tomorrow 9am', dogs: 'Up to 3', badge: 'Popular', badgeColor: '#6366F1', services: ['Solo walk', 'Group walk', 'Drop-in visit'], bio: 'Calm, dependable walker with a loyal repeat client base across the inner west.', tags: ['Repeat clients', 'Calm energy', 'Inner west'] },
 { id: 'w12', name: 'Ethan Clarke', emoji: '', suburb: 'Alexandria', distance: 3.8, rating: 4.7, reviewCount: 204, pricePerWalk: 26, pricePer30: 17, available: true, nextSlot: 'Today 6pm', dogs: 'Up to 4', badge: 'Certified', badgeColor: '#0EA5E9', services: ['Solo walk', 'Group walk', 'Training walk'], bio: 'Structured walks for energetic dogs with clear communication and evening coverage.', tags: ['Evening walks', 'High energy dogs', 'Certified'] },
];

const quickReplies = {
 walker: 'I found a few strong matches: Jessica for trust, Marcus for value, and Mei for premium solo care.',
 group: 'Group walks are more social and lower cost. Solo walks suit anxious dogs, puppies, or training goals.',
 gps: 'WoofWalks uses alphinium-maps for live GPS, route playback, and photo updates during the walk.',
 business: 'This demo can be turned into a live dog walking marketplace with alphinium-payments, maps, and push notifications.',
 default: 'Woof! I can help you compare walkers, explain service types, or show how WoofWalks could power your business.',
};

const initialState = {
 walkers: WALKERS,
 phase: 'home',
 selectedWalker: WALKERS[0],
 filters: { available: 'Any', sortBy: 'Distance', priceMax: 'Any', serviceType: 'All' },
 searchText: '',
 bookingData: { dogName: 'Buddy', breed: 'Cavoodle', size: 'Medium', serviceType: 'Group walk', date: 'Today', time: '7:00 AM', recurring: false, notes: 'Friendly with other dogs and loves park loops.' },
 bookingStep: 0,
 trackingActive: true,
 trackingProgress: 0.4,
 permissions: { location: null, notifications: null },
 chatOpen: false,
 chatInput: '',
 chatMessages: [
 {
 id: 'intro',
 role: 'assistant',
 text: "Woof! I'm Ruff, your demo walk assistant — powered by ChatInstance. WoofWalks is an alphinium aggregator. Find a walker for your pup, or ask how to build this for your dog walking business!",
 },
 ],
};

function buildRuffReply(message) {
 const text = message.toLowerCase();
 if (text.includes('find') || text.includes('walker')) return quickReplies.walker;
 if (text.includes('group') || text.includes('solo')) return quickReplies.group;
 if (text.includes('gps') || text.includes('track') || text.includes('map')) return quickReplies.gps;
 if (text.includes('business') || text.includes('build') || text.includes('my')) return quickReplies.business;
 return quickReplies.default;
}

function reducer(state, action) {
 switch (action.type) {
 case 'SET_PERMISSIONS':
 return {
 ...state,
 permissions: {
 ...state.permissions,
 ...action.payload,
 },
 };
 case 'SET_PHASE':
 return {
 ...state,
 phase: action.payload,
 bookingStep: action.payload === 'booking' ? 0 : state.bookingStep,
 };
 case 'SELECT_WALKER':
 return {
 ...state,
 selectedWalker: action.payload,
 phase: action.phase || state.phase,
 bookingStep: 0,
 };
 case 'SET_FILTER':
 return {
 ...state,
 filters: {
 ...state.filters,
 [action.key]: action.value,
 },
 };
 case 'SET_SEARCH':
 return { ...state, searchText: action.payload };
 case 'SET_BOOKING_DATA':
 return {
 ...state,
 bookingData: {
 ...state.bookingData,
 ...action.payload,
 },
 };
 case 'NEXT_BOOKING_STEP':
 return { ...state, bookingStep: Math.min(state.bookingStep + 1, 2) };
 case 'START_TRACKING':
 return { ...state, trackingActive: true, phase: 'tracking' };
 case 'TOGGLE_CHAT':
 return { ...state, chatOpen: !state.chatOpen };
 case 'SET_CHAT_INPUT':
 return { ...state, chatInput: action.payload };
 case 'SEND_CHAT': {
 const input = (action.payload || state.chatInput).trim();
 if (!input) return state;
 return {
 ...state,
 chatInput: '',
 chatOpen: true,
 chatMessages: [
 ...state.chatMessages,
 { id: `user-${state.chatMessages.length + 1}`, role: 'user', text: input },
 { id: `assistant-${state.chatMessages.length + 2}`, role: 'assistant', text: buildRuffReply(input) },
 ],
 };
 }
 default:
 return state;
 }
}

const WoofContext = createContext(null);

export function WoofProvider({ children }) {
 const [state, dispatch] = useReducer(reducer, initialState);
 const value = useMemo(() => ({ state, dispatch }), [state]);
 return <WoofContext.Provider value={value}>{children}</WoofContext.Provider>;
}

export function useWoof() {
 const context = useContext(WoofContext);
 if (!context) {
 throw new Error('useWoof must be used inside WoofProvider');
 }
 return context;
}

export function filterWalkers(state) {
 const search = state.searchText.trim().toLowerCase();
 const filtered = state.walkers.filter((walker) => {
 const matchesSearch = !search || walker.name.toLowerCase().includes(search) || walker.suburb.toLowerCase().includes(search);
 const matchesAvailability = state.filters.available === 'Any' || walker.available;
 const maxPrice = state.filters.priceMax === 'Any' ? Infinity : Number(state.filters.priceMax.replace(/[^0-9]/g, ''));
 const matchesPrice = walker.pricePerWalk <= maxPrice;
 const desiredService = state.filters.serviceType;
 const matchesService =
 desiredService === 'All' ||
 walker.services.some((service) => service.toLowerCase().includes(desiredService.toLowerCase().replace(' walk', '').replace('-', ' ')));

 return matchesSearch && matchesAvailability && matchesPrice && matchesService;
 });

 const sorted = [...filtered].sort((a, b) => {
 if (state.filters.sortBy === 'Rating') return b.rating - a.rating;
 if (state.filters.sortBy === 'Price ↑') return a.pricePerWalk - b.pricePerWalk;
 return a.distance - b.distance;
 });

 return sorted;
}

export function getWalkerReviews(walker) {
 if (!walker) return [];
 return [
 { id: 'r1', author: 'Mia & Poppy', rating: 5, text: `${walker.name.split(' ')[0]} is reliable, calm, and always sends the best photo updates.` },
 { id: 'r2', author: 'Sam with Archie', rating: 5, text: `Booking was easy and Archie came home happy after every ${walker.services[0].toLowerCase()}.` },
 { id: 'r3', author: 'Ava & Luna', rating: 4.8, text: `Great communication, punctual arrivals, and a very trustworthy neighborhood walker.` },
 ];
}
