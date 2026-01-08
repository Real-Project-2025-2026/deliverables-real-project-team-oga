# OGAP – Assumptions, Risks & Validation

## 1. Key Product Assumptions

- **Behavioral:** Users will truthfully report leaving/available spots; a sufficient share of drivers will participate regularly; receivers will arrive promptly to claimed spots; credit incentives are meaningful enough to motivate participation.
- **Technical:** Supabase realtime latency remains low enough for near-live map updates; mobile clients maintain stable connectivity and geolocation accuracy in urban canyons; data freshness (spot availability, handshake status) stays within a few seconds of ground truth; Edge Functions execute reliably under expected load.
- **Market/Context:** Urban deployment areas have adequate parking churn and density to sustain supply-demand matching; drivers are willing to allow geolocation and interact with the app while driving/parking; target cities permit such coordination without regulatory obstacles; Mapbox and Supabase quotas meet expected MVP traffic.

## 2. Risk Analysis (by assumption)

- **User honesty/participation**
  - Failure mode: Users misreport spots or rarely contribute.
  - Impact: Low spot availability, reduced trust, credit economy collapse.
  - Manifestation: Many requests with few successful handovers; rising cancellations; negative feedback.
- **Prompt arrival of receivers**
  - Failure mode: Receivers claim but arrive late; spots get taken by third parties.
  - Impact: Perceived unreliability, credit disputes.
  - Manifestation: High rate of failed completions or disputed handshakes; repeated reopens.
- **Credit incentive effectiveness**
  - Failure mode: Credits not valued; users ignore earning/spending.
  - Impact: Insufficient supply of reported spots.
  - Manifestation: Stagnant credit balances; few handshake offers despite demand.
- **Realtime latency and reliability**
  - Failure mode: Delayed channel updates or disconnects.
  - Impact: Users act on stale data, leading to conflicts.
  - Manifestation: Users arrive to find spots already taken; duplicate claims on same deal.
- **Geolocation accuracy and connectivity**
  - Failure mode: Inaccurate coordinates or dropped signals.
  - Impact: Misplaced markers; handovers fail to meet.
  - Manifestation: Users navigate to wrong curb segments; increased cancellations.
- **Data freshness and consistency**
  - Failure mode: Stale `parking_spots`/`handshake_deals` entries remain visible.
  - Impact: Users chase non-existent spots.
  - Manifestation: Clicking markers yields errors; sudden disappearance after navigation starts.
- **Edge Function robustness (process-credits, cleanup)**
  - Failure mode: Function errors or timeouts block credit transfers or cleanup.
  - Impact: Financial logic inconsistency; stale deals remain.
  - Manifestation: Missing credit updates; stuck statuses; user complaints.
- **Urban density and demand fit**
  - Failure mode: Too little churn or too dispersed demand.
  - Impact: Low match rate; users churn.
  - Manifestation: Long waits for available spots; low engagement metrics.
- **Regulatory/permission constraints**
  - Failure mode: Local rules restrict such coordination or data use.
  - Impact: Deployment blocked or limited.
  - Manifestation: Need to disable features or exit markets.
- **External service quotas (Supabase, Mapbox)**
  - Failure mode: Quota exhaustion or throttling.
  - Impact: Degraded maps or realtime; session errors.
  - Manifestation: Missing tiles; failed subscribes/invokes; elevated latency.

## 3. Validation Status

- **Validated facts (MVP stage):**
  - Core flows work in controlled tests: reporting spots, creating/accepting/completing handshakes, credit debits/credits, realtime propagation across multiple clients.
  - Edge Functions execute correctly under light load (dev/test) and enforce role/status in handshakes.
- **Unvalidated assumptions:**
  - Sustained user honesty and participation at scale; attractiveness of credit incentives.
  - Latency/freshness under real cellular conditions and dense client concurrency.
  - Urban demand/supply balance in target neighborhoods.
  - Resilience of cleanup against real-world no-shows and rapid churn.
  - Tolerance of navigation and geolocation errors in crowded streets.
- **Reason for non-validation:** No production-scale deployment yet; limited sample size; synthetic tests cannot reproduce real traffic, adversarial behavior, or varied urban topologies.

## 4. Validation Strategies (MVP-feasible)

- **User honesty/participation:**
  - Small pilot with instrumentation: measure ratio of reported-to-successful handovers; survey for perceived fairness.
  - A/B: vary credit rewards for reporting to detect elasticity of supply.
- **Prompt arrival of receivers:**
  - Telemetry: measure time from claim to arrival vs. success; log cancellations and their reasons.
  - In-app prompts to confirm arrival; compare against GPS proximity.
- **Credit incentive effectiveness:**
  - Experiment: different price/reward levels; observe offer volume and completion rates.
  - Monitor credit velocity (earn/spend cycles) and dormancy of balances.
- **Realtime latency and reliability:**
  - Synthetic load with multiple concurrent clients over mobile networks; measure end-to-end update lag (DB write → client render).
  - Chaos testing: deliberate channel disconnects to see reconnection/recovery behavior.
- **Geolocation accuracy:**
  - Collect anonymized error between reported spot and user-confirmed position; test across street canyons vs. open areas.
  - Require manual pin adjustment when GPS accuracy is low; measure usage.
- **Data freshness and consistency:**
  - Track age of visible spots/deals; alert when exceeding thresholds; verify cleanup efficacy.
  - Simulate conflicting updates to ensure last-write rules and UI reconciliation work.
- **Edge Function robustness:**
  - Load-test `process-credits` and `cleanup` with expected peak QPS; inject latency/failure to observe retries and alerting.
  - Add structured logging and per-invocation metrics for error budgeting.
- **Urban demand fit:**
  - Run micro-pilots in 1–2 neighborhoods; measure match rate and wait time distributions.
  - Interview local drivers and parking enforcement to identify constraints.
- **Regulatory/quotas:**
  - Review local ordinances; consult university legal advisors; monitor Supabase/Mapbox usage with alerts before hitting quotas.

## 5. Critical Risks & Mitigation

- **Low participation / weak incentives:** Mitigate with calibrated credit rewards, onboarding bonuses, and visible success feedback; pilot-based tuning; cap per-user rewards to limit abuse.
- **Stale or inconsistent realtime data:** Mitigate with aggressive client reconciliation (periodic refetch), UI stale-age indicators, and reliable cleanup jobs; fallback to polling on channel loss.
- **Handshake failures due to late arrival or third-party capture:** Mitigate with tighter expiry windows, proximity checks, and lightweight reputation for reliability; allow rapid re-listing by giver.
- **Credit system integrity (function errors or abuse):** Mitigate with server-side invariants, idempotent operations, transaction logging, alerts on anomalous balances, and rate limits on actions affecting credits.
- **Geolocation inaccuracy in dense urban areas:** Mitigate with manual pin move, accuracy badges, and conservative radius matching; test and tune heuristics by area.
