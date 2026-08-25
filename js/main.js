/**
 * Alertaê — comportamento da landing
 * Menu, âncoras, FAQ, validação do formulário e estados de botão.
 */
(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const nav = document.getElementById("nav-principal");
  const toggle = document.querySelector(".nav-toggle");
  const year = document.getElementById("ano-atual");
  const form = document.getElementById("form-contato");
  const navLinks = document.querySelectorAll(".nav__link");

  if (year) year.textContent = String(new Date().getFullYear());

  /* Cabeçalho compacto ao rolar */
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Menu móvel */
  const setMenu = (open) => {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.style.overflow = open ? "hidden" : "";
  };

  toggle?.addEventListener("click", () => {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  /* Destaque do item de menu conforme a seção visível */
  const sections = ["inicio", "como-funciona", "areas", "projetos", "pesquisa", "parcerias", "contato"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            const active = link.getAttribute("href") === `#${entry.target.id}`;
            link.classList.toggle("is-active", active);
          });
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
  }

  /* FAQ: uma pergunta aberta por vez, acessível via <details> nativo */
  document.querySelectorAll(".faq__item").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      document.querySelectorAll(".faq__item").forEach((other) => {
        if (other !== item) other.removeAttribute("open");
      });
    });
  });

  /* Validação do formulário */
  if (!form) return;

  const statusBox = form.querySelector(".form__status");
  const submitBtn = form.querySelector(".btn--submit");
  const label = submitBtn?.querySelector(".btn__label");
  const idleLabel = label?.textContent || "Enviar mensagem";

  const fields = {
    nome: {
      el: form.elements.namedItem("nome"),
      validate: (value) => (value.trim().length < 3 ? "Informe seu nome completo." : ""),
    },
    instituicao: {
      el: form.elements.namedItem("instituicao"),
      validate: (value) => (value.trim().length < 2 ? "Informe a instituição." : ""),
    },
    email: {
      el: form.elements.namedItem("email"),
      validate: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
          ? ""
          : "Informe um e-mail válido.",
    },
    tipo: {
      el: form.elements.namedItem("tipo"),
      validate: (value) => (value ? "" : "Selecione o tipo de organização."),
    },
    mensagem: {
      el: form.elements.namedItem("mensagem"),
      validate: (value) =>
        value.trim().length < 20 ? "Descreva o interesse em pelo menos 20 caracteres." : "",
    },
    consentimento: {
      el: form.elements.namedItem("consentimento"),
      validate: (_, el) => (el.checked ? "" : "É necessário autorizar o tratamento dos dados."),
    },
  };

  const setError = (name, message) => {
    const field = fields[name];
    const wrapper = field.el.closest(".form__field");
    const error = form.querySelector(`[data-error-for="${name}"]`);
    wrapper?.classList.toggle("is-invalid", Boolean(message));
    if (error) {
      error.hidden = !message;
      error.textContent = message;
    }
    field.el.setAttribute("aria-invalid", message ? "true" : "false");
  };

  const validateAll = () => {
    let firstInvalid = null;
    Object.entries(fields).forEach(([name, field]) => {
      const value = "value" in field.el ? field.el.value : "";
      const message = field.validate(value, field.el);
      setError(name, message);
      if (message && !firstInvalid) firstInvalid = field.el;
    });
    return firstInvalid;
  };

  Object.values(fields).forEach((field) => {
    const eventName = field.el.type === "checkbox" || field.el.tagName === "SELECT" ? "change" : "blur";
    field.el.addEventListener(eventName, () => {
      const value = "value" in field.el ? field.el.value : "";
      const name = field.el.name;
      setError(name, field.validate(value, field.el));
    });
  });

  const setStatus = (type, message) => {
    if (!statusBox) return;
    statusBox.hidden = !message;
    statusBox.classList.remove("is-success", "is-error");
    if (type) statusBox.classList.add(`is-${type}`);
    statusBox.textContent = message;
  };

  const setButtonState = (state, text) => {
    if (!submitBtn || !label) return;
    submitBtn.dataset.state = state;
    submitBtn.disabled = state === "loading";
    label.textContent = text;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const invalid = validateAll();
    if (invalid) {
      setButtonState("error", "Revise os campos");
      setStatus("error", "Há campos pendentes. Corrija para enviar.");
      invalid.focus();
      window.setTimeout(() => setButtonState("idle", idleLabel), 1800);
      return;
    }

    setButtonState("loading", "Enviando");
    setStatus("", "");

    /* Envio real depende de endpoint institucional ainda não definido. */
    window.setTimeout(() => {
      const simulateFail = false;
      if (simulateFail) {
        setButtonState("error", "Tentar novamente");
        setStatus(
          "error",
          "Não foi possível enviar agora. Tente novamente ou use [e-mail institucional]."
        );
        window.setTimeout(() => setButtonState("idle", idleLabel), 2200);
        return;
      }

      setButtonState("success", "Mensagem registrada");
      setStatus(
        "success",
        "Recebemos seus dados neste navegador. O envio institucional será ativado quando o canal oficial estiver disponível."
      );
      form.reset();
      Object.keys(fields).forEach((name) => setError(name, ""));
      window.setTimeout(() => setButtonState("idle", idleLabel), 2800);
    }, 900);
  });
})();
