(() => {
  const app = globalThis.EnhancedELM;
  const { textFromNode } = app.dom;
  let target;
  let signature = "";

  function mark() {
    const query = document.querySelector("edh-elm-query .query-response");
    if (!query) return;
    let timeline = query.querySelector("[data-enhanced-elm-timeline]");
    if (!timeline) {
      timeline = document.createElement("nav");
      timeline.dataset.enhancedElmUi = "";
      timeline.dataset.enhancedElmTimeline = "";
      timeline.dataset.elmCleanTimeline = "";
      timeline.setAttribute("aria-label", "Conversation timeline");
      query.append(timeline);
    }
    const messages = Array.from(document.querySelectorAll("edh-elm-query .response")).filter(
      (response) => !response.hasAttribute("data-elm-clean-system-message")
    );
    const nextSignature = messages.map((response) => `${response.classList.contains("response-ai") ? "a" : "u"}:${textFromNode(response).slice(0, 48)}`).join("|");
    if (timeline === target && nextSignature === signature) return;
    target = timeline;
    signature = nextSignature;
    timeline.replaceChildren();
    messages.forEach((response, index) => {
      const assistant = response.classList.contains("response-ai");
      const button = document.createElement("button");
      button.type = "button";
      button.className = assistant ? "elm-clean-timeline-assistant" : "elm-clean-timeline-user";
      button.textContent = String(index + 1);
      button.title = `Jump to ${assistant ? "ELM" : "your"} message ${index + 1}`;
      button.setAttribute("aria-label", button.title);
      button.addEventListener("click", () => response.scrollIntoView({ block: "center", behavior: "smooth" }));
      timeline.append(button);
    });
  }

  app.features.timeline = { mark };
})();
