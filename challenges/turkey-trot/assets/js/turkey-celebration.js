"use strict";

(() => {
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const styles = document.createElement("style");

    styles.textContent = `
        .trot-feather-turkey {
            margin: 18px 0;
            padding: 18px 12px 14px;
            border: 1px solid #e1cfad;
            border-radius: 14px;
            background:
                radial-gradient(
                    ellipse at center,
                    #fffdf4,
                    #f5e7ca
                );
            text-align: center;
        }

        .trot-feather-turkey svg {
            display: block;
            width: min(100%, 340px);
            height: auto;
            margin: 0 auto;
            overflow: visible;
        }

        .trot-feather-turkey figcaption {
            margin-top: 4px;
            color: #795335;
            font: italic 16px/1.4 Georgia, serif;
        }

        .trot-tail-feather {
            transform-box: fill-box;
            transform-origin: center bottom;
        }

        .trot-tail-feather--new {
            animation: trot-feather-arrive 850ms ease-out;
        }

        @keyframes trot-feather-arrive {
            from {
                opacity: 0;
                translate: 0 18px;
                scale: .7;
            }

            to {
                opacity: 1;
                translate: 0 0;
                scale: 1;
            }
        }

        .trot-celebration-layer {
            position: fixed;
            inset: 0;
            z-index: 9999;
            overflow: hidden;
            pointer-events: none;
        }

        .trot-falling-leaf {
            position: absolute;
            top: -70px;
            left: var(--leaf-left);
            width: var(--leaf-size);
            height: var(--leaf-size);
            opacity: 0;
            animation:
                trot-leaf-fall
                var(--leaf-duration)
                var(--leaf-delay)
                linear
                both;
        }

        .trot-falling-leaf svg {
            display: block;
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 3px 2px #49321f20);
        }

        @keyframes trot-leaf-fall {
            0% {
                opacity: 0;
                transform: translate3d(0, 0, 0) rotate(0deg);
            }

            8% {
                opacity: .95;
            }

            28% {
                transform:
                    translate3d(
                        var(--leaf-sway),
                        30vh,
                        0
                    )
                    rotate(100deg);
            }

            55% {
                transform:
                    translate3d(
                        calc(var(--leaf-sway) * -1),
                        60vh,
                        0
                    )
                    rotate(210deg);
            }

            80% {
                opacity: .9;
                transform:
                    translate3d(
                        var(--leaf-sway),
                        85vh,
                        0
                    )
                    rotate(300deg);
            }

            100% {
                opacity: 0;
                transform:
                    translate3d(
                        0,
                        calc(100vh + 140px),
                        0
                    )
                    rotate(420deg);
            }
        }

        .trot-celebration-message {
            position: fixed;
            top: max(24px, env(safe-area-inset-top));
            left: 50%;
            z-index: 10000;
            width: min(460px, calc(100% - 32px));
            padding: 22px;
            border: 1px solid #d4ac67;
            border-radius: 18px;
            background: #fff9e9;
            color: #49321f;
            box-shadow: 0 14px 50px #49321f30;
            text-align: center;
            transform: translateX(-50%);
            pointer-events: none;
        }

        .trot-celebration-message strong {
            display: block;
            margin-bottom: 8px;
            font: normal 28px/1.15 Georgia, serif;
        }

        .trot-celebration-message span {
            font-size: 14px;
            line-height: 1.5;
        }

        .trot-replay-celebration {
            display: block;
            margin: 20px auto;
        }

        @media (prefers-reduced-motion: reduce) {
            .trot-tail-feather--new {
                animation: none;
            }
        }
    `;

    document.head.appendChild(styles);

    const collection = document.getElementById(
        "trot-collection-preview"
    );

    const completion = document.getElementById(
        "challenge-completion"
    );

    const counter = document.getElementById(
        "trot-feather-count"
    );

    if (!collection || !completion || !counter) {
        return;
    }

    const turkey = document.createElement("figure");

    turkey.className = "trot-feather-turkey";
    turkey.setAttribute("aria-label", "Your earned feather turkey");

    collection.before(turkey);

    const replay = document.createElement("button");

    replay.type = "button";
    replay.className =
        "trot-button trot-replay-celebration";

    replay.textContent = "Celebrate again";
    replay.hidden = true;

    completion.querySelector(
        ".challenge-completion__card"
    ).appendChild(replay);

    const finisherAward = document.createElement("div");

    finisherAward.className = "trot-ribbon-award";
    finisherAward.innerHTML = `
        <img
            src="./assets/images/turkey-trot-finisher-ribbon2.png"
            alt=""
        >
        <h4>Turkey Trot Finisher</h4>
        <p>You reached 300,000 steps!</p>
    `;

    replay.before(finisherAward);

    let previousCount = -1;
    let previouslyComplete = false;
    let celebrationTimer = null;
    let activeLayer = null;
    let activeMessage = null;

    function renderTurkey(count) {
        const gainedFeather =
            previousCount >= 0 && count > previousCount;

        const feathers = Array.from(
            { length: challengeConfig.totalDays },
            (_, index) => {
                const earned = index < count;
                const angle =
                    -87 + index * (174 / 29);

                const set =
                    challengeConfig.featherCollections[
                        Math.floor(index / 6)
                    ];

                const color = earned
                    ? set.color
                    : "#d9cfbc";

                const opacity = earned ? 1 : 0.45;

                const newest =
                    gainedFeather && index === count - 1;

                return `
                    <g transform="rotate(${angle} 200 198)">
                        <g
                            class="
                                trot-tail-feather
                                ${newest
                                    ? "trot-tail-feather--new"
                                    : ""}
                            "
                            opacity="${opacity}"
                        >
                            <path
                                d="
                                    M200 198
                                    C185 150 187 60 200 28
                                    C213 60 215 150 200 198
                                    Z
                                "
                                fill="${color}"
                                stroke="#846548"
                                stroke-width=".8"
                            />

                            <path
                                d="M200 48V190"
                                stroke="#fff2cf"
                                stroke-width="1.2"
                                opacity=".7"
                            />

                            <path
                                d="
                                    M200 75l-6-9
                                    M200 100l6-9
                                    M200 125l-6-9
                                "
                                stroke="#fff2cf"
                                stroke-width="1.5"
                                fill="none"
                                opacity=".8"
                            />
                        </g>
                    </g>
                `;
            }
        ).join("");

        const caption = count === 30
            ? "Thirty days of showing up. One magnificent tail."
            : count === 0
                ? "A little movement. A little more color."
                : `${count} earned ${
                    count === 1 ? "feather" : "feathers"
                }. Watch your turkey come to life.`;

                turkey.classList.toggle(
                    "is-fully-feathered",
                    count === challengeConfig.totalDays
                );
        turkey.innerHTML = `
            <svg
                viewBox="0 0 400 290"
                role="img"
                aria-label="${count} of 30 tail feathers earned"
            >
                <ellipse
                    cx="200"
                    cy="269"
                    rx="65"
                    ry="8"
                    fill="#684521"
                    opacity=".10"
                />

                ${feathers}

                <path
                    d="
                        M183 239v22l-13 7
                        m13-7 10 7
                        m27-29v22l13 7
                        m-13-7-10 7
                    "
                    stroke="#a6652e"
                    stroke-width="5"
                    stroke-linecap="round"
                    fill="none"
                />

                <ellipse
                    cx="200"
                    cy="211"
                    rx="43"
                    ry="40"
                    fill="#70432d"
                />

                <path
                    d="
                        M167 203
                        C155 232 180 245 195 225
                        C177 228 184 211 167 203
                        Z
                    "
                    fill="#b97744"
                />

                <ellipse
                    cx="211"
                    cy="169"
                    rx="23"
                    ry="29"
                    fill="#bb7848"
                />

                <path
                    d="M228 174l18 8-19 7"
                    fill="#e8b343"
                />

                <path
                    d="
                        M226 186
                        C240 188 238 212 228 211
                        C219 210 222 197 226 186
                        Z
                    "
                    fill="#aa3e35"
                />

                <circle
                    cx="219"
                    cy="163"
                    r="6"
                    fill="#fff7df"
                />

                <circle
                    cx="221"
                    cy="163"
                    r="3"
                    fill="#30261c"
                />

                <path
                    d="M202 140q-7-14 2-14t5 13"
                    fill="#aa3e35"
                />
            </svg>

            <figcaption>${caption}</figcaption>

            ${count === challengeConfig.totalDays ? `
                <div class="trot-ribbon-award">
                    <img
                        src="./assets/images/fully-feathered-ribbon2.png"
                        alt=""
                    >
                    <h4>Fully Feathered</h4>
                    <p>You earned all 30 feathers!</p>
                </div>
            ` : ""}
        `;

        previousCount = count;
    }

    function clearCelebration() {
        clearTimeout(celebrationTimer);

        activeLayer?.remove();
        activeMessage?.remove();

        activeLayer = null;
        activeMessage = null;
    }

    function celebrate() {
        clearCelebration();

        activeMessage = document.createElement("div");

        activeMessage.className =
            "trot-celebration-message";

        activeMessage.setAttribute("role", "status");

        activeMessage.innerHTML = `
            <strong>300,000 steps. Look what you did!</strong>
            <span>
                Every step brought you here.
                Take a moment to celebrate.
            </span>
        `;

        document.body.appendChild(activeMessage);

        if (!reducedMotion.matches) {
            activeLayer = document.createElement("div");

            activeLayer.className =
                "trot-celebration-layer";

            activeLayer.setAttribute("aria-hidden", "true");

            const colors = [
                "#bd572b",
                "#d5a32a",
                "#69764b",
                "#913e51",
                "#c67b35",
                "#a6a05c"
            ];

            for (let index = 0; index < 48; index++) {
                const leaf = document.createElement("div");

                leaf.className = "trot-falling-leaf";

                leaf.style.setProperty(
                    "--leaf-left",
                    `${Math.random() * 100}%`
                );

                leaf.style.setProperty(
                    "--leaf-size",
                    `${20 + Math.random() * 22}px`
                );

                leaf.style.setProperty(
                    "--leaf-duration",
                    `${7 + Math.random() * 4}s`
                );

                leaf.style.setProperty(
                    "--leaf-delay",
                    `${Math.random() * 1.5}s`
                );

                leaf.style.setProperty(
                    "--leaf-sway",
                    `${25 + Math.random() * 65}px`
                );

                const color =
                    colors[index % colors.length];

                leaf.innerHTML = `
                    <svg viewBox="0 0 60 70" fill="none">
                        <path
                            d="
                                M30 4
                                L36 19
                                L46 13
                                L43 29
                                L56 28
                                L46 41
                                L50 49
                                L34 49
                                L31 62
                                L27 49
                                L11 50
                                L15 41
                                L4 29
                                L18 29
                                L14 14
                                L25 20
                                Z
                            "
                            fill="${color}"
                        />

                        <path
                            d="
                                M30 17V66
                                M30 37L20 28
                                M30 44L41 33
                            "
                            stroke="#fff3d7"
                            stroke-width="1.5"
                            opacity=".65"
                        />
                    </svg>
                `;

                activeLayer.appendChild(leaf);
            }

            document.body.appendChild(activeLayer);
        }

        celebrationTimer = setTimeout(
            clearCelebration,
            reducedMotion.matches ? 6000 : 13000
        );
    }

    function update() {
        const count = getTotals().qualifyingDays.length;

        if (count !== previousCount) {
            renderTurkey(count);
        }

        const complete = !completion.hidden;

        replay.hidden = !complete;

        if (complete && !previouslyComplete) {
            celebrate();
        }

        if (!complete && previouslyComplete) {
            clearCelebration();
        }

        previouslyComplete = complete;
    }

    replay.addEventListener("click", celebrate);
    window.addEventListener("trot-progress-updated", update);

    const observer = new MutationObserver(update);

    observer.observe(counter, {
        childList: true,
        subtree: true,
        characterData: true
    });

    observer.observe(completion, {
        attributes: true,
        attributeFilter: ["hidden"]
    });

    update();
})();

/* ==================================================
   Reward for completing all Wednesday challenges
================================================== */

(() => {
    const weeks = document.getElementById(
        "trot-mini-weeks"
    );

    const collection = document.getElementById(
        "trot-collection-preview"
    );

    if (!weeks || !collection) {
        return;
    }

    const styles = document.createElement("style");

    styles.textContent = `
        .trot-mini-reward {
            margin: 18px 0;
            padding: 20px;
            border: 1px dashed #cdbb9b;
            border-radius: 14px;
            background: #f5efe3;
            text-align: center;
        }

        .trot-mini-reward__medal {
            display: grid;
            place-items: center;
            width: 76px;
            height: 76px;
            margin: 0 auto 12px;
            border: 3px double #b7ac97;
            border-radius: 50%;
            background: #e5dfd1;
            color: #938874;
            font-size: 38px;
        }

        .trot-mini-reward h4 {
            margin: 0 0 8px;
            color: #75634d;
            font: normal 25px Georgia, serif;
        }

        .trot-mini-reward p {
            margin: 6px 0 0;
            color: #75634d;
        }

        .trot-mini-reward.is-earned {
            border: 1px solid #c49b42;
            background:
                radial-gradient(
                    ellipse at top,
                    #ffedb1,
                    #fff8e6 75%
                );
        }

       .trot-mini-reward.is-earned
        .trot-mini-reward__medal {
            border: 0;
            background: transparent;
            box-shadow: none;
            animation: trot-medal-unlock 900ms ease-out;
        }
        .trot-mini-reward.is-earned h4 {
            color: #704522;
        }

        @keyframes trot-medal-unlock {
            0% {
                transform: scale(.5) rotate(-18deg);
                opacity: 0;
            }

            60% {
                transform: scale(1.18) rotate(8deg);
                opacity: 1;
            }

            100% {
                transform: scale(1) rotate(0);
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .trot-mini-reward.is-earned
            .trot-mini-reward__medal {
                animation: none;
            }
        }
    `;

    document.head.appendChild(styles);

    const reward = document.createElement("section");

    reward.className = "trot-mini-reward";
    reward.setAttribute("aria-label", "Wednesday challenge reward");

    collection.before(reward);

    let previousCount = -1;

    function updateMiniReward() {
        const days = wednesdayDays();

        const completed = days.filter(day =>
            isAvailable(day) &&
            progress[day]?.tasks?.mini_challenge === true
        ).length;

        if (completed === previousCount) {
            return;
        }

        const earned =
            days.length > 0 &&
            completed === days.length;

        reward.classList.toggle("is-earned", earned);

        reward.innerHTML = `
            
            <div
                class="trot-mini-reward__medal trot-mini-reward__art"
                aria-hidden="true"
            >
                <img
                    src="./assets/images/harvest-hero-ribbon2.png"
                    alt=""
                    class="${earned ? "" : "is-locked"}"
                >
            </div>


            <h4>Harvest Hero</h4>

            <p>
                <strong>
                    ${completed} of ${days.length}
                    Wednesday challenges completed
                </strong>
            </p>

            <p role="status">
                ${
                    earned
                        ? "You did them all! Your Harvest Hero badge is unlocked."
                        : "Complete all four Wednesday challenges to unlock your badge."
                }
            </p>
        `;

        previousCount = completed;
    }

    window.addEventListener(
        "trot-progress-updated",
        updateMiniReward
    );
    const observer = new MutationObserver(
        updateMiniReward
    );

    observer.observe(weeks, {
        childList: true
    });

    updateMiniReward();
})();