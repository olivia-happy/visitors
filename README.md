# Visitors

AI travel planner for China-first city trips.

Visitors helps users who do not have time to research a trip generate a detailed, executable travel plan with:

- hour-level itinerary
- interactive city planning map
- reservation reminders
- precise budget breakdown
- packing and weather checklist
- Xiaohongshu link parsing
- bilingual output in Chinese and English
- multi-agent planning workflow
- graph view of itinerary relationships

---

## What It Solves

Travel information is scattered across Xiaohongshu, maps, weather apps, ticketing pages, hotel platforms, and random note-taking tools. For users who want to be well-prepared but do not want to spend hours building an itinerary by hand, this creates three problems:

- too much fragmented information
- no clear hour-by-hour executable plan
- easy to miss ticketing, reservation, weather, and packing details

Visitors turns those scattered inputs into one structured travel result page.

## Target Users

- users planning a domestic China city trip
- people who want to be fully prepared before traveling
- users who care about budget, transport, and timing
- users who want photo-friendly spots, vlog-friendly routes, or quiet/nature-focused plans
- couples, friends, and future co-planning travel buddies

## Core Features

### 1. Structured Trip Intake

Users can input:

- destination city
- travel days
- budget range
- transport preference
- accommodation style
- travel pace
- interests
- special requirements
- Xiaohongshu link

### 2. Hour-Level Itinerary

The system generates a detailed day-by-day plan with:

- start and end time for each stop
- transit method and estimated duration
- attraction notes
- meal suggestions
- alternative plan hints

### 3. City Planning Map

The result includes a scaled city travel map based on real location data:

- itinerary route by day
- hotel area suggestion
- major attraction points
- transport links
- relative distance awareness

### 4. Reservation Reminder on Itinerary Cards

Each itinerary card can show reservation-related metadata when available:

- reservation required or not
- reservation reminder text
- reservation channel
- ticket price or free entry note
- source evidence

V1 rule:

- reservation reminders are extracted only from Xiaohongshu content when the note explicitly mentions advance reservation
- examples include cases like Suzhou Museum being free but still requiring early reservation
- final UI must remind users to verify official channels

### 5. Precise Budget Breakdown Panel

Visitors includes a multi-dimensional budget panel with:

- attraction tickets
- food
- accommodation
- intercity transport
- local transport
- optional shopping / flexible budget

### 6. Packing and Preparation Checklist

The checklist is generated from city, season, weather, and trip style, including:

- ID card / student card / required documents
- umbrella / sunscreen / light jacket
- power bank / chargers / camera gear
- makeup / toiletries / medication

### 7. Chinese and English Output

The product is designed to support:

- Chinese UI and output
- English UI and output
- bilingual itinerary content in future expanded versions

### 8. Multi-Agent Planning

The planning pipeline is designed around specialized agents, such as:

- intake agent
- city research agent
- routing agent
- budget agent
- checklist agent
- reservation hint agent
- review agent

### 9. Itinerary Graph View

Generated itinerary data can be converted into a node relationship graph to visualize:

- city
- day blocks
- attractions
- hotel area
- budget categories
- reservation dependencies

This helps users understand trip structure, not just a long block of text.

---

## Product Principles

- China-first, not global-first
- execution quality over generic inspiration
- structured output over raw AI text
- practical details over vague recommendations
- solo-friendly architecture and fast iteration

## Tech Stack

- Frontend: `Next.js`
- Backend: `FastAPI`
- Database / Auth / Storage: `Supabase`
- Map: `AMap / 高德地图`
- Version control: `Git + GitHub`

## Planned Architecture

```mermaid
flowchart LR
    U[User] --> W[Next.js Web]
    W --> API[FastAPI Planner API]
    W --> MAP[AMap JS API]
    W --> SB[Supabase]

    API --> XHS[Xiaohongshu Parser]
    API --> LLM[LLM Provider]
    API --> GEO[AMap Web Service]
    API --> WX[Weather Service]
    API --> SB
```

## Planned Result Page

The V1 result page is expected to include:

- trip summary
- city planning map
- day-by-day hour-level timeline
- itinerary cards
- reservation reminder area
- hotel area recommendation
- budget breakdown panel
- weather and outfit hints
- packing checklist
- graph view of trip relationships

## Repository Direction

This project is intended to become open source.

Planned repository structure:

```text
visitors/
  web/
  api/
  supabase/
  docs/
  README.md
  PRD.md
```

## Roadmap

### V1

- single-city domestic travel planning
- hour-level itinerary
- city planning map
- reservation reminders from Xiaohongshu evidence
- budget breakdown
- packing checklist
- Chinese / English support

### V1.5

- editable itinerary
- shared planning with travel buddies
- saved plans
- better export and share flows

### V2

- multi-city planning
- stronger collaboration
- post-trip content generation
- photo-to-caption workflow for social sharing

## Open Source Status

Current status:

- product definition in progress
- architecture being prepared
- initial implementation not started yet

Open source goals:

- readable product structure
- modular AI planning pipeline
- practical China travel planning workflow

## Notes

- Reservation reminders in V1 are evidence-based, not official truth.
- Users should always verify official reservation channels, prices, and policies.
- China map and itinerary quality are more important than generic global travel support.

