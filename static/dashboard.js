fetch("/config")
  .then(r => r.json())
  .then(cfg => {
    document.getElementById("firm-name").textContent = cfg.firm_name;
    document.title = cfg.firm_name + " — Policy & Compliance Q&A";
  })
  .catch(() => {
    document.getElementById("firm-name").textContent = "Policy Q&A";
  });

function ask(text) {
  document.getElementById("input").value = text;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById("input");
  const chat = document.getElementById("chat");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  // User bubble
  const userMsg = document.createElement("div");
  userMsg.className = "msg user";
  userMsg.innerHTML = `<div class="bubble">${escHtml(text)}</div>`;
  chat.appendChild(userMsg);

  // Typing indicator
  const typing = document.createElement("div");
  typing.className = "msg bot";
  typing.innerHTML = `<div class="bubble typing">Looking up policy…</div>`;
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    typing.remove();

    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";

    let html = `<div class="bubble">${escHtml(data.text)}</div>`;
    chat.appendChild(botMsg);
    botMsg.innerHTML = html;

    if (data.chart) {
      botMsg.appendChild(renderChart(data.chart));
    }
  } catch (e) {
    typing.remove();
    const err = document.createElement("div");
    err.className = "msg bot";
    err.innerHTML = `<div class="bubble" style="color:#c00">Error reaching server. Is it running?</div>`;
    chat.appendChild(err);
  }

  chat.scrollTop = chat.scrollHeight;
}

function renderChart(chart) {
  const block = document.createElement("div");
  block.className = "chart-block";
  block.innerHTML = `<div class="chart-title">${escHtml(chart.title || "")}</div>`;

  if (chart.type === "donut") {
    // Simple donut fallback as bar
    const bars = chart.bars || chart.slices || [];
    const max = Math.max(...bars.map(b => b.value), 1);
    bars.forEach(b => {
      const pct = Math.round((b.value / max) * 100);
      block.innerHTML += `
        <div class="bar-row">
          <div class="bar-label">${escHtml(b.label)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${b.color||'#0078D4'}"></div></div>
          <div class="bar-val">${b.value}%</div>
        </div>`;
    });
  } else {
    const bars = chart.bars || [];
    const max = Math.max(...bars.map(b => b.value), 1);
    bars.forEach(b => {
      const pct = Math.round((b.value / max) * 100);
      const label = typeof b.value === "number" && b.value > 999
        ? b.value.toLocaleString()
        : String(b.value);
      block.innerHTML += `
        <div class="bar-row">
          <div class="bar-label">${escHtml(b.label)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${b.color||'#0078D4'}"></div></div>
          <div class="bar-val">${label}</div>
        </div>`;
    });
  }

  return block;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
