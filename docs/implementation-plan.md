
# HTMLScout – Implementation Plan

## 🏁 Step-by-Step Action Plan

### Phase 1: MVP Foundation (Weeks 1–4)

* Set up Supabase project: DB schema, auth, storage
* Build React frontend with Vite, Tailwind, shadcn/ui
* Develop core pages:
  * Homepage with CTA
  * Search Dashboard (location, radius, industry)
  * Results Page with Apollo API integration
* Add email/password auth
* Track search usage and limit free tier functionality
* CSV export functionality (with limits)

### Phase 2: Polishing & Billing (Weeks 5–6)

* Implement saved search history & rerun option
* Build account dashboard with usage tracking
* Stripe integration for Base/Pro/Agency tiers
* Add admin controls for rate limiting and compliance

### Phase 3: Testing & Launch (Weeks 7–8)

* QA testing and bug fixing
* Add GDPR policy, privacy, and ToS pages
* Prepare and deploy to production (e.g., Vercel or Netlify)
* Monitor usage and performance

## 🧑‍💻 Team Setup (Solo Dev or Small Team)

* Solo developer can build full MVP in 6–8 weeks
* Optional support roles:
  * Designer (1 week UI polish)
  * Growth/ops (for email campaigns, outreach tools)

## ➕ Optional Tasks or Integrations

* Slack/Zapier webhook on export
* Analytics (Plausible, PostHog, etc.)
* Feature flags for experimental filters
* Support for Google login (Phase 2+)
