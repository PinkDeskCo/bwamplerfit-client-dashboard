"use strict";

/* ==================================================
   Configuration and state
================================================== */

const CHALLENGE_KEY = challengeConfig.key;
const DAILY_GOAL = challengeConfig.dailyStepGoal;
const MONTHLY_GOAL = challengeConfig.monthlyStepGoal;

const $ = (id) => document.getElementById(id);

function hideChallengeLoading() {
    const panel = $("challenge-loading");

    if (panel) {
        panel.hidden = true;
    }
}

let participantId = null;
let progress = {};
let completedAt = null;
let certificateName = null;
let selectedDate = null;
let saving = false;
let loading = null;
let ready = false;
let authMode = "signin";
let markerProgress = 0;
let markerAnimation = null;
let activeUserId = null;

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);

const DAY_MS = 86400000;

const PREVIEW_MODE =
    ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) &&
    new URLSearchParams(location.search).get("preview") === "1";

const PREVIEW_STORAGE_KEY = `bwfit-preview-v1:${CHALLENGE_KEY}`;

let previewDate = "2026-11-18";

function challengeToday() {
    return PREVIEW_MODE ? previewDate : localDateKey();
}

function previewRecord() {
    const stored = localStorage.getItem(PREVIEW_STORAGE_KEY);

    return stored
        ? JSON.parse(stored)
        : { progress: {}, completed_at: null };
}

function writePreviewRecord(record) {
    localStorage.setItem(
        PREVIEW_STORAGE_KEY,
        JSON.stringify(record)
    );
}

/* ==================================================
   Dates
================================================== */

function localDateKey(date = new Date()) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function dateForDay(day) {
    const date = new Date(
        `${challengeConfig.startDate}T12:00:00`
    );

    date.setDate(date.getDate() + day - 1);

    return localDateKey(date);
}

function dayForDate(dateKey) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || "")) {
        return null;
    }

    const difference =
        Date.parse(`${dateKey}T00:00:00Z`) -
        Date.parse(`${challengeConfig.startDate}T00:00:00Z`);

    const day = difference / DAY_MS + 1;

    if (
        !Number.isInteger(day) ||
        day < 1 ||
        day > challengeConfig.totalDays
    ) {
        return null;
    }

    return dateForDay(day) === dateKey ? day : null;
}

function readableDate(dateKey) {
    return new Date(
        `${dateKey}T12:00:00`
    ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });
}

function isWednesday(day) {
    return new Date(
        `${dateForDay(day)}T12:00:00`
    ).getDay() === 3;
}

function isAvailable(day) {
    return dateForDay(day) <= challengeToday();
}

function wednesdayDays() {
    return Array.from(
        { length: challengeConfig.totalDays },
        (_, index) => index + 1
    ).filter(isWednesday);
}

/* ==================================================
   Progress data
================================================== */

function normalizeProgress(raw) {
    const result = {};

    for (let day = 1; day <= challengeConfig.totalDays; day++) {
        const saved = raw?.[day];
        const steps = saved?.steps;

        result[day] = {
            steps:
                Number.isSafeInteger(steps) && steps >= 0
                    ? steps
                    : null,

            tasks: {
                daily_goal:
                    Number.isSafeInteger(steps) &&
                    steps >= DAILY_GOAL,

                mini_challenge:
                    isWednesday(day) &&
                    saved?.tasks?.mini_challenge === true
            }
        };
    }

    return result;
}

function getTotals(data = progress) {
    let totalSteps = 0;
    const qualifyingDays = [];

    for (let day = 1; day <= challengeConfig.totalDays; day++) {
        if (!isAvailable(day)) {
            continue;
        }

        const steps = data[day]?.steps ?? 0;

        totalSteps += steps;

        if (steps >= DAILY_GOAL) {
            qualifyingDays.push(day);
        }
    }

    return {
        totalSteps,
        qualifyingDays,
        fraction: Math.min(totalSteps / MONTHLY_GOAL, 1)
    };
}

function number(value) {
    return value.toLocaleString("en-US");
}

/* ==================================================
   Branding
================================================== */

function applyBranding() {
    const branding = challengeConfig.branding;

    const properties = {
        primary: branding.primaryColor,
        accent: branding.accentColor,
        background: branding.backgroundColor,
        surface: branding.surfaceColor,
        muted: branding.mutedColor
    };

    Object.entries(properties).forEach(([name, value]) => {
        document.documentElement.style.setProperty(
            `--challenge-${name}`,
            value
        );
    });

    $("challenge-title").textContent = challengeConfig.title;
    $("challenge-eyebrow").textContent = challengeConfig.eyebrow;
    $("challenge-subtitle").textContent = challengeConfig.subtitle;

    document.title = `${challengeConfig.name} | BWamplerFit`;

    const logo = $("challenge-logo");

    if (logo) {
        logo.src = branding.logo;
        logo.alt = "BWamplerFit";
        logo.hidden = !branding.logo;
    }

    const hero = $("challenge-hero-image");
    const media = $("challenge-hero-media");

    if (hero && media) {
        media.hidden = !branding.heroImage;

        if (branding.heroImage) {
            hero.src = branding.heroImage;
            hero.alt = challengeConfig.name;
        }
    }

    const authName = document.querySelector(
        ".challenge-auth__challenge-name"
    );

    const authDates = document.querySelector(
        ".challenge-auth__challenge-dates"
    );

    const authImage = document.querySelector(
        ".challenge-auth__challenge-image"
    );

    if (authName) {
        authName.textContent = challengeConfig.name;
    }

    if (authDates) {
        authDates.textContent = "November 1–30, 2026";
    }

    if (authImage) {
        authImage.hidden = !branding.heroImage;

        if (branding.heroImage) {
            authImage.src = branding.heroImage;
            authImage.alt = challengeConfig.name;
        }
    }

    const completionTitle = document.querySelector(
        ".challenge-completion__title"
    );

    const completionMessage = document.querySelector(
        ".challenge-completion__message"
    );

    const certificateChallenge = document.querySelector(
        ".challenge-certificate-preview__challenge"
    );

    const certificateStatement = document.querySelector(
        ".challenge-certificate-preview__statement"
    );

    if (completionTitle) {
        completionTitle.textContent = "300,000 steps. You did it.";
    }

    if (completionMessage) {
        completionMessage.textContent =
            "You reached the November step goal. " +
            "Your feather collection records your daily goals separately.";
    }

    if (certificateChallenge) {
        certificateChallenge.textContent =
            "BWamplerFit November Turkey Trot";
    }

    if (certificateStatement) {
        certificateStatement.textContent =
            "For reaching the November goal of 300,000 steps.";
    }

    const certificateHero = document.querySelector(
        ".challenge-certificate-preview__hero"
    );

    if (certificateHero) {
        certificateHero.hidden = !branding.heroImage;

        if (branding.heroImage) {
            certificateHero.querySelector("img").src =
                branding.heroImage;
        }
    }
}

/* ==================================================
   Track
================================================== */

function positionTurkey(fraction) {
    const path = $("trot-track-path");

    const point = path.getPointAtLength(
        path.getTotalLength() * fraction
    );

    $("trot-turkey").setAttribute(
        "transform",
        `translate(${point.x} ${point.y})`
    );

    $("trot-track-fill").setAttribute(
        "stroke-dashoffset",
        String(100 - fraction * 100)
    );
}

function moveTurkey(target, animate) {
    cancelAnimationFrame(markerAnimation);

    const start = markerProgress;

    if (!animate || reducedMotion.matches) {
        markerProgress = target;
        positionTurkey(target);
        return;
    }

    const started = performance.now();

    function frame(now) {
        const elapsed = Math.min((now - started) / 1400, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);

        markerProgress = start + (target - start) * eased;
        positionTurkey(markerProgress);

        if (elapsed < 1) {
            markerAnimation = requestAnimationFrame(frame);
        }
    }

    markerAnimation = requestAnimationFrame(frame);
}

function renderTrack(animate = false) {
    const totals = getTotals();
    const todayDay = dayForDate(challengeToday());

    const todaySteps = todayDay
        ? progress[todayDay]?.steps ?? 0
        : 0;

    $("trot-monthly-steps").textContent =
        number(totals.totalSteps);

    const percentage = Math.floor(totals.fraction * 100);

    $("trot-monthly-percent").textContent =
        `${percentage}% complete`;

    $("trot-today-steps").textContent =
        `${number(todaySteps)} / ${number(DAILY_GOAL)}`;

    $("trot-goal-days").textContent =
        `${totals.qualifyingDays.length} / 30`;

    $("trot-remaining").textContent =
        number(Math.max(MONTHLY_GOAL - totals.totalSteps, 0));

    $("track-description").textContent =
        `${number(totals.totalSteps)} of ` +
        `${number(MONTHLY_GOAL)} monthly steps. ` +
        `${percentage}% complete.`;

    moveTurkey(totals.fraction, animate);
}

/* ==================================================
   Feather collection
================================================== */

function featherSVG(index, earned) {
    const collection =
        challengeConfig.featherCollections[Math.floor(index / 6)];

    const variant = index % 6;
    const color = earned ? collection.color : "#C8BFB2";
    const width = 20 + variant * 2;

    const markings = Array.from(
        { length: variant + 2 },
        (_, mark) => {
            const y = 35 + mark * 9;

            return `
                <path
                    d="M 40 ${y} l -13 -7 M 40 ${y} l 13 -7"
                    stroke="${earned ? "#FFF4DD" : "#E5DED5"}"
                    stroke-width="${2 + variant % 2}"
                    fill="none"
                />
            `;
        }
    ).join("");

    return `
        <svg
            viewBox="0 0 80 120"
            width="64"
            height="96"
            aria-hidden="true"
            style="opacity:${earned ? 1 : 0.4}"
        >
            <path
                d="
                    M 40 8
                    C ${40 + width} 24, ${40 + width} 66, 40 100
                    C ${40 - width} 76, ${40 - width} 34, 40 8
                    Z
                "
                fill="${color}"
            />
            ${markings}
            <path
                d="M 40 19 V 112"
                stroke="${earned ? "#65462C" : "#A69C90"}"
                stroke-width="2"
                fill="none"
            />
        </svg>
    `;
}

function renderFeathers() {
    const { qualifyingDays } = getTotals();
    const count = qualifyingDays.length;

        const collectionCoins = [
        "autumn-gold-coin2.png",
        "harvest-copper-coin2.png",
        "woodland-coin2.png",
        "cranberry-coin2.png",
        "thanksgiving-coin2.png"
    ];

    function collectionCoin(collectionIndex, earnedCount) {
        if (earnedCount < 6) return "";

        return `
            <div class="trot-collection-coin">
                <img
                    src="./assets/images/${collectionCoins[collectionIndex]}"
                    alt="Completed collection coin"
                    loading="lazy"
                >
                <small>Collection complete!</small>
            </div>
        `;
}

    $("trot-feather-count").textContent =
        `${count} of 30 feathers collected`;

    $("trot-latest-feather").innerHTML = count
        ? `
            ${featherSVG(count - 1, true)}
            <p>Latest feather: ${count} of 30</p>
        `
        : `
            ${featherSVG(0, false)}
            <p>Your first feather is waiting.</p>
        `;

    const preview = $("trot-collection-preview");

    if (preview) {
        preview.innerHTML =
            challengeConfig.featherCollections.map(
                (collection, collectionIndex) => {
                    const earnedCount = Math.max(
                        0,
                        Math.min(count - collectionIndex * 6, 6)
                    );

                    const feathers = Array.from(
                        { length: 6 },
                        (_, variant) => {
                            const index =
                                collectionIndex * 6 + variant;

                            return featherSVG(index, index < count);
                        }
                    ).join("");

                    return `
                        <div class="trot-set-preview">
                            <div class="trot-set-preview__feathers">
                                ${feathers}
                            </div>
                            <span>${collection.name}</span>
                            <small>${earnedCount}/6 collected</small>
                            ${collectionCoin(collectionIndex, earnedCount)}
                        </div>
                    `;
                }
            ).join("");
    }

    $("trot-feather-collections").innerHTML =
        challengeConfig.featherCollections.map(
            (collection, collectionIndex) => {
                const earnedCount = Math.max(
                    0,
                    Math.min(count - collectionIndex * 6, 6)
                );

                const feathers = Array.from(
                    { length: 6 },
                    (_, variant) => {
                        const index = collectionIndex * 6 + variant;
                        const earned = index < count;
                        const day = qualifyingDays[index];

                        const label = earned
                            ? `Earned for ${readableDate(dateForDay(day))}`
                            : "Not yet earned";

                        return `
                            <div class="trot-feather" title="${label}">
                                ${featherSVG(index, earned)}
                                <span>Feather ${index + 1}</span>
                                <small>${label}</small>
                            </div>
                        `;
                    }
                ).join("");

                return `
                    <section class="trot-feather-set">
                        <h3>
                            ${collection.name}
                            <span>${earnedCount} / 6</span>
                        </h3>
                        <div class="trot-feather-grid">${feathers}</div>
                        ${collectionCoin(collectionIndex, earnedCount)}
                    </section>
                `;
            }
        ).join("");
}

/* ==================================================
   Daily entry
================================================== */

function setEntryDate(dateKey) {
    selectedDate = dateKey;

    $("trot-entry-date").value = dateKey;

    const day = dayForDate(dateKey);

    $("trot-entry-steps").value =
        day ? progress[day]?.steps ?? "" : "";

    $("trot-entry-message").textContent = "";
}

function configureEntry() {
    const start = challengeConfig.startDate;
    const end = dateForDay(challengeConfig.totalDays);
    const today = challengeToday();
    const available = today >= start;

    $("trot-entry-date").max = today < end ? today : end;

    selectedDate =
        selectedDate && dayForDate(selectedDate)
            ? selectedDate
            : today < start
                ? start
                : today > end
                    ? end
                    : today;

    setEntryDate(selectedDate);

    $("trot-step-form")
        .querySelectorAll("input, button")
        .forEach((element) => {
            element.disabled = !ready || !available || saving;
        });

    $("trot-status").textContent = !available
        ? "The challenge opens November 1."
        : today > end
            ? "November has ended. You can review and correct your November entries."
            : "Save your daily total to move your turkey and collect feathers.";
}

async function handleStepSubmit(event) {
    event.preventDefault();

    if (!ready || saving) {
        return;
    }

    const dateKey = $("trot-entry-date").value;
    const day = dayForDate(dateKey);
    const input = $("trot-entry-steps");

    if (
        !day ||
        !isAvailable(day) ||
        input.value.trim() === "" ||
        !Number.isSafeInteger(input.valueAsNumber) ||
        input.valueAsNumber < 0
    ) {
        $("trot-entry-message").textContent =
            "Choose an available November date and enter a whole step total.";
        return;
    }

    const steps = input.valueAsNumber;

    await persistDay(day, (entry) => ({
        ...entry,
        steps,
        tasks: {
            ...entry.tasks,
            daily_goal: steps >= DAILY_GOAL
        }
    }), "steps");
}

/* ==================================================
   Wednesday mini-challenges
================================================== */

function renderMiniChallenges() {
    $("trot-mini-weeks").innerHTML =
        wednesdayDays().map((day, index) => {
            const workout =
                challengeConfig.miniChallenges[index];

            const available = isAvailable(day);

            const dateLabel =
                readableDate(dateForDay(day));

            if (!available) {
                return `
                    <section class="trot-mini-week">
                        <p>Week ${index + 1}</p>
                        <h3>${workout.title}</h3>
                        <p>Unlocks ${dateLabel}.</p>
                    </section>
                `;
            }

            const checked =
                progress[day]?.tasks?.mini_challenge === true;

            const exercises = workout.exercises.map(
                exercise => `
                    <li>
                        <strong>${exercise.letter}</strong>
                        ${exercise.name}: ${exercise.amount}
                    </li>
                `
            ).join("");

            return `
                <section class="trot-mini-week">
                    <p>Week ${index + 1} · ${dateLabel}</p>

                    <h3>${workout.title}</h3>

                    <p>${workout.instructions}</p>

                    <ul>${exercises}</ul>

                    <label>
                        <input
                            type="checkbox"
                            data-mini-day="${day}"
                            ${checked ? "checked" : ""}
                            ${saving || !ready ? "disabled" : ""}
                        >
                        I completed this week’s mini-challenge
                    </label>

                    ${
                        checked
                            ? "<p>Bonus challenge completed ✓</p>"
                            : ""
                    }
                </section>
            `;
        }).join("");

    $("trot-mini-weeks")
        .querySelectorAll("[data-mini-day]")
        .forEach(checkbox => {
            checkbox.addEventListener("change", async () => {
                const day = Number(checkbox.dataset.miniDay);
                const complete = checkbox.checked;

                await persistDay(
                    day,
                    entry => ({
                        ...entry,
                        tasks: {
                            ...entry.tasks,
                            mini_challenge: complete
                        }
                    }),
                    "mini"
                );
            });
        });
}

function openDialog(id) {
    const dialog = $(id);

    if (!dialog.open) {
        dialog.showModal();
    }
}

function maybeOpenWednesday() {
    const day = dayForDate(challengeToday());

    if (
        !day ||
        !isWednesday(day) ||
        progress[day]?.tasks?.mini_challenge
    ) {
        return;
    }

    const key =
        `${CHALLENGE_KEY}:mini-seen:${participantId}:${dateForDay(day)}`;

    try {
        if (localStorage.getItem(key)) {
            return;
        }

        openDialog("trot-mini-dialog");
        localStorage.setItem(key, "true");
    } catch {
        openDialog("trot-mini-dialog");
    }
}

/* ==================================================
   Supabase
================================================== */

function progressQuery() {
    return supabaseClient
        .from("challenge_progress")
        .select(
            "progress, started_at, completed_at, " +
            "certificate_name, updated_at"
        )
        .eq("participant_id", participantId)
        .eq("challenge_key", CHALLENGE_KEY);
}

async function readProgress() {
    if (PREVIEW_MODE) {
        return previewRecord();
    }

    const { data, error } = await progressQuery().single();

    if (error) {
        throw error;
    }

    return data;
}

function applyRecord(record) {
    progress = normalizeProgress(record.progress);
    completedAt = record.completed_at || null;
    certificateName = record.certificate_name || null;
}

async function loadProgress(userId) {
    const { data: participant, error: participantError } =
        await supabaseClient
            .from("challenge_participants")
            .select("id")
            .eq("user_id", userId)
            .single();

    if (participantError || !participant) {
        throw participantError ||
            new Error("Participant record not found.");
    }

    participantId = participant.id;

    const { data: existing, error: readError } =
        await progressQuery().maybeSingle();

    if (readError) {
        throw readError;
    }

    if (!existing) {
        const { error: insertError } = await supabaseClient
            .from("challenge_progress")
            .upsert(
                {
                    participant_id: participantId,
                    challenge_key: CHALLENGE_KEY,
                    progress: normalizeProgress({}),
                    started_at: new Date().toISOString()
                },
                {
                    onConflict: "participant_id,challenge_key",
                    ignoreDuplicates: true
                }
            );

        if (insertError) {
            throw insertError;
        }
    }

    applyRecord(existing || await readProgress());
}

/* ==================================================
   Save progress
================================================== */

async function persistDay(day, changeEntry, source) {
    if (saving || !ready || !isAvailable(day)) {
        return;
    }

    saving = true;

    const message = source === "mini"
        ? $("trot-mini-message")
        : $("trot-entry-message");

    const previousFeathers = getTotals().qualifyingDays.length;

    configureEntry();
    renderMiniChallenges();

    message.textContent = "Saving...";

    try {
        let saved = null;

        for (let attempt = 0; attempt < 3; attempt++) {
            const latest = await readProgress();
            const next = normalizeProgress(latest.progress);

            next[day] = changeEntry(next[day]);

            const totals = getTotals(next);

            const nextCompletedAt =
                totals.totalSteps >= MONTHLY_GOAL
                    ? latest.completed_at || new Date().toISOString()
                    : null;

            if (PREVIEW_MODE) {
                saved = {
                    ...latest,
                    progress: next,
                    completed_at: nextCompletedAt
                };

                writePreviewRecord(saved);
                break;
            }

            let query = supabaseClient
                .from("challenge_progress")
                .update({
                    progress: next,
                    completed_at: nextCompletedAt,
                    updated_at: new Date().toISOString()
                })
                .eq("participant_id", participantId)
                .eq("challenge_key", CHALLENGE_KEY);

            query = latest.updated_at
                ? query.eq("updated_at", latest.updated_at)
                : query.is("updated_at", null);

            const { data, error } = await query
                .select(
                    "progress, completed_at, certificate_name, updated_at"
                )
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (data) {
                saved = data;
                break;
            }
        }

        if (!saved) {
            throw new Error(
                "Your progress changed in another tab. Please try again."
            );
        }

        applyRecord(saved);

        if (source === "steps") {
            $("trot-entry-steps").value = progress[day].steps ?? "";
        }

        renderTrack(true);
        renderFeathers();
        renderMiniChallenges();
        renderCompletion();

        window.dispatchEvent(
            new Event("trot-progress-updated")
        );

        const count = getTotals().qualifyingDays.length;

        message.textContent = source === "mini"
            ? "Your mini-challenge progress is saved."
            : count > previousFeathers
                ? count % 6 === 0
                    ? "Daily goal reached! Feather earned and collection completed!"
                    : "Daily goal reached! You earned a feather!"
                : "Your daily step total is saved.";
    } catch (error) {
        console.error("November progress save failed:", error);

        message.textContent =
            "Your change could not be saved. Please try again.";

        if (source === "mini") {
            renderMiniChallenges();
        }
    } finally {
        saving = false;

        $("trot-step-form")
            .querySelectorAll("input, button")
            .forEach((element) => {
                element.disabled =
                    !ready ||
                    challengeToday() < challengeConfig.startDate;
            });

        renderMiniChallenges();
    }
}

/* ==================================================
   Completion and certificate
================================================== */

function renderCompletion() {
    const complete =
        getTotals().totalSteps >= MONTHLY_GOAL &&
        Boolean(completedAt);

    $("challenge-completion").hidden = !complete;

    if (!complete) {
        return;
    }

    const hasName = Boolean(certificateName);

    $("challenge-certificate-name").hidden = hasName;
    $("challenge-certificate-ready").hidden = !hasName;

    if (hasName) {
        $("challenge-certificate-display-name").textContent =
            certificateName;

        $("challenge-certificate-preview-name").textContent =
            certificateName;

        $("challenge-certificate-preview-date").textContent =
            `Completed ${new Date(completedAt).toLocaleDateString(
                "en-US",
                {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            )}`;
    }
}

async function saveCertificateName() {
    if (!ready || !completedAt || saving) {
        return;
    }

    const name =
        $("challenge-certificate-name-input").value.trim();

    const message = $("challenge-certificate-name-message");

    if (!name || name.length > 80) {
        message.textContent =
            "Enter a name of up to 80 characters.";
        return;
    }

    const button = $("challenge-certificate-create");
    button.disabled = true;

    try {
        if (PREVIEW_MODE) {
            writePreviewRecord({
                ...previewRecord(),
                certificate_name: name
            });

            certificateName = name;
            message.textContent = "";
            renderCompletion();
            return;
        }

        const { data, error } = await supabaseClient
            .from("challenge_progress")
            .update({
                certificate_name: name,
                updated_at: new Date().toISOString()
            })
            .eq("participant_id", participantId)
            .eq("challenge_key", CHALLENGE_KEY)
            .not("completed_at", "is", null)
            .select("certificate_name")
            .single();

        if (error) {
            throw error;
        }

        certificateName = data.certificate_name;
        message.textContent = "";
        renderCompletion();
    } catch (error) {
        console.error("Certificate name save failed:", error);

        message.textContent =
            "Your certificate name could not be saved. Please try again.";
    } finally {
        button.disabled = false;
    }
}

async function downloadCertificate() {
    const button = $("challenge-certificate-download");

    if (!certificateName || !completedAt) {
        return;
    }

    button.disabled = true;
    button.textContent = "Preparing certificate...";

    let clone = null;

    try {
        clone = $("challenge-certificate-preview").cloneNode(true);

        clone.removeAttribute("id");

        clone.querySelectorAll("[id]").forEach((element) => {
            element.removeAttribute("id");
        });

        clone.classList.add("is-exporting");
        document.body.appendChild(clone);

        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        await Promise.all(
            Array.from(clone.querySelectorAll("img")).map(
                (image) => image.decode().catch(() => {})
            )
        );

        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#fbfaf3",
            width: 1056,
            height: 816,
            windowWidth: 1056,
            windowHeight: 816
        });

        const pdf = new window.jspdf.jsPDF({
            orientation: "landscape",
            unit: "in",
            format: "letter"
        });

        pdf.addImage(
            canvas.toDataURL("image/png"),
            "PNG",
            0,
            0,
            11,
            8.5
        );

        pdf.save("BWamplerFit-Turkey-Trot-Certificate.pdf");
    } catch (error) {
        console.error("Certificate download failed:", error);

        alert(
            "Your certificate could not be downloaded. Please try again."
        );
    } finally {
        clone?.remove();
        button.disabled = false;
        button.textContent = "Download Certificate";
    }
}

/* ==================================================
   Authentication
================================================== */

function showAuthentication() {
    hideChallengeLoading();
    ready = false;

    const dashboardLink = $("trot-dashboard-link");

if (dashboardLink) {
    dashboardLink.hidden = true;
}

    $("challenge-auth").hidden = false;
    $("challenge-dashboard").hidden = true;
}

function chooseAuthMode(mode) {
    authMode = mode;

    $("challenge-auth-message").textContent = "";
    $("challenge-auth-choices").hidden = true;
    $("challenge-auth-form").hidden = false;

    $("challenge-auth-password-label").textContent =
        mode === "create" ? "Create password" : "Password";

    $("challenge-auth-password").autocomplete =
        mode === "create" ? "new-password" : "current-password";

    $("challenge-auth-submit").textContent =
        mode === "create" ? "Create Account" : "Continue To Challenge";

    $("challenge-auth-email").focus();
}

async function handleAuthentication(event) {
    event.preventDefault();

    const email =
        $("challenge-auth-email").value.trim().toLowerCase();

    const password = $("challenge-auth-password").value;
    const message = $("challenge-auth-message");
    const button = $("challenge-auth-submit");

    button.disabled = true;

    message.textContent =
        authMode === "create" ? "Creating account..." : "Signing in...";

    try {
        const result = authMode === "create"
            ? await supabaseClient.auth.signUp({ email, password })
            : await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (result.error) {
            throw result.error;
        }

        if (result.data.session) {
            message.textContent = "";
            await initializeParticipant(result.data.session);
        } else {
            message.textContent =
                "Check your email to confirm your account, " +
                "then return here and sign in.";
        }
    } catch (error) {
        console.error("Authentication failed:", error);

        message.textContent =
            "We couldn’t continue with those details. " +
            "Check your email and password, then try again.";
    } finally {
        button.disabled = false;
    }
}

function showEnrollmentRequired() {
    hideChallengeLoading();
    ready = false;

    $("challenge-auth").hidden = true;
    $("challenge-dashboard").hidden = true;

    let notice = $("challenge-access-notice");

    if (!notice) {
        notice = document.createElement("section");
        notice.id = "challenge-access-notice";
        notice.setAttribute("role", "status");

        notice.style.cssText = `
            max-width: 620px;
            margin: 40px auto;
            padding: 32px;
            border: 1px solid #dbc9b5;
            border-radius: 20px;
            background: #fffcf6;
            color: #382416;
            line-height: 1.6;
        `;

        notice.innerHTML = `
            <h2>Turkey Trot access required</h2>

            <p>
                This account does not have access to Turkey Trot.
                If you purchased the challenge, sign in using
                the same email address you used at checkout.
            </p>
        `;

        $("challenge-dashboard").before(notice);
    }

    notice.hidden = false;
}

async function initializeParticipant(session) {
    if (loading) {
        await loading;

        if (activeUserId !== session.user.id) {
            return initializeParticipant(session);
        }

        return;
    }

    if (ready && activeUserId === session.user.id) {
        return;
    }

    activeUserId = session.user.id;

    loading = (async () => {
        ready = false;
        participantId = null;
        selectedDate = null;
        markerProgress = 0;
        progress = normalizeProgress({});
            
            try {
                $("challenge-auth").hidden = true;
                $("challenge-dashboard").hidden = true;

                const previousNotice = $("challenge-access-notice");

                if (previousNotice) {
                    previousNotice.hidden = true;
                }

                const claimResult = await supabaseClient.rpc(
                    "claim_my_challenge_enrollments"
                );

                if (claimResult.error) {
                    throw claimResult.error;
                }

                const enrollmentResult = await supabaseClient
                    .from("challenge_enrollments")
                    .select("id")
                    .eq("user_id", session.user.id)
                    .eq("challenge_key", CHALLENGE_KEY)
                    .is("revoked_at", null)
                    .maybeSingle();

                if (enrollmentResult.error) {
                    throw enrollmentResult.error;
                }

                if (activeUserId !== session.user.id) {
                    return;
                }

                const membershipClaim = await supabaseClient.rpc(
                    "claim_my_membership"
                );

                if (activeUserId !== session.user.id) return;
                if (membershipClaim.error) throw membershipClaim.error;

                const membershipResult = await supabaseClient.rpc(
                    "has_active_membership"
                );

                if (activeUserId !== session.user.id) return;
                if (membershipResult.error) throw membershipResult.error;

                const dashboardLink = $("trot-dashboard-link");

                if (dashboardLink) {
                    dashboardLink.hidden = membershipResult.data !== true;
                }

                const signoutButton = $("trot-signout");

                if (signoutButton) {
                    signoutButton.hidden = membershipResult.data === true;
                }

                if (
                    !enrollmentResult.data &&
                    membershipResult.data !== true
                ) {
                    showEnrollmentRequired();
                    return;
                }

                await loadProgress(session.user.id);

                if (activeUserId !== session.user.id) {
                    return;
                }

                ready = true;

            $("challenge-auth").hidden = true;
            $("challenge-dashboard").hidden = false;
            hideChallengeLoading();

            configureEntry();
            renderTrack();
            renderFeathers();
            renderMiniChallenges();
            renderCompletion();
            maybeOpenWednesday();
        } catch (error) {
            console.error("November challenge load failed:", error);

            showAuthentication();

            $("challenge-auth-message").textContent =
                "We couldn’t load your challenge progress. " +
                "Reload the page to try again.";
        }
    })();

    try {
        await loading;
    } finally {
        loading = null;
    }
}

/* ==================================================
   Events and startup
================================================== */

$("trot-step-form").addEventListener("submit", handleStepSubmit);

$("trot-entry-date").addEventListener("change", (event) => {
    setEntryDate(event.target.value);
});

$("open-feather-collection").addEventListener("click", () => {
    openDialog("trot-feather-dialog");
});

$("close-feather-collection").addEventListener("click", () => {
    $("trot-feather-dialog").close();
});

$("open-mini-challenge").addEventListener("click", () => {
    openDialog("trot-mini-dialog");
});

$("close-mini-challenge").addEventListener("click", () => {
    $("trot-mini-dialog").close();
});

$("challenge-auth-signin-choice").addEventListener("click", () => {
    chooseAuthMode("signin");
});

$("challenge-auth-create-choice").addEventListener("click", () => {
    chooseAuthMode("create");
});

$("challenge-auth-form").addEventListener(
    "submit",
    handleAuthentication
);

$("challenge-certificate-create").addEventListener(
    "click",
    saveCertificateName
);

$("challenge-certificate-download").addEventListener(
    "click",
    downloadCertificate
);

$("challenge-certificate-edit").addEventListener("click", () => {
    $("challenge-certificate-name-input").value =
        certificateName || "";

    $("challenge-certificate-name").hidden = false;
    $("challenge-certificate-ready").hidden = true;
});

if (!PREVIEW_MODE) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        // Run outside the callback to avoid blocking auth requests.
        if (event === "SIGNED_IN" && session) {
            setTimeout(() => initializeParticipant(session), 0);
        }

        if (event === "SIGNED_OUT") {
            activeUserId = null;
            participantId = null;
            showAuthentication();
        }
    });
}

async function startApplication() {
    applyBranding();

    $("challenge-auth").hidden = true;
    $("challenge-dashboard").hidden = true;

    if (PREVIEW_MODE) {
        startPreview();
        return;
    }

    try {
        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        if (data.session) {
            await initializeParticipant(data.session);
        } else {
            showAuthentication();
        }
    } catch (error) {
        console.error("Session check failed:", error);

        showAuthentication();
        $("challenge-auth-message").textContent =
            "We couldn’t check your session. Please reload.";
    }
}

/* ==================================================
   Local preview
================================================== */

function startPreview() {

   const dashboardPage = new URL(
        "../../index.html",
        location.href
    );

    document.querySelectorAll("a[href]").forEach(link => {
        const destination = new URL(link.href, location.href);

        if (
            destination.origin === dashboardPage.origin &&
            destination.pathname === dashboardPage.pathname
        ) {
            destination.searchParams.set("preview", "1");
            link.href = destination.href;
        }
    });

    participantId = "local-preview";
    ready = true;

    applyRecord(previewRecord());

    $("challenge-auth").hidden = true;
    $("challenge-dashboard").hidden = false;
    hideChallengeLoading();

    const panel = document.createElement("aside");

    panel.className = "trot-preview-panel";

    panel.innerHTML = `
        <strong>LOCAL TEST MODE</strong>

        <span>
            Sample progress saves in this browser only.
        </span>

        <label>
            Test date
            <input
                id="trot-preview-date"
                type="date"
                min="2026-11-01"
                max="2026-11-30"
                value="${previewDate}"
            >
        </label>

        <button type="button" id="trot-preview-reset">
            Clear test progress
        </button>

        <a href="./index.html">Exit test mode</a>
    `;

    document.querySelector("main").prepend(panel);

    function refreshPreview() {
        selectedDate = previewDate;

        configureEntry();
        renderTrack(true);
        renderFeathers();
        renderMiniChallenges();
        renderCompletion();
        maybeOpenWednesday();
    }

    $("trot-preview-date").addEventListener("change", (event) => {
        if (saving || !dayForDate(event.target.value)) {
            event.target.value = previewDate;
            return;
        }

        previewDate = event.target.value;
        refreshPreview();
    });

    $("trot-preview-reset").addEventListener("click", () => {
        if (saving) {
            return;
        }

        localStorage.removeItem(PREVIEW_STORAGE_KEY);
        applyRecord({ progress: {} });
        refreshPreview();
    });

    refreshPreview();
}

const signoutButton = $("trot-signout");

if (signoutButton) {
    signoutButton.addEventListener("click", async () => {
        signoutButton.disabled = true;

        try {
            const { error } = await supabaseClient.auth.signOut({
                scope: "local"
            });

            if (error) throw error;

            location.reload();
        } catch (error) {
            console.error("Sign-out failed:", error);
            alert("Could not sign out. Please try again.");
            signoutButton.disabled = false;
        }
    });
}

startApplication();