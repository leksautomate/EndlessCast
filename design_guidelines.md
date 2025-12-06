# Design Guidelines: EndlessCast 24/7 Streaming Platform

## Design Approach
**Hacker/Coder Terminal Aesthetic** - A dark, terminal-inspired design with glowing neon accents, matrix-style animations, and a professional cyberpunk feel. This design reflects the technical nature of the streaming platform while maintaining usability.

## Typography
- **Primary Font**: JetBrains Mono for the full terminal aesthetic
- **Hierarchy**:
  - Page title: text-2xl font-bold with glow effect
  - Section headers: text-lg font-semibold
  - Body text: text-sm font-mono
  - Labels: text-xs font-medium
  - Terminal prompts: Use `>` prefix with primary color

## Color System
The application uses a dynamic theme system with multiple color presets:
- **Matrix** (default): Green (#00ff00) - Classic terminal green
- **Cyber**: Cyan (#00ffff) - Cyberpunk blue-green
- **Neon**: Magenta (#ff00ff) - Neon pink-purple
- **Blood**: Red (#ff3333) - Alert/danger red
- **Ocean**: Blue (#0088ff) - Cool ocean blue
- **Amber**: Orange (#ffaa00) - Warm amber/gold
- **Violet**: Purple (#aa00ff) - Deep violet

Each theme defines:
- Primary color for accents, buttons, and highlights
- Accent color for secondary elements
- Background color for surfaces
- Card color for elevated containers

## Layout System
**Spacing Units**: Use Tailwind units of 2, 4, 6, and 8 consistently

**Grid Structure**:
- Main container: max-w-7xl mx-auto px-6
- Two-column layout on desktop (lg:grid-cols-2)
- Single column on mobile

## Visual Effects

### Glow Effects
- `.glow-sm`: Subtle text glow for labels
- `.glow`: Standard glow for headings
- `.glow-lg`: Strong glow for emphasis
- `.box-glow-sm`: Box shadow glow for containers

### Animations
- Matrix rain background on landing page
- Typing animation for hero text
- Pulse animation for live indicators
- Cursor blink for terminal prompts

### Special Utilities
- Scanline effect for retro terminal feel
- Glitch text effect for dramatic moments
- Custom scrollbar with theme colors

## Core Components

### Navigation Header
- Full-width with backdrop blur
- Logo with glow effect
- Terminal-style version text
- Theme selector dropdown
- Settings and logout buttons

### Video Library Section
- Card-based grid with terminal styling
- Each video card shows: filename, duration, size
- Select and delete actions
- Upload zone with dashed border
- Storage meter with progress bar

### RTMP Configuration Panel
- Vertical list of endpoints
- Platform icons and labels
- URL input fields (monospace)
- Connection status indicators
- Enable/disable toggles

### Streaming Control Center
- Large start/stop button with glow
- Selected video preview
- Real-time status grid
- Stream duration counter
- Live pulsing indicator

### Status Monitoring Dashboard
- Grid of status cards
- Platform name and status badges
- Color-coded indicators:
  - Green: Live/Active
  - Yellow: Connecting
  - Red: Error
  - Gray: Idle

## Component Styling
- **Buttons**: Use primary color with glow on hover
- **Cards**: Dark backgrounds with primary border accents
- **Input Fields**: Dark background with primary focus border
- **Status Badges**: Pill-shaped with themed colors
- **Icons**: Use Lucide React icons

## Interactions
- Hover states: Subtle border glow intensification
- Active elements: Pulsing glow animations
- Focus states: Primary color ring
- Transitions: Smooth 200ms defaults

## Pages

### Landing Page
- Full-screen matrix rain background
- Centered content with typing animation
- Feature cards with icons
- Terminal-style code preview
- CTA buttons to login

### Login Page
- Terminal-style interface
- Auth progress output display
- Password visibility toggle
- Default credentials hint

### Dashboard
- Terminal prompt in header
- Theme selector in navigation
- All streaming controls
- Live status indicators

### Settings Page
- Three-tab layout: Theme, Telegram, Email
- Theme selector with live preview
- Telegram bot configuration
- Email notification settings

## Responsive Behavior
- Desktop: Two-column layout
- Tablet: Stacked sections
- Mobile: Single column, larger touch targets
