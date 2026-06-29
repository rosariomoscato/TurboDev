import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Sessioni","description":"","frontmatter":{},"headers":[],"relativePath":"it/utilizzo/sessioni.md","filePath":"it/utilizzo/sessioni.md"}');
const _sfc_main = { name: "it/utilizzo/sessioni.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="sessioni" tabindex="-1">Sessioni <a class="header-anchor" href="#sessioni" aria-label="Permalink to &quot;Sessioni&quot;">​</a></h1><p>Gestisci le sessioni di conversazione.</p><p>TurboDev salva automaticamente ogni conversazione su disco. Puoi riprendere una sessione precedente o iniziarne una nuova in qualsiasi momento.</p><h2 id="avvio" tabindex="-1">Avvio <a class="header-anchor" href="#avvio" aria-label="Permalink to &quot;Avvio&quot;">​</a></h2><p>Quando avvii TurboDev e esiste una sessione precedente, ti verrà chiesto:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Resume previous session?</span></span>
<span class="line"><span>  Titolo sessione (4 min fa, 12 messaggi)</span></span>
<span class="line"><span>  [y/n]</span></span></code></pre></div><ul><li>Premi <strong>y</strong> per riprendere la sessione precedente con tutti i messaggi e il contesto intatti</li><li>Premi <strong>n</strong> per iniziare una nuova sessione vuota</li></ul><h2 id="salvataggio-automatico" tabindex="-1">Salvataggio automatico <a class="header-anchor" href="#salvataggio-automatico" aria-label="Permalink to &quot;Salvataggio automatico&quot;">​</a></h2><p>Le sessioni vengono salvate automaticamente dopo ogni scambio di messaggi in:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>.turbodev/sessions/session-{id}.json</span></span></code></pre></div><p>Ogni sessione contiene:</p><ul><li>Messaggi (utente e assistente)</li><li>Token utilizzati e lunghezza del contesto</li><li>Costo cumulativo della sessione</li><li>Nome dell&#39;agente attivo</li></ul><h2 id="gestione-sessioni" tabindex="-1">Gestione sessioni <a class="header-anchor" href="#gestione-sessioni" aria-label="Permalink to &quot;Gestione sessioni&quot;">​</a></h2><h3 id="new" tabindex="-1">/new <a class="header-anchor" href="#new" aria-label="Permalink to &quot;/new&quot;">​</a></h3><p>Inizia una nuova sessione vuota. La sessione corrente viene salvata automaticamente.</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>/new</span></span></code></pre></div><h3 id="sessions" tabindex="-1">/sessions <a class="header-anchor" href="#sessions" aria-label="Permalink to &quot;/sessions&quot;">​</a></h3><p>Elenca tutte le sessioni salvate, ordinate dalla più recente:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>/sessions</span></span></code></pre></div><p>Output di esempio:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Sessions:</span></span>
<span class="line"><span>1. Aggiungere OAuth (2 min fa)</span></span>
<span class="line"><span>2. Bug fix CSS (1 ora fa)</span></span>
<span class="line"><span>3. Refactor API (ieri)</span></span>
<span class="line"><span>1-3 seleziona · Esc annulla</span></span></code></pre></div><p>Digita il numero della sessione per ripristinarla. La sessione corrente viene salvata prima del passaggio.</p><h2 id="torna-all-utilizzo" tabindex="-1">Torna all&#39;utilizzo <a class="header-anchor" href="#torna-all-utilizzo" aria-label="Permalink to &quot;Torna all&#39;utilizzo&quot;">​</a></h2><ul><li><a href="/turbodev/it/utilizzo/">Interfaccia terminale</a></li><li><a href="/turbodev/it/utilizzo/comandi.html">Comandi</a></li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("it/utilizzo/sessioni.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const sessioni = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  sessioni as default
};
