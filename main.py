
from flask import Flask, render_template, jsonify, request
import json
from datetime import datetime, timedelta

app = Flask(__name__)

# Game data storage (in a real app, this would be a database)
game_data = {
    'player': {
        'name': 'VANSH SHARMA',
        'level': 5,
        'class': 'MAGE',
        'title': 'WOLF SLAYER',
        'rank': 'E',
        'stats': {
            'str': 14.75,
            'agi': 10,
            'vit': 10,
            'int': 10,
            'per': 10
        },
        'ability_points': 0,
        'leaderboard_points': 10.0625,
        'physical_damage_reduction': 5,
        'magical_damage_reduction': 4
    },
    'daily_tasks': [
        {'id': 1, 'name': '12 PUSHUPS [0/12]', 'completed': False, 'progress': 0, 'total': 12},
        {'id': 2, 'name': '12 SITUPS [0/12]', 'completed': False, 'progress': 0, 'total': 12},
        {'id': 3, 'name': '2 OUTDOOR RUN [0/2]', 'completed': False, 'progress': 0, 'total': 2},
        {'id': 4, 'name': 'MEDITATE 15 MIN [0/15]', 'completed': False, 'progress': 0, 'total': 15}
    ],
    'streak': 0,
    'timer_end': None,
    'inventory': [],
    'quests': []
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/player')
def get_player():
    return jsonify(game_data['player'])

@app.route('/api/daily_tasks')
def get_daily_tasks():
    # Calculate time remaining for daily reset
    now = datetime.now()
    tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    time_remaining = tomorrow - now
    
    return jsonify({
        'tasks': game_data['daily_tasks'],
        'streak': game_data['streak'],
        'time_remaining': str(time_remaining).split('.')[0]
    })

@app.route('/api/complete_task', methods=['POST'])
def complete_task():
    task_id = request.json.get('task_id')
    
    for task in game_data['daily_tasks']:
        if task['id'] == task_id:
            task['completed'] = not task['completed']
            if task['completed']:
                task['progress'] = task['total']
            else:
                task['progress'] = 0
            break
    
    # Check if all tasks completed for streak
    all_completed = all(task['completed'] for task in game_data['daily_tasks'])
    if all_completed:
        game_data['streak'] += 1
    
    return jsonify({'success': True})

@app.route('/api/inventory')
def get_inventory():
    return jsonify(game_data['inventory'])

@app.route('/api/quests')
def get_quests():
    return jsonify(game_data['quests'])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
