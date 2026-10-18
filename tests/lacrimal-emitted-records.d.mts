export interface LacrimalEmittedPin {
  id: string;
  fma: string;
  file: string;
  sourceHash: string;
  group: string;
}

export function assertLacrimalEmittedPin(runtime: string, pin: LacrimalEmittedPin): void;
