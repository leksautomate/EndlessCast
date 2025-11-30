# Design Guidelines: 24/7 Loop Streaming Platform

## Design Approach
**System-Based Approach** inspired by Linear and Notion's clean, utility-focused interfaces. This streaming management tool prioritizes clarity, efficiency, and real-time status visibility over decorative elements.

## Typography
- **Primary Font**: Inter (Google Fonts) for interface text
- **Monospace Font**: JetBrains Mono for RTMP URLs and technical data
- **Hierarchy**:
  - Page title: text-2xl font-semibold
  - Section headers: text-lg font-medium
  - Body text: text-sm
  - Labels: text-xs font-medium uppercase tracking-wide
  - Technical data: text-sm font-mono

## Layout System
**Spacing Units**: Use Tailwind units of 2, 4, 6, and 8 consistently (p-4, gap-6, mb-8, etc.)

**Grid Structure**:
- Main container: max-w-7xl mx-auto px-6
- Two-column layout on desktop (lg:grid-cols-2) for video library and configuration
- Single column on mobile, stacked vertically

## Core Components

### Navigation Header
- Full-width header with logo/title left, storage indicator right
- Height: h-16
- Padding: px-6
- Border bottom: border-b

### Video Library Section
**Card-based grid** (grid-cols-1 md:grid-cols-2 gap-4):
- Each video card shows thumbnail placeholder, filename, duration, size
- "Select to Stream" button (primary) and "Delete" button (ghost/danger)
- Active streaming video highlighted with badge
- Upload zone: dashed border, center-aligned with upload icon and text
- Storage meter: progress bar showing X GB / 5 GB with percentage

### RTMP Configuration Panel
**Vertical list of platform connectors**:
- Platform cards with logo area, label, and URL input field
- Pre-labeled cards: YouTube Live, Facebook Live, Rumble, Odysee, Twitter/X
- "Add Custom RTMP" button to add additional endpoints
- Each card has connection status indicator (dot: idle/streaming/error)
- Input fields use font-mono for URLs

### Streaming Control Center
**Prominent central control panel**:
- Large "Start Streaming" / "Stop Streaming" toggle button
- Selected video preview (thumbnail + name)
- Real-time status grid showing all configured platforms
- Status uses colored indicators: green (live), yellow (connecting), red (error), gray (idle)
- Stream duration counter when active

### Status Monitoring Dashboard
**Grid layout** (grid-cols-2 lg:grid-cols-3 gap-4):
- Card per platform showing: platform name, status badge, connection health, bitrate/quality metrics
- Live pulsing indicator for active streams
- Error messages displayed inline when streams fail

## Visual Hierarchy
1. **Primary Actions**: Streaming controls (largest, most prominent)
2. **Content Management**: Video library (secondary prominence)
3. **Configuration**: RTMP endpoints (tertiary, collapsible if needed)
4. **Monitoring**: Status cards (ambient, always visible)

## Component Styling
- **Buttons**: Rounded (rounded-lg), solid backgrounds for primary, outlined for secondary
- **Cards**: Rounded corners (rounded-xl), subtle borders, padding p-6
- **Input Fields**: Height h-10, rounded-lg borders, font-mono for technical inputs
- **Status Badges**: Pill-shaped (rounded-full), px-3 py-1, with status dot
- **Icons**: Use Heroicons (CDN) - upload, play, stop, trash, check-circle, x-circle, signal

## Interactions
- Hover states on cards: subtle lift effect (transition-transform)
- Active video card: border highlight
- Streaming button: pulse animation when active
- Status indicators: gentle fade transitions
- No elaborate animations - focus on clarity

## Layout Flow
1. **Header**: Logo/title, storage indicator
2. **Hero Section**: Streaming control center with selected video preview
3. **Two-Column Grid**:
   - Left: Video library (upload + 4 video slots)
   - Right: RTMP configuration panel
4. **Bottom Section**: Full-width status monitoring dashboard

## Responsive Behavior
- Desktop: Two-column layout with sidebar-like configuration panel
- Tablet: Stacked sections, cards in 2-column grid
- Mobile: Single column, larger touch targets (min-h-12 for buttons)

## Icons
Use **Heroicons** via CDN for all interface icons

## Images
No hero images needed - this is a functional dashboard tool focused on utility.