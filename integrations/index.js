import * as FBPixel from "./FacebookPixel";
import * as CYNTELLIPixel from "./CyntelliPixel";
import * as GoogleAds from "./GoogleAds";
import * as ElandPixel from "./ElandPixel";
import * as LinePixel from "./LinePixel";
import * as CompassPixel from "./CompassPixel";
import * as AmobeePixel from "./AmobeePixel";
import * as DV360Pixel from "./DV360Pixel";
import * as BingPixel from "./BingPixel";
import * as YahooPixel from "./YahooPixel";
import * as GA4Pixel from "./GA4Pixel";

// the key names should match the destination.name value to keep partity everywhere
// (config-plan name, native destination.name , exported integration name(this one below))

const integrations = {
  FACEBOOK_PIXEL: FBPixel.default,
  CYNTELLI_PIXEL: CYNTELLIPixel.default,
  GOOGLEADS: GoogleAds.default,
  ELAND_PIXEL: ElandPixel.default,
  LINE_PIXEL: LinePixel.default,
  COMPASS_PIXEL: CompassPixel.default,
  AMOBEE_PIXEL: AmobeePixel.default,
  DV360: DV360Pixel.default,
  BING_PIXEL: BingPixel.default,
  YAHOO_PIXEL: YahooPixel.default,
  GA4_PIXEL: GA4Pixel.default
};

export { integrations };
