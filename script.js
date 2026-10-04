/* =========================================================
   PORSCHE 911 GT3 R
   FINAL JAVASCRIPT
========================================================= */

(() => {
  "use strict";

  /* =========================================================
     HELPERS
  ========================================================== */

  const $ = (selector) => document.querySelector(selector);

  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const lerp = (a, b, t) => a + (b - a) * t;

  const ease = (t) => t * t * (3 - 2 * t);

  /* =========================================================
     ELEMENTS
  ========================================================== */

  const canvas = $("#sceneCanvas");
  const navbar = $("#navbar");

  // HTML page loader
  // Tidak bentrok dengan THREE.GLTFLoader
  const pageLoader = $("#loader");

  const heroHud = $("#heroHud");

  const startEngine = $("#startEngine");
  const musicToggle = $("#musicToggle");

  const rpmNumber = $("#rpmNumber");
  const tachRing = $("#tachRing");
  const tachTicks = $("#tachTicks");

  const porscheTarget = $("#porscheModel");

  /* =========================================================
     MUSIC
  ========================================================== */

  const MUSIC_SRC = "audio/music.mp3";

  const backgroundMusic = new Audio(MUSIC_SRC);

  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.35;

  let musicPlaying = false;

  function updateMusicButton() {
    if (!musicToggle) return;

    musicToggle.textContent = musicPlaying ? "Ⅱ MUSIC" : "♪ MUSIC";

    musicToggle.classList.toggle("playing", musicPlaying);
  }

  async function toggleMusic() {
    try {
      if (musicPlaying) {
        backgroundMusic.pause();

        musicPlaying = false;
      } else {
        await backgroundMusic.play();

        musicPlaying = true;
      }

      updateMusicButton();
    } catch (error) {
      console.warn("Music could not start:", error);
    }
  }

  musicToggle?.addEventListener("click", toggleMusic);

  /* =========================================================
     FORCE LAYERS
  ========================================================== */

  function forceLayers() {
    if (canvas) {
      canvas.style.position = "fixed";
      canvas.style.inset = "0";
      canvas.style.zIndex = "0";
      canvas.style.pointerEvents = "none";
    }

    if (heroHud) {
      heroHud.style.zIndex = "150";
    }

    if (navbar) {
      navbar.style.zIndex = "9999";
    }

    document
      .querySelectorAll(
        ".motorsport, .performance, .atelier, .models, .experience",
      )
      .forEach((section) => {
        section.style.zIndex = "101";
        section.style.display = "block";
        section.style.visibility = "visible";
      });

    if (porscheTarget) {
      porscheTarget.style.position = "absolute";
      porscheTarget.style.inset = "0";
      porscheTarget.style.zIndex = "1";
    }
  }

  forceLayers();

  setInterval(forceLayers, 1000);

  /* =========================================================
     TACHOMETER TICKS
  ========================================================== */

  function createTachTicks() {
    if (!tachTicks) return;

    tachTicks.innerHTML = "";

    const center = 110;
    const radius = 91;

    for (let i = 0; i < 60; i++) {
      const angle = ((-135 + (270 / 59) * i) * Math.PI) / 180;

      const outerX = center + Math.cos(angle) * radius;

      const outerY = center + Math.sin(angle) * radius;

      const innerLength = i % 5 === 0 ? 8 : 4;

      const innerX = center + Math.cos(angle) * (radius - innerLength);

      const innerY = center + Math.sin(angle) * (radius - innerLength);

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );

      line.setAttribute("x1", innerX);

      line.setAttribute("y1", innerY);

      line.setAttribute("x2", outerX);

      line.setAttribute("y2", outerY);

      line.setAttribute("stroke", i > 48 ? "#e21b1b" : "#ffffff");

      line.setAttribute("stroke-opacity", i % 5 === 0 ? ".8" : ".35");

      line.setAttribute("stroke-width", i % 5 === 0 ? "2" : "1");

      tachTicks.appendChild(line);
    }
  }

  createTachTicks();

  /* =========================================================
     ENGINE AUDIO
  ========================================================== */

  let idleAudio = null;

  let audioContext = null;
  let oscillator = null;
  let gainNode = null;

  let engineStarted = false;

  // Digunakan untuk membatalkan animasi RPM
  let rpmAnimationId = null;

  function setupEngineAudio() {
    if (idleAudio) return;

    idleAudio = new Audio("audio/porsche-idle.mp3");

    idleAudio.loop = true;

    idleAudio.volume = 0.6;

    /*
      PENTING:
      Tidak ada .play() di sini.
      Audio hanya akan dimainkan setelah
      tombol START ENGINE ditekan.
    */
  }

  function createSyntheticEngine() {
    if (audioContext) return;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      oscillator = audioContext.createOscillator();

      gainNode = audioContext.createGain();

      oscillator.type = "sawtooth";

      oscillator.frequency.value = 42;

      gainNode.gain.value = 0.0001;

      oscillator.connect(gainNode);

      gainNode.connect(audioContext.destination);

      oscillator.start();
    } catch (error) {
      console.warn("WebAudio unavailable:", error);
    }
  }

  /* =========================================================
     RESET RPM
  ========================================================== */

  function resetRPM() {
    // Batalkan animasi RPM sebelumnya
    if (rpmAnimationId) {
      cancelAnimationFrame(rpmAnimationId);

      rpmAnimationId = null;
    }

    if (rpmNumber) {
      rpmNumber.textContent = "00";
    }

    if (gainNode) {
      gainNode.gain.value = 0.0001;
    }
  }

  /* =========================================================
     RPM ANIMATION
  ========================================================== */

  function animateRPM() {
    if (!rpmNumber) return;

    // Hentikan animasi RPM lama
    if (rpmAnimationId) {
      cancelAnimationFrame(rpmAnimationId);
    }

    const start = performance.now();

    const duration = 2500;

    function frame(now) {
      /*
        Kalau engine sudah dimatikan,
        jangan lanjutkan animasi.
      */
      if (!engineStarted) {
        rpmAnimationId = null;
        return;
      }

      const elapsed = now - start;

      const progress = clamp(elapsed / duration, 0, 1);

      let value;

      if (progress < 0.5) {
        value = ease(progress / 0.5) * 9250;
      } else {
        value = (1 - ease((progress - 0.5) / 0.5)) * 9250;
      }

      rpmNumber.textContent = Math.round(value / 100)
        .toString()
        .padStart(2, "0");

      if (oscillator && audioContext && gainNode) {
        oscillator.frequency.value = 35 + (value / 100) * 0.9;

        gainNode.gain.value = 0.0001 + (value / 9250) * 0.018;
      }

      if (progress < 1) {
        rpmAnimationId = requestAnimationFrame(frame);
      } else {
        /*
          Setelah rev animation selesai,
          RPM kembali ke idle.
        */

        if (engineStarted) {
          rpmNumber.textContent = "08";

          if (gainNode) {
            gainNode.gain.value = 0.002;
          }

          rpmAnimationId = null;
        }
      }
    }

    rpmAnimationId = requestAnimationFrame(frame);
  }

  /* =========================================================
     START ENGINE
  ========================================================== */

  async function startEngineSequence() {
    /*
      Kalau sudah hidup, jangan start
      ulang audio setiap klik.
    */
    if (engineStarted) {
      return;
    }

    setupEngineAudio();

    createSyntheticEngine();

    try {
      if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume();
      }
    } catch (error) {
      console.warn("Audio context could not resume:", error);
    }

    if (idleAudio) {
      try {
        idleAudio.currentTime = 0;

        await idleAudio.play();
      } catch (error) {
        console.warn("Idle engine audio blocked:", error);

        return;
      }
    }

    engineStarted = true;

    animateRPM();

    if (startEngine) {
      startEngine.classList.add("engine-started");

      /*
        Kalau HTML tombolnya berisi
        START ENGINE, ubah menjadi STOP.
      */
      const text = startEngine.querySelector("span");

      if (text) {
        text.textContent = "STOP ENGINE";
      } else {
        startEngine.textContent = "STOP ENGINE";
      }
    }
  }

  /* =========================================================
     STOP ENGINE
  ========================================================== */

  function stopEngine() {
    if (!engineStarted) {
      return;
    }

    /*
      Matikan status engine terlebih dahulu
      supaya animasi RPM langsung berhenti.
    */
    engineStarted = false;

    /* -------------------------------------------------------
       STOP REAL ENGINE AUDIO
    ------------------------------------------------------- */

    if (idleAudio) {
      idleAudio.pause();

      idleAudio.currentTime = 0;
    }

    /* -------------------------------------------------------
       STOP SYNTHETIC ENGINE
    ------------------------------------------------------- */

    if (gainNode) {
      gainNode.gain.value = 0.0001;
    }

    /* -------------------------------------------------------
       RESET RPM
    ------------------------------------------------------- */

    resetRPM();

    /* -------------------------------------------------------
       BUTTON STATE
    ------------------------------------------------------- */

    if (startEngine) {
      startEngine.classList.remove("engine-started");

      const text = startEngine.querySelector("span");

      if (text) {
        text.textContent = "START ENGINE";
      } else {
        startEngine.textContent = "START ENGINE";
      }
    }
  }

  /* =========================================================
     ENGINE BUTTON
  ========================================================== */

  startEngine?.addEventListener("click", async () => {
    if (engineStarted) {
      stopEngine();
    } else {
      await startEngineSequence();
    }
  });

  /* =========================================================
     THREE.JS
  ========================================================== */

  if (!canvas || typeof THREE === "undefined") {
    console.error("Three.js is not available.");

    return;
  }

  let scene;
  let camera;
  let renderer;

  let porsche = null;
  let modelReady = false;

  let clock;

  /* =========================================================
     CAMERA STATE
  ========================================================== */

  const cameraState = {
    angle: Math.PI / 2 - 0.45,

    radius: 9.5,

    height: 1.45,

    lookY: 0.85,
  };

  let targetManualRotation = 0;
  let manualRotation = 0;

  let pointerX = 0;
  let pointerY = 0;

  let targetPointerX = 0;
  let targetPointerY = 0;

  /* =========================================================
     THREE INIT
  ========================================================== */

  function initThree() {
    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x030303);

    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );

    camera.position.set(7, 2.5, 7);

    renderer = new THREE.WebGLRenderer({
      canvas,

      antialias: true,

      alpha: true,

      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.outputEncoding = THREE.sRGBEncoding;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure = 0.75;

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene.fog = new THREE.FogExp2(0x030303, 0.035);

    createEnvironment();

    createLights();

    createFloor();

    loadPorsche();
  }

  /* =========================================================
     ENVIRONMENT
  ========================================================== */

  function createEnvironment() {
    const pmrem = new THREE.PMREMGenerator(renderer);

    const envScene = new THREE.Scene();

    envScene.background = new THREE.Color(0x060606);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(20, 32, 32),

      new THREE.MeshBasicMaterial({
        color: 0x070707,

        side: THREE.BackSide,
      }),
    );

    envScene.add(sphere);

    const panelGeometry = new THREE.PlaneGeometry(12, 12);

    const panelMaterial = new THREE.MeshBasicMaterial({
      color: 0x171717,

      side: THREE.DoubleSide,
    });

    const panel = new THREE.Mesh(panelGeometry, panelMaterial);

    panel.position.set(-6, 3, 2);

    panel.rotation.y = Math.PI / 2;

    envScene.add(panel);

    const envTexture = pmrem.fromScene(envScene, 0.04).texture;

    scene.environment = envTexture;

    pmrem.dispose();
  }

  /* =========================================================
     LIGHTING
  ========================================================== */

  function createLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);

    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 2.2);

    key.position.set(5, 8, 6);

    key.castShadow = true;

    key.shadow.mapSize.width = 2048;

    key.shadow.mapSize.height = 2048;

    scene.add(key);

    const redLight = new THREE.PointLight(0xe21b1b, 7, 14);

    redLight.position.set(-4, 2, 4);

    scene.add(redLight);

    const coolLight = new THREE.PointLight(0x6fa4d8, 4, 14);

    coolLight.position.set(4, 3, -4);

    scene.add(coolLight);

    const rim = new THREE.DirectionalLight(0xffffff, 1.5);

    rim.position.set(-5, 4, -6);

    scene.add(rim);
  }

  /* =========================================================
     FLOOR
  ========================================================== */

  function createFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),

      new THREE.MeshStandardMaterial({
        color: 0x050505,

        roughness: 0.8,

        metalness: 0.15,
      }),
    );

    floor.rotation.x = -Math.PI / 2;

    floor.position.y = -0.03;

    floor.receiveShadow = true;

    scene.add(floor);

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),

      new THREE.MeshBasicMaterial({
        color: 0x250000,

        transparent: true,

        opacity: 0.18,
      }),
    );

    glow.rotation.x = -Math.PI / 2;

    glow.position.y = -0.025;

    scene.add(glow);
  }

  /* =========================================================
     LOAD PORSCHE GLB
  ========================================================== */

  function loadPorsche() {
    // GLTF loader punya nama sendiri
    // supaya tidak bentrok dengan pageLoader
    const loader = new THREE.GLTFLoader();

    loader.load(
      "models/Porsche_992_GT3R.glb",

      (gltf) => {
        porsche = gltf.scene;

        porsche.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;

            child.receiveShadow = true;

            if (child.material) {
              child.material.needsUpdate = true;
            }

            if (child.name.toLowerCase().includes("carpaint_inst")) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xb50000,

                metalness: 0.65,

                roughness: 0.28,
              });
            }
          }
        });

        /* ---------------------------------------------------
           NORMALIZE MODEL SIZE
        --------------------------------------------------- */

        const box = new THREE.Box3().setFromObject(porsche);

        const size = box.getSize(new THREE.Vector3());

        const maxDimension = Math.max(size.x, size.y, size.z);

        const targetSize = 5.8;

        const scale = targetSize / maxDimension;

        porsche.scale.setScalar(scale);

        /* ---------------------------------------------------
           CENTER MODEL
        --------------------------------------------------- */

        const scaledBox = new THREE.Box3().setFromObject(porsche);

        const center = scaledBox.getCenter(new THREE.Vector3());

        porsche.position.x -= center.x;

        porsche.position.z -= center.z;

        const finalBox = new THREE.Box3().setFromObject(porsche);

        porsche.position.y -= finalBox.min.y;

        scene.add(porsche);

        modelReady = true;

        console.log("Porsche 911 GT3 R loaded.");

        setTimeout(() => {
          pageLoader?.classList.add("loaded");

          navbar?.classList.add("show");
        }, 500);
      },

      undefined,

      (error) => {
        console.error("Failed to load Porsche model:", error);

        pageLoader?.classList.add("loaded");

        navbar?.classList.add("show");
      },
    );
  }

  /* =========================================================
     POINTER
  ========================================================== */

  window.addEventListener(
    "pointermove",
    (event) => {
      targetPointerX = (event.clientX / window.innerWidth) * 2 - 1;

      targetPointerY = (event.clientY / window.innerHeight) * 2 - 1;
    },
    {
      passive: true,
    },
  );

  let dragging = false;

  let dragStartX = 0;

  let dragStartRotation = 0;

  window.addEventListener("pointerdown", (event) => {
    dragging = true;

    dragStartX = event.clientX;

    dragStartRotation = targetManualRotation;
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
  });

  window.addEventListener("pointercancel", () => {
    dragging = false;
  });

  window.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    const delta = event.clientX - dragStartX;

    targetManualRotation = dragStartRotation + delta * 0.008;
  });

  /* =========================================================
     SECTION PROGRESS
  ========================================================== */

  function sectionProgress(element) {
    if (!element) return 0;

    const rect = element.getBoundingClientRect();

    const progress = (window.innerHeight - rect.top) / rect.height;

    return clamp(progress, 0, 1);
  }

  /* =========================================================
     SCROLL STATE
  ========================================================== */

  let scrollY = window.scrollY;

  let smoothScroll = scrollY;

  window.addEventListener(
    "scroll",
    () => {
      scrollY = window.scrollY;
    },
    {
      passive: true,
    },
  );

  /* =========================================================
     REVEAL ON SCROLL
  ========================================================== */

  const revealElements = $$(".reveal");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.12,

      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });

  /* =========================================================
     NAVBAR
  ========================================================== */

  function updateNavbar() {
    if (!navbar) return;

    if (window.scrollY > 60) {
      navbar.classList.add("show");
    } else {
      navbar.classList.add("show");
    }
  }

  /* =========================================================
     HERO FADE
  ========================================================== */

  function updateHero() {
    if (!heroHud) return;

    const progress = clamp(window.scrollY / window.innerHeight, 0, 1);

    const opacity = 1 - ease(progress);

    heroHud.style.opacity = opacity;

    const heroContent = document.querySelector(".hero-content");

    if (heroContent) {
      heroContent.style.transform = `
        translate(
          -50%,
          calc(
            -50% +
            ${progress * -80}px
          )
        )
      `;
    }
  }

  /* =========================================================
     THREE CAMERA SCROLL
  ========================================================== */

  function updateCarScroll() {
    if (!camera || !porsche) {
      return;
    }

    const carScroll = $("#carScroll");

    if (!carScroll) return;

    const progress = sectionProgress(carScroll);

    const eased = ease(progress);

    /*
      Camera begins in front three-quarter
      and gradually moves around the car.
    */

    const startAngle = Math.PI / 2 - 0.45;

    const endAngle = Math.PI * 2 + 0.15;

    const angle = lerp(startAngle, endAngle, eased) + manualRotation;

    const radius = lerp(9.5, 7.0, eased);

    const height = lerp(1.45, 2.2, eased);

    camera.position.x = Math.cos(angle) * radius;

    camera.position.z = Math.sin(angle) * radius;

    camera.position.y = height;

    camera.lookAt(0, cameraState.lookY, 0);
  }

  /* =========================================================
     MODEL FLOAT / PARALLAX
  ========================================================== */

  function updateModel() {
    if (!porsche) return;

    pointerX = lerp(pointerX, targetPointerX, 0.04);

    pointerY = lerp(pointerY, targetPointerY, 0.04);

    const time = clock.getElapsedTime();

    const floating = Math.sin(time * 1.1) * 0.025;

    porsche.position.y = floating;

    const carScroll = $("#carScroll");

    const progress = carScroll ? sectionProgress(carScroll) : 0;

    const targetRotation = targetManualRotation + pointerX * 0.08;

    manualRotation = lerp(manualRotation, targetRotation, 0.06);

    porsche.rotation.y = manualRotation;

    porsche.rotation.x = pointerY * 0.015;

    /*
      Slight model movement during
      scroll without changing the actual car.
    */

    porsche.position.x = pointerX * 0.08;
  }

  /* =========================================================
     LIGHT PULSE
  ========================================================== */

  function updateLights() {
    if (!scene) return;

    const time = clock.getElapsedTime();

    scene.traverse((object) => {
      if (object.isPointLight) {
        if (object.color && object.color.r > 0.5 && object.color.g < 0.2) {
          object.intensity = 6.5 + Math.sin(time * 1.3) * 0.8;
        }
      }
    });
  }

  /* =========================================================
     TACH ROTATION
  ========================================================== */

  function updateTach() {
    if (!tachRing) return;

    const rotation = window.scrollY * 0.00018;

    tachRing.style.transform = `rotate(${rotation}rad)`;
  }

  /* =========================================================
     RENDER LOOP
  ========================================================== */

  function render() {
    requestAnimationFrame(render);

    smoothScroll = lerp(smoothScroll, scrollY, 0.08);

    updateNavbar();

    updateHero();

    updateCarScroll();

    updateModel();

    updateLights();

    updateTach();

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  /* =========================================================
     RESIZE
  ========================================================== */

  function resize() {
    if (!camera || !renderer) {
      return;
    }

    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  window.addEventListener("resize", resize);

  /* =========================================================
     SMOOTH ANCHOR
  ========================================================== */

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",

        block: "start",
      });
    });
  });

  /* =========================================================
     INITIALIZE
  ========================================================== */

  updateMusicButton();

  /*
    IMPORTANT:
    Tidak ada startEngineSequence()
    di sini.

    Jadi engine TIDAK akan autoplay.
    Engine hanya hidup setelah tombol
    START ENGINE diklik.
  */

  initThree();

  render();

  console.log("Porsche 911 GT3 R website initialized.");
})();
