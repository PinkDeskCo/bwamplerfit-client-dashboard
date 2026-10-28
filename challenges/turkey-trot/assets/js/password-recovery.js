"use strict";

const loginPasswordToggle =
    document.getElementById("challenge-show-password");

const loginPasswordInput =
    document.getElementById("challenge-auth-password");

if (loginPasswordToggle && loginPasswordInput) {
    loginPasswordToggle.addEventListener("change", () => {
        loginPasswordInput.type =
            loginPasswordToggle.checked ? "text" : "password";
    });
}

(() => {
    const forgotButton = document.getElementById(
        "challenge-forgot-password"
    );

    const resetForm = document.getElementById(
        "reset-password-form"
    );

    /* ==============================================
       Request a password-reset email
    ============================================== */

    if (forgotButton) {
        forgotButton.addEventListener("click", () => {
            const dialog = document.createElement("dialog");

            dialog.className = "trot-dialog";

            dialog.innerHTML = `
                <form id="recovery-email-form">
                    <h2>Forgot your password?</h2>

                    <p>
                        Enter your account email and we’ll
                        send you a password-reset link.
                    </p>

                    <label
                        class="challenge-auth__label"
                        for="recovery-email"
                    >
                        Email address
                    </label>

                    <input
                        class="challenge-auth__input"
                        id="recovery-email"
                        type="email"
                        autocomplete="email"
                        required
                    >

                    <button
                        class="challenge-auth__button"
                        type="submit"
                    >
                        Send reset link
                    </button>

                    <p role="status"></p>

                    <button
                        type="button"
                        class="trot-dialog__close"
                    >
                        Close
                    </button>
                </form>
            `;

            document.body.appendChild(dialog);

            const form = dialog.querySelector("form");
            const input = dialog.querySelector("input");
            const submit = dialog.querySelector(
                'button[type="submit"]'
            );
            const message = dialog.querySelector(
                '[role="status"]'
            );
            const close = dialog.querySelector(
                'button[type="button"]'
            );

            const loginEmail = document.getElementById(
                "challenge-auth-email"
            );

            input.value = loginEmail?.value || "";

            close.addEventListener("click", () => {
                dialog.close();
            });

            dialog.addEventListener("close", () => {
                dialog.remove();
                forgotButton.focus();
            });

            form.addEventListener("submit", async (event) => {
                event.preventDefault();

                submit.disabled = true;
                message.textContent = "Sending reset link…";

                const email = input.value
                    .trim()
                    .toLowerCase();

                const redirectTo = new URL(
                    "./reset-password.html",
                    window.location.href
                ).href;

                try {
                    const { error } =
                        await supabaseClient.auth
                            .resetPasswordForEmail(email, {
                                redirectTo
                            });

                    if (error) {
                        throw error;
                    }

                    message.textContent =
                        "If an account exists for that email, " +
                        "you’ll receive a reset link. " +
                        "Check your inbox and spam folder.";

                    input.value = "";
                    submit.textContent = "Request submitted";
                } catch (error) {
                    message.textContent =
                        error.status === 429
                            ? "Too many requests. Please wait before trying again."
                            : error.message || "We couldn’t send the reset link. Please try again."

                    submit.disabled = false;
                }
            });

            dialog.showModal();
            input.focus();
        });
    }

    /* ==============================================
       Set the new password on the dedicated page
    ============================================== */

        if (!resetForm) {
            return;
        }

        const status = document.getElementById("reset-status");
        const password = document.getElementById(
            "reset-password"
        );
        const confirmation = document.getElementById(
            "reset-password-confirm"
        );
        const submit = document.getElementById(
            "reset-password-submit"
        );


        const showPasswords = document.getElementById(
        "reset-show-passwords"
    );

    const matchMessage = document.getElementById(
        "reset-password-match"
    );

    showPasswords.addEventListener("change", () => {
        const type = showPasswords.checked ? "text" : "password";

        password.type = type;
        confirmation.type = type;
    });

    function checkPasswordMatch() {
        const hasConfirmation = confirmation.value.length > 0;

        const mismatch =
            hasConfirmation &&
            password.value !== confirmation.value;

        confirmation.setCustomValidity(
            mismatch ? "Passwords do not match." : ""
        );

        confirmation.setAttribute(
            "aria-invalid",
            String(mismatch)
        );

        if (!hasConfirmation) {
            matchMessage.textContent = "";
            return;
        }

        matchMessage.textContent = mismatch
            ? "Passwords do not match."
            : "Passwords match.";

        matchMessage.style.color = mismatch
            ? "#b42318"
            : "#27633d";
    }

    password.addEventListener("input", checkPasswordMatch);
    confirmation.addEventListener("input", checkPasswordMatch);

    let sessionReady = false;

    const hashParameters = new URLSearchParams(
        window.location.hash.slice(1)
    );

    const queryParameters = new URLSearchParams(
        window.location.search
    );

    const linkHasError =
        hashParameters.has("error") ||
        hashParameters.has("error_code") ||
        queryParameters.has("error") ||
        queryParameters.has("error_code");

    function showInvalidLink() {
        sessionReady = false;
        resetForm.hidden = true;

        status.textContent =
            "This reset link is invalid or has expired. " +
            "Return to sign in and request a new link.";
    }

    async function initializeResetPage() {
        if (linkHasError) {
            showInvalidLink();
            return;
        }

        try {
            /*
             * getSession waits for the Supabase client to
             * process the recovery information in the URL.
             */
            const { data, error } =
                await supabaseClient.auth.getSession();

            if (error || !data.session) {
                showInvalidLink();
                return;
            }

            const {
                data: userData,
                error: userError
            } = await supabaseClient.auth.getUser();

            if (userError || !userData.user) {
                showInvalidLink();
                return;
            }

            sessionReady = true;
            resetForm.hidden = false;

            status.textContent =
                "Enter and confirm your new password.";

            password.focus();
        } catch {
            showInvalidLink();
        }
    }

    resetForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!sessionReady) {
            showInvalidLink();
            return;
        }

        if (password.value !== confirmation.value) {
            status.textContent = "Passwords do not match.";
            confirmation.focus();
            return;
        }

        if (password.value.length < 12) {
            status.textContent =
                "Use a password with at least 12 characters.";
            return;
        }

        submit.disabled = true;
        status.textContent = "Saving your new password…";

        try {
            const { error } =
                await supabaseClient.auth.updateUser({
                    password: password.value
                });

            if (error) {
                throw error;
            }

            resetForm.reset();
            resetForm.hidden = true;
            sessionReady = false;

            /*
             * Sign out on this browser so returning to the
             * challenge allows a fresh password sign-in.
             */
            const { error: signOutError } =
                await supabaseClient.auth.signOut({
                    scope: "local"
                });

            status.textContent = signOutError
                ? "Your password was saved, but this browser could not sign out. Your current session may remain active."
                : "Your password was saved. Return to sign in with your new password.";

            history.replaceState(
                null,
                "",
                window.location.pathname
            );
        } catch (error) {
            status.textContent =
                error.message ||
                "Your password could not be saved. Please try again.";

            submit.disabled = false;
        }
    });

    initializeResetPage();
})();