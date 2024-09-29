document.addEventListener('DOMContentLoaded', async () => {
    const subList = document.getElementById('sub-list');
    const followerList = document.getElementById('follower-list');
    const scrollingCredits = document.getElementById('scrolling-credits');

    async function fetchSubs() {
        try {
            const response = await fetch('/api/subs');
            if (!response.ok) {
                throw new Error(`Erreur HTTP lors de la récupération des abonnés : ${response.status}`);
            }

            const subs = await response.json();
            console.log('Données d’abonnés récupérées côté client :', subs);

            if (Array.isArray(subs) && subs.length > 0) {
                subs.forEach(sub => {
                    const subElement = document.createElement('div');
                    subElement.textContent = sub.user_name + "(SUB)";
                    subElement.classList.add('text-4xl', 'text-white');
                    subList.appendChild(subElement);
                });
            } else {
                console.warn('Pas de données d’abonnés reçues ou format incorrect.');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des abonnés :', error);
        }
    }

    async function fetchFollowers() {
        try {
            const response = await fetch('/api/followers');
            if (!response.ok) {
                throw new Error(`Erreur HTTP lors de la récupération des followers : ${response.status}`);
            }

            const followers = await response.json();
            console.log('Données des followers récupérées côté client :', followers);

            if (Array.isArray(followers) && followers.length > 0) {
                followers.forEach(follower => {
                    const followerElement = document.createElement('div');
                    followerElement.textContent = follower.user_name;
                    followerElement.classList.add('text-4xl', 'text-white');
                    followerList.appendChild(followerElement);
                });
            } else {
                console.warn('Pas de données de followers reçues ou format incorrect.');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des followers :', error);
        }
    }

    await fetchSubs();
    await fetchFollowers();

    const creditsHeight = scrollingCredits.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollDuration = (creditsHeight / viewportHeight) * 40;
    scrollingCredits.style.animation = `scroll-up ${scrollDuration}s linear infinite`;

    setTimeout(() => {
        scrollingCredits.style.bottom = '100%';
    }, 500);
});
