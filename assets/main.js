/* ==========================================================
   Pema Dolker — notebook portfolio scripts
   ========================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  /* ==========================================================
     Hand-drawn marks: wobbly boxes, a red-pen circle, a margin line.
     Each element gets its own seed so the wobble stays the same
     between reloads but differs from its neighbours.
     ========================================================== */
  const NS = "http://www.w3.org/2000/svg";
  const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const j = (r, amt) => (r() - 0.5) * amt;

  const wobblyLine = (r, x1, y1, x2, y2, amt) => {
    const mx = (x1 + x2) / 2 + j(r, amt), my = (y1 + y2) / 2 + j(r, amt);
    return `M${(x1 + j(r, amt)).toFixed(1)},${(y1 + j(r, amt)).toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${(x2 + j(r, amt)).toFixed(1)},${(y2 + j(r, amt)).toFixed(1)}`;
  };

  const shapes = {
    box(r, w, h) {
      let d = "";
      for (let pass = 0; pass < 2; pass++) {
        const o = pass ? 1.2 : 0;
        d += wobblyLine(r, -2 - o, 0, w + 3, o, 3) + " ";
        d += wobblyLine(r, w + o, -2, w - o, h + 3, 3) + " ";
        d += wobblyLine(r, w + 2, h + o, -3, h - o, 3) + " ";
        d += wobblyLine(r, o, h + 2, -o, -3, 3) + " ";
      }
      return { d, color: "var(--pen)", width: 1.4 };
    },
    circle(r, w, h) {
      const cx = w / 2, cy = h / 2 + 1, rx = w / 2 + 12, ry = h / 2 + 9;
      const start = -2.6 + j(r, 0.3), turns = 1.12, steps = 48;
      let d = "";
      for (let i = 0; i <= steps; i++) {
        const t = start + (i / steps) * Math.PI * 2 * turns;
        const k = 1 + j(r, 0.05) + (i / steps) * 0.06;
        const x = cx + Math.cos(t) * rx * k, yy = cy + Math.sin(t) * ry * k;
        d += (i ? " L" : "M") + x.toFixed(1) + "," + yy.toFixed(1);
      }
      return { d, color: "var(--red)", width: 2 };
    },
    vline(r, w, h) {
      let d = `M3,4`, yy = 4;
      while (yy < h - 4) { const ny = Math.min(h - 4, yy + 40); d += ` Q${(3 + j(r, 4)).toFixed(1)},${((yy + ny) / 2).toFixed(1)} ${(3 + j(r, 2)).toFixed(1)},${ny.toFixed(1)}`; yy = ny; }
      return { d, color: "var(--pen)", width: 1.6 };
    },
  };

  const sketchAll = () => {
    $$("[data-sketch]").forEach((el, i) => {
      const kind = el.dataset.sketch;
      const w = el.offsetWidth, h = el.offsetHeight;
      if (!w || !shapes[kind]) return;
      let svg = el.querySelector(":scope > svg.sketch");
      if (!svg) {
        svg = document.createElementNS(NS, "svg");
        svg.setAttribute("class", "sketch");
        svg.setAttribute("aria-hidden", "true");
        if (getComputedStyle(el).position === "static") el.style.position = "relative";
        el.appendChild(svg);
      }
      const { d, color, width } = shapes[kind](seeded(1234 + i * 977), w, h);
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.innerHTML = `<path d="${d}" stroke="${color}" stroke-width="${width}"/>`;
      if (kind === "vline") { svg.style.width = "8px"; svg.style.left = "0px"; svg.setAttribute("viewBox", `0 0 8 ${h}`); svg.style.transform = "translateX(-3px)"; }
      if ("draw" in el.dataset && !el.dataset.drawn) {
        const p = svg.querySelector("path");
        const len = p.getTotalLength();
        if (reduceMotion) { el.dataset.drawn = 1; return; }
        svg.classList.add("sketch--draw");
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        setTimeout(() => { p.style.strokeDashoffset = 0; el.dataset.drawn = 1; }, 600);
      }
    });
  };

  // hide the arrow on a pipeline step that ends a wrapped row
  const markRowEnds = () => {
    const items = $$(".pipeline li");
    items.forEach((li, i) => {
      const next = items[i + 1];
      li.classList.toggle("row-end", !!next && next.offsetTop > li.offsetTop + 4);
    });
  };
  const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(() => { markRowEnds(); sketchAll(); });
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { markRowEnds(); sketchAll(); }, 150); });

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
        print('<span class="a">sakura-notes</span>        blog platform  <a href="https://wabisabi-blog.vercel.app/" target="_blank" rel="noopener">wabisabi-blog.vercel.app</a>');
        print('<span class="a">quiz-live</span>           Kahoot-style rooms over WebSockets  <a href="https://github.com/pemadolker/SS2025_SWE201_Kahoot" target="_blank" rel="noopener">repo</a>');
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
