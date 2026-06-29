import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Sessions","description":"","frontmatter":{},"headers":[],"relativePath":"en/usage/sessions.md","filePath":"en/usage/sessions.md"}');
const _sfc_main = { name: "en/usage/sessions.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="sessions" tabindex="-1">Sessions <a class="header-anchor" href="#sessions" aria-label="Permalink to &quot;Sessions&quot;">​</a></h1><p>Manage conversation sessions.</p><p>TurboDev automatically saves every conversation to disk. You can resume a previous session or start a new one at any time.</p><h2 id="startup" tabindex="-1">Startup <a class="header-anchor" href="#startup" aria-label="Permalink to &quot;Startup&quot;">​</a></h2><p>When you launch TurboDev and a previous session exists, you&#39;ll be prompted:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Resume previous session?</span></span>
<span class="line"><span>  Session title (4 min ago, 12 messages)</span></span>
<span class="line"><span>  [y/n]</span></span></code></pre></div><ul><li>Press <strong>y</strong> to resume the previous session with all messages and context intact</li><li>Press <strong>n</strong> to start a fresh empty session</li></ul><h2 id="auto-save" tabindex="-1">Auto-Save <a class="header-anchor" href="#auto-save" aria-label="Permalink to &quot;Auto-Save&quot;">​</a></h2><p>Sessions are automatically saved after every message exchange to:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>.turbodev/sessions/session-{id}.json</span></span></code></pre></div><p>Each session stores:</p><ul><li>Messages (user and assistant)</li><li>Token count and context length</li><li>Cumulative session cost</li><li>Active agent name</li></ul><h2 id="managing-sessions" tabindex="-1">Managing Sessions <a class="header-anchor" href="#managing-sessions" aria-label="Permalink to &quot;Managing Sessions&quot;">​</a></h2><h3 id="new" tabindex="-1">/new <a class="header-anchor" href="#new" aria-label="Permalink to &quot;/new&quot;">​</a></h3><p>Starts a new empty session. The current session is automatically saved first.</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>/new</span></span></code></pre></div><h3 id="sessions-1" tabindex="-1">/sessions <a class="header-anchor" href="#sessions-1" aria-label="Permalink to &quot;/sessions&quot;">​</a></h3><p>Lists all saved sessions, sorted by most recent:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>/sessions</span></span></code></pre></div><p>Example output:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Sessions:</span></span>
<span class="line"><span>1. Add OAuth feature (2 min ago)</span></span>
<span class="line"><span>2. Fix CSS bug (1 hour ago)</span></span>
<span class="line"><span>3. Refactor API (yesterday)</span></span>
<span class="line"><span>1-3 select · Esc cancel</span></span></code></pre></div><p>Type the session number to restore it. The current session is saved before switching.</p><h2 id="back-to-usage" tabindex="-1">Back to Usage <a class="header-anchor" href="#back-to-usage" aria-label="Permalink to &quot;Back to Usage&quot;">​</a></h2><ul><li><a href="/turbodev/en/usage/">Terminal UI</a></li><li><a href="/turbodev/en/usage/commands.html">Commands</a></li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en/usage/sessions.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const sessions = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  sessions as default
};
