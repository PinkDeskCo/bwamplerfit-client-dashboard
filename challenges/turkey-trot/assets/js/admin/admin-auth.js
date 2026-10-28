'use strict';

const adminLoginForm =
  document.getElementById('admin-login-form');

const adminLoginMessage =
  document.getElementById('admin-login-message');

async function verifyAdminAccess(userId) {
  const { data, error } = await supabaseClient
    .from('admin_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

if (adminLoginForm) {
  adminLoginForm.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      adminLoginMessage.textContent =
        'Signing in...';

      const email =
        document.getElementById(
          'admin-email'
        ).value.trim();

      const password =
        document.getElementById(
          'admin-password'
        ).value;

      try {
        const {
          data,
          error
        } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }

        const isAdmin =
          await verifyAdminAccess(
            data.user.id
          );

        if (!isAdmin) {
          await supabaseClient.auth.signOut();

          adminLoginMessage.textContent =
            'This account does not have admin access.';

          return;
        }

        window.location.href =
          './index.html';

      } catch (error) {
        console.error(
          'Admin sign-in failed:',
          error
        );

        adminLoginMessage.textContent =
          'Unable to sign in. Check your email and password.';
      }
    }
  );
}