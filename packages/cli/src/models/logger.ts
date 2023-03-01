interface LogEvent {
  type: 'error' | 'warning' | 'info' | 'debug';
  event: string; // уникальный идентификатор
  message: string;
  payload?: any;
}

export class Logger {
  event(event: LogEvent): void {
    if (event.type === 'error') {
      console.error(event.type, event.event, event.message, event.payload);
    } else if (event.type === 'warning') {
      console.warn(event.type, event.event, event.message, event.payload);
    } else if (process.env.DEBUG_MODE === 'true') {
      console.log(event.type, event.event, event.message, event.payload);
    }
  }
}
