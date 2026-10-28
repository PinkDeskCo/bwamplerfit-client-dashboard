document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const host = document.getElementById("member-rewards");
    const oldCount = document.getElementById("member-reward-count");

    if (!host || !oldCount) return;

    const escapeHTML = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    let rewards = [];
    let selected = 0;
    let page = 0;

    const pageSize = 8;

    const previewMode =
        ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) &&
        new URLSearchParams(location.search).get("preview") === "1";

    let preferenceUserId = null;
    let preferenceVersion = 0;
    let preferenceReady = false;
    let preferenceSaving = false;

    function rewardKey(reward) {
        return JSON.stringify([
            reward.challengeKey,
            reward.name
        ]);
    }

    function previewPreferenceKey(userId) {
        return `bwfit-preview-featured-win:${userId}`;
    }

    const viewAll = document.createElement("button");
    viewAll.id = "member-reward-count";
    viewAll.type = "button";
    viewAll.className = "wins-view-all";
    viewAll.hidden = true;

    oldCount.replaceWith(viewAll);

    const controls = document.createElement("div");
        controls.className = "wins-controls";
        controls.hidden = true;

        controls.innerHTML = `
            <button type="button" data-win-direction="-1"
                aria-label="Previous win">←</button>
            <span class="wins-position"></span>
            <button type="button" data-win-direction="1"
                aria-label="Next win">→</button>
        `;

    host.after(controls);

    const dialog = document.createElement("dialog");
    dialog.className = "wins-dialog";
    dialog.setAttribute("aria-labelledby", "wins-dialog-title");

    dialog.innerHTML = `
        <header class="wins-dialog-header">
            <h2 id="wins-dialog-title">Your win collection</h2>
            <button type="button" class="wins-close"
                aria-label="Close win collection">×</button>
        </header>
        <p class="wins-dialog-intro">
            Click an award below to feature it on your dashboard.
        </p>
        <div class="wins-collection"></div>
        <nav class="wins-pagination" aria-label="Collection pages">
            <button type="button" data-win-page="-1">
                Previous
            </button>
            <span class="wins-page-status" role="status"></span>
            <button type="button" data-win-page="1">
                Next
            </button>
        </nav>
    `;

    document.body.append(dialog);

    const selectionMessage = document.createElement("p");
        selectionMessage.className = "member-hub__message";
        selectionMessage.setAttribute("role", "status");
        controls.after(selectionMessage);

        async function loadFeaturedPreference(userId) {
            const version = ++preferenceVersion;

            preferenceUserId = userId;
            preferenceReady = false;
            selectionMessage.textContent = "";

            if (!userId) return;

            try {
                let savedKey = null;

                if (previewMode) {
                    savedKey = localStorage.getItem(
                        previewPreferenceKey(userId)
                    );
                } else {
                    const { data, error } = await supabaseClient
                        .from("member_dashboard_preferences")
                        .select("featured_reward_key")
                        .eq("user_id", userId)
                        .maybeSingle();

                    if (error) throw error;

                    savedKey = data?.featured_reward_key || null;
                }

                if (version !== preferenceVersion) return;

                const savedIndex = rewards.findIndex(
                    reward => rewardKey(reward) === savedKey
                );

                selected = savedIndex >= 0 ? savedIndex : 0;
                preferenceReady = true;

                renderFeatured();

                if (dialog.open) renderCollection();
            } catch (error) {
                if (version !== preferenceVersion) return;

                console.error("Featured win could not be loaded:", error);

                selectionMessage.textContent =
                    "Your featured-win preference could not be loaded. " +
                    "Select Refresh progress to retry.";
            }
        }

    async function featureWin(index) {
        if (
            !preferenceReady ||
            preferenceSaving ||
            !preferenceUserId ||
            !Number.isInteger(index) ||
            !rewards[index]
        ) {
            return;
        }

        const version = preferenceVersion;
        const userId = preferenceUserId;
        const reward = rewards[index];
        const key = rewardKey(reward);
        const intro = dialog.querySelector(".wins-dialog-intro");

        preferenceSaving = true;
        selectionMessage.textContent = "Saving featured win…";
        intro.textContent = "Saving your selection…";

        try {
            if (previewMode) {
                localStorage.setItem(
                    previewPreferenceKey(userId),
                    key
                );
            } else {
                const { error } = await supabaseClient
                    .from("member_dashboard_preferences")
                    .upsert({
                        user_id: userId,
                        featured_reward_key: key
                    }, {
                        onConflict: "user_id"
                    });

                if (error) throw error;
            }

            if (version !== preferenceVersion) return;

            selected = index;
            renderFeatured();
            renderCollection();

            selectionMessage.textContent = previewMode
                ? `${reward.name} is featured for this local preview.`
                : `${reward.name} is now your featured win.`;

            intro.textContent =
                "Click an award below to feature it on your dashboard.";

            if (dialog.open) dialog.close();
        } catch (error) {
            if (version !== preferenceVersion) return;

            console.error("Featured win could not be saved:", error);

            selectionMessage.textContent =
                "Your selection could not be saved. Please try again.";

            intro.textContent =
                "Your selection could not be saved. Select a win to retry.";
        } finally {
            preferenceSaving = false;
        }
    }

    function artwork(reward) {

        const turkeyArtwork = {
            "Turkey Trot Finisher": "turkey-trot-finisher-ribbon2.png",
            "Fully Feathered": "fully-feathered-ribbon2.png",
            "Harvest Hero": "harvest-hero-ribbon2.png",
            "Autumn Gold Collection": "autumn-gold-coin2.png",
            "Harvest Copper Collection": "harvest-copper-coin2.png",
            "Woodland Collection": "woodland-coin2.png",
            "Cranberry Collection": "cranberry-coin2.png",
            "Thanksgiving Collection": "thanksgiving-coin2.png"
        };

        if (reward.challengeKey === "turkey-trot-2026-11") {
            const filename = turkeyArtwork[reward.name];

            if (filename) {
                return `
                    <img
                        class="wins-medal wins-turkey-award"
                        src="./challenges/turkey-trot/assets/images/${filename}"
                        alt=""
                    >
                `;
            }
        }

        if (reward.challengeKey === "30-day-challenge") {
            return `
                <img
                    class="wins-medal"
                    src="assets/images/dashboard/september-medal-clean.png"
                    alt=""
                >
            `;
        }

        // Other rewards retain their own type.
        const symbol = reward.icon === "feather"
            ? `<path d="M30 4C10 7 5 24 15 32C29 27 38 11 30 4Z"/>
               <path d="M11 39L29 10" fill="none"
                   stroke="currentColor" stroke-width="3"/>`
            : reward.icon === "trophy"
                ? `<path d="M12 5H30V16C30 27 12 27 12 16Z"/>
                   <path d="M12 9H6V15Q6 22 15 22
                       M30 9H36V15Q36 22 27 22
                       M21 25V34M13 37H29"
                       fill="none" stroke="currentColor"
                       stroke-width="3"/>`
                : `<path d="M21 3L26 15L39 17L29 26L32 39
                       L21 32L10 39L13 26L3 17L16 15Z"/>`;

        return `
            <span class="wins-symbol" aria-hidden="true">
                <svg viewBox="0 0 42 42"
                    fill="currentColor">${symbol}</svg>
            </span>
        `;
    }

    function foliage(side) {
        return `
            <svg class="wins-foliage wins-foliage--${side}"
                viewBox="0 0 160 150" aria-hidden="true">
                <path d="M25 145Q100 88 113 10"
                    fill="none" stroke="#87966f" stroke-width="2"/>
                <g fill="#a6b28e">
                    <path d="M43 128Q4 120 7 87Q41 90 43 128Z"/>
                    <path d="M60 109Q91 114 111 87Q77 80 60 109Z"/>
                    <path d="M76 88Q36 81 43 49Q76 58 76 88Z"/>
                    <path d="M91 65Q123 72 141 43Q108 39 91 65Z"/>
                    <path d="M103 42Q77 28 91 5Q115 17 103 42Z"/>
                </g>
            </svg>
        `;
    }

    function renderFeatured() {
        viewAll.hidden = rewards.length === 0;
        viewAll.textContent = `View all wins · ${rewards.length}`;

        controls.hidden = rewards.length <= 1;
        host.classList.toggle("wins-empty", rewards.length === 0);

        if (!rewards.length) {
            host.innerHTML = `
                <p class="member-hub__empty">
                    Your next achievement belongs here.
                    Earn rewards in your challenges to start your collection.
                </p>
            `;
            return;
        }

        const reward = rewards[selected];

        const status = reward.icon === "trophy"
            ? "Challenge completed"
            : "Reward earned";

        host.innerHTML = `
            <article class="wins-feature">
                ${foliage("left")}
                ${foliage("right")}
                <div class="wins-art">${artwork(reward)}</div>
                <div class="wins-copy" aria-live="polite">
                    <h4>${escapeHTML(reward.name)}</h4>
                    <p class="wins-challenge">
                        ${escapeHTML(reward.challenge)}
                    </p>
                    <p class="wins-completed">
                        <span aria-hidden="true">✓</span>
                        ${status}
                    </p>
                </div>
            </article>
        `;

        controls.querySelector(".wins-position").textContent =
            `${selected + 1} of ${rewards.length} wins`;
    }

    function renderCollection() {
        const pages = Math.max(1, Math.ceil(rewards.length / pageSize));

        page = Math.max(0, Math.min(page, pages - 1));

        const first = page * pageSize;
        const groups = new Map();

        rewards.slice(first, first + pageSize).forEach((reward, offset) => {
            const name = reward.challenge || "Challenge rewards";

            if (!groups.has(name)) groups.set(name, []);

            groups.get(name).push({
                reward,
                index: first + offset
            });
        });

        dialog.querySelector(".wins-collection").innerHTML =
            [...groups].map(([name, entries]) => `
                <section class="wins-group">
                    <h3>${escapeHTML(name)}</h3>
                    <div class="wins-badge-grid">
                        ${entries.map(({ reward, index }) => `
                            <button type="button"
                                class="wins-badge"
                                data-feature-win="${index}"
                                aria-pressed="${index === selected}">
                                <span class="wins-badge-art">
                                    ${artwork(reward)}
                                </span>
                                <strong>${escapeHTML(reward.name)}</strong>
                                <span>
                                    ${escapeHTML(reward.description || "")}
                                </span>
                            </button>
                        `).join("")}
                    </div>
                </section>
            `).join("");

        dialog.querySelector(".wins-page-status").textContent =
            `Page ${page + 1} of ${pages}`;

        dialog.querySelector('[data-win-page="-1"]').disabled =
            page === 0;

        dialog.querySelector('[data-win-page="1"]').disabled =
            page >= pages - 1;

        dialog.querySelector(".wins-pagination").hidden = pages <= 1;
    }

    controls.addEventListener("click", event => {
        const button = event.target.closest("[data-win-direction]");

        if (!button || !rewards.length) return;

        const index = (
            selected +
            Number(button.dataset.winDirection) +
            rewards.length
        ) % rewards.length;

        featureWin(index);
    });

    viewAll.addEventListener("click", () => {
        page = Math.floor(selected / pageSize);
        renderCollection();
        if (!dialog.open) dialog.showModal();
    });

    dialog.querySelector(".wins-close").addEventListener("click", () => {
        dialog.close();
    });

    dialog.addEventListener("click", event => {
        const badge = event.target.closest("[data-feature-win]");

        if (badge) {
            featureWin(Number(badge.dataset.featureWin));
            return;
        }

        const button = event.target.closest("[data-win-page]");

        if (button) {
            page += Number(button.dataset.winPage);
            renderCollection();
        }
    });

    
    function clearWins() {
        preferenceVersion++;
        preferenceUserId = null;
        preferenceReady = false;

        rewards = [];
        selected = 0;
        page = 0;

        selectionMessage.textContent = "";

        if (dialog.open) dialog.close();

        dialog.querySelector(".wins-dialog-intro").textContent =
            "Click an award below to feature it on your dashboard.";

        dialog.querySelector(".wins-collection").innerHTML = "";

        renderFeatured();
    }

    window.addEventListener("member-wins-updated", event => {
        rewards = event.detail?.rewards || [];
        selected = 0;

        renderFeatured();

        if (dialog.open) renderCollection();

        loadFeaturedPreference(event.detail?.userId || null);
    });

    window.addEventListener("member-challenges-cleared", clearWins);

    // Clear previous account artwork while member data reloads.
    const memberContent = document.getElementById("member-content");

    if (memberContent) {
        new MutationObserver(() => {
            if (memberContent.hidden) clearWins();
        }).observe(memberContent, {
            attributes: true,
            attributeFilter: ["hidden"]
        });
    }
});