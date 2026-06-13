/**
 * stage.js -- page glue for a single RAG pipeline stage page (e.g. chunking).
 *
 * Imports the lib modules a stage page needs and init()s them on the stage's
 * hosts: one drill-down (this stage), the worked-example timeline + process
 * animation, and glossary. Behaviour lives in the lib modules; this file wires
 * hosts only. Loaded as <script type="module"> from a stage page.
 */
import { init as initDrilldown } from "../lib/drilldown.js";
import { init as initProcessAnim } from "../lib/process-anim.js";
import { init as initGlossary } from "../lib/glossary.js";

document.documentElement.classList.add("has-js");

const DATA = "../../shared/data/";

function boot() {
  const instances = [];

  const drillHost = document.querySelector('[data-component="drilldown-host"]');
  if (drillHost) {
    instances.push(
      initDrilldown(drillHost, {
        dataSrc: drillHost.dataset.diagramSrc,
        stage: drillHost.dataset.stage,
      })
    );
  }

  // Worked example: process-anim mounts its own timeline on the host.
  const workedHost =
    document.querySelector('[data-component="worked-example"]') ||
    document.querySelector(".timeline");
  if (workedHost) {
    instances.push(
      initProcessAnim(workedHost, {
        dataSrc: workedHost.dataset.workedSrc || DATA + "worked-example.json",
      })
    );
  }

  instances.push(initGlossary(document.body, { dataSrc: DATA + "glossary.json" }));

  window.addEventListener("pagehide", () => instances.forEach((i) => i.destroy()));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
