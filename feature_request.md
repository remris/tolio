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
- [ ] Mehrere Subscription-Pläne (Starter / Pro / Enterprise)
- [ ] Nutzungsbasierte Abrechnung (per Asset)
- [ ] Rechnungen via Stripe Billing Portal

