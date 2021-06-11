// Class responsible for building up the individual elements in a batch
// that is transmitted by the SDK
import CyntelliElement from "./CyntelliElement.js";

class CyntelliElementBuilder {
  constructor() {
    this.rudderProperty = null;
    this.rudderUserProperty = null;
    this.event = null;
    this.userId = null;
    this.channel = null;
    this.type = null;
    this.channelIdProperty = null;
  }

  // Set the property
  setProperty(inputRudderProperty) {
    this.rudderProperty = inputRudderProperty;
    return this;
  }

  // set User properties
  setUserProperty(inputRudderUserProperty) {
    this.rudderUserProperty = inputRudderUserProperty;
    return this;
  }

  // set User properties
  setPageProperty(inputRudderPageProperty) {
    this.rudderPageProperty = inputRudderPageProperty;
    return this;
  }

  // Setter methods for all variables. Instance is returned for each call in
  // accordance with the Builder pattern

  setEvent(event) {
    this.event = event;
    return this;
  }

  setUserId(userId) {
    this.userId = userId;
    return this;
  }

  setChannel(channel) {
    this.channel = channel;
    return this;
  }

  setType(eventType) {
    this.type = eventType;
    return this;
  }

  build() {
    const element = new CyntelliElement();
    element.setUserId(this.userId);
    element.setType(this.type);
    element.setEventName(this.event);
    element.setProperty(this.rudderProperty);
    element.setUserProperty(this.rudderUserProperty);
    element.setPageProperty(this.rudderPageProperty);
    return element;
  }
}
export default CyntelliElementBuilder;
