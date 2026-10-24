document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const $ = id => document.getElementById(id);

    if (!$("member-hub")) {
        return;
    }

    /* ==========================================
       Challenge addresses
    =========================================== */

    const challengeLinks = {
        "30-day-challenge":
            "https://www.strong-mom-challenge.bwamplerfit.com/",

        "turkey-trot-2026-11": null
    };

    const featherSets = [
        "Autumn Gold",
        "Harvest Copper",
        "Woodland",
        "Cranberry",
        "Thanksgiving"
    ];

    const escapeHTML = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const formatNumber = value =>
        value.toLocaleString("en-US");

    function dateKey(date) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    let currentUser = null;
    let requestVersion = 0;

    /* ==========================================
       Progress and reward rules
    =========================================== */

    function metricsFor(record, challenge) {
        const rewards = [];
        const today = dateKey(new Date());

        const upcoming = challenge.start_date > today;
        const ended = challenge.end_date < today;

        let fraction = 0;
        let complete = false;
        let detail = "Saved challenge progress";

        if (
            challenge.challenge_key ===
            "turkey-trot-2026-11"
        ) {
            let steps = 0;
            let feathers = 0;
            let minis = 0;

            for (
                let day = 1;
                day <= Number(challenge.total_days || 30);
                day++
            ) {
                const date = new Date(
                    `${challenge.start_date}T12:00:00`
                );

                date.setDate(date.getDate() + day - 1);

                if (dateKey(date) > today) {
                    continue;
                }

                const entry = record.progress?.[day];

                if (
                    Number.isSafeInteger(entry?.steps) &&
                    entry.steps >= 0
                ) {
                    steps += entry.steps;

                    if (entry.steps >= 10000) {
                        feathers++;
                    }
                }

                if (
                    date.getDay() === 3 &&
                    entry?.tasks?.mini_challenge === true
                ) {
                    minis++;
                }
            }

            fraction = Math.min(steps / 300000, 1);
            complete = steps >= 300000;

            detail =
                `${formatNumber(steps)} / 300,000 steps · ` +
                `${feathers}/30 feathers · ` +
                `${minis}/4 Wednesday challenges`;

            if (minis === 4) {
                rewards.push({
                    name: "Harvest Hero",
                    description:
                        "Completed all four Wednesday mini-challenges.",
                    icon: "star"
                });
            }

            if (feathers === 30) {
                rewards.push({
                    name: "Fully Feathered",
                    description:
                        "Reached 10,000 steps on all 30 November days.",
                    icon: "feather"
                });
            }

            if (complete) {
                rewards.push({
                    name: "Turkey Trot Finisher",
                    description:
                        "Reached the November goal of 300,000 steps.",
                    icon: "trophy",
                    date: record.completed_at
                });
            }

            featherSets.forEach((name, index) => {
                if (feathers >= (index + 1) * 6) {
                    rewards.push({
                        name: `${name} Collection`,
                        description:
                            "Collected all six feathers in this set.",
                        icon: "feather"
                    });
                }
            });
        } else if (
            challenge.challenge_key ===
            "30-day-challenge"
        ) {
            let count = 0;

            for (
                let day = 1;
                day <= Number(challenge.total_days || 30);
                day++
            ) {
                const tasks = record.progress?.[day]?.tasks;

                if (tasks && typeof tasks === "object") {
                    count += Object.values(tasks).filter(
                        value => value === true
                    ).length;
                }
            }

            const goal = Number(
                challenge.total_activities
            ) || 0;

            complete = !upcoming && (
                Boolean(record.completed_at) ||
                (goal > 0 && count >= goal)
            );

            fraction = complete
                ? 1
                : goal > 0
                    ? Math.min(count / goal, 1)
                    : 0;

            detail =
                `${count} / ${goal} activities completed`;

            if (complete) {
                rewards.push({
                    name: "Strong Mom September Finisher",
                    description:
                        "Completed the Strong Mom September challenge.",
                    icon: "trophy",
                    date: record.completed_at
                });
            }
        } else {
            detail =
                "Open this challenge to view its progress.";
        }

        const supported = [
            "turkey-trot-2026-11",
            "30-day-challenge"
        ].includes(challenge.challenge_key);

        return {
            rewards,
            complete,
            percentage: Math.floor(fraction * 100),
            detail,
            supported,

            status: upcoming
                ? "Upcoming"
                : complete
                    ? "Completed"
                    : ended
                        ? "Ended"
                        : "Active"
        };
    }

    /* ==========================================
       Badge artwork
    =========================================== */

    function rewardIcon(kind) {
        let drawing;

        if (kind === "feather") {
            drawing = `
                <path
                    d="M29 4C10 7 5 24 15 31C29 26 37 11 29 4Z"
                    fill="currentColor"
                />
                <path
                    d="M12 38L28 10M20 23L13 19M24 17L29 18"
                    stroke="#fff5d5"
                    stroke-width="2"
                    fill="none"
                />
            `;
        } else if (kind === "trophy") {
            drawing = `
                <path
                    d="M12 5H30V15C30 25 12 25 12 15Z"
                    fill="currentColor"
                />
                <path
                    d="
                        M12 9H6V14Q6 21 15 21
                        M30 9H36V14Q36 21 27 21
                        M21 24V33
                        M14 36H28
                    "
                    stroke="currentColor"
                    stroke-width="3"
                    fill="none"
                />
            `;
        } else {
            drawing = `
                <path
                    d="
                        M21 3L26 15L39 16L29 25L32 38
                        L21 31L10 38L13 25L3 16L16 15Z
                    "
                    fill="currentColor"
                />
            `;
        }

        return `
            <svg viewBox="0 0 42 42" aria-hidden="true">
                ${drawing}
            </svg>
        `;
    }

    /* ==========================================
       Challenge and reward display
    =========================================== */

    function renderHistory(records, challenges) {
        const lookup = new Map(
            challenges.map(challenge => [
                challenge.challenge_key,
                challenge
            ])
        );

        const items = records.map(record => {
            const challenge = lookup.get(
                record.challenge_key
            );

            return challenge
                ? {
                    record,
                    challenge,
                    metrics: metricsFor(record, challenge)
                }
                : null;
        })
            .filter(Boolean)
            .sort((a, b) =>
                b.challenge.start_date.localeCompare(
                    a.challenge.start_date
                )
            );

        $("member-challenge-count").textContent =
            `${items.length} ${
                items.length === 1
                    ? "challenge"
                    : "challenges"
            }`;

        $("member-challenges").innerHTML = items.length
            ? items.map(({ challenge, metrics }) => {
                const url =
                    challengeLinks[challenge.challenge_key];

                const start = new Date(
                    `${challenge.start_date}T12:00:00`
                );

                const end = new Date(
                    `${challenge.end_date}T12:00:00`
                );

                const dates = new Intl.DateTimeFormat(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }
                ).formatRange(start, end);

                const progressDisplay = metrics.supported
                    ? `
                        <div
                            class="member-challenge__meter"
                            role="progressbar"
                            aria-label="${escapeHTML(challenge.name)} progress"
                            aria-valuemin="0"
                            aria-valuemax="100"
                            aria-valuenow="${metrics.percentage}"
                        >
                            <span
                                style="width:${metrics.percentage}%"
                            ></span>
                        </div>

                        <p class="member-challenge__percentage">
                            ${metrics.percentage}% complete
                        </p>
                    `
                    : "";

                const actions = url
                    ? `
                        <a
                            class="member-hub__button"
                            href="${escapeHTML(url)}"
                        >
                            Open challenge
                        </a>

                        ${
                            metrics.complete
                                ? `
                                    <a
                                        class="member-hub__button member-hub__button--secondary"
                                        href="${escapeHTML(url)}#challenge-completion"
                                    >
                                        Certificate
                                    </a>
                                `
                                : ""
                        }
                    `
                    : `
                        <p class="member-challenge__notice">
                            Challenge link will be added here
                            when its address is ready.
                        </p>
                    `;

                return `
                    <article class="member-challenge">
                        <span
                            class="
                                member-challenge__status
                                member-challenge__status--${metrics.status.toLowerCase()}
                            "
                        >
                            ${metrics.status}
                        </span>

                        <p class="member-challenge__dates">
                            ${escapeHTML(dates)}
                        </p>

                        <h4>${escapeHTML(challenge.name)}</h4>

                        <p class="member-challenge__detail">
                            ${escapeHTML(metrics.detail)}
                        </p>

                        ${progressDisplay}

                        <div class="member-challenge__actions">
                            ${actions}
                        </div>
                    </article>
                `;
            }).join("")
            : `
                <p class="member-hub__empty">
                    No monthly challenge history is linked
                    to this account yet.
                </p>
            `;

        const earned = items.flatMap(
            ({ challenge, metrics }) =>
                metrics.rewards.map(reward => ({
                    ...reward,
                    challenge: challenge.name
                }))
        );

        $("member-reward-count").textContent =
            `${earned.length} earned`;

        $("member-rewards").innerHTML = earned.length
            ? earned.map(reward => {
                const date = reward.date
                    ? new Date(reward.date)
                    : null;

                const dateText =
                    date && !Number.isNaN(date.getTime())
                        ? date.toLocaleDateString(
                            "en-US",
                            {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                            }
                        )
                        : null;

                return `
                    <article class="member-reward">
                        <div class="member-reward__icon">
                            ${rewardIcon(reward.icon)}
                        </div>

                        <h4>${escapeHTML(reward.name)}</h4>

                        <p class="member-reward__challenge">
                            ${escapeHTML(reward.challenge)}
                        </p>

                        <p class="member-reward__description">
                            ${escapeHTML(reward.description)}
                        </p>

                        ${
                            dateText
                                ? `
                                    <p class="member-reward__date">
                                        Challenge completed
                                        ${escapeHTML(dateText)}
                                    </p>
                                `
                                : ""
                        }
                    </article>
                `;
            }).join("")
            : `
                <p class="member-hub__empty">
                    Your collection is waiting. Earn rewards
                    in your monthly challenges and they’ll
                    appear here.
                </p>
            `;

        return records.length - items.length;
    }

    /* ==========================================
       Signed-out display
    =========================================== */

    function showSignedOut() {
        requestVersion++;
        currentUser = null;

        $("member-login").hidden = false;
        $("member-content").hidden = true;
        $("member-signout").hidden = true;

        $("member-account-email").textContent = "";
        $("member-challenges").innerHTML = "";
        $("member-rewards").innerHTML = "";
        $("member-challenge-count").textContent = "";
        $("member-reward-count").textContent = "";
        $("member-message").textContent = "";
        $("member-password").value = "";
    }

    /* ==========================================
       Load this member's Supabase history
    =========================================== */

    async function loadMember(user) {
        const version = ++requestVersion;

        currentUser = user;

        $("member-login").hidden = true;
        $("member-content").hidden = true;
        $("member-signout").hidden = false;

        $("member-account-email").textContent =
            user.email || "";

        $("member-message").textContent =
            "Loading your challenges and rewards…";

        $("member-refresh").disabled = true;

        try {
            const {
                data: participant,
                error: participantError
            } = await supabaseClient
                .from("challenge_participants")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (participantError) {
                throw participantError;
            }

            let records = [];
            let challenges = [];

            if (participant) {
                const progressResult = await supabaseClient
                    .from("challenge_progress")
                    .select(`
                        challenge_key,
                        progress,
                        started_at,
                        completed_at,
                        certificate_name
                    `)
                    .eq("participant_id", participant.id);

                if (progressResult.error) {
                    throw progressResult.error;
                }

                records = progressResult.data || [];

                const keys = [
                    ...new Set(
                        records
                            .map(record => record.challenge_key)
                            .filter(Boolean)
                    )
                ];

                if (keys.length) {
                    const challengeResult =
                        await supabaseClient
                            .from("challenges")
                            .select(`
                                id,
                                challenge_key,
                                name,
                                start_date,
                                end_date,
                                total_days,
                                total_activities
                            `)
                            .in("challenge_key", keys);

                    if (challengeResult.error) {
                        throw challengeResult.error;
                    }

                    challenges =
                        challengeResult.data || [];
                }
            }

            if (version !== requestVersion) {
                return;
            }

            const missing = renderHistory(
                records,
                challenges
            );

            $("member-content").hidden = false;
            $("member-password").value = "";

            $("member-message").textContent = missing
                ? "Some challenge details could not be found. Refresh to try again."
                : "";
        } catch (error) {
            if (version !== requestVersion) {
                return;
            }

            console.error(
                "Member history load failed:",
                error
            );

            $("member-challenges").innerHTML = `
                <p class="member-hub__empty">
                    Your challenges could not be loaded.
                </p>
            `;

            $("member-rewards").innerHTML = `
                <p class="member-hub__empty">
                    Your rewards could not be loaded.
                </p>
            `;

            $("member-challenge-count").textContent = "";
            $("member-reward-count").textContent = "";
            $("member-content").hidden = false;

            $("member-message").textContent =
                "We couldn’t load your saved progress. " +
                "Use Refresh progress to try again.";
        } finally {
            if (version === requestVersion) {
                $("member-refresh").disabled = false;
            }
        }
    }

    /* ==========================================
       Password visibility
    =========================================== */

    $("member-show-password").addEventListener(
        "change",
        event => {
            $("member-password").type =
                event.target.checked ? "text" : "password";
        }
    );

    /* ==========================================
       Sign in
    =========================================== */

    $("member-login-form").addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            $("member-signin").disabled = true;
            $("member-message").textContent = "Signing in…";

            try {
                const { data, error } =
                    await supabaseClient.auth
                        .signInWithPassword({
                            email: $("member-email").value
                                .trim()
                                .toLowerCase(),

                            password:
                                $("member-password").value
                        });

                if (error) {
                    throw error;
                }

                if (!data.user) {
                    throw new Error(
                        "No signed-in user returned."
                    );
                }

                await loadMember(data.user);
            } catch (error) {
                console.error(
                    "Member sign-in failed:",
                    error
                );

                $("member-message").textContent =
                    "Unable to sign in. Check your email " +
                    "and password, then try again.";
            } finally {
                $("member-signin").disabled = false;
            }
        }
    );

    /* ==========================================
       Refresh and sign out
    =========================================== */

    $("member-refresh").addEventListener("click", () => {
        if (currentUser) {
            loadMember(currentUser);
        }
    });

    $("member-signout").addEventListener(
        "click",
        async () => {
            $("member-signout").disabled = true;

            try {
                const { error } =
                    await supabaseClient.auth.signOut({
                        scope: "local"
                    });

                if (error) {
                    throw error;
                }

                showSignedOut();
            } catch (error) {
                $("member-message").textContent =
                    "Sign-out failed. Please try again.";
            } finally {
                $("member-signout").disabled = false;
            }
        }
    );

    /* ==========================================
       Account session changes
    =========================================== */

    supabaseClient.auth.onAuthStateChange(
        (event, session) => {
            if (event === "SIGNED_OUT") {
                showSignedOut();
            }

            if (
                event === "SIGNED_IN" &&
                session?.user.id !== currentUser?.id
            ) {
                setTimeout(() => {
                    if (
                        currentUser?.id !== session.user.id
                    ) {
                        loadMember(session.user);
                    }
                }, 0);
            }
        }
    );

    /* ==========================================
       Restore an existing session
    =========================================== */

    (async () => {
        try {
            const { data, error } =
                await supabaseClient.auth.getUser();

            if (
                error &&
                error.name !== "AuthSessionMissingError"
            ) {
                throw error;
            }

            if (data?.user) {
                await loadMember(data.user);
            } else {
                showSignedOut();
            }
        } catch (error) {
            showSignedOut();

            $("member-message").textContent =
                "Your session could not be verified. " +
                "Please sign in.";
        }
    })();
});