type Invoke = (cmd: "execute", args: { command: string }) => Promise<void>;

type Unlisten = () => void;
type Event = {
  payload: {
    read: number[];
  };
};
type Once = (
  event: "read",
  handler: (event: Event) => void,
) => Promise<Unlisten>;

type WebviewWindow = {
  emit: (event: "start") => Promise<void>;
};

declare global {
  interface Window {
    __TAURI__?: {
      tauri: {
        invoke: Invoke;
      };
      event: {
        once: Once;
      };
      window: {
        appWindow: WebviewWindow;
      };
    };
  }
}
