# Tolio – Feature Roadmap

## ✅ MVP (v1.0)

### 🔐 Authentication & Onboarding
- [x] Admin-Registrierung (Email + Passwort via Supabase Auth)
- [x] Admin-Login
- [x] Firmencode-basierter Mitarbeiter-Login (Firmencode + Username + Passwort)
- [x] Session-Management (Admin vs. Mitarbeiter-Session)
- [x] Onboarding-Flow: Firma anlegen + erster Admin

### 🏢 Firmenverwaltung
- [x] Multi-Tenant-Isolation (RLS)
- [x] Firmencode generieren & anzeigen

### 👥 Rollen & Rechte
- [x] Rollen anlegen / bearbeiten / löschen
- [x] Permissions einzeln zuweisen (assets.create, scan.use, …)
- [x] Berechtigungsprüfung in API Routes & Middleware

### 👤 Nutzerverwaltung (Admin)
- [x] Mitarbeiter anlegen (Username + Passwort)
- [x] Mitarbeiter deaktivieren / löschen
- [x] Rolle zuweisen

### 🗃️ Asset-Verwaltung (Admin Web App)
- [x] Asset CRUD: Werkzeuge (tools)
- [x] Asset CRUD: Maschinen (machines)
- [x] Asset CRUD: Fahrzeuge (vehicles)
- [x] Asset-Status verwalten (available / in_use / broken / maintenance)
- [x] Asset-Übersicht mit Filterung nach Typ & Status
- [x] Asset-Übersicht mit 3 einklappbaren Kategorien (Werkzeuge / Maschinen / Fahrzeuge)
- [x] Jede Kategorie hat eigene Tabelle mit typspezifischen Spalten (Werkzeug: Seriennr./Zustand; Maschine: Hersteller/Wartung; Fahrzeug: Kennzeichen/KM/TÜV)

### 📱 QR-Code System
- [x] QR-Code pro Asset generieren
- [x] QR-Code drucken / herunterladen
- [x] QR-Code-Link zu PWA-Asset-Seite

### 📲 Mitarbeiter PWA
- [x] QR-Code scannen (Kamera)
- [x] Asset-Infos anzeigen
- [x] Check-out (Ausleihen)
- [x] Check-in (Zurückgeben)
- [x] PWA installierbar (manifest.json + Service Worker)

### 💳 Stripe Subscription
- [x] Stripe Customer bei Firmenerstellung anlegen
- [x] Subscription starten (Trial)
- [x] Webhook: Subscription-Status synchronisieren
- [x] Feature-Gate: Zugriff bei abgelaufener Subscription sperren

---

## 🚀 Phase 2 (v1.5)

### 🔧 Wartungsmanagement
- [x] Wartungstermin pro Asset eintragen
- [x] Automatische Erinnerung (E-Mail) X Tage vor Termin
- [x] Wartungshistorie anzeigen
- [x] Status automatisch auf `maintenance` setzen

### 🚗 Fahrzeug-Tracking
- [x] Kilometerstand bei Check-in / Check-out aktualisieren
- [x] TÜV-Datum mit Countdown-Anzeige
- [x] Fahrer-Zuordnung (assigned_user_id)
- [x] Tankstatus erfassen
- [x] Fahrzeug-Log: Wer hat wann wie viel km gefahren

### 📊 Dashboard & Reporting
- [x] Übersicht: Asset-Auslastung
- [x] Aktuelle Ausleihen (wer hat was)
- [x] Bald fällige Wartungen / TÜV-Termine
- [x] Export: CSV (Assets, Aktivitätslog, Wartungshistorie)

### 🔔 Benachrichtigungen
- [x] TÜV-Erinnerung per E-Mail (Resend, Vercel Cron täglich 07:00)
- [x] Wartungs-Reminder per E-Mail
- [x] Optional: Push-Notification via PWA

---

## 🌟 Phase 3 / Nice-to-have (v2.0+)

### 📷 Medien
- [ ] Foto-Upload pro Asset (Supabase Storage)
- [ ] Schadensdokumentation mit Bild
- [ ] QR-Code-Sticker mit Logo generieren

### 🌍 Offline & Sync
- [ ] Offline-fähige PWA (IndexedDB / Service Worker Cache)
- [ ] Sync bei Wiederherstellung der Verbindung

### 📍 GPS & Standort
- [ ] Fahrzeug-Standort via GPS speichern
- [ ] Letzte bekannte Position auf Karte anzeigen
- [ ] Geofencing-Alarm (Asset verlässt definierten Bereich)

### 🤝 Integrationen
- [ ] Kalender-Export (iCal) für Wartungstermine
- [ ] Slack / Teams Benachrichtigungen
- [ ] REST API für externe Systeme

### 💼 Enterprise Features
- [ ] SSO / SAML Login
- [ ] Mehrere Standorte / Niederlassungen pro Firma
- [ ] Erweiterte Rollen-Hierarchien
- [ ] White-Label (eigenes Logo / Domain)

### 💳 Billing Erweiterungen
- [x] Mehrere Subscription-Pläne (Starter / Pro / Enterprise) – `lib/stripe/plans.ts`, Plan-Karten auf `/admin/billing`
- [x] Nutzungsbasierte Abrechnung (per Asset) – Asset-Limit-Prüfung in `POST /api/assets`, Usage-Bars auf Billing-Seite, `GET /api/billing/usage`
- [x] Rechnungen via Stripe Billing Portal – `POST /api/billing/portal` erzeugt Stripe Customer Portal Session, Button auf Billing-Seite
- [x] Stripe Checkout für Plan-Wechsel – `POST /api/billing/checkout` mit Monatlich/Jährlich-Toggle
- [x] Webhook speichert `plan` + `stripe_price_id` in `subscriptions`, synct `companies.plan`
- [x] DB-Migration 010: `plan`, `stripe_price_id`, `asset_count`, `user_count` in `subscriptions`; `plan` in `companies`
- [x] Umgebungsvariablen: `STRIPE_PRICE_STARTER_MONTHLY/YEARLY`, `STRIPE_PRICE_PRO_MONTHLY/YEARLY`, `STRIPE_PRICE_ENTERPRISE_MONTHLY/YEARLY`

---

## 🐛 Bekannte Bugs & offene Aufgaben (Stand 2026-04-24)

### 🎨 Styling / UI
- [x] MitarbeiterLogin (`/company-login`) und Register (`/register`) haben alten schwarzen Style → auf neues Design (hell/modern) anpassen

### 📱 PWA – Umbenennung & Navigation
- [x] PWA: "Assets" in der Navigation umbenennen zu **Inventar**
- [x] Bestandsseite in 3 einklappbare Kategorien unterteilen: **Werkzeuge**, **Maschinen**, **Fahrzeuge**

### 📦 Asset-Verwaltung
- [x] Beim Auschecken falsches Icon + Fehlermeldung "Asset nicht gefunden" → Icon und Logik korrigieren (checkout/checkin nutzen jetzt `createServiceClient()`)
- [x] Klick auf "Bearbeiten" eines Assets leitet zum Login → PWA-Edit-Seite `/pwa/asset/[qr]/edit` angelegt
- [ ] Beim Anlegen eines neuen Assets mehr Felder je nach Typ anzeigen:
  - Fahrzeug: Kennzeichen, Kilometerstand, TÜV-Datum, Tankstatus, etc.
  - Maschine: Seriennummer, Wartungsintervall, etc.
  - Werkzeug: Seriennummer, Zustand, etc.

### 👤 Mitarbeiter
- [x] Mitarbeiter-Detailseite (Admin-Sicht): Profil-Header mit Avatar, Status-Badge und Rolle ergänzt

### 💳 Abonnement
- [x] Abonnement-Seite öffnen leitet zur Login-Seite → neue Seite `/admin/billing` angelegt

### 🔐 Rollen & Rechte
- [x] Neue Rolle anlegen mit allen Rechten ausgewählt zeigt am Ende "Keine Rechte" → Supabase-Join-Query auf `permissions(key)` umgestellt

---

## 📋 Neue Feature-Requests (Stand 2026-04-24)

### 👤 Meine ausgecheckten Assets (User-Sicht)
- [x] User sieht auf dem PWA-Dashboard eine Sektion **„Meine ausgecheckten Items"** mit allen Assets, die er aktuell ausgecheckt hat
- [x] Von dort direkt **Zurückgeben** möglich (mit Notiz-Feld) + Doppel-Submit-Schutz
- [x] Filter auf der Inventar-Seite: **„Meine"** – zeigt nur eigene ausgecheckte Assets
- [x] Dashboard zeigt Schnellübersicht: Anzahl eigener Ausleihen + Liste

### 🔧 Werkzeuge – Checkout-Flow
- [x] Beim Auschecken eines Werkzeugs: optionales **Notiz-Feld**
- [x] Beim Zurückgeben: optionales **Notiz-Feld**
- [x] Ausgecheckter User kann das Werkzeug auf **„Defekt"** setzen (mit Pflicht-Notiz)
- [x] Werkzeug das bereits ausgecheckt ist → Fehlermeldung „Bereits ausgecheckt von [Username]"

### 🚗 Fahrzeuge – Checkout-Flow
- [x] Doppel-Checkout-Sperre mit Username-Hinweis
- [x] Kilometerstand als Pflichtfeld beim Zurückgeben (NaN-Validierung + DB-Fix)
- [x] Tankstatus auswählbar beim Zurückgeben – wird in `asset_logs.fuel_status` gespeichert
- [x] DB-Migration 007: `fuel_status text` zu `vehicles` + `asset_logs`, `assigned_user_id` Rename

### ⚙️ Maschinen – Wartungsplan
- [x] Letzte Wartung + Nächste Wartung als Datumsfelder beim Anlegen/Bearbeiten
- [x] Wartungsintervall in Monaten pro Maschine definierbar
- [x] Nächste Wartung wird automatisch aus letzter Wartung + Intervall berechnet (API-seitig)
- [x] Farbiger Badge je nach Nähe des Wartungstermins (grün/gelb/rot) via `DueDateBadge`
- [x] Dashboard-Widget „Bald fällige Wartungen" für Maschinen + Fahrzeuge (nächste 60 Tage)
- [x] Rotes Überfälligkeits-Banner im Dashboard bei überschrittenen Wartungen

### 🗂️ Asset-Felder & Lagerorte
- [x] DB-Migration 009: `maintenance_interval_months` zu `machines`, `serial_no`+`condition` zu `tools`, neue Tabelle `locations`, `location_id` in `assets`
- [x] Werkzeug: Seriennummer + Zustand (Gut / Verschlissen / Beschädigt) beim Anlegen/Bearbeiten
- [x] Maschine: Seriennummer, Hersteller, Wartungsintervall beim Anlegen/Bearbeiten
- [x] Fahrzeug: Kennzeichen, km-Stand, TÜV, Wartungsdaten beim Anlegen/Bearbeiten
- [x] Lagerort-Dropdown im AssetForm (vorhandene Lagerorte aus DB)
- [x] Lagerorte in Settings verwaltbar (hinzufügen / löschen) via `/api/locations`
- [x] `lib/types.ts`: `Tool`, `Machine`, `Asset` um neue Felder ergänzt, `Location`-Interface hinzugefügt

### 📊 PWA-Dashboard – Verbesserungen
- [x] Sektion „Meine Ausleihen" mit Schnell-Zurückgabe
- [x] Statistik-Kacheln: Gesamt / Verfügbar / Ausgecheckt / Defekt+Wartung
- [x] Personalisierter Begrüßungstext mit Username

### 📜 Historie
- [x] Kilometerstand + Tankstatus pro Log-Eintrag sichtbar (inline in Liste)
- [x] Klick auf Eintrag öffnet **Detail-Popup** mit allen Infos (Aktion, Mitarbeiter, Zeit, km, Tank, Notiz)
- [x] Defekt-Meldungen werden farblich hervorgehoben (🔴)
- [x] `router.refresh()` nach Checkout/Checkin/Defekt → Seite zeigt sofort aktuellen Status, verhindert Doppel-Aktion

### 📷 Fotos beim Checkout / Checkin / Defekt
- [x] Beim Auschecken, Zurückgeben und Defekt-Melden: bis zu 3 Fotos anhängen
- [x] Fotos werden in Supabase Storage (`asset-photos/logs/`) gespeichert und in `asset_logs.photo_urls` referenziert (Migration 008)
- [x] In der Historie zeigt jedes Log-Item die Foto-Anzahl an (z. B. „+2 Fotos")
- [x] Klick auf ein Verlaufs-Element öffnet ein Bottom-Sheet-Modal mit allen Details + Fotos
- [x] Beim Bearbeiten eines Assets sind nur die Asset-Erstellungsfotos sichtbar/veränderbar (keine Log-Fotos)
- [x] `force-dynamic` auf Asset-Detail-Seite (PWA + Admin) → immer frische Daten nach Navigation zurück

### 🖥️ Admin-Webapp – Parität mit PWA
- [x] Asset-Detailseite (`/admin/assets/[id]`): Log-Query um `fuel_status` + `photo_urls` erweitert
- [x] Aktivitätslog in der Admin-Webapp nutzt `LogHistoryList`: klickbare Einträge, Foto-Badges, Detail-Modal
- [x] `LogHistoryList` unterstützt Supabase-Join-Format (`users` als Array oder einzelnes Objekt)

### 📷 Medien
- [x] Foto-Upload pro Asset (Supabase Storage) – beim Anlegen + Bearbeiten bis zu 3 Fotos
- [x] Schadensdokumentation mit Bild – beim Auschecken, Zurückgeben und Defekt-Melden Fotos anhängbar
- [x] QR-Code-Sticker mit Logo generieren – `AssetQrCode` rendert auf Canvas: indigo Top-Stripe, tolio-Logo, Asset-Name, ID, Branding-Footer; Toggle zwischen Sticker- und Plain-Modus; Download + Druck

### 🌍 Offline & Sync
- [x] Offline-fähige PWA: Service Worker (`sw.js` v3) mit stale-while-revalidate für `GET /api/assets` + `GET /api/auth/me`; statische Pages gecacht
- [x] IndexedDB-Aktionswarteschlange (`lib/offline/queue.ts`): Checkout/Checkin werden bei Offline in IndexedDB eingereiht
- [x] `OfflineBanner` – zeigt Offline-Status, Anzahl ausstehender Aktionen, manueller „Jetzt sync"-Button, Erfolgs-Toast nach Synchronisierung
- [x] Sync bei Verbindungswiederherstellung: `online`-Event + Background Sync API (Tag `tolio-sync`) über `SwRegister`
- [x] SW ↔ Client Messaging: `TRIGGER_SYNC` / `SYNC_COMPLETE` für koordinierten Sync-Flow

## 🐛 Bugfixes
- [x] PWA: Nach Auschecken/Zurückgeben/Defekt-Melden wurde das Item in der Inventarliste erst nach manuellem Reload aktualisiert – behoben durch `window.location.href` statt `router.push` für garantierten Seitenneulad
- [x] PWA: Historie-Detail-Popup kam nicht weit genug hoch und Fotos wurden teilweise hinter der Bottom-Navigation versteckt – behoben durch Erhöhung auf `max-h-[90vh]` und `pb-24` Innenabstand

