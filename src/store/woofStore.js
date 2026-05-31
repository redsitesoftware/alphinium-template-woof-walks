import React, { createContext, useContext, useMemo, useReducer } from 'react';

const WALKERS = [
 { id: 'w1', name: 'Jessica Park', emoji: '‍', suburb: 'Surry Hills', distance: 0.4, rating: 4.9, reviewCount: 287, pricePerWalk: 28, pricePer30: 18, available: true, nextSlot: 'Today 7am', dogs: 'Up to 3', badge: 'Top Rated', badgeColor: '#F59E0B', services: ['Solo walk', 'Group walk', 'Drop-in visit'], bio: 'Professional dog walker for 5 years. First aid certified. GPS tracked every walk.', tags: ['GPS tracking', 'Insured', 'Small dogs', 'Large dogs'], ratingBreakdown: { reliability: 4.9, punctuality: 4.8, communication: 5.0, care: 4.9 } },
 { id: 'w2', name: 'Tom Bradley', emoji: '��‍', suburb: 'Newtown', distance: 1.1, rating: 4.8, reviewCount: 194, pricePerWalk: 25, pricePer30: 16, available: true, nextSlot: 'Today 8am', dogs: 'Up to 4', badge: 'Popular', badgeColor: '#6366F1', services: ['Group walk', 'Solo walk'], bio: 'Former vet nurse. Great with anxious and reactive dogs.', tags: ['Reactive dogs ok', 'Vet background', 'Large groups'], ratingBreakdown: { reliability: 4.8, punctuality: 4.7, communication: 4.9, care: 5.0 } },
 { id: 'w3', name: 'Mei Lin', emoji: '', suburb: 'Glebe', distance: 1.4, rating: 5.0, reviewCount: 76, pricePerWalk: 35, pricePer30: 22, available: false, nextSlot: 'Tomorrow 7am', dogs: 'Solo only', badge: 'Premium', badgeColor: '#8B5CF6', services: ['Solo walk only'], bio: 'Solo walks only — your dog gets 100% of my attention.', tags: ['Solo only', 'Premium', 'Photo updates'], ratingBreakdown: { reliability: 5.0, punctuality: 5.0, communication: 5.0, care: 5.0 } },
 { id: 'w4', name: 'Marcus Chen', emoji: '', suburb: 'Paddington', distance: 1.9, rating: 4.7, reviewCount: 312, pricePerWalk: 22, pricePer30: 15, available: true, nextSlot: 'Today 6am', dogs: 'Up to 5', badge: null, services: ['Group walk', 'Drop-in'], bio: 'I love dogs! Early morning and after-work walks my specialty.', tags: ['Early morning', 'After work', 'Budget friendly'], ratingBreakdown: { reliability: 4.7, punctuality: 4.9, communication: 4.6, care: 4.7 } },
 { id: 'w5', name: 'Sophie Reed', emoji: '‍', suburb: 'Leichhardt', distance: 2.3, rating: 4.8, reviewCount: 145, pricePerWalk: 28, pricePer30: 18, available: true, nextSlot: 'Today 3pm', dogs: 'Up to 3', badge: null, services: ['Solo walk', 'Group walk', 'Puppy visits'], bio: 'Specialise in puppies and seniors. Patience and love guaranteed.', tags: ['Puppies', 'Senior dogs', 'Afternoon walks'], ratingBreakdown: { reliability: 4.8, punctuality: 4.7, communication: 4.9, care: 5.0 } },
 { id: 'w6', name: 'Ryan Murphy', emoji: '‍', suburb: 'Marrickville', distance: 2.7, rating: 4.6, reviewCount: 98, pricePerWalk: 20, pricePer30: 13, available: true, nextSlot: 'Today 5pm', dogs: 'Up to 6', badge: 'Budget', badgeColor: '#10B981', services: ['Group walk'], bio: 'Great with big groups! Most affordable rates in the area.', tags: ['Budget', 'Large groups', 'Evening walks'], ratingBreakdown: { reliability: 4.6, punctuality: 4.5, communication: 4.7, care: 4.6 } },
 { id: 'w7', name: 'Priya Kapoor', emoji: '‍', suburb: 'Balmain', distance: 3.1, rating: 4.9, reviewCount: 223, pricePerWalk: 30, pricePer30: 20, available: false, nextSlot: 'Tomorrow 8am', dogs: 'Up to 3', badge: 'Certified', badgeColor: '#0EA5E9', services: ['Solo walk', 'Group walk', 'Training walk'], bio: 'Certified dog trainer. Walks include basic training reinforcement.', tags: ['Dog trainer', 'Training walks', 'Certified'], ratingBreakdown: { reliability: 5.0, punctuality: 4.9, communication: 4.9, care: 4.8 } },
 { id: 'w8', name: 'Alex Turner', emoji: '', suburb: 'Rozelle', distance: 3.4, rating: 4.7, reviewCount: 167, pricePerWalk: 24, pricePer30: 16, available: true, nextSlot: 'Today 2pm', dogs: 'Up to 4', badge: null, services: ['Group walk', 'Drop-in visit'], bio: 'Reliable and punctual. Photo updates after every walk.', tags: ['Photo updates', 'Reliable', 'Weekend available'], ratingBreakdown: { reliability: 4.9, punctuality: 4.9, communication: 4.6, care: 4.7 } },
 { id: 'w9', name: 'Chloe Nguyen', emoji: '‍', suburb: 'Darlinghurst', distance: 0.8, rating: 4.9, reviewCount: 131, pricePerWalk: 32, pricePer30: 21, available: true, nextSlot: 'Today 1pm', dogs: 'Up to 2', badge: 'Top Rated', badgeColor: '#F59E0B', services: ['Solo walk', 'Puppy visit'], bio: 'Boutique dog walking with premium care, updates, and tidy handovers.', tags: ['Premium care', 'Photo updates', 'Puppies'], ratingBreakdown: { reliability: 4.9, punctuality: 5.0, communication: 4.9, care: 5.0 } },
 { id: 'w10', name: 'Ben Carter', emoji: '‍', suburb: 'Redfern', distance: 1.6, rating: 4.5, reviewCount: 88, pricePerWalk: 19, pricePer30: 12, available: true, nextSlot: 'Today 4pm', dogs: 'Up to 5', badge: 'Budget', badgeColor: '#10B981', services: ['Group walk', 'Drop-in visit'], bio: 'Affordable weekday walks with flexible pickup windows and solid reliability.', tags: ['Budget', 'Flexible pickup', 'Weekdays'], ratingBreakdown: { reliability: 4.5, punctuality: 4.4, communication: 4.6, care: 4.5 } },
 { id: 'w11', name: 'Lucia Gomez', emoji: '‍', suburb: 'Erskineville', distance: 2.1, rating: 4.8, reviewCount: 156, pricePerWalk: 27, pricePer30: 17, available: false, nextSlot: 'Tomorrow 9am', dogs: 'Up to 3', badge: 'Popular', badgeColor: '#6366F1', services: ['Solo walk', 'Group walk', 'Drop-in visit'], bio: 'Calm, dependable walker with a loyal repeat client base across the inner west.', tags: ['Repeat clients', 'Calm energy', 'Inner west'], ratingBreakdown: { reliability: 4.9, punctuality: 4.8, communication: 4.8, care: 4.9 } },
 { id: 'w12', name: 'Ethan Clarke', emoji: '', suburb: 'Alexandria', distance: 3.8, rating: 4.7, reviewCount: 204, pricePerWalk: 26, pricePer30: 17, available: true, nextSlot: 'Today 6pm', dogs: 'Up to 4', badge: 'Certified', badgeColor: '#0EA5E9', services: ['Solo walk', 'Group walk', 'Training walk'], bio: 'Structured walks for energetic dogs with clear communication and evening coverage.', tags: ['Evening walks', 'High energy dogs', 'Certified'], ratingBreakdown: { reliability: 4.7, punctuality: 4.8, communication: 4.9, care: 4.6 } },
];

const WALKER_REVIEWS = {
 w1: [
  { id: 'r1', author: 'Mia & Poppy', rating: 5, text: 'Jessica is incredible — Poppy came home calm and happy every single time. GPS updates gave me such peace of mind.', date: '2 days ago' },
  { id: 'r2', author: 'Sam with Archie', rating: 5, text: 'Super professional, first-aid certified, and genuinely loves dogs. Archie literally drags me to the door when he sees Jessica coming.', date: '1 week ago' },
  { id: 'r3', author: 'Ava & Luna', rating: 4.8, text: 'Always on time and communicates really well. Luna went from anxious to excited about walks since switching to Jessica.', date: '2 weeks ago' },
  { id: 'r4', author: 'James & Biscuit', rating: 5, text: 'Booked for a month straight and not one issue. Biscuit adores her. Highly recommend for anyone in Surry Hills.', date: '3 weeks ago' },
 ],
 w2: [
  { id: 'r1', author: 'Claire & Noodle', rating: 5, text: 'Tom has a vet background and it shows — he spotted a small skin issue on Noodle before I even noticed. Absolute legend.', date: '3 days ago' },
  { id: 'r2', author: 'Dave & Rusty', rating: 4.8, text: 'Rusty is reactive with other dogs and Tom handled it brilliantly. Calm, experienced, and patient.', date: '5 days ago' },
  { id: 'r3', author: 'Emma & Pretzel', rating: 4.9, text: 'Great communication before and after every walk. Tom always sends a little note about how Pretzel did.', date: '1 week ago' },
  { id: 'r4', author: 'Mike & Duke', rating: 4.7, text: 'Reliable and affordable. Duke comes back tired and happy — what more could you want?', date: '2 weeks ago' },
 ],
 w3: [
  { id: 'r1', author: 'Sophie & Latte', rating: 5, text: 'Mei gives Latte 100% of her attention. The photo updates are beautiful — she genuinely cares.', date: '1 day ago' },
  { id: 'r2', author: 'Nick & Mochi', rating: 5, text: 'We pay a premium for Mei and it is absolutely worth it. Mochi gets a personalised walk every single time.', date: '4 days ago' },
  { id: 'r3', author: 'Jess & Bean', rating: 5, text: 'Perfect punctuality, stunning route photos, and Bean always comes back spotless. Mei is exceptional.', date: '10 days ago' },
 ],
 w4: [
  { id: 'r1', author: 'Tom & Max', rating: 4.7, text: 'Marcus does early mornings brilliantly — Max is walked before I even start work. Reliable and friendly.', date: '2 days ago' },
  { id: 'r2', author: 'Rachel & Koda', rating: 4.8, text: 'Best value walker in the area. Koda is in a group of 5 and Marcus manages them effortlessly.', date: '1 week ago' },
  { id: 'r3', author: 'Amy & Ziggy', rating: 4.6, text: 'Marcus is punctual and Ziggy loves the after-work walks. Great for busy owners.', date: '2 weeks ago' },
  { id: 'r4', author: 'Chris & Bruno', rating: 4.7, text: 'Affordable, dependable, and good with larger dogs. Bruno has gained confidence since starting group walks.', date: '3 weeks ago' },
 ],
 w5: [
  { id: 'r1', author: 'Laura & Peanut', rating: 5, text: 'Sophie is so patient with Peanut — he is only 4 months old and she handles puppies like a pro.', date: '3 days ago' },
  { id: 'r2', author: 'Greg & Hazel', rating: 4.9, text: 'Hazel is 12 and needs a gentle touch. Sophie is wonderful with senior dogs — slow walks, lots of love.', date: '6 days ago' },
  { id: 'r3', author: 'Nina & Cookie', rating: 4.8, text: 'The afternoon slot is perfect for us and Sophie never misses it. Cookie is mad about her.', date: '2 weeks ago' },
  { id: 'r4', author: 'Ben & Maple', rating: 4.7, text: 'Great communication and Maple always returns happy. Sophie genuinely loves what she does.', date: '3 weeks ago' },
 ],
 w6: [
  { id: 'r1', author: 'Kate & Zeus', rating: 4.6, text: 'Ryan keeps a big group under control impressively well. Zeus gets great socialisation at a great price.', date: '4 days ago' },
  { id: 'r2', author: 'Jack & Bella', rating: 4.7, text: 'Most affordable option in the area and the quality is solid. Bella loves the evening group walks.', date: '1 week ago' },
  { id: 'r3', author: 'Sarah & Hugo', rating: 4.5, text: 'Ryan is reliable and Hugo comes back well-exercised. Great for owners on a budget.', date: '2 weeks ago' },
 ],
 w7: [
  { id: 'r1', author: 'Dan & Scout', rating: 5, text: 'Priya is a certified trainer and the difference in Scout after a month of training walks is remarkable.', date: '2 days ago' },
  { id: 'r2', author: 'Lena & Pepper', rating: 4.9, text: 'Pepper used to pull constantly. After four weeks with Priya on training walks she is a different dog.', date: '1 week ago' },
  { id: 'r3', author: 'Will & Boba', rating: 5, text: 'Priya combines exercise with real training — Boba now sits, stays, and heels. Outstanding value.', date: '2 weeks ago' },
  { id: 'r4', author: 'Ellie & Storm', rating: 4.8, text: 'Incredibly knowledgeable and reliable. Storm\'s recall has improved enormously in just a few weeks.', date: '4 weeks ago' },
 ],
 w8: [
  { id: 'r1', author: 'Marcus & Gus', rating: 4.8, text: 'Alex sends a photo update after every walk without fail. Gus looks so happy in every single one.', date: '1 day ago' },
  { id: 'r2', author: 'Tara & Benny', rating: 4.7, text: 'Super reliable and always exactly on time. Benny gets great weekend walks with Alex.', date: '5 days ago' },
  { id: 'r3', author: 'Sam & Dolly', rating: 4.6, text: 'Solid, dependable service. Dolly enjoys the group walks and Alex keeps us well informed.', date: '2 weeks ago' },
  { id: 'r4', author: 'Anna & Reef', rating: 4.7, text: 'We love the drop-in visits when we travel. Alex leaves the house tidy and Reef is always calm on return.', date: '3 weeks ago' },
 ],
 w9: [
  { id: 'r1', author: 'Olivia & Truffle', rating: 5, text: 'Chloe is boutique walking at its best. Truffle gets all the attention, premium treats, and gorgeous photos.', date: '2 days ago' },
  { id: 'r2', author: 'Tom & Miso', rating: 5, text: 'Miso is a tiny toy poodle and Chloe handles her with such care. The handover notes are a lovely touch.', date: '4 days ago' },
  { id: 'r3', author: 'Jade & Waffles', rating: 4.9, text: 'More expensive but completely worth it. Waffles gets a personalised walk in Darlinghurst parks every time.', date: '1 week ago' },
  { id: 'r4', author: 'Leo & Coco', rating: 5, text: 'Chloe is professional, punctual, and clearly adores dogs. Coco has never been happier.', date: '2 weeks ago' },
 ],
 w10: [
  { id: 'r1', author: 'Pat & Scamp', rating: 4.5, text: 'Ben is great value and flexible with pickup windows. Scamp enjoys the weekday group walks.', date: '3 days ago' },
  { id: 'r2', author: 'Fiona & Chip', rating: 4.6, text: 'Affordable and reliable for our weekday needs. Chip comes home well-exercised and content.', date: '1 week ago' },
  { id: 'r3', author: 'Ray & Oscar', rating: 4.4, text: 'Ben is a solid, no-fuss walker. Oscar gets his afternoon exercise without breaking the bank.', date: '3 weeks ago' },
 ],
 w11: [
  { id: 'r1', author: 'Zoe & Biscotti', rating: 4.9, text: 'Lucia\'s calm energy is incredible — Biscotti, who is usually anxious, settled immediately. Loyal client for life.', date: '1 day ago' },
  { id: 'r2', author: 'Marco & Pippa', rating: 4.8, text: 'We have been with Lucia for over a year. Dependable, communicative, and Pippa absolutely adores her.', date: '1 week ago' },
  { id: 'r3', author: 'Hannah & Remy', rating: 4.9, text: 'Inner west couldn\'t ask for a better walker. Remy comes home tired, happy, and smelling of fresh air.', date: '2 weeks ago' },
  { id: 'r4', author: 'Luke & Mango', rating: 4.7, text: 'Great repeat-client vibe — Lucia remembers every detail about Mango. Feels personal, not transactional.', date: '4 weeks ago' },
 ],
 w12: [
  { id: 'r1', author: 'Cara & Tank', rating: 4.8, text: 'Ethan is brilliant with high-energy dogs. Tank comes back properly tired after his structured walks.', date: '2 days ago' },
  { id: 'r2', author: 'Steve & Juno', rating: 4.7, text: 'Evening coverage is perfect for us. Ethan is certified and communicates clearly after every session.', date: '5 days ago' },
  { id: 'r3', author: 'Mel & Atlas', rating: 4.9, text: 'Atlas is an energetic Border Collie and Ethan handles him expertly. Training walk option is a real bonus.', date: '1 week ago' },
  { id: 'r4', author: 'Jay & Rocky', rating: 4.6, text: 'Structured, professional, and great with big dogs. Rocky has been so much calmer since starting with Ethan.', date: '2 weeks ago' },
 ],
};

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
 return WALKER_REVIEWS[walker.id] || [];
}
