/* Clínica Janiky — interacções gerais */
(function () {
  "use strict";
  const WHATSAPP = "258870000060";

  // Ano no rodapé
  const ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

  // Cabeçalho com sombra ao rolar
  const header = document.querySelector(".header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Menu móvel
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }

  // Revelação ao rolar
  const els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add("is-in"));
  }

  // Formulário de marcação → WhatsApp
  const form = document.getElementById("bookingForm");
  if (form) {
    const dateInput = form.querySelector('input[name="data"]');
    const today = new Date();
    const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.min = iso;

    // Botões que pré-seleccionam o serviço
    document.querySelectorAll("[data-servico]").forEach((b) =>
      b.addEventListener("click", () => { form.servico.value = b.dataset.servico; })
    );

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const err = document.getElementById("formErr");
      const req = ["nome", "telefone", "servico", "data"];
      let ok = true;
      req.forEach((n) => {
        const f = form.elements[n];
        const bad = !f.value.trim();
        f.classList.toggle("is-invalid", bad);
        if (bad) ok = false;
      });
      const tel = form.telefone.value.replace(/\D/g, "");
      if (tel && tel.length < 9) { form.telefone.classList.add("is-invalid"); ok = false; }
      if (!ok) { err.textContent = "Por favor, preencha os campos assinalados."; return; }
      err.textContent = "";

      const [y, m, d] = form.data.value.split("-");
      const msg =
        "Olá Clínica Janiky! Gostaria de marcar uma consulta.\n\n" +
        "*Nome:* " + form.nome.value.trim() + "\n" +
        "*Telefone:* " + form.telefone.value.trim() + "\n" +
        "*Serviço:* " + form.servico.value + "\n" +
        "*Data preferida:* " + d + "/" + m + "/" + y + " (" + form.periodo.value + ")" +
        (form.obs.value.trim() ? "\n*Observações:* " + form.obs.value.trim() : "");
      window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });
  }
})();
