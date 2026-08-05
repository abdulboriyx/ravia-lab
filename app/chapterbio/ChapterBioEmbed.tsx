"use client";

import { useEffect } from "react";

const chapterBioStyleHref = "/chapterbio/assets/index-Jp-0-yMw.css";
const chapterBioScriptSrc = "/chapterbio/assets/index-DPg_OcaF.js";

export function ChapterBioEmbed() {
  useEffect(() => {
    let stylesheet = document.querySelector<HTMLLinkElement>(
      `link[href="${chapterBioStyleHref}"]`
    );

    if (!stylesheet) {
      stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = chapterBioStyleHref;
      stylesheet.dataset.chapterbioAsset = "true";
      document.head.appendChild(stylesheet);
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = chapterBioScriptSrc;
    script.dataset.chapterbioAsset = "true";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return <div id="root" />;
}
