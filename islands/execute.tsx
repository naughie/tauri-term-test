import { JSX } from "preact";
import { useEffect, useReducer } from "preact/hooks";
import "../lib/window.ts";

type CmdStates = {
  cmd: string;
  disabled: boolean;
};
type CmdAction = {
  type: "executed";
} | {
  type: "updateCmd";
  newCmd: string;
};

const reducer = (_: CmdStates, action: CmdAction) => {
  switch (action.type) {
    case "updateCmd":
      if (action.newCmd.endsWith("\n")) {
        return { cmd: action.newCmd, disabled: true };
      } else {
        return { cmd: action.newCmd, disabled: false };
      }
    case "executed":
      return { cmd: "", disabled: false };
  }
};

const CommandEditor = () => {
  const [states, dispatch] = useReducer(reducer, { cmd: "", disabled: false });

  const onInput = (e: JSX.TargetedEvent<HTMLTextAreaElement, Event>) => {
    dispatch({ type: "updateCmd", newCmd: e.currentTarget.value });
  };

  useEffect(() => {
    if (!states.disabled) {
      return;
    }
    if (window.__TAURI__ === undefined) {
      return;
    }
    const { invoke } = window.__TAURI__.tauri;

    invoke("execute", { command: states.cmd }).then(() => {
      dispatch({ type: "executed" });
    });
  }, [states.disabled]);

  return (
    <>
      $&nbsp;
      <textarea
        disabled={states.disabled}
        onInput={onInput}
        value={states.cmd}
        autofocus
      />
    </>
  );
};

export default function Execute() {
  return (
    <div>
      <CommandEditor />
    </div>
  );
}
