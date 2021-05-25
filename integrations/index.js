import * as FBPixel from "./FacebookPixel";
import * as CYNTELLIPixel from "./CyntelliPixel";
import * as GoogleAds from "./GoogleAds";

// the key names should match the destination.name value to keep partity everywhere
// (config-plan name, native destination.name , exported integration name(this one below))

const integrations = {
  FACEBOOK_PIXEL: FBPixel.default,
  CYNTELLI_PIXEL: CYNTELLIPixel.default,
  GOOGLEADS: GoogleAds.default
};

export { integrations };
