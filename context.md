# Tolio – Projektziel & Kontext

## 🎯 Projektziel

Tolio ist eine mobile-first SaaS-Anwendung zur zentralen Verwaltung von Betriebs-Assets wie Werkzeuge, Maschinen und Fahrzeuge. Ziel ist es, Handwerksbetrieben und kleinen Unternehmen eine einfache, schnelle und zuverlässige Möglichkeit zu geben, ihren Gerätebestand zu überblicken, Nutzung zu dokumentieren und Wartungen zu tracken.

---

## 🔥 Problem

Viele kleine und mittlere Betriebe kämpfen täglich mit denselben Problemen:

- **Unklare Asset-Nutzung**: Wer hat welches Werkzeug? Wo ist der Transporter gerade?
- **Fehlende Wartungsdokumentation**: TÜV-Termine, Inspektionen und Reparaturen werden auf Zetteln oder gar nicht erfasst.
- **Keine Verantwortlichkeiten**: Niemand ist offiziell für ein Asset zuständig – niemand fühlt sich verantwortlich.
- **Verlust & Diebstahl**: Ohne Tracking gehen teure Geräte verloren oder werden nie zurückgebracht.
- **Hoher Verwaltungsaufwand**: Manuelle Listen in Excel oder auf Papier sind fehleranfällig und zeitaufwendig.

---

## 💡 Lösung

Tolio löst diese Probleme mit einem klaren, digitalen Workflow:

1. **QR-Code pro Asset** – Jedes Werkzeug, jede Maschine, jedes Fahrzeug bekommt einen eindeutigen QR-Code.
2. **Check-in / Check-out via PWA** – Mitarbeiter scannen einfach den QR-Code mit dem Smartphone, ohne App-Installation.
3. **Rollen & Rechte** – Admins steuern, wer was darf (anlegen, bearbeiten, scannen).
4. **Wartungsmanagement** – TÜV-Termine, Kilometerstände und Wartungsintervalle werden automatisch erfasst und erinnert.
5. **Multi-Tenant** – Jeder Betrieb hat seinen eigenen, isolierten Workspace mit eigenem Firmencode.

---

## 👥 Zielgruppe

| Segment | Beschreibung |
|---|---|
| **Handwerksbetriebe** | Elektriker, Schreiner, Sanitär, Maler – 5–50 Mitarbeiter |
| **Baufirmen** | Bautrupps mit vielen Maschinen und Fahrzeugen |
| **Servicedienstleister** | Reinigungsfirmen, Facility Management |
| **Kleine Logistiker** | Lieferdienste mit eigenem Fuhrpark |

**Primär-Persona**: Betriebsleiter / Meister (Admin) + Monteure / Fahrer (Mitarbeiter-PWA)

---

## 💼 Business Model

| Modell | Beschreibung |
|---|---|
| **Freemium / Trial** | Kostenlos bis zu X Assets oder Y Nutzer |
| **Pro Subscription** | Monatliche Gebühr pro Firma (z. B. 29 €/Monat) |
| **Team Plan** | Staffelung nach Nutzerzahl |
| **Add-ons** | Wartungs-Reminder, GPS-Tracking, Foto-Upload |

Abrechnung läuft über **Stripe** – Subscription-Status wird in der Datenbank gespeichert und kontrolliert den Feature-Zugriff.

---

## 🏗️ Tech Stack

| Layer | Technologie |
|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS |
| Backend | Next.js API Routes (Route Handlers) |
| Datenbank | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email/PW + Custom Employee Auth) |
| Deployment | Vercel |
| Payments | Stripe Subscriptions |
| PWA | next-pwa, Web App Manifest |

