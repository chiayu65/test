import * as FBPixel from "./FacebookPixel";
import * as CYNTELLIPixel from "./CyntelliPixel";
import * as GoogleAds from "./GoogleAds";
import * as ElandPixel from "./ElandPixel";
import * as LinePixel from "./LinePixel";

// the key names should match the destination.name value to keep partity everywhere
// (config-plan name, native destination.name , exported integration name(this one below))

const integrations = {
  FACEBOOK_PIXEL: FBPixel.default,
  CYNTELLI_PIXEL: CYNTELLIPixel.default,
  GOOGLEADS: GoogleAds.default,
  ELAND_PIXEL: ElandPixel.default,
  LINE_PIXEL: LinePixel.default
};

export { integrations };
