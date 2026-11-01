// Questionnaire for Eduardo: answers travel to Leo by WhatsApp or copy; a draft stays in this browser.
const FLAVORS = [
    ["Fresa", "#EE8FA8"],
    ["Mango", "#F3C443"],
    ["Taro", "#A985D1"],
    ["Chocolate", "#8A5A3C"],
    ["Oreo", "#6E6E6E"],
    ["Vainilla", "#E3CC8A"],
  ];

  // One entry per question; `extra` adds a free-text box for details.
  const SECTIONS = [
    { title: "Productos y precios", items: [
      { id: "venta", q: "¿Vendes por pieza, por caja o ambos?", type: "radio", opts: ["Por pieza", "Por caja", "Ambos"], extra: "Si es por caja, ¿cuántas piezas trae?" },
      { id: "sabores", q: "¿Qué sabores manejas hoy?", type: "flavors", extra: "¿Otros sabores o de temporada?" },
      { id: "escalones", q: "¿El precio de mayoreo baja según la cantidad?", type: "text", area: true, placeholder: "Ej.: de 40 a 99 piezas $__ c/u, de 100 en adelante $__ c/u" },
      { id: "mayoreo", q: "Para el precio de mayoreo, ¿qué cuenta?", hint: "Ej.: 20 de fresa + 20 de mango = 40 piezas. ¿Le toca precio de mayoreo?", type: "radio", opts: ["El total del pedido", "Cada sabor por separado", "No estoy seguro"] },
      { id: "especial", q: "¿Algún distribuidor tiene precio especial?", type: "radio", opts: ["Sí", "No"], extra: "¿Cuál y de cuánto? (sin teléfonos aquí)" },
      { id: "publico", q: "¿A cuánto das la pieza suelta al público? ¿Y en eventos?", type: "text", placeholder: "Ej.: público $__ c/u, eventos $__ c/u" },
    ]},
    { title: "Pedidos y entregas", items: [
      { id: "minimo", q: "¿Sigue siendo mínimo 40 piezas, con 24 a 48 h de anticipación?", type: "radio", opts: ["Sí, así es", "Cambió"], extra: "¿Cómo es ahora?" },
      { id: "canales", q: "¿A quién más le vendes?", hint: "Marca todos los que apliquen.", type: "check", opts: ["Público", "Eventos", "Solo distribuidores"] },
      { id: "anotar", q: "¿Quieres anotar en la app las ventas al público y eventos?", type: "radio", opts: ["Sí", "No"] },
      { id: "entrega", q: "¿Quién lleva los pedidos?", type: "radio", opts: ["Yo los entrego", "Pasan a recogerlos", "Las dos cosas"] },
      { id: "dias", q: "¿A qué ciudades entregas y qué días?", hint: "Ej.: Guadalajara cualquier día, Colima solo martes.", type: "text", area: true, placeholder: "Ciudad: días" },
      { id: "envio", q: "¿Cobras envío?", type: "radio", opts: ["Sí", "No", "Depende"], extra: "¿Cuánto y de qué depende? (ciudad, cantidad…)" },
      { id: "usuarios", q: "¿Alguien más anotaría pedidos en la app?", type: "radio", opts: ["Solo yo", "Alguien más"], extra: "¿Quién? (solo nombre)" },
    ]},
    { title: "Cobros", items: [
      { id: "pago", q: "¿Cuándo te pagan?", type: "radio", opts: ["Todos al recibir", "Algunos días después"], extra: "¿Cuántos días les das?" },
      { id: "abonos", q: "¿Aceptas abonos (una parte y luego el resto)?", type: "radio", opts: ["Sí", "No"] },
      { id: "consignacion", q: "¿Dejas producto a consignación (lo pagan cuando lo venden)?", type: "radio", opts: ["Sí", "No"] },
      { id: "devoluciones", q: "¿Te devuelven producto o repones piezas derretidas o dañadas?", type: "radio", opts: ["Seguido", "A veces", "Casi nunca"], extra: "¿Cómo lo resuelves? (cambias piezas, descuentas…)" },
      { id: "metodos", q: "¿Cómo te pagan?", hint: "Marca todos los que apliquen.", type: "check", opts: ["Efectivo", "Transferencia", "Tarjeta"] },
      { id: "factura", q: "¿Le das factura a alguien?", type: "radio", opts: ["Sí", "No", "A veces"] },
    ]},
    { title: "Gastos y ganancias", items: [
      { id: "gastos_hoy", q: "¿Anotas tus gastos hoy?", type: "radio", opts: ["Sí, todos", "Algunos", "No"] },
      { id: "gastos_cat", q: "¿En qué gastas para el negocio?", hint: "Marca todos los que apliquen.", type: "check", opts: ["Ingredientes", "Empaque", "Gasolina", "Hielo o refrigeración", "Renta", "Sueldos"], extra: "¿Otro gasto?" },
    ]},
    { title: "La app que usas hoy", items: [
      { id: "app", q: "¿Qué app usas hoy para tu administración?", type: "radio", opts: ["Treinta", "Otra", "Ninguna"], extra: "Si es otra, ¿cuál? ¿Usas también libreta o Excel?" },
      { id: "app_usos", q: "¿Para qué la usas?", hint: "Marca todos los que apliquen.", type: "check", opts: ["Ventas", "Gastos", "Deudas o fiados", "Inventario", "Clientes", "Proveedores"] },
      { id: "app_plan", q: "¿Pagas algún plan?", type: "radio", opts: ["Gratis", "Básico", "Pro", "No sé"], extra: "¿Desde cuándo la usas?" },
      { id: "app_opinion", q: "¿Qué te gusta de esa app y qué le falta?", type: "text", area: true, placeholder: "Lo que te funciona y lo que te desespera" },
      { id: "app_descarga", q: "¿Ves en la app alguna opción para descargar tus datos o reportes (por ejemplo, en Excel)?", type: "radio", opts: ["Sí", "No", "No sé"], extra: "Si la ves, ¿en qué parte está?" },
      { id: "app_traer", q: "¿Qué quieres pasar a la app nueva?", hint: "Marca todos los que apliquen.", type: "check", opts: ["Clientes", "Productos y precios", "Deudas pendientes", "Ventas pasadas", "Gastos pasados"] },
    ]},
    { title: "Tu día a día", items: [
      { id: "dolor", q: "¿Qué es lo que más trabajo te da hoy?", type: "radio", opts: ["Anotar pedidos", "Acordarme de quién me debe", "Organizar las entregas", "Saber cuánto gané"], extra: "¿Algo más?" },
      { id: "celular", q: "¿Qué celulares usan en el negocio?", hint: "Marca todos los que apliquen.", type: "check", opts: ["Android", "iPhone"] },
    ]},
    { title: "Más adelante", note: "Opcional. Son ideas para después; contesta solo las que quieras.", items: [
      { id: "inventario", q: "¿Llevas la cuenta de cuántos mochis tienes hechos por sabor?", type: "radio", opts: ["Sí", "A veces", "No"], optional: true },
      { id: "produccion", q: "¿Cada cuándo produces y cuántas piezas por tanda?", type: "text", placeholder: "Ej.: lunes y jueves, 300 piezas", optional: true },
      { id: "caducidad", q: "¿Cuánto dura un mochi congelado? ¿Se te ha caducado producto?", type: "text", placeholder: "Ej.: 2 meses; a veces se me pasa", optional: true },
      { id: "costo", q: "¿Sabes cuánto te cuesta hacer cada mochi?", type: "radio", opts: ["Sí", "Más o menos", "No"], optional: true },
      { id: "avisos", q: "¿Qué avisos te gustaría que te diera la app?", hint: "Marca todos los que apliquen.", type: "check", opts: ["Producto por caducar", "Poco de un sabor", "Clientes que me deben", "Pedidos de mañana"], optional: true },
      { id: "pegar", q: "¿Te serviría pegar el mensaje de WhatsApp del cliente y que la app arme el pedido sola?", type: "radio", opts: ["Sí", "No", "No sé"], optional: true },
      { id: "autoservicio", q: "¿Te serviría que tus distribuidores pidan solos desde la app?", type: "radio", opts: ["Sí", "No", "No sé"], optional: true },
    ]},
    { title: "Para entrar a la app", items: [
      { id: "correo", q: "¿Qué correo quieres usar para entrar?", type: "email", placeholder: "tucorreo@ejemplo.com" },
      { id: "comentarios", q: "¿Algo más que deba saber?", type: "text", area: true, placeholder: "Lo que se te ocurra de cómo trabajas", optional: true },
    ]},
  ];
  const ITEMS = SECTIONS.flatMap((s) => s.items);
  const DRAFT_KEY = "amai-cuestionario-borrador";
  const form = document.getElementById("form");

  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    }
    for (const kid of kids) if (kid) n.append(kid);
    return n;
  }

  function option(type, name, value, id, swatch) {
    const span = el("span");
    if (swatch)
      span.append(el("i", { class: "dot", style: `background:${swatch}` }));
    span.append(value);
    return el(
      "label",
      { class: "opt", for: id },
      el("input", { type, name, value, id }),
      span,
    );
  }

  function render() {
    for (const s of SECTIONS) {
      const sec = el(
        "section",
        {},
        el("h2", { text: s.title }),
        s.note ? el("p", { class: "intro", text: s.note }) : null,
      );
      for (const it of s.items) {
        const box = el("div", { class: "q" });
        const inputId = `q-${it.id}`;
        if (it.type === "text" || it.type === "email") {
          box.append(el("label", { for: inputId, text: it.q }));
        } else {
          box.append(
            el("div", { class: "qt", id: `${inputId}-t`, text: it.q }),
          );
        }
        if (it.hint) box.append(el("div", { class: "hint", text: it.hint }));
        if (
          it.type === "radio" ||
          it.type === "check" ||
          it.type === "flavors"
        ) {
          const list =
            it.type === "flavors" ? FLAVORS : it.opts.map((o) => [o]);
          const kind = it.type === "radio" ? "radio" : "checkbox";
          const opts = el("div", {
            class: "opts",
            role: "group",
            "aria-labelledby": `${inputId}-t`,
          });
          list.forEach(([o, c], i) =>
            opts.append(option(kind, it.id, o, `${inputId}-${i}`, c)),
          );
          box.append(opts);
        } else if (it.area) {
          box.append(
            el("textarea", {
              id: inputId,
              name: it.id,
              placeholder: it.placeholder || "",
            }),
          );
        } else {
          box.append(
            el("input", {
              id: inputId,
              name: it.id,
              type: it.type,
              placeholder: it.placeholder || "",
              autocomplete: it.type === "email" ? "email" : "off",
            }),
          );
        }
        if (it.extra) {
          box.append(
            el("input", {
              type: "text",
              id: `${inputId}-extra`,
              name: `${it.id}_extra`,
              placeholder: it.extra,
              "aria-label": it.extra,
            }),
          );
        }
        sec.append(box);
      }
      form.append(sec);
    }
    form.append(
      el(
        "div",
        { class: "note" },
        el("strong", { text: "Por WhatsApp, cuando puedas:" }),
        el(
          "ul",
          {},
          el("li", { text: "Tu lista de precios actual." }),
          el("li", {
            text: "La lista de tus distribuidores (nombre, zona y teléfono).",
          }),
          el("li", { text: "Tu logo original en buena calidad." }),
        ),
      ),
      el(
        "div",
        { class: "actions" },
        el("a", {
          class: "btn primary",
          id: "send",
          href: "https://wa.me/",
          target: "_blank",
          rel: "noopener",
          text: "Enviar a Leo por WhatsApp",
        }),
        el("button", {
          type: "button",
          class: "btn ghost",
          id: "copy",
          text: "Copiar respuestas",
        }),
      ),
      el("p", { class: "status", id: "status", role: "status" }),
      el("p", {
        class: "fine",
        id: "fine",
        text: "Tus respuestas se quedan en este teléfono mientras las llenas.",
      }),
    );
  }

  function answers() {
    const fd = new FormData(form);
    const out = {};
    for (const it of ITEMS) {
      const main = fd
        .getAll(it.id)
        .map(String)
        .filter((v) => v.trim());
      const extra = String(fd.get(`${it.id}_extra`) || "").trim();
      out[it.id] = { main, extra };
    }
    return out;
  }

  function answered(a) {
    return ITEMS.filter(
      (it) => !it.optional && (a[it.id].main.length || a[it.id].extra),
    ).length;
  }

  function updateProgress() {
    const a = answers();
    const total = ITEMS.filter((it) => !it.optional).length;
    const done = answered(a);
    document.getElementById("count").textContent = `${done} de ${total}`;
    document.getElementById("bar").style.width = `${(done / total) * 100}%`;
    document.getElementById("send").href =
      `https://wa.me/?text=${encodeURIComponent(summary(a))}`;
    return a;
  }

  function summary(a) {
    const lines = ["*Cuestionario Amai Mochi*"];
    let n = 0;
    for (const s of SECTIONS) {
      const block = [];
      for (const it of s.items) {
        n += 1;
        const { main, extra } = a[it.id];
        const given = [main.join(", "), extra].filter(Boolean).join(" — ");
        if (!given && it.optional) continue;
        block.push(`${n}. ${it.q} ${given || "(sin respuesta)"}`);
      }
      if (block.length) lines.push("", `*${s.title}*`, ...block);
    }
    return lines.join("\n");
  }

  function setStatus(msg, isError = false) {
    const s = document.getElementById("status");
    s.textContent = msg;
    s.classList.toggle("err", isError);
  }

  // Per-phone draft, so a half-filled form survives closing the tab.
  function saveDraft(a) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(a));
    } catch {}
  }
  function loadDraft() {
    let a = null;
    try {
      a = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    } catch {}
    if (!a) return;
    for (const it of ITEMS) {
      const v = a[it.id];
      if (!v) continue;
      form.querySelectorAll(`[name="${it.id}"]`).forEach((inp) => {
        if (inp.type === "radio" || inp.type === "checkbox")
          inp.checked = v.main.includes(inp.value);
        else inp.value = v.main[0] || "";
      });
      const ex = form.querySelector(`[name="${it.id}_extra"]`);
      if (ex) ex.value = v.extra || "";
    }
  }

  function submitAll() {
    saveDraft(updateProgress());
  }

  render();
  loadDraft();
  updateProgress();

  // Saved on every change, so closing the tab right after a tap keeps it.
  form.addEventListener("input", () => saveDraft(updateProgress()));
  form.addEventListener("submit", (e) => e.preventDefault());

  // A real link, so the phone opens WhatsApp from the tap itself.
  document.getElementById("send").addEventListener("click", async () => {
    setStatus(
      "Se abrió WhatsApp: elige a Leo y envía. Si no se abrió, usa «Copiar respuestas».",
    );
    submitAll();
  });

  document.getElementById("copy").addEventListener("click", async () => {
    const text = summary(answers());
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copiado. Pégalo en el chat con Leo.");
    } catch {
      const ta = el("textarea", {
        readonly: "",
        "aria-label": "Respuestas para copiar",
      });
      ta.value = text;
      document.getElementById("status").after(ta);
      ta.select();
      setStatus("Selecciona el texto de abajo y cópialo.", true);
    }
    submitAll();
  });
