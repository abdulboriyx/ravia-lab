"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type SpatialPromptDockProps = {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

export function SpatialPromptDock({
  prompt,
  onPromptChange,
  onSubmit,
}: SpatialPromptDockProps) {
  const [expanded, setExpanded] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const shouldFocusOnExpand = useRef(false);

  const openAndFocus = () => {
    shouldFocusOnExpand.current = true;
    setExpanded(true);
  };

  const collapse = () => {
    shouldFocusOnExpand.current = false;
    setExpanded(false);
  };

  useEffect(() => {
    if (expanded && shouldFocusOnExpand.current) {
      inputRef.current?.focus();
      shouldFocusOnExpand.current = false;
    }
  }, [expanded]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (!expanded && event.key === "/") {
        event.preventDefault();
        openAndFocus();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openAndFocus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expanded]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (prompt.trim().length === 0) {
      return;
    }

    onSubmit();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      collapse();
    }
  };

  if (!expanded) {
    return (
      <div className="spatialPromptDock" data-state="collapsed">
        <button
          type="button"
          className="spatialPromptDockExpand"
          aria-label="Open Spatial Ravia prompt"
          onClick={openAndFocus}
        >
          Ask Ravia ↑
        </button>
      </div>
    );
  }

  return (
    <form
      className="spatialPromptDock"
      data-state="expanded"
      aria-label="Spatial Ravia command dock"
      onSubmit={handleSubmit}
    >
      <div className="spatialPromptDockPanel">
        <label className="spatialPromptDockLabel" htmlFor="spatial-ravia-prompt">
          Spatial Ravia prompt
        </label>
        <input
          id="spatial-ravia-prompt"
          ref={inputRef}
          className="spatialPromptDockInput"
          type="text"
          value={prompt}
          aria-label="Spatial Ravia prompt"
          placeholder="Ask Spatial Ravia..."
          onChange={(event) => onPromptChange(event.currentTarget.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button
          type="submit"
          className="spatialPromptDockSubmit"
          disabled={prompt.trim().length === 0}
        >
          Generate
        </button>
        <button
          type="button"
          className="spatialPromptDockCollapse"
          aria-label="Collapse Spatial Ravia prompt"
          onClick={collapse}
        >
          ↓
        </button>
      </div>
    </form>
  );
}
