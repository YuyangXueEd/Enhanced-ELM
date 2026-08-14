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
      /* Work from all visible text in the block: Markdown frequently inserts
       * <br> or <span> elements, while ELM may append a Copy button that must
       * not become part of the TeX source. */
      const formula = parseDelimitedFormula(formulaTextFromBlock(block));
      if (!formula?.displayMode) continue;
      const rendered = renderFormula(formula);
      if (!rendered) continue;
      repaired.add(block);
      block.replaceWith(rendered);
    }
  }

  function formulaTextFromBlock(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    const pieces = [];
    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const parent = textNode.parentElement;
      if (parent?.closest("button, .response-icon, [data-enhanced-elm-ui]")) continue;
      pieces.push(textNode.textContent ?? "");
    }
    return pieces.join("").trim();
  }

  function isCompleteDisplayFormula(value) {
    const trimmed = value.trim();
    return (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4)
      || (trimmed.startsWith("\\[") && trimmed.endsWith("\\]") && trimmed.length > 4);
  }

  function hasDisplayFormulaEnd(value) {
    const trimmed = value.trim();
    return trimmed.endsWith("$$") || trimmed.endsWith("\\]");
  }

  function blockFormulaFragment(block) {
    const text = formulaTextFromBlock(block);
    /* A bare hyphen inside a display formula is turned into an empty Markdown
     * list item by ELM. Restore only that exact, unambiguous representation. */
    if (!text && block.matches("li") && block.parentElement?.matches("ul")) return "-";
    return text;
  }

  function isFormulaContinuation(value) {
    /* A continuation must visibly contain TeX or a mathematical operator.
     * This rejects ordinary prose such as "where phi is..." if ELM leaves a
     * display delimiter unclosed, while accepting every line in a multiline
     * equation (including a standalone minus sign). */
    if (/[\\{}[\]()^_=+\-*/|<>%]/.test(value)) return true;
    return /^(?:[+-]?\d+(?:\.\d+)?|[A-Za-z])$/.test(value.trim());
  }

  function removeFormulaBlocks(blocks, root) {
    const listParents = new Set();
    for (const block of blocks) {
      const parent = block.parentElement;
      if (parent?.matches("ul, ol")) listParents.add(parent);
      repaired.add(block);
      block.remove();
    }
    for (const list of listParents) {
      if (list.isConnected && list !== root && !list.children.length) list.remove();
    }
  }

  /* ELM's current Markdown view can split a display expression into many leaf
   * blocks. In particular, a line containing only "-" becomes an empty <li>,
   * so direct-sibling joins and a small block limit leave the rest of the TeX
   * visible as plain text. Walk the ordered leaf blocks instead. The scan is
   * deliberately bounded and accepts only TeX/operator fragments until it
   * reaches the matching display delimiter. */
  function repairSplitDisplayBlocks(root) {
    const blocks = Array.from(root.querySelectorAll(FORMULA_BLOCK_SELECTOR)).filter(isFormulaBlock);
    const maxBlocks = 64;
    const maxCharacters = 12000;
    for (let index = 0; index < blocks.length; index += 1) {
      const first = blocks[index];
      if (repaired.has(first)) continue;
      const firstText = blockFormulaFragment(first);
      const startsDisplay = firstText.startsWith("$$") || firstText.startsWith("\\[");
      /* A lone "$$" is an opening delimiter, not a complete expression. */
      if (!startsDisplay || isCompleteDisplayFormula(firstText)) continue;
      const group = [first];
      const response = first.closest(".response");
      let combined = firstText;
      for (let nextIndex = index + 1; nextIndex < blocks.length && group.length < maxBlocks; nextIndex += 1) {
        const next = blocks[nextIndex];
        /* A missing closing delimiter must never borrow content from another
         * user or ELM message, even when its first block happens to look like
         * TeX. */
        if (response && next.closest(".response") !== response) break;
        const text = blockFormulaFragment(next);
        if (!text || combined.length + text.length > maxCharacters) break;
        const closesFormula = hasDisplayFormulaEnd(text);
        if (!closesFormula && !isFormulaContinuation(text)) break;
        group.push(next);
        combined += `\n${text}`;
        if (closesFormula) break;
      }
      const rendered = renderFormula(parseDelimitedFormula(combined));
      if (!rendered) continue;
      group.at(-1).after(rendered);
      removeFormulaBlocks(group, root);
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
