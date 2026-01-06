# OGAP – Product Vision & Scope

## 1. Problem Statement

Finding on-street parking in urban areas remains a persistent and inefficient process. Drivers spend an average of 8-10 minutes searching for available spots in city centers, circulating through residential and commercial streets while consuming fuel, generating emissions, and experiencing mounting frustration. This search time compounds during peak hours and in high-demand areas such as city centers, university campuses, and business districts.

The fundamental problem is an **information asymmetry**: drivers departing from parking spots possess real-time knowledge of availability, but this information remains isolated and inaccessible to drivers searching for parking. Navigation systems can route users to parking areas, and payment apps can facilitate transactions, but neither addresses the core inefficiency—the lack of spot-level, real-time availability data at the moment a parking space becomes free.

Existing solutions fall short of closing this information gap:

- **Navigation apps** (Google Maps, Waze) provide general traffic and route guidance but do not offer granular, real-time parking availability at the individual spot level.
- **Parking payment apps** streamline payment but assume the user has already found a spot; they do not reduce search time.
- **Static parking information systems** (municipal parking guidance signs) display occupancy for multi-story garages but ignore the majority of on-street parking, where availability changes second by second.
- **Predictive parking apps** rely on historical data or occupancy estimations, which lack the precision and immediacy needed to guide drivers to a specific available spot at a specific moment.

The result is wasted time, unnecessary traffic congestion, elevated CO₂ emissions from circling vehicles, and user frustration. Drivers frequently arrive in an area knowing parking exists but have no means of identifying which specific spots are vacant or when they will become available. The absence of a mechanism to transmit departure signals from leaving drivers to arriving drivers perpetuates this inefficiency.

OGAP addresses this gap by enabling drivers to share real-time, spot-level parking availability as they depart, transforming privately held knowledge into actionable, community-driven data.

---

## 2. Product Vision

OGAP envisions a future where on-street parking is **predictable, transparent, and community-driven**. By enabling drivers to signal their departure in real time and facilitating direct handovers between leaving and arriving drivers, OGAP reduces the uncertainty and inefficiency inherent in traditional parking search behavior.

The long-term vision is to establish OGAP as the primary tool for urban drivers seeking on-street parking, where:

- **Search time is measurably reduced** through access to real-time, spot-level availability data contributed by the user community.
- **Parking becomes a coordinated activity** rather than a competitive search, with drivers able to reserve spots at defined times through a time-based handshake mechanism.
- **Community participation drives data quality**, creating a self-reinforcing network effect where higher user engagement improves availability signal accuracy and timeliness.
- **Environmental impact is reduced** by minimizing unnecessary vehicle circulation and idling during parking searches.

OGAP does not aim to create new parking infrastructure or replace existing municipal parking management systems. Instead, it optimizes the use of existing on-street parking by closing the information gap between departing and arriving drivers. The product's value proposition is grounded in behavioral change: incentivizing drivers to share departure signals through a credit-based system that rewards contribution and penalizes passive consumption.

The vision extends beyond Munich to other urban areas with similar parking challenges, but success depends on achieving sufficient user density in a defined geographic area to ensure data reliability and network effects.

---

## 3. Target Users & Use Cases

### Primary User Groups

**Urban commuters and city-center visitors** who regularly drive to areas with limited on-street parking availability. This includes:

- Employees commuting to business districts without dedicated parking.
- Shoppers and diners visiting commercial and retail areas.
- Residents in neighborhoods with high parking demand and limited public garages.

**Secondary Users**

- **Campus visitors and university-affiliated drivers** who need short- to medium-term parking near educational institutions.
- **Service professionals** (delivery drivers, tradespeople) requiring brief but time-sensitive parking near client locations.

### Core Use Cases

**Use Case 1: Opportunistic Spot Discovery**

A driver arrives in a neighborhood without prior knowledge of parking availability. Using OGAP, they view a real-time map of nearby spots marked as available, with visual indicators of how long each spot has been vacant. The driver navigates to the closest high-probability spot and successfully parks, reducing search time from an estimated 10 minutes to under 2 minutes.

**Use Case 2: Scheduled Handshake**

A driver is parked in a city-center location and plans to depart at 14:00. At 13:50, they announce their departure through OGAP, specifying the exact time they will leave. Another driver searching for parking sees the announcement, accepts the handshake, and arrives at 14:00 to claim the spot. Both drivers benefit: the departing driver earns credits, and the arriving driver avoids circling.

**Use Case 3: High-Demand Area Coordination**

During peak hours near a university campus, multiple drivers are searching for parking. A driver leaving a spot reports it as available. Within seconds, the spot appears on the map for nearby users. A driver 300 meters away claims the spot via a handshake request, navigates directly to the location, and completes the handshake upon arrival. The system deducts credits from the receiver and awards credits to the giver.

**Use Case 4: Passive Spot Monitoring**

A driver en route to a meeting monitors the OGAP map while approaching their destination. They observe a spot that became available 5 minutes ago with a high probability of still being vacant. They adjust their route to approach that street first, finding the spot still available upon arrival.

### When Users Rely on OGAP

Users depend on OGAP when:

- Parking search time is a significant concern (e.g., appointments, time-sensitive errands).
- The area has high parking demand and low turnover.
- Users prefer on-street parking over paid garages due to cost or convenience.
- Users are willing to participate in a community-driven system in exchange for reduced search time and credit rewards.

OGAP is less relevant for users with guaranteed parking (residential permits, private lots) or in areas with low parking pressure where spots are easily found.

---

## 4. Value Proposition

OGAP delivers a distinct value proposition by providing **spot-level, real-time parking availability signals** generated directly by departing drivers. This creates three layers of user value:

### 1. Reduced Search Time Through Real-Time Data

Unlike predictive or historical models, OGAP surfaces parking availability at the moment it occurs. Drivers receive immediate notification when a spot becomes free, enabling direct navigation to a known available location rather than speculative circling.

### 2. Time-Coordinated Handshakes

The handshake mechanism is OGAP's primary differentiator. It allows a departing driver to announce an exact departure time, and an arriving driver to reserve that spot for the specified time window. This transforms parking from a zero-sum competition into a coordinated exchange, reducing uncertainty for both parties.

**Example**: A driver leaving at 15:30 announces their departure at 15:25. Another driver accepts the handshake, arrives at 15:30, and takes the spot. The handshake eliminates the risk of the spot being claimed by a third party and ensures the arriving driver does not waste time searching.

### 3. Community-Driven, Self-Reinforcing Data

OGAP's value scales with user participation. The credit system incentivizes contribution: drivers earn credits for reporting departures and completing handshakes, while claiming spots or using handshakes deducts credits. This creates a behavioral incentive to "give back" to the system, ensuring data freshness and availability.

### Differentiation from Existing Solutions

- **vs. Navigation Apps (Google Maps, Waze)**: OGAP provides spot-level granularity and real-time departure signals, not generalized traffic or area-level parking information.
- **vs. Parking Payment Apps**: OGAP reduces search time before parking occurs; payment apps address the post-parking transaction.
- **vs. Predictive Parking Apps**: OGAP relies on real-time user contributions rather than statistical models, offering immediate and actionable data.
- **vs. Municipal Parking Guidance Systems**: OGAP focuses on on-street parking with second-by-second updates, not garage occupancy metrics updated every few minutes.

OGAP does not create new parking supply or guarantee availability, but it maximizes the efficiency of existing on-street parking through information sharing.

---

## 5. Product Scope (MVP)

The MVP includes only the core features necessary to validate the product's value proposition and enable the primary use cases.

### Included in MVP

**Core Functionality**

- **Real-time parking spot map**: Display available parking spots on a Mapbox-based map with geographic proximity to the user's current location.
- **Spot-level availability signals**: Show how long a spot has been available, with visual probability indicators based on elapsed time.
- **User location tracking**: Geolocation-based map centering to help users identify nearby available spots.
- **Departure reporting**: Allow users to mark their current parking spot as available when leaving, generating a new parking spot entry visible to other users.
- **Handshake mechanism**: Enable users to offer a spot at a defined departure time, and allow other users to request and accept handshakes.
- **Handshake lifecycle management**: Support offer creation, request acceptance, cancellation, and completion, with state synchronization across users.
- **Credit system**: Award credits for reporting spots and completing handshakes as the giver; deduct credits for claiming spots via handshakes.
- **Credit balance display**: Show users their current credit balance and transaction history.
- **User authentication**: Email-based authentication via Supabase to associate users with credit balances and parking actions.
- **Realtime updates**: Use Supabase realtime subscriptions to push parking spot and handshake updates to active users without requiring manual refresh.

**Supporting Features**

- **Session persistence**: Store active parking sessions locally to survive app reloads.
- **User profile management**: Allow users to set a display name.
- **Basic UI for dialogs**: Handshake offer/request/acceptance dialogs with visual feedback.
- **Parking history**: Record completed parking sessions for user reference.
- **Credit transaction log**: Track all credit debits and credits for transparency.

**Technical Infrastructure**

- **Web app**: React-based single-page application accessible via browser.
- **Mobile shells**: Capacitor-based iOS and Android wrappers (optional for MVP deployment).
- **Backend services**: Supabase for authentication, database, and realtime channels; Edge Functions for credit processing and Mapbox token provisioning.
- **Cleanup automation**: Scheduled removal of stale parking spots and expired handshakes to maintain data hygiene.

### Explicitly Out of Scope for MVP

- **Payment integration**: Credit purchase UI is present but disabled; no real payment processing.
- **Advanced predictive models**: Probability calculations are based on simple time-elapsed heuristics, not machine learning.
- **Offline functionality**: App requires active internet connection for map and realtime updates.
- **Multi-city support**: MVP is geographically scoped to Munich and surrounding areas.
- **In-app navigation**: Users must use external navigation apps; OGAP only shows spot locations.
- **Parking enforcement or validation**: OGAP does not verify whether a user actually parks or leaves; it relies on user honesty and credit incentives.

---

## 6. Out of Scope / Non-Goals

This section explicitly defines what OGAP does **not** aim to solve or provide. These boundaries are critical for managing user expectations and maintaining product focus.

### OGAP Does Not:

**Create New Parking Supply**

OGAP does not build parking infrastructure, expand parking capacity, or influence municipal parking policy. It optimizes the use of existing on-street parking but cannot solve problems caused by structural undersupply of parking spaces.

**Guarantee Parking Availability**

OGAP provides real-time signals based on user contributions. It cannot guarantee that a spot will still be available when a user arrives, as spots may be claimed by drivers not using the app or as conditions change.

**Enforce Parking Rules or Compliance**

OGAP does not monitor parking duration limits, payment compliance, or legal parking zones. Users are responsible for adhering to local parking regulations. OGAP does not validate whether a user has actually parked in a claimed spot or departed as announced.

**Replace Navigation Apps**

OGAP shows where parking is available but does not provide turn-by-turn navigation. Users must use separate navigation tools to reach a parking location.

**Support Private or Garage Parking**

The MVP focuses exclusively on public on-street parking. Structured parking facilities, private lots, and reserved spaces are out of scope.

**Enable Spot Reservations Beyond Handshakes**

Users cannot reserve a spot in advance without initiating a handshake with a specific departing driver at a specific time. OGAP does not function as a booking platform for future parking.

**Provide Predictive or Historical Parking Data**

While the app computes basic probability scores based on how long a spot has been available, it does not analyze historical parking trends, predict future availability patterns, or suggest optimal parking times.

**Operate Without User Participation**

OGAP's value is entirely dependent on active user contributions. In areas with low user density or low engagement, the app provides minimal utility. OGAP does not function as a standalone service without a critical mass of participants.

**Support Multi-City or Global Deployment in MVP**

The initial release is geographically limited to Munich. Expansion to other cities requires separate evaluation of parking regulations, user density, and localization.

---

## 7. Assumptions & Constraints

This section outlines the foundational assumptions underlying the product design and the constraints that limit what OGAP can achieve.

### Key Assumptions

**User Participation and Honesty**

- Users will report parking departures accurately and in a timely manner.
- Users will complete handshakes as agreed and not claim spots they do not intend to use.
- The credit system provides sufficient incentive for users to contribute departure signals rather than only consume availability data.

**Data Freshness and Accuracy**

- Real-time data transmitted via Supabase realtime channels reaches users with minimal latency (under 5 seconds).
- Stale parking spots (those no longer available) are removed quickly enough to avoid misleading users.
- Automated cleanup jobs run frequently enough to maintain data hygiene without manual intervention.

**Urban Density and Network Effects**

- OGAP achieves higher utility in areas with high parking demand and turnover (e.g., city centers, university campuses).
- A critical mass of users is required in a given geographic area to generate sufficient parking signals for the system to provide consistent value.
- Network effects will drive user growth: as more users report departures, search time decreases, attracting additional users.

**Technical Infrastructure Reliability**

- Supabase services (authentication, database, realtime, Edge Functions) maintain uptime and performance sufficient for real-time user interactions.
- Users have reliable mobile internet connectivity while using the app.
- Geolocation services are enabled and accurate enough to position users within 10-20 meters of their actual location.

**Behavioral Change**

- Users are willing to spend 10-15 seconds reporting their departure in exchange for credits and community benefit.
- Users prefer the convenience of reduced search time over the friction of app usage and credit management.

### Constraints

**Legal and Regulatory**

- OGAP operates within the bounds of local parking regulations but does not enforce or validate compliance.
- Privacy concerns require careful handling of location data; users must consent to location tracking.
- OGAP does not have agreements with municipal authorities and operates as an independent community platform.

**Technical**

- The app relies on third-party services (Supabase, Mapbox) whose availability, pricing, and terms of service are outside OGAP's control.
- Mobile app performance is constrained by device capabilities, OS permissions, and network conditions.
- Real-time updates depend on WebSocket connections, which may be interrupted by network instability.

**Behavioral**

- Users may behave opportunistically (e.g., claiming spots without parking, reporting false departures) if credit incentives are insufficient or if enforcement mechanisms are weak.
- Adoption in low-density areas may be slow, creating a "cold start" problem where insufficient data reduces utility, discouraging new users.

**Economic**

- Credit purchasing is not enabled in the MVP, limiting the product's ability to generate revenue or enable users to sustain usage if they exhaust credits.
- The product must achieve scale before monetization becomes viable, creating a dependency on external funding or subsidies during the growth phase.

**Geographic**

- The MVP is limited to Munich, where parking regulations, street layouts, and user behavior may differ from other cities.
- Expansion requires localization, regulatory review, and market validation in each new geography.

### Distinction Between Assumptions and Validated Facts

At this stage, the following are **assumptions** requiring validation through user testing and deployment:

- Users will reliably report departures.
- The credit incentive structure is sufficient to drive contribution.
- Network effects will materialize with sufficient user density.

**Validated facts** include:

- Parking search time is a documented problem in urban areas (supported by existing research).
- Geolocation and realtime database technologies are mature and reliable.
- Mapbox and Supabase provide the necessary technical infrastructure at scale.

---

## 8. Success Criteria

Success for the MVP will be measured using the following metrics, which are realistic and aligned with the product's early stage.

### Primary Success Metrics

**1. Reduced Search Time**

- **Metric**: Average time from app opening to parking (user-reported or inferred from session start time).
- **Target**: Reduce average search time by 30% compared to baseline (self-reported pre-app behavior or control group).
- **Rationale**: The core value proposition is time savings; this metric directly measures whether OGAP delivers on that promise.

**2. Active User Engagement**

- **Metric**: Number of monthly active users (MAU) who complete at least one parking session or handshake per month.
- **Target**: 500 MAU within 3 months of launch in Munich.
- **Rationale**: Active usage indicates product-market fit and validates that users find the app valuable enough to integrate into their routine.

**3. Contribution Rate**

- **Metric**: Percentage of users who report at least one parking departure per month.
- **Target**: 40% of active users contribute departure signals.
- **Rationale**: The product's value depends on user contributions. A 40% contribution rate indicates the credit incentive is working and the community is self-sustaining.

**4. Handshake Completion Rate**

- **Metric**: Percentage of initiated handshakes that are successfully completed (i.e., giver and receiver both confirm).
- **Target**: 60% of handshakes completed successfully.
- **Rationale**: High completion rates indicate the handshake mechanism is reliable and trusted by users.

### Secondary Success Metrics

**5. Data Freshness**

- **Metric**: Median time between parking spot creation and removal (indicating how quickly spots are claimed or become stale).
- **Target**: Median lifetime of 10 minutes or less for high-demand areas.
- **Rationale**: Freshness is critical to user trust; stale data undermines the value proposition.

**6. User Retention**

- **Metric**: Percentage of users who return to the app after their first session (7-day retention).
- **Target**: 30% 7-day retention.
- **Rationale**: Retention indicates ongoing utility and habit formation, essential for long-term viability.

**7. Credit Economy Balance**

- **Metric**: Average credit balance per active user; distribution of users with positive vs. depleted credits.
- **Target**: 70% of active users maintain a positive credit balance over a 30-day period.
- **Rationale**: If users consistently run out of credits, the system is unbalanced and may discourage continued use.

### Qualitative Success Indicators

- **User feedback**: Positive sentiment in user surveys regarding reduced stress and time savings.
- **Word-of-mouth growth**: Evidence of organic user acquisition through referrals (tracked via sign-up sources if implemented).
- **Anecdotal reports**: Users sharing stories of successful handshakes or significant time savings.

### Non-Success (Red Flags)

- **Low contribution rates (<20%)**: Indicates the credit system is not incentivizing participation.
- **High handshake cancellation rates (>50%)**: Suggests the mechanism is unreliable or inconvenient.
- **Stale data prevalence**: If >50% of displayed spots are no longer available upon arrival, user trust will erode.
- **Rapid user churn**: If 7-day retention falls below 15%, the app is not providing sufficient value to justify continued use.

---

## Conclusion

OGAP is designed to address a well-documented inefficiency in urban parking by leveraging community-driven, real-time data to reduce search time and coordinate parking handovers. The product vision is grounded in behavioral incentives, technical feasibility, and measurable user value. By focusing the MVP on core functionality—spot reporting, handshakes, and credits—OGAP can validate its value proposition and iterate based on real-world usage data.

Success depends on achieving a critical mass of engaged users in Munich, maintaining data freshness, and ensuring the credit economy incentivizes contribution without creating barriers to entry. The product does not aim to solve systemic parking supply issues or replace existing infrastructure, but rather to optimize the use of available on-street parking through transparent information sharing.

This document provides a foundation for product development, evaluation, and stakeholder communication, ensuring that OGAP is built and assessed against realistic, achievable goals.
