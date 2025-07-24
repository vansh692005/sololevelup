
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
        } catch (error) {
            console.error('Error loading quests:', error);
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
        const questCards = document.querySelectorAll('.quest-card');
        
        questCards.forEach(card => {
            const questName = card.querySelector('.quest-name').textContent.toLowerCase();
            const progressBar = card.querySelector('.progress');
            
            if (questName.includes('strength') && this.quests.strength_training) {
                const progress = (this.quests.strength_training.progress / this.quests.strength_training.max) * 100;
                if (progressBar) progressBar.style.width = `${progress}%`;
            } else if (questName.includes('intelligence') && this.quests.intelligence) {
                const progress = (this.quests.intelligence.progress / this.quests.intelligence.max) * 100;
                if (progressBar) progressBar.style.width = `${progress}%`;
            } else if (questName.includes('discipline') && this.quests.discipline) {
                const progress = (this.quests.discipline.progress / this.quests.discipline.max) * 100;
                if (progressBar) progressBar.style.width = `${progress}%`;
            } else if (questName.includes('spiritual') && this.quests.spiritual_training) {
                const progress = (this.quests.spiritual_training.progress / this.quests.spiritual_training.max) * 100;
                if (progressBar) progressBar.style.width = `${progress}%`;
            } else if (questName.includes('secret') && this.quests.secret_quests) {
                const progress = (this.quests.secret_quests.progress / this.quests.secret_quests.max) * 100;
                if (progressBar) progressBar.style.width = `${progress}%`;
            }
        });
        
        // Update personal quests count
        const questCount = document.querySelector('.quest-count');
        if (questCount && this.quests.personal_quests !== undefined) {
            questCount.textContent = `${this.quests.personal_quests} QUESTS REMAINING`;
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
        
        this.achievements.forEach(achievement => {
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            achievementElement.innerHTML = `
                <div class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                    <div class="achievement-reward">Reward: 💰 ${achievement.reward_coins}</div>
                </div>
                <div class="achievement-status">${achievement.unlocked ? 'UNLOCKED' : 'LOCKED'}</div>
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
                this.showNotification('Task completed! +XP +Coins');
                this.addCompletionEffect();
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SoloLevelerApp();
});
