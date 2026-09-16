# Visitors PRD (English)

> Status: Draft v2 — English mirror
> Date: 2026-06-22 (original draft) · 2026-09-16 (moved under `docs/`, cross-linked)
> Product phase: V1 prototype, later evolving into a full product
>
> 中文主文档：[`VISITORS_PRD.md`](VISITORS_PRD.md) · Companion: [`portfolio-case.md`](portfolio-case.md)

> **Note on scope.** This is the original English draft, kept for English-language use.
> The Chinese PRD ([`VISITORS_PRD.md`](VISITORS_PRD.md)) is the primary document and additionally
> reflects what shipped after this draft: dual-entry intake (quick / Xiaohongshu evidence-first),
> pre-submit `POST /plans/evidence-preview`, parking guidance, the itinerary editing bench
> (lock / remove / re-optimize), showcase & share pages, and bilingual + theme switching.
> Items listed below as "Later Versions" should be read against the Chinese PRD's status column.

---

## 1. Product Definition

Visitors is a China-first AI travel planning product that generates a structured, detailed, and executable city trip plan for users who want to be fully prepared but do not want to manually research everything.

The product output is not just a list of recommendations. It is a complete result page containing itinerary, map, reminders, budget, and preparation guidance.

## 2. Core Goal

Help a user pick a city and quickly generate:

- an hour-level itinerary
- a city planning map
- reservation reminders
- a precise budget breakdown
- weather and packing guidance
- a result that can be shared or used directly during the trip

## 3. Product Positioning

### V1

An AI planning tool focused on single-city domestic trips in China.

### V2

A more complete trip product with collaboration, history, editing, and post-trip content creation.

## 4. Target Users

### Primary users

- users planning domestic trips in China
- users with limited time to research
- detail-oriented users who want thorough preparation
- users who care about budget, timing, and route efficiency

### Secondary users

- couples
- friend groups
- travelers interested in photo-friendly routes
- travelers interested in nature, quiet neighborhoods, museums, cafes, and citywalks

## 5. User Problems

- too many scattered travel sources
- difficult to merge budget, route, transport, and booking constraints
- easy to miss reservation requirements
- hard to understand spatial distance from plain text notes
- many AI trip plans are too vague and not executable

## 6. Core Product Value

- turns fragmented content into one structured plan
- provides hour-level execution detail
- adds city map context instead of text-only output
- includes practical preparation details
- gives a budget panel users can actually use

## 7. Functional Scope

### 7.1 Required in V1

- destination input
- trip parameter intake
- Xiaohongshu link parsing
- hour-level itinerary generation
- city planning map
- itinerary cards
- reservation reminders
- reservation channel info
- price info
- budget breakdown panel
- weather and checklist output
- Chinese / English support
- graph view of itinerary data

### 7.2 Later Versions

- co-planning with travel buddies
- editable itinerary
- saved history
- stronger source verification
- post-trip content generation

## 8. Core Feature Definitions

### 8.1 Input Module

Required inputs:

- destination city
- departure city, optional
- travel days
- budget range
- transport preferences
- accommodation style
- travel pace
- interests
- special requirements
- Xiaohongshu link, optional

### 8.2 Itinerary Output

The system must generate day-by-day itinerary blocks with:

- time slot
- attraction or activity
- estimated stay duration
- transit method
- transit duration
- quick rationale

### 8.3 Itinerary Card Requirements

Each itinerary card should support these fields:

- time
- attraction name
- transport mode
- duration
- estimated ticket price
- reservation status
- reservation reminder
- reservation channel
- evidence source, when available
- notes

This matters because users should be able to follow the plan directly without switching across multiple apps and notes.

### 8.4 Reservation Reminder Logic

V1 rule:

- reservation reminders are only created when Xiaohongshu content explicitly mentions reservation requirements
- examples:
  - “需要提前预约”
  - “实名预约”
  - “公众号预约”
  - “免费但是要预约”
  - “提前很久预约”

The product must not hallucinate reservation reminders from general model knowledge alone.

#### Output fields

- attraction name
- reminder text
- reservation channel
- ticket price or free-entry note
- source link
- evidence excerpt
- disclaimer

#### Example

If a Xiaohongshu note says:

“苏州博物馆虽然免费但是要提前很久预约”

Then the product should extract:

- attraction: 苏州博物馆
- reminder: free entry but early reservation is needed
- channel: if note mentions channel, show it; otherwise mark unknown
- price: free
- source evidence: excerpt from the note

### 8.5 Budget Breakdown Panel

The budget panel should aggregate:

- ticket cost
- food
- accommodation
- local transport
- intercity transport
- flexible / optional spending

Requirements:

- show total range
- show category ranges
- mark adjustable vs fixed cost
- stay readable on mobile

### 8.6 City Planning Map

The map must show:

- major POIs
- hotel area
- route order
- transport path
- relative distance understanding

It should be based on actual geographic coordinates, but simplified for readability.

### 8.7 Weather and Preparation Checklist

Checklist should include:

- IDs and documents
- electronics
- clothing
- weather-based items
- makeup / toiletries
- medication

Generated from:

- city
- dates or season
- temperature
- rain probability
- trip type

### 8.8 Chinese and English Support

V1 should support:

- Chinese UI
- English UI
- Chinese result output
- English result output

The product should be architected so prompts, labels, and structured result fields can be localized cleanly.

### 8.9 Multi-Agent Planning

Recommended agent roles:

- intake agent
- city research agent
- routing agent
- budget agent
- checklist agent
- reservation hint agent
- review agent

Why:

- easier to control output quality
- easier to debug
- easier to evolve modules independently

### 8.10 Graph View of Itinerary Data

The system should transform generated itinerary data into a node relationship graph.

Nodes can include:

- city
- day
- attraction
- hotel area
- reservation dependency
- budget category

Why:

- helps users understand structure
- makes the result feel more navigable
- useful later for editing, co-planning, and reasoning workflows

## 9. User Flow

1. User opens the product
2. User fills trip requirements
3. User optionally pastes a Xiaohongshu link
4. System runs multi-agent planning
5. System returns structured result page
6. User reviews itinerary cards, budget panel, map, checklist, and reminders
7. User shares or saves the result

## 10. V1 Success Criteria

- a user can generate one complete city trip result
- result includes itinerary, map, budget, checklist, and reminder modules
- reservation reminders are evidence-based
- budget panel is readable and useful
- Chinese and English outputs both work

## 11. Non-Goals for V1

- direct booking and payment
- full OTA replacement
- official reservation verification pipeline
- multi-city trip engine
- community feed

## 12. Technical Direction

- Frontend: `Next.js`
- Backend: `FastAPI`
- Database / Auth / Storage: `Supabase`
- Map: `高德地图`
- Version control: `Git + GitHub`

## 13. Main Risks

- Xiaohongshu parsing reliability
- reservation info timeliness
- map and route quality
- budget estimate accuracy
- balancing detail with result readability

## 14. Product Rules

- structured output over free-form AI text
- reservation reminders must be evidence-based
- route readability matters more than raw data density
- mobile experience is required
- output must be shareable

## 15. MVP Summary

The MVP is successful if it can generate a single-city domestic China travel plan with:

- hour-level itinerary
- itinerary cards with reservation info and price
- city planning map
- precise budget panel
- checklist
- Chinese / English support
- graph view of itinerary structure

