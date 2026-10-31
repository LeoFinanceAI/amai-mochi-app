// Moved out of auth-callback.html so the Content-Security-Policy can forbid inline scripts.
const getUrlParams = () => {
    const urlSearchParams = new URLSearchParams(
        window.location.hash.substring(1)
    );
    const access_token = urlSearchParams.get('access_token');
    const refresh_token = urlSearchParams.get('refresh_token');
    const type = urlSearchParams.get('type');

    return { access_token, refresh_token, type };
};

function interceptAuthCallback() {
        const hash = window.location.hash;
        const {access_token, refresh_token, type} = getUrlParams();
        window.location.href = `./#/auth-callback?access_token=${access_token}&refresh_token=${refresh_token}&type=${type}`;
}

// Call the function to intercept the auth callback
interceptAuthCallback();
