# NXCTF - Next CTF
> 🚩 **Modern Capture The Flag (CTF) Platform** — Built for security competitions, workshops, and training. Features real-time scoring, team management, and admin controls. Deploy to Vercel + Supabase in minutes.

## 🎯 What is NXCTF?
NXCTF is a **full-featured CTF (Capture The Flag) competition platform** designed to host security challenges. Whether you're running a college competition, corporate training event, or online CTF, NXCTF provides everything you need:

- 🏆 **Live Scoreboard** — Real-time leaderboards (individual & team-based)
- 🎮 **Challenge System** — 11+ challenge categories (Web, Crypto, Reverse, Pwn, etc.)
- 👥 **Team Support** — Create teams, manage members, team scoring
- 📊 **Multi-Event** — Host multiple CTF events simultaneously
- ⚡ **Real-time Notifications** — Instant solve alerts across all users
- 🛠️ **Admin Dashboard** — Full control over challenges, events, and users
- 🔐 **Secure** — User authentication, Google OAuth, CAPTCHA support
- 🌙 **Dark Mode** — Beautiful responsive UI with theme support
- 🚀 **Service Integration** — Connect to NXCTL for dynamic challenge infrastructure

## ⚡ Quick Start
### Prerequisites
- Node.js 18+ and npm 9+
- Supabase account (free tier works)
- (Optional) Vercel account for deployment

## 🚀 Development Setup
### 1. Clone & Install
Clone the repo and install dependencies:
```bash
git clone https://github.com/nxctf/nxctf
cd nxctf
```

Install dependencies and generate the initial SQL file:
```bash
npm install                                  # Install dependencies
npm run setup                                # Generate db/init.sql from schema
# This creates db/init.sql with all tables, functions, and RLS policies
```

### 2. Supabase Setup
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor**
3. Open `db/init.sql` from this repo and run it

Schema is now initialized with all tables, functions, and RLS policies.

### 3. Run Dev (For Automatic Env Setup)
Let's run the dev server and automatically create a `.env.local` file with the required variables. Just run the command below and follow the prompts:
```bash
npm run dev
```

After that, your `.env.local` file should look like this:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key
# NXCTL_API_URL=http://localhost:8000
# NXCTL_API_TOKEN=your_api_token
# NEXT_PUBLIC_MAINTENANCE_MODE=no
```

The only required variables are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL`.

You can find `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in your Supabase dashboard → Connect. Copy the URL and the publishable key (anon key), then paste them into your `.env.local` file.

The optional variables are `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for Cloudflare Turnstile CAPTCHA, `NXCTL_API_URL` and `NXCTL_API_TOKEN` for NXCTL service integration, and `NEXT_PUBLIC_MAINTENANCE_MODE` for maintenance mode.

### 4. Setting your platform
After running the development server, you can open `http://localhost:3000` and see the Icon Setting in the navbar. Click it to open the config dialog, then set your platform name, description, flag format, challenge categories, team settings, event settings, and more.

### 5. Setting the Supabase authentication settings
Go to Dashboard → Authentication → Sign in / Providers
- Enable "Allow manual linking" (Opsional)
- Disable "Confirm Email" (Opsional)

Go to your Supabase dashboard → Authentication → Settings → Site URL and add `http://localhost:3000` (or your Vercel domain if you deployed) and save.

### 6. Create an Admin Account
To create an admin account, register a new account on the platform, then go to Supabase Dashboard → **users** table, find your user, and set `admin = true`. After that, refresh the page and you will see the Admin menu in the navbar.

## 🚀 Production Setup
### Deploy to Vercel
1. Push to GitHub
2. Import repo in [Vercel Dashboard](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your Vercel domain)
4. Deploy!

### Deploy to Vercel with CI/CD GitHub
1. Push to GitHub
2. Create a new Project in Vercel and get the `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and `VERCEL_TOKEN` from the Vercel dashboard
3. Add the following secrets in your GitHub repository:
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `VERCEL_TOKEN`
4. Go to your GitHub repository → Actions, choose the "Vercel Production Deployment", and click on "Run workflow". This will trigger the deployment to Vercel.

## 📱 Main Features
### For Users
- **Browse Challenges** — Filter by category, difficulty, points
- **Submit Flags** — Real-time validation
- **Track Progress** — See solved challenges and score
- **Team Collaboration** — Join/create teams, team scoreboard
- **View Leaderboard** — Compete individually or as a team
- **Profile** — View your stats, solves, and achievements

### For Admins
- **Challenge Management** — Create, edit, delete challenges
- **Dynamic Scoring** — Adjust points based on solver count
- **Event Management** — Host multiple CTF events
- **Service Integration** — Connect NXCTL for ephemeral challenge services
- **User Management** — Manage admins and users
- **Analytics** — View solves, audit logs, first bloods
- **Notifications** — Send broadcast messages to all users

### For Developers
- **Dev Config Dialog** — In development mode, edit all settings from UI (no file editing needed)
- **Real-time Updates** — Supabase subscriptions for live data
- **Extensible** — Easy to add custom features
- **Mobile Responsive** — Works on all devices

## ⚙️ Customization
Edit `src/config.ts` to customize your platform:
```typescript
export const APP = {
  shortName: "NXCTF",                    // Platform name
  fullName: "Next CTF",                  // Full name
  description: "...",                    // Description
  flagFormat: "NXCTF{...}",             // Expected flag format
  challengeCategories: [...],            // Available challenge types

  // Team settings
  teams: {
    enabled: true,                       // Enable team mode
    hideScoreboardIndividual: false,     // Hide personal scores
    hideScoreboardTotal: false,          // Hide team scores
  },

  // Event configuration
  hideEventMain: false,                  // Hide "Main" event
  eventMainLabel: "main",                // Label for main event
  eventMainImageUrl: "...",              // Banner image URL
}
```

## 🔗 Optional Features
### NXCTL Service Integration
If you have [NXCTL](https://github.com/nxctf/nxctl) running, add to `.env.local`:

```env
NXCTL_API_URL=http://localhost:8000
NXCTL_API_TOKEN=your_secret_token
```

Services will auto-appear in challenge panels for users to start/restart/extend instances.

### Cloudflare Turnstile (CAPTCHA)
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
```

Leave empty to skip CAPTCHA on login/register.

### Google OAuth
1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)
2. Add to Supabase → **Authentication → Providers → Google**
3. Set Site URL to `https://your-domain`

## 📁 Project Structure
```
src/
├── app/                    # Next.js pages & API routes
│   ├── admin/             # Admin dashboard pages
│   ├── challenges/        # Challenge listing & detail
│   ├── scoreboard/        # Leaderboards
│   ├── teams/             # Team management
│   ├── profile/           # User profiles
│   ├── api/nxctl/         # NXCTL API integration
│   └── ...other pages
├── shared/
│   ├── components/        # Reusable React components
│   ├── contexts/          # React contexts (Auth, Events, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Business logic & utilities
│   ├── types/             # TypeScript interfaces
│   └── ui/                # Shadcn UI components
├── config.ts              # App configuration
├── secret.ts              # Server-only secrets
└── middleware.ts          # Maintenance mode detection

db/
├── init.sql               # Generated from schema + queries
├── schema/                # PostgreSQL table definitions
├── queries/               # Stored procedures & RPC functions
└── seed/                  # Initial data
```

## 🛠️ Available Scripts
```bash
npm run setup    # Generate db/init.sql from schema
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## ✨ Key Technologies
| Tech | Purpose |
|------|---------|
| **Next.js 14** | React framework with API routes |
| **Supabase** | PostgreSQL + Auth + Real-time |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Smooth animations |
| **Chart.js** | Score analytics & graphs |
| **dnd-kit** | Drag-and-drop sorting |
| **Markdown** | Challenge descriptions |
| **Lucide Icons** | Beautiful icons |

## 📊 How It Works

## 🤝 Support & Contributing
- 📖 [NXCTL Documentation](https://docs.nxctf.my.id)
- 🐛 Report issues on GitHub or your repository issue tracker
- 💬 Questions? Open a discussion

## 📝 License

Apache License 2.0 - Feel free to use and modify for your competitions!

Built with ❤️ by the CTF community. Good luck with your challenges! 🚩
