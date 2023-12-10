import { useEffect, useState } from "preact/hooks";
import "../lib/window.ts";

export default function Output() {
  const [output, setOutput] = useState<Uint8Array>(new Uint8Array());
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const appWindow = window.__TAURI__?.window.appWindow;
    if (appWindow === undefined) {
      return;
    }
    appWindow.emit("start").then(() => {
      setStarted(true);
    });
  }, []);

  useEffect(() => {
    if (!started) {
      return;
    }

    const event = window.__TAURI__?.event;
    if (event === undefined) {
      return;
    }
    const once = event.once;
    const unlisten = once("read", (e) => {
      const newOutput = new Uint8Array(output.length + e.payload.read.length);
      newOutput.set(output);
      newOutput.set(e.payload.read, output.length);
      setOutput(newOutput);
    });

    return () => {
      unlisten.then((f) => f());
    };
  });

  const outputStr = new TextDecoder().decode(output);

  return (
    <div>
      Output:

      <Items items={outputStr} />
    </div>
  );
}

const Items = ({ items }: { items: string }) => {
  return (
    <div>
      {items.split("\r\n").map((line, i) => <div key={i}>{line}</div>)}
    </div>
  );
};
