import CyntelliMessage from "./CyntelliMessage";
// Individual element class containing Rudder Message
class CyntelliElement {
  constructor() {
    this.message = new CyntelliMessage();
  }

  // Setters that in turn set the field values for the contained object
  setType(type) {
    this.message.type = type;
  }

  setProperty(rudderProperty) {
    this.message.properties = rudderProperty;
  }

  setUserProperty(rudderUserProperty) {
    this.message.user_properties = rudderUserProperty;
  }

  setPageProperty(rudderPageProperty) {
    this.message.page_properties = rudderPageProperty;
  }

  setUserId(userId) {
    this.message.userId = userId;
  }

  setEventName(eventName) {
    this.message.event = eventName;
  }

  updateTraits(traits) {
    this.message.context.traits = traits;
  }

  getElementContent() {
    return this.message;
  }
}
export default CyntelliElement;
