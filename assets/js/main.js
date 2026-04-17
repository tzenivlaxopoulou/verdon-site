const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const revealItems = document.querySelectorAll(".reveal");
const contactForm = document.querySelector("[data-contact-form]");
const VERDON_INTRO_STORAGE_KEY = "verdonIntroSeen";
const VERDON_INTRO_DURATION = 3400;
const VERDON_INTRO_FADE_DELAY = 180;

const showVerdonIntro = () => {
  if (!document.body) return Promise.resolve(0);

  try {
    if (sessionStorage.getItem(VERDON_INTRO_STORAGE_KEY)) return Promise.resolve(0);
    sessionStorage.setItem(VERDON_INTRO_STORAGE_KEY, "true");
  } catch (error) {
    // Ignore storage failures and treat the intro as one-off for this page load.
  }

  const overlay = document.createElement("div");
  overlay.className = "verdon-intro";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="verdon-intro-backdrop"></div>
    <div class="verdon-intro-card">
      <div class="verdon-intro-brand" aria-label="Verdon">
        <span class="verdon-intro-mark">V</span>
        <div class="verdon-intro-copy">
          <strong>Verdon</strong>
          <span>Η γη όπως της αξίζει</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.classList.add("has-verdon-intro");

  window.requestAnimationFrame(() => {
    overlay.classList.add("is-visible");
  });

  return new Promise((resolve) => {
    window.setTimeout(() => {
      overlay.classList.add("is-leaving");
      window.setTimeout(() => {
        overlay.remove();
        document.body.classList.remove("has-verdon-intro");
        resolve(VERDON_INTRO_DURATION);
      }, VERDON_INTRO_FADE_DELAY);
    }, VERDON_INTRO_DURATION);
  });
};

const updateHeaderState = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

updateHeaderState();
window.addEventListener("scroll", updateHeaderState);

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    nav.classList.toggle("is-open", !isExpanded);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    });
  });
}

if ("IntersectionObserver" in window && revealItems.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (contactForm) {
  const status = contactForm.querySelector("[data-form-status]");
  const validators = {
    name: (value) => value.trim().length >= 3 || "Συμπληρώστε το ονοματεπώνυμό σας.",
    phone: (value) =>
      /^[0-9+\s()-]{10,}$/.test(value.trim()) || "Συμπληρώστε ένα έγκυρο τηλέφωνο επικοινωνίας.",
    email: (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || "Συμπληρώστε ένα έγκυρο email.",
    service: (value) => value.trim() !== "" || "Επιλέξτε την υπηρεσία που σας ενδιαφέρει.",
    message: (value) => value.trim().length >= 15 || "Προσθέστε λίγες περισσότερες πληροφορίες για τον χώρο σας.",
  };

  const setFieldState = (field, message) => {
    const wrapper = field.closest(".form-field");
    const errorTarget = wrapper?.querySelector(".error-message");
    const hasError = Boolean(message);
    wrapper?.classList.toggle("is-invalid", hasError);
    field.setAttribute("aria-invalid", String(hasError));
    if (errorTarget) errorTarget.textContent = message || "";
  };

  const validateField = (field) => {
    const rule = validators[field.name];
    if (!rule) return true;
    const result = rule(field.value);
    setFieldState(field, result === true ? "" : result);
    return result === true;
  };

  contactForm.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
  });

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = [...contactForm.querySelectorAll("input, select, textarea")];
    const isValid = fields.every(validateField);

    if (!isValid) {
      status.textContent = "Ελέγξτε τα πεδία της φόρμας και δοκιμάστε ξανά.";
      return;
    }

    status.textContent = "Το αίτημά σας καταχωρήθηκε. Θα επικοινωνήσουμε μαζί σας το συντομότερο δυνατό.";
    contactForm.reset();
    fields.forEach((field) => setFieldState(field, ""));
  });
}

const VERDON_AGENT_CONFIG = {
  phone: "6983754306",
  whatsapp: "306983754306",
  email: "hello@verdon.gr",
  storageKey: "verdon-agent-leads",
  draftKey: "verdon-agent-draft",
  webhookUrl: window.VERDON_AGENT_WEBHOOK_URL || "",
};

const VERDON_AGENT_SERVICES = {
  maintenance: {
    label: "Συντήρηση κήπου",
    keywords: ["συντηρηση", "κηπου", "κηπος", "γκαζον", "ποτισμα", "περιποιηση", "maintenance"],
    prompt: "Μοιάζει με ανάγκη για σταθερή συντήρηση και φροντίδα του κήπου.",
    estimate: {
      small: [70, 130],
      medium: [130, 240],
      large: [240, 420],
    },
  },
  pruning: {
    label: "Κοπές / κλαδέματα",
    keywords: ["κλαδεμα", "κλαδεματα", "κοπη", "κοπες", "δεντρα", "θαμνοι", "κλαδια", "pruning"],
    prompt: "Αυτό δείχνει κυρίως ανάγκη για κοπές ή κλαδέματα με ασφάλεια και σωστή διαχείριση.",
    estimate: {
      small: [90, 180],
      medium: [180, 360],
      large: [360, 720],
    },
  },
  cleaning: {
    label: "Καθαρισμοί οικοπέδων & εξωτερικών χώρων",
    keywords: ["καθαρισμ", "οικοπεδ", "χορτα", "κλαδια", "εξωτερικ", "καθαρο", "φυλλα", "cleaning"],
    prompt: "Πιθανότατα χρειάζεται καθαρισμός οικοπέδου ή εξωτερικού χώρου με απομάκρυνση υπολειμμάτων.",
    estimate: {
      small: [120, 220],
      medium: [220, 430],
      large: [430, 860],
    },
  },
  clearance: {
    label: "Άδειασμα σπιτιών & απομάκρυνση μπαζών",
    keywords: ["μπαζ", "αδειασμα", "σπιτι", "απομακρυνση", "φορτωμα", "σκουπιδ", "κατεδαφιση", "clearance"],
    prompt: "Ακούγεται σαν εργασία για άδειασμα χώρου ή απομάκρυνση μπαζών και ογκωδών υλικών.",
    estimate: {
      small: [180, 380],
      medium: [380, 900],
      large: [900, 1800],
    },
  },
  planting: {
    label: "Φύτευση / ανανέωση κήπου",
    keywords: ["φυτευση", "φυτα", "γκαζον", "ανανεωση", "σχεδιασμ", "παρτερι", "κηπου", "planting"],
    prompt: "Αυτό ταιριάζει περισσότερο με φύτευση ή ανανέωση του κήπου σας.",
    estimate: {
      small: [150, 320],
      medium: [320, 780],
      large: [780, 1600],
    },
  },
  consulting: {
    label: "Συμβουλευτική εξωτερικού χώρου",
    keywords: ["συμβουλ", "ιδεα", "τι χρειαζεται", "προταση", "consulting", "σχεδιο"],
    prompt: "Σε αυτή τη φάση φαίνεται πιο χρήσιμη μια συμβουλευτική καθοδήγηση για την κατάλληλη κατεύθυνση.",
    estimate: {
      small: [60, 120],
      medium: [120, 220],
      large: [220, 360],
    },
  },
};

const normalizeAgentText = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const roundToTen = (value) => Math.round(value / 10) * 10;

const parsePhoneDigits = (value) => value.replace(/\D/g, "");

const classifyAgentService = (value) => {
  const normalized = normalizeAgentText(value);
  let bestKey = "consulting";
  let bestScore = 0;

  Object.entries(VERDON_AGENT_SERVICES).forEach(([key, service]) => {
    const score = service.keywords.reduce((total, keyword) => {
      return total + (normalized.includes(keyword) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  });

  return bestKey;
};

const parseAgentSize = (value) => {
  const normalized = normalizeAgentText(value);

  if (
    normalized.includes("μικρ") ||
    normalized.includes("<") ||
    normalized.includes("εως 80") ||
    normalized.includes("εωσ 80") ||
    normalized.includes("80")
  ) {
    return { key: "small", label: "Μικρός χώρος" };
  }

  if (
    normalized.includes("μεγαλ") ||
    normalized.includes("πανω") ||
    normalized.includes("πάνω") ||
    normalized.includes("150") ||
    normalized.includes("200")
  ) {
    return { key: "large", label: "Μεγάλος χώρος" };
  }

  if (normalized.includes("μεσα") || normalized.includes("100") || normalized.includes("120")) {
    return { key: "medium", label: "Μεσαίος χώρος" };
  }

  return { key: "medium", label: value.trim() || "Μεσαίος χώρος" };
};

const parseAgentCondition = (value) => {
  const normalized = normalizeAgentText(value);

  if (normalized.includes("μπαζ") || normalized.includes("αδειασμ")) {
    return { key: "debris", label: "Υπάρχουν μπάζα / άδειασμα" };
  }

  if (normalized.includes("χορτ") || normalized.includes("κλαδι") || normalized.includes("φυλλα")) {
    return { key: "greenWaste", label: "Υπάρχουν χόρτα / κλαδιά" };
  }

  if (
    normalized.includes("παραμελη") ||
    normalized.includes("δυσκολ") ||
    normalized.includes("πολυ δουλ") ||
    normalized.includes("αρκετ")
  ) {
    return { key: "overgrown", label: "Ο χώρος είναι αρκετά παραμελημένος" };
  }

  return { key: "light", label: value.trim() || "Θέλει βασική φροντίδα" };
};

const buildAgentEstimate = (serviceKey, sizeKey, conditionKey) => {
  const service = VERDON_AGENT_SERVICES[serviceKey] || VERDON_AGENT_SERVICES.consulting;
  const range = service.estimate[sizeKey] || service.estimate.medium;
  const multipliers = {
    light: 1,
    overgrown: 1.22,
    greenWaste: 1.14,
    debris: 1.3,
  };
  const multiplier = multipliers[conditionKey] || 1;

  return {
    low: roundToTen(range[0] * multiplier),
    high: roundToTen(range[1] * multiplier),
  };
};

const saveAgentDraft = (lead) => {
  try {
    localStorage.setItem(VERDON_AGENT_CONFIG.draftKey, JSON.stringify(lead));
  } catch (error) {
    console.warn("Verdon agent draft could not be stored.", error);
  }
};

const fillContactFormFromDraft = () => {
  if (!contactForm) return;

  try {
    const raw = localStorage.getItem(VERDON_AGENT_CONFIG.draftKey);
    if (!raw) return;
    const draft = JSON.parse(raw);
    const nameField = contactForm.querySelector("#name");
    const phoneField = contactForm.querySelector("#phone");
    const serviceField = contactForm.querySelector("#service");
    const messageField = contactForm.querySelector("#message");
    const serviceKeyMap = {
      maintenance: "maintenance",
      pruning: "pruning",
      cleaning: "cleaning",
      clearance: "cleaning",
      planting: "planting",
      consulting: "consulting",
    };

    if (nameField && !nameField.value && draft.name) nameField.value = draft.name;
    if (phoneField && !phoneField.value && draft.phone) phoneField.value = draft.phone;
    if (serviceField && !serviceField.value && draft.serviceKey) {
      serviceField.value = serviceKeyMap[draft.serviceKey] || "consulting";
    }

    if (messageField && !messageField.value) {
      const detailLines = [
        draft.need && `Ανάγκη: ${draft.need}`,
        draft.sizeLabel && `Μέγεθος χώρου: ${draft.sizeLabel}`,
        draft.conditionLabel && `Κατάσταση χώρου: ${draft.conditionLabel}`,
        draft.location && `Περιοχή: ${draft.location}`,
        draft.details && `Λεπτομέρειες: ${draft.details}`,
      ].filter(Boolean);

      if (detailLines.length) {
        messageField.value = detailLines.join("\n");
      }
    }
  } catch (error) {
    console.warn("Verdon agent draft could not be read.", error);
  }
};

const persistAgentLead = async (lead) => {
  try {
    const existing = JSON.parse(localStorage.getItem(VERDON_AGENT_CONFIG.storageKey) || "[]");
    existing.unshift({
      ...lead,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(VERDON_AGENT_CONFIG.storageKey, JSON.stringify(existing.slice(0, 30)));
  } catch (error) {
    console.warn("Verdon agent lead could not be stored locally.", error);
  }

  if (!VERDON_AGENT_CONFIG.webhookUrl) return;

  try {
    await fetch(VERDON_AGENT_CONFIG.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lead),
    });
  } catch (error) {
    console.warn("Verdon agent webhook submission failed.", error);
  }
};

const initVerdonAgent = () => {
  if (!document.body || document.querySelector("[data-verdon-agent]")) return;

  const contactUrl = window.location.pathname.endsWith("contact.html") ? "#contact-form" : "contact.html#contact-form";
  const triggerHintStorageKey = "verdonAgentTriggerHintSeen";
  const viewportPadding = 12;
  const panelViewportPadding = 16;
  const dragThreshold = 8;
  const triggerTooltipDelay = 3000;
  const triggerTooltipDuration = 5200;

  const root = document.createElement("div");
  root.className = "verdon-agent";
  root.dataset.verdonAgent = "true";
  root.innerHTML = `
    <section class="verdon-agent-panel" aria-label="Verdi, ο βοηθός της Verdon" hidden>
      <header class="verdon-agent-header">
        <div class="verdon-agent-header-copy">
          <span class="verdon-agent-kicker">Verdi</span>
          <strong>Μικρή καθοδήγηση για τον χώρο σας</strong>
          <p>Σύντομες ερωτήσεις, ενδεικτική εκτίμηση και άμεση επικοινωνία.</p>
        </div>
        <div class="verdon-agent-header-actions">
          <button class="verdon-agent-icon-button" type="button" data-agent-reset aria-label="Νέα συνομιλία">↺</button>
          <button class="verdon-agent-icon-button" type="button" data-agent-close aria-label="Κλείσιμο συνομιλίας">×</button>
        </div>
      </header>
      <div class="verdon-agent-messages" role="log" aria-live="polite" aria-label="Μηνύματα βοηθού"></div>
      <div class="verdon-agent-quick-replies" data-agent-chips></div>
      <form class="verdon-agent-form" data-agent-form>
        <input
          class="verdon-agent-input"
          type="text"
          name="agent-message"
          autocomplete="off"
          placeholder="Γράψτε λίγες πληροφορίες για τον χώρο σας"
          aria-label="Μήνυμα προς τη Verdi"
        />
        <button class="verdon-agent-send" type="submit">Αποστολή</button>
      </form>
      <div class="verdon-agent-footer-links">
        <a href="tel:${VERDON_AGENT_CONFIG.phone}">Κλήση</a>
        <a href="https://wa.me/${VERDON_AGENT_CONFIG.whatsapp}" target="_blank" rel="noreferrer">WhatsApp</a>
        <a href="${contactUrl}">Φόρμα</a>
      </div>
    </section>
    <button
      class="verdon-agent-trigger"
      type="button"
      aria-expanded="false"
      aria-controls="verdon-agent-panel"
      aria-label="Άνοιγμα Verdi"
      data-agent-trigger
    >
      <span class="verdon-agent-trigger-icon" aria-hidden="true">
        <span class="verdon-agent-petal verdon-agent-petal-one"></span>
        <span class="verdon-agent-petal verdon-agent-petal-two"></span>
        <span class="verdon-agent-petal verdon-agent-petal-three"></span>
        <span class="verdon-agent-petal verdon-agent-petal-four"></span>
        <span class="verdon-agent-flower-core"></span>
        <span class="verdon-agent-stem"></span>
        <span class="verdon-agent-pot"></span>
      </span>
      <span class="verdon-agent-trigger-copy">
        <strong>Verdi</strong>
        <small>Ρωτήστε για υπηρεσίες ή εκτίμηση</small>
      </span>
    </button>
    <span class="verdon-agent-trigger-badge" aria-hidden="true">Βοηθός Verdi</span>
    <button
      class="verdon-agent-trigger-tooltip"
      type="button"
      data-agent-trigger-tooltip
      aria-label="Άνοιγμα συνομιλίας με τη Verdi"
      aria-hidden="true"
    >
      Γεια σας, είμαι η Verdi. Θέλετε βοήθεια για τον χώρο σας;
    </button>
  `;

  const panel = root.querySelector(".verdon-agent-panel");
  const trigger = root.querySelector("[data-agent-trigger]");
  const triggerTooltip = root.querySelector("[data-agent-trigger-tooltip]");
  const closeButton = root.querySelector("[data-agent-close]");
  const resetButton = root.querySelector("[data-agent-reset]");
  const messages = root.querySelector(".verdon-agent-messages");
  const chips = root.querySelector("[data-agent-chips]");
  const form = root.querySelector("[data-agent-form]");
  const input = root.querySelector(".verdon-agent-input");

  if (!panel || !trigger || !triggerTooltip || !closeButton || !resetButton || !messages || !chips || !form || !input) return;

  panel.id = "verdon-agent-panel";
  document.body.appendChild(root);

  const state = {
    step: "service",
    leadSaved: false,
    lead: {
      serviceKey: "",
      need: "",
      sizeKey: "",
      sizeLabel: "",
      conditionKey: "",
      conditionLabel: "",
      location: "",
      details: "",
      name: "",
      phone: "",
      estimateLow: "",
      estimateHigh: "",
    },
  };

  let isAgentPanelOpen = false;
  let tooltipHideTimer = 0;
  let tooltipShowTimer = 0;
  let triggerTranslateX = 0;
  let triggerTranslateY = 0;
  let suppressTriggerClick = false;
  let activePointerId = null;
  let dragState = null;
  let panelViewportFrame = 0;
  let introWaitAttempts = 0;

  const applyTriggerPosition = () => {
    root.style.transform = `translate3d(${triggerTranslateX}px, ${triggerTranslateY}px, 0)`;
  };

  const clampTriggerPosition = (nextX = triggerTranslateX, nextY = triggerTranslateY) => {
    const rect = trigger.getBoundingClientRect();
    const baseLeft = rect.left - triggerTranslateX;
    const baseRight = rect.right - triggerTranslateX;
    const baseTop = rect.top - triggerTranslateY;
    const baseBottom = rect.bottom - triggerTranslateY;
    const minX = viewportPadding - baseLeft;
    const maxX = window.innerWidth - viewportPadding - baseRight;
    const minY = viewportPadding - baseTop;
    const maxY = window.innerHeight - viewportPadding - baseBottom;

    return {
      x: Math.min(Math.max(nextX, minX), maxX),
      y: Math.min(Math.max(nextY, minY), maxY),
    };
  };

  const updateTriggerPosition = (nextX, nextY) => {
    const clamped = clampTriggerPosition(nextX, nextY);
    triggerTranslateX = clamped.x;
    triggerTranslateY = clamped.y;
    applyTriggerPosition();
  };

  const syncTriggerWithinViewport = () => {
    updateTriggerPosition(triggerTranslateX, triggerTranslateY);
  };

  const constrainPanelToViewport = () => {
    panelViewportFrame = 0;

    if (!isAgentPanelOpen) return;

    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let deltaX = 0;
    let deltaY = 0;

    if (panelRect.left < panelViewportPadding) {
      deltaX = panelViewportPadding - panelRect.left;
    } else if (panelRect.right > viewportWidth - panelViewportPadding) {
      deltaX = viewportWidth - panelViewportPadding - panelRect.right;
    }

    if (panelRect.top < panelViewportPadding) {
      deltaY = panelViewportPadding - panelRect.top;
    } else if (panelRect.bottom > viewportHeight - panelViewportPadding) {
      deltaY = viewportHeight - panelViewportPadding - panelRect.bottom;
    }

    if (deltaX !== 0 || deltaY !== 0) {
      updateTriggerPosition(triggerTranslateX + deltaX, triggerTranslateY + deltaY);
    }
  };

  const schedulePanelViewportConstraint = () => {
    if (!isAgentPanelOpen || panelViewportFrame) return;

    panelViewportFrame = window.requestAnimationFrame(() => {
      constrainPanelToViewport();
    });
  };

  const hideTriggerTooltip = () => {
    window.clearTimeout(tooltipHideTimer);
    window.clearTimeout(tooltipShowTimer);
    tooltipHideTimer = 0;
    tooltipShowTimer = 0;
    root.classList.remove("show-trigger-tooltip");
    triggerTooltip.setAttribute("aria-hidden", "true");
  };

  const maybeShowTriggerTooltip = () => {
    try {
      if (sessionStorage.getItem(triggerHintStorageKey)) return;
    } catch (error) {
      // Ignore storage failures and simply avoid persisting the hint state.
    }

    const showTooltip = () => {
      window.requestAnimationFrame(() => {
        if (isAgentPanelOpen) return;
        if (document.body.classList.contains("has-verdon-intro")) {
          if (introWaitAttempts < 8) {
            introWaitAttempts += 1;
            tooltipShowTimer = window.setTimeout(showTooltip, 350);
          }
          return;
        }

        try {
          sessionStorage.setItem(triggerHintStorageKey, "true");
        } catch (error) {
          // Ignore storage failures and show the helper once for this page load.
        }

        root.classList.add("show-trigger-tooltip");
        triggerTooltip.setAttribute("aria-hidden", "false");
        tooltipHideTimer = window.setTimeout(() => {
          hideTriggerTooltip();
        }, triggerTooltipDuration);
      });
    };

    tooltipShowTimer = window.setTimeout(showTooltip, triggerTooltipDelay);
  };

  const setAgentPanelState = () => {
    panel.hidden = !isAgentPanelOpen;
    panel.setAttribute("aria-hidden", String(!isAgentPanelOpen));
    panel.classList.toggle("is-open", isAgentPanelOpen);
    root.classList.toggle("is-open", isAgentPanelOpen);
    trigger.setAttribute("aria-expanded", String(isAgentPanelOpen));
    panel.style.display = isAgentPanelOpen ? "flex" : "none";
    hideTriggerTooltip();
    window.requestAnimationFrame(syncTriggerWithinViewport);
    if (isAgentPanelOpen) {
      schedulePanelViewportConstraint();
    } else {
      window.cancelAnimationFrame(panelViewportFrame);
      panelViewportFrame = 0;
    }
  };

  const openAgentPanel = () => {
    isAgentPanelOpen = true;
    setAgentPanelState();
    if (!messages.children.length) {
      resetConversation();
    }
    schedulePanelViewportConstraint();
    input.focus();
  };

  const closeAgentPanel = () => {
    isAgentPanelOpen = false;
    setAgentPanelState();
  };

  const toggleAgentPanel = () => {
    if (isAgentPanelOpen) {
      closeAgentPanel();
      return;
    }

    openAgentPanel();
  };

  const scrollMessages = () => {
    messages.scrollTop = messages.scrollHeight;
  };

  const renderMessage = (author, content, type = "text") => {
    const item = document.createElement("div");
    item.className = `verdon-agent-message verdon-agent-message-${author}`;

    if (type === "html") {
      item.innerHTML = content;
    } else {
      const bubble = document.createElement("div");
      bubble.className = "verdon-agent-bubble";
      bubble.textContent = content;
      item.appendChild(bubble);
    }

    messages.appendChild(item);
    scrollMessages();
    schedulePanelViewportConstraint();
  };

  const renderBotMessage = (content) => renderMessage("bot", content);
  const renderUserMessage = (content) => renderMessage("user", content);

  const renderActionLinks = () => {
    const summary = [
      state.lead.name && `Όνομα: ${state.lead.name}`,
      state.lead.phone && `Τηλέφωνο: ${state.lead.phone}`,
      state.lead.location && `Περιοχή: ${state.lead.location}`,
      state.lead.need && `Ανάγκη: ${state.lead.need}`,
      state.lead.details && `Λεπτομέρειες: ${state.lead.details}`,
    ]
      .filter(Boolean)
      .join("\n");
    const whatsappText = encodeURIComponent(
      `Καλησπέρα σας. Θα ήθελα επικοινωνία για τον χώρο μου.\n${summary}`.trim()
    );
    const mailtoBody = encodeURIComponent(
      `Στοιχεία από τη Verdi\n\n${summary}\n\nΣημείωση: Η εκτίμηση είναι ενδεικτική και επιβεβαιώνεται μετά από επικοινωνία.`
    );

    renderMessage(
      "bot",
      `
        <div class="verdon-agent-bubble verdon-agent-bubble-actions">
          <p>Αν θέλετε, μπορείτε να συνεχίσετε άμεσα από εδώ:</p>
          <div class="verdon-agent-action-row">
            <a class="verdon-agent-action verdon-agent-action-primary" href="${contactUrl}">Φόρμα επικοινωνίας</a>
            <a class="verdon-agent-action" href="tel:${VERDON_AGENT_CONFIG.phone}">Κλήση</a>
            <a class="verdon-agent-action" href="https://wa.me/${VERDON_AGENT_CONFIG.whatsapp}?text=${whatsappText}" target="_blank" rel="noreferrer">WhatsApp</a>
            <a class="verdon-agent-action" href="mailto:${VERDON_AGENT_CONFIG.email}?subject=Νέο αίτημα από τη Verdi&body=${mailtoBody}">Email</a>
          </div>
        </div>
      `,
      "html"
    );
  };

  const setChips = (options = []) => {
    chips.innerHTML = "";

    options.forEach((option) => {
      const button = document.createElement("button");
      button.className = "verdon-agent-chip";
      button.type = "button";
      button.dataset.value = option.value;
      button.textContent = option.label;
      chips.appendChild(button);
    });

    schedulePanelViewportConstraint();
  };

  const setInputPlaceholder = (value) => {
    input.placeholder = value;
  };

  const askService = () => {
    state.step = "service";
    renderBotMessage(
      "Πείτε μου σύντομα τι χρειάζεται ο χώρος σας και θα σας καθοδηγήσω για την πιο ταιριαστή υπηρεσία."
    );
    setChips([
      { value: "Συντήρηση κήπου", label: "Συντήρηση κήπου" },
      { value: "Κοπές / κλαδέματα", label: "Κοπές / κλαδέματα" },
      { value: "Καθαρισμός οικοπέδου", label: "Καθαρισμός οικοπέδου" },
      { value: "Μπάζα / άδειασμα", label: "Μπάζα / άδειασμα" },
      { value: "Φύτευση / ανανέωση", label: "Φύτευση / ανανέωση" },
      { value: "Δεν είμαι σίγουρος/η", label: "Δεν είμαι σίγουρος/η" },
    ]);
    setInputPlaceholder("π.χ. Θέλω καθαρισμό οικοπέδου στα Πεύκα");
  };

  const askSize = () => {
    state.step = "size";
    renderBotMessage("Περίπου τι μέγεθος έχει ο χώρος;");
    setChips([
      { value: "Μικρός χώρος", label: "Μικρός χώρος" },
      { value: "Μεσαίος χώρος", label: "Μεσαίος χώρος" },
      { value: "Μεγάλος χώρος", label: "Μεγάλος χώρος" },
      { value: "Δεν είμαι σίγουρος/η", label: "Δεν είμαι σίγουρος/η" },
    ]);
    setInputPlaceholder("π.χ. περίπου 120 τ.μ.");
  };

  const askCondition = () => {
    state.step = "condition";
    renderBotMessage("Σε τι κατάσταση βρίσκεται ο χώρος αυτή τη στιγμή;");
    setChips([
      { value: "Θέλει βασική φροντίδα", label: "Βασική φροντίδα" },
      { value: "Ο χώρος είναι αρκετά παραμελημένος", label: "Παραμελημένος χώρος" },
      { value: "Υπάρχουν χόρτα / κλαδιά", label: "Χόρτα / κλαδιά" },
      { value: "Υπάρχουν μπάζα / άδειασμα", label: "Μπάζα / άδειασμα" },
    ]);
    setInputPlaceholder("π.χ. έχει ψηλά χόρτα και πολλά κλαδιά");
  };

  const askLocation = () => {
    state.step = "location";
    setChips([]);
    renderBotMessage("Σε ποια περιοχή βρίσκεται ο χώρος;");
    setInputPlaceholder("π.χ. Πεύκα, Θεσσαλονίκη");
  };

  const askDetails = () => {
    state.step = "details";
    renderBotMessage(
      "Αν θέλετε, πείτε μου 1-2 βασικές λεπτομέρειες ακόμη, όπως αν υπάρχουν χόρτα, κλαδιά, μπάζα ή αν θέλετε ανανέωση."
    );
    setInputPlaceholder("π.χ. υπάρχουν χόρτα και θέλω και μικρή ανανέωση");
  };

  const askName = () => {
    state.step = "name";
    setChips([]);
    renderBotMessage("Για να κρατήσω ένα πρώτο αίτημα, ποιο είναι το όνομά σας;");
    setInputPlaceholder("Το όνομά σας");
  };

  const askPhone = () => {
    state.step = "phone";
    renderBotMessage("Και ένα τηλέφωνο επικοινωνίας για να μπορέσει η ομάδα να σας καλέσει;");
    setInputPlaceholder("π.χ. 6983754306");
  };

  const summarizeRecommendation = () => {
    const estimate = buildAgentEstimate(state.lead.serviceKey, state.lead.sizeKey || "medium", state.lead.conditionKey);
    state.lead.estimateLow = estimate.low;
    state.lead.estimateHigh = estimate.high;
    saveAgentDraft(state.lead);

    const service = VERDON_AGENT_SERVICES[state.lead.serviceKey] || VERDON_AGENT_SERVICES.consulting;
    renderBotMessage(service.prompt);
    renderBotMessage(
      `Με βάση όσα περιγράψατε, μια ενδεικτική εκτίμηση είναι περίπου ${estimate.low}€ έως ${estimate.high}€. Η τιμή αυτή δεν είναι τελική. Η τελική εκτίμηση γίνεται πάντα μετά από επικοινωνία, φωτογραφίες και επίσκεψη αν χρειαστεί.`
    );
  };

  const submitLead = async () => {
    if (state.leadSaved) return;
    state.leadSaved = true;
    saveAgentDraft(state.lead);
    await persistAgentLead({
      page: window.location.pathname,
      source: "verdon-agent",
      ...state.lead,
    });
    renderBotMessage(
      "Τέλεια, κράτησα τα βασικά στοιχεία σας ως πρώτο lead και μπορείτε να συνεχίσετε με όποιον τρόπο σας βολεύει."
    );
    renderActionLinks();
    state.step = "done";
    setInputPlaceholder("Αν θέλετε, γράψτε κάτι ακόμη");
  };

  const resetConversation = () => {
    messages.innerHTML = "";
    state.step = "service";
    state.leadSaved = false;
    state.lead = {
      serviceKey: "",
      need: "",
      sizeKey: "",
      sizeLabel: "",
      conditionKey: "",
      conditionLabel: "",
      location: "",
      details: "",
      name: "",
      phone: "",
      estimateLow: "",
      estimateHigh: "",
    };
    renderBotMessage("Γεια σας. Είμαι η Verdi και μπορώ να σας βοηθήσω να βρούμε την κατάλληλη υπηρεσία.");
    renderBotMessage(
      "Οι τιμές που θα δείτε εδώ είναι μόνο ενδεικτικές. Η τελική εκτίμηση επιβεβαιώνεται μετά από επικοινωνία, φωτογραφίες ή επίσκεψη όπου χρειάζεται."
    );
    askService();
  };

  const handleAgentReply = async (rawValue) => {
    const value = rawValue.trim();
    if (!value) return;
    renderUserMessage(value);

    if (state.step === "service") {
      const serviceKey = classifyAgentService(value);
      state.lead.serviceKey = serviceKey;
      state.lead.need = value;
      askSize();
      return;
    }

    if (state.step === "size") {
      const size = parseAgentSize(value);
      state.lead.sizeKey = size.key;
      state.lead.sizeLabel = size.label;
      askCondition();
      return;
    }

    if (state.step === "condition") {
      const condition = parseAgentCondition(value);
      state.lead.conditionKey = condition.key;
      state.lead.conditionLabel = condition.label;
      askLocation();
      return;
    }

    if (state.step === "location") {
      state.lead.location = value;
      askDetails();
      return;
    }

    if (state.step === "details") {
      state.lead.details = value;
      summarizeRecommendation();
      askName();
      return;
    }

    if (state.step === "name") {
      state.lead.name = value;
      askPhone();
      return;
    }

    if (state.step === "phone") {
      const digits = parsePhoneDigits(value);
      if (digits.length < 10) {
        renderBotMessage("Χρειάζομαι ένα έγκυρο τηλέφωνο με τουλάχιστον 10 ψηφία για να προχωρήσουμε.");
        return;
      }

      state.lead.phone = digits;
      await submitLead();
      return;
    }

    if (state.step === "done") {
      renderBotMessage(
        "Αν θέλετε, μπορείτε να πατήσετε φόρμα, τηλέφωνο ή WhatsApp για άμεση συνέχεια. Εναλλακτικά, πατήστε ↺ για νέα καταγραφή."
      );
    }
  };

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    if (suppressTriggerClick) {
      suppressTriggerClick = false;
      return;
    }
    toggleAgentPanel();
  });

  triggerTooltip.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    hideTriggerTooltip();
    if (!isAgentPanelOpen) {
      openAgentPanel();
    }
  });

  trigger.addEventListener("pointerdown", (event) => {
    if (isAgentPanelOpen || event.button !== 0 || activePointerId !== null) return;

    activePointerId = event.pointerId;
    dragState = {
      pointerStartX: event.clientX,
      pointerStartY: event.clientY,
      originX: triggerTranslateX,
      originY: triggerTranslateY,
      hasMoved: false,
    };

    trigger.setPointerCapture(event.pointerId);
    root.classList.add("is-pressing-trigger");
  });

  trigger.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId || !dragState) return;

    const deltaX = event.clientX - dragState.pointerStartX;
    const deltaY = event.clientY - dragState.pointerStartY;

    if (!dragState.hasMoved && Math.hypot(deltaX, deltaY) < dragThreshold) return;

    if (!dragState.hasMoved) {
      dragState.hasMoved = true;
      hideTriggerTooltip();
      root.classList.add("is-dragging-trigger");
    }

    event.preventDefault();
    updateTriggerPosition(dragState.originX + deltaX, dragState.originY + deltaY);
  });

  const endTriggerDrag = (event) => {
    if (event.pointerId !== activePointerId) return;

    if (dragState?.hasMoved) {
      suppressTriggerClick = true;
    }

    if (trigger.hasPointerCapture(event.pointerId)) {
      trigger.releasePointerCapture(event.pointerId);
    }

    activePointerId = null;
    dragState = null;
    root.classList.remove("is-dragging-trigger", "is-pressing-trigger");
  };

  trigger.addEventListener("pointerup", endTriggerDrag);
  trigger.addEventListener("pointercancel", endTriggerDrag);

  closeButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeAgentPanel();
  });

  resetButton.addEventListener("click", () => {
    resetConversation();
    input.focus();
  });

  chips.addEventListener("click", async (event) => {
    const button = event.target.closest(".verdon-agent-chip");
    if (!button) return;
    await handleAgentReply(button.dataset.value || button.textContent || "");
    input.focus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = input.value;
    input.value = "";
    await handleAgentReply(value);
  });

  window.addEventListener("resize", () => {
    syncTriggerWithinViewport();
    schedulePanelViewportConstraint();
  });
  window.addEventListener("orientationchange", () => {
    syncTriggerWithinViewport();
    schedulePanelViewportConstraint();
  });

  resetConversation();
  setAgentPanelState();
  applyTriggerPosition();
  maybeShowTriggerTooltip();
};

showVerdonIntro();
fillContactFormFromDraft();
initVerdonAgent();
