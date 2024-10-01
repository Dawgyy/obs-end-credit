async function fetchProtectedData(endpoint) {
    try {
        const response = await fetch(endpoint);
        if (response.status === 401) {
            window.location.href = '/auth/login';
            return;
        }

        if (!response.ok) {
            throw new Error(`${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const subList = document.getElementById('sub-list');
    const followerList = document.getElementById('follower-list');
    const scrollingCredits = document.getElementById('scrolling-credits');

    async function fetchSubs() {
        try {
            const subs = await fetchProtectedData('/api/subs');

            if (Array.isArray(subs) && subs.length > 0) {
                subs.forEach(sub => {
                    const subElement = document.createElement('div');
                    subElement.textContent = sub.user_name + " (SUB)";
                    subElement.classList.add('text-4xl', 'text-white');
                    subList.appendChild(subElement);
                });
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des abonnés :', error);
        }
    }

    async function fetchFollowers() {
        try {
            const followers = await fetchProtectedData('/api/followers');

            if (Array.isArray(followers) && followers.length > 0) {
                followers.forEach(follower => {
                    const followerElement = document.createElement('div');
                    followerElement.textContent = follower.user_name;
                    followerElement.classList.add('text-4xl', 'text-white');
                    followerList.appendChild(followerElement);
                });
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des followers :', error);
        }
    }

    await fetchSubs();
    await fetchFollowers();
    const creditsHeight = scrollingCredits.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollDuration = creditsHeight / viewportHeight * 30;
    scrollingCredits.style.animation = `scroll-up ${scrollDuration}s ease-out infinite`;
});
