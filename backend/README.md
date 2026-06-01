# Maintenance API (Render backend)

Add these routes to your existing Express server on Render (`prem-backend-9icx`).

## 1. Copy files

Copy into your backend project:

- `routes/maintenance.js`
- `data/maintenance.json`

## 2. Register the router

In your main server file (e.g. `server.js` or `app.js`), after other middleware:

```js
const maintenanceRoutes = require('./routes/maintenance');

app.use('/api', maintenanceRoutes);
```

Ensure `JWT_SECRET` (or `ADMIN_JWT_SECRET`) matches what admin login uses.

## 3. Redeploy on Render

After deploy, this should return **200**:

`GET https://prem-backend-9icx.onrender.com/api/maintenance-status`

## 4. Optional: Supabase instead of JSON file

If you prefer Supabase, run `supabase/migrations/001_maintenance_settings.sql` and wire the router to your existing Supabase client instead of the JSON file.
