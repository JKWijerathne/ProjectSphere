import { EventEmitter } from 'events';

// Create a single instance of EventEmitter for the whole app
const eventEmitter = new EventEmitter();

// Increase max listeners limit if needed (default is 10)
eventEmitter.setMaxListeners(20);

export default eventEmitter;
