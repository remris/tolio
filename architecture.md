# Architecture

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Deployment | Vercel |
| Styling | Tailwind CSS |
| Payments | Stripe |

---

## Folder Structure

```
app/
├── (admin)/                  # Admin Web App (authenticated)
│   ├── layout.tsx
│   ├── dashboard/
│   ├── assets/
│   │   ├── tools/
│   │   ├── machines/
│   │   └── vehicles/
│   ├── roles/
│   ├── users/
│   ├── maintenance/
│   └── billing/
├── (pwa)/                    # Mitarbeiter PWA
│   ├── layout.tsx
│   ├── scan/
│   ├── checkin/
│   └── checkout/
├── (auth)/                   # Auth Pages
│   ├── login/
│   └── company-login/
├── api/
│   ├── assets/
│   ├── auth/
│   ├── roles/
│   ├── users/
│   └── webhooks/
│       └── stripe/
└── layout.tsx

lib/
├── supabase/
│   ├── client.ts             # Browser client
│   ├── server.ts             # Server client
│   └── middleware.ts
├── auth/
│   └── permissions.ts        # Permission helpers
├── stripe/
│   └── client.ts
└── utils.ts

components/
├── admin/
├── pwa/
└── shared/

middleware.ts                 # Route protection + role check
```

---

## Supabase Integration

### Auth

- **Admin**: Email + Password via `supabase.auth.signInWithPassword()`
- **Mitarbeiter**: Firmencode + Benutzername + Passwort → custom auth flow via `users` table + bcrypt

### Row Level Security (RLS)

- Alle Tabellen haben RLS aktiviert
- Policies basieren auf `company_id` aus dem JWT-Claim (`app_metadata.company_id`)
- Service-Role-Key nur in API Routes (Server-Side)

### Realtime

- `asset_logs` – Live-Updates für Check-in/out im Admin-Dashboard

---

## Areas

### `/admin` – Admin Web App

- Server Components by default
- Auth Guard via `middleware.ts`
- Permission-Check via `permissions.ts` helper
- Stripe Billing Integration

### `/pwa` – Mitarbeiter PWA

- Mobile-first, minimal UI
- QR-Code Scanner (z. B. `html5-qrcode`)
- PWA Manifest + Service Worker für Offline-Fähigkeit
- Login per Firmencode + Benutzername

---

## API Routes

| Route | Method | Beschreibung |
|---|---|---|
| `/api/assets` | GET, POST | Assets abrufen / erstellen |
| `/api/assets/[id]` | GET, PATCH, DELETE | Asset bearbeiten |
| `/api/assets/[id]/checkin` | POST | Asset einchecken (inkl. KM, Tankstatus) |
| `/api/assets/[id]/checkout` | POST | Asset auschecken (inkl. KM) |
| `/api/assets/[id]/maintenance` | GET, POST | Wartungshistorie |
| `/api/export` | GET | CSV Export (assets / logs / maintenance) |
| `/api/reminders` | GET | Cron: Wartungs- & TÜV-Erinnerungen per E-Mail |
| `/api/roles` | GET, POST | Rollen verwalten |
| `/api/users` | GET, POST | Benutzer verwalten |
| `/api/users/[id]` | GET, PATCH, DELETE | Benutzer bearbeiten |
| `/api/auth/register` | POST | Admin-Registrierung + Firma anlegen |
| `/api/auth/company-login` | POST | Mitarbeiter Login |
| `/api/webhooks/stripe` | POST | Stripe Events |

---

## Roles Middleware

```ts
// middleware.ts
export async function middleware(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.redirect('/login')

  const pathname = req.nextUrl.pathname

  // Admin-only routes
  if (pathname.startsWith('/admin/roles') && !hasPermission(session, 'users.create')) {
    return NextResponse.redirect('/admin/dashboard')
  }

  return NextResponse.next()
}
```

Permission helper prüft `role_permissions` via Supabase RPC.

---

## Deployment (Vercel)

- `main` Branch → Production
- `dev` Branch → Preview Environment
- Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `RESEND_API_KEY` (E-Mail Benachrichtigungen)
  - `EMAIL_FROM` (Absender-Adresse, z. B. `Tolio <noreply@tolio.app>`)
  - `CRON_SECRET` (Schutz des `/api/reminders` Endpunkts)
- Vercel Cron: `/api/reminders` täglich 07:00 UTC (`vercel.json`)
- Edge Middleware für Auth-Checks

