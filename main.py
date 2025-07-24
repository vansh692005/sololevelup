
from flask import Flask, render_template, jsonify, request
import json
import os
from datetime import datetime, timedelta
import random

app = Flask(__name__)

# File to store persistent data
DATA_FILE = 'game_data.json'

# Default game data structure
DEFAULT_GAME_DATA = {
    "player": {
        "name": "VANSH SHARMA",
        "level": 1,
        "current_xp": 0,
        "xp_to_next_level": 100,
        "class": "BEGINNER",
        "title": "NEWBIE",
        "rank": "E",
        "rank_name": "AWAKENED",
        "rank_score": 0,
        "points_to_next_rank": 200,
        "total_experience": 0,
        "stats": {
            "strength": 10,
            "agility": 10,
            "perception": 10,
            "vitality": 10,
            "intelligence": 10,
            "available_points": 0
        },
        "leaderboard_points": 0,
        "physical_damage_reduction": 0,
        "magical_damage_reduction": 0,
        "streak": 0,
        "max_streak": 0,
        "coins": 100,
        "energy": 100,
        "max_energy": 100
    },
    "daily_tasks": [
        {"name": "12 PUSHUPS", "completed": False, "progress": 0, "max": 12, "xp_reward": 25, "coin_reward": 10},
        {"name": "12 SITUPS", "completed": False, "progress": 0, "max": 12, "xp_reward": 25, "coin_reward": 10},
        {"name": "2KM OUTDOOR RUN", "completed": False, "progress": 0, "max": 2, "xp_reward": 50, "coin_reward": 20},
        {"name": "MEDITATE 15 MIN", "completed": False, "progress": 0, "max": 15, "xp_reward": 30, "coin_reward": 15}
    ],
    "timer": {"hours": 4, "minutes": 43, "seconds": 0},
    "last_reset": datetime.now().strftime("%Y-%m-%d"),
    "inventory": [
        {"name": "Health Potion", "quantity": 3, "type": "consumable", "effect": "Restores 50 HP"},
        {"name": "Energy Drink", "quantity": 2, "type": "consumable", "effect": "Restores 30 Energy"}
    ],
    "quests": {
        "strength_training": {"progress": 0, "max": 100, "completed": False, "reward_coins": 100, "reward_xp": 200},
        "intelligence": {"progress": 0, "max": 100, "completed": False, "reward_coins": 100, "reward_xp": 200},
        "discipline": {"progress": 0, "max": 100, "completed": False, "reward_coins": 150, "reward_xp": 250},
        "spiritual_training": {"progress": 0, "max": 100, "completed": False, "reward_coins": 120, "reward_xp": 220},
        "secret_quests": {"progress": 0, "max": 100, "completed": False, "reward_coins": 500, "reward_xp": 1000},
        "personal_quests": 0
    },
    "achievements": [
        {"name": "First Steps", "description": "Complete your first daily task", "unlocked": False, "reward_coins": 50},
        {"name": "Dedication", "description": "Maintain a 7-day streak", "unlocked": False, "reward_coins": 200},
        {"name": "Level Up", "description": "Reach level 5", "unlocked": False, "reward_coins": 100},
        {"name": "Quest Master", "description": "Complete 5 quests", "unlocked": False, "reward_coins": 300},
        {"name": "Unstoppable", "description": "Maintain a 30-day streak", "unlocked": False, "reward_coins": 1000}
    ],
    "shop": [
        {"name": "Health Potion", "price": 25, "type": "consumable", "effect": "Restores 50 HP"},
        {"name": "Energy Drink", "price": 20, "type": "consumable", "effect": "Restores 30 Energy"},
        {"name": "XP Booster", "price": 100, "type": "booster", "effect": "Double XP for next task"},
        {"name": "Stat Point", "price": 200, "type": "permanent", "effect": "Gain 1 available stat point"}
    ],
    "settings": {
        "notifications": True,
        "sound_effects": True,
        "dark_mode": True,
        "daily_reset_time": "00:00"
    }
}

def load_game_data():
    """Load game data from file or create default"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                data = json.load(f)
                # Check if daily reset is needed
                check_daily_reset(data)
                return data
        except (json.JSONDecodeError, KeyError):
            return DEFAULT_GAME_DATA.copy()
    return DEFAULT_GAME_DATA.copy()

def save_game_data(data):
    """Save game data to file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def check_daily_reset(data):
    """Check if daily tasks need to be reset"""
    today = datetime.now().strftime("%Y-%m-%d")
    if data.get("last_reset") != today:
        # Reset daily tasks
        for task in data["daily_tasks"]:
            if not task["completed"]:
                # Penalty for incomplete tasks
                data["player"]["streak"] = 0
            task["completed"] = False
            task["progress"] = 0
        
        # Reset timer
        data["timer"] = {"hours": 4, "minutes": 43, "seconds": 0}
        data["last_reset"] = today
        
        # Restore energy
        data["player"]["energy"] = data["player"]["max_energy"]
        
        save_game_data(data)

def calculate_level_from_xp(total_xp):
    """Calculate level and current XP from total experience"""
    level = 1
    xp_needed = 100
    current_xp = total_xp
    
    while current_xp >= xp_needed:
        current_xp -= xp_needed
        level += 1
        xp_needed = int(xp_needed * 1.2)  # Each level requires 20% more XP
    
    return level, current_xp, xp_needed

def award_experience(data, xp_amount):
    """Award XP and handle level ups"""
    data["player"]["total_experience"] += xp_amount
    old_level = data["player"]["level"]
    
    new_level, current_xp, xp_to_next = calculate_level_from_xp(data["player"]["total_experience"])
    
    data["player"]["level"] = new_level
    data["player"]["current_xp"] = current_xp
    data["player"]["xp_to_next_level"] = xp_to_next
    
    # Level up rewards
    if new_level > old_level:
        levels_gained = new_level - old_level
        data["player"]["stats"]["available_points"] += levels_gained * 2
        data["player"]["coins"] += levels_gained * 50
        update_class_and_title(data)
        check_achievements(data)

def calculate_rank_score(data):
    """Calculate rank score based on player progress"""
    player = data["player"]
    stats = player["stats"]
    
    # Calculate total stats (excluding available_points)
    total_stats = sum(value for key, value in stats.items() if key != "available_points")
    
    # Rank Score Calculation:
    # Level × 10 points
    # Total Stats × 2 points
    # Max Streak × 5 points
    # Total XP ÷ 100 points
    score = (
        player["level"] * 10 +
        total_stats * 2 +
        player["max_streak"] * 5 +
        player["total_experience"] // 100
    )
    
    return score

def get_rank_from_score(score):
    """Get rank letter and name based on score"""
    if score >= 1000:
        return "S", "SHADOW MONARCH"
    elif score >= 800:
        return "A", "ELITE HUNTER"
    elif score >= 600:
        return "B", "SKILLED HUNTER"
    elif score >= 400:
        return "C", "TRAINED HUNTER"
    elif score >= 200:
        return "D", "NOVICE HUNTER"
    else:
        return "E", "AWAKENED"

def update_rank(data):
    """Update player rank based on current progress"""
    score = calculate_rank_score(data)
    rank_letter, rank_name = get_rank_from_score(score)
    
    data["player"]["rank"] = rank_letter
    data["player"]["rank_name"] = rank_name
    data["player"]["rank_score"] = score
    
    # Calculate points to next rank
    next_thresholds = [200, 400, 600, 800, 1000]
    points_to_next = None
    
    for threshold in next_thresholds:
        if score < threshold:
            points_to_next = threshold - score
            break
    
    data["player"]["points_to_next_rank"] = points_to_next

def update_class_and_title(data):
    """Update player class and title based on level and stats"""
    level = data["player"]["level"]
    stats = data["player"]["stats"]
    
    # Update class based on highest stat
    highest_stat = max(stats, key=lambda x: stats[x] if x != "available_points" else 0)
    
    if level >= 20:
        class_map = {
            "strength": "BERSERKER",
            "intelligence": "ARCHMAGE", 
            "agility": "ASSASSIN",
            "vitality": "GUARDIAN",
            "perception": "HUNTER"
        }
        data["player"]["class"] = class_map.get(highest_stat, "WARRIOR")
    elif level >= 10:
        class_map = {
            "strength": "WARRIOR",
            "intelligence": "MAGE",
            "agility": "ROGUE", 
            "vitality": "TANK",
            "perception": "SCOUT"
        }
        data["player"]["class"] = class_map.get(highest_stat, "FIGHTER")
    
    # Update title based on achievements
    if data["player"]["max_streak"] >= 30:
        data["player"]["title"] = "UNSTOPPABLE"
    elif data["player"]["max_streak"] >= 14:
        data["player"]["title"] = "DEDICATED"
    elif data["player"]["level"] >= 15:
        data["player"]["title"] = "VETERAN"
    elif data["player"]["level"] >= 5:
        data["player"]["title"] = "RISING STAR"
    
    # Update rank
    update_rank(data)

def check_achievements(data):
    """Check and unlock achievements"""
    achievements = data["achievements"]
    player = data["player"]
    
    # First Steps
    if not achievements[0]["unlocked"] and any(task["completed"] for task in data["daily_tasks"]):
        achievements[0]["unlocked"] = True
        player["coins"] += achievements[0]["reward_coins"]
    
    # Dedication (7-day streak)
    if not achievements[1]["unlocked"] and player["streak"] >= 7:
        achievements[1]["unlocked"] = True
        player["coins"] += achievements[1]["reward_coins"]
    
    # Level Up (level 5)
    if not achievements[2]["unlocked"] and player["level"] >= 5:
        achievements[2]["unlocked"] = True
        player["coins"] += achievements[2]["reward_coins"]
    
    # Quest Master (5 completed quests)
    completed_quests = sum(1 for quest in data["quests"].values() if isinstance(quest, dict) and quest.get("completed", False))
    if not achievements[3]["unlocked"] and completed_quests >= 5:
        achievements[3]["unlocked"] = True
        player["coins"] += achievements[3]["reward_coins"]
    
    # Unstoppable (30-day streak)
    if not achievements[4]["unlocked"] and player["streak"] >= 30:
        achievements[4]["unlocked"] = True
        player["coins"] += achievements[4]["reward_coins"]

# Initialize game data
game_data = load_game_data()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/player')
def get_player():
    return jsonify(game_data["player"])

@app.route('/api/daily-tasks')
def get_daily_tasks():
    total_seconds = game_data["timer"]["hours"] * 3600 + game_data["timer"]["minutes"] * 60 + game_data["timer"]["seconds"]
    timer_string = f"{game_data['timer']['hours']:02d}:{game_data['timer']['minutes']:02d}:{game_data['timer']['seconds']:02d}"
    
    return jsonify({
        "tasks": game_data["daily_tasks"],
        "timer": timer_string,
        "timer_seconds": total_seconds,
        "streak": game_data["player"]["streak"]
    })

@app.route('/api/inventory')
def get_inventory():
    return jsonify(game_data["inventory"])

@app.route('/api/quests')
def get_quests():
    return jsonify(game_data["quests"])

@app.route('/api/achievements')
def get_achievements():
    return jsonify(game_data["achievements"])

@app.route('/api/shop')
def get_shop():
    return jsonify(game_data["shop"])

@app.route('/api/complete-task', methods=['POST'])
def complete_task():
    task_index = request.json.get('task_index')
    if 0 <= task_index < len(game_data["daily_tasks"]):
        task = game_data["daily_tasks"][task_index]
        if not task["completed"]:
            task["completed"] = True
            task["progress"] = task["max"]
            
            # Award XP and coins
            award_experience(game_data, task["xp_reward"])
            game_data["player"]["coins"] += task["coin_reward"]
            
            # Check if all tasks completed for streak
            if all(t["completed"] for t in game_data["daily_tasks"]):
                game_data["player"]["streak"] += 1
                game_data["player"]["max_streak"] = max(game_data["player"]["max_streak"], game_data["player"]["streak"])
            
            # Update quest progress
            if "PUSHUPS" in task["name"] or "SITUPS" in task["name"]:
                game_data["quests"]["strength_training"]["progress"] = min(100, game_data["quests"]["strength_training"]["progress"] + 10)
            elif "MEDITATE" in task["name"]:
                game_data["quests"]["spiritual_training"]["progress"] = min(100, game_data["quests"]["spiritual_training"]["progress"] + 15)
            elif "RUN" in task["name"]:
                game_data["quests"]["discipline"]["progress"] = min(100, game_data["quests"]["discipline"]["progress"] + 20)
            
            check_achievements(game_data)
            save_game_data(game_data)
    
    return jsonify({"success": True})

@app.route('/api/allocate-stat', methods=['POST'])
def allocate_stat():
    stat_name = request.json.get('stat_name')
    if stat_name in game_data["player"]["stats"] and game_data["player"]["stats"]["available_points"] > 0:
        game_data["player"]["stats"][stat_name] += 1
        game_data["player"]["stats"]["available_points"] -= 1
        
        # Update damage reduction based on stats
        game_data["player"]["physical_damage_reduction"] = int(game_data["player"]["stats"]["vitality"] * 0.5)
        game_data["player"]["magical_damage_reduction"] = int(game_data["player"]["stats"]["intelligence"] * 0.3)
        
        update_class_and_title(game_data)
        save_game_data(game_data)
    
    return jsonify({"success": True})

@app.route('/api/buy-item', methods=['POST'])
def buy_item():
    item_name = request.json.get('item_name')
    shop_item = next((item for item in game_data["shop"] if item["name"] == item_name), None)
    
    if shop_item and game_data["player"]["coins"] >= shop_item["price"]:
        game_data["player"]["coins"] -= shop_item["price"]
        
        if shop_item["type"] == "consumable":
            # Add to inventory
            existing_item = next((item for item in game_data["inventory"] if item["name"] == item_name), None)
            if existing_item:
                existing_item["quantity"] += 1
            else:
                game_data["inventory"].append({
                    "name": item_name,
                    "quantity": 1,
                    "type": shop_item["type"],
                    "effect": shop_item["effect"]
                })
        elif shop_item["type"] == "permanent":
            if item_name == "Stat Point":
                game_data["player"]["stats"]["available_points"] += 1
        
        save_game_data(game_data)
        return jsonify({"success": True})
    
    return jsonify({"success": False, "error": "Insufficient coins"})

@app.route('/api/use-item', methods=['POST'])
def use_item():
    item_name = request.json.get('item_name')
    item = next((item for item in game_data["inventory"] if item["name"] == item_name and item["quantity"] > 0), None)
    
    if item:
        item["quantity"] -= 1
        if item["quantity"] == 0:
            game_data["inventory"].remove(item)
        
        # Apply item effects
        if item_name == "Health Potion":
            # Heal effect (for future combat system)
            pass
        elif item_name == "Energy Drink":
            game_data["player"]["energy"] = min(game_data["player"]["max_energy"], game_data["player"]["energy"] + 30)
        
        save_game_data(game_data)
        return jsonify({"success": True})
    
    return jsonify({"success": False, "error": "Item not available"})

@app.route('/api/update-timer', methods=['POST'])
def update_timer():
    """Update countdown timer"""
    if game_data["timer"]["seconds"] > 0:
        game_data["timer"]["seconds"] -= 1
    elif game_data["timer"]["minutes"] > 0:
        game_data["timer"]["minutes"] -= 1
        game_data["timer"]["seconds"] = 59
    elif game_data["timer"]["hours"] > 0:
        game_data["timer"]["hours"] -= 1
        game_data["timer"]["minutes"] = 59
        game_data["timer"]["seconds"] = 59
    
    save_game_data(game_data)
    return jsonify({"success": True})

@app.route('/api/stats')
def get_stats():
    """Get comprehensive player statistics"""
    return jsonify({
        "total_tasks_completed": sum(1 for task in game_data["daily_tasks"] if task["completed"]),
        "total_experience": game_data["player"]["total_experience"],
        "highest_streak": game_data["player"]["max_streak"],
        "achievements_unlocked": sum(1 for achievement in game_data["achievements"] if achievement["unlocked"]),
        "quests_completed": sum(1 for quest in game_data["quests"].values() if isinstance(quest, dict) and quest.get("completed", False))
    })

# Legacy endpoint for compatibility with existing frontend
@app.route('/api/daily_tasks')
def get_daily_tasks_legacy():
    return get_daily_tasks()

# Legacy endpoint for compatibility with existing frontend  
@app.route('/api/complete_task', methods=['POST'])
def complete_task_legacy():
    task_id = request.json.get('task_id')
    if task_id:
        # Convert task_id to task_index (assuming 1-based to 0-based)
        task_index = task_id - 1
        request.json['task_index'] = task_index
    return complete_task()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
