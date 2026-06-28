import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWalkers as apiGetWalkers, createWalkerProfile as apiCreateWalkerProfile, getWalkerAvailability } from '../services/walkers';
import { getMyDogs, createDog } from '../services/dogs';
import { createBooking, mapBookingData, payBooking as apiPayBooking, cancelBooking as apiCancelBooking, submitReview as apiSubmitReview } from '../services/bookings';
import { postWalkLocation as apiPostWalkLocation, uploadWalkPhoto as apiUploadWalkPhoto } from '../services/alphinium';
import { scheduleWalkNotification, NOTIFICATION_TYPES } from '../services/notifications';

// Static fallback data used when the walkers API is unavailable (dev/demo mode).
const FALLBACK_WALKERS = [
 { id: 'w1', name: 'Jessica Park', emoji: '‍', suburb: 'Surry Hills', distance: 0.4, rating: 4.9, reviewCount: 287, pricePerWalk: 28, pricePer30: 18, available: true, nextSlot: 'Today 7am', dogs: 'Up to 3', badge: 'Top Rated', badgeColor: '#F59E0B', verified: true, services: ['Solo walk', 'Group walk', 'Drop-in visit'], bio: 'Professional dog walker for 5 years. First aid certified. GPS tracked every walk.', tags: ['GPS tracking', 'Insured', 'Small dogs', 'Large dogs'], ratingBreakdown: { reliability: 4.9, punctuality: 4.8, communication: 5.0, care: 4.9 } },
 { id: 'w2', name: 'Tom Bradley', emoji: '��‍', suburb: 'Newtown', distance: 1.1, rating: 4.8, reviewCount: 194, pricePerWalk: 25, pricePer30: 16, available: true, nextSlot: 'Today 8am', dogs: 'Up to 4', badge: 'Popular', badgeColor: '#6366F1', verified: false, services: ['Group walk', 'Solo walk'], bio: 'Former vet nurse. Great with anxious and reactive dogs.', tags: ['Reactive dogs ok', 'Vet background', 'Large groups'], ratingBreakdown: { reliability: 4.8, punctuality: 4.7, communication: 4.9, care: 5.0 } },
 { id: 'w3', name: 'Mei Lin', emoji: '', suburb: 'Glebe', distance: 1.4, rating: 5.0, reviewCount: 76, pricePerWalk: 35, pricePer30: 22, available: false, nextSlot: 'Tomorrow 7am', dogs: 'Solo only', badge: 'Premium', badgeColor: '#8B5CF6', verified: true, services: ['Solo walk only'], bio: 'Solo walks only — your dog gets 100% of my attention.', tags: ['Solo only', 'Premium', 'Photo updates'], ratingBreakdown: { reliability: 5.0, punctuality: 5.0, communication: 5.0, care: 5.0 } },
 { id: 'w4', name: 'Marcus Chen', emoji: '', suburb: 'Paddington', distance: 1.9, rating: 4.7, reviewCount: 312, pricePerWalk: 22, pricePer30: 15, available: true, nextSlot: 'Today 6am', dogs: 'Up to 5', badge: null, verified: false, services: ['Group walk', 'Drop-in'], bio: 'I love dogs! Early morning and after-work walks my specialty.', tags: ['Early morning', 'After work', 'Budget friendly'], ratingBreakdown: { reliability: 4.7, punctuality: 4.9, communication: 4.6, care: 4.7 } },
 { id: 'w5', name: 'Sophie Reed', emoji: '‍', suburb: 'Leichhardt', distance: 2.3, rating: 4.8, reviewCount: 145, pricePerWalk: 28, pricePer30: 18, available: true, nextSlot: 'Today 3pm', dogs: 'Up to 3', badge: null, verified: false, services: ['Solo walk', 'Group walk', 'Puppy visits'], bio: 'Specialise in puppies and seniors. Patience and love guaranteed.', tags: ['Puppies', 'Senior dogs', 'Afternoon walks'], ratingBreakdown: { reliability: 4.8, punctuality: 4.7, communication: 4.9, care: 5.0 } },
 { id: 'w6', name: 'Ryan Murphy', emoji: '‍', suburb: 'Marrickville', distance: 2.7, rating: 4.6, reviewCount: 98, pricePerWalk: 20, pricePer30: 13, available: true, nextSlot: 'Today 5pm', dogs: 'Up to 6', badge: 'Budget', badgeColor: '#10B981', verified: false, services: ['Group walk'], bio: 'Great with big groups! Most affordable rates in the area.', tags: ['Budget', 'Large groups', 'Evening walks'], ratingBreakdown: { reliability: 4.6, punctuality: 4.5, communication: 4.7, care: 4.6 } },
 { id: 'w7', name: 'Priya Kapoor', emoji: '‍', suburb: 'Balmain', distance: 3.1, rating: 4.9, reviewCount: 223, pricePerWalk: 30, pricePer30: 20, available: false, nextSlot: 'Tomorrow 8am', dogs: 'Up to 3', badge: 'Certified', badgeColor: '#0EA5E9', verified: true, services: ['Solo walk', 'Group walk', 'Training walk'], bio: 'Certified dog trainer. Walks include basic training reinforcement.', tags: ['Dog trainer', 'Training walks', 'Certified'], ratingBreakdown: { reliability: 5.0, punctuality: 4.9, communication: 4.9, care: 4.8 } },
 { id: 'w8', name: 'Alex Turner', emoji: '', suburb: 'Rozelle', distance: 3.4, rating: 4.7, reviewCount: 167, pricePerWalk: 24, pricePer30: 16, available: true, nextSlot: 'Today 2pm', dogs: 'Up to 4', badge: null, verified: false, services: ['Group walk', 'Drop-in visit'], bio: 'Reliable and punctual. Photo updates after every walk.', tags: ['Photo updates', 'Reliable', 'Weekend available'], ratingBreakdown: { reliability: 4.9, punctuality: 4.9, communication: 4.6, care: 4.7 } },
 { id: 'w9', name: 'Chloe Nguyen', emoji: '‍', suburb: 'Darlinghurst', distance: 0.8, rating: 4.9, reviewCount: 131, pricePerWalk: 32, pricePer30: 21, available: true, nextSlot: 'Today 1pm', dogs: 'Up to 2', badge: 'Top Rated', badgeColor: '#F59E0B', verified: true, services: ['Solo walk', 'Puppy visit'], bio: 'Boutique dog walking with premium care, updates, and tidy handovers.', tags: ['Premium care', 'Photo updates', 'Puppies'], ratingBreakdown: { reliability: 4.9, punctuality: 5.0, communication: 4.9, care: 5.0 } },
 { id: 'w10', name: 'Ben Carter', emoji: '‍', suburb: 'Redfern', distance: 1.6, rating: 4.5, reviewCount: 88, pricePerWalk: 19, pricePer30: 12, available: true, nextSlot: 'Today 4pm', dogs: 'Up to 5', badge: 'Budget', badgeColor: '#10B981', verified: false, services: ['Group walk', 'Drop-in visit'], bio: 'Affordable weekday walks with flexible pickup windows and solid reliability.', tags: ['Budget', 'Flexible pickup', 'Weekdays'], ratingBreakdown: { reliability: 4.5, punctuality: 4.4, communication: 4.6, care: 4.5 } },
 { id: 'w11', name: 'Lucia Gomez', emoji: '‍', suburb: 'Erskineville', distance: 2.1, rating: 4.8, reviewCount: 156, pricePerWalk: 27, pricePer30: 17, available: false, nextSlot: 'Tomorrow 9am', dogs: 'Up to 3', badge: 'Popular', badgeColor: '#6366F1', verified: false, services: ['Solo walk', 'Group walk', 'Drop-in visit'], bio: 'Calm, dependable walker with a loyal repeat client base across the inner west.', tags: ['Repeat clients', 'Calm energy', 'Inner west'], ratingBreakdown: { reliability: 4.9, punctuality: 4.8, communication: 4.8, care: 4.9 } },
 { id: 'w12', name: 'Ethan Clarke', emoji: '', suburb: 'Alexandria', distance: 3.8, rating: 4.7, reviewCount: 204, pricePerWalk: 26, pricePer30: 17, available: true, nextSlot: 'Today 6pm', dogs: 'Up to 4', badge: 'Certified', badgeColor: '#0EA5E9', verified: true, services: ['Solo walk', 'Group walk', 'Training walk'], bio: 'Structured walks for energetic dogs with clear communication and evening coverage.', tags: ['Evening walks', 'High energy dogs', 'Certified'], ratingBreakdown: { reliability: 4.7, punctuality: 4.8, communication: 4.9, care: 4.6 } },
];

const JWT_KEY = 'alphinium_auth_token';

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
 walkers: FALLBACK_WALKERS,
 walkersLoading: false,
 walkersError: null,
 phase: 'login',
 authToken: null,
 authUser: null,
 isGuest: false,
 selectedWalker: FALLBACK_WALKERS[0],
 compareList: [],
 filters: { available: 'Any', sortBy: 'Distance', priceMax: 'Any', serviceType: 'All', verified: 'Any' },
 searchText: '',
 bookingData: { dogName: 'Buddy', breed: 'Cavoodle', size: 'Medium', serviceType: 'Group walk', date: 'Today', time: '7:00 AM', recurring: false, notes: 'Friendly with other dogs and loves park loops.' },
 bookingStep: 0,
 // Dog profiles
 dogs: [],
 dogsLoading: false,
 dogsError: null,
 // alphinium-payments state — no raw card data ever stored here (PCI compliance)
 paymentStatus: 'idle', // 'idle' | 'processing' | 'success' | 'error' | 'refunded'
 paymentError: null,
 savedCards: [], // [{ id, last4, brand, expiry }] — masked only
 selectedSavedCardId: null,
 invoice: null, // { bookingReference, amountCents, tipCents, currency, walkerName, date, invoiceUrl, last4, brand }
 tipPercent: null, // 10 | 15 | 20 | 'custom' | null
 // Booking record (created before payment)
 bookingId: null,         // returned by POST /api/bookings
 bookingStatus: null,     // 'confirmed' | 'pending_walker' | null
 bookingCreating: false,
 bookingCreateError: null,
 // Payment result fields (from payBooking())
 paymentReference: null,
 platformFeeCents: 0,
 walkerPayoutCents: 0,
 // Cancellation state
 cancelLoading: false,
 cancelError: null,
 cancellationResult: null, // { refund_reference, refund_amount_cents, fee_retained_cents, refund_type }
 // Walker GPS publishing state
 locationPublishing: false,
 locationPublishError: null,
 // Review submission state
 reviewSubmitting: false,
 reviewSubmitError: null,
 reviewSubmitted: false,
 trackingActive: true,
 trackingProgress: 0.4,
 permissions: { location: null, notifications: null },
 notificationPermission: null,
 deviceToken: null,
 latestWalkPhoto: null,
 reviews: {},
 // Live GPS state (populated by alphinium-maps polling)
 trackingCoords: null,
 routeHistory: [],
 walkPhotos: [],
 gpsAvailable: true,
 photoUploading: false,
 photoUploadError: null,
 // Walk completion state (populated by completeWalk API — #93)
 walkSummary: null, // { distanceKm, durationMin, photoCount, mapUrl } | null
 walkNotes: '',
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
 case 'SET_NOTIFICATION_PERMISSION':
 return { ...state, notificationPermission: action.payload };
 case 'SET_DEVICE_TOKEN':
 return { ...state, deviceToken: action.payload };
 case 'WALK_PHOTO_RECEIVED':
 return { ...state, latestWalkPhoto: action.payload || null };
 case 'COMPLETE_LOGIN':
 return {
 ...state,
 phase: 'home',
 authToken: action.guest ? null : action.token ?? null,
 authUser: action.guest ? null : action.user ?? null,
 isGuest: Boolean(action.guest),
 bookingStep: 0,
 chatOpen: false,
 chatInput: '',
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
 case 'LOAD_WALKERS_START':
 return { ...state, walkersLoading: true, walkersError: null };
 case 'LOAD_WALKERS_SUCCESS':
 return {
 ...state,
 walkersLoading: false,
 walkersError: null,
 walkers: action.payload,
 // Keep selectedWalker in sync: replace with live version if found, else keep existing
 selectedWalker: action.payload.find((w) => w.id === state.selectedWalker?.id) ?? state.selectedWalker,
 };
 case 'LOAD_WALKERS_ERROR':
 return { ...state, walkersLoading: false, walkersError: action.payload };
 case 'CREATE_WALKER_PROFILE_SUCCESS':
 return {
 ...state,
 walkers: [...state.walkers, action.payload],
 };
 case 'TOGGLE_COMPARE': {
 const id = action.payload;
 const list = state.compareList;
 if (list.includes(id)) {
 return { ...state, compareList: list.filter((wid) => wid !== id) };
 }
 if (list.length >= 3) return state;
 return { ...state, compareList: [...list, id] };
 }
 case 'CLEAR_COMPARE':
 return { ...state, compareList: [] };
 case 'SET_BOOKING_DATA':
 return {
 ...state,
 bookingData: {
 ...state.bookingData,
 ...action.payload,
 },
 };
 case 'NEXT_BOOKING_STEP':
 // Steps: 0 details → 1 summary → 2 payment → 3 tipping → 4 invoice/receipt
 return { ...state, bookingStep: Math.min(state.bookingStep + 1, 4) };
 case 'SET_PAYMENT_STATUS':
 return { ...state, paymentStatus: action.payload, paymentError: null };
 case 'SET_PAYMENT_ERROR':
 return { ...state, paymentStatus: 'error', paymentError: action.payload };
 case 'SET_SAVED_CARDS':
 return { ...state, savedCards: action.payload };
 case 'SELECT_SAVED_CARD':
 return { ...state, selectedSavedCardId: action.payload };
 case 'SET_INVOICE':
 return { ...state, invoice: action.payload, paymentStatus: 'success', bookingStep: 3 };
 case 'SET_TIP_PERCENT':
 return { ...state, tipPercent: action.payload };
 case 'REFUND_BOOKING':
 return { ...state, paymentStatus: 'refunded', invoice: { ...state.invoice, refundReference: action.payload.refundReference } };
 case 'COMPLETE_WALK': {
  const notes = action.payload?.notes ?? '';
  // Derive a demo walkSummary from current tracking state.
  // In production this is replaced by the response from the completeWalk API (#93).
  const demoSummary = {
   distanceKm: parseFloat((state.trackingProgress * 3.2).toFixed(1)),
   durationMin: Math.round(state.trackingProgress * 30),
   photoCount: state.walkPhotos.length,
   mapUrl: null,
  };
  return { ...state, trackingProgress: 1.0, phase: 'review', walkNotes: notes, walkSummary: demoSummary };
 }
 case 'SUBMIT_REVIEW': {
 const { walkerId, rating, text, author } = action.payload;
 const existing = state.reviews[walkerId] || [];
 const newReview = { id: `r-${Date.now()}`, author: author || 'You', rating, text };
 const updatedReviews = { ...state.reviews, [walkerId]: [newReview, ...existing] };

 const updatedWalkers = state.walkers.map((w) => {
 if (w.id !== walkerId) return w;
 const totalRating = w.rating * w.reviewCount + rating;
 const newCount = w.reviewCount + 1;
 return { ...w, rating: Math.round((totalRating / newCount) * 10) / 10, reviewCount: newCount };
 });

 const updatedSelectedWalker =
 state.selectedWalker?.id === walkerId
 ? updatedWalkers.find((w) => w.id === walkerId)
 : state.selectedWalker;

 return {
 ...state,
 reviews: updatedReviews,
 walkers: updatedWalkers,
 selectedWalker: updatedSelectedWalker,
 phase: 'walker',
 };
 }
 case 'SET_TRACKING_COORDS':
  return {
   ...state,
   trackingCoords: action.payload,
   gpsAvailable: action.payload !== null,
  };
 case 'SET_ROUTE_HISTORY':
  return {
   ...state,
   routeHistory: action.payload,
   trackingProgress: action.payload.length > 0
    ? action.payload.length / action.total
    : state.trackingProgress,
  };
 case 'SET_WALK_PHOTOS':
  return { ...state, walkPhotos: action.payload };
 case 'GPS_UNAVAILABLE':
  return { ...state, gpsAvailable: false };
 case 'START_TRACKING':
  return { ...state, trackingActive: true, phase: 'tracking' };
 case 'LOGOUT':
  return {
   ...state,
   phase: 'login',
   authToken: null,
   authUser: null,
   isGuest: false,
   bookingStep: 0,
  availabilitySlots: [],
  availabilityLoading: false,
   chatOpen: false,
   chatInput: '',
  };
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
 case 'LOAD_DOGS_START':
 return { ...state, dogsLoading: true, dogsError: null };
 case 'LOAD_DOGS_SUCCESS':
 return { ...state, dogsLoading: false, dogsError: null, dogs: action.payload };
 case 'LOAD_DOGS_ERROR':
 return { ...state, dogsLoading: false, dogsError: action.payload };
 case 'ADD_DOG':
 return { ...state, dogs: [...state.dogs, action.payload] };
 case 'LOAD_AVAILABILITY_START':
 return { ...state, availabilityLoading: true, availabilitySlots: [] };
 case 'LOAD_AVAILABILITY_SUCCESS':
 return { ...state, availabilityLoading: false, availabilitySlots: action.payload };
 case 'LOAD_AVAILABILITY_ERROR':
 return { ...state, availabilityLoading: false, availabilitySlots: [] };
 case 'BOOKING_CREATE_START':
 return { ...state, bookingCreating: true, bookingCreateError: null };
 case 'BOOKING_CREATE_SUCCESS':
 return { ...state, bookingCreating: false, bookingId: action.payload.booking_id, bookingStatus: action.payload.status };
 case 'BOOKING_CREATE_ERROR':
 return { ...state, bookingCreating: false, bookingCreateError: action.payload };
 case 'PAY_BOOKING_SUCCESS':
 return {
 ...state,
 paymentReference: action.payload.payment_reference,
 platformFeeCents: action.payload.platform_fee_cents,
 walkerPayoutCents: action.payload.walker_payout_cents,
 paymentStatus: 'success',
 };
 case 'CANCEL_START':
 return { ...state, cancelLoading: true, cancelError: null };
 case 'CANCEL_SUCCESS':
 return { ...state, cancelLoading: false, cancellationResult: action.payload, paymentStatus: 'refunded' };
 case 'CANCEL_ERROR':
 return { ...state, cancelLoading: false, cancelError: action.payload };
 case 'LOCATION_PUBLISH_START':
 return { ...state, locationPublishing: true };
 case 'LOCATION_PUBLISH_DONE':
 return { ...state, locationPublishing: false, locationPublishError: null };
 case 'LOCATION_PUBLISH_ERROR':
 return { ...state, locationPublishing: false, locationPublishError: action.payload };
 case 'REVIEW_SUBMIT_START':
 return { ...state, reviewSubmitting: true, reviewSubmitError: null, reviewSubmitted: false };
 case 'REVIEW_SUBMIT_SUCCESS':
 return { ...state, reviewSubmitting: false, reviewSubmitted: true };
 case 'REVIEW_SUBMIT_ERROR':
 return { ...state, reviewSubmitting: false, reviewSubmitError: action.payload };
 case 'REVIEW_RESET':
 return { ...state, reviewSubmitting: false, reviewSubmitError: null, reviewSubmitted: false };
 case 'PHOTO_UPLOAD_START':
 return { ...state, photoUploading: true, photoUploadError: null };
 case 'PHOTO_UPLOAD_SUCCESS':
 return { ...state, photoUploading: false, walkPhotos: [...state.walkPhotos, action.payload] };
 case 'PHOTO_UPLOAD_ERROR':
 return { ...state, photoUploading: false, photoUploadError: action.payload };
 default:
 return state;
 }
}

const WoofContext = createContext(null);

export function WoofProvider({ children }) {
 const [state, dispatch] = useReducer(reducer, initialState);

 const logout = useCallback(async () => {
  try {
   await AsyncStorage.removeItem(JWT_KEY);
  } finally {
   dispatch({ type: 'LOGOUT' });
  }
 }, [dispatch]);

 const loadWalkers = useCallback(async () => {
  dispatch({ type: 'LOAD_WALKERS_START' });
  const walkers = await apiGetWalkers();
  if (walkers) {
   dispatch({ type: 'LOAD_WALKERS_SUCCESS', payload: walkers });
  } else {
   // API unavailable — keep fallback data, clear loading flag without error
   dispatch({ type: 'LOAD_WALKERS_ERROR', payload: null });
  }
 }, [dispatch]);

 const createWalkerProfile = useCallback(async (profileData) => {
  const created = await apiCreateWalkerProfile(profileData);
  if (created) {
   dispatch({ type: 'CREATE_WALKER_PROFILE_SUCCESS', payload: created });
  }
  return created;
 }, [dispatch]);

 const loadDogs = useCallback(async () => {
  dispatch({ type: 'LOAD_DOGS_START' });
  try {
   const dogs = await getMyDogs(state.authToken);
   dispatch({ type: 'LOAD_DOGS_SUCCESS', payload: dogs });
  } catch (error) {
   dispatch({ type: 'LOAD_DOGS_ERROR', payload: error.message });
  }
 }, [state.authToken]);

 const addDog = useCallback(async (profileData) => {
  const created = await createDog(profileData, state.authToken);
  dispatch({ type: 'ADD_DOG', payload: created });
  return created;
 }, [state.authToken]);

 const loadAvailability = useCallback(async (walkerId, date) => {
  dispatch({ type: 'LOAD_AVAILABILITY_START' });
  try {
   const slots = await getWalkerAvailability(walkerId, date, state.authToken ?? undefined);
   dispatch({ type: 'LOAD_AVAILABILITY_SUCCESS', payload: Array.isArray(slots) ? slots : [] });
  } catch {
   dispatch({ type: 'LOAD_AVAILABILITY_ERROR' });
  }
 }, [state.authToken]);

 const createBookingRecord = useCallback(async () => {
  dispatch({ type: 'BOOKING_CREATE_START' });
  try {
   const payload = mapBookingData(state.bookingData, state.selectedWalker, state.dogs);
   const result = await createBooking(payload, state.authToken);
   dispatch({ type: 'BOOKING_CREATE_SUCCESS', payload: result });
   return result;
  } catch (error) {
   dispatch({ type: 'BOOKING_CREATE_ERROR', payload: error.message });
   throw error;
  }
 }, [state.bookingData, state.selectedWalker, state.dogs, state.authToken]);

 const uploadWalkPhoto = useCallback(async (walkId, caption) => {
  dispatch({ type: 'PHOTO_UPLOAD_START' });
  try {
   const walkerName = state.selectedWalker?.name ?? 'Walker';
   const photo = await apiUploadWalkPhoto(walkId, { uri: null, caption }, state.authToken);
   dispatch({ type: 'PHOTO_UPLOAD_SUCCESS', payload: photo });
   scheduleWalkNotification(NOTIFICATION_TYPES.PHOTO_UPDATE, walkerName);
  } catch (error) {
   dispatch({ type: 'PHOTO_UPLOAD_ERROR', payload: error.message });
  }
 }, [state.selectedWalker, state.authToken]);

 const payBooking = useCallback(async (bookingId, paymentPayload) => {
  try {
   const result = await apiPayBooking(bookingId, paymentPayload, state.authToken);
   dispatch({ type: 'PAY_BOOKING_SUCCESS', payload: result });
   return result;
  } catch (error) {
   dispatch({ type: 'SET_PAYMENT_ERROR', payload: error.message });
   throw error;
  }
 }, [state.authToken]);

 const cancelBooking = useCallback(async (bookingId, walkDateIso) => {
  dispatch({ type: 'CANCEL_START' });
  try {
   const result = await apiCancelBooking(bookingId, walkDateIso, state.authToken);
   dispatch({ type: 'CANCEL_SUCCESS', payload: result });
   return result;
  } catch (error) {
   dispatch({ type: 'CANCEL_ERROR', payload: error.message });
   throw error;
  }
 }, [state.authToken]);

 const publishWalkerLocation = useCallback(async (walkId, coords) => {
  dispatch({ type: 'LOCATION_PUBLISH_START' });
  try {
   await apiPostWalkLocation(walkId, { ...coords, timestamp: Date.now() }, state.authToken);
   dispatch({ type: 'LOCATION_PUBLISH_DONE' });
  } catch (error) {
   dispatch({ type: 'LOCATION_PUBLISH_ERROR', payload: error.message });
   // Never re-throw — GPS publishing is best-effort
  }
 }, [state.authToken]);

 const submitReview = useCallback(async (bookingId, rating, text) => {
  dispatch({ type: 'REVIEW_SUBMIT_START' });
  try {
   const result = await apiSubmitReview(
    bookingId,
    { rating, text, reviewer_type: 'owner', walker_id: state.selectedWalker?.id },
    state.authToken
   );
   // Update the local walker's rating display via existing reducer case
   dispatch({
    type: 'SUBMIT_REVIEW',
    payload: { walkerId: state.selectedWalker?.id, rating, text, author: 'You' },
   });
   dispatch({ type: 'REVIEW_SUBMIT_SUCCESS', payload: result });
   return result;
  } catch (error) {
   dispatch({ type: 'REVIEW_SUBMIT_ERROR', payload: error.message });
   throw error;
  }
 }, [state.authToken, state.selectedWalker]);

 const value = useMemo(
  () => ({ state, dispatch, logout, loadWalkers, createWalkerProfile, loadDogs, addDog, loadAvailability, createBookingRecord, uploadWalkPhoto, payBooking, cancelBooking, publishWalkerLocation, submitReview }),
  [state, logout, loadWalkers, createWalkerProfile, loadDogs, addDog, loadAvailability, createBookingRecord, uploadWalkPhoto, payBooking, cancelBooking, publishWalkerLocation, submitReview],
 );
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

 const matchesVerified = state.filters.verified === 'Any' || walker.verified === true;
 return matchesSearch && matchesAvailability && matchesPrice && matchesService && matchesVerified;
 });

 const sorted = [...filtered].sort((a, b) => {
 if (state.filters.sortBy === 'Rating') return b.rating - a.rating;
 if (state.filters.sortBy === 'Price ↑') return a.pricePerWalk - b.pricePerWalk;
 return a.distance - b.distance;
 });

 return sorted;
}

export function getCompareWalkers(state) {
 return state.compareList.map((id) => state.walkers.find((w) => w.id === id)).filter(Boolean);
}

export function getWalkerReviews(walker, storeReviews) {
 if (!walker) return [];
 const submitted = storeReviews?.[walker.id];
 if (submitted && submitted.length > 0) return submitted;
 return WALKER_REVIEWS[walker.id] || [];
}
