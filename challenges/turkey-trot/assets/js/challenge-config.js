const challengeConfig = {
    key: "turkey-trot-2026-11",

    name: "Turkey Trot November",

    eyebrow: "B. Wampler Fit Challenge",

    title: "Turkey Trot",

    subtitle:
        "Move your body. Give thanks. November 1–30.",

    totalDays: 30,
    startDate: "2026-11-01",

    dailyStepGoal: 10000,
    monthlyStepGoal: 300000,

    miniChallenges: [
        {
            title: "The TURKEY Challenge",

            instructions:
                "Set a timer for 10 minutes. Complete as many " +
                "rounds as possible with controlled form, " +
                "resting as needed.",

            exercises: [
                { letter: "T", name: "Tricep dips", amount: "10 reps" },
                { letter: "U", name: "Underhand row", amount: "10 reps" },
                { letter: "R", name: "Reverse lunge", amount: "6 per side" },
                { letter: "K", name: "Knee-to-elbow crunch", amount: "8 per side" },
                { letter: "E", name: "Elbow plank", amount: "30 seconds" },
                { letter: "Y", name: "Y-raise", amount: "8 reps" }
            ]
        },

        {
            title: "No-Repeat THANKSGIVING",

            instructions:
                "Set a timer for 12 minutes. Each exercise gets " +
                "one minute. Complete the listed reps, then rest " +
                "for the remainder of that minute. If you have " +
                "not finished when the minute ends, stop that " +
                "exercise and move to the next. Complete the " +
                "list once.",

            exercises: [
                { letter: "T", name: "Tricep dips", amount: "10 reps" },
                { letter: "H", name: "Hip thrusts", amount: "10 reps" },
                {
                    letter: "A",
                    name: "Alternating single-arm rotational press",
                    amount: "8 per side"
                },
                { letter: "N", name: "Narrow squat", amount: "10 reps" },
                { letter: "K", name: "Kneeling woodchop", amount: "6 per side" },
                { letter: "S", name: "Shoulder shrug", amount: "10 reps" },
                { letter: "G", name: "Gorilla row", amount: "10 reps" },
                { letter: "I", name: "Incline push-up", amount: "10 reps" },
                {
                    letter: "V",
                    name: "V-sit hold, knees bent",
                    amount: "30 seconds"
                },
                { letter: "I", name: "Inchworms", amount: "8 reps" },
                {
                    letter: "N",
                    name: "Narrow-grip chest press",
                    amount: "10 reps"
                },
                { letter: "G", name: "Goblet sumo squat", amount: "10 reps" }
            ]
        },

        {
            title: "The PUMPKIN Challenge",

            instructions:
                "Set a timer for 15 minutes. Complete as many " +
                "rounds as possible.",

            exercises: [
                { letter: "P", name: "Plank", amount: "30 seconds" },
                { letter: "U", name: "Underhand row", amount: "10 reps" },
                { letter: "M", name: "Mountain climbers", amount: "10 reps" },
                { letter: "P", name: "Pallof press", amount: "10 reps" },
                { letter: "K", name: "Kneeling press", amount: "10 per side" },
                { letter: "I", name: "Incline push-ups", amount: "10 reps" },
                { letter: "N", name: "Neutral-grip curl", amount: "10 reps" }
            ]
        },

        {
            title: "The NOVEMBER Challenge",

            instructions:
                "Set a timer for 16 minutes. Each exercise gets " +
                "one minute. Complete the listed reps, then rest " +
                "for the remainder of that minute. If you have " +
                "not finished when the minute ends, stop that " +
                "exercise and move to the next. Complete two " +
                "rounds of the eight exercises.",

            exercises: [
                { letter: "N", name: "Narrow squat", amount: "10 reps" },
                { letter: "O", name: "Oblique crunch", amount: "8 per side" },
                { letter: "V", name: "Vertical row", amount: "10 reps" },
                { letter: "E", name: "External rotation", amount: "8 per side" },
                { letter: "M", name: "Modified burpees", amount: "8 reps" },
                { letter: "B", name: "Bicep curl", amount: "10 reps" },
                { letter: "E", name: "Eccentric calf raise", amount: "10 reps" },
                { letter: "R", name: "Reverse lunge", amount: "8 per side" }
            ]
        }
    ],

    featherCollections: [
        { name: "Autumn Gold", color: "#D5A32A" },
        { name: "Harvest Copper", color: "#B85D32" },
        { name: "Woodland", color: "#69764B" },
        { name: "Cranberry", color: "#913E51" },
        { name: "Thanksgiving", color: "#C5A56A" }
    ],

    branding: {
        primaryColor: "#382416",
        accentColor: "#BD572B",
        backgroundColor: "#FBF3E6",
        surfaceColor: "#FFFCF6",
        mutedColor: "#756451",

        logo: "./assets/images/bwamplerfit-logo.png",

    }
};