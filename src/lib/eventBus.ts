// Create a new file: /src/lib/eventBus.ts
import { EventEmitter } from "events";

class EventBus extends EventEmitter {}
export const eventBus = new EventBus();
