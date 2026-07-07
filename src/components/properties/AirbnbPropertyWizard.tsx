'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface WizardFormData {
  propertyType: string;
  location: { building: string; unit: string; floor: string; neighbourhood: string; county: string; city: string; address: string; lat: number | null; lng: number | null };
  basics: { bedrooms: number; bathrooms: number; maxGuests: number; size: string; sizeUnit: string; beds: { type: string; count: number }[] };
  amenities: string[];
  photos: { url: string; label: string; isCover: boolean }[];
  title: string;
  description: string;
  descriptionSpace: string;
  descriptionAround: string;
  descriptionHost: string;
  pricing: { nightly: string; weekend: string; monthly: string; cleaning: string; deposit: string; extraGuest: string; baseGuests: number; minStay: string; maxStay: string; seasonal: { name: string; start: string; end: string; price: string }[] };
  rules: { checkIn: string; checkOut: string; checkInMethod: string; instructions: string; caretakerName: string; caretakerPhone: string; noSmoking: boolean; noParties: boolean; noPets: boolean; childrenAllowed: boolean; quietHours: boolean; couplesOnly: boolean; noAlcohol: boolean; adultsOnly: boolean; additionalRules: string; cancellation: string; nonRefundableDiscount: string; removeShoes: boolean; sortRubbish: boolean };
  publish: { availableFrom: string; group: string; status: string };
}

const INITIAL: WizardFormData = {
  propertyType: '',
  location: { building: '', unit: '', floor: '', neighbourhood: '', county: '', city: '', address: '', lat: null, lng: null },
  basics: { bedrooms: 1, bathrooms: 1, maxGuests: 2, size: '', sizeUnit: 'sq m', beds: [{ type: 'Double Bed', count: 1 }] },
  amenities: [],
  photos: [],
  title: '',
  description: '',
  descriptionSpace: '',
  descriptionAround: '',
  descriptionHost: '',
  pricing: { nightly: '', weekend: '', monthly: '', cleaning: '', deposit: '', extraGuest: '', baseGuests: 2, minStay: '1 night', maxStay: 'No maximum', seasonal: [] },
  rules: { checkIn: '14:00', checkOut: '11:00', checkInMethod: 'caretaker', instructions: '', caretakerName: '', caretakerPhone: '', noSmoking: true, noParties: true, noPets: true, childrenAllowed: false, quietHours: true, couplesOnly: false, noAlcohol: false, adultsOnly: false, additionalRules: '', cancellation: 'moderate', nonRefundableDiscount: '10', removeShoes: false, sortRubbish: false },
  publish: { availableFrom: '', group: '', status: 'publish' },
};

const DEFAULT_PROPERTY_TYPES = [
  { id: 'studio',       label: 'Studio',       desc: 'Open-plan bedroom + living area' },
  { id: 'bedsitter',    label: 'Bedsitter',    desc: 'Single room with kitchenette' },
  { id: 'one-bedroom',  label: 'One Bedroom',  desc: 'Separate bedroom + living space' },
  { id: 'two-bedroom',  label: 'Two Bedroom',  desc: 'Two separate bedrooms' },
];

const STEP_NAMES = ['Property Type','Location','Basics','Amenities','Photos','Title & Description','Pricing','Rules & Check-in','Review & Publish'];

function PropIcon({ id }: { id: string }) {
  const cls = 'w-7 h-7';
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24', className: cls };
  switch (id) {
    case 'studio':    return <svg {...s}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case 'bedsitter': return <svg {...s}><path d="M3 7v10M21 7v10M3 12h18M6 7V5a1 1 0 011-1h10a1 1 0 011 1v2"/></svg>;
    case 'one-bedroom': return <svg {...s}><path d="M2 9h20v10H2zM2 9a5 5 0 015-5h10a5 5 0 015 5M7 14h10"/></svg>;
    case 'two-bedroom': return <svg {...s}><rect x="2" y="6" width="20" height="15" rx="2"/><path d="M2 11h20M12 6v15"/></svg>;
    case '3br':       return <svg {...s}><rect x="2" y="5" width="20" height="16" rx="2"/><path d="M2 10h20M2 15h20M9 5v16M15 5v16"/></svg>;
    case 'penthouse': return <svg {...s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case 'villa':     return <svg {...s}><path d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/></svg>;
    case 'cottage':   return <svg {...s}><path d="M12 3l8 7v11H4V10l8-7z"/><path d="M9 21v-7h6v7"/></svg>;
    case 'private':   return <svg {...s}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M9 12h6"/></svg>;
    case 'house':     return <svg {...s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>;
    case 'apartment': return <svg {...s}><rect x="2" y="3" width="20" height="20" rx="2"/><path d="M8 3v18M16 3v18M2 8h20M2 13h20M2 18h20"/></svg>;
    default:          return <svg {...s}><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2 2"/></svg>;
  }
}

const COUNTIES = [
  'Nairobi','Mombasa','Kisumu','Nakuru','Uasin Gishu','Kiambu','Kilifi','Machakos','Meru',
  'Kakamega','Bungoma','Kisii','Nyeri','Murang\'a','Kirinyaga','Embu','Makueni','Kajiado',
  'Nandi','Kericho','Bomet','Migori','Homa Bay','Siaya','Vihiga','Busia','Trans Nzoia',
  'Elgeyo-Marakwet','Baringo','Laikipia','Nyandarua','Nyamira','Narok','Kwale','Taita-Taveta',
  'Tana River','Lamu','Garissa','Wajir','Mandera','Marsabit','Isiolo','Tharaka-Nithi',
  'Samburu','Turkana','West Pokot','Kitui',
];

const AMENITY_CATEGORIES = [
  { cat: '🌐 Internet & Entertainment', items: [{ id: 'wifi', icon: '📶', label: 'WiFi', sub: 'Fast 50+' }, { id: 'dstv', icon: '📺', label: 'DSTV' }, { id: 'netflix', icon: '🎬', label: 'Netflix' }, { id: 'smarttv', icon: '🎮', label: 'Smart TV' }, { id: 'speaker', icon: '🔊', label: 'Bluetooth Speaker' }] },
  { cat: '🍳 Kitchen', items: [{ id: 'kitchen', icon: '🍽️', label: 'Full Kitchen' }, { id: 'coffee', icon: '☕', label: 'Coffee Maker' }, { id: 'fridge', icon: '🧊', label: 'Refrigerator' }, { id: 'microwave', icon: '🍳', label: 'Microwave' }, { id: 'cooker', icon: '🫙', label: 'Cooking Gas + Cooker' }, { id: 'utensils', icon: '🧹', label: 'Dishes & Utensils' }] },
  { cat: '❄️ Climate & Comfort', items: [{ id: 'ac', icon: '❄️', label: 'A/C' }, { id: 'fan', icon: '🌡️', label: 'Ceiling Fan' }, { id: 'balcony', icon: '🪟', label: 'Balcony' }] },
  { cat: '🔒 Safety & Security', items: [{ id: 'smartlock', icon: '🔒', label: 'Smart Lock' }, { id: 'cctv', icon: '📹', label: 'CCTV' }, { id: 'guard', icon: '💂', label: '24hr Guard' }, { id: 'smoke', icon: '🚨', label: 'Smoke Alarm' }, { id: 'fire', icon: '🧯', label: 'Fire Extinguisher' }, { id: 'firstaid', icon: '🏥', label: 'First Aid' }] },
  { cat: '⚡ Utilities', items: [{ id: 'generator', icon: '🔋', label: 'Generator / Inverter' }, { id: 'water', icon: '💧', label: 'Water Backup' }, { id: 'solar', icon: '☀️', label: 'Solar' }] },
  { cat: '🚗 Parking & Access', items: [{ id: 'parking', icon: '🚗', label: 'Free Parking' }, { id: 'elevator', icon: '🛗', label: 'Elevator' }, { id: 'gated', icon: '🚪', label: 'Gated Entry' }] },
  { cat: '🧺 Laundry & Bathroom', items: [{ id: 'washer', icon: '🫧', label: 'Washing Machine' }, { id: 'hotshower', icon: '🚿', label: 'Hot Shower' }, { id: 'bathtub', icon: '🛁', label: 'Bathtub' }, { id: 'hairdryer', icon: '🪒', label: 'Hair Dryer' }, { id: 'toiletries', icon: '🧴', label: 'Toiletries Provided' }] },
  { cat: '🏊 Building Facilities', items: [{ id: 'pool', icon: '🏊', label: 'Swimming Pool' }, { id: 'gym', icon: '💪', label: 'Gym' }, { id: 'garden', icon: '🌳', label: 'Garden / Rooftop' }, { id: 'poolside', icon: '🌊', label: 'Pool Side' }, { id: 'next-to-garden', icon: '🌿', label: 'Next to Garden' }, { id: 'bbq', icon: '🍖', label: 'BBQ Area' }, { id: 'child', icon: '🧒', label: 'Child-Safe Building' }] },
];

// ─── Amenities Data & Icon ────────────────────────────────────────────────
const AMENITIES_FLAT = [
  { id: 'wifi',      label: 'Wi-Fi' },
  { id: 'parking',   label: 'Free Parking' },
  { id: 'pool',      label: 'Pool' },
  { id: 'gym',       label: 'Gym' },
  { id: 'kitchen',   label: 'Full Kitchen' },
  { id: 'washer',    label: 'Washing Machine' },
  { id: 'dryer',     label: 'Dryer' },
  { id: 'ac',        label: 'Air Conditioning' },
  { id: 'smarttv',   label: 'Smart TV' },
  { id: 'netflix',   label: 'Netflix' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'security',  label: '24/7 Security' },
  { id: 'water',     label: 'Borehole Water' },
  { id: 'generator', label: 'Generator' },
  { id: 'solar',     label: 'Solar Power' },
  { id: 'cctv',      label: 'CCTV' },
  { id: 'balcony',        label: 'Balcony' },
  { id: 'garden',         label: 'Garden' },
  { id: 'poolside',       label: 'Pool Side' },
  { id: 'next-to-garden', label: 'Next to Garden' },
  { id: 'bbq',            label: 'BBQ Grill' },
  { id: 'elevator',  label: 'Elevator' },
  { id: 'pets',      label: 'Pet Friendly' },
  { id: 'babycot',   label: 'Baby Cot' },
  { id: 'safebox',   label: 'Safe Box' },
  { id: 'iron',      label: 'Iron & Board' },
  { id: 'hottub',    label: 'Hot Tub' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'ev',        label: 'EV Charging' },
  { id: 'concierge', label: 'Concierge' },
];

function AmenityIcon({ id }: { id: string }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24', className: 'w-5 h-5 flex-shrink-0' };
  switch (id) {
    case 'wifi':      return <svg {...s}><path d="M5 13a10 10 0 0114 0"/><path d="M2 10a14 14 0 0120 0"/><path d="M8.5 16a5 5 0 017 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>;
    case 'parking':   return <svg {...s}><rect x="2" y="7" width="13" height="10" rx="1.5"/><path d="M15 9h3l3 4v4h-6V9z"/><circle cx="5.5" cy="19" r="1.5"/><circle cx="18" cy="19" r="1.5"/></svg>;
    case 'pool':      return <svg {...s}><path d="M2 12c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/><path d="M2 17c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/><path d="M2 7c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/></svg>;
    case 'gym':       return <svg {...s}><path d="M6.5 6.5h.01M17.5 6.5h.01M6.5 17.5h.01M17.5 17.5h.01"/><path d="M5 6.5h3v11H5zM16 6.5h3v11h-3zM8 12h8"/><path d="M2 9.5h3M19 9.5h3M2 14.5h3M19 14.5h3"/></svg>;
    case 'kitchen':   return <svg {...s}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3v7"/></svg>;
    case 'washer':    return <svg {...s}><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M8 6h.01M12 6h.01"/></svg>;
    case 'dryer':     return <svg {...s}><path d="M9.59 4.59A2 2 0 1111 8H2m9.59 7.59A2 2 0 1113 20H2m10.59-5.59A2 2 0 1114 8H2"/></svg>;
    case 'ac':        return <svg {...s}><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="20" y1="4" x2="4" y2="20"/><line x1="4" y1="4" x2="20" y2="20"/><polyline points="16 2 12 6 8 2"/><polyline points="22 16 18 12 22 8"/></svg>;
    case 'smarttv':   return <svg {...s}><rect x="2" y="7" width="20" height="13" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>;
    case 'netflix':   return <svg {...s}><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/></svg>;
    case 'workspace': return <svg {...s}><path d="M20 16V7a2 2 0 00-2-2H6a2 2 0 00-2 2v9"/><path d="M1 16h22l-1.5 2.5H2.5L1 16z"/></svg>;
    case 'security':  return <svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>;
    case 'water':     return <svg {...s}><path d="M12 2L6.5 14a6 6 0 1011 0L12 2z"/></svg>;
    case 'generator': return <svg {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'solar':     return <svg {...s}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
    case 'cctv':      return <svg {...s}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
    case 'balcony':   return <svg {...s}><path d="M3 17h18M3 12h18M8 17V7M12 17V5M16 17V7M3 7h18"/></svg>;
    case 'garden':         return <svg {...s}><path d="M12 22V12"/><path d="M12 12C12 12 9 9 6 10s-4 5-1 8c1.5 1.5 4 2 7 2"/><path d="M12 12c0 0 3-3 6-2s4 5 1 8c-1.5 1.5-4 2-7 2"/></svg>;
    case 'poolside':      return <svg {...s}><path d="M2 12c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/><path d="M2 17c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/><circle cx="19" cy="6" r="2"/><path d="M19 8v4"/></svg>;
    case 'next-to-garden': return <svg {...s}><path d="M12 22V14"/><path d="M12 14c0 0-4-3-6-1s-2 7 0 9c1 1 3 1 6 1"/><path d="M12 14c0 0 4-3 6-1s2 7 0 9c-1 1-3 1-6 1"/><path d="M9 4c0 0-2 2-2 5s2 4 5 4"/></svg>;
    case 'bbq':       return <svg {...s}><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>;
    case 'elevator':  return <svg {...s}><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 9l3-3 3 3M9 15l3 3 3-3"/></svg>;
    case 'pets':      return <svg {...s}><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5"/><path d="M8 14v.5A3.5 3.5 0 0011.5 18h1a3.5 3.5 0 003.5-3.5V14a2 2 0 00-2-2h-4a2 2 0 00-2 2z"/></svg>;
    case 'babycot':   return <svg {...s}><path d="M3 9h18M3 9V5a1 1 0 011-1h16a1 1 0 011 1v4M3 9l2 9h14l2-9"/><path d="M9 21v-3M15 21v-3"/></svg>;
    case 'safebox':   return <svg {...s}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>;
    case 'iron':      return <svg {...s}><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.86H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.86l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>;
    case 'hottub':    return <svg {...s}><path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z"/><path d="M6 12V5a2 2 0 012-2h3"/><path d="M4 21h1M19 21h1"/></svg>;
    case 'breakfast': return <svg {...s}><path d="M17 8h1a4 4 0 010 8h-1"/><path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>;
    case 'ev':        return <svg {...s}><path d="M5 18H3a2 2 0 01-2 2V8a2 2 0 012-2h3.19M15 6h2a2 2 0 012 2v8a2 2 0 01-2 2h-3.19"/><line x1="11" y1="6" x2="13" y2="6"/><polyline points="11 12 9 18 15 12 13 12"/></svg>;
    case 'concierge': return <svg {...s}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
    default:          return <svg {...s}><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
  }
}

// ─── Google Places loader (autocomplete only) ────────────────────────────────
const GMAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
function loadGoogleMaps(cb: () => void) {
  if ((window as any).google?.maps) { cb(); return; }
  if (document.getElementById('google-maps-js')) {
    const t = setInterval(() => { if ((window as any).google?.maps) { clearInterval(t); cb(); } }, 100);
    return;
  }
  const s = document.createElement('script');
  s.id = 'google-maps-js';
  s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_API_KEY}&libraries=places`;
  s.onload = cb;
  document.head.appendChild(s);
}

// ─── Airbnb-style Google Map ──────────────────────────────────────────────────
const AIRBNB_MAP_STYLE = [
  { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#f7f4ef' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8e2d6' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#fdf6e9' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d9ceba' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#aacde0' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e8f0e0' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#ede9e2' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#c5bdb0' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#717171' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

const AIRBNB_PIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.163 0 0 7.163 0 16c0 11.6 16 24 16 24s16-12.4 16-24C32 7.163 24.837 0 16 0z" fill="#FF385C"/><circle cx="16" cy="16" r="7" fill="white"/></svg>`
);

function GoogleMapView({
  lat, lng, onChange, onGeocode,
}: {
  lat: number | null; lng: number | null;
  onChange: (lat: number, lng: number) => void;
  onGeocode?: (components: any[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const onGeocodeRef = useRef(onGeocode);
  onChangeRef.current = onChange;
  onGeocodeRef.current = onGeocode;
  const DEFAULT_LAT = -1.2921, DEFAULT_LNG = 36.8219;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = (initLat: number, initLng: number) => {
      const G = (window as any).google?.maps;
      if (!G || !containerRef.current) return;
      const map = new G.Map(containerRef.current, {
        center: { lat: initLat, lng: initLng }, zoom: 16,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        zoomControl: true, styles: AIRBNB_MAP_STYLE,
      });
      const marker = new G.Marker({
        position: { lat: initLat, lng: initLng }, map, draggable: true, cursor: 'grab',
        icon: { url: `data:image/svg+xml;charset=UTF-8,${AIRBNB_PIN_SVG}`, scaledSize: new G.Size(32, 40), anchor: new G.Point(16, 40) },
        animation: G.Animation.DROP,
      });
      const handlePin = (latVal: number, lngVal: number) => {
        onChangeRef.current(latVal, lngVal);
        if (!onGeocodeRef.current) return;
        new G.Geocoder().geocode({ location: { lat: latVal, lng: lngVal } }, (results: any[], status: string) => {
          if (status === 'OK' && results[0]) onGeocodeRef.current!(results[0].address_components);
        });
      };
      marker.addListener('dragend', () => {
        const p = marker.getPosition();
        handlePin(parseFloat(p.lat().toFixed(6)), parseFloat(p.lng().toFixed(6)));
      });
      map.addListener('click', (e: any) => {
        marker.setPosition(e.latLng);
        handlePin(parseFloat(e.latLng.lat().toFixed(6)), parseFloat(e.latLng.lng().toFixed(6)));
      });
      mapRef.current = map; markerRef.current = marker;
      if (lat === null) handlePin(parseFloat(initLat.toFixed(6)), parseFloat(initLng.toFixed(6)));
    };

    if (lat === null && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => loadGoogleMaps(() => initMap(p.coords.latitude, p.coords.longitude)),
        () => loadGoogleMaps(() => initMap(DEFAULT_LAT, DEFAULT_LNG))
      );
    } else {
      loadGoogleMaps(() => initMap(lat ?? DEFAULT_LAT, lng ?? DEFAULT_LNG));
    }

    return () => { mapRef.current = null; markerRef.current = null; };
  }, []);

  useEffect(() => {
    if (markerRef.current && lat !== null && lng !== null) {
      const pos = { lat, lng };
      markerRef.current.setPosition(pos);
      mapRef.current?.panTo(pos);
    }
  }, [lat, lng]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// ─── Stepper Component ────────────────────────────────────────────────────────
function Stepper({ value, onChange, min = 0, max = 20 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => onChange(Math.max(min, value - 1))} className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-xl font-bold hover:border-gray-900 transition-all disabled:opacity-30" disabled={value <= min}>−</button>
      <span className="w-12 text-center text-xl font-semibold">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-xl font-bold hover:border-gray-900 transition-all disabled:opacity-30" disabled={value >= max}>+</button>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  initialData?: Partial<WizardFormData>;
  mode?: 'add' | 'edit' | 'continue';
  initialStep?: number;
  propertyId?: string;
}

export function AirbnbPropertyWizard({ onClose, initialData, mode = 'add', initialStep = 1, propertyId }: Props) {
  const isEdit = mode === 'edit';
  const [propertyTypes, setPropertyTypes] = useState<{ id: string; label: string; desc: string }[]>(DEFAULT_PROPERTY_TYPES);
  const [typesLoading, setTypesLoading] = useState(true);

  useEffect(() => {
    fetch('/api/unit-types')
      .then(r => r.json())
      .then(d => {
        const active = (d.unit_types ?? []).filter((t: any) => t.is_active);
        if (active.length > 0) {
          setPropertyTypes(active.map((t: any) => ({
            id: t.name,
            label: t.name,
            desc: t.description || t.name,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setTypesLoading(false));
  }, []);

  const [step, setStep] = useState(Math.max(1, Math.min(initialStep, 9)));
  const [highestStep, setHighestStep] = useState(Math.max(1, Math.min(initialStep, 9)));
  const [dir, setDir] = useState<'fwd' | 'bwd'>('fwd');
  const [animating, setAnimating] = useState(false);
  const [data, setData] = useState<WizardFormData>({
    ...INITIAL,
    ...initialData,
    location: { ...INITIAL.location, ...(initialData?.location ?? {}) },
    basics:   { ...INITIAL.basics,   ...(initialData?.basics   ?? {}) },
    pricing:  { ...INITIAL.pricing,  ...(initialData?.pricing  ?? {}) },
    rules:    { ...INITIAL.rules,    ...(initialData?.rules    ?? {}) },
    publish:  { ...INITIAL.publish,  ...(initialData?.publish  ?? {}) },
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [countdown, setCountdown] = useState(6);
  const [collapsedCats, setCollapsedCats] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [customRuleInput, setCustomRuleInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const photoDragSrc = useRef<number | null>(null);
  const photoDragOverRef = useRef<number | null>(null);
  const [photoDragOver, setPhotoDragOver] = useState<number | null>(null);
  const photoGridRef = useRef<HTMLDivElement>(null);
  const [newSeason, setNewSeason] = useState({ name: '', start: '', end: '', price: '' });
  const [photoIdx, setPhotoIdx] = useState(0);
  const [stepError, setStepError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [addrSearch, setAddrSearch] = useState('');
  const [addrResults, setAddrResults] = useState<any[]>([]);
  const [addrDropdown, setAddrDropdown] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const addrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addrSelectingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TOTAL = 9;

  useEffect(() => { if (step === 2) loadGoogleMaps(() => {}); }, [step]);

  useEffect(() => {
    if (step !== 5) return;
    const grid = photoGridRef.current;
    if (!grid) return;
    const onTouchMove = (e: TouchEvent) => {
      if (photoDragSrc.current === null) return;
      e.preventDefault();
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const card = el?.closest('[data-photo-idx]') as HTMLElement | null;
      if (card?.dataset.photoIdx !== undefined) {
        const idx = parseInt(card.dataset.photoIdx);
        photoDragOverRef.current = idx;
        setPhotoDragOver(idx);
      }
    };
    grid.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => grid.removeEventListener('touchmove', onTouchMove);
  }, [step]);

  const showError = (msg: string) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setStepError(msg);
    if (msg) errorTimerRef.current = setTimeout(() => setStepError(''), 5000);
  };

  const confettiPieces = useMemo(() => {
    const colors = ['#22c55e','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#f97316','#06b6d4','#fbbf24','#10b981','#ff6b6b','#4ecdc4'];
    const anims = ['cf-a','cf-b','cf-c','cf-d','cf-e','cf-f'];
    return Array.from({ length: 160 }, (_, i) => {
      const isRibbon = i % 5 === 0;
      const isCircle = i % 7 === 0;
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3.5,
        duration: 3 + Math.random() * 3,
        w: isRibbon ? 4 : isCircle ? 9 : 7 + Math.random() * 7,
        h: isRibbon ? 18 : isCircle ? 9 : 5 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        round: isCircle ? '50%' : isRibbon ? '1px' : '2px',
        anim: anims[i % anims.length],
      };
    });
  }, []);

  const navigate = (next: number) => {
    if (animating) return;
    setDir(next > step ? 'fwd' : 'bwd');
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 300);
  };

  const validateStep = (s: number): string => {
    switch (s) {
      case 1:
        if (!data.propertyType) return 'Please select a property type before continuing.';
        return '';
      case 2:
        if (!data.location.address.trim()) return 'Street address is required — please enter your property\'s street address.';
        if (!data.location.neighbourhood.trim()) return 'Estate / Area is required — e.g. Kilimani, Westlands.';
        if (!data.location.city.trim()) return 'City / Town is required — e.g. Nairobi.';
        return '';
      case 3:
        return '';
      case 4:
        if (data.amenities.length === 0) return 'Please select at least 1 amenity before continuing.';
        return '';
      case 5:
        if (data.photos.length === 0) return 'Please add at least 1 photo of your property before continuing.';
        return '';
      case 6:
        if (!data.title.trim()) return 'Listing title is required — give your property a name guests will remember.';
        if (!data.description.trim()) return 'Description is required — tell guests what makes your place special.';
        return '';
      case 7:
        if (!data.pricing.nightly) return 'Base nightly rate is required — enter the price per night for your property.';
        return '';
      case 8:
        if (!data.rules.instructions?.trim()) return 'Check-in instructions are required — guests need to know how to access your property.';
        return '';
      default:
        return '';
    }
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) { showError(err); return; }
    showError('');
    if (step < TOTAL) {
      const next = step + 1;
      setHighestStep(h => Math.max(h, next));
      navigate(next);
    }
  };
  const goBack = () => { showError(''); step > 1 && navigate(step - 1); };

  useEffect(() => { showError(''); }, [data]);

  useEffect(() => {
    if (!showSuccess) { setCountdown(6); return; }
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showSuccess, countdown]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') goNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [step]);

  const pct = Math.round((step / TOTAL) * 100);
  const upd = (field: keyof WizardFormData, val: unknown) => setData(d => ({ ...d, [field]: val }));

  const saveDraft = async () => {
    try {
      const res = await fetch('/api/properties/wizard', {
        method: propertyId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(propertyId ? { id: propertyId } : {}), ...data, status: 'draft', setup_step: step }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        showError(json.error?.message || 'Failed to save draft. Please try again.');
        return;
      }
    } catch {
      showError('Network error. Could not save draft.');
      return;
    }
    onClose();
  };

  const handlePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/properties/wizard', {
        method: propertyId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(propertyId ? { id: propertyId } : {}), ...data, status: 'active' }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error?.message || 'Failed to save property. Please try again.');
        setPublishing(false);
        return;
      }
      if (!isEdit) { setConfetti(true); }
      setShowSuccess(true);
      setTimeout(() => setConfetti(false), 7000);
      setTimeout(() => onClose(), isEdit ? 2800 : 7200);
    } catch {
      showError('Network error. Please check your connection and try again.');
      setPublishing(false);
    }
  };

  // photo helpers
  const addPhotoUrl = (url: string) => {
    setData(d => {
      const isCover = d.photos.length === 0;
      return { ...d, photos: [...d.photos, { url, label: '', isCover }] };
    });
  };
  const removePhoto = (i: number) => setData(d => { const p = d.photos.filter((_, idx) => idx !== i); return { ...d, photos: p.map((ph, idx) => ({ ...ph, isCover: idx === 0 })) }; });
  const setCover = (i: number) => setData(d => {
    if (i === 0) return d;
    const photos = [...d.photos];
    const [moved] = photos.splice(i, 1);
    photos.unshift(moved);
    return { ...d, photos: photos.map((ph, idx) => ({ ...ph, isCover: idx === 0 })) };
  });
  const reorderPhotos = (from: number, to: number) => {
    if (from === to) return;
    setData(d => {
      const photos = [...d.photos];
      const [moved] = photos.splice(from, 1);
      photos.splice(to, 0, moved);
      return { ...d, photos: photos.map((ph, idx) => ({ ...ph, isCover: idx === 0 })) };
    });
  };

  // ── Success Screen ──────────────────────────────────────────────────────────

  const handlePhotoFiles = async (files: File[]) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showError('Please log in to upload photos'); return; }
    setPhotoUploading(true);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { showError(`${file.name} exceeds 10 MB — skipped`); continue; }
      const ext = file.name.split('.').pop();
      const path = `${user.id}/tmp/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('property-photos').upload(path, file, { upsert: true });
      if (error) { showError(`Upload failed: ${file.name}`); continue; }
      const { data: { publicUrl } } = supabase.storage.from('property-photos').getPublicUrl(path);
      addPhotoUrl(publicUrl);
    }
    setPhotoUploading(false);
  };

  // ── Step content ────────────────────────────────────────────────────────────
  const stepContent = () => {
    // STEP 1
    if (step === 1) return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold text-gray-900">What kind of place are you listing?</h2>
          <a href="/unit-types" target="_blank" rel="noopener noreferrer"
            className="text-xs text-green-600 hover:underline font-medium">
            Manage types ↗
          </a>
        </div>
        <p className="text-sm text-gray-500 mb-6">Choose the type that best describes your property. <span className="text-red-500">*</span></p>
        {typesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {propertyTypes.map(t => (
              <button
                key={t.id}
                onClick={() => upd('propertyType', t.id)}
                className={`p-5 rounded-2xl text-left transition-all duration-150 ${
                  data.propertyType === t.id
                    ? 'border-2 border-green-600 bg-green-50'
                    : 'border border-gray-200 bg-white hover:border-green-600'
                }`}>
                <div className={`mb-3 ${data.propertyType === t.id ? 'text-green-600' : 'text-gray-800'}`}>
                  <PropIcon id={t.id} />
                </div>
                <p className="font-bold text-gray-900 text-sm mb-1">{t.label}</p>
                <p className={`text-xs leading-snug ${data.propertyType === t.id ? 'text-green-600' : 'text-blue-500'}`}>{t.desc}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );

    // STEP 2
    if (step === 2) {
      const extractComponents = (components: any[]) => {
        const get = (type: string) =>
          (components || []).find((c: any) => c.types.includes(type))?.long_name || '';
        const city = get('locality') || get('administrative_area_level_2') || '';
        const rawCounty = (get('administrative_area_level_1') || get('administrative_area_level_2') || '').replace(/ county$/i, '').trim();
        const neighbourhood = [
          get('sublocality_level_1'), get('sublocality_level_2'), get('sublocality'), get('neighborhood'),
        ].filter(Boolean).find(n =>
          n.toLowerCase() !== city.toLowerCase() && n.toLowerCase() !== rawCounty.toLowerCase()
        ) || '';
        const matched = COUNTIES.find(c =>
          rawCounty.toLowerCase() === c.toLowerCase() ||
          rawCounty.toLowerCase().includes(c.toLowerCase()) ||
          c.toLowerCase().includes(rawCounty.toLowerCase())
        ) || '';
        return { city, neighbourhood, county: matched };
      };

      const handleGeocode = (components: any[]) => {
        const { city, neighbourhood, county } = extractComponents(components);
        upd('location', {
          ...data.location,
          ...(neighbourhood ? { neighbourhood } : {}),
          ...(city ? { city } : {}),
          ...(county ? { county } : {}),
        });
      };

      const handlePlaceSelect = (r: any) => {
        addrSelectingRef.current = true;
        const G = (window as any).google?.maps;
        if (!G?.places) { addrSelectingRef.current = false; return; }
        new G.places.PlacesService(document.createElement('div')).getDetails(
          { placeId: r.place_id, fields: ['name', 'geometry', 'address_components', 'formatted_address'] },
          (place: any) => {
            addrSelectingRef.current = false;
            if (!place?.geometry) return;
            const lat = parseFloat(place.geometry.location.lat().toFixed(6));
            const lng = parseFloat(place.geometry.location.lng().toFixed(6));
            const { city, neighbourhood, county } = extractComponents(place.address_components || []);
            upd('location', {
              ...data.location,
              address: place.name || place.formatted_address?.split(',')[0].trim() || '',
              neighbourhood, city, county, lat, lng,
            });
            setAddrDropdown(false);
          }
        );
      };

      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Where is your property located?</h2>
          <p className="text-sm text-gray-500 mb-4">Guests won't see your exact address until their booking is confirmed.</p>
          <div className="space-y-4">

            {/* ── Search bar (hidden in manual mode) ── */}
            {!manualEntry && (
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  value={data.location.address}
                  onChange={e => {
                    const q = e.target.value;
                    upd('location', { ...data.location, address: q });
                    if (addrTimerRef.current) clearTimeout(addrTimerRef.current);
                    if (!q.trim() || q.length < 3) { setAddrResults([]); setAddrDropdown(false); return; }
                    addrTimerRef.current = setTimeout(() => {
                      const G = (window as any).google?.maps;
                      if (!G?.places) return;
                      new G.places.AutocompleteService().getPlacePredictions(
                        { input: q, componentRestrictions: { country: 'ke' } },
                        (preds: any[]) => {
                          if (preds?.length) { setAddrResults(preds); setAddrDropdown(true); }
                          else { setAddrResults([]); setAddrDropdown(false); }
                        }
                      );
                    }, 350);
                  }}
                  onBlur={() => { if (!addrSelectingRef.current) setTimeout(() => setAddrDropdown(false), 200); }}
                  onFocus={() => addrResults.length > 0 && setAddrDropdown(true)}
                  placeholder="Search for your property or address…"
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] shadow-sm bg-white"
                  autoComplete="off"
                />
                {addrDropdown && addrResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
                    {addrResults.map((r, i) => (
                      <button key={i} type="button" onMouseDown={() => handlePlaceSelect(r)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-start gap-3">
                        <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{r.structured_formatting?.main_text || r.description}</p>
                          <p className="text-xs text-gray-500 truncate">{r.structured_formatting?.secondary_text || ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Map ── */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 420 }}>
              <GoogleMapView
                lat={data.location.lat}
                lng={data.location.lng}
                onChange={(lat, lng) => upd('location', { ...data.location, lat, lng })}
                onGeocode={handleGeocode}
              />
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#FF385C' }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Drag the pin or click anywhere on the map to set the exact position.
              {data.location.lat && <span className="ml-2 font-mono text-gray-400">{data.location.lat.toFixed(5)}, {data.location.lng?.toFixed(5)}</span>}
            </p>

            {/* ── Address details card ── */}
            <div className="border border-gray-200 rounded-2xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address details</p>
                <button type="button" onClick={() => setManualEntry(v => !v)}
                  className="text-xs font-medium hover:underline" style={{ color: '#FF385C' }}>
                  {manualEntry ? '← Search instead' : "Can't find it? Enter manually"}
                </button>
              </div>

              {manualEntry && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Property name / Street address <span className="text-red-500">*</span></label>
                  <input
                    value={data.location.address}
                    onChange={e => upd('location', { ...data.location, address: e.target.value })}
                    placeholder="e.g. Groovehart Apartments, 45 Ngong Road"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-[#FF385C] bg-white"
                    style={{ '--tw-ring-color': '#FF385C' } as any}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estate / Area <span className="text-red-500">*</span></label>
                  <input value={data.location.neighbourhood}
                    onChange={e => upd('location', { ...data.location, neighbourhood: e.target.value })}
                    placeholder="e.g. Kilimani"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-[#FF385C] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City / Town <span className="text-red-500">*</span></label>
                  <input value={data.location.city}
                    onChange={e => upd('location', { ...data.location, city: e.target.value })}
                    placeholder="e.g. Nairobi"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-[#FF385C] bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">County <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={data.location.county}
                    onChange={e => upd('location', { ...data.location, county: e.target.value })}
                    className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:border-[#FF385C] pr-9">
                    <option value="">Select county…</option>
                    {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      );
    }

    // STEP 3
    const BED_TYPES = ['Double Bed','King Bed','Queen Bed','Single Bed','Sofa Bed','Bunk Bed','Floor Mattress'];
    const cntStepper = (key: 'bedrooms'|'bathrooms'|'maxGuests') => (
      <div className="flex items-center gap-3">
        <button onClick={() => { const v = data.basics[key]; if (v > 1) upd('basics', { ...data.basics, [key]: v - 1 }); }}
          className="w-11 h-11 sm:w-9 sm:h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 transition-all text-xl font-bold">−</button>
        <span className="w-8 sm:w-6 text-center font-bold text-gray-900 text-lg">{data.basics[key]}</span>
        <button onClick={() => upd('basics', { ...data.basics, [key]: data.basics[key] + 1 })}
          className="w-11 h-11 sm:w-9 sm:h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 transition-all text-xl font-bold">+</button>
      </div>
    );
    if (step === 3) return (
      <div className="lg:px-[300px]">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Share the basics</h2>
        <p className="text-sm text-gray-500 mb-6">All fields below are required.</p>

        {/* Bedrooms / Bathrooms / Max Guests card */}
        <div className="border border-gray-200 rounded-xl mb-6">
          {([['Bedrooms','bedrooms'],['Bathrooms','bathrooms'],['Max Guests','maxGuests']] as [string,'bedrooms'|'bathrooms'|'maxGuests'][]).map(([label, key], i, arr) => (
            <div key={key} className={`flex items-center justify-between px-5 py-4 ${i < arr.length - 1 ? 'border-b border-gray-200' : ''}`}>
              <span className="font-semibold text-gray-900 text-sm">{label} <span className="text-red-500">*</span></span>
              {cntStepper(key)}
            </div>
          ))}
        </div>

        {/* Floor Space - hidden */}
        <div className="mb-5 hidden">
          <label className="block text-sm font-semibold text-gray-800 mb-2">Floor Space (sq meters, optional)</label>
          <input type="number" value={data.basics.size}
            onChange={e => upd('basics', { ...data.basics, size: e.target.value })}
            placeholder="e.g. 45"
            className="w-44 px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
          />
        </div>

        {/* Unit & Building - hidden */}
        <div className="mb-6 hidden">
          <label className="block text-sm font-semibold text-gray-800 mb-2">Unit & Building (optional)</label>
          <div className="flex gap-3">
            <input value={data.location.unit}
              onChange={e => upd('location', { ...data.location, unit: e.target.value })}
              placeholder="Unit No. e.g. B12"
              className="w-40 px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            />
            <input value={data.location.building}
              onChange={e => upd('location', { ...data.location, building: e.target.value })}
              placeholder="Building name e.g. The Avocado"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            />
          </div>
        </div>

        {/* Bed configuration */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-3">Bed configuration</p>
          <div className="space-y-3">
            {data.basics.beds.map((bed, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="relative flex-1">
                  <select value={bed.type}
                    onChange={e => { const beds = [...data.basics.beds]; beds[i] = { ...beds[i], type: e.target.value }; upd('basics', { ...data.basics, beds }); }}
                    className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 pr-9">
                    {BED_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { const beds = [...data.basics.beds]; if (beds[i].count > 1) { beds[i] = { ...beds[i], count: beds[i].count - 1 }; upd('basics', { ...data.basics, beds }); } }}
                    className="w-11 h-11 sm:w-9 sm:h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 transition-all text-xl font-bold">−</button>
                  <span className="w-8 sm:w-6 text-center font-bold text-gray-900 text-lg">{bed.count}</span>
                  <button onClick={() => { const beds = [...data.basics.beds]; beds[i] = { ...beds[i], count: beds[i].count + 1 }; upd('basics', { ...data.basics, beds }); }}
                    className="w-11 h-11 sm:w-9 sm:h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 transition-all text-xl font-bold">+</button>
                  <button onClick={() => { const beds = data.basics.beds.filter((_, idx) => idx !== i); upd('basics', { ...data.basics, beds }); }}
                    className="text-sm text-red-500 hover:text-red-700 font-medium ml-1">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => upd('basics', { ...data.basics, beds: [...data.basics.beds, { type: 'Double Bed', count: 1 }] })}
            className="mt-3 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            + Add bed type
          </button>
        </div>
      </div>
    );

    // STEP 4
    if (step === 4) return (
      <div className="lg:px-[200px]">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">What amenities do you offer?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Select all that apply. You can always update these later.{' '}
          <span className="text-green-600 font-semibold">{data.amenities.length} selected</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AMENITIES_FLAT.map(item => {
            const sel = data.amenities.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => upd('amenities', sel ? data.amenities.filter(a => a !== item.id) : [...data.amenities, item.id])}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                  sel
                    ? 'border-2 border-green-600 bg-green-50'
                    : 'border border-gray-200 bg-white hover:border-green-600'
                }`}
              >
                <span className={sel ? 'text-green-600' : 'text-gray-700'}>
                  <AmenityIcon id={item.id} />
                </span>
                <span className="text-sm font-medium text-gray-800">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );

    // STEP 5
    if (step === 5) return (
      <div className="lg:px-[200px]">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Add photos of your place</h2>
        <p className="text-sm text-gray-500 mb-6">Listings with professional-looking photos get up to 40% more bookings. Drag to reorder — the first photo is the cover. <span className="text-red-500 font-medium">* At least 1 photo required.</span></p>

        {/* Upload zone */}
        <label
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handlePhotoFiles(Array.from(e.dataTransfer.files)); }}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-12 cursor-pointer transition-colors active:border-green-600 active:bg-green-50 focus-within:border-green-600 focus-within:bg-green-50 ${dragOver ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:border-green-600 hover:bg-green-50'}`}
        >
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {photoUploading
            ? <><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-green-600 font-medium">Uploading…</p></>
            : <><p className="font-semibold text-gray-800 text-sm">Click or drag photos here</p><p className="text-xs text-gray-400">JPG, PNG, WebP — max 10 MB each</p></>}
          <input type="file" multiple accept="image/*" className="hidden" onChange={e => { handlePhotoFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
        </label>

        {/* Photo grid */}
        {data.photos.length > 0 ? (
          <div ref={photoGridRef} className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.photos.map((p, i) => (
              <div
                key={p.url}
                data-photo-idx={i}
                draggable
                onDragStart={e => { photoDragSrc.current = i; photoDragOverRef.current = i; setPhotoDragOver(i); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; photoDragOverRef.current = i; setPhotoDragOver(i); }}
                onDrop={e => { e.preventDefault(); if (photoDragSrc.current !== null) reorderPhotos(photoDragSrc.current, i); photoDragSrc.current = null; photoDragOverRef.current = null; setPhotoDragOver(null); }}
                onDragEnd={() => { photoDragSrc.current = null; photoDragOverRef.current = null; setPhotoDragOver(null); }}
                onTouchStart={() => { photoDragSrc.current = i; photoDragOverRef.current = i; setPhotoDragOver(i); }}
                onTouchEnd={() => { if (photoDragSrc.current !== null && photoDragOverRef.current !== null) reorderPhotos(photoDragSrc.current, photoDragOverRef.current); photoDragSrc.current = null; photoDragOverRef.current = null; setPhotoDragOver(null); }}
                style={{ touchAction: 'none' }}
                className={`relative group rounded-xl overflow-hidden aspect-square bg-gray-100 cursor-grab active:cursor-grabbing select-none transition-all border-2 ${
                  photoDragOver === i && photoDragSrc.current !== null && photoDragSrc.current !== i
                    ? 'border-green-500 scale-95'
                    : photoDragSrc.current === i
                    ? 'border-green-400 opacity-50'
                    : 'border-gray-200'
                }`}
              >
                <img src={p.url} alt="" className="w-full h-full object-cover pointer-events-none" draggable={false} />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold pointer-events-none">Cover</span>
                )}
                <div className="absolute top-1 right-1 bg-black/40 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:flex">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 10 16"><circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/><circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="2" cy="14" r="1.5"/><circle cx="8" cy="14" r="1.5"/></svg>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center gap-2">
                  {i !== 0 && <button onClick={e => { e.stopPropagation(); setCover(i); }} className="bg-white text-gray-900 rounded-lg px-2 py-1 text-xs font-semibold">Set cover</button>}
                  <button onClick={e => { e.stopPropagation(); removePhoto(i); }} className="bg-red-500 text-white rounded-lg px-2 py-1 text-xs font-semibold">Remove</button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 flex sm:hidden">
                  {i !== 0 && <button onClick={() => setCover(i)} className="flex-1 bg-white/90 text-gray-900 text-[10px] font-bold py-1.5 border-t border-r border-gray-100">Cover</button>}
                  <button onClick={() => removePhoto(i)} className="flex-1 bg-red-500 text-white text-[10px] font-bold py-1.5 border-t border-gray-100">✕</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 mt-5">No photos yet — add at least 3 for the best results</p>
        )}
      </div>
    );

    // STEP 6
    if (step === 6) return (
      <div className="lg:px-[200px] space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your listing title &amp; description</h2>
          <p className="text-sm text-gray-500 mb-6">A great title and description help your listing stand out.</p>

          {/* Listing Title */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Listing Title <span className="text-red-500">*</span></label>
            <input
              value={data.title}
              onChange={e => e.target.value.length <= 80 && upd('title', e.target.value)}
              maxLength={80}
              placeholder="e.g. Cozy Studio in Kilimani with Fast Wi-Fi"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            />
            <p className="text-xs text-gray-400 mt-1">{data.title.length}/80 characters</p>
          </div>

          {/* Description */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-800">Description <span className="text-red-500">*</span></label>
              <button
                type="button"
                disabled={aiLoading || !data.propertyType}
                onClick={async () => {
                  setAiLoading(true);
                  try {
                    const res = await fetch('/api/ai/description', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        propertyType: data.propertyType,
                        location: data.location,
                        amenities: data.amenities,
                        basics: data.basics,
                        title: data.title,
                      }),
                    });
                    const json = await res.json();
                    if (!res.ok) {
                      showError(json.error?.message || 'AI generation failed.');
                    } else if (json.description) {
                      upd('description', json.description);
                    }
                  } catch {
                    showError('Network error — could not reach AI service.');
                  } finally {
                    setAiLoading(false);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z"/>
                  </svg>
                )}
                {aiLoading ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
            <textarea
              value={data.description}
              onChange={e => e.target.value.length <= 2000 && upd('description', e.target.value)}
              maxLength={2000}
              rows={6}
              placeholder="Describe your space, what makes it special, nearby attractions, neighbourhood vibe..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">{data.description.length}/2000 characters</p>
          </div>

        </div>
      </div>
    );

    // STEP 7
    const kshField = (key: string) => (
      <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden focus-within:ring-1 focus-within:ring-green-600 focus-within:border-green-600">
        <span className="px-3 text-sm text-gray-500 shrink-0">KSh</span>
        <input
          type="number"
          value={(data.pricing as unknown as Record<string, string>)[key]}
          onChange={e => upd('pricing', { ...data.pricing, [key]: e.target.value })}
          className="flex-1 py-2.5 pr-3 text-sm outline-none bg-transparent"
        />
      </div>
    );
    if (step === 7) return (
      <div className="lg:px-[200px] space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Set your pricing</h2>
          <p className="text-sm text-gray-500 mb-6">Prices are in Kenya Shillings (KSh). You can adjust at any time.</p>
        </div>

        {/* Rate card */}
        <div className="border border-green-200 bg-green-50 rounded-xl p-5 mx-2 grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1.5">Base nightly rate <span className="text-red-500">*</span></p>
            {kshField('nightly')}
            <p className="text-xs text-gray-400 mt-1">Standard weekday price per night</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1.5">Weekend rate (Fri–Sat)</p>
            {kshField('weekend')}
            <p className="text-xs text-gray-400 mt-1">Optional uplift for weekends</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1.5">Monthly rate</p>
            {kshField('monthly')}
            <p className="text-xs text-gray-400 mt-1">Discount for 30+ night stays</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1.5">Cleaning fee</p>
            {kshField('cleaning')}
            <p className="text-xs text-gray-400 mt-1">One-time fee per booking</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1.5">Security deposit</p>
            {kshField('deposit')}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1.5">Extra guest fee</p>
            {kshField('extraGuest')}
          </div>
        </div>

        {/* Stay fields */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1.5">Base guests included</p>
            <input type="number" min={1} value={data.pricing.baseGuests}
              onChange={e => upd('pricing', { ...data.pricing, baseGuests: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600" />
            <p className="text-xs text-gray-400 mt-1">Guests included in base price</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1.5">Minimum stay (nights)</p>
            <input type="number" min={1} value={data.pricing.minStay}
              onChange={e => upd('pricing', { ...data.pricing, minStay: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1.5">Maximum stay (nights)</p>
            <input value={data.pricing.maxStay}
              onChange={e => upd('pricing', { ...data.pricing, maxStay: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600" />
          </div>
        </div>

        {/* Seasonal pricing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-800">Seasonal pricing</p>
            <button
              onClick={() => { if (newSeason.name && newSeason.price) { upd('pricing', { ...data.pricing, seasonal: [...data.pricing.seasonal, newSeason] }); setNewSeason({ name: '', start: '', end: '', price: '' }); } }}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              + Add period
            </button>
          </div>
          {data.pricing.seasonal.length === 0 && (
            <p className="text-sm text-gray-400 mb-3">e.g. Christmas / December holiday rates, August peak season</p>
          )}
          {data.pricing.seasonal.length > 0 && (
            <div className="space-y-2 mb-3">
              {data.pricing.seasonal.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-700">{s.name}: KSh {s.price}/night ({s.start} – {s.end})</span>
                  <button onClick={() => upd('pricing', { ...data.pricing, seasonal: data.pricing.seasonal.filter((_, idx) => idx !== i) })} className="text-red-500 text-xs ml-2 hover:text-red-700">Remove</button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Season name (e.g. Christmas)" value={newSeason.name} onChange={e => setNewSeason(s => ({ ...s, name: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600" />
            <input placeholder="Rate (KSh)" type="number" value={newSeason.price} onChange={e => setNewSeason(s => ({ ...s, price: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600" />
            <input type="date" value={newSeason.start} onChange={e => setNewSeason(s => ({ ...s, start: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600" />
            <input type="date" value={newSeason.end} onChange={e => setNewSeason(s => ({ ...s, end: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600" />
          </div>
        </div>
      </div>
    );

    // STEP 8
    const CHECK_METHODS = [
      { id: 'keybox',    icon: '🔑', label: 'Key Box' },
      { id: 'smartlock', icon: '📱', label: 'Smart Lock' },
      { id: 'caretaker', icon: '👤', label: 'Caretaker' },
      { id: 'self',      icon: '📋', label: 'Self Check-in' },
      { id: 'host',      icon: '🤝', label: 'Host Handover' },
    ];
    const PRESET_RULES = ['No parties or events','No smoking','No pets','Quiet hours 10pm–7am','No unregistered guests','Remove shoes at entrance','Sort rubbish before leaving'];
    const CHECK_IN_TIMES  = ['8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
    const CHECK_OUT_TIMES = ['8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00'];
    if (step === 8) return (
      <div className="lg:px-[200px] space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">House rules &amp; check-in</h2>
          <p className="text-sm text-gray-500 mb-6">Set expectations upfront to attract the right guests.</p>
        </div>

        {/* Check-in / Check-out times */}
        <div className="grid grid-cols-2 gap-4">
          {([['Check-in time','checkIn', CHECK_IN_TIMES],['Check-out time','checkOut', CHECK_OUT_TIMES]] as [string,string,string[]][]).map(([label, key, opts]) => (
            <div key={key}>
              <p className="text-sm font-semibold text-gray-800 mb-1.5">{label}</p>
              <div className="relative">
                <select value={(data.rules as unknown as Record<string,string>)[key]} onChange={e => upd('rules', { ...data.rules, [key]: e.target.value })}
                  className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:ring-1 focus:ring-green-600 pr-9">
                  {opts.map(t => <option key={t}>{t}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          ))}
        </div>

        {/* Check-in method */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Check-in method</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CHECK_METHODS.map(m => {
              const sel = data.rules.checkInMethod === m.id;
              return (
                <button key={m.id} onClick={() => upd('rules', { ...data.rules, checkInMethod: m.id })}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm text-left transition-all ${sel ? 'border-2 border-green-600 bg-green-50 text-gray-900' : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
                  <span>{m.icon}</span>
                  <span className="font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Check-in instructions */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Check-in instructions <span className="text-red-500">*</span></label>
          <textarea value={data.rules.instructions} onChange={e => upd('rules', { ...data.rules, instructions: e.target.value })} rows={4}
            placeholder="e.g. Call caretaker John on arrival. Gate code is 1234. Apartment is on 3rd floor, door B12."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 resize-y" />
        </div>

        {/* Caretaker */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Caretaker name</label>
            <input value={data.rules.caretakerName} onChange={e => upd('rules', { ...data.rules, caretakerName: e.target.value })}
              placeholder="e.g. John Kamau"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Caretaker phone</label>
            <input type="tel" value={data.rules.caretakerPhone}
              onChange={e => upd('rules', { ...data.rules, caretakerPhone: e.target.value })}
              placeholder="e.g. 0712 345 678"
              pattern="^(\+254|0)[17]\d{8}$"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600" />
            {data.rules.caretakerPhone && !/^(\+254|0)[17]\d{8}$/.test(data.rules.caretakerPhone.replace(/\s/g,'')) && (
              <p className="text-xs text-amber-600 mt-1">Enter a valid Kenyan number (e.g. 0712345678 or +254712345678)</p>
            )}
          </div>
        </div>

        {/* House rules pills */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-1">House rules <span className="text-xs font-normal text-gray-400">(tap to toggle on/off)</span></p>
          <p className="text-xs text-gray-400 mb-3">Active rules are shown highlighted in green.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_RULES.map(rule => {
              const KEY_MAP: Record<string, keyof WizardFormData['rules']> = {
                'No parties or events': 'noParties',
                'No smoking': 'noSmoking',
                'No pets': 'noPets',
                'Quiet hours 10pm–7am': 'quietHours',
                'No unregistered guests': 'adultsOnly',
                'Remove shoes at entrance': 'removeShoes',
                'Sort rubbish before leaving': 'sortRubbish',
              };
              const key = KEY_MAP[rule] as keyof typeof data.rules;
              const active = key ? !!(data.rules[key]) : false;
              return (
                <button key={rule} type="button"
                  onClick={() => key && upd('rules', { ...data.rules, [key]: !active })}
                  className={`px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                    active
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-600 hover:border-green-400 hover:bg-green-50/50'
                  }`}>
                  {active && <span className="mr-1">✓</span>}{rule}
                </button>
              );
            })}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Additional / custom rules</label>
            {data.rules.additionalRules && (
              <div className="flex flex-wrap gap-2 mb-3">
                {data.rules.additionalRules.split('\n').filter(Boolean).map((rule, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border border-green-600 bg-green-50 text-green-700">
                    ✓ {rule}
                    <button type="button" onClick={() => { const updated = data.rules.additionalRules.split('\n').filter(Boolean).filter((_,idx) => idx !== i).join('\n'); upd('rules', { ...data.rules, additionalRules: updated }); }} className="ml-0.5 text-green-400 hover:text-red-500 text-base leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={customRuleInput}
                onChange={e => setCustomRuleInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (customRuleInput.trim()) { const updated = [...data.rules.additionalRules.split('\n').filter(Boolean), customRuleInput.trim()].join('\n'); upd('rules', { ...data.rules, additionalRules: updated }); setCustomRuleInput(''); } } }}
                placeholder="Type a custom rule…"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
              />
              <button type="button"
                onClick={() => { if (customRuleInput.trim()) { const updated = [...data.rules.additionalRules.split('\n').filter(Boolean), customRuleInput.trim()].join('\n'); upd('rules', { ...data.rules, additionalRules: updated }); setCustomRuleInput(''); } }}
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Cancellation policy */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-3">Cancellation policy</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              ['flexible',      'Flexible',       'Full refund 24h before check-in'],
              ['moderate',      'Moderate',       'Full refund 5 days before check-in'],
              ['strict',        'Strict',         '50% refund up to 1 week before check-in'],
              ['nonrefundable', 'Non-Refundable', 'No refund after booking'],
            ] as [string,string,string][]).map(([val, label, desc]) => {
              const sel = data.rules.cancellation === val;
              return (
                <button key={val} onClick={() => upd('rules', { ...data.rules, cancellation: val })}
                  className={`text-left px-4 py-3 border rounded-lg transition-all ${sel ? 'border-2 border-green-600 bg-green-50' : 'border border-gray-200 bg-white hover:border-gray-300'}`}>
                  <p className="font-semibold text-sm text-gray-900">{label}</p>
                  <p className={`text-xs mt-0.5 ${sel ? 'text-green-600' : 'text-gray-500'}`}>{desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );

    // STEP 9
    const reviewRow = (label: string, value: React.ReactNode, bold = false) => (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-800'}`}>{value}</span>
      </div>
    );
    if (step === 9) return (
      <div className="lg:px-[200px] space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Review your listing</h2>
          <p className="text-sm text-gray-500 mb-6">Everything looks good? Hit Publish to go live.</p>
        </div>

        {/* Photo carousel */}
        {data.photos.length > 0 && (
          <div className="relative rounded-xl overflow-hidden">
            {/* Images */}
            <div className="relative h-64 overflow-hidden rounded-xl touch-pan-y"
              onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={e => { const dx = touchStartX.current - e.changedTouches[0].clientX; if (Math.abs(dx) > 50) { if (dx > 0) setPhotoIdx(i => Math.min(data.photos.length - 1, i + 1)); else setPhotoIdx(i => Math.max(0, i - 1)); } }}
            >
              {data.photos.map((p, i) => (
                <div key={i}
                  className="absolute inset-0 transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(${(i - photoIdx) * 100}%)` }}
                >
                  <img src={p.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              {/* Prev / Next */}
              {data.photos.length > 1 && (
                <>
                  <button onClick={() => setPhotoIdx(i => Math.max(0, i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button onClick={() => setPhotoIdx(i => Math.min(data.photos.length - 1, i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </>
              )}
            </div>
            {/* Dots */}
            {data.photos.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {data.photos.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === photoIdx ? 'w-4 h-2 bg-green-600' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Details card */}
        <div className="border border-gray-200 rounded-xl px-5 pt-4 pb-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{data.title || 'Untitled Property'}</h3>
          {reviewRow('Type', data.propertyType || '—', true)}
          {reviewRow('Location', (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>
              {[data.location.neighbourhood, data.location.city, data.location.county].filter(Boolean).join(', ') || '—'}
            </span>
          ))}
          {reviewRow('Bedrooms', `${data.basics.bedrooms} bedroom${data.basics.bedrooms !== 1 ? 's' : ''}`, true)}
          {reviewRow('Bathrooms', data.basics.bathrooms)}
          {reviewRow('Max Guests', data.basics.maxGuests)}
          {reviewRow('Base Rate', data.pricing.nightly ? <span>KSh {data.pricing.nightly} / <strong>night</strong></span> : '—')}
          {reviewRow('Min Stay', data.pricing.minStay ? `${data.pricing.minStay} night` : '—')}
          {reviewRow('Check-in', data.rules.checkIn || '—')}
          {reviewRow('Check-out', data.rules.checkOut || '—')}
          {reviewRow('Cancellation', data.rules.cancellation || '—', true)}
        </div>

        {/* Amenities card */}
        {data.amenities.length > 0 && (
          <div className="border border-gray-200 rounded-xl px-5 py-4">
            <p className="text-xs font-bold text-gray-400 tracking-widest mb-2">AMENITIES</p>
            <p className="text-sm text-gray-800">{data.amenities.map(id => AMENITIES_FLAT.find(a => a.id === id)?.label ?? id).join(', ')}</p>
          </div>
        )}

        {/* Photo warning */}
        {data.photos.length < 3 && (
          <div className="flex items-start gap-3 border border-amber-300 bg-amber-50 rounded-xl px-4 py-3">
            <span className="text-amber-500 text-base mt-0.5">⚠️</span>
            <p className="text-sm text-amber-700">
              {data.photos.length === 0
                ? 'No photos added. Go back and add at least 3 photos for better visibility.'
                : `You have only ${data.photos.length} photo${data.photos.length > 1 ? 's' : ''}. Go back and add more photos for better visibility.`}
            </p>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Permanent keyframes */}
      <style>{`
        @keyframes slideDown{0%{transform:translateX(-50%) translateY(-16px);opacity:0}100%{transform:translateX(-50%) translateY(0);opacity:1}}
        @keyframes cf-a{0%{transform:translate(0,-10px) rotate(0deg);opacity:1}30%{transform:translate(-28px,30vh) rotate(130deg)}65%{transform:translate(-10px,65vh) rotate(260deg);opacity:.9}100%{transform:translate(-25px,110vh) rotate(400deg);opacity:0}}
        @keyframes cf-b{0%{transform:translate(0,-10px) rotate(0deg);opacity:1}30%{transform:translate(28px,30vh) rotate(-130deg)}65%{transform:translate(10px,65vh) rotate(-260deg);opacity:.9}100%{transform:translate(25px,110vh) rotate(-400deg);opacity:0}}
        @keyframes cf-c{0%{transform:translate(0,-10px) rotate(0deg) scaleX(1);opacity:1}25%{transform:translate(18px,25vh) rotate(90deg) scaleX(-1)}50%{transform:translate(-18px,50vh) rotate(180deg) scaleX(1)}75%{transform:translate(22px,75vh) rotate(270deg) scaleX(-1);opacity:.85}100%{transform:translate(-12px,110vh) rotate(360deg) scaleX(1);opacity:0}}
        @keyframes cf-d{0%{transform:translate(0,-10px) rotate(0deg) scaleX(1);opacity:1}25%{transform:translate(-18px,25vh) rotate(-90deg) scaleX(-1)}50%{transform:translate(18px,50vh) rotate(-180deg) scaleX(1)}75%{transform:translate(-22px,75vh) rotate(-270deg) scaleX(-1);opacity:.85}100%{transform:translate(12px,110vh) rotate(-360deg) scaleX(1);opacity:0}}
        @keyframes cf-e{0%{transform:translate(0,-10px) rotate(0deg);opacity:1}20%{transform:translate(-10px,20vh) rotate(144deg)}40%{transform:translate(12px,40vh) rotate(288deg)}60%{transform:translate(-14px,60vh) rotate(432deg);opacity:.9}80%{transform:translate(8px,80vh) rotate(576deg)}100%{transform:translate(-6px,110vh) rotate(720deg);opacity:0}}
        @keyframes cf-f{0%{transform:translate(0,-10px) rotate(0deg);opacity:1}20%{transform:translate(10px,20vh) rotate(-144deg)}40%{transform:translate(-12px,40vh) rotate(-288deg)}60%{transform:translate(14px,60vh) rotate(-432deg);opacity:.9}80%{transform:translate(-8px,80vh) rotate(-576vh)}100%{transform:translate(6px,110vh) rotate(-720deg);opacity:0}}
        @keyframes pulse-ring{0%{box-shadow:0 0 0 0 rgba(134,239,172,.7),0 0 0 0 rgba(134,239,172,.4)}70%{box-shadow:0 0 0 24px rgba(134,239,172,0),0 0 0 48px rgba(134,239,172,0)}100%{box-shadow:0 0 0 0 rgba(134,239,172,0)}}
        @keyframes float-up{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes fade-in-up{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes draw-check{0%{stroke-dashoffset:80}100%{stroke-dashoffset:0}}
        @keyframes spin-slow{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      `}</style>

      {/* ── Confetti (above everything) ── */}
      {confetti && (
        <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden">
          {confettiPieces.map(p => (
            <div key={p.id} style={{
              position:'absolute', left:`${p.left}%`, top:0,
              width:`${p.w}px`, height:`${p.h}px`,
              backgroundColor:p.color, borderRadius:p.round,
              animation:`${p.anim} ${p.duration}s ${p.delay}s cubic-bezier(.4,0,.6,1) both`,
            }} />
          ))}
        </div>
      )}

      {/* ── Congratulations screen ── */}
      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden"
          style={{background:'linear-gradient(135deg,#0a2e1a 0%,#14532d 40%,#166534 70%,#15803d 100%)'}}>
          {/* Decorative glowing orbs */}
          <div className="absolute w-[500px] h-[500px] rounded-full opacity-20 -top-32 -left-32" style={{background:'radial-gradient(circle,#4ade80,transparent)',animation:'spin-slow 20s linear infinite'}} />
          <div className="absolute w-[400px] h-[400px] rounded-full opacity-10 -bottom-20 -right-20" style={{background:'radial-gradient(circle,#86efac,transparent)',animation:'spin-slow 25s linear infinite reverse'}} />
          <div className="absolute w-72 h-72 rounded-full opacity-10 top-1/2 left-1/4" style={{background:'radial-gradient(circle,#bbf7d0,transparent)'}} />

          {/* Card */}
          <div className="relative z-10 text-center px-8 max-w-md w-full" style={{animation:'fade-in-up .6s ease-out both'}}>

            {/* Pulsing checkmark */}
            <div className="relative flex items-center justify-center mx-auto mb-8 w-36 h-36" style={{animation:'float-up 3s ease-in-out infinite'}}>
              <div className="absolute inset-0 rounded-full" style={{animation:'pulse-ring 2s ease-out infinite',background:'transparent'}} />
              <div className="w-32 h-32 rounded-full bg-green-400 flex items-center justify-center shadow-2xl" style={{boxShadow:'0 0 60px rgba(74,222,128,.5)'}}>
                <svg viewBox="0 0 52 52" className="w-16 h-16">
                  <circle cx="26" cy="26" r="25" fill="none" stroke="#fff" strokeWidth="2" opacity=".3"/>
                  <polyline fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" points="14 27 22 35 38 18"
                    style={{strokeDasharray:80,animation:'draw-check .6s .3s ease-out both',strokeDashoffset:80}}/>
                </svg>
              </div>
            </div>

            {/* Text */}
            <h1 className="text-5xl font-black text-white mb-2" style={{animation:'fade-in-up .6s .2s ease-out both',opacity:0}}>
              {isEdit ? 'Changes Saved!' : 'Congratulations!'}
            </h1>
            <p className="text-green-300 text-xl font-semibold mb-1" style={{animation:'fade-in-up .6s .35s ease-out both',opacity:0}}>
              {data.title ? `"${data.title}"` : 'Your property'} {isEdit ? 'has been updated ✨' : 'is now live 🎉'}
            </p>
            <p className="text-green-100/70 text-sm mb-10" style={{animation:'fade-in-up .6s .45s ease-out both',opacity:0}}>
              {isEdit ? 'Your listing changes are live for guests to see.' : 'Guests can now discover and book your property'}
            </p>

            {/* Countdown ring */}
            <div className="flex flex-col items-center mb-8" style={{animation:'fade-in-up .6s .55s ease-out both',opacity:0}}>
              <div className="relative w-20 h-20 mb-2">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="6"/>
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#4ade80" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - countdown / 6)}`}
                    style={{transition:'stroke-dashoffset 1s linear'}}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white">{countdown}</span>
              </div>
              <p className="text-green-200/60 text-xs">Redirecting in {countdown}s…</p>
            </div>

            {/* Button */}
            <button onClick={onClose}
              className="px-10 py-3.5 bg-white text-green-800 rounded-full font-bold text-base shadow-xl hover:bg-green-50 transition-all hover:scale-105 active:scale-95"
              style={{animation:'fade-in-up .6s .65s ease-out both',opacity:0}}>
              Go to My Properties →
            </button>
          </div>
        </div>
      )}

      {/* ── Wizard UI (hidden while success screen is up) ── */}
      {!showSuccess && (
        <div className="bg-white flex flex-col h-full">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 h-[80px] border-b border-gray-200 shrink-0">
        <button onClick={saveDraft} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Save & Exit
        </button>
        <span className="text-sm text-gray-400">Auto-saved</span>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <div className="hidden lg:flex flex-col w-52 shrink-0 border-r border-gray-100 py-[50px] px-3 overflow-y-auto gap-0.5">
          {STEP_NAMES.map((name, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <button key={n}
                onClick={() => n <= highestStep && navigate(n)}
                disabled={n > highestStep}
                title={n > highestStep ? 'Complete the current step first' : ''}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  active ? 'bg-green-50' : n <= highestStep ? 'hover:bg-gray-50' : 'opacity-40 cursor-not-allowed'
                }`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  active ? 'bg-green-600 text-white' :
                  done  ? 'bg-green-600 text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {done && !active ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <span className="text-xs font-bold">{n}</span>
                  )}
                </span>
                <span className={`text-sm ${
                  active ? 'font-semibold text-green-700' :
                  done  ? 'text-gray-600' :
                  'text-gray-400'
                }`}>{name}</span>
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div
          ref={contentRef}
          className={`flex-1 overflow-y-auto px-6 py-8 lg:px-[200px] transition-all duration-300 ${
            animating ? (dir === 'fwd' ? 'opacity-0 translate-x-3' : 'opacity-0 -translate-x-3') : 'opacity-100 translate-x-0'
          }`}
          style={{ transform: animating ? (dir === 'fwd' ? 'translateX(12px)' : 'translateX(-12px)') : 'translateX(0)' }}
        >
          {stepContent()}
        </div>
      </div>

      {/* ── Warning toast ── */}
      {stepError && (
        <div style={{ animation: 'slideDown 0.3s ease-out', position: 'fixed', top: '88px', left: '50%', transform: 'translateX(-50%)', zIndex: 80 }}
          className="flex items-start gap-3 bg-amber-50 border border-amber-400 rounded-xl px-5 py-3.5 shadow-xl w-[90vw] max-w-lg">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p className="text-sm text-amber-800 font-medium flex-1">{stepError}</p>
          <button onClick={() => showError('')} className="text-amber-400 hover:text-amber-600 ml-1 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="border-t border-gray-200 px-6 py-4 flex flex-col gap-2 shrink-0 bg-white">
        <div className="flex items-center justify-between">
        <button onClick={goBack} disabled={step === 1}
          className="flex items-center gap-1.5 px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <span className="text-sm text-gray-500">{step} / {TOTAL}<span className="hidden sm:inline"> — {STEP_NAMES[step - 1]}</span></span>
        {step < TOTAL ? (
          <button onClick={goNext}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ) : (
          <button onClick={handlePublish} disabled={publishing}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
            {publishing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            ) : null}
            {publishing ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish'}
          </button>
        )}
        </div>
      </div>

        </div>
      )}
    </div>
  );
}
