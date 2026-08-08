(() => {
  const app = globalThis.EnhancedELM;
  const repaired = new WeakSet();

  function texFromElement(element) {
    return element.querySelector("annotation[encoding='application/x-tex']")?.textContent?.trim();
  }

  function parseDelimitedFormula(value) {
    const trimmed = value.trim();
    if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
      return { tex: trimmed.slice(2, -2).trim(), displayMode: true };
    }
    if (trimmed.startsWith("\\[") && trimmed.endsWith("\\]") && trimmed.length > 4) {
      return { tex: trimmed.slice(2, -2).trim(), displayMode: true };
    }
    if (trimmed.startsWith("\\(") && trimmed.endsWith("\\)") && trimmed.length > 4) {
      return { tex: trimmed.slice(2, -2).trim(), displayMode: false };
    }
    if (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length > 2 && !trimmed.startsWith("$$")) {
      return { tex: trimmed.slice(1, -1).trim(), displayMode: false };
    }
    return undefined;
  }

  function renderFormula(formula, { inlineContainer = false } = {}) {
    if (!formula?.tex || !globalThis.katex?.renderToString) return undefined;
    const candidates = [formula.tex, formula.tex.replace(/\\\\(?=[A-Za-z])/g, "\\")];
    for (const tex of candidates) {
      try {
        /* A display formula can appear inside Markdown paragraph text. Keep
         * the host inline-safe there; CSS promotes it to a block without
         * creating invalid <div> descendants inside a <p>. */
        const element = document.createElement(formula.displayMode && !inlineContainer ? "div" : "span");
        element.dataset.enhancedElmUi = "";
        element.dataset.enhancedElmMathRepair = "";
        element.dataset.enhancedElmMathSource = tex;
        element.className = `enhanced-elm-math-repair${formula.displayMode ? " enhanced-elm-math-display" : ""}`;
        element.innerHTML = globalThis.katex.renderToString(tex, {
          displayMode: formula.displayMode,
          throwOnError: true,
          strict: "warn",
          trust: false
        });
        return element;
      } catch {
        // The second pass is only for a genuinely double-escaped command.
      }
    }
    return undefined;
  }

  function repairCodeWrappedFormulae(root) {
    for (const code of root.querySelectorAll("code:not(pre code)")) {
      if (repaired.has(code) || code.closest("[data-enhanced-elm-math-repair]")) continue;
      const formula = parseDelimitedFormula(code.textContent ?? "");
      const rendered = renderFormula(formula);
      if (!rendered) continue;
      repaired.add(code);
      code.replaceWith(rendered);
    }
  }

  function repairStandaloneTextFormulae(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const candidates = [];
    while (walker.nextNode()) candidates.push(walker.currentNode);
    for (const textNode of candidates) {
      const parent = textNode.parentElement;
      if (!parent || repaired.has(parent) || parent.closest("[data-enhanced-elm-ui], pre, code, .katex")) continue;
      const formula = parseDelimitedFormula(textNode.textContent ?? "");
      const rendered = renderFormula(formula);
      if (!rendered) continue;
      repaired.add(parent);
      textNode.replaceWith(rendered);
    }
  }

  /* ELM occasionally leaves valid LaTeX delimiters inside a larger Markdown
   * text node (for example, "The answer is $E=mc^2$"). Split that text only at
   * complete delimiter pairs, validate each TeX fragment with KaTeX, and keep
   * every non-formula character unchanged. The display alternatives come
   * first so an inline matcher never consumes part of a $$…$$ expression. */
  function repairDelimitedFormulaSegments(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const candidates = [];
    while (walker.nextNode()) candidates.push(walker.currentNode);
    const delimiterPattern = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$(?!\$)(?:\\.|[^$\n])+?(?<!\\)\$(?!\$))/g;

    for (const textNode of candidates) {
      const parent = textNode.parentElement;
      const source = textNode.textContent ?? "";
      if (!parent || !source || parent.closest("[data-enhanced-elm-ui], pre, code, .katex, [data-enhanced-elm-math-repair]")) continue;
      delimiterPattern.lastIndex = 0;
      let match;
      let cursor = 0;
      let changed = false;
      const fragment = document.createDocumentFragment();
      while ((match = delimiterPattern.exec(source))) {
        const rendered = renderFormula(parseDelimitedFormula(match[0]), { inlineContainer: true });
        if (!rendered) continue;
        if (match.index > cursor) fragment.append(document.createTextNode(source.slice(cursor, match.index)));
        fragment.append(rendered);
        cursor = match.index + match[0].length;
        changed = true;
      }
      if (!changed) continue;
      if (cursor < source.length) fragment.append(document.createTextNode(source.slice(cursor)));
      textNode.replaceWith(fragment);
    }
  }

  /* ELM sometimes turns only the word "to" into KaTeX, leaving the two degree
   * values as literal delimiter fragments. This narrow repair is deliberately
   * semantic: it only handles the broken Celsius range and leaves prose alone. */
  function repairSplitCelsiusRanges(root) {
    for (const math of root.querySelectorAll(".katex")) {
      if (math.closest("[data-enhanced-elm-math-repair]")) continue;
      if (texFromElement(math) !== "to") continue;
      const wrapper = math.parentElement;
      const previous = wrapper?.previousSibling;
      const next = wrapper?.nextSibling;
      if (previous?.nodeType !== Node.TEXT_NODE || next?.nodeType !== Node.TEXT_NODE) continue;
      const left = previous.textContent.match(/^(\s*)\$?(\d+(?:\.\d+)?)\^\\circ\\text\{C\}\s*$/);
      const right = next.textContent.match(/^\s*(\d+(?:\.\d+)?)\^\\circ\\text\{C\}\$?(\s*)$/);
      if (!left || !right) continue;
      previous.textContent = `${left[1]}${left[2]}°C to ${right[1]}°C${right[2]}`;
      next.textContent = right[2];
      wrapper.remove();
    }
  }

  /* A display expression split into adjacent, formula-only Markdown blocks is
   * safe to join. We intentionally cap this at three blocks and reject prose. */
  function repairSplitDisplayBlocks(root) {
    const blocks = Array.from(root.querySelectorAll("p, li, div")).filter(
      (block) => !block.closest("pre, code, [data-enhanced-elm-ui]")
    );
    for (let index = 0; index < blocks.length; index += 1) {
      const first = blocks[index];
      if (repaired.has(first)) continue;
      const firstText = first.textContent.trim();
      if (!(firstText.startsWith("$$") || firstText.startsWith("\\[")) || firstText.endsWith("$$") || firstText.endsWith("\\]")) continue;
      const group = [first];
      let combined = firstText;
      for (let next = index + 1; next < Math.min(index + 3, blocks.length); next += 1) {
        if (blocks[next].previousElementSibling !== group.at(-1)) break;
        const text = blocks[next].textContent.trim();
        if (!text || text.length > 4000) break;
        group.push(blocks[next]);
        combined += `\n${text}`;
        if (combined.endsWith("$$") || combined.endsWith("\\]")) break;
      }
      const rendered = renderFormula(parseDelimitedFormula(combined));
      if (!rendered) continue;
      group.at(-1).after(rendered);
      for (const block of group) {
        repaired.add(block);
        block.remove();
      }
    }
  }

  function mark() {
    if (!app.state.settings.mathRepair || !app.query) return;
    repairSplitCelsiusRanges(app.query);
    repairCodeWrappedFormulae(app.query);
    repairDelimitedFormulaSegments(app.query);
    repairStandaloneTextFormulae(app.query);
    repairSplitDisplayBlocks(app.query);
  }

  app.features.mathRepair = { mark };
})();
