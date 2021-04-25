// for sdk side native integration identification
// add a mapping from common names to index.js exported key names as identified by Rudder
const commonNames = {
  All: "All",
  "Google Analytics": "GA",
  GoogleAnalytics: "GA",
  GA: "GA",
  "Google Ads": "GOOGLEADS",
  GoogleAds: "GOOGLEADS",
  GOOGLEADS: "GOOGLEADS",
  Braze: "BRAZE",
  BRAZE: "BRAZE",
  Chartbeat: "CHARTBEAT",
  CHARTBEAT: "CHARTBEAT",
  Comscore: "COMSCORE",
  COMSCORE: "COMSCORE",
  Customerio: "CUSTOMERIO",
  "Customer.io": "CUSTOMERIO",
  "FB Pixel": "FACEBOOK_PIXEL",
  "Facebook Pixel": "FACEBOOK_PIXEL",
  FB_PIXEL: "FACEBOOK_PIXEL",
  "Google Tag Manager": "GOOGLETAGMANAGER",
  GTM: "GTM",
  Hotjar: "HOTJAR",
  hotjar: "HOTJAR",
  HOTJAR: "HOTJAR",
  Hubspot: "HS",
  HUBSPOT: "HS",
  Intercom: "INTERCOM",
  INTERCOM: "INTERCOM",
  Keen: "KEEN",
  "Keen.io": "KEEN",
  KEEN: "KEEN",
  Kissmetrics: "KISSMETRICS",
  KISSMETRICS: "KISSMETRICS",
  Lotame: "LOTAME",
  LOTAME: "LOTAME",
  "Visual Website Optimizer": "VWO",
  VWO: "VWO",
  OPTIMIZELY: "OPTIMIZELY",
  Optimizely: "OPTIMIZELY",
  FULLSTORY: "FULLSTORY",
  Fullstory: "FULLSTORY",
  BUGSNAG: "BUGSNAG",
  TVSQUARED: "TVSQUARED",
  "Google Analytics 4": "GA4",
  GoogleAnalytics4: "GA4",
  GA4: "GA4",
  MOENGAGE: "MoEngage",
  AM: "AM",
  AMPLITUDE: "AM",
  Amplitude: "AM",
  Pendo: "PENDO",
  PENDO: "PENDO",
  Lytics: "Lytics",
  LYTICS: "Lytics",
  Appcues: "APPCUES",
  APPCUES: "APPCUES",
  POSTHOG: "POSTHOG",
  PostHog: "POSTHOG",
  Posthog: "POSTHOG"
};

export { commonNames };
