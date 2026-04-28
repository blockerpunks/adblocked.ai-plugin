export type Platform = 'chatgpt';

export type BlockEvent = {
  type: 'block';
  platform: Platform;
  hostname: string;
  selectorId: string;
};

export type RuntimeMessage = BlockEvent;
