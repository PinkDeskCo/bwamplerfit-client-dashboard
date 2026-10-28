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

        let weightData = getEmptyWeightData();
        let weightUserId = null;
        let weightVersion = 0;
        let weightReady = false;
        let weightBusy = false;

        function getEmptyWeightData() {
            return {
                startingWeight: null,
                goalWeight: null,
                entries: []
            };
        }

        function updateWeightControls() {
            const disabled = !weightReady || weightBusy;

            saveGoalsButton.disabled = disabled;
            saveEntryButton.disabled = disabled;
            editGoalsButton.disabled = disabled;
            resetWeightButton.disabled = disabled;
        }

        function displayWeightData() {
            startingWeightInput.value = weightData.startingWeight ?? "";
            goalWeightInput.value = weightData.goalWeight ?? "";

            goalSetup.hidden = !weightReady || hasWeightGoals();
            weightDashboard.hidden = !weightReady || !hasWeightGoals();

            renderWeightTracker();
            updateWeightControls();
        }

        async function loadAccountWeight(userId) {
            const version = ++weightVersion;

            weightUserId = userId || null;
            weightReady = false;
            weightData = getEmptyWeightData();

            currentWeightInput.value = "";
            entryDateInput.value = getTodayKey();
            showEntryMessage("");
            displayWeightData();

            if (!userId) {
                showGoalMessage("Sign in to use your weight tracker.");
                return;
            }

            showGoalMessage("Loading your weight tracker…");

            try {
                const { data: goals, error: goalsError } =
                    await supabaseClient
                        .from("member_weight_goals")
                        .select("starting_weight, goal_weight")
                        .eq("user_id", userId)
                        .maybeSingle();

                if (version !== weightVersion) return;
                if (goalsError) throw goalsError;

                const entries = [];
                let offset = 0;
                const pageSize = 500;

                while (true) {
                    const { data, error } = await supabaseClient
                        .from("member_weight_entries")
                        .select("entry_date, weight")
                        .eq("user_id", userId)
                        .order("entry_date")
                        .range(offset, offset + pageSize - 1);

                    if (version !== weightVersion) return;
                    if (error) throw error;

                    for (const row of data || []) {
                        entries.push({
                            id: row.entry_date,
                            date: row.entry_date,
                            weight: Number(row.weight)
                        });
                    }

                    if ((data || []).length < pageSize) break;
                    offset += pageSize;
                }

                weightData = {
                    startingWeight: goals
                        ? Number(goals.starting_weight)
                        : null,
                    goalWeight: goals
                        ? Number(goals.goal_weight)
                        : null,
                    entries
                };

                weightReady = true;
                displayWeightData();
                showGoalMessage("");
            } catch (error) {
                if (version !== weightVersion) return;

                console.error("Weight tracker load failed:", error);
                showGoalMessage(
                    "Your weight tracker could not be loaded. Refresh to retry."
                );
            } finally {
                if (version === weightVersion) {
                    updateWeightControls();
                }
            }
        }

        async function runWeightChange(
            operation,
            applyChange,
            messageElement,
            successMessage
        ) {
            if (!weightReady || weightBusy || !weightUserId) {
                messageElement.textContent = weightBusy
                    ? "Please wait for the current change to finish."
                    : "Your weight tracker must finish loading first.";
                return;
            }

            const userId = weightUserId;
            const version = weightVersion;

            weightBusy = true;
            updateWeightControls();
            messageElement.textContent = "Saving…";

            try {
                await operation(userId);

                if (version !== weightVersion) return;

                applyChange();
                displayWeightData();
                messageElement.textContent = successMessage;
            } catch (error) {
                if (version !== weightVersion) return;

                console.error("Weight change failed:", error);

                // Reload in case a reset completed only part of its work.
                await loadAccountWeight(userId);

                if (weightUserId === userId) {
                    goalMessage.textContent =
                        "The change could not be completed. " +
                        "Review the reloaded records before trying again.";
                }
            } finally {
                weightBusy = false;
                updateWeightControls();
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

          async function saveGoals(event) {
            event?.preventDefault();

            const startingWeight =
                sanitizeWeight(startingWeightInput.value);

            const goalWeight =
                sanitizeWeight(goalWeightInput.value);

            if (
                startingWeight === null ||
                goalWeight === null ||
                startingWeight > 99999.9 ||
                goalWeight > 99999.9
            ) {
                showGoalMessage("Enter valid starting and goal weights.");
                return;
            }

            if (startingWeight === goalWeight) {
                showGoalMessage(
                    "Starting weight and goal weight must be different."
                );
                return;
            }

            await runWeightChange(
                async userId => {
                    const { error } = await supabaseClient
                        .from("member_weight_goals")
                        .upsert({
                            user_id: userId,
                            starting_weight: startingWeight,
                            goal_weight: goalWeight
                        }, {
                            onConflict: "user_id"
                        });

                    if (error) throw error;
                },

                () => {
                    weightData.startingWeight = startingWeight;
                    weightData.goalWeight = goalWeight;
                },

                goalMessage,
                "Weight goals saved to your account."
            );
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

        async function saveWeightEntry(event) {
            event?.preventDefault();

            if (!hasWeightGoals()) {
                showEntryMessage("Save your weight goals first.");
                return;
            }

            const date = entryDateInput.value;
            const parsedDate = parseDateKey(date);

            const validDate =
                /^\d{4}-\d{2}-\d{2}$/.test(date) &&
                !Number.isNaN(parsedDate.getTime()) &&
                parsedDate.getFullYear() === Number(date.slice(0, 4)) &&
                parsedDate.getMonth() + 1 === Number(date.slice(5, 7)) &&
                parsedDate.getDate() === Number(date.slice(8, 10));

            if (!validDate || date > getTodayKey()) {
                showEntryMessage("Choose a valid date up to today.");
                return;
            }

            const weight = sanitizeWeight(currentWeightInput.value);

            if (weight === null || weight > 99999.9) {
                showEntryMessage("Enter a valid current weight.");
                return;
            }

            await runWeightChange(
                async userId => {
                    const { error } = await supabaseClient
                        .from("member_weight_entries")
                        .upsert({
                            user_id: userId,
                            entry_date: date,
                            weight
                        }, {
                            onConflict: "user_id,entry_date"
                        });

                    if (error) throw error;
                },

                () => {
                    weightData.entries = weightData.entries.filter(
                        entry => entry.date !== date
                    );

                    weightData.entries.push({
                        id: date,
                        date,
                        weight
                    });

                    currentWeightInput.value = "";
                },

                entryMessage,
                "Weight entry saved to your account."
            );
        }

        async function deleteWeightEntry(entryId) {
            await runWeightChange(
                async userId => {
                    const { error } = await supabaseClient
                        .from("member_weight_entries")
                        .delete()
                        .eq("user_id", userId)
                        .eq("entry_date", entryId);

                    if (error) throw error;
                },

                () => {
                    weightData.entries = weightData.entries.filter(
                        entry => entry.id !== entryId
                    );
                },

                entryMessage,
                "Weight entry deleted."
            );
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

                    const summaryCurrentWeight =
                        document.getElementById(
                            'summary-current-weight'
                        );

                    const summaryWeightChange =
                        document.getElementById(
                            'summary-weight-change'
                        );

                    if (summaryCurrentWeight) {
                        summaryCurrentWeight.textContent =
                            '--';
                    }

                    if (summaryWeightChange) {
                        summaryWeightChange.textContent =
                            '--';
                    }

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


            async function resetWeightProgress() {
                if (!weightReady || weightBusy) return;

                const confirmed = confirm(
                    "Delete all weight entries and weight goals from your account? " +
                    "This cannot be undone. Workout activity and monthly " +
                    "challenge progress will remain."
                );

                if (!confirmed) return;

                await runWeightChange(
                    async userId => {
                        const entriesResult = await supabaseClient
                            .from("member_weight_entries")
                            .delete()
                            .eq("user_id", userId);

                        if (entriesResult.error) throw entriesResult.error;

                        const goalsResult = await supabaseClient
                            .from("member_weight_goals")
                            .delete()
                            .eq("user_id", userId);

                        if (goalsResult.error) throw goalsResult.error;
                    },

                    () => {
                        weightData = getEmptyWeightData();
                        currentWeightInput.value = "";
                        entryDateInput.value = getTodayKey();
                        showEntryMessage("");
                    },

                    goalMessage,
                    "Weight entries and goals have been reset."
                );
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

    entryDateInput.value = getTodayKey();
    entryDateInput.max = getTodayKey();

    displayWeightData();

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") {
            loadAccountWeight(null);
            return;
        }

        if (session?.user && session.user.id !== weightUserId) {
            const version = weightVersion;

            setTimeout(() => {
                if (
                    version === weightVersion &&
                    session.user.id !== weightUserId
                ) {
                    loadAccountWeight(session.user.id);
                }
            }, 0);
        }
    });

    const initialWeightVersion = weightVersion;

    supabaseClient.auth.getUser()
        .then(({ data, error }) => {
            if (weightVersion !== initialWeightVersion) return;
            if (error) throw error;

            return loadAccountWeight(data.user?.id || null);
        })
        .catch(error => {
            if (weightVersion !== initialWeightVersion) return;

            console.error("Weight session check failed:", error);
            showGoalMessage(
                "We could not check your account. Refresh to retry."
            );
        });

});