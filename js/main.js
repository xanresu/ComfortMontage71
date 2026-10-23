(function () {
  "use strict";

  var header = document.querySelector(".header");
  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger");
  var toTop = document.querySelector(".to-top");

  // Год в футере
  document.getElementById("year").textContent = new Date().getFullYear();

  // Шапка и кнопка «наверх» при прокрутке
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 20);
    toTop.classList.toggle("is-visible", y > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Мобильное меню
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  }
  burger.addEventListener("click", function () {
    setMenu(!nav.classList.contains("is-open"));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  // Появление блоков и счётчики
  var counted = new WeakSet();

  function animateCount(el) {
    if (counted.has(el)) return;
    counted.add(el);
    var target = parseInt(el.dataset.count, 10);
    var start = null;
    var duration = 1600;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("ru-RU");
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        entry.target.querySelectorAll("[data-count]").forEach(animateCount);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    document.querySelectorAll(".reveal").forEach(function (el, i) {
      // Небольшая задержка для соседних элементов — эффект «лесенки»
      el.style.transitionDelay = (i % 4) * 80 + "ms";
      io.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
    document.querySelectorAll("[data-count]").forEach(function (el) { el.textContent = el.dataset.count; });
  }

  // Подсветка активного пункта меню
  var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { navIo.observe(s); });
  }

  // Подсветка карточек услуг за курсором
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  // Фильтр объектов
  var filters = document.querySelectorAll(".filter");
  var projects = document.querySelectorAll(".project");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.dataset.filter;
      filters.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      projects.forEach(function (p) {
        var show = f === "all" || p.dataset.cat === f;
        p.classList.toggle("is-hidden", !show);
        // В отфильтрованном виде широкие карточки занимают одну колонку
        p.classList.toggle("project--wide", show && f === "all" && p.hasAttribute("data-wide"));
      });
    });
  });
  projects.forEach(function (p) {
    if (p.classList.contains("project--wide")) p.setAttribute("data-wide", "");
  });

  // Маска телефона
  var phone = document.querySelector('input[name="phone"]');
  phone.addEventListener("input", function () {
    var d = phone.value.replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (!d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);
    var out = "+7";
    if (d.length > 1) out += " (" + d.slice(1, 4);
    if (d.length >= 4) out += ")";
    if (d.length > 4) out += " " + d.slice(4, 7);
    if (d.length > 7) out += "-" + d.slice(7, 9);
    if (d.length > 9) out += "-" + d.slice(9, 11);
    phone.value = out;
  });

  // Отправка заявки.
  // Бэкенда пока нет — формируем письмо в почтовом клиенте.
  // Чтобы принимать заявки на сервер, укажите адрес в FORM_ENDPOINT.
  var FORM_ENDPOINT = "";
  var EMAIL = "info@komfortmontazh71.ru";

  var form = document.getElementById("lead-form");
  var status = form.querySelector(".form__status");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.className = "form__status";

    var name = form.elements.name;
    var digits = phone.value.replace(/\D/g, "");
    var ok = true;

    [[name, name.value.trim().length >= 2], [phone, digits.length === 11]].forEach(function (pair) {
      pair[0].closest(".field").classList.toggle("is-invalid", !pair[1]);
      if (!pair[1]) ok = false;
    });

    if (!ok) {
      status.textContent = "Проверьте имя и номер телефона.";
      status.classList.add("is-error");
      return;
    }
    if (!form.elements.consent.checked) {
      status.textContent = "Нужно согласие на обработку данных.";
      status.classList.add("is-error");
      return;
    }

    var data = {
      name: name.value.trim(),
      phone: phone.value,
      service: form.elements.service.value,
      message: form.elements.message.value.trim()
    };

    function done() {
      status.textContent = "Спасибо! Мы свяжемся с вами в ближайшее время.";
      status.classList.add("is-ok");
      form.reset();
    }

    if (FORM_ENDPOINT) {
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
        .catch(function () {
          status.textContent = "Не удалось отправить. Позвоните нам, пожалуйста.";
          status.classList.add("is-error");
        });
      return;
    }

    var body = "Имя: " + data.name + "\nТелефон: " + data.phone +
      "\nУслуга: " + data.service + "\nКомментарий: " + data.message;
    window.location.href = "mailto:" + EMAIL +
      "?subject=" + encodeURIComponent("Заявка с сайта: " + data.service) +
      "&body=" + encodeURIComponent(body);
    done();
  });
})();
