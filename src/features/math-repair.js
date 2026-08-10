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
  function renderDelimitedFormulaSegments(source) {
    if (!source) return undefined;
    const delimiterPattern = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$(?!\$)(?:\\.|[^$\n])+?(?<!\\)\$(?!\$))/g;
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
    if (!changed) return undefined;
    if (cursor < source.length) fragment.append(document.createTextNode(source.slice(cursor)));
    return fragment;
  }

  function repairDelimitedFormulaSegments(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const candidates = [];
    while (walker.nextNode()) candidates.push(walker.currentNode);
    for (const textNode of candidates) {
      const parent = textNode.parentElement;
      const source = textNode.textContent ?? "";
      if (!parent || !source || parent.closest("[data-enhanced-elm-ui], pre, code, .katex, [data-enhanced-elm-math-repair]")) continue;
      const fragment = renderDelimitedFormulaSegments(source);
      if (!fragment) continue;
      textNode.replaceWith(fragment);
    }
  }

  /* Angular's Markdown view can split a delimiter pair across two direct text
   * nodes (for example, "$a^2+b^2=c^2" followed by "$ and a \\$5 amount").
   * Joining only adjacent text siblings keeps this repair local, preserves
   * escaped currency, and never traverses into code blocks or separate prose. */
  function repairAdjacentTextFormulaSegments(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const parents = new Set();
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentElement;
      if (parent && !parent.closest("[data-enhanced-elm-ui], pre, code, .katex, [data-enhanced-elm-math-repair]")) parents.add(parent);
    }
    for (const parent of parents) {
      let first = parent.firstChild;
      while (first) {
        const second = first.nextSibling;
        if (first.nodeType !== Node.TEXT_NODE || second?.nodeType !== Node.TEXT_NODE) {
          first = second;
          continue;
        }
        const fragment = renderDelimitedFormulaSegments(`${first.textContent ?? ""}${second.textContent ?? ""}`);
        if (!fragment) {
          first = second;
          continue;
        }
        const next = second.nextSibling;
        first.replaceWith(fragment);
        second.remove();
        first = next;
      }
    }
  }

  /* ELM's native Markdown parser can consume the closing dollar of an inline
   * formula when it is followed by escaped currency. Its resulting DOM has a
   * deliberately distinctive shape: unfinished formula text, a native KaTeX
   * wrapper containing ordinary English prose, then a text node beginning with
   * the amount. This optional recovery operates only on that three-sibling
   * pattern. It never changes the composer or the sent message. */
  function splitUnclosedInlineFormula(source) {
    let delimiter = -1;
    for (let index = 0; index < source.length; index += 1) {
      if (source[index] === "$" && source[index - 1] !== "\\") delimiter = index;
    }
    if (delimiter < 0 || delimiter === source.length - 1) return undefined;
    return { prefix: source.slice(0, delimiter), tex: source.slice(delimiter + 1) };
  }

  function isPlainNativeProse(tex) {
    return /^(?:and|or|with|for|at|in|on|the|a|an)(?: [a-z]+){1,4}$/.test(tex);
  }

  function repairEscapedCurrencyMarkdownConflict(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const parents = new Set();
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentElement;
      if (parent && !parent.closest("[data-enhanced-elm-ui], pre, code, .katex, [data-enhanced-elm-math-repair]")) parents.add(parent);
    }
    for (const parent of parents) {
      let first = parent.firstChild;
      while (first) {
        const nativeMath = first.nextSibling;
        const amount = nativeMath?.nextSibling;
        if (first.nodeType !== Node.TEXT_NODE || nativeMath?.nodeType !== Node.ELEMENT_NODE || amount?.nodeType !== Node.TEXT_NODE) {
          first = nativeMath;
          continue;
        }
        const nativeKatex = nativeMath.matches(".katex") ? nativeMath : nativeMath.querySelector(".katex");
        const formula = splitUnclosedInlineFormula(first.textContent ?? "");
        const prose = nativeKatex && !nativeMath.closest("[data-enhanced-elm-math-repair]") ? texFromElement(nativeMath) : undefined;
        const hasMathSyntax = /[\\^_=+\-*/{}]/.test(formula?.tex ?? "");
        if (!nativeKatex || !formula || !hasMathSyntax || !isPlainNativeProse(prose ?? "") || !/^\d/.test(amount.textContent ?? "")) {
          first = nativeMath;
          continue;
        }
        const rendered = renderFormula({ tex: formula.tex, displayMode: false }, { inlineContainer: true });
        if (!rendered) {
          first = nativeMath;
          continue;
        }
        rendered.dataset.enhancedElmMarkdownCompatibility = "";
        const replacement = document.createDocumentFragment();
        if (formula.prefix) replacement.append(document.createTextNode(formula.prefix));
        replacement.append(rendered);
        first.replaceWith(replacement);
        nativeMath.replaceWith(document.createTextNode(` ${prose} `));
        amount.textContent = `$${amount.textContent}`;
        first = amount.nextSibling;
      }
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

  const FORMULA_BLOCK_SELECTOR = "p, li, div, blockquote, h1, h2, h3, h4, h5, h6";

  function isFormulaBlock(block) {
    if (!block.matches(FORMULA_BLOCK_SELECTOR)) return false;
    if (block.closest("pre, code, [data-enhanced-elm-ui], [data-enhanced-elm-math-repair]")) return false;
    /* Angular and Markdown add wrapper divs freely. Work from their innermost
     * block children so sibling detection is based on the real Markdown blocks,
     * rather than a flattened list containing both wrappers and their content. */
    return !Array.from(block.children).some((child) => child.matches(FORMULA_BLOCK_SELECTOR));
  }

  function repairWholeDisplayBlocks(root) {
    const blocks = Array.from(root.querySelectorAll(FORMULA_BLOCK_SELECTOR)).filter(isFormulaBlock);
    for (const block of blocks) {
      if (repaired.has(block)) continue;
      /* Use textContent rather than an individual text node: Markdown frequently
       * inserts <br> or <span> elements inside one visual display expression. */
      const formula = parseDelimitedFormula(block.textContent ?? "");
      if (!formula?.displayMode) continue;
      const rendered = renderFormula(formula);
      if (!rendered) continue;
      repaired.add(block);
      block.replaceWith(rendered);
    }
  }

  /* A display expression split into adjacent, formula-only Markdown blocks is
   * safe to join. The previous flattened-node approach could see wrapper divs
   * between adjacent <p> siblings and therefore never join the two delimiter
   * halves. Iterate through actual sibling blocks instead. */
  function repairSplitDisplayBlocks(root) {
    const blocks = Array.from(root.querySelectorAll(FORMULA_BLOCK_SELECTOR)).filter(isFormulaBlock);
    const blockSet = new Set(blocks);
    for (const first of blocks) {
      if (repaired.has(first)) continue;
      const firstText = first.textContent.trim();
      if (!(firstText.startsWith("$$") || firstText.startsWith("\\[")) || firstText.endsWith("$$") || firstText.endsWith("\\]")) continue;
      const group = [first];
      let combined = firstText;
      let next = first.nextElementSibling;
      while (next && group.length < 4) {
        if (!blockSet.has(next)) break;
        const text = next.textContent.trim();
        if (!text || text.length > 4000) break;
        group.push(next);
        combined += `\n${text}`;
        if (combined.endsWith("$$") || combined.endsWith("\\]")) break;
        next = next.nextElementSibling;
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
    repairAdjacentTextFormulaSegments(app.query);
    if (app.state.settings.markdownCompatibility) repairEscapedCurrencyMarkdownConflict(app.query);
    repairStandaloneTextFormulae(app.query);
    repairWholeDisplayBlocks(app.query);
    repairSplitDisplayBlocks(app.query);
  }

  app.features.mathRepair = { mark };
})();
