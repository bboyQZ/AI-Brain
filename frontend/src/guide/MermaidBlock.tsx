import { useEffect, useId, useRef, useState } from "react";

type Props = {
  chart: string;
};

function isDarkTheme(): boolean {
  return document.documentElement.dataset.theme === "dark";
}

export default function MermaidBlock({ chart }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, "");
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((n) => n + 1));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const renderId = `mermaid-${reactId}-${themeTick}`;

    (async () => {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: isDarkTheme() ? "dark" : "default",
        fontFamily: "inherit",
      });
      try {
        const { svg } = await mermaid.render(renderId, chart.trim());
        if (!cancelled) host.innerHTML = svg;
      } catch (err) {
        if (!cancelled) {
          host.innerHTML = `<pre class="mermaid-error">${String(err)}</pre>`;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, reactId, themeTick]);

  return <div className="mermaid-block" ref={hostRef} />;
}
