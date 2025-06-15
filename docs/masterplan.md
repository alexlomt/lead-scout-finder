
# HTMLScout – Master Plan

## 🧭 App Overview and Objectives

HTMLScout is a web application designed to help freelance developers and small agencies find prospective clients — specifically, businesses with a poor or nonexistent web presence. The app enables targeted searches by geography and industry and returns detailed business listings with clear "web presence" tags to qualify leads. The ultimate goal is to simplify and accelerate outbound prospecting.

## 🎯 Target Audience

* Solo freelance developers
* Small digital agencies 
* Growing agencies scaling outbound efforts

## 🔑 Core Features and Functionality

* **Homepage with strong CTA** and pricing
* **Search Dashboard** to define lead criteria (location, radius, industry)
* **Results Page** with sortable, exportable business listings and web presence ratings
* **Export & History Tools** for CSV download and rerunning saved searches
* **User Account System** with usage tracking and tiered subscriptions
* **Admin Tools** for rate limiting, compliance, and terms management

## 🛠️ Technical Stack Recommendations

* **Frontend**: React + TypeScript with Tailwind CSS and shadcn/ui (Vite-based)
* **Backend & Storage**: Supabase (PostgreSQL, auth, and storage)
* **Authentication**: Email/password (native Supabase auth)
* **3rd-Party APIs**: Apollo API for business and web presence data

## 🗃️ Conceptual Data Model

* **User**: email, password hash, plan, usage stats, saved searches
* **Search**: user ID, location, radius, industry, timestamp
* **Result**: business name, contact info, web presence tags, social/media URLs

## 🎨 User Interface Design Principles

* Clean and minimal layout
* Dark blue + sky blue branding accents
* Optimized for desktop workflows
* Accessible, responsive UI using Inter font and semantic elements

## 🔐 Security Considerations

* Rate limiting and API usage caps
* GDPR-compliant data handling
* Clear privacy policy and terms of service

## 🚧 Development Phases or Milestones

**MVP Milestone (0–1 month)**

* Core search flow: homepage → dashboard → results → export
* Auth system and subscription tiers
* Basic admin panel and compliance settings

**V1 Milestone (1–2 months)**

* Saved search history + rerun
* Sortable/filterable result enhancements
* Refined billing, account dashboard

## 🧱 Potential Challenges and Solutions

* **Apollo API data inconsistencies** → Add fallback messaging for incomplete results
* **Rate limiting** → Implement at both API and frontend layers
* **Export abuse** → Enforce CSV limits per subscription plan

## 🚀 Future Expansion Possibilities

* Built-in outreach CRM tools
* AI-generated outreach suggestions
* Integrations with Slack, Notion, or Zapier
* Team collaboration features
* White-labeled agency dashboards
