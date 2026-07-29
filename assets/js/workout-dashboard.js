/**
 * Workout Consistency Dashboard
 *
 * Records multiple activity sessions per day.
 * Each session remains separate while daily totals
 * are combined for the yearly heatmap.
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    /* ==================================================
       Elements
    ================================================== */

    const heatmapGrid =
        document.querySelector('#heatmap-grid');

    const monthLabels =
        document.querySelector('#month-labels');

    const yearHeading =
        document.querySelector('#dashboard-year');

    const activeDaysElement =
        document.querySelector('#active-days');

    const currentStreakElement =
        document.querySelector('#current-streak');

    const entryDateInput =
        document.querySelector('#entry-date');

    const sessionNameInput =
        document.querySelector('#session-name');

    const activityTypeInput =
        document.querySelector('#activity-type');

    const durationInput =
        document.querySelector('#duration-minutes');

    const distanceInput =
        document.querySelector('#distance');

    const strengthInput =
        document.querySelector('#strength-minutes');

    const walkingInput =
        document.querySelector('#walking-minutes');

    const mobilityInput =
        document.querySelector('#mobility-minutes');

    const stepsInput =
        document.querySelector('#step-count');

    const notesInput =
        document.querySelector('#activity-notes');

    const saveButton =
        document.querySelector('#save-entry');

    const clearButton =
        document.querySelector('#clear-entry');

    const messageElement =
        document.querySelector('#entry-message');

    const sessionList =
        document.querySelector('#session-list');

    const sessionCount =
        document.querySelector('#session-count');

    const selectedDateElement =
        document.querySelector('#selected-day-date');

    const selectedSummaryElement =
        document.querySelector('#selected-day-summary');

    const settingsDialog =
        document.querySelector('#settings-dialog');

    const openSettingsButton =
        document.querySelector('#open-settings');

    const closeSettingsButton =
        document.querySelector('#close-settings');

    const resetWorkoutButton =
        document.querySelector('#reset-workout-history');

    const settingsMessage =
        document.querySelector('#settings-message');


    const requiredElements = {
        heatmapGrid,
        monthLabels,
        yearHeading,
        activeDaysElement,
        currentStreakElement,
        entryDateInput,
        sessionNameInput,
        activityTypeInput,
        durationInput,
        distanceInput,
        strengthInput,
        walkingInput,
        mobilityInput,
        stepsInput,
        notesInput,
        saveButton,
        clearButton,
        messageElement,
        sessionList,
        sessionCount,
        selectedDateElement,
        selectedSummaryElement,
    };


    const missingElements =
        Object.entries(requiredElements)
            .filter(function (entry) {
                return !entry[1];
            })
            .map(function (entry) {
                return entry[0];
            });


    if (missingElements.length > 0) {
        console.error(
            'Workout dashboard could not start. Missing elements:',
            missingElements
        );

        return;
    }


    /* ==================================================
       Settings
    ================================================== */

    const today =
        getToday();

    const currentYear =
        today.getFullYear();

    const storageKey =
        `workout-activity-${currentYear}`;

    yearHeading.textContent =
        currentYear;


    /* ==================================================
       Stored Data
    ================================================== */

    let activityEntries =
        loadEntries();


    function loadEntries() {
        try {
            const storedValue =
                localStorage.getItem(storageKey);

            if (!storedValue) {
                return {};
            }

            const parsedValue =
                JSON.parse(storedValue);

            if (
                typeof parsedValue !== 'object'
                || parsedValue === null
                || Array.isArray(parsedValue)
            ) {
                return {};
            }

            return migrateEntries(parsedValue);
        } catch (error) {
            console.error(
                'Activity data could not be loaded.',
                error
            );

            return {};
        }
    }


    function migrateEntries(entries) {
        const migratedEntries = {};

        Object.keys(entries).forEach(function (dateKey) {
            const entry =
                entries[dateKey];


            if (
                entry
                && Array.isArray(entry.sessions)
            ) {
                migratedEntries[dateKey] = {
                    sessions:
                        entry.sessions.map(
                            normalizeSession
                        ),
                };

                return;
            }


            if (
                entry
                && typeof entry === 'object'
            ) {
                migratedEntries[dateKey] = {
                    sessions: [
                        normalizeSession({
                            id: createSessionId(),
                            name: 'Previous activity',
                            activityType: '',
                            duration: 0,
                            distance: 0,
                            strength:
                                Number(entry.strength) || 0,
                            walking:
                                Number(entry.walking) || 0,
                            mobility:
                                Number(entry.mobility) || 0,
                            steps:
                                Number(entry.steps) || 0,
                            notes:
                                entry.notes || '',
                        }),
                    ],
                };
            }
        });

        return migratedEntries;
    }


    function normalizeSession(session) {
        return {
            id:
                session.id
                || createSessionId(),

            name:
                session.name
                || 'Activity session',

            activityType:
                session.activityType
                || '',

            duration:
                sanitizeNumber(
                    session.duration
                ),

            distance:
                sanitizeDecimal(
                    session.distance
                ),

            strength:
                sanitizeNumber(
                    session.strength
                ),

            walking:
                sanitizeNumber(
                    session.walking
                ),

            mobility:
                sanitizeNumber(
                    session.mobility
                ),

            steps:
                sanitizeNumber(
                    session.steps
                ),

            notes:
                session.notes
                || '',
        };
    }


    function saveEntries() {
        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify(activityEntries)
            );

            return true;
        } catch (error) {
            console.error(
                'Activity data could not be saved.',
                error
            );

            showMessage(
                'Your activity could not be saved.'
            );

            return false;
        }
    }


    /* ==================================================
       Date Helpers
    ================================================== */

    function getToday() {
        const currentDate =
            new Date();

        return new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate()
        );
    }


    function formatDateKey(date) {
        const year =
            date.getFullYear();

        const month =
            String(date.getMonth() + 1)
                .padStart(2, '0');

        const day =
            String(date.getDate())
                .padStart(2, '0');

        return `${year}-${month}-${day}`;
    }


    function parseDateKey(dateKey) {
        const parts =
            dateKey.split('-').map(Number);

        return new Date(
            parts[0],
            parts[1] - 1,
            parts[2]
        );
    }


    function formatReadableDate(date) {
        return new Intl.DateTimeFormat(
            'en-US',
            {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }
        ).format(date);
    }


    function isSameDay(
        firstDate,
        secondDate
    ) {
        return (
            firstDate.getFullYear()
                === secondDate.getFullYear()
            && firstDate.getMonth()
                === secondDate.getMonth()
            && firstDate.getDate()
                === secondDate.getDate()
        );
    }


    function getStartOfHeatmap(year) {
        const firstDay =
            new Date(year, 0, 1);

        const start =
            new Date(firstDay);

        start.setDate(
            firstDay.getDate()
            - firstDay.getDay()
        );

        return start;
    }


    function getEndOfHeatmap(year) {
        const lastDay =
            new Date(year, 11, 31);

        const end =
            new Date(lastDay);

        end.setDate(
            lastDay.getDate()
            + (6 - lastDay.getDay())
        );

        return end;
    }


    /* ==================================================
       Number Helpers
    ================================================== */

    function sanitizeNumber(value) {
        const number =
            Number(value);

        if (
            !Number.isFinite(number)
            || number < 0
        ) {
            return 0;
        }

        return Math.round(number);
    }


    function sanitizeDecimal(value) {
        const number =
            Number(value);

        if (
            !Number.isFinite(number)
            || number < 0
        ) {
            return 0;
        }

        return (
            Math.round(number * 100)
            / 100
        );
    }


    /* ==================================================
       Session Helpers
    ================================================== */

    function createSessionId() {
        return (
            Date.now().toString(36)
            + Math.random()
                .toString(36)
                .slice(2)
        );
    }


    function getSessions(dateKey) {
        const dayEntry =
            activityEntries[dateKey];

        if (
            !dayEntry
            || !Array.isArray(dayEntry.sessions)
        ) {
            return [];
        }

        return dayEntry.sessions;
    }


    function getDailyTotals(dateKey) {
        const totals = {
            duration: 0,
            distance: 0,
            strength: 0,
            walking: 0,
            mobility: 0,
            steps: 0,
        };


        getSessions(dateKey)
            .forEach(function (session) {
                totals.duration +=
                    Number(session.duration) || 0;

                totals.distance +=
                    Number(session.distance) || 0;

                totals.strength +=
                    Number(session.strength) || 0;

                totals.walking +=
                    Number(session.walking) || 0;

                totals.mobility +=
                    Number(session.mobility) || 0;

                totals.steps +=
                    Number(session.steps) || 0;
            });


        totals.distance =
            Math.round(
                totals.distance * 100
            ) / 100;


        return totals;
    }


    function sessionHasActivity(session) {
        return (
            session.duration > 0
            || session.distance > 0
            || session.strength > 0
            || session.walking > 0
            || session.mobility > 0
            || session.steps > 0
        );
    }


    function hasActivity(dateKey) {
        return getSessions(dateKey)
            .some(sessionHasActivity);
    }


    /* ==================================================
       Activity Score
    ================================================== */

    function getEntryScore(dateKey) {
        const totals =
            getDailyTotals(dateKey);

        return (
            totals.duration
            + totals.strength
            + totals.walking
            + totals.mobility
            + Math.floor(
                totals.steps / 1000
            )
            + Math.floor(
                totals.distance * 2
            )
        );
    }


    function getActivityLevel(dateKey) {
        const score =
            getEntryScore(dateKey);

        if (score === 0) {
            return 0;
        }

        if (score < 30) {
            return 1;
        }

        if (score < 60) {
            return 2;
        }

        if (score < 90) {
            return 3;
        }

        return 4;
    }


    /* ==================================================
       Heatmap
    ================================================== */

    function buildHeatmap() {
        heatmapGrid.innerHTML = '';
        monthLabels.innerHTML = '';

        const start =
            getStartOfHeatmap(currentYear);

        const end =
            getEndOfHeatmap(currentYear);

        const currentDate =
            new Date(start);

        let weekIndex = 0;
        let previousMonth = null;


        while (currentDate <= end) {
            const dayButton =
                document.createElement('button');

            dayButton.type = 'button';

            dayButton.className =
                'heatmap-day level-0';

            const dateKey =
                formatDateKey(currentDate);

            const isCurrentYear =
                currentDate.getFullYear()
                === currentYear;


            if (!isCurrentYear) {
                dayButton.style.visibility =
                    'hidden';

                dayButton.disabled = true;
            } else {
                dayButton.dataset.date =
                    dateKey;

                updateDayButton(
                    dayButton,
                    dateKey
                );


                if (
                    isSameDay(
                        currentDate,
                        today
                    )
                ) {
                    dayButton.classList.add(
                        'is-today'
                    );
                }


                if (currentDate > today) {
                    dayButton.classList.add(
                        'is-future'
                    );

                    dayButton.disabled = true;
                } else {
                    dayButton.addEventListener(
                        'click',
                        handleHeatmapClick
                    );
                }
            }


            heatmapGrid.appendChild(
                dayButton
            );


            if (
                isCurrentYear
                && currentDate.getMonth()
                    !== previousMonth
                && currentDate.getDate() <= 7
            ) {
                createMonthLabel(
                    currentDate,
                    weekIndex
                );

                previousMonth =
                    currentDate.getMonth();
            }


            if (
                currentDate.getDay() === 6
            ) {
                weekIndex += 1;
            }


            currentDate.setDate(
                currentDate.getDate() + 1
            );
        }


        updateSelectedHighlight();
        updateStatistics();
    }


    function createMonthLabel(
        date,
        weekIndex
    ) {
        const label =
            document.createElement('span');

        label.className =
            'month-label';

        label.textContent =
            date.toLocaleDateString(
                'en-US',
                {
                    month: 'short',
                }
            );

        label.style.left =
            `${weekIndex * 18}px`;

        monthLabels.appendChild(label);
    }


    function updateDayButton(
        button,
        dateKey
    ) {
        button.classList.remove(
            'level-0',
            'level-1',
            'level-2',
            'level-3',
            'level-4'
        );

        button.classList.add(
            `level-${getActivityLevel(dateKey)}`
        );

        const readableDate =
            formatReadableDate(
                parseDateKey(dateKey)
            );

        const summary =
            createDailySummary(dateKey);

        button.title =
            `${readableDate}: ${summary}`;

        button.setAttribute(
            'aria-label',
            button.title
        );
    }


    function refreshDayButton(dateKey) {
        const button =
            heatmapGrid.querySelector(
                `[data-date="${dateKey}"]`
            );

        if (!button) {
            return;
        }

        updateDayButton(
            button,
            dateKey
        );
    }


    /* ==================================================
       Form
    ================================================== */

    function setInitialDate() {
        const todayKey =
            formatDateKey(today);

        entryDateInput.value =
            todayKey;

        entryDateInput.max =
            todayKey;

        entryDateInput.min =
            `${currentYear}-01-01`;

        loadSelectedDate(todayKey);
    }


    function getFormSession() {
        return {
            id:
                createSessionId(),

            name:
                sessionNameInput.value.trim()
                || 'Activity session',

            activityType:
                activityTypeInput.value.trim(),

            duration:
                sanitizeNumber(
                    durationInput.value
                ),

            distance:
                sanitizeDecimal(
                    distanceInput.value
                ),

            strength:
                sanitizeNumber(
                    strengthInput.value
                ),

            walking:
                sanitizeNumber(
                    walkingInput.value
                ),

            mobility:
                sanitizeNumber(
                    mobilityInput.value
                ),

            steps:
                sanitizeNumber(
                    stepsInput.value
                ),

            notes:
                notesInput.value.trim(),
        };
    }


    function addSession() {
        const dateKey =
            entryDateInput.value;

        if (!dateKey) {
            showMessage(
                'Choose an entry date.'
            );

            return;
        }


        const selectedDate =
            parseDateKey(dateKey);


        if (selectedDate > today) {
            showMessage(
                'Future activity cannot be recorded.'
            );

            return;
        }


        const session =
            getFormSession();


        if (!sessionHasActivity(session)) {
            showMessage(
                'Enter some activity before saving.'
            );

            return;
        }


        if (!activityEntries[dateKey]) {
            activityEntries[dateKey] = {
                sessions: [],
            };
        }


        if (
            !Array.isArray(
                activityEntries[dateKey]
                    .sessions
            )
        ) {
            activityEntries[dateKey]
                .sessions = [];
        }


        activityEntries[dateKey]
            .sessions
            .push(session);


        const saved =
            saveEntries();


        if (!saved) {
            return;
        }


        refreshDayButton(dateKey);
        renderSessionList(dateKey);
        updateSelectedDay(dateKey);
        updateSelectedHighlight();
        updateStatistics();

        clearFormFields();

        showMessage(
            'Activity session added.'
        );
    }


    function clearFormFields() {
        sessionNameInput.value = '';
        activityTypeInput.value = '';

        durationInput.value = 0;
        distanceInput.value = 0;

        strengthInput.value = 0;
        walkingInput.value = 0;
        mobilityInput.value = 0;
        stepsInput.value = 0;

        notesInput.value = '';
    }


    function showMessage(message) {
        messageElement.textContent =
            message;
    }


    /* ==================================================
       Session List
    ================================================== */

    function renderSessionList(dateKey) {
        const sessions =
            getSessions(dateKey);

        sessionList.innerHTML = '';

        sessionCount.textContent =
            sessions.length === 1
                ? '1 session'
                : `${sessions.length} sessions`;


        if (sessions.length === 0) {
            const emptyMessage =
                document.createElement('p');

            emptyMessage.className =
                'no-sessions-message';

            emptyMessage.textContent =
                'No activity sessions recorded for this date.';

            sessionList.appendChild(
                emptyMessage
            );

            return;
        }


        sessions.forEach(function (
            session,
            index
        ) {
            const item =
                document.createElement('div');

            item.className =
                'session-list-item';


            const details =
                document.createElement('div');

            details.className =
                'session-details';


            const title =
                document.createElement('strong');

            title.className =
                'session-title';

            title.textContent =
                session.name
                || `Session ${index + 1}`;


            const summary =
                document.createElement('p');

            summary.className =
                'session-summary';

            summary.textContent =
                createSessionSummary(session);


            details.appendChild(title);
            details.appendChild(summary);


            if (session.notes) {
                const notes =
                    document.createElement('p');

                notes.className =
                    'session-notes';

                notes.textContent =
                    session.notes;

                details.appendChild(notes);
            }


            const deleteButton =
                document.createElement('button');

            deleteButton.type =
                'button';

            deleteButton.className =
                'delete-session-button';

            deleteButton.textContent =
                'Delete';

            deleteButton.addEventListener(
                'click',
                function () {
                    deleteSession(
                        dateKey,
                        session.id
                    );
                }
            );


            item.appendChild(details);
            item.appendChild(deleteButton);

            sessionList.appendChild(item);
        });
    }


    function deleteSession(
        dateKey,
        sessionId
    ) {
        const sessions =
            getSessions(dateKey);

        activityEntries[dateKey].sessions =
            sessions.filter(
                function (session) {
                    return (
                        session.id
                        !== sessionId
                    );
                }
            );


        if (
            activityEntries[dateKey]
                .sessions.length === 0
        ) {
            delete activityEntries[dateKey];
        }


        saveEntries();

        refreshDayButton(dateKey);
        renderSessionList(dateKey);
        updateSelectedDay(dateKey);
        updateStatistics();

        showMessage(
            'Activity session deleted.'
        );
    }


    function createSessionSummary(session) {
        const parts = [];


        if (session.activityType) {
            parts.push(
                session.activityType
            );
        }


        if (session.duration) {
            parts.push(
                `${session.duration} minutes`
            );
        }


        if (session.distance) {
            parts.push(
                `${session.distance} miles`
            );
        }


        if (session.strength) {
            parts.push(
                `${session.strength} strength minutes`
            );
        }


        if (session.walking) {
            parts.push(
                `${session.walking} walking minutes`
            );
        }


        if (session.mobility) {
            parts.push(
                `${session.mobility} mobility minutes`
            );
        }


        if (session.steps) {
            parts.push(
                `${Number(session.steps)
                    .toLocaleString()} steps`
            );
        }


        return (
            parts.join(' • ')
            || 'Activity recorded'
        );
    }


    /* ==================================================
       Selected Date
    ================================================== */

    function loadSelectedDate(dateKey) {
        clearFormFields();
        renderSessionList(dateKey);
        updateSelectedDay(dateKey);
        updateSelectedHighlight();

        showMessage('');
    }


    function updateSelectedDay(dateKey) {
        selectedDateElement.textContent =
            formatReadableDate(
                parseDateKey(dateKey)
            );

        selectedSummaryElement.textContent =
            createDailySummary(dateKey);
    }


    function createDailySummary(dateKey) {
        if (!hasActivity(dateKey)) {
            return 'No activity recorded.';
        }


        const sessions =
            getSessions(dateKey);

        const totals =
            getDailyTotals(dateKey);

        const parts = [];


        parts.push(
            sessions.length === 1
                ? '1 session'
                : `${sessions.length} sessions`
        );


        if (totals.duration) {
            parts.push(
                `${totals.duration} activity minutes`
            );
        }


        if (totals.distance) {
            parts.push(
                `${totals.distance} miles`
            );
        }


        if (totals.strength) {
            parts.push(
                `${totals.strength} strength minutes`
            );
        }


        if (totals.walking) {
            parts.push(
                `${totals.walking} walking minutes`
            );
        }


        if (totals.mobility) {
            parts.push(
                `${totals.mobility} mobility minutes`
            );
        }


        if (totals.steps) {
            parts.push(
                `${totals.steps
                    .toLocaleString()} steps`
            );
        }


        return parts.join(' • ');
    }


    /* ==================================================
       Heatmap Selection
    ================================================== */

    function handleHeatmapClick(event) {
        const dateKey =
            event.currentTarget.dataset.date;

        if (!dateKey) {
            return;
        }


        entryDateInput.value =
            dateKey;

        loadSelectedDate(dateKey);


        const activitySection =
            document.querySelector(
                '.activity-section'
            );


        if (activitySection) {
            activitySection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }


    function updateSelectedHighlight() {
        heatmapGrid
            .querySelectorAll('.is-selected')
            .forEach(function (button) {
                button.classList.remove(
                    'is-selected'
                );
            });


        const dateKey =
            entryDateInput.value;

        if (!dateKey) {
            return;
        }


        const selectedButton =
            heatmapGrid.querySelector(
                `[data-date="${dateKey}"]`
            );


        if (selectedButton) {
            selectedButton.classList.add(
                'is-selected'
            );
        }
    }


    /* ==================================================
       Statistics
    ================================================== */

    function updateStatistics() {
        const activeDates =
            Object.keys(activityEntries)
                .filter(hasActivity);

        activeDaysElement.textContent =
            activeDates.length;

        currentStreakElement.textContent =
            calculateCurrentStreak();
    }


    function calculateCurrentStreak() {
        const activeDates =
            new Set(
                Object.keys(activityEntries)
                    .filter(hasActivity)
            );

        let streak = 0;

        const streakDate =
            new Date(today);


        if (
            !activeDates.has(
                formatDateKey(streakDate)
            )
        ) {
            streakDate.setDate(
                streakDate.getDate() - 1
            );
        }


        while (
            activeDates.has(
                formatDateKey(streakDate)
            )
        ) {
            streak += 1;

            streakDate.setDate(
                streakDate.getDate() - 1
            );
        }


        return streak;
    }

 /* ==================================================
        Settings
 ================================================== */

        function openSettings() {
            settingsMessage.textContent = '';
            settingsDialog.showModal();
        }

        function closeSettings() {
            settingsDialog.close();
        }

        function resetWorkoutHistory() {

            const confirmed = confirm(
                'Reset all workout history? This cannot be undone.'
            );

            if (!confirmed) {
                return;
            }

            localStorage.removeItem(storageKey);

            activityEntries = {};

            buildHeatmap();

            loadSelectedDate(entryDateInput.value);

            updateStatistics();

            settingsMessage.textContent =
                'Workout history has been reset.';
        }

    /* ==================================================
       Events
    ================================================== */

    saveButton.addEventListener(
        'click',
        addSession
    );


    clearButton.addEventListener(
        'click',
        function () {
            clearFormFields();

            showMessage(
                'Form cleared.'
            );
        }
    );


    entryDateInput.addEventListener(
        'change',
        function () {
            loadSelectedDate(
                entryDateInput.value
            );
        }
    );

    if (
        openSettingsButton
        && settingsDialog
        && closeSettingsButton
        ) {
            openSettingsButton.addEventListener(
                'click',
                function () {
                    settingsMessage.textContent = '';
                    settingsDialog.showModal();
                }
            );

            closeSettingsButton.addEventListener(
                'click',
                function () {
                    settingsDialog.close();
                }
            );

            settingsDialog.addEventListener(
                'click',
                function (event) {
                    if (event.target === settingsDialog) {
                        settingsDialog.close();
                    }
                }
            );
        }


        if (resetWorkoutButton) {
            resetWorkoutButton.addEventListener(
                'click',
                resetWorkoutHistory
            );
        }

    /* ==================================================
       Initialize
    ================================================== */

    buildHeatmap();
    setInitialDate();
});