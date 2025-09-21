// ========================= UTILITIES =================================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const out = $('#output');
const preview = $('#preview');
const STORAGE_KEY = 'code-editor-content';

const escapeHTML = s =>
    String(s).replace(/[&<>"]/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
    }[c]
    ));

function logMessage(message, type = 'info') {
    const color = type === 'error' ? 'var(--err)' : (type === 'warn' ? 'var(--warn)' : 'var(--brand)');

    const time = new Date().toLocaleTimeString();

    const line = document.createElement("div")
    line.innerHTML = `<span style="color:${color}">[${time}]</span> ${escapeHTML(message)}`;

    out.appendChild(line);
    out.scrollTop = out.scrollHeight; // Auto scroll to bottom
}

function clearLog() {
    logMessage('Log cleared', 'warn');
    out.innerHTML = '';
}
$('#clearLog')?.addEventListener('click', clearLog);

function makeEditor(id, mode) {
    const ed = ace.edit(id, {
        theme: 'ace/theme/dracula',
        mode, tabSize: 2,
        useSoftTabs: true,
        showPrintMargin: false,
        wrap: true,
        autoScrollEditorIntoView: true
    });

    ed.session.setUseWrapMode(true);
    ed.commands.addCommand({
        name: "run",
        bindKey: { win: "Ctrl-Enter", mac: "Command-Enter", linux: "Ctrl-Enter" },
        exec() { runWeb(false) }
    });
    ed.commands.addCommand({
        name: "save",
        bindKey: { win: "Ctrl-S", mac: "Command-S", linux: "Ctrl-S" },
        exec() { saveProject() }
    });

    return ed;
}
const ed_html = makeEditor('ed_html', 'ace/mode/html');
const ed_css = makeEditor('ed_css', 'ace/mode/css');
const ed_js = makeEditor('ed_js', 'ace/mode/javascript');

const TAB_ORDER = ['html', 'css', 'js'];
const wraps = Object.fromEntries(
    Array.from($$("#webEditors .editor-wrap")).map(w => [w.dataset.pane, w])
);
const editors = {
    html: ed_html,
    css: ed_css,
    js: ed_js
};

function activePane() {
    const active = $('#webTabs .tab.active');
    return active ? active.dataset.pane : "html";
}

function showPane(name) {
    TAB_ORDER.forEach(pane => {
        if (wraps[pane]) {
            wraps[pane].hidden = (pane !== name);
        }
    })

    $$("#webTabs .tab").forEach(tab => {
        const on = tab.dataset.pane === name;
        tab.classList.toggle('active', on);
        tab.setAttribute('aria-selected', on);
        tab.tabIndex = on ? 0 : -1;
    });

    requestAnimationFrame(() => {
        const ed = editors[name];
        if (ed && ed.resize) {
            ed.resize(true);
            ed.focus();
        };
    })
}

$("#webTabs")?.addEventListener("click", e => {
    const btn = e.target.closest(".tab");
    if (!btn) {
        return;
    }
    showPane(btn.dataset.pane);
})

$("#webTabs")?.addEventListener("keydown", e => {
    const idx = TAB_ORDER.indexOf(activePane());
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const delta = e.key === "ArrowLeft" ? -1 : 1;
        showPane(TAB_ORDER[(idx + delta + TAB_ORDER.length) % TAB_ORDER.length])
    }
})

showPane('html');

function buildWebSrcDoc(withTests = false) {
    const html = ed_html.getValue();
    const css = ed_css.getValue();
    const js = ed_js.getValue();

    const tests = ($("#testArea")?.value || "").trim();

    return `
        <!DOCTYPE html>
        <html lang="en" dir="ltr">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                
                <style>
                    ${css}\n
                </style>
            </head>

            <body>
                ${html}

                <script>
                    try {
                        ${js}
                        ${withTests && tests ? `\n/* tests */\n${tests}` : ''}
                    } catch (e) {
                        console.error("Error in user code:", e);
                    }
                    
                <\/script>

            <\/body>
        <\/html>
    `
}

function runWeb(withTests = false) {
    preview.srcdoc = buildWebSrcDoc(withTests);
    logMessage(withTests ? "Run with Tests" : "Web Preview Updated");
}

$("#runWeb")?.addEventListener("click", () => runWeb(false));
$("#runTests")?.addEventListener("click", () => runWeb(true));
$('#openPreview')?.addEventListener('click', () => {
    const src = buildWebSrcDoc(false);
    const w = window.open("about:blank");
    w.document.open();
    w.document.write(src);
    w.document.close();
});

function projectJSON() {
    return {
        version: 1,
        kind: "web-only",
        assignement: $("#assignment")?.value || "",
        test: $("testArea")?.value || "",
        html: ed_html.getValue(),
        css: ed_css.getValue(),
        js: ed_js.getValue()
    };
}

function loadProject(data) {
    try {
        if ($("#assignment")) {
            $("#assignment").value = data.assignement || "";
        }
        if ($("#testArea")) {
            $("#testArea").value = data.test || "";
        }
        ed_html.setValue(data.html || "", -1);
        ed_css.setValue(data.css || "", -1);
        ed_js.setValue(data.js || "", -1);
        logMessage("Project loaded");
    } catch (e) {
        console.error(e);
        logMessage("Error loading project: " + e.message, 'error');
    }
}

function setDefaultContent() {
    ed_html.setValue(`
        <!-- Welcome Card -->
        <section class="card" style="max-width:520px;margin:24px auto;padding:18px;text-align:center">
            <h1>Welcome to the Project</h1>
            <p>This example runs locally in the browser.</p>
            <button id="btn">Try me</button>
        </section>
    `, -1)

    ed_css.setValue(`
        body{
            font-family:system-ui;
            background:#f7fafc;
            margin:0
        }
        h1{
            color:#0f172a;
        }
        #btn{
            padding:.75rem 1rem;
            border:0;
            border-radius:10px;
            background:#60a5fa;
            color:#08111f;
            font-weight:700
        }
    `, -1);

    ed_js.setValue(`
        document.getElementById('btn').addEventListener('click',()=>alert('Well done!'));
        console.logMessage('Hello from JavaScript!');
    `, -1);
}

function saveProject() {
    try {
        const data = JSON.stringify(projectJSON(), null, 2);
        localStorage.setItem(STORAGE_KEY, data);
        const blob = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'your-test-idea.json';
        a.click();
        logMessage('Saved locally and downloaded JSON file.');
    } catch (e) { logMessage('Unable to save: ' + e, 'error'); }
}

$('#saveBtn')?.addEventListener('click', saveProject);
$('#loadBtn')?.addEventListener('click', () => $('#openFile').click());
$('#openFile')?.addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const obj = JSON.parse(await f.text()); loadProject(obj); }
    catch (err) { logMessage('Invalid project file', 'error'); }
});

try {
    const cache = localStorage.getItem(STORAGE_KEY);
    if (cache) { loadProject(JSON.parse(cache)); }
    else { setDefaultContent(); }
} catch { setDefaultContent(); }

logMessage('Ready — Web-only Editor (HTML/CSS/JS) ✨');

function normalizeProject(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Not an object');

    // accept old/new shapes; fall back to empty strings
    const html = typeof raw.html === 'string' ? raw.html : (raw.web && raw.web.html) || '';
    const css = typeof raw.css === 'string' ? raw.css : (raw.web && raw.web.css) || '';
    const js = typeof raw.js === 'string' ? raw.js : (raw.web && raw.web.js) || '';

    return {
        version: 1,
        kind: 'web-only',
        assignment: typeof raw.assignment === 'string' ? raw.assignment : (raw.task || ''),
        test: typeof raw.test === 'string' ? raw.test : (raw.tests || ''),
        html, css, js
    };
}

function safeSetValue(id, val) {
    const el = document.getElementById(id);
    if (el) { el.value = val; }
    else { logMessage(`Warning: #${id} not found; skipped setting value`, 'warn'); }
}

function loadProject(raw) {
    const proj = normalizeProject(raw);
    safeSetValue('assignment', proj.assignment);
    safeSetValue('testArea', proj.test);
    if (typeof ed_html?.setValue === 'function') ed_html.setValue(proj.html, -1);
    if (typeof ed_css?.setValue === 'function') ed_css.setValue(proj.css, -1);
    if (typeof ed_js?.setValue === 'function') ed_js.setValue(proj.js, -1);
    logMessage('Project loaded.');
}

window.addEventListener('DOMContentLoaded', () => {
    try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            const obj = JSON.parse(cached);
            loadProject(obj);
        } else {
            // seed defaults if nothing cached
            if (!document.getElementById('assignment')) return;
            // your default seeding function if you have one:
            // setDefaultContent();
        }
    } catch (e) {
        logMessage('Skipping auto-restore: ' + e, 'warn');
    }
});