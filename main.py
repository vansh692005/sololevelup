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
    "daily_tasks": [{
        "name": "12 PUSHUPS",
        "completed": False,
        "progress": 0,
        "max": 12,
        "xp_reward": 25,
        "coin_reward": 10
    }, {
        "name": "12 SITUPS",
        "completed": False,
        "progress": 0,
        "max": 12,
        "xp_reward": 25,
        "coin_reward": 10
    }, {
        "name": "2KM OUTDOOR RUN",
        "completed": False,
        "progress": 0,
        "max": 2,
        "xp_reward": 50,
        "coin_reward": 20
    }, {
        "name": "MEDITATE 15 MIN",
        "completed": False,
        "progress": 0,
        "max": 15,
        "xp_reward": 30,
        "coin_reward": 15
    }],
    "timer": {
        "hours": 4,
        "minutes": 43,
        "seconds": 0
    },
    "last_reset":
    datetime.now().strftime("%Y-%m-%d"),
    "inventory": [{
        "name": "Health Potion",
        "quantity": 3,
        "type": "consumable",
        "effect": "Restores 50 HP"
    }, {
        "name": "Energy Drink",
        "quantity": 2,
        "type": "consumable",
        "effect": "Restores 30 Energy"
    }],
    "quests": {
        "strength_training": {
            "progress": 0,
            "max": 100,
            "completed": False,
            "reward_coins": 100,
            "reward_xp": 200
        },
        "intelligence": {
            "progress": 0,
            "max": 100,
            "completed": False,
            "reward_coins": 100,
            "reward_xp": 200
        },
        "discipline": {
            "progress": 0,
            "max": 100,
            "completed": False,
            "reward_coins": 150,
            "reward_xp": 250
        },
        "spiritual_training": {
            "progress": 0,
            "max": 100,
            "completed": False,
            "reward_coins": 120,
            "reward_xp": 220
        },
        "secret_quests": {
            "progress": 0,
            "max": 100,
            "completed": False,
            "reward_coins": 500,
            "reward_xp": 1000
        },
        "personal_quests": 0
    },
    "personal_quest_list": [],
    "achievements": [{
        "name": "First Steps",
        "description": "Complete your first daily task",
        "unlocked": False,
        "reward_coins": 50
    }, {
        "name": "Dedication",
        "description": "Maintain a 7-day streak",
        "unlocked": False,
        "reward_coins": 200
    }, {
        "name": "Level Up",
        "description": "Reach level 5",
        "unlocked": False,
        "reward_coins": 100
    }, {
        "name": "Quest Master",
        "description": "Complete 5 quests",
        "unlocked": False,
        "reward_coins": 300
    }, {
        "name": "Unstoppable",
        "description": "Maintain a 30-day streak",
        "unlocked": False,
        "reward_coins": 1000
    }],
    "shop": [{
        "name": "Health Potion",
        "price": 25,
        "type": "consumable",
        "effect": "Restores 50 HP"
    }, {
        "name": "Energy Drink",
        "price": 20,
        "type": "consumable",
        "effect": "Restores 30 Energy"
    }, {
        "name": "XP Booster",
        "price": 100,
        "type": "booster",
        "effect": "Double XP for next task"
    }, {
        "name": "Stat Point",
        "price": 200,
        "type": "permanent",
        "effect": "Gain 1 available stat point"
    }],
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
        # Check if all tasks were completed yesterday
        all_completed = all(task["completed"] for task in data["daily_tasks"])

        # Reset streak if not all tasks completed
        if not all_completed:
            data["player"]["streak"] = 0

        # Calculate progressive difficulty based on streak
        streak = data["player"]["streak"]
        pushup_count = 12 + (streak * 2)  # Start at 12, increase by 2 each day
        situp_count = 12 + (streak * 2)  # Start at 12, increase by 2 each day

        # Reset daily tasks with progressive difficulty
        for task in data["daily_tasks"]:
            task["completed"] = False
            task["progress"] = 0

            # Update pushups and situps with progressive difficulty
            if "PUSHUPS" in task["name"]:
                task["name"] = f"{pushup_count} PUSHUPS"
                task["max"] = pushup_count
            elif "SITUPS" in task["name"]:
                task["name"] = f"{situp_count} SITUPS"
                task["max"] = situp_count

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

    new_level, current_xp, xp_to_next = calculate_level_from_xp(
        data["player"]["total_experience"])

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
    total_stats = sum(value for key, value in stats.items()
                      if key != "available_points")

    # Rank Score Calculation:
    # Level × 10 points
    # Total Stats × 2 points
    # Max Streak × 5 points
    # Total XP ÷ 100 points
    score = (player["level"] * 10 + total_stats * 2 +
             player["max_streak"] * 5 + player["total_experience"] // 100)

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
    highest_stat = max(stats,
                       key=lambda x: stats[x]
                       if x != "available_points" else 0)

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
    if not achievements[0]["unlocked"] and any(
            task["completed"] for task in data["daily_tasks"]):
        achievements[0]["unlocked"] = True
        # Don't auto-award coins anymore - require manual claiming

    # Dedication (7-day streak)
    if not achievements[1]["unlocked"] and player["streak"] >= 7:
        achievements[1]["unlocked"] = True
        # Don't auto-award coins anymore - require manual claiming

    # Level Up (level 5)
    if not achievements[2]["unlocked"] and player["level"] >= 5:
        achievements[2]["unlocked"] = True
        # Don't auto-award coins anymore - require manual claiming

    # Quest Master (5 completed quests)
    completed_quests = sum(
        1 for quest in data["quests"].values()
        if isinstance(quest, dict) and quest.get("completed", False))
    if not achievements[3]["unlocked"] and completed_quests >= 5:
        achievements[3]["unlocked"] = True
        # Don't auto-award coins anymore - require manual claiming

    # Unstoppable (30-day streak)
    if not achievements[4]["unlocked"] and player["streak"] >= 30:
        achievements[4]["unlocked"] = True
        # Don't auto-award coins anymore - require manual claiming


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
    total_seconds = game_data["timer"]["hours"] * 3600 + game_data["timer"][
        "minutes"] * 60 + game_data["timer"]["seconds"]
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
                game_data["player"]["max_streak"] = max(
                    game_data["player"]["max_streak"],
                    game_data["player"]["streak"])

            # Update quest progress
            if "PUSHUPS" in task["name"] or "SITUPS" in task["name"]:
                game_data["quests"]["strength_training"]["progress"] = min(
                    100,
                    game_data["quests"]["strength_training"]["progress"] + 10)
            elif "MEDITATE" in task["name"]:
                game_data["quests"]["spiritual_training"]["progress"] = min(
                    100,
                    game_data["quests"]["spiritual_training"]["progress"] + 15)
            elif "RUN" in task["name"]:
                game_data["quests"]["discipline"]["progress"] = min(
                    100, game_data["quests"]["discipline"]["progress"] + 20)

            check_achievements(game_data)
            save_game_data(game_data)

    return jsonify({"success": True})


@app.route('/api/allocate-stat', methods=['POST'])
def allocate_stat():
    stat_name = request.json.get('stat_name')
    if stat_name in game_data["player"]["stats"] and game_data["player"][
            "stats"]["available_points"] > 0:
        game_data["player"]["stats"][stat_name] += 1
        game_data["player"]["stats"]["available_points"] -= 1

        # Update damage reduction based on stats
        game_data["player"]["physical_damage_reduction"] = int(
            game_data["player"]["stats"]["vitality"] * 0.5)
        game_data["player"]["magical_damage_reduction"] = int(
            game_data["player"]["stats"]["intelligence"] * 0.3)

        update_class_and_title(game_data)
        save_game_data(game_data)

    return jsonify({"success": True})


@app.route('/api/buy-item', methods=['POST'])
def buy_item():
    item_name = request.json.get('item_name')
    shop_item = next(
        (item for item in game_data["shop"] if item["name"] == item_name),
        None)

    if shop_item and game_data["player"]["coins"] >= shop_item["price"]:
        game_data["player"]["coins"] -= shop_item["price"]

        if shop_item["type"] == "consumable":
            # Add to inventory
            existing_item = next((item for item in game_data["inventory"]
                                  if item["name"] == item_name), None)
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
    item = next((item for item in game_data["inventory"]
                 if item["name"] == item_name and item["quantity"] > 0), None)

    if item:
        item["quantity"] -= 1
        if item["quantity"] == 0:
            game_data["inventory"].remove(item)

        # Apply item effects
        if item_name == "Health Potion":
            # Heal effect (for future combat system)
            pass
        elif item_name == "Energy Drink":
            game_data["player"]["energy"] = min(
                game_data["player"]["max_energy"],
                game_data["player"]["energy"] + 30)

        save_game_data(game_data)
        return jsonify({"success": True})

    return jsonify({"success": False, "error": "Item not available"})


@app.route('/api/claim-achievement', methods=['POST'])
def claim_achievement():
    achievement_index = request.json.get('achievement_index')
    if 0 <= achievement_index < len(game_data["achievements"]):
        achievement = game_data["achievements"][achievement_index]
        if achievement["unlocked"] and not achievement.get("claimed", False):
            # Mark as claimed and award coins
            achievement["claimed"] = True
            game_data["player"]["coins"] += achievement["reward_coins"]

            save_game_data(game_data)
            return jsonify({
                "success": True,
                "coins_awarded": achievement["reward_coins"]
            })
        else:
            return jsonify({
                "success": False,
                "error": "Achievement not available for claiming"
            })

    return jsonify({"success": False, "error": "Invalid achievement"})


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


@app.route('/api/personal-quests')
def get_personal_quests():
    """Get personal quests"""
    if "personal_quest_list" not in game_data:
        game_data["personal_quest_list"] = []
    return jsonify(game_data["personal_quest_list"])


@app.route('/api/add-personal-quest', methods=['POST'])
def add_personal_quest():
    """Add a new personal quest"""
    quest_data = request.json
    quest_name = quest_data.get('name', '').strip()
    quest_description = quest_data.get('description', '').strip()

    if not quest_name:
        return jsonify({"success": False, "error": "Quest name is required"})

    if "personal_quest_list" not in game_data:
        game_data["personal_quest_list"] = []

    new_quest = {
        "id": len(game_data["personal_quest_list"]) + 1,
        "name": quest_name,
        "description": quest_description,
        "completed": False,
        "created_date": datetime.now().strftime("%Y-%m-%d"),
        "reward_xp": 100,
        "reward_coins": 50
    }

    game_data["personal_quest_list"].append(new_quest)
    game_data["quests"]["personal_quests"] = len(
        [q for q in game_data["personal_quest_list"] if not q["completed"]])

    save_game_data(game_data)
    return jsonify({"success": True, "quest": new_quest})


@app.route('/api/complete-personal-quest', methods=['POST'])
def complete_personal_quest():
    """Complete a personal quest"""
    quest_id = request.json.get('quest_id')

    if "personal_quest_list" not in game_data:
        return jsonify({"success": False, "error": "No personal quests found"})

    quest = next(
        (q for q in game_data["personal_quest_list"] if q["id"] == quest_id),
        None)

    if not quest:
        return jsonify({"success": False, "error": "Quest not found"})

    if quest["completed"]:
        return jsonify({"success": False, "error": "Quest already completed"})

    quest["completed"] = True
    quest["completion_date"] = datetime.now().strftime("%Y-%m-%d")

    # Award rewards
    award_experience(game_data, quest["reward_xp"])
    game_data["player"]["coins"] += quest["reward_coins"]

    # Update personal quests count
    game_data["quests"]["personal_quests"] = len(
        [q for q in game_data["personal_quest_list"] if not q["completed"]])

    check_achievements(game_data)
    save_game_data(game_data)

    return jsonify({
        "success": True,
        "rewards": {
            "xp": quest["reward_xp"],
            "coins": quest["reward_coins"]
        }
    })


@app.route('/api/delete-personal-quest', methods=['POST'])
def delete_personal_quest():
    """Delete a personal quest"""
    quest_id = request.json.get('quest_id')

    if "personal_quest_list" not in game_data:
        return jsonify({"success": False, "error": "No personal quests found"})

    quest_index = next((i
                        for i, q in enumerate(game_data["personal_quest_list"])
                        if q["id"] == quest_id), None)

    if quest_index is None:
        return jsonify({"success": False, "error": "Quest not found"})

    game_data["personal_quest_list"].pop(quest_index)

    # Update personal quests count
    game_data["quests"]["personal_quests"] = len(
        [q for q in game_data["personal_quest_list"] if not q["completed"]])

    save_game_data(game_data)
    return jsonify({"success": True})


@app.route('/api/complete-quest', methods=['POST'])
def complete_quest():
    """Complete a major quest"""
    quest_name = request.json.get('quest_name')

    if quest_name in game_data["quests"] and isinstance(
            game_data["quests"][quest_name], dict):
        quest = game_data["quests"][quest_name]
        if quest["progress"] >= quest["max"] and not quest["completed"]:
            quest["completed"] = True

            # Award rewards
            award_experience(game_data, quest["reward_xp"])
            game_data["player"]["coins"] += quest["reward_coins"]

            check_achievements(game_data)
            save_game_data(game_data)

            return jsonify({
                "success": True,
                "rewards": {
                    "xp": quest["reward_xp"],
                    "coins": quest["reward_coins"]
                }
            })

    return jsonify({
        "success": False,
        "error": "Quest not ready for completion"
    })


@app.route('/api/stats')
def get_stats():
    """Get comprehensive player statistics"""
    return jsonify({
        "total_tasks_completed":
        sum(1 for task in game_data["daily_tasks"] if task["completed"]),
        "total_experience":
        game_data["player"]["total_experience"],
        "highest_streak":
        game_data["player"]["max_streak"],
        "achievements_unlocked":
        sum(1 for achievement in game_data["achievements"]
            if achievement["unlocked"]),
        "quests_completed":
        sum(1 for quest in game_data["quests"].values()
            if isinstance(quest, dict) and quest.get("completed", False))
    })


@app.route('/api/leaderboard')
def get_leaderboard():
    """Get leaderboard data with top players"""
    # For demo purposes, create sample leaderboard data
    # In a real app, this would query a database of all players
    current_player = game_data["player"]

    # Create sample players for demonstration
    sample_players = [{
        "name": current_player["name"],
        "level": current_player["level"],
        "total_experience": current_player["total_experience"],
        "rank": current_player["rank"],
        "class": current_player["class"],
        "max_streak": current_player["max_streak"],
        "rank_score": calculate_rank_score(game_data)
    }]

    # Add some sample competitors
    competitors = [{
        "name": "SHADOW KING",
        "level": 25,
        "total_experience": 15000,
        "rank": "S",
        "class": "ARCHMAGE",
        "max_streak": 45,
        "rank_score": 1250
    }, {
        "name": "LIGHTNING HUNTER",
        "level": 22,
        "total_experience": 12000,
        "rank": "A",
        "class": "ASSASSIN",
        "max_streak": 35,
        "rank_score": 980
    }, {
        "name": "IRON FIST",
        "level": 20,
        "total_experience": 10000,
        "rank": "A",
        "class": "BERSERKER",
        "max_streak": 30,
        "rank_score": 850
    }, {
        "name": "MYSTIC SAGE",
        "level": 18,
        "total_experience": 8500,
        "rank": "B",
        "class": "MAGE",
        "max_streak": 28,
        "rank_score": 720
    }, {
        "name": "STORM BLADE",
        "level": 16,
        "total_experience": 7000,
        "rank": "B",
        "class": "WARRIOR",
        "max_streak": 25,
        "rank_score": 650
    }, {
        "name": "VOID WALKER",
        "level": 14,
        "total_experience": 5500,
        "rank": "C",
        "class": "ROGUE",
        "max_streak": 20,
        "rank_score": 580
    }, {
        "name": "EARTH GUARDIAN",
        "level": 12,
        "total_experience": 4000,
        "rank": "C",
        "class": "TANK",
        "max_streak": 15,
        "rank_score": 450
    }, {
        "name": "WIND RUNNER",
        "level": 10,
        "total_experience": 3000,
        "rank": "D",
        "class": "SCOUT",
        "max_streak": 12,
        "rank_score": 350
    }, {
        "name": "FIRE STARTER",
        "level": 8,
        "total_experience": 2000,
        "rank": "D",
        "class": "FIGHTER",
        "max_streak": 10,
        "rank_score": 280
    }, {
        "name": "ICE BREAKER",
        "level": 6,
        "total_experience": 1200,
        "rank": "E",
        "class": "BEGINNER",
        "max_streak": 8,
        "rank_score": 180
    }]

    # Add current player to the list
    all_players = sample_players + competitors

    # Sort by total experience (descending)
    all_players.sort(key=lambda x: x["total_experience"], reverse=True)

    # Add position numbers
    for i, player in enumerate(all_players):
        player["position"] = i + 1

    # Find current player position
    current_player_position = next(
        (p["position"]
         for p in all_players if p["name"] == current_player["name"]), 1)

    return jsonify({
        "players": all_players[:10],  # Top 10
        "current_player_position": current_player_position,
        "total_players": len(all_players)
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
