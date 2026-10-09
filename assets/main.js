/* ==========================================================
   Pema Dolker — portfolio scripts
   ========================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- year ---------- */
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const currentTheme = () => root.dataset.theme || (systemDark() ? "dark" : "light");
  $("#theme-toggle").addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  /* ---------- mobile menu ---------- */
  const menuBtn = $("#menu-toggle");
  const links = $("#nav-links");
  const setMenu = (open) => {
    links.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  menuBtn.addEventListener("click", () => setMenu(!links.classList.contains("is-open")));
  $$("a", links).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- nav border + active link ---------- */
  const nav = $(".nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navLinks = $$(".nav__links a");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- pipeline runs once when it scrolls into view ---------- */
  const pipe = $(".pipeline");
  if (pipe) {
    const stages = $$("li", pipe);
    const run = () => {
      pipe.classList.add("is-run");
      stages.forEach((li, i) => setTimeout(() => li.classList.add("is-done"), reduceMotion ? 0 : 300 * (i + 1)));
    };
    const po = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { run(); po.disconnect(); }
    }, { threshold: 0.5 });
    po.observe(pipe);
  }

  /* ==========================================================
     Terminal
     ========================================================== */
  const body = $("#term-body");
  const form = $("#term-form");
  const input = $("#term-in");
  const history = [];
  let hIndex = 0;
  let busy = false;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const print = (html, cls) => {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    p.innerHTML = html;
    body.appendChild(p);
    body.scrollTop = body.scrollHeight;
  };
  const gap = () => print("", "gap");

  const COMMANDS = {
    help: {
      desc: "list commands",
      run: () => {
        print('Commands you can run:');
        Object.entries(COMMANDS).forEach(([name, c]) => {
          if (c.hidden) return;
          print(`  <span class="k">${name.padEnd(17)}</span><span class="d">${c.desc}</span>`);
        });
        print('<span class="d">Tip: use ↑ and ↓ for history, Tab to autocomplete.</span>');
      },
    },
    whoami: {
      desc: "who is Pema?",
      run: () => {
        print('<span class="a">Pema Dolker</span>');
        print("Final-year B.E. Software Engineering student, Software Security major");
        print("College of Science and Technology, Royal University of Bhutan");
        print('Into: <span class="k">cloud</span>, <span class="k">DevOps</span>, <span class="k">web security</span>, <span class="k">full-stack</span>');
      },
    },
    skills: {
      desc: "what I work with",
      run: () => {
        const rows = [
          ["languages", "Python, JavaScript, TypeScript, C++, SQL, Bash"],
          ["web", "React, Next.js, Node.js, REST, WebSockets"],
          ["data", "PostgreSQL, MongoDB, Redis, Supabase"],
          ["devops", "Docker, Kubernetes, AWS, Jenkins, GitHub Actions, ELK"],
          ["security", "Burp Suite, Nmap, Wireshark, Metasploit"],
        ];
        rows.forEach(([k, v]) => print(`<span class="k">${k.padEnd(10)}</span>${v}`));
      },
    },
    projects: {
      desc: "things I've built",
      run: () => {
        print('<span class="a">containerised-app</span>   React/Node/Postgres, CI/CD, 3-node k8s');
        print('<span class="a">sakura-notes</span>        blogging platform, Google OAuth, Supabase');
        print('<span class="a">quiz-live</span>           real-time multiplayer over WebSockets');
        print('<span class="a">bootcamp-2024</span>       design + user flow, winning team');
        print('<span class="d">Scroll to the work section for details.</span>');
      },
    },
    experience: {
      desc: "where I've worked",
      run: () => {
        print('<span class="a">Software Engineering Intern</span>  <span class="d">Sep – Nov 2024</span>');
        print("GovTech Agency, Department of Software Development");
        print("Tested in-development systems and reported defects and edge cases to developers.");
      },
    },
    "kubectl get pods": {
      desc: "check what's running",
      run: () => {
        const pods = [
          ["studying-kubernetes", "1/1", "Running", "0", "2mo"],
          ["studying-cloud", "1/1", "Running", "0", "2mo"],
          ["studying-iot", "1/1", "Running", "0", "2mo"],
          ["software-testing", "1/1", "Running", "0", "2mo"],
          ["project-mgmt", "1/1", "Running", "0", "2mo"],
          ["entrepreneurship", "1/1", "Running", "0", "2mo"],
          ["sleep", "0/1", "CrashLoopBackOff", "42", "4y"],
        ];
        print('<span class="d">NAME                READY STATUS            RESTARTS AGE</span>');
        pods.forEach(([n, r, s, rs, a]) => {
          const cls = s === "Running" ? "g" : "r";
          print(`${n.padEnd(20)}${r.padEnd(6)}<span class="${cls}">${s.padEnd(18)}</span>${rs.padEnd(9)}${a}`);
        });
      },
    },
    "nmap pema.dev": {
      desc: "scan me (politely)",
      run: async () => {
        print('<span class="d">Starting Nmap scan against pema.dev ...</span>');
        await wait(500);
        print('<span class="d">PORT       STATE    SERVICE</span>');
        const ports = [
          ["22/tcp", "open", "curiosity"],
          ["80/tcp", "open", "web-development"],
          ["443/tcp", "open", "security-mindset"],
          ["6443/tcp", "open", "kubernetes-api"],
          ["8080/tcp", "open", "jenkins-pipelines"],
          ["31337/tcp", "filtered", "giving-up"],
        ];
        for (const [p, s, v] of ports) {
          await wait(160);
          print(`${p.padEnd(11)}<span class="${s === "open" ? "g" : "a"}">${s.padEnd(9)}</span>${v}`);
        }
        print('<span class="d">Nmap done: 1 host up, 0 vulnerabilities found (still looking).</span>');
      },
    },
    contact: {
      desc: "how to reach me",
      run: () => {
        print('email     <a href="mailto:02230294.cst@rub.edu.bt">02230294.cst@rub.edu.bt</a>');
        print('github    <a href="https://github.com/pemadolker" target="_blank" rel="noopener">github.com/pemadolker</a>');
        print('linkedin  <a href="https://www.linkedin.com/in/pema-dolker-591204326/" target="_blank" rel="noopener">in/pema-dolker</a>');
      },
    },
    cv: {
      desc: "download my CV",
      run: () => {
        print('Downloading <a href="assets/Pema_Dolker_CV.pdf" download>Pema_Dolker_CV.pdf</a> ...');
        const a = document.createElement("a");
        a.href = "assets/Pema_Dolker_CV.pdf";
        a.download = "Pema_Dolker_CV.pdf";
        document.body.appendChild(a); a.click(); a.remove();
      },
    },
    "sudo hire-pema": {
      desc: "you know you want to",
      run: async () => {
        print('<span class="d">[sudo] password for recruiter: ********</span>');
        await wait(600);
        print('<span class="g">Access granted.</span> Opening a new message ...');
        await wait(400);
        window.location.href = "mailto:02230294.cst@rub.edu.bt?subject=Let's%20talk";
      },
    },
    clear: { desc: "clear the screen", run: () => { body.innerHTML = ""; } },
    ls: {
      hidden: true,
      run: () => print('<span class="k">about/</span>  <span class="k">projects/</span>  <span class="k">skills/</span>  <span class="k">journey/</span>  Pema_Dolker_CV.pdf  .secrets'),
    },
    "cat .secrets": { hidden: true, run: () => print('<span class="r">Permission denied.</span> Nice try though.') },
    "rm -rf /": { hidden: true, run: () => print('<span class="r">Blocked.</span> This portfolio has RBAC.') },
    sudo: { hidden: true, run: () => print('Usage: <span class="k">sudo hire-pema</span>') },
    pwd: { hidden: true, run: () => print("/home/pema/phuentsholing") },
    date: { hidden: true, run: () => print(new Date().toString()) },
    echo: { hidden: true, run: () => {} },
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));

  const aliases = { "?": "help", "whoami?": "whoami", "pods": "kubectl get pods", "nmap": "nmap pema.dev", "hire": "sudo hire-pema", "resume": "cv", "exit": "clear" };

  async function exec(raw) {
    const cmd = raw.trim().replace(/\s+/g, " ");
    print(esc(cmd), "cmd");
    if (!cmd) return;
    history.push(cmd); hIndex = history.length;

    const lc = cmd.toLowerCase();
    if (lc.startsWith("echo ")) { print(esc(cmd.slice(5))); gap(); return; }
    const key = COMMANDS[lc] ? lc : aliases[lc];
    if (key && COMMANDS[key]) {
      busy = true;
      try { await COMMANDS[key].run(); } finally { busy = false; }
    } else if (lc.startsWith("kubectl")) {
      print('Try <span class="k">kubectl get pods</span>.');
    } else {
      print(`<span class="r">command not found:</span> ${esc(cmd)}. Type <span class="k">help</span> to see what works.`);
    }
    if (key !== "clear") gap();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const v = input.value;
    input.value = "";
    await exec(v);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      if (hIndex > 0) { hIndex--; input.value = history[hIndex]; }
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (hIndex < history.length - 1) { hIndex++; input.value = history[hIndex]; }
      else { hIndex = history.length; input.value = ""; }
      e.preventDefault();
    } else if (e.key === "Tab") {
      const v = input.value.toLowerCase();
      if (!v) return;
      const match = Object.keys(COMMANDS).find((c) => !COMMANDS[c].hidden && c.startsWith(v));
      if (match) { input.value = match; e.preventDefault(); }
    }
  });

  // clicking inside the output focuses the prompt (unless selecting text or clicking a link)
  $("#terminal").addEventListener("click", (e) => {
    if (e.target.closest("a, button") || window.getSelection().toString()) return;
    input.focus({ preventScroll: true });
  });

  $$(".term__chips button").forEach((b) =>
    b.addEventListener("click", async () => {
      if (busy) return;
      await typeAndRun(b.dataset.cmd);
    })
  );

  async function typeAndRun(cmd) {
    busy = true;
    input.value = "";
    if (!reduceMotion) {
      for (const ch of cmd) { input.value += ch; await new Promise((r) => setTimeout(r, 38)); }
      await new Promise((r) => setTimeout(r, 180));
    }
    input.value = "";
    busy = false;
    await exec(cmd);
  }

  /* boot sequence: the one orchestrated moment on load */
  (async () => {
    print('<span class="d">Last login: today on ttys001 from Phuentsholing, Bhutan</span>');
    print('<span class="d">Type </span><span class="k">help</span><span class="d"> or click a command below.</span>');
    gap();
    await wait(700);
    await typeAndRun("whoami");
  })();
})();
