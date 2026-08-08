(() => {
  const app = globalThis.EnhancedELM;
  const { textFromNode, copyText } = app.dom;

  function markdownForNode(node) {
    if (!node) return "";
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const element = node;
    if (element.matches("button, .response-icon, script, style, [data-enhanced-elm-ui], .katex-mathml")) return "";
    if (element.hasAttribute("data-enhanced-elm-math-source")) {
      const tex = element.dataset.enhancedElmMathSource;
      return element.classList.contains("enhanced-elm-math-display") ? `\n\n$$\n${tex}\n$$\n\n` : `$${tex}$`;
    }
    if (element.classList.contains("katex")) {
      const tex = element.querySelector("annotation[encoding='application/x-tex']")?.textContent?.trim();
      if (!tex) return "";
      return element.closest(".katex-display") ? `\n\n$$\n${tex}\n$$\n\n` : `$${tex}$`;
    }
    const content = Array.from(element.childNodes).map(markdownForNode).join("");
    const tag = element.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) return `\n\n${"#".repeat(Number(tag[1]))} ${content.trim()}\n\n`;
    if (tag === "p" || tag === "div" || tag === "section") return `\n\n${content.trim()}\n\n`;
    if (tag === "br") return "\n";
    if (tag === "strong" || tag === "b") return `**${content.trim()}**`;
    if (tag === "em" || tag === "i") return `*${content.trim()}*`;
    if (tag === "code" && !element.closest("pre")) return `\`${content.trim()}\``;
    if (tag === "pre") return `\n\n\`\`\`\n${element.textContent?.trim() ?? ""}\n\`\`\`\n\n`;
    if (tag === "a") {
      const href = element.getAttribute("href");
      return href ? `[${content.trim()}](${href})` : content;
    }
    if (tag === "li") return `\n- ${content.trim()}`;
    if (tag === "blockquote") return `\n\n> ${content.trim().replace(/\n/g, "\n> ")}\n\n`;
    if (tag === "hr") return "\n\n---\n\n";
    return content;
  }

  function cleanMarkdown(markdown) {
    return markdown.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
  }

  function currentTitle() {
    const selected = document.querySelector(
      'edh-elm-chat-history-menu-view [role="option"].selected[aria-label^="Chat Summary - "]'
    );
    const nativeTitle = selected?.getAttribute("aria-label")?.replace(/^Chat Summary -\s*/, "").trim();
    if (nativeTitle) return nativeTitle;
    const firstUser = Array.from(document.querySelectorAll("edh-elm-query .response")).find(
      (response) => !response.classList.contains("response-ai") && !response.hasAttribute("data-elm-clean-system-message")
    );
    return textFromNode(firstUser?.querySelector(".markdown-user, .markdown")).slice(0, 80) || "Untitled ELM chat";
  }

  function currentMessages() {
    return Array.from(document.querySelectorAll("edh-elm-query .response"))
      .map((response) => {
        const system = response.hasAttribute("data-elm-clean-system-message");
        const role = system ? "System" : response.classList.contains("response-ai") ? "ELM" : "You";
        return { role, markdown: cleanMarkdown(markdownForNode(response.querySelector(".markdown-user, .markdown"))) };
      })
      .filter((message) => message.markdown);
  }

  function buildMarkdown(title, messages) {
    const body = messages.map((message) => `## ${message.role}\n\n${message.markdown}`).join("\n\n---\n\n");
    return `# ${title}\n\n> Exported locally from Enhanced ELM on ${new Date().toISOString()}.\n\n---\n\n${body}\n`;
  }

  function getConversationSnapshot() {
    const title = currentTitle();
    const messages = currentMessages();
    return { title, messages, markdown: buildMarkdown(title, messages) };
  }

  function ensureCopyButton(container, label, className, callback) {
    if (container.querySelector(`.${className}`)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.enhancedElmUi = "";
    button.className = `${className} enhanced-elm-message-tool`;
    button.textContent = "content_copy";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.addEventListener("click", () => void callback());
    container.append(button);
  }

  function mark() {
    if (!app.state.settings.markdownTools || !app.query) return;
    for (const pre of app.query.querySelectorAll("pre")) {
      /* ELM asynchronously adds its own visible Copy button to code blocks.
       * Keeping a second icon underneath it makes the Enhanced ELM control
       * unreachable. Prefer ELM's native, already-working code copy action
       * and remove our earlier fallback as soon as that button exists. */
      /* ELM places its clipboard toolbar beside <pre>, inside the same
       * positioned wrapper, rather than as a direct descendant of <pre>. */
      const nativeCopy = pre.parentElement?.querySelector("button.markdown-clipboard-button");
      const fallbackCopy = pre.querySelector(".enhanced-elm-copy-code");
      if (nativeCopy) {
        fallbackCopy?.remove();
        continue;
      }
      ensureCopyButton(pre, "Copy code", "enhanced-elm-copy-code", async () => {
        await copyText(pre.textContent?.trim() ?? "");
        app.showToast("Code copied");
      });
    }
    for (const response of app.query.querySelectorAll(".response")) {
      const content = response.querySelector(".markdown-container, .markdown-user") ?? response;
      ensureCopyButton(content, "Copy message as Markdown", "enhanced-elm-copy-message", async () => {
        const markdown = cleanMarkdown(markdownForNode(response.querySelector(".markdown-user, .markdown")));
        if (!markdown) return;
        await copyText(markdown);
        app.showToast("Markdown copied");
      });
    }
    for (const math of app.query.querySelectorAll(".katex, [data-enhanced-elm-math-repair] .katex")) {
      const tex = math.closest("[data-enhanced-elm-math-source]")?.dataset.enhancedElmMathSource || math.querySelector("annotation[encoding='application/x-tex']")?.textContent?.trim();
      if (!tex) continue;
      const target = math.closest(".katex-display, [data-enhanced-elm-math-repair]") ?? math;
      ensureCopyButton(target, "Copy LaTeX", "elm-clean-formula-copy", async () => {
        await copyText(tex);
        app.showToast("LaTeX copied");
      });
    }
  }

  app.markdown = Object.freeze({ markdownForNode, cleanMarkdown, currentTitle, currentMessages, buildMarkdown, getConversationSnapshot });
  app.features.markdown = { mark };
})();
