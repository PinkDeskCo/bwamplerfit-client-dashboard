'use strict';

/* ==================================================
   Dashboard Hero
================================================== */

const dailyCoachNotes = [

    "You don't have to be perfect. You just have to show up.",

    "You are building a lifestyle, not chasing perfection.",

    "The strongest thing you can do today is begin.",

    "Small choices repeated consistently create lasting change.",

    "You don't have to start over. You only have to start today.",

    "Your progress still counts, even when it feels slow.",

    "Showing up for yourself is always worth celebrating.",

    "Today's effort is building tomorrow's strength.",

    "You are allowed to move at your own pace. Just keep moving.",

    "Consistency will carry you farther than perfection ever could.",

    "One workout may feel small, but it is part of something much bigger.",

    "Your body deserves patience, movement, and care.",

    "Every healthy choice is evidence that you are becoming stronger.",

    "Do what you can today. That is enough.",

    "You are not behind. You are building from where you are.",

    "The hardest part is often showing up. You have already done that.",

    "Progress begins with the decision to keep going.",

    "You do not need a perfect week to make meaningful progress.",

    "Strength grows every time you choose not to give up.",

    "Today is another opportunity to keep the promise you made to yourself.",

    "A difficult day does not erase the progress you have already made.",

    "Your journey does not need to look like anyone else's.",

    "Celebrate the effort before you measure the result.",

    "You are becoming stronger through every step, rep, and healthy choice.",

    "Keep choosing the woman you are becoming.",

    "You are capable of more than yesterday's doubts would have you believe.",

    "Rest when you need to, then continue when you are ready.",

    "The goal is not to punish your body. The goal is to care for it.",

    "You are creating habits that your future self will be grateful for.",

    "You do not have to feel motivated to take the next small step."

];


/* ==================================================
   Daily Note Selection
================================================== */

function getDayOfYear(date = new Date()) {

    const startOfYear = new Date(
        date.getFullYear(),
        0,
        0
    );

    const millisecondsPerDay =
        1000 * 60 * 60 * 24;

    const difference =
        date.getTime() -
        startOfYear.getTime();

    return Math.floor(
        difference / millisecondsPerDay
    );

}


function getDailyCoachNote() {

    if (!dailyCoachNotes.length) {
        return '';
    }

    const dayNumber = getDayOfYear();

    const noteIndex =
        dayNumber %
        dailyCoachNotes.length;

    return dailyCoachNotes[noteIndex];

}


/* ==================================================
   Display Daily Note
================================================== */

function displayDailyCoachNote() {

    const quoteElement =
        document.getElementById('daily-quote');

    if (!quoteElement) {
        return;
    }

    quoteElement.textContent =
        getDailyCoachNote();

}


/* ==================================================
   Initialize
================================================== */

function initializeDashboardHero() {
    displayDailyCoachNote();
}


if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        initializeDashboardHero
    );

} else {

    initializeDashboardHero();

}