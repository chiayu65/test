import { DV360Node } from "./node";
import { DV360 } from "./browser";

export default process.browser ? DV360 : DV360Node;
