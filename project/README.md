# CodeForge - Competitive Programming Platform

A modern competitive programming platform built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### Core Pages
- **Landing Page**: Beautiful hero section with features, stats, and testimonials
- **Problem List**: Browse 500+ coding problems with filters by difficulty and tags
- **Problem Detail**: Solve problems with an integrated code editor supporting multiple languages
- **Dashboard**: Track your progress, streak, and rating
- **Contests**: Join live contests and compete on the leaderboard
- **Profile**: View your achievements, heatmap, and statistics

### Key Features
- **Authentication**: Email/password login and signup with Supabase
- **Dark Theme**: Professional dark mode design with electric blue and purple accents
- **Responsive Design**: Fully responsive across mobile, tablet, and desktop
- **AI Hints**: Get intelligent hints to help solve problems
- **Multiple Languages**: Support for JavaScript, Python, C++, and Java
- **Progress Tracking**: Visual progress bars, streaks, and statistics

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Routing**: React Router v6

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account and project

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup**:
   The database schema and seed data have already been applied through migrations:
   - User profiles with ratings and stats
   - Problems with examples and test cases
   - Submissions tracking
   - Contests system
   - 10 sample problems (Easy/Medium/Hard)
   - 5 sample contests

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## Database Schema

### Tables
- `profiles`: User profiles with ratings, streak, and problem stats
- `problems`: Coding problems with difficulty, tags, and test cases
- `submissions`: Code submissions with verdicts and execution metrics
- `contests`: Contest information with timing and status
- `contest_participants`: Leaderboard data for contests
- `user_activity`: Track solved and attempted problems

## Sample Data

The platform comes with:
- 10 coding problems across Easy/Medium/Hard difficulties
- Problems covering Arrays, Strings, DP, Trees, Graphs, etc.
- 5 sample contests (upcoming, ongoing, and ended)

## Features Coming Soon

- Real code execution engine with Docker sandboxing
- Live contest leaderboards
- Discussion forums
- Editorial solutions
- Company-wise problem filters
- Advanced AI code analysis
- Video solutions
- Admin panel for problem management

## License

MIT
