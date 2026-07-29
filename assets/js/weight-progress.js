/**
 * Weight Progress Tracker
 *
 * Stores the user's starting weight, goal weight,
 * and dated weight entries separately from workout data.
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    console.log('Weight Progress JS loaded');

    /* ==================================================
       Elements
    ================================================== */

            const goalSetup =
                document.querySelector('#weight-goal-setup');

            const weightDashboard =
                document.querySelector('#weight-dashboard');

            const startingWeightInput =
                document.querySelector('#starting-weight');

            const goalWeightInput =
                document.querySelector('#goal-weight');

            const saveGoalsButton =
                document.querySelector('#save-weight-goals');

            const editGoalsButton =
                document.querySelector('#edit-weight-goals');

            const goalMessage =
                document.querySelector('#weight-goal-message');

            const entryDateInput =
                document.querySelector('#weight-entry-date');

            const currentWeightInput =
                document.querySelector('#current-weight');

            const saveEntryButton =
                document.querySelector('#save-weight-entry');

            const entryMessage =
                document.querySelector('#weight-entry-message');

            const progressCircle =
                document.querySelector('#weight-progress-circle');

            const progressPercentage =
                document.querySelector('#weight-progress-percentage');

            const progressStatus =
                document.querySelector('#weight-progress-status');

            const progressBar =
                document.querySelector('#weight-progress-bar');

            const progressBarFill =
                document.querySelector('#weight-progress-bar-fill');

            const progressStartLabel =
                document.querySelector('#progress-start-label');

            const progressGoalLabel =
                document.querySelector('#progress-goal-label');

            const progressBarCurrent =
                document.querySelector('#weight-progress-bar-current');

            const startingWeightDisplay =
                document.querySelector('#starting-weight-display');

            const currentWeightDisplay =
                document.querySelector('#current-weight-display');

            const goalWeightDisplay =
                document.querySelector('#goal-weight-display');

            const remainingWeightDisplay =
                document.querySelector('#remaining-weight-display');

            const historyList =
                document.querySelector('#weight-history-list');

            const entryCount =
                document.querySelector('#weight-entry-count');

            const resetWeightButton =
                document.querySelector('#reset-weight-progress');

            const requiredElements = {
                goalSetup,
                weightDashboard,
                startingWeightInput,
                goalWeightInput,
                saveGoalsButton,
                editGoalsButton,
                goalMessage,
                entryDateInput,
                currentWeightInput,
                saveEntryButton,
                entryMessage,
                progressCircle,
                progressPercentage,
                progressStatus,
                progressBar,
                progressBarFill,
                progressStartLabel,
                progressGoalLabel,
                progressBarCurrent,
                startingWeightDisplay,
                currentWeightDisplay,
                goalWeightDisplay,
                remainingWeightDisplay,
                historyList,
                entryCount,
                resetWeightButton,
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
                    'Weight tracker could not start. Missing elements:',
                    missingElements
                );

                return;
            }


    /* ==================================================
       Storage
    ================================================== */

            const storageKey =
                'workout-dashboard-weight-progress';

            let weightData =
                loadWeightData();


            function getEmptyWeightData() {
                return {
                    startingWeight: null,
                    goalWeight: null,
                    entries: [],
                };
            }


            function loadWeightData() {
                try {
                    const storedValue =
                        localStorage.getItem(storageKey);

                    if (!storedValue) {
                        return getEmptyWeightData();
                    }

                    const parsedValue =
                        JSON.parse(storedValue);

                    return normalizeWeightData(parsedValue);

                } catch (error) {
                    console.error(
                        'Weight data could not be loaded.',
                        error
                    );

                    return getEmptyWeightData();
                }
            }


            function normalizeWeightData(data) {
                const normalized =
                    getEmptyWeightData();

                if (
                    !data
                    || typeof data !== 'object'
                    || Array.isArray(data)
                ) {
                    return normalized;
                }


                normalized.startingWeight =
                    sanitizeWeight(data.startingWeight);

                normalized.goalWeight =
                    sanitizeWeight(data.goalWeight);


                if (Array.isArray(data.entries)) {
                    normalized.entries =
                        data.entries
                            .map(function (entry) {
                                return {
                                    id:
                                        entry.id
                                        || createEntryId(),

                                    date:
                                        typeof entry.date === 'string'
                                            ? entry.date
                                            : '',

                                    weight:
                                        sanitizeWeight(
                                            entry.weight
                                        ),
                                };
                            })
                            .filter(function (entry) {
                                return (
                                    entry.date
                                    && entry.weight !== null
                                );
                            });
                }


                return normalized;
            }


            function saveWeightData() {
                try {
                    localStorage.setItem(
                        storageKey,
                        JSON.stringify(weightData)
                    );

                    return true;

                } catch (error) {
                    console.error(
                        'Weight data could not be saved.',
                        error
                    );

                    showEntryMessage(
                        'Your weight data could not be saved.'
                    );

                    return false;
                }
            }


    /* ==================================================
       Helpers
    ================================================== */

            function sanitizeWeight(value) {
                const number =
                    Number(value);

                if (
                    !Number.isFinite(number)
                    || number <= 0
                ) {
                    return null;
                }

                return (
                    Math.round(number * 10)
                    / 10
                );
            }


            function createEntryId() {
                return (
                    Date.now().toString(36)
                    + Math.random()
                        .toString(36)
                        .slice(2)
                );
            }


            function getTodayKey() {
                const today =
                    new Date();

                const year =
                    today.getFullYear();

                const month =
                    String(today.getMonth() + 1)
                        .padStart(2, '0');

                const day =
                    String(today.getDate())
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


            function formatReadableDate(dateKey) {
                return new Intl.DateTimeFormat(
                    'en-US',
                    {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                    }
                ).format(
                    parseDateKey(dateKey)
                );
            }


            function formatWeight(weight) {
                if (weight === null) {
                    return '--';
                }

                return `${weight.toFixed(1)} lb`;
            }


            function hasWeightGoals() {
                return (
                    weightData.startingWeight !== null
                    && weightData.goalWeight !== null
                    && weightData.startingWeight
                        !== weightData.goalWeight
                );
            }


            function getSortedEntriesAscending() {
                return [...weightData.entries]
                    .sort(function (
                        firstEntry,
                        secondEntry
                    ) {
                        return firstEntry.date
                            .localeCompare(secondEntry.date);
                    });
            }


            function getSortedEntriesDescending() {
                return getSortedEntriesAscending()
                    .reverse();
            }


            function getCurrentWeight() {
                const entries =
                    getSortedEntriesAscending();

                if (entries.length === 0) {
                    return null;
                }

                return entries[
                    entries.length - 1
                ].weight;
            }


            function clamp(
                value,
                minimum,
                maximum
            ) {
                return Math.min(
                    Math.max(value, minimum),
                    maximum
                );
            }


    /* ==================================================
       Progress Calculation
    ================================================== */

            function calculateProgress() {
                const startingWeight =
                    weightData.startingWeight;

                const goalWeight =
                    weightData.goalWeight;

                const currentWeight =
                    getCurrentWeight();


                if (
                    startingWeight === null
                    || goalWeight === null
                    || currentWeight === null
                    || startingWeight === goalWeight
                ) {
                    return {
                        percentage: 0,
                        remaining: null,
                        totalChange: null,
                        goalReached: false,
                        movingTowardGoal: true,
                    };
                }


                const totalRequiredChange =
                    goalWeight - startingWeight;

                const completedChange =
                    currentWeight - startingWeight;

                const rawPercentage =
                    (
                        completedChange
                        / totalRequiredChange
                    ) * 100;

                const percentage =
                    clamp(rawPercentage, 0, 100);

                const remaining =
                    Math.abs(
                        goalWeight - currentWeight
                    );

                const totalChange =
                    Math.abs(
                        currentWeight - startingWeight
                    );

                const isWeightLossGoal =
                    goalWeight < startingWeight;

                const goalReached =
                    isWeightLossGoal
                        ? currentWeight <= goalWeight
                        : currentWeight >= goalWeight;

                const movingTowardGoal =
                    rawPercentage >= 0;


                return {
                    percentage:
                        Math.round(
                            percentage * 10
                        ) / 10,

                    remaining:
                        Math.round(
                            remaining * 10
                        ) / 10,

                    totalChange:
                        Math.round(
                            totalChange * 10
                        ) / 10,

                    goalReached,
                    movingTowardGoal,
                };
            }


    /* ==================================================
       Goal Setup
    ================================================== */

            function saveGoals() {
                const startingWeight =
                    sanitizeWeight(
                        startingWeightInput.value
                    );

                const goalWeight =
                    sanitizeWeight(
                        goalWeightInput.value
                    );


                if (
                    startingWeight === null
                    || goalWeight === null
                ) {
                    showGoalMessage(
                        'Enter a valid starting weight and goal weight.'
                    );

                    return;
                }


                if (startingWeight === goalWeight) {
                    showGoalMessage(
                        'Starting weight and goal weight must be different.'
                    );

                    return;
                }


                weightData.startingWeight =
                    startingWeight;

                weightData.goalWeight =
                    goalWeight;


                if (!saveWeightData()) {
                    return;
                }


                showGoalMessage('');
                goalSetup.hidden = true;
                weightDashboard.hidden = false;

                renderWeightTracker();
            }


            function editGoals() {
                startingWeightInput.value =
                    weightData.startingWeight
                    ?? '';

                goalWeightInput.value =
                    weightData.goalWeight
                    ?? '';

                goalSetup.hidden = false;

                goalSetup.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }


            function showGoalMessage(message) {
                goalMessage.textContent =
                    message;
            }


    /* ==================================================
       Weight Entries
    ================================================== */

            function saveWeightEntry() {
                const date =
                    entryDateInput.value;

                const weight =
                    sanitizeWeight(
                        currentWeightInput.value
                    );


                if (!date) {
                    showEntryMessage(
                        'Choose an entry date.'
                    );

                    return;
                }


                if (date > getTodayKey()) {
                    showEntryMessage(
                        'Future weight entries cannot be recorded.'
                    );

                    return;
                }


                if (weight === null) {
                    showEntryMessage(
                        'Enter a valid current weight.'
                    );

                    return;
                }


                const existingEntry =
                    weightData.entries.find(
                        function (entry) {
                            return entry.date === date;
                        }
                    );


                if (existingEntry) {
                    existingEntry.weight =
                        weight;
                } else {
                    weightData.entries.push({
                        id: createEntryId(),
                        date,
                        weight,
                    });
                }


                if (!saveWeightData()) {
                    return;
                }


                currentWeightInput.value = '';

                showEntryMessage(
                    existingEntry
                        ? 'Weight entry updated.'
                        : 'Weight entry saved.'
                );

                renderWeightTracker();
            }


            function deleteWeightEntry(entryId) {
                weightData.entries =
                    weightData.entries.filter(
                        function (entry) {
                            return entry.id !== entryId;
                        }
                    );

                saveWeightData();

                showEntryMessage(
                    'Weight entry deleted.'
                );

                renderWeightTracker();
            }


            function showEntryMessage(message) {
                entryMessage.textContent =
                    message;
            }


    /* ==================================================
       Rendering
    ================================================== */

            function renderWeightTracker() {
                renderProgress();
                renderHistory();
            }


            function renderProgress() {
                const startingWeight =
                    weightData.startingWeight;

                const goalWeight =
                    weightData.goalWeight;

                const currentWeight =
                    getCurrentWeight();

                const progress =
                    calculateProgress();


                startingWeightDisplay.textContent =
                    formatWeight(startingWeight);

                currentWeightDisplay.textContent =
                    formatWeight(currentWeight);

                goalWeightDisplay.textContent =
                    formatWeight(goalWeight);

                remainingWeightDisplay.textContent =
                    progress.remaining === null
                        ? '--'
                        : `${progress.remaining.toFixed(1)} lb`;


                progressStartLabel.textContent =
                    `Start: ${formatWeight(startingWeight)}`;

                progressGoalLabel.textContent =
                    `Goal: ${formatWeight(goalWeight)}`;


                const percentage =
                    progress.percentage;

                progressPercentage.textContent =
                    `${Math.round(percentage)}%`;

                progressCircle.style.setProperty(
                    '--weight-progress',
                    `${percentage * 3.6}deg`
                );

                progressCircle.setAttribute(
                    'aria-label',
                    `${Math.round(percentage)} percent toward weight goal`
                );


                progressBarFill.style.width =
                    `${percentage}%`;

                progressBar.setAttribute(
                    'aria-valuenow',
                    String(Math.round(percentage))
                );


                if (currentWeight === null) {
                    progressStatus.textContent =
                        'Record your current weight to begin.';

                    progressBarCurrent.textContent =
                        'Current weight not recorded';

                    return;
                }


                progressBarCurrent.textContent =
                    `Current: ${formatWeight(currentWeight)}`;

                    const summaryCurrentWeight = document.getElementById(
                        'summary-current-weight'
                    );

                    if (summaryCurrentWeight) {
                        summaryCurrentWeight.textContent =
                            formatWeight(currentWeight);
                    }

                    const summaryWeightChange = document.getElementById(
                        'summary-weight-change'
                    );

                        if (summaryWeightChange) {
                            const weightDifference =
                                Math.round(
                                        (
                                            currentWeight
                                            - startingWeight
                                        ) * 10
                                ) / 10;

                            if (weightDifference === 0) {
                                    summaryWeightChange.textContent =
                                        '0.0 lb';

                                } else if (weightDifference < 0) {
                                    summaryWeightChange.textContent =
                                        `${Math.abs(weightDifference).toFixed(1)} lb down`;

                                } else {
                                    summaryWeightChange.textContent =
                                        `${weightDifference.toFixed(1)} lb up`;
                                }
                        }
             
                    if (progress.goalReached) {
                        progressStatus.textContent =
                            'Goal reached.';

                        remainingWeightDisplay.textContent =
                            '0.0 lb';

                        return;
                    }


                    if (!progress.movingTowardGoal) {
                        progressStatus.textContent =
                            'Your current weight is moving away from the goal.';

                        return;
                    }


                    if (progress.totalChange === 0) {
                        progressStatus.textContent =
                            'This is your starting point.';

                        return;
                    }


                const isWeightLossGoal =
                    goalWeight < startingWeight;

                progressStatus.textContent =
                    isWeightLossGoal
                        ? `${progress.totalChange.toFixed(1)} lb lost so far`
                        : `${progress.totalChange.toFixed(1)} lb gained so far`;
            }


            function renderHistory() {
                const entries =
                    getSortedEntriesDescending();

                historyList.innerHTML = '';

                entryCount.textContent =
                    entries.length === 1
                        ? '1 entry'
                        : `${entries.length} entries`;


                if (entries.length === 0) {
                    const emptyMessage =
                        document.createElement('p');

                    emptyMessage.className =
                        'no-weight-entries-message';

                    emptyMessage.textContent =
                        'No weight entries recorded yet.';

                    historyList.appendChild(
                        emptyMessage
                    );

                    return;
                }


                const ascendingEntries =
                    getSortedEntriesAscending();


                entries.forEach(function (entry) {
                    const item =
                        document.createElement('div');

                    item.className =
                        'weight-history-item';


                    const date =
                        document.createElement('span');

                    date.className =
                        'weight-history-date';

                    date.textContent =
                        formatReadableDate(entry.date);


                    const weight =
                        document.createElement('strong');

                    weight.className =
                        'weight-history-weight';

                    weight.textContent =
                        formatWeight(entry.weight);


                    const change =
                        document.createElement('span');

                    change.className =
                        'weight-history-change';

                    change.textContent =
                        getEntryChangeText(
                            entry,
                            ascendingEntries
                        );


                    const deleteButton =
                        document.createElement('button');

                    deleteButton.type =
                        'button';

                    deleteButton.className =
                        'delete-weight-entry-button';

                    deleteButton.textContent =
                        'Delete';

                    deleteButton.addEventListener(
                        'click',
                        function () {
                            deleteWeightEntry(
                                entry.id
                            );
                        }
                    );


                    item.appendChild(date);
                    item.appendChild(weight);
                    item.appendChild(change);
                    item.appendChild(deleteButton);

                    historyList.appendChild(item);
                });
            }


            function getEntryChangeText(
                entry,
                ascendingEntries
            ) {
                const entryIndex =
                    ascendingEntries.findIndex(
                        function (candidate) {
                            return candidate.id === entry.id;
                        }
                    );


                if (entryIndex <= 0) {
                    return 'First entry';
                }


                const previousEntry =
                    ascendingEntries[
                        entryIndex - 1
                    ];

                const difference =
                    Math.round(
                        (
                            entry.weight
                            - previousEntry.weight
                        ) * 10
                    ) / 10;


                if (difference === 0) {
                    return 'No change';
                }


                if (difference > 0) {
                    return `Up ${difference.toFixed(1)} lb`;
                }


                return `Down ${Math.abs(difference).toFixed(1)} lb`;
            }


            function resetWeightProgress() {

            const confirmed = confirm(
                'Reset all weight progress? This cannot be undone.'
            );

            if (!confirmed) {
                return;
            }

            localStorage.removeItem(storageKey);

            weightData = getEmptyWeightData();

            goalSetup.hidden = false;
            weightDashboard.hidden = true;

            startingWeightInput.value = '';
            goalWeightInput.value = '';
            currentWeightInput.value = '';

            showGoalMessage('');
            showEntryMessage('');

            entryDateInput.value = getTodayKey();

            const summaryCurrentWeight =
                document.querySelector('#summary-current-weight');

            const summaryWeightChange =
                document.querySelector('#summary-weight-change');

            if (summaryCurrentWeight) {
                summaryCurrentWeight.textContent = '--';
            }

            if (summaryWeightChange) {
                summaryWeightChange.textContent = '--';
            }
        }
    /* ==================================================
       Events
    ================================================== */

            saveGoalsButton.addEventListener(
                'click',
                saveGoals
            );


            editGoalsButton.addEventListener(
                'click',
                editGoals
            );


            saveEntryButton.addEventListener(
                'click',
                saveWeightEntry
            );


            startingWeightInput.addEventListener(
                'keydown',
                function (event) {
                    if (event.key === 'Enter') {
                        saveGoals();
                    }
                }
            );


            goalWeightInput.addEventListener(
                'keydown',
                function (event) {
                    if (event.key === 'Enter') {
                        saveGoals();
                    }
                }
            );


            currentWeightInput.addEventListener(
                'keydown',
                function (event) {
                    if (event.key === 'Enter') {
                        saveWeightEntry();
                    }
                }
            );

            if (resetWeightButton) {

                resetWeightButton.addEventListener(
                    'click',
                    resetWeightProgress
                );

            }
    /* ==================================================
       Initialize
    ================================================== */

            entryDateInput.value =
                getTodayKey();

            entryDateInput.max =
                getTodayKey();


            if (hasWeightGoals()) {
                startingWeightInput.value =
                    weightData.startingWeight;

                goalWeightInput.value =
                    weightData.goalWeight;

                goalSetup.hidden = true;
                weightDashboard.hidden = false;

                renderWeightTracker();

            } else {
                goalSetup.hidden = false;
                weightDashboard.hidden = true;
            }
});