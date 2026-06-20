import { useEffect, useRef, useState } from "react";
import SelectionPopup from "./SelectionPopup";
import "./Paper.css";

type Ruling = "ruled" | "dotted" | "blank";

const RULINGS: Ruling[] = ["ruled", "dotted", "blank"];
const STORAGE_KEY = "paper:doc:v1";

export default function App() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [ruling, setRuling] = useState<Ruling>("ruled");

  // Load saved content once, on mount.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && pageRef.current) pageRef.current.innerHTML = saved;
  }, []);

  // Silent autosave — no save button, ever.
  const save = () => {
    if (pageRef.current) localStorage.setItem(STORAGE_KEY, pageRef.current.innerHTML);
  };

  return (
    <div className="desk">
      <RulingControl ruling={ruling} onChange={setRuling} />

      <div className="paper">
        <div
          ref={pageRef}
          className="page"
          data-ruling={ruling}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={save}
        />
      </div>

      <SelectionPopup pageRef={pageRef} onAfterChange={save} />
    </div>
  );
}

function RulingControl({
  ruling,
  onChange,
}: {
  ruling: Ruling;
  onChange: (r: Ruling) => void;
}) {
  return (
    <div className="edge-reveal">
      {RULINGS.map((r) => (
        <button key={r} data-active={r === ruling} onClick={() => onChange(r)}>
          {r}
        </button>
      ))}
    </div>
  );
}
