(() => {
  const app = globalThis.EnhancedELM;
  const { textFromNode } = app.dom;
  let target;
  let signature = "";
  let nodes = [];
  let activeFrame = 0;

  function messageText(message) {
    const content = message.querySelector(".markdown-container, .markdown, .markdown-user") ?? message;
    const clone = content.cloneNode(true);
    clone.querySelectorAll("button, .katex-mathml, annotation, [data-enhanced-elm-ui]").forEach((node) => node.remove());
    return textFromNode(clone);
  }

  function shortenedText(node, limit = 116) {
    const text = messageText(node).replace(/\s+/g, " ").trim();
    return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
  }

  function buildTurns(messages) {
    const turns = [];
    let pendingUser;
    for (const message of messages) {
      if (message.classList.contains("response-ai")) {
        if (pendingUser) {
          turns.push({ anchor: pendingUser, user: pendingUser, reply: message });
          pendingUser = undefined;
        } else {
          turns.push({ anchor: message, user: undefined, reply: message });
        }
      } else {
        if (pendingUser) turns.push({ anchor: pendingUser, user: pendingUser, reply: undefined });
        pendingUser = message;
      }
    }
    if (pendingUser) turns.push({ anchor: pendingUser, user: pendingUser, reply: undefined });
    return turns;
  }

  function turnDistanceFromReadingLine(turn, readingLine) {
    const bounds = [turn.user, turn.reply]
      .filter(Boolean)
      .map((message) => message.getBoundingClientRect());
    const top = Math.min(...bounds.map((bound) => bound.top));
    const bottom = Math.max(...bounds.map((bound) => bound.bottom));
    if (top <= readingLine && bottom >= readingLine) return 0;
    return Math.min(Math.abs(top - readingLine), Math.abs(bottom - readingLine));
  }

  function updateCurrentMarker() {
    activeFrame = 0;
    if (!app.state?.settings?.enabled || !nodes.length) return;
    const readingLine = window.innerHeight / 2;
    let current = nodes[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const node of nodes) {
      const distance = turnDistanceFromReadingLine(node.turn, readingLine);
      if (distance < closestDistance) {
        closestDistance = distance;
        current = node;
      }
    }

    for (const node of nodes) {
      node.button.toggleAttribute("data-elm-clean-timeline-current", node === current);
    }
  }

  function scheduleCurrentMarker() {
    if (activeFrame) return;
    activeFrame = requestAnimationFrame(updateCurrentMarker);
  }

  function addPreviewLine(preview, role, message) {
    if (!message) return;
    const line = document.createElement("div");
    line.className = "elm-clean-timeline-preview-line";
    const label = document.createElement("strong");
    label.textContent = role;
    const text = document.createElement("span");
    text.textContent = shortenedText(message);
    line.append(label, text);
    preview.append(line);
  }

  function showPreview(timeline, preview, button, turn) {
    preview.replaceChildren();
    addPreviewLine(preview, "You", turn.user);
    addPreviewLine(preview, "ELM", turn.reply);
    preview.hidden = false;

    const railBounds = timeline.getBoundingClientRect();
    const buttonBounds = button.getBoundingClientRect();
    const previewHeight = preview.offsetHeight;
    const idealTop = buttonBounds.top + buttonBounds.height / 2 - railBounds.top;
    const minTop = previewHeight / 2 + 8 - railBounds.top;
    const maxTop = window.innerHeight - previewHeight / 2 - 8 - railBounds.top;
    preview.style.top = `${Math.max(minTop, Math.min(idealTop, maxTop))}px`;
  }

  function hidePreview(preview) {
    preview.hidden = true;
  }

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
    const nextSignature = messages
      .map((response) => `${response.classList.contains("response-ai") ? "a" : "u"}:${messageText(response).slice(0, 48)}`)
      .join("|");
    if (timeline === target && nextSignature === signature) {
      scheduleCurrentMarker();
      return;
    }
    target = timeline;
    signature = nextSignature;
    nodes = [];
    timeline.replaceChildren();

    if (messages.length < 2) {
      timeline.hidden = true;
      return;
    }

    timeline.hidden = false;
    const preview = document.createElement("div");
    preview.className = "elm-clean-timeline-preview";
    preview.id = "enhanced-elm-timeline-preview";
    preview.setAttribute("role", "tooltip");
    preview.hidden = true;
    const list = document.createElement("div");
    list.className = "elm-clean-timeline-list";
    list.setAttribute("aria-label", "Conversation messages");
    timeline.append(preview, list);

    buildTurns(messages).forEach((turn, index) => {
      const assistant = !turn.user;
      const button = document.createElement("button");
      const prompt = turn.user ? shortenedText(turn.user, 72) : shortenedText(turn.reply, 72);
      const label = `Conversation turn ${index + 1}: ${prompt}`;
      button.type = "button";
      button.className = `elm-clean-timeline-node ${assistant ? "elm-clean-timeline-assistant" : "elm-clean-timeline-user"}`;
      button.dataset.elmCleanTimelineLabel = label;
      button.title = label;
      button.setAttribute("aria-label", `Jump to ${label}`);
      button.setAttribute("aria-describedby", preview.id);
      button.addEventListener("mouseenter", () => showPreview(timeline, preview, button, turn));
      button.addEventListener("mouseleave", () => {
        if (document.activeElement !== button) hidePreview(preview);
      });
      button.addEventListener("focus", () => showPreview(timeline, preview, button, turn));
      button.addEventListener("blur", () => {
        if (!button.matches(":hover")) hidePreview(preview);
      });
      button.addEventListener("click", () => {
        app.pauseScrollLock();
        turn.anchor.scrollIntoView({ block: "center", behavior: "smooth" });
        window.setTimeout(scheduleCurrentMarker, 350);
      });
      list.append(button);
      nodes.push({ turn, button });
    });
    scheduleCurrentMarker();
  }

  function init() {
    document.addEventListener("scroll", scheduleCurrentMarker, true);
    window.addEventListener("resize", scheduleCurrentMarker, { passive: true });
  }

  app.features.timeline = { init, mark };
})();
