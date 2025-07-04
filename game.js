document.addEventListener('DOMContentLoaded', () => {
    const usernameScreen = document.getElementById('username-screen');
    const usernameInput = document.getElementById('username-input');
    const usernameSubmitButton = document.getElementById('username-submit');
    const menu = document.getElementById('menu');
    const difficultyScreen = document.getElementById('difficulty');
    const game = document.getElementById('game');
    const leaderboardScreen = document.getElementById('leaderboard');
    const startButton = document.getElementById('start-button');
    const leaderboardButton = document.getElementById('leaderboard-button');
    const backButton = document.getElementById('back-button');
    const restartButton = document.getElementById('restart-button');
    const difficultyButtons = document.querySelectorAll('.difficulty-button');
    const scoreDisplay = document.getElementById('score');
    const menuMusic = document.getElementById('menu-music');
    const gameMusic = document.getElementById('game-music');
    const scoresDisplay = document.getElementById('scores');
    const menuBg = document.getElementById('menu-bg');
    const gameBg = document.getElementById('game-bg');
    const potatoContainer = document.getElementById('potato-container');
    const potatoAnimContainer = document.getElementById('potato-anim-container');
  
    const pauseButton = document.getElementById('pause-button');
    const pauseScreen = document.getElementById('pause-screen');
  
    const toggleMusicButton = document.getElementById('toggle-music-button');
    const toggleSoundButton = document.getElementById('toggle-sound-button');
  
    const backToMenuButton = document.getElementById('back-to-menu-button');
    const resumeButton = document.getElementById('resume-button');
    
    const menuLeaderboardScreen = document.getElementById('menu-leaderboard-screen');
    const easyScoresDisplay = document.getElementById('easy-scores');
    const mediumScoresDisplay = document.getElementById('medium-scores');
    const hardcoreScoresDisplay = document.getElementById('hardcore-scores');
    const menuLeaderboardBackButton = document.getElementById('menu-leaderboard-back-button');
    const menuToggleMusicButton = document.getElementById('menu-toggle-music-button');
    const menuToggleSoundButton = document.getElementById('menu-toggle-sound-button');
  
    const pauseButtonRect = pauseButton.getBoundingClientRect();
    const scoreDisplayRect = scoreDisplay.getBoundingClientRect();

    // ANON KEY IS USED
    const supabaseUrl = 'https://ylrbjiciudweqmfnzghc.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscmJqaWNpdWR3ZXFtZm56Z2hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMTQ4MDksImV4cCI6MjA2NTY5MDgwOX0.eR-eSeTZR8ZUBC21zIjqDYX0fez6whLsduFNEVr7vYo'
    const sbClient = supabase.createClient(supabaseUrl, supabaseKey);
  
    let score = 0;
    let gameOver = false;
    let potatoTimeout;
    let gameOverTimeout;
    let musicOn = true;
    let soundOn = true;
    let currentTimeLimit = 2000;
    let currentUsername = '';
    let currentDifficulty = 'easy';
    let currentPotato = null;

    const bucketX = 180;
    const bucketY = 340;

    function playScoreSound(score) {
        if (!soundOn) return; // Check if sound is turned on before playing any sound

        let audio;
        if (score % 25 === 0) {
            audio = new Audio('assets/sounds/score_25.mp3');
        } else if (score % 5 === 0) {
            audio = new Audio('assets/sounds/score_05.mp3');
        } else {
            audio = new Audio('assets/sounds/score_01.mp3');
        }
        audio.play();
    }

  
  
    function isWithinExclusionZone(x, y, exclusionZones) {
        return exclusionZones.some(zone => (
            x > zone.left && x < zone.right && y > zone.top && y < zone.bottom
        ));
    }
  
async function fetchAllScores() {
    logToPage('fetchAllScores called');
    try {
        // Fetch scores for each difficulty from Supabase
        const { data: easyData, error: easyError } = await sbClient
            .from('potato_leaderboard')
            .select('*')
            .eq('difficulty', 'easy')
            .order('score', { ascending: false });

        const { data: mediumData, error: mediumError } = await sbClient
            .from('potato_leaderboard')
            .select('*')
            .eq('difficulty', 'medium')
            .order('score', { ascending: false });

        const { data: hardcoreData, error: hardcoreError } = await sbClient
            .from('potato_leaderboard')
            .select('*')
            .eq('difficulty', 'hardcore')
            .order('score', { ascending: false });

        if (easyError || mediumError || hardcoreError) {
            throw new Error(easyError?.message || mediumError?.message || hardcoreError?.message);
        }

        const formatScores = (scores) => scores
            .map(entry => `<p>${entry.username}: ${entry.score}</p>`)
            .join('');

        easyScoresDisplay.innerHTML = formatScores(easyData || []);
        mediumScoresDisplay.innerHTML = formatScores(mediumData || []);
        hardcoreScoresDisplay.innerHTML = formatScores(hardcoreData || []);
        
        logToPage('All scores fetched and formatted');
    } catch (error) {
        logToPage('Error fetching all scores: ' + error.message);
        console.error('Error fetching all scores:', error);
    }
}


    function showMenuLeaderboard() {
        menu.classList.add('hidden');
        menuLeaderboardScreen.classList.remove('hidden');
        fetchAllScores();
        logToPage('fetchAllScores - done')
    }
  
    function logToPage(message) {
        const logContainer = document.getElementById('log-container');
        logContainer.style.display = 'none'; // none

        const logMessage = document.createElement('p');
        logMessage.textContent = message;
        logContainer.appendChild(logMessage);

        // Limit the number of log entries to 10
        if (logContainer.childElementCount > 30) {
            logContainer.removeChild(logContainer.firstChild);
        }

        // Scroll to the bottom of the log container
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    function calculateAngleAndDistance(x, y) {
        const deltaX = bucketX - x;
        const deltaY = bucketY - y;
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        return { angle, distance };
    }

    function showUsernameScreen() {
        pauseScreen.classList.add('hidden');
        usernameScreen.classList.remove('hidden');
        menu.classList.add('hidden');
        difficultyScreen.classList.add('hidden');
        game.classList.add('hidden');
        leaderboardScreen.classList.add('hidden');
    }

    function showMenu() {
        menu.classList.remove('hidden');
        usernameScreen.classList.add('hidden');
        menuLeaderboardScreen.classList.add('hidden');
        difficultyScreen.classList.add('hidden');
        game.classList.add('hidden');
        leaderboardScreen.classList.add('hidden');
        pauseScreen.classList.add('hidden');
        menuMusic.play();
        gameMusic.pause();
        menuBg.classList.remove('hidden');
        gameBg.classList.add('hidden');
        gameOver = false;
        clearTimeout(potatoTimeout);
        clearTimeout(gameOverTimeout);
        removeAllPotatoes();
        logToPage('Menu screen should be visible');
    }

    function showDifficultyScreen() {
        menu.classList.add('hidden');
        difficultyScreen.classList.remove('hidden');
        menuBg.classList.remove('hidden');
        gameBg.classList.add('hidden');
    }

    function showGameScreen(timeLimit) {
        difficultyScreen.classList.add('hidden');
        game.classList.remove('hidden');
        pauseScreen.classList.add('hidden');
        menuMusic.pause();
        gameMusic.play();
        score = 0;
        updateScore();
        currentTimeLimit = timeLimit;
        menuBg.classList.add('hidden');
        gameBg.classList.remove('hidden');
        gameOver = false;
        spawnPotato();
    }

    function showLeaderboard() {
        logToPage('showLeaderboard called');
        if (menu) {
            menu.classList.add('hidden');
            logToPage('Menu hidden');
        } else {
            logToPage('Menu element not found');
        }

        if (leaderboardScreen) {
            leaderboardScreen.classList.remove('hidden');
            logToPage('Leaderboard screen visible');
        } else {
            logToPage('Leaderboard screen element not found');
        }
        fetchScores();
    }


    function updateScore() {
        scoreDisplay.textContent = `СЧЁТ: ${score}`;
    }

    function spawnPotato() {
        if (gameOver) return;
        removeAllClickablePotatoes();

        const containerWidth = 360;
        const containerHeight = 640;
        const potatoWidth = 60;
        const potatoHeight = 90;

        const exclusionZones = [
            { left: pauseButtonRect.left, right: pauseButtonRect.right, top: pauseButtonRect.top, bottom: pauseButtonRect.bottom },
            { left: scoreDisplayRect.left, right: scoreDisplayRect.right, top: scoreDisplayRect.top, bottom: scoreDisplayRect.bottom }
        ];

        let x, y;
        do {
            x = Math.random() * (containerWidth - potatoWidth);
            y = Math.random() * (containerHeight - potatoHeight);
        } while (isWithinExclusionZone(x, y, exclusionZones));

        const rotation = Math.random() * 360;

        const potato = document.createElement('div');
        potato.classList.add('potato');
        potato.style.left = `${x}px`;
        potato.style.top = `${y}px`;
        potato.style.width = `${potatoWidth}px`;
        potato.style.height = `${potatoHeight}px`;
        potato.style.transform = `rotate(${rotation}deg)`;
        potato.style.backgroundImage = 'url(assets/images/pot0.png)';
        potatoContainer.appendChild(potato);

        clearTimeout(potatoTimeout);
        potatoTimeout = setTimeout(() => {
            if (!gameOver) endGame();
        }, currentTimeLimit);

        potato.addEventListener('click', () => {
            if (gameOver) return;
            score += 1;
            playScoreSound(score);  // Play the appropriate sound
            clearTimeout(potatoTimeout);
            const startX = potato.style.left;
            const startY = potato.style.top;
            animatePotatoFall(startX, startY, parseFloat(startY));
            potato.remove();
            updateScore();
            spawnPotato();
        });
    }

    function animatePotatoFall(startX, startY, startYNum) {
        const animationPotatoHalf = document.createElement('div');
        animationPotatoHalf.classList.add('potato_anim_half');
        animationPotatoHalf.style.left = startX;
        animationPotatoHalf.style.top = startY;
        potatoAnimContainer.appendChild(animationPotatoHalf);

        const animationPotato = document.createElement('div');
        animationPotato.classList.add('potato_anim');
        animationPotato.style.left = startX;
        animationPotato.style.top = startY;
        potatoAnimContainer.appendChild(animationPotato);

        const startXNum = parseFloat(startX);
        const { distance } = calculateAngleAndDistance(startXNum, startYNum);

        let endX = bucketX - startXNum;
        let endY = bucketY - startYNum;

        if (startXNum < bucketX) {
            endX = Math.abs(endX);
        } else {
            endX = -Math.abs(endX);
        }

        if (startYNum > bucketY) {
            endX = bucketX - startXNum;
            endY = bucketY - startYNum;
        }

        animationPotatoHalf.style.setProperty('--endX', `${endX}px`);
        animationPotatoHalf.style.setProperty('--endY', `${endY}px`);
        animationPotatoHalf.style.animation = `throwUpAndFall 1s forwards, opacityTransitionHalf 1s forwards`;

        animationPotato.style.setProperty('--endX', `${endX}px`);
        animationPotato.style.setProperty('--endY', `${endY}px`);
        animationPotato.style.animation = `throwUpAndFall 1s forwards, opacityTransitionFull 1s forwards`;

        animationPotato.addEventListener('animationend', () => {
            animationPotato.remove();
        }, { once: true });

        animationPotatoHalf.addEventListener('animationend', () => {
            animationPotatoHalf.remove();
        }, { once: true });
    }

    async function fetchScores() {
        logToPage('fetchScores called');
        try {
            const { data, error } = await sbClient
                .from('potato_leaderboard')
                .select('*')
                .eq('difficulty', currentDifficulty)
                .order('score', { ascending: false })
                .limit(13);

            if (error) throw error;

            logToPage('Scores data received: ' + JSON.stringify(data));
            scoresDisplay.innerHTML = data.map(entry => `<p>${entry.username}: ${entry.score}</p>`).join('');
            logToPage('Leaderboard updated');
        } catch (error) {
            logToPage('Error fetching scores: ' + error.message);
            console.error('Error fetching scores:', error);
        }
    }

    async function saveScore() {
        logToPage('saveScore called');
        try {
            // First check if user already has a score for this difficulty
            const { data: existingScore, error: selectError } = await sbClient
                .from('potato_leaderboard')
                .select('score')
                .eq('username', currentUsername)
                .eq('difficulty', currentDifficulty)
                .single();

            if (selectError && selectError.code !== 'PGRST116') { // Ignore "no rows" error
                throw selectError;
            }

            let shouldSave = false;
            if (existingScore) {
                // Only save if new score is higher
                shouldSave = score > existingScore.score;
            } else {
                // No existing score, save new one
                shouldSave = true;
            }

            if (shouldSave) {
                const { error: upsertError } = await sbClient
                    .from('potato_leaderboard')
                    .upsert(
                        {
                            username: currentUsername,
                            score: score,
                            difficulty: currentDifficulty
                        },
                        { onConflict: ['username', 'difficulty'] }
                    );

                if (upsertError) throw upsertError;

                logToPage('Score successfully saved to Supabase.');
                fetchScores(); // Fetch scores after saving
            } else {
                logToPage('Score not high enough to save.');
            }
        } catch (error) {
            logToPage('Error saving score: ' + error.message);
            console.error('Error saving score:', error);
        }
    }

    function endGame() {
        gameMusic.pause();
        logToPage('Game over, saving score');
        saveScore();
        gameOver = true;
        clearTimeout(potatoTimeout);
        removeAllPotatoes();
        showLeaderboard(); // Ensure leaderboard is shown after saving score
    }


    function removeAllClickablePotatoes() {
        potatoContainer.querySelectorAll('.potato').forEach(p => p.remove());
    }

    function removeAllPotatoes() {
        removeAllClickablePotatoes();
        potatoAnimContainer.querySelectorAll('.potato_anim, .potato_anim_half').forEach(p => p.remove());
    }

    function pauseGame() {
        logToPage('Game paused');
        clearTimeout(potatoTimeout);
        clearTimeout(gameOverTimeout);
        if (currentPotato) {
            currentPotato.style.display = 'none';
        }
        pauseScreen.classList.remove('hidden');
    }

    function resumeGame() {
        logToPage('Game resumed');
        pauseScreen.classList.add('hidden');
        if (currentPotato) {
            currentPotato.style.display = 'block';
        }
        spawnPotato();
    }

    function toggleMusic() {
        musicOn = !musicOn;
        menuToggleMusicButton.textContent = musicOn ? 'Выкл. музыку' : 'Вкл. музыку';
        toggleMusicButton.textContent = musicOn ? 'Выкл. музыку' : 'Вкл. музыку';
        if (musicOn) {
            menuMusic.muted = false;
            gameMusic.muted = false;
        } else {
            menuMusic.muted = true;
            gameMusic.muted = true;
        }
    }

    function toggleSound() {
        soundOn = !soundOn;
        menuToggleSoundButton.textContent = soundOn ? 'Выкл. звуки' : 'Вкл. звуки';
        toggleSoundButton.textContent = soundOn ? 'Выкл. звуки' : 'Вкл. звуки';
    }

  
    menuToggleMusicButton.addEventListener('click', toggleMusic);
    menuToggleSoundButton.addEventListener('click', toggleSound);
    toggleMusicButton.addEventListener('click', toggleMusic);
    toggleSoundButton.addEventListener('click', toggleSound);

    backToMenuButton.addEventListener('click', () => {
        saveScore();
        showMenu();
    });

    pauseButton.addEventListener('click', () => {
        pauseGame();
    });

    resumeButton.addEventListener('click', () => {
        resumeGame();
    });

    usernameSubmitButton.addEventListener('click', () => {
        currentUsername = usernameInput.value.trim();
        if (currentUsername) {
            showMenu();
        } else {
            alert('Нормальное имя введи!');
        }
    });

    startButton.addEventListener('click', showDifficultyScreen);
    leaderboardButton.addEventListener('click', showMenuLeaderboard);
    menuLeaderboardBackButton.addEventListener('click', showMenu);
    backButton.addEventListener('click', () => {
        logToPage('Back button clicked');
        showMenu();
        logToPage('Menu screen should be visible');
    });
  
    restartButton.addEventListener('click', () => {
        logToPage('Restart button clicked');
        leaderboardScreen.classList.add('hidden');
        game.classList.remove('hidden');
        gameMusic.play();
        score = 0;
        updateScore();
        gameOver = false;
        spawnPotato();
        logToPage('Game screen should be visible');
    });

    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const timeLimit = parseInt(button.getAttribute('data-time'), 10);
            currentDifficulty = button.getAttribute('data-difficulty');
            showGameScreen(timeLimit);
        });
    });
    
    showUsernameScreen();
});
