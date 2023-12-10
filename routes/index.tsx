import Execute from "../islands/execute.tsx";
import Output from "../islands/output.tsx";

export default function Home() {
  return (
    <div class="terminal">
      <Execute />
      <Output />
    </div>
  );
}
