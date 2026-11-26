/* =========================================================
   Fada — médica dentista e assistente virtual da Clínica Janiky
   Chatbot por regras (sem servidor). Para actualizar dados,
   edite apenas o objecto CLINICA abaixo.
   ========================================================= */
(function () {
  "use strict";

  const CLINICA = {
    nome: "Clínica Janiky",
    telefone: "+258 87 000 0060",
    tel: "+258870000060",
    whatsapp: "258870000060",
    email: "geral@clinicajaniky.com",
    morada: "Bairro Eduardo Mondlane – Expansão, Cidade da Maxixe, Inhambane",
    mapa: "https://www.google.com/maps/search/?api=1&query=Bairro+Eduardo+Mondlane+Maxixe+Inhambane",
    horario: "Estamos abertos 24 horas por dia, 7 dias por semana — incluindo feriados.",
    facebook: "https://www.facebook.com/clinicajaniky",
    // Preços conhecidos (actualize aqui). Os restantes são confirmados pela recepção.
    precos: {
      "Ginecologia": "1.200 MT (consulta)"
    },
    servicos: {
      "Clínica geral": "Consultas de medicina geral para adultos e crianças, 24 horas por dia.",
      "Ginecologia": "Saúde da mulher: consultas de rotina, prevenção, planeamento familiar e acompanhamento.",
      "Obstetrícia / Ecografia 4D": "Acompanhamento da gravidez com ecografia 4D — veja o seu bebé em tempo real e em alta definição.",
      "Estomatologia": "Saúde oral: limpezas, restaurações, extracções e prevenção.",
      "Ortodontia": "Colocação e manutenção de aparelhos ortodônticos.",
      "Próteses dentárias": "Próteses fixas e removíveis para recuperar o seu sorriso."
    }
  };

  // ---------- utilidades ----------
  const $ = (id) => document.getElementById(id);
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const waLink = (txt) => "https://wa.me/" + CLINICA.whatsapp + (txt ? "?text=" + encodeURIComponent(txt) : "");
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignorar */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignorar */ } }
  };

  function saudacao() {
    const h = new Date().getHours();
    return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  }

  const MENU = ["Marcar consulta", "Serviços", "Preços", "Horário", "Localização", "Falar com a recepção"];

  // ---------- intenções ----------
  const INTENTS = [
    {
      id: "emergencia",
      kw: ["emergencia", "urgencia", "urgente", "socorro", "sangra", "sangramento", "hemorragia", "desmai", "nao respira", "falta de ar", "dor forte", "muita dor", "convuls", "acidente", "perdi agua", "rebentou a bolsa", "bolsa rompeu", "contracoes"],
      weight: 3,
      reply: () => ({
        html: "⚠️ <strong>Se é uma emergência, não espere.</strong><br>Dirija-se já à clínica — estamos abertos <strong>24 horas</strong> — ou ligue agora:<br><a class='msg__btn' href='tel:" + CLINICA.tel + "'>📞 Ligar " + CLINICA.telefone + "</a><br><small>Se não conseguir deslocar-se, peça ajuda a alguém próximo ou contacte o serviço de emergência mais próximo.</small>",
        chips: ["Localização", "Horário"]
      })
    },
    {
      id: "marcar",
      kw: ["marcar", "marcacao", "agendar", "agendamento", "consulta", "reservar", "vaga", "atendimento", "quero ser atendid", "ser visto"],
      reply: (text) => { startBooking(findServico(text || "")); return null; }
    },
    {
      id: "eco",
      kw: ["ecografia", "eco 4d", "4d", "ultrassom", "ultra som", "ver o bebe", "ver meu bebe", "ecografia 4d"],
      weight: 2,
      reply: () => ({
        html: "👶 A nossa <strong>ecografia 4D</strong> mostra o seu bebé em movimento, com imagens tridimensionais em alta definição. É um exame com ultra-sons (sem radiação) e faz parte do acompanhamento da gravidez. O médico indica a melhor semana para a fazer.<br>Quer marcar?",
        chips: ["Marcar ecografia", "Preços", "Outra pergunta"]
      })
    },
    {
      id: "gravidez",
      kw: ["gravida", "gravidez", "gestante", "pre natal", "prenatal", "obstetr", "parto", "bebe", "semanas de gestacao"],
      reply: () => ({
        html: "🤰 Acompanhamos toda a gravidez em <strong>Obstetrícia</strong>, com consultas pré-natais e <strong>ecografia 4D</strong>. Cada momento conta — e vai ficar tudo bem! 💙",
        chips: ["Marcar consulta", "Ecografia 4D", "Preços"]
      })
    },
    {
      id: "gineco",
      kw: ["ginecolog", "ginecologista", "saude da mulher", "papanicolau", "preventivo", "menstrua", "planeamento familiar", "contracep", "corrimento"],
      reply: () => ({
        html: "🌸 Em <strong>Ginecologia</strong> cuidamos da saúde da mulher: consultas de rotina, prevenção, planeamento familiar e acompanhamento personalizado." + (CLINICA.precos["Ginecologia"] ? "<br>Valor indicativo: <strong>" + CLINICA.precos["Ginecologia"] + "</strong> (confirme na recepção)." : ""),
        chips: ["Marcar ginecologia", "Horário", "Localização"]
      })
    },
    {
      id: "orto",
      kw: ["ortodont", "aparelho", "aparelhos", "dentes tortos", "alinhar", "brackets", "manutencao do aparelho"],
      reply: () => ({
        html: "😁 Em <strong>Ortodontia</strong> fazemos a colocação e a manutenção de aparelhos ortodônticos para um sorriso alinhado. A primeira consulta serve para avaliar o caso e definir o plano de tratamento.",
        chips: ["Marcar ortodontia", "Preços", "Outra pergunta"]
      })
    },
    {
      id: "protese",
      kw: ["protese", "proteses", "dentadura", "perdi dente", "falta de dente", "coroa", "implante"],
      reply: () => ({
        html: "🦷 Fazemos <strong>próteses dentárias</strong> fixas e removíveis para recuperar a mastigação e a confiança no sorriso. Na consulta, o especialista indica a melhor solução para si.",
        chips: ["Marcar consulta", "Preços"]
      })
    },
    {
      id: "dentes",
      kw: ["dente", "dentes", "dentista", "estomatolog", "dor de dente", "carie", "extrac", "tirar dente", "limpeza", "gengiva", "boca"],
      reply: () => ({
        html: "🪥 Em <strong>Estomatologia</strong> tratamos da sua saúde oral: limpezas, restaurações, extracções e prevenção. Também temos <strong>ortodontia</strong> e <strong>próteses dentárias</strong>.<br>Se tem dor forte, pode vir directamente — estamos abertos 24h.",
        chips: ["Marcar estomatologia", "Ortodontia", "Próteses"]
      })
    },
    {
      id: "servicos",
      kw: ["servico", "servicos", "especialidade", "especialidades", "o que fazem", "que oferecem", "tratamentos", "medico", "medicos", "clinica geral"],
      reply: () => ({
        html: "Estes são os nossos serviços:<br>" + Object.entries(CLINICA.servicos).map(([k, v]) => "• <strong>" + k + "</strong> — " + v).join("<br>") + "<br>Sobre qual quer saber mais?",
        chips: ["Ginecologia", "Ecografia 4D", "Estomatologia", "Ortodontia", "Marcar consulta"]
      })
    },
    {
      id: "precos",
      kw: ["preco", "precos", "quanto custa", "custa", "valor", "valores", "pagar", "pagamento", "tabela", "caro", "barato", "mt", "meticais", "dinheiro"],
      reply: () => {
        const known = Object.entries(CLINICA.precos);
        return {
          html: "💳 " + (known.length ? "Valores que conheço:<br>" + known.map(([k, v]) => "• <strong>" + k + "</strong>: " + v).join("<br>") + "<br><br>" : "") +
            "Os preços dos restantes serviços dependem de cada caso. A recepção confirma o valor exacto rapidamente:<br><a class='msg__btn' target='_blank' rel='noopener' href='" + waLink("Olá! Gostaria de saber o preço de um serviço.") + "'>💬 Pedir preço no WhatsApp</a>",
          chips: ["Marcar consulta", "Serviços"]
        };
      }
    },
    {
      id: "seguro",
      kw: ["seguro", "seguradora", "convenio", "plano de saude", "mpesa", "m pesa", "emola", "cartao", "pos", "transferencia"],
      reply: () => ({
        html: "Para formas de pagamento (M-Pesa, e-Mola, cartão, transferência) e seguros aceites, a recepção dá-lhe a informação actualizada:<br><a class='msg__btn' target='_blank' rel='noopener' href='" + waLink("Olá! Que formas de pagamento e seguros aceitam?") + "'>💬 Perguntar no WhatsApp</a>",
        chips: ["Preços", "Marcar consulta"]
      })
    },
    {
      id: "horario",
      kw: ["horario", "hora", "horas", "aberto", "abrem", "fecham", "fecha", "funciona", "domingo", "sabado", "feriado", "noite", "24"],
      reply: () => ({ html: "🕒 " + CLINICA.horario + " Pode contar connosco a qualquer hora.", chips: ["Marcar consulta", "Localização"] })
    },
    {
      id: "local",
      kw: ["onde", "localiza", "endereco", "morada", "fica", "chegar", "mapa", "bairro", "maxixe", "direccao", "direcao"],
      reply: () => ({
        html: "📍 Estamos no <strong>" + CLINICA.morada + "</strong>.<br><a class='msg__btn' target='_blank' rel='noopener' href='" + CLINICA.mapa + "'>🗺️ Abrir no mapa</a>",
        chips: ["Horário", "Contactos"]
      })
    },
    {
      id: "contacto",
      kw: ["contacto", "contato", "telefone", "numero", "ligar", "email", "e mail", "whatsapp", "falar com", "recepcao", "humano", "pessoa", "atendente"],
      reply: () => ({
        html: "📞 Telefone/WhatsApp: <a href='tel:" + CLINICA.tel + "'>" + CLINICA.telefone + "</a><br>✉️ Email: <a href='mailto:" + CLINICA.email + "'>" + CLINICA.email + "</a><br><a class='msg__btn' target='_blank' rel='noopener' href='" + waLink("Olá! Vim através do site da Clínica Janiky.") + "'>💬 Falar com a recepção</a>",
        chips: ["Marcar consulta", "Localização"]
      })
    },
    {
      id: "emprego",
      kw: ["emprego", "vaga de emprego", "trabalhar", "contratar", "curriculo", "cv", "estagio", "recrutamento"],
      reply: () => ({
        html: "Obrigada pelo interesse em fazer parte da equipa! 💼 Envie o seu CV para <a href='mailto:" + CLINICA.email + "?subject=Candidatura'>" + CLINICA.email + "</a> e acompanhe os anúncios na nossa <a href='" + CLINICA.facebook + "' target='_blank' rel='noopener'>página do Facebook</a>.",
        chips: ["Outra pergunta"]
      })
    },
    {
      id: "quem",
      kw: ["quem es", "quem e voce", "quem e vc", "teu nome", "seu nome", "es um robo", "e um robo", "fada"],
      reply: () => ({ html: "Sou a <strong>Fada</strong> 🦷, médica dentista e assistente virtual da Clínica Janiky. Ajudo com marcações, serviços, horários e contactos. Por aqui dou apenas informações gerais — para avaliar o seu caso, a nossa equipa está sempre disponível.", chips: MENU.slice(0, 4) })
    },
    {
      id: "adeus",
      kw: ["tchau", "adeus", "ate logo", "ate mais", "nao obrigado", "e tudo", "so isso", "bye"],
      reply: () => ({ html: "Até breve! Cuide-se bem. 💙 Estarei aqui sempre que precisar.", chips: [] })
    },
    {
      id: "obrigado",
      kw: ["obrigad", "obg", "valeu", "agradeco", "khanimambo", "kanimambo"],
      reply: () => ({ html: pick(["De nada! 💙 Vai ficar tudo bem.", "Foi um prazer ajudar! 😊", "Sempre às ordens! 😊"]) + " Posso ajudar em mais alguma coisa?", chips: ["Marcar consulta", "Não, obrigado"] })
    },
    {
      id: "ola",
      kw: ["ola", "oi", "bom dia", "boa tarde", "boa noite", "hello", "salaam", "hey", "saudacoes"],
      reply: () => ({ html: saudacao() + "! 😊 Em que posso ajudar hoje?", chips: MENU })
    },
    {
      id: "sintomas",
      kw: ["febre", "dor", "tosse", "gripe", "malaria", "diarreia", "vomit", "doente", "sintoma", "estou mal", "me sinto mal", "tonturas", "dor de cabeca"],
      reply: () => ({
        html: "Lamento que não se esteja a sentir bem. 💙 Não consigo fazer diagnósticos, mas os nossos médicos podem observá-lo — estamos abertos <strong>24 horas</strong>.<br>Se os sintomas forem fortes (febre muito alta, dificuldade em respirar, sangramento), venha já à clínica ou ligue <a href='tel:" + CLINICA.tel + "'>" + CLINICA.telefone + "</a>.",
        chips: ["Marcar consulta", "Localização", "Emergência"]
      })
    }
  ];

  function detect(text) {
    const t = " " + norm(text) + " ";
    let best = null, bestScore = 0;
    for (const it of INTENTS) {
      let s = 0;
      for (const k of it.kw) {
        const kk = norm(k);
        if (kk.length <= 3 ? new RegExp("\\b" + kk + "\\b").test(t) : t.includes(kk)) s += kk.length > 6 ? 2 : 1;
      }
      s *= it.weight || 1;
      if (s > bestScore) { bestScore = s; best = it; }
    }
    return best;
  }

  // ---------- fluxo de marcação ----------
  let flow = null; // {step, data:{}}
  const SERVICOS = Object.keys(CLINICA.servicos);

  function startBooking(servico) {
    flow = { step: "nome", data: {} };
    if (servico) flow.data.servico = servico;
    bot("Óptimo, vamos marcar a sua consulta! 📅<br>Para começar, qual é o seu <strong>nome</strong>?", ["Cancelar"]);
  }

  function findServico(text) {
    const t = " " + norm(text) + " ";
    const map = [
      ["Ginecologia", ["gineco", "mulher"]],
      ["Obstetrícia / Ecografia 4D", ["ecograf", " eco ", "4d", "obstet", "gravid", "pre natal", "bebe"]],
      ["Ortodontia", ["orto", "aparelho"]],
      ["Próteses dentárias", ["protese", "dentadura"]],
      ["Estomatologia", ["estoma", "dente", "dentista", "boca"]],
      ["Clínica geral", ["geral", "clinic", "medico", "febre", "malaria"]]
    ];
    for (const [nome, kws] of map) if (kws.some((k) => t.includes(k))) return nome;
    return null;
  }

  function parseData(text) {
    const t = norm(text);
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const add = (n) => { const d = new Date(hoje); d.setDate(d.getDate() + n); return d; };
    if (/\bhoje\b/.test(t)) return add(0);
    if (/depois de amanha/.test(t)) return add(2);
    if (/\bamanha\b/.test(t)) return add(1);
    const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    for (let i = 0; i < 7; i++) if (t.includes(dias[i])) { let diff = (i - hoje.getDay() + 7) % 7; if (diff === 0) diff = 7; return add(diff); }
    const m = t.match(/(\d{1,2})\s*(?:\/|-|\s|de\s)\s*(\d{1,2})(?:\s*(?:\/|-|\s)\s*(\d{2,4}))?/);
    if (m) {
      let y = m[3] ? +m[3] : hoje.getFullYear(); if (y < 100) y += 2000;
      const d = new Date(y, +m[2] - 1, +m[1]);
      if (!m[3] && d < hoje) d.setFullYear(y + 1);
      if (!isNaN(d) && d.getDate() === +m[1]) return d;
    }
    const meses = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const m2 = t.match(/(\d{1,2})\s*(?:de\s*)?([a-z]+)/);
    if (m2) {
      const mi = meses.findIndex((x) => m2[2].startsWith(x.slice(0, 3)));
      if (mi >= 0) { const d = new Date(hoje.getFullYear(), mi, +m2[1]); if (d < hoje) d.setFullYear(d.getFullYear() + 1); return d; }
    }
    return null;
  }
  const fmt = (d) => d.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });

  function handleFlow(text) {
    const t = norm(text);
    if (/^(cancelar|cancela|sair|parar)$/.test(t)) { flow = null; bot("Marcação cancelada. Em que mais posso ajudar?", MENU); return true; }
    const d = flow.data;
    switch (flow.step) {
      case "nome": {
        const nome = text.trim().replace(/^(o meu nome e|meu nome e|chamo-me|sou o|sou a|sou)\s+/i, "");
        if (nome.length < 2 || nome.length > 60) { bot("Pode indicar o seu nome, por favor?"); return true; }
        d.nome = nome.charAt(0).toUpperCase() + nome.slice(1);
        if (d.servico) { flow.step = "data"; bot("Prazer, " + esc(d.nome.split(" ")[0]) + "! 😊 Para <strong>" + d.servico + "</strong>, que <strong>dia</strong> prefere?", ["Hoje", "Amanhã", "Segunda-feira"]); }
        else { flow.step = "servico"; bot("Prazer, " + esc(d.nome.split(" ")[0]) + "! 😊 Qual é o <strong>serviço</strong> que pretende?", SERVICOS); }
        return true;
      }
      case "servico": {
        const s = SERVICOS.find((x) => norm(x) === t) || findServico(text);
        if (!s) { bot("Não percebi bem o serviço. Escolha uma das opções:", SERVICOS); return true; }
        d.servico = s; flow.step = "data";
        bot("Boa escolha: <strong>" + s + "</strong>. Que <strong>dia</strong> prefere? (ex.: amanhã, sexta, 12/12)", ["Hoje", "Amanhã", "Segunda-feira"]);
        return true;
      }
      case "data": {
        const dt = parseData(text);
        if (!dt) { bot("Não consegui perceber a data. Pode escrever, por exemplo, <em>amanhã</em>, <em>sexta</em> ou <em>15/12</em>?", ["Hoje", "Amanhã"]); return true; }
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        if (dt < hoje) { bot("Essa data já passou 🙂 Indique uma data a partir de hoje.", ["Hoje", "Amanhã"]); return true; }
        d.data = fmt(dt); flow.step = "periodo";
        bot("Anotado: <strong>" + d.data + "</strong>. Prefere de <strong>manhã, tarde ou noite</strong>?", ["Manhã", "Tarde", "Noite"]);
        return true;
      }
      case "periodo": {
        const p = t.includes("manh") ? "Manhã" : t.includes("tard") ? "Tarde" : t.includes("noit") ? "Noite" : null;
        if (!p) { bot("Escolha um período, por favor:", ["Manhã", "Tarde", "Noite"]); return true; }
        d.periodo = p; flow.step = "telefone";
        bot("Por último, qual é o seu <strong>número de telefone</strong> para confirmarmos?", ["Cancelar"]);
        return true;
      }
      case "telefone": {
        const num = text.replace(/[^\d+]/g, "");
        if (num.replace(/\D/g, "").length < 9) { bot("O número parece incompleto. Pode verificar? (ex.: 84 123 4567)"); return true; }
        d.telefone = num; flow.step = "confirmar";
        bot("Confirme os dados da marcação:<br>👤 <strong>" + esc(d.nome) + "</strong><br>🩺 " + d.servico + "<br>📅 " + d.data + " (" + d.periodo + ")<br>📞 " + esc(d.telefone) + "<br><br>Está tudo certo?", ["Sim, enviar", "Corrigir"]);
        return true;
      }
      case "confirmar": {
        if (/^(sim|s|ok|confirmo|certo|enviar|sim enviar|esta|esta certo)/.test(t)) {
          const msg = "Olá Clínica Janiky! Gostaria de marcar uma consulta (pedido feito através da Fada no site).\n\n*Nome:* " + d.nome + "\n*Telefone:* " + d.telefone + "\n*Serviço:* " + d.servico + "\n*Data preferida:* " + d.data + " (" + d.periodo + ")";
          flow = null;
          bot("Perfeito! ✅ Toque no botão para enviar o pedido à recepção pelo WhatsApp. A equipa confirma a hora consigo.<br><a class='msg__btn' target='_blank' rel='noopener' href='" + waLink(msg) + "'>💬 Enviar marcação</a><br><small>Vai ficar tudo bem! 💙</small>", ["Outra pergunta", "Localização"]);
        } else { startBooking(); }
        return true;
      }
    }
    return false;
  }

  // ---------- UI ----------
  const root = $("fada"), panel = $("fadaPanel"), msgs = $("fadaMsgs"), chips = $("fadaChips");
  const form = $("fadaForm"), input = $("fadaText"), launcher = $("fadaLauncher"), bubble = $("fadaBubble");
  if (!root) return;
  const KEY = "janiky_fada_hist_v3";
  let history = store.get(KEY) || [];

  function render(m, animate) {
    const el = document.createElement("div");
    if (m.who === "bot") {
      el.className = "msg__row";
      el.innerHTML = "<img src='assets/fada.svg' alt=''><div class='msg msg--bot'>" + m.html + "</div>";
    } else {
      el.className = "msg msg--user";
      el.textContent = m.text;
    }
    if (!animate) el.style.animation = "none";
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function setChips(list) {
    chips.innerHTML = "";
    (list || []).forEach((c) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = c;
      b.addEventListener("click", () => send(c));
      chips.appendChild(b);
    });
  }
  function save(m) { history.push(m); if (history.length > 60) history = history.slice(-60); store.set(KEY, history); }

  let queue = Promise.resolve();
  function bot(html, chipList) {
    queue = queue.then(() => new Promise((res) => {
      const t = document.createElement("div");
      t.className = "msg__row"; t.innerHTML = "<img src='assets/fada.svg' alt=''><div class='msg msg--bot typing'><span></span><span></span><span></span></div>";
      msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight;
      setChips([]);
      setTimeout(() => {
        t.remove();
        const m = { who: "bot", html };
        render(m, true); save(m);
        if (chipList) { setChips(chipList); store.set(KEY + "_chips", chipList); }
        res();
      }, Math.min(1400, 450 + html.length * 4));
    }));
  }

  const CHIP_ALIAS = {
    "marcar ecografia": () => startBooking("Obstetrícia / Ecografia 4D"),
    "marcar ginecologia": () => startBooking("Ginecologia"),
    "marcar ortodontia": () => startBooking("Ortodontia"),
    "marcar estomatologia": () => startBooking("Estomatologia"),
    "outra pergunta": () => bot("Claro! Escreva a sua pergunta ou escolha um tema:", MENU),
    "corrigir": () => startBooking(),
    "proteses": () => answer("proteses"),
    "emergencia": () => answer("emergencia")
  };

  function answer(text) {
    const it = detect(text);
    if (it) { const r = it.reply(text); if (r) bot(r.html, r.chips); return; }
    const s = findServico(text);
    if (s) { bot("Sobre <strong>" + s + "</strong>: " + CLINICA.servicos[s] + "<br>Quer marcar?", ["Marcar consulta", "Preços"]); return; }
    bot(pick(["Hmm, não tenho a certeza de ter percebido. 🤔", "Desculpe, não percebi bem. 🙂"]) +
      " Posso ajudar com marcações, serviços, preços, horário e localização — ou passo-o para a recepção:<br><a class='msg__btn' target='_blank' rel='noopener' href='" + waLink("Olá! Tenho uma pergunta: " + text) + "'>💬 Perguntar à recepção</a>", MENU);
  }

  function send(raw) {
    const text = (raw || "").trim();
    if (!text) return;
    const m = { who: "user", text };
    render(m, true); save(m); setChips([]);
    const n = norm(text);
    // Emergência tem prioridade, mesmo durante a marcação
    const it = detect(text);
    if (it && it.id === "emergencia") { flow = null; answer(text); return; }
    if (flow && handleFlow(text)) return;
    if (CHIP_ALIAS[n]) { CHIP_ALIAS[n](); return; }
    answer(text);
  }

  function welcome() {
    bot(saudacao() + "! Eu sou a <strong>Fada</strong> 🦷, médica dentista e assistente virtual da <strong>Clínica Janiky</strong>.");
    bot("Posso ajudar a marcar uma consulta, falar dos nossos serviços, preços, horário ou localização. Como posso ajudar?", MENU);
  }

  function open(prefill) {
    root.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    launcher.setAttribute("aria-expanded", "true");
    bubble.classList.remove("show");
    if (!msgs.children.length) {
      if (history.length) { history.forEach((m) => render(m, false)); setChips(store.get(KEY + "_chips") || MENU); }
      else welcome();
    }
    if (prefill) queue.then(() => send(prefill));
    setTimeout(() => input.focus({ preventScroll: true }), 250);
  }
  function close() {
    root.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    launcher.setAttribute("aria-expanded", "false");
  }

  launcher.addEventListener("click", () => (root.classList.contains("is-open") ? close() : open()));
  $("fadaClose").addEventListener("click", close);
  $("fadaReset").addEventListener("click", () => {
    history = []; flow = null; store.del(KEY); store.del(KEY + "_chips");
    msgs.innerHTML = ""; setChips([]); welcome();
  });
  form.addEventListener("submit", (e) => { e.preventDefault(); const v = input.value; input.value = ""; send(v); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("is-open")) close(); });
  document.querySelectorAll("[data-open-fada]").forEach((b) => b.addEventListener("click", () => open()));
  document.querySelectorAll("[data-ask]").forEach((b) => b.addEventListener("click", () => open(b.dataset.ask)));

  // Balão de boas-vindas
  setTimeout(() => { if (!root.classList.contains("is-open")) bubble.classList.add("show"); }, 3500);
  setTimeout(() => bubble.classList.remove("show"), 12000);

  window.Fada = { open, close, send };
})();
