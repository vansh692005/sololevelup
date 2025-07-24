
class SoloLevelerApp {
    constructor() {
        this.currentScreen = 'dailyTasks';
        this.dailyTasks = [];
        this.playerData = {};
        this.inventory = [];
        this.quests = {};
        this.achievements = [];
        this.shop = [];
        this.streak = 0;
        this.timer = null;
        
        this.init();
    }
    
    init() {
        this.setupNavigation();
        this.loadAllData();
        this.startTimer();
        this.setupTaskInteractions();
        this.setupStatAllocation();
        this.setupShopInteractions();
    }
    
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const screens = document.querySelectorAll('.screen');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetScreen = item.dataset.screen;
                if (!targetScreen) return;
                
                // Update active nav item
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Update active screen
                screens.forEach(screen => {
                    screen.classList.remove('active');
                    if (screen.id === targetScreen) {
                        screen.classList.add('active');
                    }
                });
                
                this.currentScreen = targetScreen;
                
                // Load screen-specific data
                this.loadScreenData(targetScreen);
            });
        });
    }
    
    async loadAllData() {
        try {
            await Promise.all([
                this.loadPlayerData(),
                this.loadDailyTasks(),
                this.loadInventory(),
                this.loadQuests(),
                this.loadShop(),
                this.loadAchievements()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }
    
    async loadPlayerData() {
        try {
            const response = await fetch('/api/player');
            this.playerData = await response.json();
            this.updatePlayerDisplay();
        } catch (error) {
            console.error('Error loading player data:', error);
        }
    }
    
    async loadDailyTasks() {
        try {
            const response = await fetch('/api/daily-tasks');
            const data = await response.json();
            
            this.dailyTasks = data.tasks;
            this.streak = data.streak;
            
            this.renderTasks();
            this.updateStreak();
        } catch (error) {
            console.error('Error loading daily tasks:', error);
        }
    }
    
    async loadInventory() {
        try {
            const response = await fetch('/api/inventory');
            this.inventory = await response.json();
            this.renderInventory();
        } catch (error) {
            console.error('Error loading inventory:', error);
        }
    }
    
    async loadQuests() {
        try {
            const response = await fetch('/api/quests');
            this.quests = await response.json();
            this.renderQuests();
            
            // Load personal quests
            await this.loadPersonalQuests();
        } catch (error) {
            console.error('Error loading quests:', error);
        }
    }
    
    async loadPersonalQuests() {
        try {
            const response = await fetch('/api/personal-quests');
            this.personalQuests = await response.json();
            this.renderPersonalQuests();
        } catch (error) {
            console.error('Error loading personal quests:', error);
        }
    }
    
    async loadShop() {
        try {
            const response = await fetch('/api/shop');
            this.shop = await response.json();
            this.renderShop();
        } catch (error) {
            console.error('Error loading shop:', error);
        }
    }
    
    async loadAchievements() {
        try {
            const response = await fetch('/api/achievements');
            this.achievements = await response.json();
            this.renderAchievements();
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    }

    async loadLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            this.leaderboard = await response.json();
            this.renderLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }
    
    loadScreenData(screenName) {
        switch(screenName) {
            case 'inventory':
                this.loadInventory();
                break;
            case 'quests':
                this.loadQuests();
                break;
            case 'shop':
                this.loadShop();
                break;
            case 'achievements':
                this.loadAchievements();
                break;
            case 'status':
                this.loadPlayerData();
                break;
        }
    }
    
    updatePlayerDisplay() {
        if (!this.playerData) return;
        
        // Update header
        const levelText = document.querySelector('.level-text');
        const xpText = document.querySelector('.xp-text');
        const xpProgress = document.querySelector('.xp-progress');
        const coinCount = document.getElementById('coinCount');
        const energyCount = document.getElementById('energyCount');
        
        if (levelText) levelText.textContent = `LVL : ${this.playerData.level}`;
        if (xpText) xpText.textContent = `${this.playerData.current_xp}/${this.playerData.xp_to_next_level}`;
        if (xpProgress) {
            const progressPercent = (this.playerData.current_xp / this.playerData.xp_to_next_level) * 100;
            xpProgress.style.width = `${progressPercent}%`;
        }
        if (coinCount) coinCount.textContent = this.playerData.coins;
        if (energyCount) energyCount.textContent = this.playerData.energy;
        
        // Update status screen
        const playerClass = document.getElementById('playerClass');
        const playerTitle = document.getElementById('playerTitle');
        const totalExp = document.getElementById('totalExp');
        const physDamageRed = document.getElementById('physDamageRed');
        const magDamageRed = document.getElementById('magDamageRed');
        const maxStreak = document.getElementById('maxStreak');
        
        if (playerClass) playerClass.textContent = this.playerData.class;
        if (playerTitle) playerTitle.textContent = this.playerData.title;
        if (totalExp) totalExp.textContent = this.playerData.total_experience;
        if (physDamageRed) physDamageRed.textContent = this.playerData.physical_damage_reduction;
        if (magDamageRed) magDamageRed.textContent = this.playerData.magical_damage_reduction;
        if (maxStreak) maxStreak.textContent = this.playerData.max_streak;
        
        // Update rank display
        this.updateRankDisplay();
        
        // Update stats
        this.updateStatsDisplay();
    }
    
    updateStatsDisplay() {
        if (!this.playerData.stats) return;
        
        const stats = this.playerData.stats;
        const statElements = document.querySelectorAll('.stat .stat-name');
        const pointsNumber = document.querySelector('.points-number');
        
        statElements.forEach(element => {
            const text = element.textContent;
            if (text.includes('STR')) element.textContent = `STR : ${stats.strength}`;
            else if (text.includes('VIT')) element.textContent = `VIT : ${stats.vitality}`;
            else if (text.includes('AGI')) element.textContent = `AGI : ${stats.agility}`;
            else if (text.includes('INT')) element.textContent = `INT : ${stats.intelligence}`;
            else if (text.includes('PER')) element.textContent = `PER : ${stats.perception}`;
        });
        
        if (pointsNumber) pointsNumber.textContent = stats.available_points;
    }
    
    updateRankDisplay() {
        if (!this.playerData) return;
        
        const rankBadge = document.querySelector('.rank-badge');
        const rankName = document.getElementById('rankName');
        const rankScore = document.getElementById('rankScore');
        const rankProgress = document.getElementById('rankProgress');
        const rankProgressFill = document.getElementById('rankProgressFill');
        
        if (rankBadge) {
            rankBadge.textContent = this.playerData.rank || 'E';
            rankBadge.className = `rank-badge rank-${(this.playerData.rank || 'E').toLowerCase()}`;
        }
        
        // Update stats grid with rank effects
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            statsGrid.className = `stats-grid rank-${(this.playerData.rank || 'E').toLowerCase()}`;
        }
        
        if (rankName) rankName.textContent = this.playerData.rank_name || 'AWAKENED';
        if (rankScore) rankScore.textContent = this.playerData.rank_score || 0;
        
        if (rankProgress && this.playerData.points_to_next_rank !== null) {
            if (this.playerData.points_to_next_rank === null) {
                rankProgress.textContent = 'MAX RANK ACHIEVED';
            } else {
                rankProgress.textContent = `${this.playerData.points_to_next_rank} points to next rank`;
            }
        }
        
        if (rankProgressFill) {
            const score = this.playerData.rank_score || 0;
            const pointsToNext = this.playerData.points_to_next_rank;
            
            if (pointsToNext === null) {
                rankProgressFill.style.width = '100%';
            } else {
                // Calculate progress within current rank
                const rankThresholds = [0, 200, 400, 600, 800, 1000];
                const currentRankIndex = rankThresholds.findIndex(threshold => score < threshold) - 1;
                const currentThreshold = rankThresholds[Math.max(0, currentRankIndex)];
                const nextThreshold = rankThresholds[currentRankIndex + 1];
                
                if (nextThreshold) {
                    const progressInRank = score - currentThreshold;
                    const totalRankPoints = nextThreshold - currentThreshold;
                    const progressPercent = (progressInRank / totalRankPoints) * 100;
                    rankProgressFill.style.width = `${Math.max(0, progressPercent)}%`;
                } else {
                    rankProgressFill.style.width = '100%';
                }
            }
        }
    }
    
    renderTasks() {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;
        
        taskList.innerHTML = '';
        
        this.dailyTasks.forEach((task, index) => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskElement.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     data-task-index="${index}">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-name">${task.name}</div>
                <div class="task-progress">${task.progress}/${task.max}</div>
                <div class="task-reward">+${task.xp_reward} XP • +${task.coin_reward} 💰</div>
            `;
            
            taskList.appendChild(taskElement);
        });
    }
    
    renderInventory() {
        const inventoryGrid = document.getElementById('inventoryGrid');
        if (!inventoryGrid) return;
        
        inventoryGrid.innerHTML = '';
        
        if (this.inventory.length === 0) {
            inventoryGrid.innerHTML = '<div class="empty-message">NO ITEMS IN INVENTORY</div>';
            return;
        }
        
        this.inventory.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.innerHTML = `
                <div class="item-icon">${this.getItemIcon(item.type)}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-quantity">x${item.quantity}</div>
                <div class="item-effect">${item.effect}</div>
                <button class="use-btn" onclick="app.useItem('${item.name}')">USE</button>
            `;
            
            inventoryGrid.appendChild(itemElement);
        });
    }
    
    renderQuests() {
        // Quest progress is already in HTML, just update progress bars
        const questCards = document.querySelectorAll('.quest-card[data-quest]');
        
        questCards.forEach(card => {
            const questType = card.dataset.quest;
            const progressBar = card.querySelector('.progress');
            const completeBtn = card.querySelector('.complete-quest-btn');
            
            if (this.quests[questType]) {
                const quest = this.quests[questType];
                const progress = (quest.progress / quest.max) * 100;
                if (progressBar) progressBar.style.width = `${progress}%`;
                
                // Show complete button if quest is ready and not completed
                if (completeBtn) {
                    if (quest.progress >= quest.max && !quest.completed) {
                        completeBtn.style.display = 'block';
                        card.classList.add('quest-ready');
                    } else {
                        completeBtn.style.display = 'none';
                        card.classList.remove('quest-ready');
                    }
                    
                    if (quest.completed) {
                        card.classList.add('quest-completed');
                        completeBtn.style.display = 'none';
                    }
                }
            }
        });
        
        // Update personal quests count
        const questCount = document.querySelector('.quest-count');
        if (questCount && this.quests.personal_quests !== undefined) {
            questCount.textContent = `${this.quests.personal_quests} QUESTS REMAINING`;
        }
    }
    
    async completeQuest(questName) {
        try {
            const response = await fetch('/api/complete-quest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quest_name: questName })
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadQuests();
                await this.loadPlayerData();
                this.showNotification(`Quest completed! +${result.rewards.xp} XP +${result.rewards.coins} coins!`);
                this.addQuestCompleteShockwave();
                this.addRewardClaimEffect();
            } else {
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            console.error('Error completing quest:', error);
            this.showNotification('Failed to complete quest', 'error');
        }
    }
    
    renderShop() {
        const shopGrid = document.getElementById('shopGrid');
        if (!shopGrid) return;
        
        shopGrid.innerHTML = '';
        
        this.shop.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';
            itemElement.innerHTML = `
                <div class="item-icon">${this.getItemIcon(item.type)}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">💰 ${item.price}</div>
                <div class="item-effect">${item.effect}</div>
                <button class="buy-btn" onclick="app.buyItem('${item.name}')" 
                        ${this.playerData.coins < item.price ? 'disabled' : ''}>
                    ${this.playerData.coins < item.price ? 'INSUFFICIENT COINS' : 'BUY'}
                </button>
            `;
            
            shopGrid.appendChild(itemElement);
        });
    }
    
    renderAchievements() {
        const achievementsList = document.getElementById('achievementsList');
        if (!achievementsList) return;
        
        achievementsList.innerHTML = '';
        
        this.achievements.forEach((achievement, index) => {
            const achievementElement = document.createElement('div');
            const canClaim = achievement.unlocked && !achievement.claimed;
            const isClaimed = achievement.claimed;
            
            achievementElement.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'} ${canClaim ? 'claimable' : ''} ${isClaimed ? 'claimed' : ''}`;
            
            let statusContent = '';
            if (isClaimed) {
                statusContent = '<div class="achievement-status claimed">CLAIMED</div>';
            } else if (canClaim) {
                statusContent = `<button class="claim-btn" onclick="app.claimAchievement(${index})">CLAIM REWARD</button>`;
            } else if (achievement.unlocked) {
                statusContent = '<div class="achievement-status">UNLOCKED</div>';
            } else {
                statusContent = '<div class="achievement-status">LOCKED</div>';
            }
            
            achievementElement.innerHTML = `
                <div class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                    <div class="achievement-reward">Reward: 💰 ${achievement.reward_coins}</div>
                </div>
                ${statusContent}
            `;
            
            achievementsList.appendChild(achievementElement);
        });
    }
    
    getItemIcon(type) {
        const icons = {
            'consumable': '🧪',
            'booster': '⚡',
            'permanent': '💎',
            'equipment': '⚔️'
        };
        return icons[type] || '📦';
    }
    
    setupTaskInteractions() {
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                const taskIndex = parseInt(e.target.dataset.taskIndex);
                await this.toggleTask(taskIndex);
            }
        });
    }
    
    setupStatAllocation() {
        // Stats are handled via onclick attributes in HTML
    }
    
    setupShopInteractions() {
        // Shop interactions are handled via onclick attributes in HTML
    }
    
    async toggleTask(taskIndex) {
        try {
            const oldRank = this.playerData?.rank || 'E';
            
            const response = await fetch('/api/complete-task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ task_index: taskIndex })
            });
            
            if (response.ok) {
                await this.loadDailyTasks();
                await this.loadPlayerData();
                
                // Check for rank up
                const newRank = this.playerData?.rank || 'E';
                if (oldRank !== newRank) {
                    this.addRankUpEffect(newRank);
                }
                
                this.showNotification('Task completed! +XP +Coins');
                this.addCompletionEffect();
                this.addQuestCompleteShockwave();
            }
        } catch (error) {
            console.error('Error completing task:', error);
        }
    }
    
    async allocateStat(statName) {
        try {
            const response = await fetch('/api/allocate-stat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ stat_name: statName })
            });
            
            if (response.ok) {
                await this.loadPlayerData();
                this.showNotification(`${statName.toUpperCase()} increased!`);
            }
        } catch (error) {
            console.error('Error allocating stat:', error);
        }
    }
    
    async buyItem(itemName) {
        try {
            const response = await fetch('/api/buy-item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ item_name: itemName })
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadPlayerData();
                await this.loadInventory();
                await this.loadShop();
                this.showNotification(`Purchased ${itemName}!`);
            } else {
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            console.error('Error buying item:', error);
        }
    }
    
    async useItem(itemName) {
        try {
            const response = await fetch('/api/use-item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ item_name: itemName })
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadPlayerData();
                await this.loadInventory();
                this.showNotification(`Used ${itemName}!`);
            } else {
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            console.error('Error using item:', error);
        }
    }
    
    async claimAchievement(achievementIndex) {
        try {
            const response = await fetch('/api/claim-achievement', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ achievement_index: achievementIndex })
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadPlayerData();
                await this.loadAchievements();
                this.showNotification(`Achievement claimed! +${result.coins_awarded} coins!`);
                this.addRewardClaimEffect();
            } else {
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            console.error('Error claiming achievement:', error);
        }
    }
    
    updateStreak() {
        const streakNumber = document.querySelector('.streak-number');
        if (streakNumber) {
            streakNumber.textContent = this.streak;
        }
    }
    
    startTimer() {
        this.updateTimer();
        this.timer = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }
    
    updateTimer() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeRemaining = tomorrow - now;
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
        
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Add warning class when time is running low
            if (hours < 2) {
                timerDisplay.classList.add('warning');
            } else {
                timerDisplay.classList.remove('warning');
            }
        }
    }
    
    showNotification(message, type = 'success') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                container.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    addCompletionEffect() {
        // Create particle effect for task completion
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: fixed;
                width: 6px;
                height: 6px;
                background: #7d7de8;
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                box-shadow: 0 0 15px #7d7de8;
            `;
            
            const startX = Math.random() * window.innerWidth;
            const startY = window.innerHeight * 0.6;
            
            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            
            document.body.appendChild(particle);
            
            particle.animate([
                { transform: 'translateY(0px) scale(1)', opacity: 1 },
                { transform: `translateY(-${150 + Math.random() * 100}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1500 + Math.random() * 500,
                easing: 'ease-out'
            }).onfinish = () => {
                if (document.body.contains(particle)) {
                    document.body.removeChild(particle);
                }
            };
        }
    }
    
    addRewardClaimEffect() {
        // Create golden particle effect for achievement reward claiming
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'reward-particle';
            particle.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: #f4d03f;
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                box-shadow: 0 0 20px #f4d03f;
            `;
            
            const startX = Math.random() * window.innerWidth;
            const startY = window.innerHeight * 0.5;
            
            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            
            document.body.appendChild(particle);
            
            particle.animate([
                { transform: 'translateY(0px) scale(1)', opacity: 1 },
                { transform: `translateY(-${200 + Math.random() * 150}px) scale(0)`, opacity: 0 }
            ], {
                duration: 2000 + Math.random() * 1000,
                easing: 'ease-out'
            }).onfinish = () => {
                if (document.body.contains(particle)) {
                    document.body.removeChild(particle);
                }
            };
        }
    }
    
    addQuestCompleteShockwave() {
        const shockwave = document.createElement('div');
        shockwave.className = 'quest-complete-effect';
        shockwave.style.left = (window.innerWidth / 2 - 50) + 'px';
        shockwave.style.top = (window.innerHeight / 2 - 50) + 'px';
        
        document.body.appendChild(shockwave);
        
        setTimeout(() => {
            if (document.body.contains(shockwave)) {
                document.body.removeChild(shockwave);
            }
        }, 1000);
    }
    
    addRankUpEffect(newRank) {
        const rankUpText = document.createElement('div');
        rankUpText.className = 'rank-up-effect';
        rankUpText.textContent = `RANK UP! ${newRank} RANK ACHIEVED!`;
        
        document.body.appendChild(rankUpText);
        
        // Create special particles based on rank
        this.createRankUpParticles(newRank);
        
        setTimeout(() => {
            if (document.body.contains(rankUpText)) {
                document.body.removeChild(rankUpText);
            }
        }, 3000);
    }
    
    createRankUpParticles(rank) {
        const colors = {
            'E': '#888888',
            'D': '#daa520',
            'C': '#c0c0c0',
            'B': '#ffd700',
            'A': '#ff6b6b',
            'S': '#8b5cf6'
        };
        
        const particleCount = rank === 'S' ? 30 : 20;
        const color = colors[rank] || '#888888';
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                box-shadow: 0 0 25px ${color};
            `;
            
            const startX = window.innerWidth / 2;
            const startY = window.innerHeight / 2;
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = 150 + Math.random() * 100;
            
            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            
            document.body.appendChild(particle);
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { 
                    transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity}px) scale(0)`, 
                    opacity: 0 
                }
            ], {
                duration: 2000,
                easing: 'ease-out'
            }).onfinish = () => {
                if (document.body.contains(particle)) {
                    document.body.removeChild(particle);
                }
            };
        }
    }
    
    renderPersonalQuests() {
        const personalQuestsList = document.getElementById('personalQuestsList');
        if (!personalQuestsList) return;
        
        personalQuestsList.innerHTML = '';
        
        if (!this.personalQuests || this.personalQuests.length === 0) {
            personalQuestsList.innerHTML = '<div class="empty-message">NO PERSONAL QUESTS YET</div>';
            return;
        }
        
        this.personalQuests.forEach(quest => {
            const questElement = document.createElement('div');
            questElement.className = `personal-quest-item ${quest.completed ? 'completed' : ''}`;
            
            questElement.innerHTML = `
                <div class="quest-info">
                    <div class="quest-title">${quest.name}</div>
                    <div class="quest-desc">${quest.description}</div>
                    <div class="quest-reward">+${quest.reward_xp} XP • +${quest.reward_coins} 💰</div>
                    <div class="quest-date">Created: ${quest.created_date}</div>
                </div>
                <div class="quest-actions">
                    ${quest.completed 
                        ? '<div class="quest-status completed">COMPLETED</div>' 
                        : `<button class="complete-quest-btn" onclick="app.completePersonalQuest(${quest.id})">COMPLETE</button>`
                    }
                    <button class="delete-quest-btn" onclick="app.deletePersonalQuest(${quest.id})">DELETE</button>
                </div>
            `;
            
            personalQuestsList.appendChild(questElement);
        });
    }
    
    async addPersonalQuest() {
        const questName = document.getElementById('newQuestName').value.trim();
        const questDescription = document.getElementById('newQuestDescription').value.trim();
        
        if (!questName) {
            this.showNotification('Quest name is required', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/add-personal-quest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    name: questName, 
                    description: questDescription 
                })
            });
            
            const result = await response.json();
            if (result.success) {
                document.getElementById('newQuestName').value = '';
                document.getElementById('newQuestDescription').value = '';
                await this.loadPersonalQuests();
                await this.loadQuests(); // Refresh quest count
                this.showNotification('Personal quest added!');
            } else {
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            console.error('Error adding personal quest:', error);
            this.showNotification('Failed to add quest', 'error');
        }
    }
    
    async completePersonalQuest(questId) {
        try {
            const response = await fetch('/api/complete-personal-quest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quest_id: questId })
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadPersonalQuests();
                await this.loadQuests(); // Refresh quest count
                await this.loadPlayerData();
                this.showNotification(`Quest completed! +${result.rewards.xp} XP +${result.rewards.coins} coins!`);
            } else {
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            console.error('Error completing personal quest:', error);
            this.showNotification('Failed to complete quest', 'error');
        }
    }
    
    async deletePersonalQuest(questId) {
        if (!confirm('Are you sure you want to delete this quest?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/delete-personal-quest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quest_id: questId })
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadPersonalQuests();
                await this.loadQuests(); // Refresh quest count
                this.showNotification('Quest deleted!');
            } else {
                this.showNotification(result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting personal quest:', error);
            this.showNotification('Failed to delete quest', 'error');
        }
    }

    renderLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        const currentRank = document.getElementById('currentRank');
        const totalPlayers = document.getElementById('totalPlayers');
        
        if (!leaderboardList || !this.leaderboard) return;
        
        // Update stats
        if (currentRank) currentRank.textContent = `#${this.leaderboard.current_player_position}`;
        if (totalPlayers) totalPlayers.textContent = this.leaderboard.total_players;
        
        leaderboardList.innerHTML = '';
        
        this.leaderboard.players.forEach((player, index) => {
            const isCurrentPlayer = player.name === this.playerData.name;
            const entryElement = document.createElement('div');
            entryElement.className = `leaderboard-entry ${isCurrentPlayer ? 'current-player' : ''} ${index < 3 ? 'top-three' : ''}`;
            
            let positionDisplay = '';
            if (index === 0) positionDisplay = '🥇';
            else if (index === 1) positionDisplay = '🥈';
            else if (index === 2) positionDisplay = '🥉';
            else positionDisplay = `#${player.position}`;
            
            entryElement.innerHTML = `
                <div class="position">${positionDisplay}</div>
                <div class="player-info">
                    <div class="player-name">${player.name} ${isCurrentPlayer ? '(YOU)' : ''}</div>
                    <div class="player-details">
                        <span class="level">LVL ${player.level}</span>
                        <span class="class">${player.class}</span>
                        <span class="rank rank-${player.rank.toLowerCase()}">${player.rank}</span>
                    </div>
                </div>
                <div class="player-stats">
                    <div class="experience">${player.total_experience.toLocaleString()} XP</div>
                    <div class="streak">${player.max_streak} Days</div>
                </div>
            `;
            
            leaderboardList.appendChild(entryElement);
        });
    }

    showLeaderboard() {
        this.loadLeaderboard();
        document.getElementById('quests').classList.remove('active');
        document.getElementById('leaderboard').classList.add('active');
    }

    hideLeaderboard() {
        document.getElementById('leaderboard').classList.remove('active');
        document.getElementById('quests').classList.add('active');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SoloLevelerApp();
});
