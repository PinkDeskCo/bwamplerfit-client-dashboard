document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const $ = id => document.getElementById(id);

    const myPanel = $("member-challenges")?.closest("section");
    const rewardsPanel = $("member-rewards")?.closest("section");
    const activityPanel = $("member-activity-panel");

    if (!myPanel || !rewardsPanel) {
        return;
    }

    const challengeLinks = {
        "30-day-challenge":
            "./challenges/september/index.html",

        "turkey-trot-2026-11":
            "./challenges/turkey-trot/index.html"
    };

    const escapeHTML = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    let ownedKeys = new Set();
    let catalog = null;
    let loading = false;
    let requestVersion = 0;

    myPanel.id = "member-my-challenges-panel";
    rewardsPanel.id = "member-rewards-panel";

    const navigation = document.createElement("nav");

    navigation.className = "member-challenge-navigation";
    navigation.setAttribute("aria-label", "Challenge views");

    navigation.innerHTML = `
        <button
            type="button"
            id="member-view-mine"
            aria-pressed="true"
            aria-controls="member-my-challenges-panel member-rewards-panel"
        >
            My Challenges
        </button>

        <button
            type="button"
            id="member-view-all"
            aria-pressed="false"
            aria-controls="member-catalog-panel"
        >
            All Challenges
        </button>

        <button
            type="button"
            id="member-view-activity"
            aria-pressed="false"
            aria-controls="member-activity-panel"
        >
            My Progress
        </button>
    `;

    const allPanel = document.createElement("section");

    allPanel.id = "member-catalog-panel";
    allPanel.className = "member-hub__section";
    allPanel.hidden = true;
    allPanel.setAttribute(
        "aria-labelledby",
        "member-catalog-title"
    );

    allPanel.innerHTML = `
        <div class="member-hub__section-heading">
            <h3 id="member-catalog-title">All Challenges</h3>

            <span
                id="member-catalog-count"
                class="member-hub__count"
            ></span>
        </div>

        <p class="member-catalog-intro">
            Your membership includes every challenge.
            Open a challenge to view its activities and progress.
            Upcoming challenges begin on their scheduled dates.
        </p>

        <div
            id="member-catalog-grid"
            class="member-challenge-grid"
            aria-live="polite"
        ></div>
    `;

    myPanel.before(navigation, allPanel);

    function showView(view) {
        const showMine = view === "mine";
        const showAll = view === "all";
        const showActivity = view === "activity";

        myPanel.hidden = !showMine;
        rewardsPanel.hidden = !showMine;

        const comingSoonPanel =
            document.getElementById("member-coming-soon");

        if (comingSoonPanel) {
            comingSoonPanel.hidden = !showMine;
        }
        allPanel.hidden = !showAll;

        if (activityPanel) {
            activityPanel.hidden = !showActivity;
        }

        $("member-view-mine").setAttribute(
            "aria-pressed",
            String(showMine)
        );

        $("member-view-all").setAttribute(
            "aria-pressed",
            String(showAll)
        );

        $("member-view-activity").setAttribute(
            "aria-pressed",
            String(showActivity)
        );

        if (showActivity) {
            requestAnimationFrame(() => {
                window.dispatchEvent(new Event("resize"));
            });
        }
    }

    function checkoutAddress(value) {
        try {
            const url = new URL(value);

            const isKit =
                url.hostname === "kit.com" ||
                url.hostname.endsWith(".kit.com");

            return (
                url.protocol === "https:" &&
                isKit &&
                !url.username &&
                !url.password
            )
                ? url.href
                : null;
        } catch {
            return null;
        }
    }

    function localToday() {
        const date = new Date();

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function dateLabel(challenge) {
        const start = new Date(
            `${challenge.start_date}T12:00:00`
        );

        const end = new Date(
            `${challenge.end_date}T12:00:00`
        );

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end < start
        ) {
            return "Dates coming soon";
        }

        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        }).formatRange(start, end);
    }

    function renderCatalog() {
        const items = catalog || [];
        const today = localToday();

        $("member-catalog-count").textContent =
            `${items.length} ${
                items.length === 1 ? "challenge" : "challenges"
            }`;

        $("member-catalog-grid").innerHTML = items.length
            ? items.map(challenge => {
                const owned = ownedKeys.has(
                    challenge.challenge_key
                );

                const ended =
                    challenge.end_date &&
                    challenge.end_date < today;

                const upcoming =
                    challenge.start_date > today;

                const page =
                    challengeLinks[challenge.challenge_key];

                const checkout = checkoutAddress(
                    challenge.checkout_url
                );

                const status = owned
                    ? "Enrolled"
                    : ended
                        ? "Ended"
                        : upcoming
                            ? "Upcoming"
                            : "Active";

                let action;

                if (owned && page) {
                    action = `
                        <a
                            class="member-hub__button"
                            href="${escapeHTML(page)}"
                        >
                            Open Challenge
                        </a>
                    `;
                } else if (owned) {
                    action = `
                        <p class="member-challenge__notice">
                            You’re enrolled. The challenge
                            link will appear when ready.
                        </p>
                    `;
                } else if (ended) {
                    action = `
                        <p class="member-challenge__notice">
                            Registration closed.
                        </p>
                    `;
                } else if (checkout) {
                    action = `
                        <a
                            class="member-hub__button member-catalog-buy"
                            href="${escapeHTML(checkout)}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Buy Challenge
                            <span class="member-catalog-link-note">
                                Opens Kit checkout in a new tab
                            </span>
                        </a>
                    `;
                } else {
                    action = `
                        <p class="member-challenge__notice">
                            Registration coming soon.
                        </p>
                    `;
                }

                return `
                    <article
                        class="member-challenge"
                        data-challenge="${escapeHTML(challenge.challenge_key)}"
                    >
                        <span
                            class="member-challenge__status member-challenge__status--${status.toLowerCase()}"
                        >
                            ${status}
                        </span>

                        <p class="member-challenge__dates">
                            ${escapeHTML(dateLabel(challenge))}
                        </p>

                        <h4>${escapeHTML(challenge.name)}</h4>

                        <p class="member-challenge__detail">
                            ${escapeHTML(challenge.description)}
                        </p>

                        <div class="member-challenge__actions">
                            ${action}
                        </div>
                    </article>
                `;
            }).join("")
            : `
                <p class="member-hub__empty">
                    New challenges will appear here
                    when they’re announced.
                </p>
            `;
    }

    async function loadCatalog() {
        if (loading) {
            return;
        }

        if (catalog !== null) {
            renderCatalog();
            return;
        }

        const version = ++requestVersion;
        loading = true;

        $("member-catalog-grid").innerHTML = `
            <p class="member-hub__empty">
                Loading challenges…
            </p>
        `;

        try {
            const { data, error } = await supabaseClient.rpc(
                "get_challenge_catalog"
            );

            if (error) {
                throw error;
            }

            if (version !== requestVersion) {
                return;
            }

            catalog = data || [];
            renderCatalog();
        } catch (error) {
            if (version !== requestVersion) {
                return;
            }

            console.error("Challenge catalog load failed:", error);

            $("member-catalog-count").textContent = "";

            $("member-catalog-grid").innerHTML = `
                <p class="member-hub__empty">
                    Challenges could not be loaded.
                    Select All Challenges again to retry.
                </p>
            `;
        } finally {
            if (version === requestVersion) {
                loading = false;
            }
        }
    }

    $("member-view-mine").addEventListener("click", () => {
        showView("mine");
    });

    $("member-view-activity").addEventListener("click", () => {
        showView("activity");
    });

    $("member-view-all").addEventListener("click", () => {
        showView("all");
        loadCatalog();
    });

    window.addEventListener(
        "member-challenges-loaded",
        event => {
            ownedKeys = new Set(event.detail?.keys || []);

            if (catalog !== null) {
                renderCatalog();
            }
        }
    );

    window.addEventListener(
        "member-challenges-cleared",
        () => {
            requestVersion++;
            loading = false;
            ownedKeys.clear();
            catalog = null;

            $("member-catalog-grid").innerHTML = "";
            $("member-catalog-count").textContent = "";

            showView("mine");
        }
    );
});