/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plane,
  Hotel,
  Compass,
  Utensils,
  Briefcase,
  Check,
  SlidersHorizontal,
  ShieldCheck,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Plus,
  Trash2,
  X,
  ArrowRight,
  AlertCircle,
  Info,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import {
  CATALOG_ITEMS,
  TRAVEL_AGENT_PAIN_SOLUTIONS,
  GENERATED_ASSETS,
  RegionType,
  BudgetTier,
  BookingCategory,
  TravelStyle,
  CatalogItem,
} from './data/catalogData';

interface FolioEntry {
  item: CatalogItem;
  quantity: number;
  selectedDate: string;
  specialNotes: string;
}

const CATEGORY_TABS: { id: BookingCategory | 'all'; label: string; countLabel: string }[] = [
  { id: 'all', label: 'All Recommendations', countLabel: '20 Curated' },
  { id: 'flights', label: 'Flights', countLabel: 'True-Fare Routes' },
  { id: 'hotels', label: 'Hotels & Sanctuaries', countLabel: 'Step & Noise Vetted' },
  { id: 'packages', label: 'Complete Packages', countLabel: 'Unpack-Once Loops' },
  { id: 'restaurants', label: 'Restaurants', countLabel: 'Guaranteed Tables' },
  { id: 'adventures', label: 'Local Adventures', countLabel: 'Crowd-Timed' },
];

export default function App() {
  // Real-time Personalized Recommendation Engine State
  const [selectedRegion, setSelectedRegion] = useState<RegionType>('All');
  const [selectedBudget, setSelectedBudget] = useState<BudgetTier | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<BookingCategory | 'all'>('all');
  const [selectedStyle, setSelectedStyle] = useState<TravelStyle>('All');
  const [travelersCount, setTravelersCount] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [prioritizeZeroStairs, setPrioritizeZeroStairs] = useState<boolean>(false);
  const [prioritizeCrowdFree, setPrioritizeCrowdFree] = useState<boolean>(true);

  // Detail modal & Trip Folio Drawer State
  const [inspectedItem, setInspectedItem] = useState<CatalogItem | null>(null);
  const [isFolioOpen, setIsFolioOpen] = useState<boolean>(false);
  const [bookingConfirmedId, setBookingConfirmedId] = useState<string | null>(null);
  const [travelerName, setTravelerName] = useState<string>('Elena Rostova');
  const [travelerEmail, setTravelerEmail] = useState<string>('elena.rostova@voyage.eu');
  const [departureMonth, setDepartureMonth] = useState<string>('October 2026');
  const [dietaryAndMobilityNotes, setDietaryAndMobilityNotes] = useState<string>(
    'Prefer quiet upper-floor rooms, window tables at sunset, and stress-free >2h flight connections.'
  );

  // Pre-seed folio with a balanced Europe or SE Asia trio so the traveler immediately sees how the itinerary builder works
  const [folio, setFolio] = useState<FolioEntry[]>([
    {
      item: CATALOG_ITEMS.find((i) => i.id === 'flt-eur-med') || CATALOG_ITEMS[0],
      quantity: 2,
      selectedDate: 'Oct 14, 2026',
      specialNotes: 'Seats 14A & 14C assigned together',
    },
    {
      item: CATALOG_ITEMS.find((i) => i.id === 'htl-eur-med') || CATALOG_ITEMS[5],
      quantity: 3, // 3 nights
      selectedDate: 'Oct 15 – Oct 18, 2026',
      specialNotes: '3rd-floor sea loggia + jetty luggage porter booked',
    },
    {
      item: CATALOG_ITEMS.find((i) => i.id === 'rst-eur-med') || CATALOG_ITEMS[14],
      quantity: 2,
      selectedDate: 'Oct 16, 2026 · 19:30',
      specialNotes: 'Arched sea-view window table #4',
    },
  ]);

  // Real-time recommendation scoring & filtering
  const recommendedItems = useMemo(() => {
    return CATALOG_ITEMS.filter((item) => {
      if (selectedRegion !== 'All' && item.region !== selectedRegion) return false;
      if (selectedBudget !== 'All' && item.budgetTier !== selectedBudget) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedStyle !== 'All' && item.travelStyle !== selectedStyle) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const match =
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.destination.toLowerCase().includes(q) ||
          item.country.toLowerCase().includes(q) ||
          item.painPointSolved.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    }).map((item) => {
      // Calculate personalized match score based on user preferences
      let score = 91;
      if (selectedRegion !== 'All' && item.region === selectedRegion) score += 3;
      if (selectedBudget !== 'All' && item.budgetTier === selectedBudget) score += 4;
      if (selectedStyle !== 'All' && item.travelStyle === selectedStyle) score += 3;
      if (prioritizeZeroStairs && (item.hotelDetails || item.packageDetails)) score += 2;
      if (prioritizeCrowdFree && (item.adventureDetails || item.restaurantDetails)) score += 2;
      return {
        ...item,
        matchScore: Math.min(99, score),
      };
    });
  }, [
    selectedRegion,
    selectedBudget,
    selectedCategory,
    selectedStyle,
    searchQuery,
    prioritizeZeroStairs,
    prioritizeCrowdFree,
  ]);

  // Budget Tier Comparison Metrics for the currently active filter set
  const budgetComparisonSummary = useMemo(() => {
    const regionFiltered = CATALOG_ITEMS.filter(
      (i) =>
        (selectedRegion === 'All' || i.region === selectedRegion) &&
        (selectedCategory === 'all' || i.category === selectedCategory)
    );
    const getAvg = (tier: BudgetTier) => {
      const items = regionFiltered.filter((i) => i.budgetTier === tier);
      if (items.length === 0) return 0;
      return Math.round(items.reduce((acc, cur) => acc + cur.trueTotalPrice, 0) / items.length);
    };
    return {
      economicalAvg: getAvg('Economical'),
      mediumAvg: getAvg('Medium'),
      expensiveAvg: getAvg('Expensive'),
      economicalCount: regionFiltered.filter((i) => i.budgetTier === 'Economical').length,
      mediumCount: regionFiltered.filter((i) => i.budgetTier === 'Medium').length,
      expensiveCount: regionFiltered.filter((i) => i.budgetTier === 'Expensive').length,
    };
  }, [selectedRegion, selectedCategory]);

  // Add or increment item in Trip Folio
  const handleAddToFolio = (item: CatalogItem) => {
    setBookingConfirmedId(null);
    setFolio((prev) => {
      const existing = prev.find((entry) => entry.item.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.item.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      const defaultQty = item.category === 'hotels' ? 3 : travelersCount;
      const defaultDate =
        item.category === 'restaurants'
          ? 'Oct 17, 2026 · 19:30'
          : item.category === 'adventures'
          ? 'Oct 18, 2026 · 06:45 AM'
          : 'Oct 15, 2026';
      return [
        ...prev,
        {
          item,
          quantity: defaultQty,
          selectedDate: defaultDate,
          specialNotes: item.painPointSolved,
        },
      ];
    });
  };

  const handleRemoveFromFolio = (id: string) => {
    setFolio((prev) => prev.filter((entry) => entry.item.id !== id));
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setFolio((prev) =>
      prev.map((entry) => {
        if (entry.item.id !== id) return entry;
        const nextQty = Math.max(1, entry.quantity + delta);
        return { ...entry, quantity: nextQty };
      })
    );
  };

  const folioTotals = useMemo(() => {
    const baseTotal = folio.reduce((sum, e) => sum + e.item.basePrice * e.quantity, 0);
    const taxesTotal = folio.reduce((sum, e) => sum + e.item.taxesAndFees * e.quantity, 0);
    const allInTotal = folio.reduce((sum, e) => sum + e.item.trueTotalPrice * e.quantity, 0);

    // Check if user mixed Europe and Southeast Asia in the same short trip to offer helpful agent guidance
    const regionsInFolio = Array.from(new Set(folio.map((e) => e.item.region)));
    const hasMultiRegionWarning = regionsInFolio.length > 1;

    return {
      baseTotal,
      taxesTotal,
      allInTotal,
      perTravelerEstimate: Math.round(allInTotal / Math.max(1, travelersCount)),
      hasMultiRegionWarning,
    };
  }, [folio, travelersCount]);

  const isItemInFolio = (id: string) => folio.some((e) => e.item.id === id);

  const handleConfirmItinerary = (e: React.FormEvent) => {
    e.preventDefault();
    if (folio.length === 0) return;
    const randomRef = `AM-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingConfirmedId(randomRef);
  };

  const applyQuickPersona = (
    region: RegionType,
    budget: BudgetTier | 'All',
    style: TravelStyle,
    category: BookingCategory | 'all' = 'all'
  ) => {
    setSelectedRegion(region);
    setSelectedBudget(budget);
    setSelectedStyle(style);
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-[#F5EFE6] text-[#1F1A17] flex flex-col">
      {/* ==================== TOP BAR CONTRACT (3 ZONES) ==================== */}
      <header className="sticky top-0 z-30 bg-[#F5EFE6]/95 backdrop-blur-md border-b border-[#DFD5C6] px-6 lg:px-12 py-4">
        <div className="max-w-[1380px] mx-auto flex items-center justify-between gap-6">
          {/* Zone 1: Brand Title (Single text element, one line) */}
          <a
            href="#top"
            className="font-serif-display text-2xl font-semibold tracking-tight text-[#1F1A17] whitespace-nowrap shrink-0"
          >
            Atelier Méridien
          </a>

          {/* Zone 2: 5 Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5C5147]">
            <a
              href="#concierge-profiler"
              className="hover:text-[#1F1A17] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Trip Profiler
            </a>
            <a
              href="#catalog-section"
              onClick={() => setSelectedCategory('flights')}
              className="hover:text-[#1F1A17] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Flights & Stays
            </a>
            <a
              href="#catalog-section"
              onClick={() => setSelectedCategory('packages')}
              className="hover:text-[#1F1A17] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Packages
            </a>
            <a
              href="#catalog-section"
              onClick={() => setSelectedCategory('restaurants')}
              className="hover:text-[#1F1A17] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Dining & Adventures
            </a>
            <a
              href="#agent-methodology"
              className="hover:text-[#1F1A17] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Why Book With Us
            </a>
          </nav>

          {/* Zone 3: Primary Action (Trip Folio Drawer Trigger) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsFolioOpen(true)}
              className="px-4 py-2 text-sm font-medium bg-[#1F1A17] text-[#FAF6F0] rounded-lg hover:bg-[#332B26] transition-colors whitespace-nowrap flex items-center gap-2.5 cursor-pointer"
            >
              <span>Trip Folio ({folio.length})</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">${folioTotals.allInTotal.toLocaleString()}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* ==================== HERO SECTION ==================== */}
        <section className="px-6 lg:px-12 pt-10 pb-14 border-b border-[#DFD5C6]">
          <div className="max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Editorial Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C5147] tracking-wide">
                <span>15 Years Planning Europe & Southeast Asia</span>
                <span aria-hidden="true">·</span>
                <span>100% True All-In Pricing</span>
                <span aria-hidden="true">·</span>
                <span>Economical, Medium & Luxury Tiers</span>
              </div>

              <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-[54px] font-semibold text-[#1F1A17] leading-[1.08] text-balance">
                Travel without the hidden fees, missed connections, or tourist traps.
              </h1>

              <p className="text-base sm:text-lg text-[#5C5147] max-w-[66ch] leading-relaxed">
                After 15 years of personally walking hotel staircases in Positano, timing ferry
                connections in Naples, and inspecting boutique sanctuaries across Bali, Bangkok, and
                Ha Long Bay, I built this desk to solve the five frustrations that ruin vacations:
                surprise checkout fees, impossible airport layovers, noisy rooms, sold-out dining
                tables, and overcrowded midday tours.
              </p>

              {/* Quick Persona / Scenario Presets */}
              <div className="pt-2 space-y-2.5">
                <p className="text-xs font-medium text-[#5C5147]">
                  Instant Agent Presets — Click to load a real-time personalized briefing:
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      applyQuickPersona('Europe', 'Economical', 'Coastal & Scenic', 'all')
                    }
                    className="px-3.5 py-2 text-xs font-medium bg-[#FAF6F0] border border-[#DFD5C6] text-[#1F1A17] rounded-lg hover:border-[#8A3B24] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Smart-Budget Amalfi Coast ($185/nt stays)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyQuickPersona('Southeast Asia', 'Medium', 'Culinary & Wine', 'all')
                    }
                    className="px-3.5 py-2 text-xs font-medium bg-[#FAF6F0] border border-[#DFD5C6] text-[#1F1A17] rounded-lg hover:border-[#8A3B24] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Mid-Range Bangkok & Bali Gastronomy
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyQuickPersona('All', 'Expensive', 'Coastal & Scenic', 'all')
                    }
                    className="px-3.5 py-2 text-xs font-medium bg-[#FAF6F0] border border-[#DFD5C6] text-[#1F1A17] rounded-lg hover:border-[#8A3B24] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Flagship Luxury Suites & Private Charters
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickPersona('All', 'All', 'All', 'all')}
                    className="px-3.5 py-2 text-xs font-medium text-[#8A3B24] hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Show All 20 Vetted Options
                  </button>
                </div>
              </div>

              {/* Primary CTA & Proof Adjacency */}
              <div className="pt-2 flex flex-wrap items-center gap-6">
                <a
                  href="#concierge-profiler"
                  className="px-6 py-3.5 text-sm font-semibold bg-[#8A3B24] text-[#FAF6F0] rounded-lg hover:bg-[#722F1C] transition-colors whitespace-nowrap inline-flex items-center gap-2"
                >
                  <span>Customize Your Recommendations</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <div className="text-xs text-[#5C5147] space-y-0.5">
                  <div className="font-semibold text-[#1F1A17] font-mono-tabular">
                    4,820+ Multi-Stop Itineraries Executed Since 2011
                  </div>
                  <div>99.4% flight connection success rate · $0 surprise fees at check-in</div>
                </div>
              </div>
            </div>

            {/* Right Visual Showcase Column (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-xl overflow-hidden border border-[#DFD5C6] bg-[#EFE7DA] aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3]">
                <img
                  src={GENERATED_ASSETS.heroAmalfi}
                  alt="Sunlit Mediterranean travertine limestone terrace overlooking the Amalfi Coast at golden hour"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-[#FAF6F0]">
                  <div className="text-xs text-[#EFE7DA] mb-1">
                    Featured Vetted Sanctuary · Europe & Southeast Asia Desk
                  </div>
                  <p className="font-serif-display text-2xl font-medium leading-snug">
                    “Never book a Positano hotel without knowing how many stairs sit between your
                    taxi and your bed—or a Bangkok hotel without its own river pier.”
                  </p>
                  <div className="mt-2 text-xs text-[#DFD5C6]">
                    — Senior Managing Concierge, 15 Years Field Inspection Across 14 Countries
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== REAL-TIME PERSONALIZED RECOMMENDATION ENGINE ==================== */}
        <section
          id="concierge-profiler"
          className="px-6 lg:px-12 py-10 bg-[#EFE7DA] border-b border-[#DFD5C6]"
        >
          <div className="max-w-[1380px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="text-xs text-[#5C5147] mb-1">
                  Interactive Concierge Analysis · Real-Time Filtering Across All 5 Booking Pillars
                </div>
                <h2 className="font-serif-display text-3xl font-semibold text-[#1F1A17]">
                  Personalize Your Destination, Budget Tier & Comfort Priorities
                </h2>
              </div>
              <div className="text-xs text-[#5C5147] font-mono-tabular">
                Showing {recommendedItems.length} of {CATALOG_ITEMS.length} vetted options · All
                prices include taxes & baggage
              </div>
            </div>

            {/* Main Control Bar */}
            <div className="bg-[#FAF6F0] border border-[#DFD5C6] rounded-xl p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Region Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#1F1A17]">
                    1. Destination Region
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-[#EFE7DA] rounded-lg">
                    {(['All', 'Europe', 'Southeast Asia'] as RegionType[]).map((region) => (
                      <button
                        key={region}
                        type="button"
                        onClick={() => setSelectedRegion(region)}
                        className={`px-2.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${
                          selectedRegion === region
                            ? 'bg-[#1F1A17] text-[#FAF6F0]'
                            : 'text-[#5C5147] hover:text-[#1F1A17]'
                        }`}
                      >
                        {region === 'Southeast Asia' ? 'SE Asia' : region}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Budget Tier Selector (Economical, Medium, Expensive) */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#1F1A17]">
                    2. Traveler Budget Tier
                  </label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-[#EFE7DA] rounded-lg">
                    {(['All', 'Economical', 'Medium', 'Expensive'] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setSelectedBudget(tier)}
                        className={`px-2 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${
                          selectedBudget === tier
                            ? 'bg-[#8A3B24] text-[#FAF6F0]'
                            : 'text-[#5C5147] hover:text-[#1F1A17]'
                        }`}
                      >
                        {tier === 'Economical' ? 'Econ' : tier === 'Expensive' ? 'Luxury' : tier}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Travel Style Selector */}
                <div className="space-y-2">
                  <label htmlFor="style-select" className="block text-xs font-semibold text-[#1F1A17]">
                    3. Primary Travel Focus
                  </label>
                  <select
                    id="style-select"
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value as TravelStyle)}
                    className="w-full px-3.5 py-2 text-xs font-medium bg-[#F5EFE6] border border-[#DFD5C6] rounded-lg text-[#1F1A17] focus:outline-none focus:border-[#8A3B24]"
                  >
                    <option value="All">All Travel Styles (Balanced)</option>
                    <option value="Coastal & Scenic">Coastal & Scenic Relaxation</option>
                    <option value="Culinary & Wine">Culinary, Markets & Fine Dining</option>
                    <option value="Cultural Heritage">Cultural & Architectural Heritage</option>
                    <option value="Active Adventure">Active Trekking & Sea Kayaking</option>
                  </select>
                </div>

                {/* 4. Party Size & Keyword Search */}
                <div className="space-y-2">
                  <label htmlFor="search-input" className="block text-xs font-semibold text-[#1F1A17]">
                    4. Search City, Dish, or Feature
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Positano, Ubud, Bangkok, Kayak..."
                      className="w-full px-3.5 py-2 text-xs bg-[#F5EFE6] border border-[#DFD5C6] rounded-lg text-[#1F1A17] placeholder:text-[#7A6E63] focus:outline-none focus:border-[#8A3B24]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="px-2.5 py-2 text-xs text-[#8A3B24] hover:underline whitespace-nowrap cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Real-Time Budget Tier Analysis Bar (Economical vs Medium vs Expensive) */}
              <div className="pt-4 border-t border-[#DFD5C6] grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedBudget(selectedBudget === 'Economical' ? 'All' : 'Economical')
                  }
                  className={`text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedBudget === 'Economical'
                      ? 'bg-[#F5EFE6] border-[#8A3B24]'
                      : 'bg-[#F5EFE6]/60 border-[#DFD5C6] hover:border-[#7A6E63]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[#5C5147] mb-1">
                    <span className="font-semibold text-[#1F1A17]">
                      Tier 01 · Economical & Smart-Value
                    </span>
                    <span className="font-mono-tabular">
                      {budgetComparisonSummary.economicalCount} options
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-[#1F1A17] font-mono-tabular">
                    Avg ${budgetComparisonSummary.economicalAvg.toLocaleString()} all-in
                  </div>
                  <p className="text-xs text-[#5C5147] mt-1">
                    Family-run guesthouses with zero-stair access, Bib Gourmand local kitchens, and
                    direct flights with 23kg hold bags included.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBudget(selectedBudget === 'Medium' ? 'All' : 'Medium')}
                  className={`text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedBudget === 'Medium'
                      ? 'bg-[#F5EFE6] border-[#8A3B24]'
                      : 'bg-[#F5EFE6]/60 border-[#DFD5C6] hover:border-[#7A6E63]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[#5C5147] mb-1">
                    <span className="font-semibold text-[#1F1A17]">
                      Tier 02 · Medium & Boutique Comfort
                    </span>
                    <span className="font-mono-tabular">
                      {budgetComparisonSummary.mediumCount} options
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-[#1F1A17] font-mono-tabular">
                    Avg ${budgetComparisonSummary.mediumAvg.toLocaleString()} all-in
                  </div>
                  <p className="text-xs text-[#5C5147] mt-1">
                    Premium Economy widebody flights, riverfront & cliffside boutique hotels with
                    luggage porters, and sunset window tables.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedBudget(selectedBudget === 'Expensive' ? 'All' : 'Expensive')
                  }
                  className={`text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedBudget === 'Expensive'
                      ? 'bg-[#F5EFE6] border-[#8A3B24]'
                      : 'bg-[#F5EFE6]/60 border-[#DFD5C6] hover:border-[#7A6E63]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[#5C5147] mb-1">
                    <span className="font-semibold text-[#1F1A17]">
                      Tier 03 · Expensive & Flagship Luxury
                    </span>
                    <span className="font-mono-tabular">
                      {budgetComparisonSummary.expensiveCount} options
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-[#1F1A17] font-mono-tabular">
                    Avg ${budgetComparisonSummary.expensiveAvg.toLocaleString()} all-in
                  </div>
                  <p className="text-xs text-[#5C5147] mt-1">
                    180° Lie-Flat suites with VIP immigration fast-track, private pool villas,
                    2-Michelin-star chef tables, and private Riva yachts.
                  </p>
                </button>
              </div>

              {/* Extra Traveler Pain-Point Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-[#5C5147]">
                <div className="flex flex-wrap items-center gap-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={prioritizeCrowdFree}
                      onChange={(e) => setPrioritizeCrowdFree(e.target.checked)}
                      className="rounded border-[#DFD5C6] text-[#8A3B24] focus:ring-[#8A3B24]"
                    />
                    <span className="font-medium text-[#1F1A17]">
                      Boost Dawn & Golden-Hour Crowd Avoidance
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={prioritizeZeroStairs}
                      onChange={(e) => setPrioritizeZeroStairs(e.target.checked)}
                      className="rounded border-[#DFD5C6] text-[#8A3B24] focus:ring-[#8A3B24]"
                    />
                    <span className="font-medium text-[#1F1A17]">
                      Prioritize Step-Free Access & Porter Service
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <span>Travelers in Party:</span>
                  <div className="inline-flex items-center bg-[#EFE7DA] rounded-md p-0.5">
                    {[1, 2, 4, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTravelersCount(num)}
                        className={`px-2.5 py-1 text-xs font-mono-tabular rounded transition-colors cursor-pointer ${
                          travelersCount === num
                            ? 'bg-[#1F1A17] text-[#FAF6F0] font-semibold'
                            : 'text-[#5C5147] hover:text-[#1F1A17]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 5-PILLAR BOOKING CATALOG SECTION ==================== */}
        <section id="catalog-section" className="px-6 lg:px-12 py-12">
          <div className="max-w-[1380px] mx-auto space-y-8">
            {/* Category Segmented Navigation (Functional Filter Buttons) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DFD5C6] pb-5">
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#EFE7DA] rounded-xl">
                {CATEGORY_TABS.map((tab) => {
                  const isActive = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedCategory(tab.id)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-[#FAF6F0] text-[#1F1A17] shadow-xs'
                          : 'text-[#5C5147] hover:text-[#1F1A17]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 text-xs text-[#5C5147]">
                <span>Active Filters:</span>
                <span className="font-semibold text-[#1F1A17]">{selectedRegion}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#8A3B24]">
                  {selectedBudget === 'All' ? 'All Budget Tiers' : `${selectedBudget} Tier`}
                </span>
                {(selectedRegion !== 'All' ||
                  selectedBudget !== 'All' ||
                  selectedCategory !== 'all' ||
                  selectedStyle !== 'All' ||
                  searchQuery !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRegion('All');
                      setSelectedBudget('All');
                      setSelectedCategory('all');
                      setSelectedStyle('All');
                      setSearchQuery('');
                    }}
                    className="ml-2 text-[#8A3B24] font-semibold hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Catalog Grid (3 columns on desktop, consistent structure) */}
            {recommendedItems.length === 0 ? (
              <div className="bg-[#FAF6F0] border border-[#DFD5C6] rounded-xl p-12 text-center space-y-4">
                <p className="font-serif-display text-2xl font-semibold text-[#1F1A17]">
                  No exact matches for that specific filter combination.
                </p>
                <p className="text-sm text-[#5C5147] max-w-md mx-auto">
                  Try broadening your budget tier or switching region to view all 20 vetted flights,
                  hotels, packages, restaurants, and local adventures.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRegion('All');
                    setSelectedBudget('All');
                    setSelectedCategory('all');
                    setSelectedStyle('All');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2.5 text-xs font-semibold bg-[#1F1A17] text-[#FAF6F0] rounded-lg hover:bg-[#332B26] transition-colors cursor-pointer"
                >
                  Show All Recommendations
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {recommendedItems.map((item) => {
                  const inFolio = isItemInFolio(item.id);
                  return (
                    <article
                      key={item.id}
                      className="bg-[#FAF6F0] border border-[#DFD5C6] rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
                    >
                      <div>
                        {/* Card Visual Header */}
                        <div className="relative aspect-[4/3] bg-[#EFE7DA] overflow-hidden border-b border-[#DFD5C6]">
                          <img
                            src={item.image}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-4 text-[#FAF6F0]">
                            {/* Clean unboxed metadata with typographic separators */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#EFE7DA]">
                              <span className="font-semibold text-white">{item.budgetTier} Tier</span>
                              <span aria-hidden="true">·</span>
                              <span>{item.region}</span>
                              <span aria-hidden="true">·</span>
                              <span>{item.destination}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-tabular">{item.matchScore}% Match</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-4">
                          {/* Quiet 1-line category & schedule metadata */}
                          <div className="flex items-center justify-between text-xs text-[#5C5147]">
                            <span className="font-medium capitalize">{item.category}</span>
                            <span className="font-mono-tabular">{item.durationOrSchedule}</span>
                          </div>

                          <div>
                            <h3 className="font-serif-display text-2xl font-semibold text-[#1F1A17] leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-xs text-[#5C5147] mt-1.5 leading-relaxed">
                              {item.subtitle}
                            </p>
                          </div>

                          {/* Traveler Pain Point Solved Callout */}
                          <div className="pt-3 border-t border-[#DFD5C6] space-y-1.5">
                            <div className="text-xs font-semibold text-[#2B4C3F]">
                              Pain Point Solved: {item.painPointSolved}
                            </div>
                            <p className="text-xs text-[#5C5147] leading-relaxed">
                              “{item.agentVerdict}”
                            </p>
                          </div>

                          {/* Category-Specific Operational Specs */}
                          <div className="pt-3 border-t border-[#DFD5C6] text-xs text-[#5C5147] space-y-1">
                            {item.flightDetails && (
                              <>
                                <div>
                                  <strong className="text-[#1F1A17]">Route & Buffer:</strong>{' '}
                                  {item.flightDetails.routeCode} · {item.flightDetails.layoverInfo}
                                </div>
                                <div>
                                  <strong className="text-[#1F1A17]">Included Baggage:</strong>{' '}
                                  {item.flightDetails.baggageIncluded}
                                </div>
                              </>
                            )}
                            {item.hotelDetails && (
                              <>
                                <div>
                                  <strong className="text-[#1F1A17]">Access Reality:</strong>{' '}
                                  {item.hotelDetails.walkabilityNote}
                                </div>
                                <div>
                                  <strong className="text-[#1F1A17]">Acoustic Guarantee:</strong>{' '}
                                  {item.hotelDetails.quietRoomGuarantee}
                                </div>
                              </>
                            )}
                            {item.packageDetails && (
                              <>
                                <div>
                                  <strong className="text-[#1F1A17]">Stays & Pacing:</strong>{' '}
                                  {item.packageDetails.includedStays}
                                </div>
                                <div>
                                  <strong className="text-[#1F1A17]">Transfers:</strong>{' '}
                                  {item.packageDetails.privateTransfers}
                                </div>
                              </>
                            )}
                            {item.restaurantDetails && (
                              <>
                                <div>
                                  <strong className="text-[#1F1A17]">Table Allocation:</strong>{' '}
                                  {item.restaurantDetails.tableGuarantee}
                                </div>
                                <div>
                                  <strong className="text-[#1F1A17]">Dietary Care:</strong>{' '}
                                  {item.restaurantDetails.dietaryAccommodations}
                                </div>
                              </>
                            )}
                            {item.adventureDetails && (
                              <>
                                <div>
                                  <strong className="text-[#1F1A17]">Crowd Timing:</strong>{' '}
                                  {item.adventureDetails.crowdAvoidanceWindow}
                                </div>
                                <div>
                                  <strong className="text-[#1F1A17]">Format & Gear:</strong>{' '}
                                  {item.adventureDetails.groupFormat} ({item.adventureDetails.physicalEffort})
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: True Total Price & Actions */}
                      <div className="px-6 py-4 bg-[#EFE7DA]/70 border-t border-[#DFD5C6] flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-[#5C5147]">
                            True All-In Price (Base ${item.basePrice} + ${item.taxesAndFees} tax/fees)
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-semibold text-[#1F1A17] font-mono-tabular">
                              ${item.trueTotalPrice.toLocaleString()}
                            </span>
                            <span className="text-xs text-[#5C5147]">{item.priceUnit}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setInspectedItem(item)}
                            className="px-3 py-2 text-xs font-medium text-[#1F1A17] bg-[#FAF6F0] border border-[#DFD5C6] rounded-lg hover:border-[#1F1A17] transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Dossier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddToFolio(item)}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                              inFolio
                                ? 'bg-[#2B4C3F] text-[#FAF6F0] hover:bg-[#213B31]'
                                : 'bg-[#8A3B24] text-[#FAF6F0] hover:bg-[#722F1C]'
                            }`}
                          >
                            {inFolio ? 'Added (+1)' : 'Add to Trip'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ==================== 15-YEAR AGENT METHODOLOGY & PAIN POINTS SOLVED ==================== */}
        <section
          id="agent-methodology"
          className="px-6 lg:px-12 py-14 bg-[#EFE7DA] border-t border-[#DFD5C6]"
        >
          <div className="max-w-[1380px] mx-auto space-y-10">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs text-[#5C5147]">
                Field-Tested Hospitality Standards · Europe & Southeast Asia
              </div>
              <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#1F1A17] text-balance">
                How 15 Years of Travel Agency Experience Protects Your Journey
              </h2>
              <p className="text-sm text-[#5C5147]">
                Standard booking engines optimize for click-bait headline prices. We optimize for
                how your trip actually feels at 7:00 AM on a Positano jetty or 8:00 PM along the
                Chao Phraya River.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {TRAVEL_AGENT_PAIN_SOLUTIONS.map((item) => (
                <div
                  key={item.index}
                  className="bg-[#FAF6F0] border border-[#DFD5C6] rounded-xl p-6 space-y-4"
                >
                  <h3 className="font-serif-display text-2xl font-semibold text-[#1F1A17]">
                    {item.index}. {item.pain}
                  </h3>
                  <div className="space-y-2 text-xs leading-relaxed">
                    <p className="text-[#5C5147]">
                      <strong className="text-[#1F1A17]">The Industry Pain:</strong>{' '}
                      {item.standardPractice}
                    </p>
                    <p className="text-[#2B4C3F] font-medium">
                      <strong className="text-[#1F1A17]">Our Concierge Standard:</strong>{' '}
                      {item.ourSolution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ==================== QUIET FOOTER ==================== */}
      <footer className="bg-[#F5EFE6] border-t border-[#DFD5C6] px-6 lg:px-12 py-8 text-xs text-[#5C5147]">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-serif-display text-base font-semibold text-[#1F1A17]">
              Atelier Méridien
            </span>
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            <span>European & Southeast Asian Bespoke Travel Desk (Est. 2011)</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#concierge-profiler" className="hover:text-[#1F1A17] transition-colors">
              Budget Tier Matrix
            </a>
            <a href="#catalog-section" className="hover:text-[#1F1A17] transition-colors">
              All-In Fare Guarantee
            </a>
            <button
              type="button"
              onClick={() => setIsFolioOpen(true)}
              className="text-[#8A3B24] font-semibold hover:underline cursor-pointer"
            >
              Open Active Trip Folio ({folio.length})
            </button>
          </div>
        </div>
      </footer>

      {/* ==================== ITEM DOSSIER MODAL ==================== */}
      {inspectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dossier-title"
        >
          <div className="bg-[#FAF6F0] border border-[#DFD5C6] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C5147] mb-1">
                  <span className="font-semibold text-[#8A3B24]">
                    {inspectedItem.budgetTier} Tier
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{inspectedItem.region}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {inspectedItem.destination}, {inspectedItem.country}
                  </span>
                </div>
                <h2
                  id="dossier-title"
                  className="font-serif-display text-3xl font-semibold text-[#1F1A17]"
                >
                  {inspectedItem.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectedItem(null)}
                className="p-2 text-[#5C5147] hover:text-[#1F1A17] rounded-lg border border-[#DFD5C6] cursor-pointer"
                aria-label="Close dossier"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-[16/9] rounded-lg overflow-hidden border border-[#DFD5C6] bg-[#EFE7DA]">
              <img
                src={inspectedItem.image}
                alt={inspectedItem.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 text-sm text-[#5C5147]">
              <p className="text-[#1F1A17] font-medium">{inspectedItem.subtitle}</p>
              <div className="p-4 bg-[#EFE7DA] rounded-lg border border-[#DFD5C6] space-y-1.5">
                <div className="text-xs font-semibold text-[#2B4C3F]">
                  15-Year Agent Inspection Note — Why We Recommend This:
                </div>
                <p className="text-xs text-[#1F1A17] leading-relaxed">
                  “{inspectedItem.agentVerdict}”
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#1F1A17]">
                  What Is Included in Your True All-In Price (${inspectedItem.trueTotalPrice}):
                </div>
                <ul className="space-y-1.5 text-xs">
                  {inspectedItem.transparencyNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#2B4C3F] shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DFD5C6] flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-[#5C5147]">
                  Base ${inspectedItem.basePrice} + Mandatory Taxes/Baggage $
                  {inspectedItem.taxesAndFees}
                </div>
                <div className="text-2xl font-semibold text-[#1F1A17] font-mono-tabular">
                  ${inspectedItem.trueTotalPrice.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-[#5C5147]">
                    {inspectedItem.priceUnit}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setInspectedItem(null)}
                  className="px-4 py-2.5 text-xs font-medium text-[#5C5147] hover:text-[#1F1A17] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAddToFolio(inspectedItem);
                    setInspectedItem(null);
                    setIsFolioOpen(true);
                  }}
                  className="px-5 py-2.5 text-xs font-semibold bg-[#8A3B24] text-[#FAF6F0] rounded-lg hover:bg-[#722F1C] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Add to Trip Folio & View Itinerary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== UNIFIED TRIP FOLIO & CHECKOUT DRAWER ==================== */}
      {isFolioOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="folio-drawer-title"
        >
          <div className="bg-[#FAF6F0] border-l border-[#DFD5C6] w-full max-w-xl h-full flex flex-col justify-between overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-[#EFE7DA] border-b border-[#DFD5C6] flex items-center justify-between">
              <div>
                <div className="text-xs text-[#5C5147]">
                  Conflict-Checked Itinerary & All-In Checkout
                </div>
                <h2
                  id="folio-drawer-title"
                  className="font-serif-display text-2xl font-semibold text-[#1F1A17]"
                >
                  Your Curated Trip Folio ({folio.length} Reservations)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFolioOpen(false)}
                className="p-2 text-[#5C5147] hover:text-[#1F1A17] rounded-lg border border-[#DFD5C6] bg-[#FAF6F0] cursor-pointer"
                aria-label="Close trip folio"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Multi-Region Pacing Advisory if user combined Europe & SE Asia */}
              {folioTotals.hasMultiRegionWarning && (
                <div className="p-4 rounded-lg bg-[#EFE7DA] border border-[#8A3B24]/40 text-xs text-[#1F1A17] space-y-1">
                  <div className="font-semibold text-[#8A3B24]">
                    Concierge Pacing Advisory: Both Europe & Southeast Asia Selected
                  </div>
                  <p className="text-[#5C5147]">
                    Your folio currently includes reservations in both Europe and Southeast Asia. If
                    planning two separate trips, you can book them together here or filter by region
                    to focus on one continent at a time.
                  </p>
                </div>
              )}

              {folio.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="font-serif-display text-2xl text-[#1F1A17]">
                    Your Trip Folio is currently empty.
                  </p>
                  <p className="text-xs text-[#5C5147] max-w-sm mx-auto">
                    Add flights, vetted hotels, multi-day packages, restaurant tables, or local
                    adventures from the catalog to build a transparent, all-in itinerary.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {folio.map((entry) => (
                    <div
                      key={entry.item.id}
                      className="p-4 bg-[#F5EFE6] border border-[#DFD5C6] rounded-xl space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-[#5C5147]">
                            <span className="capitalize font-semibold text-[#8A3B24]">
                              {entry.item.category}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{entry.item.budgetTier} Tier</span>
                            <span aria-hidden="true">·</span>
                            <span>{entry.item.destination}</span>
                          </div>
                          <h3 className="font-serif-display text-xl font-semibold text-[#1F1A17]">
                            {entry.item.title}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromFolio(entry.item.id)}
                          className="text-xs text-[#7A6E63] hover:text-[#8A3B24] p-1 cursor-pointer"
                          aria-label={`Remove ${entry.item.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-[#2B4C3F] font-medium">
                        ✓ {entry.specialNotes}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#DFD5C6] text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[#5C5147]">
                            {entry.item.category === 'hotels' ? 'Nights:' : 'Travelers / Units:'}
                          </span>
                          <div className="inline-flex items-center border border-[#DFD5C6] bg-[#FAF6F0] rounded-md">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(entry.item.id, -1)}
                              className="px-2 py-0.5 text-[#1F1A17] hover:bg-[#EFE7DA] cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-0.5 font-mono-tabular font-semibold">
                              {entry.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(entry.item.id, 1)}
                              className="px-2 py-0.5 text-[#1F1A17] hover:bg-[#EFE7DA] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="text-right font-mono-tabular">
                          <span className="text-[#5C5147]">
                            ${entry.item.trueTotalPrice} × {entry.quantity} ={' '}
                          </span>
                          <span className="font-semibold text-[#1F1A17] text-sm">
                            ${(entry.item.trueTotalPrice * entry.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Traveler Concierge Brief & Checkout Form */}
              {folio.length > 0 && (
                <form
                  id="concierge-checkout-form"
                  onSubmit={handleConfirmItinerary}
                  className="pt-4 border-t border-[#DFD5C6] space-y-4"
                >
                  <div className="text-xs font-semibold text-[#1F1A17]">
                    Traveler Registration & Dietary / Room Preferences
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#5C5147] mb-1">
                        Lead Traveler Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={travelerName}
                        onChange={(e) => setTravelerName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#F5EFE6] border border-[#DFD5C6] rounded-lg text-[#1F1A17]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#5C5147] mb-1">
                        Itinerary Dossier Email
                      </label>
                      <input
                        type="email"
                        required
                        value={travelerEmail}
                        onChange={(e) => setTravelerEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#F5EFE6] border border-[#DFD5C6] rounded-lg text-[#1F1A17]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#5C5147] mb-1">
                      Preferred Travel Window
                    </label>
                    <input
                      type="text"
                      required
                      value={departureMonth}
                      onChange={(e) => setDepartureMonth(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5EFE6] border border-[#DFD5C6] rounded-lg text-[#1F1A17]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#5C5147] mb-1">
                      Concierge Notes (Allergies, Stair-Free Access, Seat Preference)
                    </label>
                    <textarea
                      rows={2}
                      value={dietaryAndMobilityNotes}
                      onChange={(e) => setDietaryAndMobilityNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5EFE6] border border-[#DFD5C6] rounded-lg text-[#1F1A17]"
                    />
                  </div>

                  {bookingConfirmedId && (
                    <div className="p-4 rounded-xl bg-[#2B4C3F] text-[#FAF6F0] space-y-1.5 text-xs">
                      <div className="font-semibold text-sm">
                        ✓ Reservation Dossier Confirmed · Ref #{bookingConfirmedId}
                      </div>
                      <p className="text-[#EFE7DA]">
                        Prepared for {travelerName} ({travelerEmail}) for {departureMonth}. All
                        flight luggage allowances, quiet-room allocations, and restaurant table
                        numbers have been locked in with zero hidden balance due on arrival.
                      </p>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Drawer Footer: Transparent All-In Price Breakdown */}
            <div className="p-6 bg-[#EFE7DA] border-t border-[#DFD5C6] space-y-4">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#5C5147]">
                  <span>Base Fares, Rooms, Tables & Excursions:</span>
                  <span className="font-mono-tabular">
                    ${folioTotals.baseTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#5C5147]">
                  <span>Pre-Included Baggage, Municipal Taxes & Permits:</span>
                  <span className="font-mono-tabular">
                    ${folioTotals.taxesTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[#1F1A17] pt-2 border-t border-[#DFD5C6]">
                  <span>True All-In Total (Zero Surprise Fees):</span>
                  <span className="font-mono-tabular">
                    ${folioTotals.allInTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                form="concierge-checkout-form"
                disabled={folio.length === 0}
                className="w-full py-3 px-5 text-xs font-semibold bg-[#8A3B24] text-[#FAF6F0] rounded-lg hover:bg-[#722F1C] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {bookingConfirmedId
                  ? `Booking Confirmed (${bookingConfirmedId}) — Click to Re-Issue`
                  : 'Lock In All-In Reservations & Issue Travel Dossier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
