import { AppProps } from "$fresh/server.ts";

export default function App({ Component }: AppProps) {
  return (
    <html style={{ height: "100%" }}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>test-tauri</title>
        <link rel="stylesheet" href="/terminal.css" />
      </head>
      <body style={{ height: "100%" }}>
        <Component />
      </body>
    </html>
  );
}
