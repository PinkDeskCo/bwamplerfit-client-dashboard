'use strict';

const TOTAL_CHALLENGE_ACTIVITIES = 52;

const participantTableBody =
  document.getElementById(
    'participant-table-body'
  );

const participantCardList =
  document.getElementById(
    'participant-card-list'
  );

const summaryParticipants =
  document.getElementById(
    'summary-participants'
  );

const summaryStarted =
  document.getElementById(
    'summary-started'
  );

const summaryAverageProgress =
  document.getElementById(
    'summary-average-progress'
  );

const summaryCompleted =
  document.getElementById(
    'summary-completed'
  );

const summaryNotStarted =
  document.getElementById(
    'summary-not-started'
  );

const participantSearch =
  document.getElementById(
    'participant-search'
  );

const participantStatusFilter =
  document.getElementById(
    'participant-status-filter'
  );

const adminLogoutButton =
  document.getElementById(
    'admin-logout-button'
  );

let allParticipants = [];

/* ==================================================
   AUTH
================================================== */

async function requireAdminAccess() {
  const {
    data: { session },
    error
  } =
    await supabaseClient.auth.getSession();

  if (
    error ||
    !session?.user
  ) {
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
   PROGRESS CALCULATIONS
================================================== */

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

  Object.values(
    progress
  ).forEach((day) => {
    const tasks =
      day?.tasks;

    if (
      !tasks ||
      typeof tasks !== 'object'
    ) {
      return;
    }

    Object.values(
      tasks
    ).forEach((value) => {
      if (value === true) {
        completed += 1;
      }
    });
  });

  return completed;
}

function getProgressPercent(
  completedActivities
) {
  return Math.round(
    (
      completedActivities /
      TOTAL_CHALLENGE_ACTIVITIES
    ) *
      100
  );
}

function getParticipantStatus(
  completedActivities
) {
  if (
    completedActivities === 0
  ) {
    return 'not-started';
  }

  if (
    completedActivities >=
    TOTAL_CHALLENGE_ACTIVITIES
  ) {
    return 'completed';
  }

  return 'in-progress';
}

function getStatusLabel(
  status
) {
  const labels = {
    'not-started':
      'Not Started',

    'in-progress':
      'In Progress',

    completed:
      'Completed'
  };

  return (
    labels[status] ||
    status
  );
}

/* ==================================================
   DATE FORMATTING
================================================== */

function formatDate(
  value
) {
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

/* ==================================================
   LOAD DATA
================================================== */

async function loadParticipants() {
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
      .order(
        'created_at',
        {
          ascending: false
        }
      );

  if (error) {
    console.error(
      'Unable to load participants:',
      error
    );

    participantTableBody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="admin-table__empty"
        >
          Unable to load participants.
        </td>
      </tr>
    `;

    if (
      participantCardList
    ) {
      participantCardList.innerHTML = `
        <p class="admin-participant-cards__empty">
          Unable to load participants.
        </p>
      `;
    }

    return;
  }

  allParticipants =
    data.map(
      (participant) => {
        const progressRecord =
          participant
            .challenge_progress?.[0] ||
          null;

        const completedActivities =
          countCompletedActivities(
            progressRecord?.progress
          );

        const progressPercent =
          getProgressPercent(
            completedActivities
          );

        const status =
          getParticipantStatus(
            completedActivities
          );

        return {
          id:
            participant.id,

          email:
            participant.email,

          joinedAt:
            participant.created_at,

          completedActivities,

          progressPercent,

          status,

          lastActivity:
            completedActivities > 0
              ? progressRecord
                  ?.updated_at ||
                null
              : null,

          completedAt:
            progressRecord
              ?.completed_at ||
            null,

          certificateName:
            progressRecord
              ?.certificate_name ||
            null
        };
      }
    );

  renderSummary();

  renderParticipants(
    allParticipants
  );
}

/* ==================================================
   SUMMARY
================================================== */

function renderSummary() {
  const total =
    allParticipants.length;

  const started =
    allParticipants.filter(
      (participant) =>
        participant
          .completedActivities >
        0
    ).length;

  const completed =
    allParticipants.filter(
      (participant) =>
        participant.status ===
        'completed'
    ).length;

  const notStarted =
    allParticipants.filter(
      (participant) =>
        participant.status ===
        'not-started'
    ).length;

  const totalProgress =
    allParticipants.reduce(
      (
        sum,
        participant
      ) =>
        sum +
        participant
          .progressPercent,

      0
    );

  const averageProgress =
    total > 0
      ? Math.round(
          totalProgress /
            total
        )
      : 0;

  summaryParticipants.textContent =
    total;

  summaryStarted.textContent =
    started;

  summaryAverageProgress.textContent =
    `${averageProgress}%`;

  summaryCompleted.textContent =
    completed;

  summaryNotStarted.textContent =
    notStarted;
}

/* ==================================================
   TABLE
================================================== */

function renderParticipants(
  participants
) {
  if (
    !participants.length
  ) {
    participantTableBody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="admin-table__empty"
        >
          No participants found.
        </td>
      </tr>
    `;

    renderParticipantCards(
      []
    );

    return;
  }

  participantTableBody.innerHTML =
    participants
      .map(
        (participant) => {
          return `
            <tr>

              <td>
                ${participant.email}
              </td>

              <td>
                ${formatDate(
                  participant.joinedAt
                )}
              </td>

              <td>

                <div class="admin-table-progress">

                  <div class="admin-table-progress__header">

                    <span>
                      ${participant.progressPercent}%
                    </span>

                  </div>

                  <div class="admin-table-progress__track">

                    <div
                      class="admin-table-progress__fill"
                      style="width: ${participant.progressPercent}%"
                    ></div>

                  </div>

                </div>

              </td>

              <td>
                ${participant.completedActivities}
                /
                ${TOTAL_CHALLENGE_ACTIVITIES}
              </td>

              <td>
                ${
                  participant.lastActivity
                    ? formatDate(
                        participant.lastActivity
                      )
                    : 'Not started'
                }
              </td>

              <td>

                <span
                  class="admin-status-badge admin-status-badge--${participant.status}"
                >
                  ${
                    participant.status ===
                    'completed'
                      ? '✓ '
                      : ''
                  }

                  ${getStatusLabel(
                    participant.status
                  )}
                </span>

              </td>

              <td>
                <a
                  href="./participant.html?id=${participant.id}"
                >
                  View
                </a>
              </td>

            </tr>
          `;
        }
      )
      .join('');

  renderParticipantCards(
    participants
  );
}

/* ==================================================
   MOBILE PARTICIPANT CARDS
================================================== */

function renderParticipantCards(
  participants
) {
  if (
    !participantCardList
  ) {
    return;
  }

  if (
    !participants.length
  ) {
    participantCardList.innerHTML = `
      <p class="admin-participant-cards__empty">
        No participants found.
      </p>
    `;

    return;
  }

  participantCardList.innerHTML =
    participants
      .map(
        (participant) => {
          return `
            <article class="admin-participant-card">

              <div class="admin-participant-card__top">

                <p class="admin-participant-card__email">
                  ${participant.email}
                </p>

                <span
                  class="admin-status-badge admin-status-badge--${participant.status}"
                >
                  ${
                    participant.status ===
                    'completed'
                      ? '✓ '
                      : ''
                  }

                  ${getStatusLabel(
                    participant.status
                  )}
                </span>

              </div>

              <div class="admin-participant-card__progress">

                <div class="admin-participant-card__progress-header">

                  <strong>
                    ${participant.progressPercent}%
                  </strong>

                  <span>
                    ${participant.completedActivities}
                    /
                    ${TOTAL_CHALLENGE_ACTIVITIES}
                    activities
                  </span>

                </div>

                <div class="admin-table-progress__track">

                  <div
                    class="admin-table-progress__fill"
                    style="width: ${participant.progressPercent}%"
                  ></div>

                </div>

              </div>

              <div class="admin-participant-card__meta">

                <div>

                  <span>
                    Joined
                  </span>

                  <strong>
                    ${formatDate(
                      participant.joinedAt
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    Last Activity
                  </span>

                  <strong>
                    ${
                      participant.lastActivity
                        ? formatDate(
                            participant.lastActivity
                          )
                        : 'Not started'
                    }
                  </strong>

                </div>

              </div>

              <a
                href="./participant.html?id=${participant.id}"
                class="admin-participant-card__link"
              >
                View Participant →
              </a>

            </article>
          `;
        }
      )
      .join('');
}

/* ==================================================
   FILTERS
================================================== */

function applyFilters() {
  const searchValue =
    participantSearch.value
      .trim()
      .toLowerCase();

  const statusValue =
    participantStatusFilter.value;

  const filtered =
    allParticipants.filter(
      (participant) => {
        const matchesSearch =
          participant.email
            .toLowerCase()
            .includes(
              searchValue
            );

        const matchesStatus =
          statusValue ===
            'all' ||
          participant.status ===
            statusValue;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

  renderParticipants(
    filtered
  );
}

participantSearch?.addEventListener(
  'input',
  applyFilters
);

participantStatusFilter?.addEventListener(
  'change',
  applyFilters
);

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

async function initAdminDashboard() {
  const hasAdminAccess =
    await requireAdminAccess();

  if (
    !hasAdminAccess
  ) {
    return;
  }

  await loadParticipants();
}

initAdminDashboard();