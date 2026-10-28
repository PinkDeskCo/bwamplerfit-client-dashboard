'use strict';

const TOTAL_CHALLENGE_ACTIVITIES = 52;

const participantEmail =
  document.getElementById('participant-email');

const participantJoined =
  document.getElementById('participant-joined');

const participantStarted =
  document.getElementById('participant-started');

const participantLastActivity =
  document.getElementById(
    'participant-last-activity'
  );

const participantStatus =
  document.getElementById('participant-status');

const participantProgressPercent =
  document.getElementById(
    'participant-progress-percent'
  );

const participantActivities =
  document.getElementById(
    'participant-activities'
  );

const participantProgressBar =
  document.getElementById(
    'participant-progress-bar'
  );

const adminChallengeHeatmap =
  document.getElementById(
    'admin-challenge-heatmap'
  );

const participantCompleted =
  document.getElementById(
    'participant-completed'
  );

const participantCompletionDate =
  document.getElementById(
    'participant-completion-date'
  );

const participantCertificateName =
  document.getElementById(
    'participant-certificate-name'
  );

const participantCertificateStatus =
  document.getElementById(
    'participant-certificate-status'
  );

const adminLogoutButton =
  document.getElementById(
    'admin-logout-button'
  );

/* ==================================================
   AUTH
================================================== */

async function requireAdminAccess() {
  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error || !session?.user) {
    window.location.href =
      './login.html';

    return false;
  }

  const {
    data: adminRecord,
    error: adminError
  } =
    await supabaseClient
      .from('admin_users')
      .select('id')
      .eq(
        'user_id',
        session.user.id
      )
      .maybeSingle();

  if (
    adminError ||
    !adminRecord
  ) {
    await supabaseClient.auth.signOut();

    window.location.href =
      './login.html';

    return false;
  }

  return true;
}

/* ==================================================
   HELPERS
================================================== */

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }
  ).format(
    new Date(value)
  );
}

function countCompletedActivities(
  progress
) {
  if (
    !progress ||
    typeof progress !== 'object'
  ) {
    return 0;
  }

  let completed = 0;

  Object.values(progress).forEach(
    (day) => {
      const tasks = day?.tasks;

      if (
        !tasks ||
        typeof tasks !== 'object'
      ) {
        return;
      }

      Object.values(tasks).forEach(
        (value) => {
          if (value === true) {
            completed += 1;
          }
        }
      );
    }
  );

  return completed;
}

function getProgressPercent(
  completedActivities
) {
  return Math.round(
    (
      completedActivities /
      TOTAL_CHALLENGE_ACTIVITIES
    ) * 100
  );
}

function getStatus(
  completedActivities
) {
  if (completedActivities === 0) {
    return 'Not Started';
  }

  if (
    completedActivities >=
    TOTAL_CHALLENGE_ACTIVITIES
  ) {
    return 'Completed';
  }

  return 'In Progress';
}

/* ==================================================
   HEAT MAP
================================================== */

function renderHeatmap(progress) {
  adminChallengeHeatmap.innerHTML = '';

  for (
    let day = 1;
    day <= 30;
    day++
  ) {
    const dayData =
      progress?.[day] || {
        tasks: {}
      };

    const tasks =
      dayData.tasks || {};

    const taskValues =
      Object.values(tasks);

    const dayElement =
      document.createElement('div');

    dayElement.className =
      'admin-heatmap-day';

    dayElement.innerHTML = `
      <span class="admin-heatmap-day__number">
        ${day}
      </span>
    `;

    if (taskValues.length === 0) {
      dayElement.classList.add(
        'is-rest'
      );
    } else {
      const completedCount =
        taskValues.filter(
          (value) => value === true
        ).length;

      if (
        completedCount ===
        taskValues.length
      ) {
        dayElement.classList.add(
          'is-completed'
        );
      } else if (
        completedCount > 0
      ) {
        dayElement.classList.add(
          'is-partial'
        );
      }
    }

    adminChallengeHeatmap.appendChild(
      dayElement
    );
  }
}

/* ==================================================
   LOAD PARTICIPANT
================================================== */

async function loadParticipant() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const participantId =
    params.get('id');

  if (!participantId) {
    participantEmail.textContent =
      'Participant not found';

    return;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        'challenge_participants'
      )
      .select(`
        id,
        email,
        created_at,
        challenge_progress (
          progress,
          started_at,
          completed_at,
          updated_at,
          certificate_name
        )
      `)
      .eq(
        'id',
        participantId
      )
      .maybeSingle();

  if (
    error ||
    !data
  ) {
    console.error(
      'Unable to load participant:',
      error
    );

    participantEmail.textContent =
      'Unable to load participant';

    return;
  }

  const progressRecord =
    data.challenge_progress?.[0] ||
    null;

  const progress =
    progressRecord?.progress || {};

  const completedActivities =
    countCompletedActivities(
      progress
    );

  const progressPercent =
    getProgressPercent(
      completedActivities
    );

  const status =
    getStatus(
      completedActivities
    );

  participantEmail.textContent =
    data.email;

  participantJoined.textContent =
    formatDate(
      data.created_at
    );

  participantStarted.textContent =
    completedActivities > 0
      ? formatDate(
          progressRecord?.started_at
        )
      : 'Not started';

  participantLastActivity.textContent =
    completedActivities > 0
      ? formatDate(
          progressRecord?.updated_at
        )
      : 'Not started';

  participantStatus.textContent =
    status;

  participantProgressPercent.textContent =
    `${progressPercent}%`;

  participantActivities.textContent =
    `${completedActivities} / ${TOTAL_CHALLENGE_ACTIVITIES} activities`;

  participantProgressBar.style.width =
    `${progressPercent}%`;

  const isCompleted =
    completedActivities >=
    TOTAL_CHALLENGE_ACTIVITIES;

  participantCompleted.textContent =
    isCompleted
      ? 'Yes'
      : 'No';

  participantCompletionDate.textContent =
    isCompleted
      ? formatDate(
          progressRecord?.completed_at
        )
      : '—';

  participantCertificateName.textContent =
    progressRecord?.certificate_name ||
    '—';

  participantCertificateStatus.textContent =
    isCompleted
      ? 'Earned'
      : 'Not Yet Earned';

  renderHeatmap(progress);
}

/* ==================================================
   LOGOUT
================================================== */

adminLogoutButton?.addEventListener(
  'click',
  async () => {
    await supabaseClient.auth.signOut();

    window.location.href =
      './login.html';
  }
);

/* ==================================================
   INIT
================================================== */

async function initParticipantDetail() {
  const hasAdminAccess =
    await requireAdminAccess();

  if (!hasAdminAccess) {
    return;
  }

  await loadParticipant();
}

initParticipantDetail();