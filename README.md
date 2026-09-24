# Kilifi County Portal - Vite React Application

A modern React application built with Vite that provides a comprehensive portal for Kilifi County government services, including public content, staff management, leave applications, and administrative features.

## Project Structure

```
src/
├── api.js                           # Centralized API client (all 100+ endpoints)
├── main.jsx                         # React entry point
├── App.jsx                          # Main app component and routing
├── styles.css                       # Global styles
├── components/
│   ├── Navigation.jsx              # Main navigation bar
│   ├── AuthModal.jsx               # Authentication modal (login/register)
│   ├── CardGrid.jsx                # Reusable card grid component
│   ├── Dashboard.jsx               # Staff/admin dashboard shell
│   └── dashboard/
│       ├── StaffDashboard.jsx      # Staff profile overview
│       ├── LeaveManagement.jsx     # Leave balance & applications
│       ├── StaffDirectory.jsx      # Staff list
│       └── AdminChat.jsx           # Team messaging
└── sections/
    ├── Hero.jsx                    # Landing hero section
    ├── NewsSection.jsx             # News listings
    ├── EventsSection.jsx           # Events listings
    ├── JobsSection.jsx             # Job opportunities
    ├── TendersSection.jsx          # Tenders
    ├── DepartmentsSection.jsx      # Departments
    ├── ServicesSection.jsx         # County services
    ├── ProjectsSection.jsx         # Development projects
    ├── LeadershipSection.jsx       # Leadership profiles
    ├── AnnouncementsSection.jsx    # Announcements
    └── AboutSection.jsx            # County info & blog
```

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# or with pnpm
pnpm install
```

### Development

```bash
npm run dev
```

The app will start at `http://localhost:5173`. The Vite server includes a proxy for API calls to `/api/v1`.

### Build

```bash
npm run build
```

Generates optimized production build in the `dist/` directory.

### Preview

```bash
npm run preview
```

Preview the production build locally.

## API Integration

### Configuration

Update the `BASE_URL` in `src/api.js` to point to your Laravel backend:

```javascript
const BASE_URL = "/api/v1";  // Adjust if needed
```

For development, the Vite config includes a proxy that routes `/api/v1/*` requests to your backend.

### Authentication

The app uses token-based authentication. Tokens are stored in `localStorage`:

```javascript
import { setAuthToken, getAuthToken } from './api';

// After successful login
setAuthToken(response.data.token);

// On app load
const token = getAuthToken();
```

### API Endpoints

All endpoints are organized in `src/api.js`:

```javascript
// Public content
await content.news.list({ page: 1, per_page: 12 });
await content.events.list();
await content.jobs.list();

// Authentication
await auth.login({ email, password });
await auth.register({ name, email, password });

// Staff features
await staff.leave.balances();
await staff.leave.applications();
await staff.leave.apply({ leave_type_id, start_date, end_date });

// Admin
await admin.dashboard.overview();
await admin.chat.threads.list();
```

See `API_CONSUMPTION.md` for complete endpoint documentation.

## Features

### Public Features

- **News & Events** - Browse latest news articles and upcoming events
- **Job Listings** - View job opportunities and apply
- **Tenders** - Access government tenders
- **Departments** - Explore county departments
- **Services** - Discover available government services
- **Projects** - View ongoing development projects
- **Leadership** - Meet county leadership
- **Announcements** - Stay updated with announcements
- **Blog** - Read county blog posts

### Staff/Admin Features

- **Authentication** - Secure login for candidates and staff
- **Profile Management** - View and manage staff profile
- **Leave Management** - Apply for leave, view balances
- **Staff Directory** - Browse all staff members
- **Team Chat** - Communicate with team members
- **Dashboard** - Overview statistics and key metrics
- **Admin Functions** - (Ready for expansion) CMS management, invitations, audit logs

## Styling

The application uses custom CSS with CSS variables for theming:

```css
:root {
  --ocean: #0a3d62;
  --deep: #0c2340;
  --sky: #1e6fa3;
  --coral: #c0392b;
  --gold: #d4a017;
  --green: #1a7a4a;
  /* ... more colors ... */
}
```

All styles are in `src/styles.css` and are fully customizable.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript support required

## Environment Variables

Optional configuration:

```env
VITE_API_BASE=http://localhost:8000
```

## Performance

The app is optimized with:

- Code splitting via Vite
- Lazy loading for components
- Efficient state management with React hooks
- Minimal dependencies for fast load times

## Extending the Application

### Adding a New Section

1. Create component in `src/components/sections/YourSection.jsx`:

```javascript
import { useState, useEffect } from 'react';
import { content } from '../../api';

export default function YourSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const res = await content.yourEndpoint.list();
      setItems(res.data?.data || []);
    };
    fetch();
  }, []);

  return (
    <div className="page">
      {/* Your component JSX */}
    </div>
  );
}
```

2. Add to `App.jsx`:

```javascript
{activeSection === 'your-section' && <YourSection />}
```

3. Add navigation tab to `Navigation.jsx`

### Adding a New Admin Feature

1. Create component in `src/components/dashboard/YourFeature.jsx`
2. Add to dashboard view switcher in `Dashboard.jsx`
3. Use admin API endpoints as needed

## Troubleshooting

### API Calls Fail

1. Check backend is running at correct URL
2. Verify proxy configuration in `vite.config.js`
3. Check CORS headers from backend
4. Look at browser network tab for details

### Authentication Not Working

1. Verify token is being stored: Check `localStorage` in dev tools
2. Check auth endpoints are returning `data.token`
3. Ensure API base URL matches your backend

### Components Not Rendering

1. Check browser console for errors
2. Verify API responses match expected format
3. Check component prop types

## License

© 2024 Kilifi County Government

## Support

For issues or questions, refer to the inline code documentation or check browser console for API error messages.
