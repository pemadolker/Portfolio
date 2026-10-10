/* ==========================================================
   Pema Dolker — portfolio scripts
   ========================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ==========================================================
     Intro: CSS runs the ensō + cat animation, JS ends it.
     ========================================================== */
  const INTRO_MS = 3250;
  let introTimer = null;
  const endIntro = () => {
    clearTimeout(introTimer);
    root.classList.add("no-intro");
    requestAnimationFrame(() => root.classList.add("revealed"));
    try { sessionStorage.setItem("seen-intro", "1"); } catch (e) {}
  };
  const bindSkip = () => { const s = $("#intro-skip"); if (s) s.addEventListener("click", endIntro); };

  if (root.classList.contains("no-intro")) {
    root.classList.add("revealed");
  } else {
    bindSkip();
    introTimer = setTimeout(endIntro, INTRO_MS);
  }

  const replay = $("#replay");
  if (replay) {
    replay.addEventListener("click", () => {
      if (reduceMotion) return;
      const cur = $("#intro");
      const fresh = cur.cloneNode(true);      // re-inserting restarts the CSS animations
      cur.replaceWith(fresh);
      root.classList.remove("no-intro", "revealed");
      window.scrollTo({ top: 0 });
      bindSkip();
      clearTimeout(introTimer);
      introTimer = setTimeout(endIntro, INTRO_MS);
    });
  }

  /* ==========================================================
     The layer stack
     ========================================================== */
  const LAYERS = {
    code: {
      title: "Code",
      text: "Web apps from the interface to the API, with real-time features and databases behind them.",
      tools: ["React", "Next.js", "Node.js", "Express", "WebSockets", "PostgreSQL", "MongoDB", "Redis", "Supabase", "Python", "TypeScript"],
    },
    container: {
      title: "Container",
      text: "Packaging each part of an app into its own container so it runs the same everywhere.",
      tools: ["Docker", "Docker Compose", "Linux", "Bash"],
    },
    cluster: {
      title: "Cluster",
      text: "Running and scaling containers with Kubernetes, with separate setups for each environment.",
      tools: ["Kubernetes", "kubectl", "Kustomize", "Helm", "kind", "Minikube"],
    },
    cloud: {
      title: "Cloud",
      text: "Deploying to the cloud, with pipelines that build, test and ship every change.",
      tools: ["AWS", "ECS / Fargate", "IAM", "S3", "DynamoDB", "CloudWatch", "GitHub Actions", "Jenkins", "Render", "Vercel"],
    },
  };
  const panel = $("#stack-panel");
  const tabs = $$(".stack [data-layer]");
  const setLayer = (name) => {
    const L = LAYERS[name];
    if (!L || !panel) return;
    tabs.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.layer === name)));
    panel.innerHTML = `<h3>${L.title}</h3><p>${L.text}</p><ul class="tools">${L.tools.map((t) => `<li>${t}</li>`).join("")}</ul>`;
  };
  tabs.forEach((b) => b.addEventListener("click", () => setLayer(b.dataset.layer)));
  const stackEl = $("#stack");
  if (stackEl) {
    stackEl.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0 || !["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
      e.preventDefault();
      const next = tabs[(i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      setLayer(next.dataset.layer);
    });
  }
  setLayer("code");

  /* ==========================================================
     The cat on the card: eyes follow you, blinks now and then,
     and says something if you pet it.
     ========================================================== */
  const perch = $("#perch");
  if (perch) {
    const pupils = $(".cat__pupils", perch);
    const say = $(".perch__say", perch);
    const lines = ["mrrp", "purr...", "meow", "*slow blink*", "hire her", "nyaa"];
    let lineIdx = 0;

    if (!reduceMotion) {
      let raf = 0;
      window.addEventListener("pointermove", (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = perch.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height * 0.36;
          const dx = e.clientX - cx, dy = e.clientY - cy;
          const d = Math.hypot(dx, dy) || 1;
          const k = Math.min(1, d / 220);
          pupils.style.transform = `translate(${((dx / d) * 3.4 * k).toFixed(2)}px, ${((dy / d) * 2.2 * k).toFixed(2)}px)`;
        });
      }, { passive: true });

      // idle: blink and flick the tail every few seconds
      setInterval(() => {
        perch.classList.remove("is-idle");
        void perch.offsetWidth;
        perch.classList.add("is-idle");
      }, 5200);
    }

    let talkTimer;
    perch.addEventListener("click", () => {
      say.textContent = lines[lineIdx++ % lines.length];
      perch.classList.add("is-talking");
      perch.classList.remove("is-idle");
      void perch.offsetWidth;
      perch.classList.add("is-idle");
      clearTimeout(talkTimer);
      talkTimer = setTimeout(() => perch.classList.remove("is-talking"), 1400);
    });
  }

  /* ==========================================================
     Terminal. Every command goes into a queue, so typing never
     gets blocked or lost while an earlier command is printing.
     ========================================================== */
  const body = $("#term-body");
  const form = $("#term-form");
  const input = $("#term-in");
  if (!body || !form || !input) return;

  const history = [];
  let hIndex = 0;
  let queue = Promise.resolve();

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const print = (html, cls) => {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    p.innerHTML = html;
    body.appendChild(p);
    body.scrollTop = body.scrollHeight;
  };
  const row = (html) => print(html, "pre");   // table rows: never wrap, scroll sideways instead
  const gap = () => print("", "gap");

  const COMMANDS = {
    help: {
      desc: "list commands",
      run: () => {
        print("Commands you can run:");
        Object.entries(COMMANDS).forEach(([name, c]) => {
          if (!c.hidden) row(`  <span class="k">${name.padEnd(17)}</span><span class="d">${c.desc}</span>`);
        });
        print('<span class="d">Tip: ↑ and ↓ for history, Tab to autocomplete.</span>');
      },
    },
    whoami: {
      desc: "who is Pema?",
      run: () => {
        print('<span class="a">Pema Dolker</span>');
        print("Final-year B.E. Software Engineering student");
        print("College of Science and Technology, Royal University of Bhutan");
        print('Into: <span class="k">cloud</span>, <span class="k">DevOps</span>, <span class="k">security</span>, <span class="k">full-stack</span>');
      },
    },
    skills: {
      desc: "what I work with",
      run: () => {
        [
          ["languages", "Python, JavaScript, TypeScript, C++, SQL, Bash"],
          ["web", "React, Next.js, Node.js, Express, WebSockets"],
          ["data", "PostgreSQL, MongoDB, Redis, Supabase"],
          ["devops", "Docker, Compose, Kubernetes, Kustomize, Helm"],
          ["cloud", "AWS (IAM, ECS/Fargate, VPC, S3), Render, Vercel"],
          ["ci/cd", "GitHub Actions, Jenkins"],
          ["security", "Burp Suite, Nmap, Wireshark, Metasploit"],
        ].forEach(([k, v]) => print(`<span class="k">${k.padEnd(10)}</span>${v}`));
      },
    },
    projects: {
      desc: "things I've built",
      run: () => {
        row('<span class="a">auction-platform</span>   microservices, Docker Compose');
        row('<span class="a">containerised-app</span>  React/Node/Postgres, CI/CD, k8s');
        row('<span class="a">wabi-sabi</span>          blog  <a href="https://wabisabi-blog.vercel.app/" target="_blank" rel="noopener">wabisabi-blog.vercel.app</a>');
        row('<span class="a">quiz-live</span>          Kahoot-style  <a href="https://github.com/pemadolker/SS2025_SWE201_Kahoot" target="_blank" rel="noopener">repo</a>');
        row('<span class="a">render-deploy</span>      Express + Postgres, GitHub Actions');
      },
    },
    experience: {
      desc: "where I've worked",
      run: () => {
        print('<span class="a">Software Engineering Intern</span>  <span class="d">Sep – Nov 2024</span>');
        print("GovTech Agency, Bhutan");
        print("Tested in-development systems, reported defects and edge cases,");
        print("and took on CTF-based security work.");
      },
    },
    "kubectl get pods": {
      desc: "what's running",
      run: () => {
        row('<span class="d">NAME              READY  STATUS            RESTARTS  AGE</span>');
        [
          ["wabi-sabi-blog", "1/1", "Running", "0", "1y"],
          ["auction-platform", "1/1", "Running", "0", "6mo"],
          ["quiz-rooms", "1/1", "Running", "0", "1y"],
          ["cka-prep", "1/1", "Running", "3", "2mo"],
          ["black-cat", "1/1", "Running", "0", "∞"],
          ["sleep", "0/1", "CrashLoopBackOff", "42", "4y"],
        ].forEach(([n, r, s, rs, a]) =>
          row(`${n.padEnd(18)}${r.padEnd(7)}<span class="${s === "Running" ? "g" : "r"}">${s.padEnd(18)}</span>${rs.padEnd(10)}${a}`)
        );
      },
    },
    "nmap pema.dev": {
      desc: "scan me (politely)",
      run: async () => {
        print('<span class="d">Starting Nmap scan against pema.dev ...</span>');
        await wait(350);
        row('<span class="d">PORT       STATE     SERVICE</span>');
        for (const [p, s, v] of [
          ["22/tcp", "open", "curiosity"],
          ["80/tcp", "open", "web-development"],
          ["443/tcp", "open", "security-mindset"],
          ["6443/tcp", "open", "kubernetes-api"],
          ["8080/tcp", "open", "jenkins-pipelines"],
          ["31337/tcp", "filtered", "giving-up"],
        ]) {
          await wait(110);
          row(`${p.padEnd(11)}<span class="${s === "open" ? "g" : "a"}">${s.padEnd(10)}</span>${v}`);
        }
        print('<span class="d">Done: 1 host up, 0 vulnerabilities found (still looking).</span>');
      },
    },
    cat: {
      desc: "there is a cat",
      run: () => {
        row(" /\\_/\\");
        row("( o.o )   mrrp.");
        row(' > ^ <    try <span class="k">cat about.txt</span>');
      },
    },
    "cat about.txt": {
      hidden: true,
      run: () => {
        print("Software engineering student from Bhutan. I build across the stack,");
        print("from code to containers to the cloud, and look for where it breaks.");
        print('Wabi-sabi fan. Black-cat person.');
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
        print('Here you go: <a href="assets/Pema_Dolker_CV.pdf" download>Pema_Dolker_CV.pdf</a>');
      },
    },
    "sudo hire-pema": {
      desc: "you know you want to",
      run: async () => {
        print('<span class="d">[sudo] password for recruiter: ********</span>');
        await wait(500);
        print('<span class="g">Access granted.</span> Opening an email to Pema ...');
        await wait(300);
        window.location.href = "mailto:02230294.cst@rub.edu.bt?subject=Let%27s%20talk";
      },
    },
    clear: { desc: "clear the screen", run: () => { body.innerHTML = ""; } },
    ls: { hidden: true, run: () => print('<span class="k">projects/</span>  <span class="k">security/</span>  about.txt  Pema_Dolker_CV.pdf  .secrets') },
    "cat .secrets": { hidden: true, run: () => print('<span class="r">Permission denied.</span> Nice try though.') },
    "rm -rf /": { hidden: true, run: () => print('<span class="r">Blocked.</span> This portfolio has RBAC.') },
    pwd: { hidden: true, run: () => print("/home/pema/phuentsholing") },
    date: { hidden: true, run: () => print(new Date().toString()) },
    sudo: { hidden: true, run: () => print('Usage: <span class="k">sudo hire-pema</span>') },
  };
  const ALIASES = { "?": "help", man: "help", pods: "kubectl get pods", nmap: "nmap pema.dev", hire: "sudo hire-pema", resume: "cv", exit: "clear", about: "cat about.txt", meow: "cat" };

  async function exec(raw) {
    const cmd = raw.trim().replace(/\s+/g, " ");
    print(esc(cmd), "cmd");
    if (!cmd) return;

    const lc = cmd.toLowerCase();
    if (lc.startsWith("echo ")) { print(esc(cmd.slice(5))); gap(); return; }
    const key = COMMANDS[lc] ? lc : ALIASES[lc];
    try {
      if (key) await COMMANDS[key].run();
      else if (lc.startsWith("kubectl")) print('Try <span class="k">kubectl get pods</span>.');
      else print(`<span class="r">command not found:</span> ${esc(cmd)}. Type <span class="k">help</span> to see what works.`);
    } catch (err) {
      print('<span class="r">Something went wrong running that.</span> Try another command.');
    }
    if (key !== "clear") gap();
  }
  const run = (cmd) => { queue = queue.then(() => exec(cmd)); return queue; };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = "";
    if (v.trim()) { history.push(v.trim()); hIndex = history.length; }
    run(v);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      if (hIndex > 0) { hIndex--; input.value = history[hIndex]; }
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (hIndex < history.length - 1) { hIndex++; input.value = history[hIndex]; }
      else { hIndex = history.length; input.value = ""; }
      e.preventDefault();
    } else if (e.key === "Tab" && input.value) {
      const v = input.value.toLowerCase();
      const match = Object.keys(COMMANDS).find((c) => !COMMANDS[c].hidden && c.startsWith(v));
      if (match) { input.value = match; e.preventDefault(); }
    }
  });

  // tapping anywhere in the output focuses the prompt (not when selecting text or tapping a link)
  body.addEventListener("click", (e) => {
    if (e.target.closest("a") || (window.getSelection && window.getSelection().toString())) return;
    input.focus({ preventScroll: true });
  });

  $$(".term__chips button").forEach((b) => b.addEventListener("click", () => run(b.dataset.cmd)));

  print('<span class="d">Welcome. Type </span><span class="k">help</span><span class="d"> or tap a command below.</span>');
  gap();
  run("whoami");
})();
