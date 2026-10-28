console.log('dashboard complete: v1')

"use strict";


/* ==================================================
   DOM
================================================== */

const challengeTitle = document.getElementById("challenge-title");
const challengeEyebrow = document.getElementById("challenge-eyebrow");
const challengeSubtitle = document.getElementById("challenge-subtitle");
const challengeStatus = document.getElementById("challenge-status");
const challengeCount = document.getElementById("challenge-count");
const challengeCompletion = document.getElementById("challenge-completion");
const challengeHeatmap = document.getElementById("challenge-heatmap");
const challengeLogo = document.getElementById("challenge-logo");
const challengeHeroMedia = document.getElementById("challenge-hero-media");
const challengeHeroImage = document.getElementById("challenge-hero-image");
const challengeProgressCircle =  document.getElementById( "challenge-progress-circle");
const challengeProgressPercent = document.getElementById("challenge-progress-percent");
const challengeAuth = document.getElementById( "challenge-auth");
const challengeAuthContent = document.getElementById("challenge-auth-content");
const challengeAuthForm = document.getElementById("challenge-auth-form");
const challengeAuthEmail = document.getElementById( "challenge-auth-email");
const challengeAuthMessage = document.getElementById("challenge-auth-message");
const challengeDashboard = document.getElementById("challenge-dashboard");
const challengeAuthPassword = document.getElementById( "challenge-auth-password");
const challengeAuthSubmit = document.getElementById("challenge-auth-submit");
const challengeAuthChoices = document.getElementById("challenge-auth-choices");
const challengeAuthSigninChoice = document.getElementById("challenge-auth-signin-choice");
const challengeAuthCreateChoice = document.getElementById("challenge-auth-create-choice");
const challengeAuthPasswordLabel = document.getElementById("challenge-auth-password-label");
const certificateNameInput = document.getElementById("challenge-certificate-name-input");
const certificateCreateButton = document.getElementById("challenge-certificate-create");
const certificateNameMessage = document.getElementById("challenge-certificate-name-message");
const certificateNameSection = document.getElementById( "challenge-certificate-name");
const certificateReadySection = document.getElementById("challenge-certificate-ready");
const certificateDisplayName = document.getElementById("challenge-certificate-display-name");
const certificatePreviewName = document.getElementById("challenge-certificate-preview-name");
const certificatePreviewDate = document.getElementById("challenge-certificate-preview-date");
const certificateDownloadButton = document.getElementById( "challenge-certificate-download");
const certificateEditButton = document.getElementById("challenge-certificate-edit");
const certificatePreview = document.getElementById("challenge-certificate-preview");

/* ==================================================
   PARTICIPANT PROGRESS
================================================== */

const challengeProgress = {};
let selectedDay = null;
let currentParticipantId = null;
let challengeCompletedAt = null;
let challengeCertificateName = null;
let authMode = null;

/* ==================================================
   DATE HELPERS
================================================== */

const weekdayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
];

function getChallengeDate(dayNumber) {
    const startDate =
        new Date(
            `${challengeConfig.startDate}T00:00:00`
        );

    const challengeDate =
        new Date(startDate);

    challengeDate.setDate(
        startDate.getDate() +
        dayNumber -
        1
    );

    return challengeDate;
}

function getWeekdayForDay(dayNumber) {
    const challengeDate =
        getChallengeDate(dayNumber);

    return weekdayNames[
        challengeDate.getDay()
    ];
}

function getTasksForDay(dayNumber) {
    const weekday =
        getWeekdayForDay(dayNumber);

    return (
        challengeConfig.schedule[weekday] ||
        []
    );
}

/* ==================================================
   CURRENT CHALLENGE DAY
================================================== */


function getCurrentChallengeDay() {
    const startDate =
        new Date(
            `${challengeConfig.startDate}T00:00:00`
        );

    const today =
        new Date();

    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const difference =
        today - startDate;

    if (difference < 0) {
        return 0;
    }

    const dayNumber =
        Math.floor(
            difference / 86400000
        ) + 1;

    return Math.min(
        dayNumber,
        challengeConfig.totalDays
    );
}

/* ==================================================
   BRANDING
================================================== */
function applyChallengeBranding() {
    const root =
        document.documentElement;

    root.style.setProperty(
        "--challenge-primary",
        challengeConfig.branding.primaryColor
    );

    root.style.setProperty(
        "--challenge-accent",
        challengeConfig.branding.accentColor
    );

    root.style.setProperty(
        "--challenge-background",
        challengeConfig.branding.backgroundColor
    );

    root.style.setProperty(
        "--challenge-surface",
        challengeConfig.branding.surfaceColor
    );

    root.style.setProperty(
        "--challenge-muted",
        challengeConfig.branding.mutedColor
    );
}

/* ==================================================
   HERO
================================================== */

function renderChallengeImages() {
    const logo =
        challengeConfig.branding.logo;

    const heroImage =
        challengeConfig.branding.heroImage;

    if (logo) {
        challengeLogo.src = logo;

        challengeLogo.alt =
            `${challengeConfig.title} logo`;

        challengeLogo.hidden = false;
    } else {
        challengeLogo.hidden = true;
    }

    if (heroImage) {
        challengeHeroImage.src =
            heroImage;

        challengeHeroImage.alt =
            `${challengeConfig.title} challenge`;

        challengeHeroMedia.hidden =
            false;
    } else {
        challengeHeroMedia.hidden =
            true;
    }
}

function renderChallengeHeader() {
    challengeEyebrow.textContent =
        challengeConfig.eyebrow;

    challengeTitle.textContent =
        challengeConfig.title;

    challengeSubtitle.textContent =
        challengeConfig.subtitle;
}

/* ==================================================
   PROGRESS STATE
================================================== */

function initializeProgressState() {
    for (
        let day = 1;
        day <= challengeConfig.totalDays;
        day++
    ) {
        const tasks =
            getTasksForDay(day);

        challengeProgress[day] = {
            tasks: {}
        };

        tasks.forEach((task) => {
            challengeProgress[day].tasks[
                task.id
            ] = false;
        });
    }
}

/* ==================================================
   DAY COMPLETION
================================================== */

function getDayCompletion(dayNumber) {
    const tasks =
        getTasksForDay(dayNumber);

    /*
     * Sunday / rest day
     */
    if (tasks.length === 0) {
        return 1;
    }

    const dayProgress =
        challengeProgress[dayNumber];

    const completedTasks =
        tasks.filter(
            (task) =>
                dayProgress.tasks[task.id]
        ).length;

    return (
        completedTasks /
        tasks.length
    );
}

/* ==================================================
   HEAT MAP
================================================== */

function renderChallengeDays() {
    challengeHeatmap.innerHTML = "";

    const currentDay =
        getCurrentChallengeDay();

    for (
        let day = 1;
        day <= challengeConfig.totalDays;
        day++
    ) {
        const dayButton =
            document.createElement("button");

        const weekday =
            getWeekdayForDay(day);

        const tasks =
            getTasksForDay(day);

        const completion =
            getDayCompletion(day);

        dayButton.type = "button";

        dayButton.className =
            "challenge-day";

        dayButton.dataset.day = day;

        dayButton.innerHTML = `
            <span class="challenge-day__number">
                ${day}
            </span>
        `;

        if (day === selectedDay) {
            dayButton.classList.add(
                "is-selected"
            );
        }

        /*
         * Future day
         */
        if (day > currentDay) {
            dayButton.classList.add(
                "is-locked"
            );

            dayButton.disabled = true;
        }


        /*
         * Current day
         */
        if (day === currentDay) {
            dayButton.classList.add(
                "is-current"
            );
        }


        /*
         * Rest day
         */
        if (
            weekday === "sunday" ||
            tasks.length === 0
        ) {
            dayButton.classList.add(
                "is-rest-day",
                "is-completed"
            );
        }


        /*
         * Partial completion
         */
        if (
            completion > 0 &&
            completion < 1
        ) {
            dayButton.classList.add(
                "is-partial"
            );
        }


        /*
         * Full completion
         */
        if (
            completion === 1 &&
            tasks.length > 0
        ) {
            dayButton.classList.add(
                "is-completed"
            );
        }


        if (!dayButton.disabled) {
            dayButton.addEventListener(
                "click",
                () => {
                    selectedDay = day;

                    renderChallengeDays();
                    renderDayChecklist(day);
                }
            );
        }


        challengeHeatmap.appendChild(
            dayButton
        );
    }


    if (currentDay === 0) {
        challengeStatus.textContent =
            "Challenge begins September 1";
    } else {
        challengeStatus.textContent =
            `Day ${currentDay} of ${challengeConfig.totalDays}`;
    }
}

/* ==================================================
   TASK CHECKLIST
================================================== */

function renderDayChecklist(dayNumber) {
    const checklist =
        document.getElementById(
            "challenge-day-detail"
        );

    const weekday =
        getWeekdayForDay(dayNumber);

    const tasks =
        getTasksForDay(dayNumber);

    const challengeDate =
        getChallengeDate(dayNumber);

    const dayLabel =
        weekday.charAt(0).toUpperCase() +
        weekday.slice(1);

    const dateLabel =
        challengeDate.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric"
            }
        );


    /*
     * Rest day
     */
    if (tasks.length === 0) {
        checklist.innerHTML = `
            <div class="challenge-day-detail__header">
                <p class="challenge-day-detail__day">
                    Day ${dayNumber}
                </p>

                <h3>
                    ${dayLabel} · ${dateLabel}
                </h3>
            </div>

            <p class="challenge-day-detail__rest">
                Rest Day ✓
            </p>
        `;

        return;
    }


    const taskMarkup =
        tasks.map((task) => {
            const checked =
                challengeProgress[
                    dayNumber
                ].tasks[task.id];

            return `
                <label class="challenge-task">

                    <input
                        type="checkbox"
                        data-day="${dayNumber}"
                        data-task="${task.id}"
                        ${checked ? "checked" : ""}
                    >

                    <span>
                        ${task.label}
                    </span>

                </label>
            `;
        }).join("");


    checklist.innerHTML = `
        <div class="challenge-day-detail__header">

            <p class="challenge-day-detail__day">
                Day ${dayNumber}
            </p>

            <h3>
                ${dayLabel} · ${dateLabel}
            </h3>

        </div>

        <div class="challenge-task-list">
            ${taskMarkup}
        </div>
    `;


    const checkboxes =
        checklist.querySelectorAll(
            'input[type="checkbox"]'
        );

    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener(
            "change",
            handleTaskChange
        );
    });
}

/* ==================================================
   TASK CHANGE
================================================== */

async function handleTaskChange(event) {
    const checkbox =
        event.currentTarget;

    const day =
        Number(checkbox.dataset.day);

    const taskId =
        checkbox.dataset.task;

    challengeProgress[day].tasks[
        taskId
    ] = checkbox.checked;

    const wasComplete =
    Boolean(challengeCompletedAt);

    await saveChallengeProgress();

    renderChallengeDays();
    updateChallengeProgress();
    updateCompletionState();

    if (selectedDay !== null) {
        renderDayChecklist(
            selectedDay
        );
    }
     if (
        !wasComplete &&
        challengeCompletedAt &&
        challengeCompletion
    ) {
        challengeCompletion.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

/* ==================================================
   TOTAL PROGRESS
================================================== */

function updateChallengeProgress() {
    let totalTasks = 0;
    let completedTasks = 0;

    for (
        let day = 1;
        day <= challengeConfig.totalDays;
        day++
    ) {
        const tasks =
            getTasksForDay(day);

        if (tasks.length === 0) {
            continue;
        }

        tasks.forEach((task) => {
            totalTasks++;

            if (
                challengeProgress[
                    day
                ].tasks[task.id]
            ) {
                completedTasks++;
            }
        });
    }

    const percentage =
        totalTasks > 0
            ? Math.round(
                (
                    completedTasks /
                    totalTasks
                ) * 100
            )
            : 0;


    challengeCount.textContent =
        `${completedTasks} / ${totalTasks} activities completed`;


    challengeProgressPercent.textContent =
        `${percentage}%`;


    challengeProgressCircle.style.setProperty(
        "--progress",
        `${percentage * 3.6}deg`
    );


    challengeProgressCircle.setAttribute(
        "aria-valuenow",
        percentage
    );
}

function updateCompletionState() {
    if (!challengeCompletion) {
        return;
    }

    challengeCompletion.hidden =
        !challengeCompletedAt;

    if (!challengeCompletedAt) {
        return;
    }

    if (challengeCertificateName) {
        certificateNameSection.hidden = true;
        certificateReadySection.hidden = false;

        certificateDisplayName.textContent =
            challengeCertificateName;

        certificatePreviewName.textContent =
            challengeCertificateName;

        const completedDate =
            new Date(challengeCompletedAt);

        certificatePreviewDate.textContent =
            `Completed ${completedDate.toLocaleDateString(
                "en-US",
                {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            )}`;
    } else {
        certificateNameSection.hidden = false;
        certificateReadySection.hidden = true;
    }
}

/* ==================================================
   SUPABASE PROGRESS
================================================== */

async function getCurrentParticipant() {
    const {
        data: userData,
        error: userError
    } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        console.error(
            "Unable to get authenticated user:",
            userError
        );

        return null;
    }

    const {
        data: participant,
        error: participantError
    } =
        await supabaseClient
            .from("challenge_participants")
            .select("id")
            .eq(
                "user_id",
                userData.user.id
            )
            .single();

    if (participantError) {
        console.error(
            "Unable to load participant:",
            participantError
        );

        return null;
    }

    currentParticipantId =
        participant.id;

    return participant;
}


async function loadChallengeProgress() {
    const participant =
        await getCurrentParticipant();

    if (!participant) {
        return;
    }

    const {
        data: savedProgress,
        error
    } =
        await supabaseClient
            .from("challenge_progress")
            .select(
                "progress, started_at, completed_at, certificate_name"
            )
            .eq(
                "participant_id",
                participant.id
            )
            .eq(
                "challenge_key",
                "30-day-challenge"
            )
            .maybeSingle();

    if (error) {
        console.error(
            "Unable to load challenge progress:",
            error
        );

        return;
    }

    if (!savedProgress) {
      const {
            error: insertError
        } =
            await supabaseClient
                .from("challenge_progress")
                .upsert(
                    {
                        participant_id:
                            participant.id,

                        challenge_key:
                            "30-day-challenge",

                        progress:
                            challengeProgress,

                        started_at:
                            new Date()
                                .toISOString()
                    },
                    {
                        onConflict:
                            "participant_id,challenge_key",

                        ignoreDuplicates:
                            true
                    }
                );

        if (insertError) {
            console.error(
                "Unable to create challenge progress:",
                insertError
            );
        }

        return;
    }

    challengeCompletedAt =
    savedProgress.completed_at || null;

    challengeCertificateName =
    savedProgress.certificate_name || null;

    if (
        savedProgress.progress &&
        typeof savedProgress.progress ===
            "object"
    ) {
        Object.keys(
            savedProgress.progress
        ).forEach((day) => {
            if (
                challengeProgress[day] &&
                savedProgress.progress[day]
            ) {
                Object.assign(
                    challengeProgress[day].tasks,
                    savedProgress
                        .progress[day]
                        .tasks || {}
                );
            }
        });
    }
}

function isChallengeComplete() {
    for (
        let day = 1;
        day <= challengeConfig.totalDays;
        day++
    ) {
        const tasks =
            getTasksForDay(day);

        for (const task of tasks) {
            if (
                !challengeProgress[
                    day
                ].tasks[task.id]
            ) {
                return false;
            }
        }
    }

    return true;
}

async function saveChallengeProgress() {
    if (!currentParticipantId) {
        return;
    }

    const updates = {
        progress:
            challengeProgress,

        updated_at:
            new Date()
                .toISOString()
    };

    /*
     * Permanently record completion
     * the first time the challenge
     * reaches 100%.
     */
    if (
        !challengeCompletedAt &&
        isChallengeComplete()
    ) {
        challengeCompletedAt =
            new Date()
                .toISOString();

        updates.completed_at =
            challengeCompletedAt;
    }

    const {
        error
    } =
        await supabaseClient
            .from("challenge_progress")
            .update(updates)
            .eq(
                "participant_id",
                currentParticipantId
            )
            .eq(
                "challenge_key",
                "30-day-challenge"
            );

    if (error) {
        console.error(
            "Unable to save challenge progress:",
            error
        );
    }
}

async function saveCertificateName() {
    if (
        !currentParticipantId ||
        !challengeCompletedAt
    ) {
        return;
    }

    const certificateName =
        certificateNameInput.value.trim();

    if (!certificateName) {
        certificateNameMessage.textContent =
            "Please enter the name you want on your certificate.";

        return;
    }

    certificateCreateButton.disabled = true;

    certificateNameMessage.textContent =
        "Creating your certificate...";

    const {
        error
    } =
        await supabaseClient
            .from("challenge_progress")
            .update({
                certificate_name:
                    certificateName,

                updated_at:
                    new Date()
                        .toISOString()
            })
            .eq(
                "participant_id",
                currentParticipantId
            )
            .eq(
                "challenge_key",
                "30-day-challenge"
            );

    if (error) {
        console.error(
            "Unable to save certificate name:",
            error
        );

        certificateNameMessage.textContent =
            "We couldn't save your certificate name. Please try again.";

        certificateCreateButton.disabled = false;

        return;
    }

    challengeCertificateName =
        certificateName;

    certificateNameMessage.textContent =
        "Certificate name saved.";

    updateCompletionState();

    certificateCreateButton.disabled = false;
}

function editCertificateName() {
    certificateNameInput.value =
        challengeCertificateName || "";

    certificateNameMessage.textContent = "";

    certificateReadySection.hidden = true;
    certificateNameSection.hidden = false;

    certificateNameInput.focus();
}

async function downloadCertificate() {
    if (
        !certificatePreview ||
        !challengeCertificateName
    ) {
        return;
    }

    certificateDownloadButton.disabled = true;

    const originalText =
        certificateDownloadButton.textContent;

    certificateDownloadButton.textContent =
        "Preparing Certificate...";

    let exportCertificate = null;

    try {
        /*
         * Create a separate certificate
         * specifically for PDF export.
         */
        exportCertificate =
            certificatePreview.cloneNode(true);

        exportCertificate.removeAttribute("id");

        exportCertificate
            .querySelectorAll("[id]")
            .forEach((element) => {
                element.removeAttribute("id");
            });

        exportCertificate.classList.add(
            "is-exporting"
        );

        document.body.appendChild(
            exportCertificate
        );

        const exportHero =
            exportCertificate.querySelector(
                ".challenge-certificate-preview__hero"
            );

        const exportEyebrow =
            exportCertificate.querySelector(
                ".challenge-certificate-preview__eyebrow"
            );

        const exportPresented =
            exportCertificate.querySelector(
                ".challenge-certificate-preview__presented"
            );

        const exportName =
            exportCertificate.querySelector(
                ".challenge-certificate-preview__name"
            );

        const exportFor =
            exportCertificate.querySelector(
                ".challenge-certificate-preview__for"
            );

        const exportChallenge =
            exportCertificate.querySelector(
                ".challenge-certificate-preview__challenge"
            );

        const exportStatement =
            exportCertificate.querySelector(
                ".challenge-certificate-preview__statement"
            );

        [
            exportHero,
            exportEyebrow,
            exportPresented,
            exportName,
            exportFor,
            exportChallenge,
            exportStatement
        ].forEach((element) => {
            if (element) {
                element.style.transform =
                    "translateY(55px)";
            }
        });

        /*
         * Make sure fonts and images
         * are completely loaded.
         */
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        const images =
            exportCertificate.querySelectorAll(
                "img"
            );

        await Promise.all(
            Array.from(images).map(
                async (image) => {
                    if (image.complete) {
                        try {
                            await image.decode();
                        } catch {
                            return;
                        }

                        return;
                    }

                    await new Promise(
                        (resolve) => {
                            image.onload = resolve;
                            image.onerror = resolve;
                        }
                    );
                }
            )
        );

        /*
         * Capture the fixed-size
         * export certificate.
         */
        const canvas =
            await html2canvas(
                exportCertificate,
                {
                    scale: 2,
                    useCORS: true,
                    backgroundColor:
                        "#fbfaf3",

                    width: 1056,
                    height: 816,

                    windowWidth: 1056,
                    windowHeight: 816
                }
            );

        const imageData =
            canvas.toDataURL(
                "image/png"
            );

        const {
            jsPDF
        } = window.jspdf;

        const pdf =
            new jsPDF({
                orientation: "landscape",
                unit: "in",
                format: "letter"
            });

        pdf.addImage(
            imageData,
            "PNG",
            0,
            0,
            11,
            8.5
        );

        const safeName =
            challengeCertificateName
                .trim()
                .replace(
                    /[^a-z0-9]+/gi,
                    "-"
                )
                .replace(
                    /^-+|-+$/g,
                    ""
                );

        pdf.save(
            `BWamplerFit-30-Day-Challenge-Certificate-${safeName}.pdf`
        );
    } catch (error) {
        console.error(
            "Certificate download failed:",
            error
        );

        alert(
            "We couldn't create your certificate. Please try again."
        );
    } finally {
        if (exportCertificate) {
            exportCertificate.remove();
        }

        certificateDownloadButton.disabled =
            false;

        certificateDownloadButton.textContent =
            originalText;
    }
}

/* ==================================================
   AUTHENTICATION
================================================== */

function showAuthentication() {
    challengeAuth.hidden = false;
    challengeDashboard.hidden = true;
}

function showDashboard() {
    challengeAuth.hidden = true;
    challengeDashboard.hidden = false;
}

async function signInParticipant(event) {
    event.preventDefault();

    const email =
        challengeAuthEmail.value
            .trim()
            .toLowerCase();

    const password =
        challengeAuthPassword.value;

    challengeAuthMessage.textContent =
        "Signing you in...";

    const {
        error
    } =
        await supabaseClient.auth
            .signInWithPassword({
                email,
                password
            });

    if (error) {
        console.error(
            "Sign-in error:",
            error
        );

        challengeAuthMessage.innerHTML = `
            We couldn't sign you in with those details.<br>
            If you haven't created an account yet,
            <a
                href="./"
                class="challenge-auth__create-link"
            >
                Create Account
            </a>.
        `;
        return;
    }

    challengeAuthMessage.textContent =
        "";
}

async function createParticipantAccount(event) {
    event.preventDefault();
    const email =
        challengeAuthEmail.value
            .trim()
            .toLowerCase();

    const password =
        challengeAuthPassword.value;

    if (!email || !password) {
        challengeAuthMessage.textContent =
            "Enter an email address and password first.";

        return;
    }

    challengeAuthMessage.textContent =
        "Creating your account...";

   const {
        data,
        error
    } =
        await supabaseClient.auth.signUp({
            email,
            password
        });

    if (error) {
        console.error(
            "Account creation error:",
            error
        );

        challengeAuthMessage.textContent =
            error.message;

        return;
    }

    if (data.session) {
            challengeAuthForm.hidden = true;

            challengeAuthMessage.textContent =
                "Account created. Signing you in...";

            return;
        }

        challengeAuthContent.hidden = true;

        challengeAuthMessage.innerHTML = `
            <strong>Your account has been created.</strong><br>
            Check your email to confirm your account,
            then return here and sign in.
        `;
}

function chooseAuthMode(mode) {
    authMode = mode;

    challengeAuthMessage.textContent = "";

    challengeAuthChoices.hidden = true;
    challengeAuthForm.hidden = false;

    if (authMode === "create") {
        challengeAuthPasswordLabel.textContent =
            "Create password";

        challengeAuthPassword.autocomplete =
            "new-password";

        challengeAuthSubmit.textContent =
            "Create Account";
    } else {
        challengeAuthPasswordLabel.textContent =
            "Password";

        challengeAuthPassword.autocomplete =
            "current-password";

        challengeAuthSubmit.textContent =
            " Continue To Challenge";
    }

    challengeAuthEmail.focus();
}

/* ==================================================
   EVENT LISTENERS
================================================== */

if (certificateCreateButton) {
    certificateCreateButton.addEventListener(
        "click",
        saveCertificateName
    );
}

if (certificateEditButton) {
    certificateEditButton.addEventListener(
        "click",
        editCertificateName
    );
}

if (certificateDownloadButton) {
    certificateDownloadButton.addEventListener(
        "click",
        downloadCertificate
    );
}

challengeAuthForm.addEventListener(
    "submit",
    (event) => {
        if (authMode === "create") {
            createParticipantAccount(event);
        } else {
            signInParticipant(event);
        }
    }
);

challengeAuthSigninChoice.addEventListener(
    "click",
    () => {
        chooseAuthMode("signin");
    }
);

challengeAuthCreateChoice.addEventListener(
    "click",
    () => {
        chooseAuthMode("create");
    }
);
/* ==================================================
   INITIALIZE
================================================== */

async function initializeChallenge() {
    applyChallengeBranding();

    initializeProgressState();

    await loadChallengeProgress();
    updateCompletionState();

    renderChallengeImages();

    renderChallengeHeader();

    const currentDay =
        getCurrentChallengeDay();

    
    if (currentDay > 0) {
        selectedDay = currentDay;

        renderChallengeDays();

        renderDayChecklist(
            currentDay
        );
    } else {
        selectedDay = null;

        renderChallengeDays();
    }

    updateChallengeProgress();
}

async function initializeApplication() {
    challengeAuth.hidden = true;
    challengeDashboard.hidden = true;

    applyChallengeBranding();

    const {
        data,
        error
    } =
        await supabaseClient.auth.getSession();

    if (error) {
        console.error(
            "Session check failed:",
            error
        );

        showAuthentication();
        return;
    }

    if (data.session) {
        await initializeChallenge();
        showDashboard();
        return;
    }

    showAuthentication();
}

supabaseClient.auth.onAuthStateChange(
    (event, session) => {
        if (
            event === "SIGNED_IN" &&
            session
        ) {
            setTimeout(async () => {
                try {
                    await initializeChallenge();
                    showDashboard();
                } catch (error) {
                    console.error(
                        "Challenge loading failed:",
                        error
                    );

                    showAuthentication();

                    challengeAuthMessage.textContent =
                        "Unable to load your progress. Please refresh.";
                }
            }, 0);
        }
    }
);

// 
initializeApplication();