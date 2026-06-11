import { useRef, useState, type DragEvent } from "react";
import { useOpenFile } from "./useOpenFile";

/** Full-screen landing state before a file is loaded. */
export default function DropZone() {
  const openFile = useOpenFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void openFile(file);
  };

  return (
    <div
      className={`dropzone ${dragging ? "dropzone--active" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className="dropzone__inner">
        <h1>hairball</h1>
        <p>Interactive viewer for large Graphviz model graphs</p>
        <p className="dropzone__hint">Drop a .dot file anywhere, or</p>
        <div className="dropzone__actions">
          <button onClick={() => inputRef.current?.click()}>
            Open .dot file…
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".dot,.gv,text/vnd.graphviz"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void openFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
