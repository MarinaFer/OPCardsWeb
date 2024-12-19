from flask import Flask, render_template, request, redirect, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import os

app = Flask(__name__)

# Configuración de la aplicación y base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'postgresql://usersdb_j2lf_user:PGJFYHL6tXKzrZsN4a50j9ntfsU33kLW@dpg-cti4pf56l47c738f9b40-a.frankfurt-postgres.render.com/usersdb_j2lf'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'tu_clave_secreta'

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)

# Modelos de la base de datos
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(150), nullable=False)

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    card_id = db.Column(db.Integer, nullable=False)
    is_owned = db.Column(db.Boolean, default=False)
    repeat_count = db.Column(db.Integer, default=0)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
@app.route('/<option>')
def index(option='op01'):
    if not current_user.is_authenticated:
        return redirect('/login')

    valid_options = ['op01', 'op02', 'op03', 'op04', 'op05', 'op06', 'op07', 'op08', 'don']
    if option not in valid_options:
        option = 'op01'

    def generate_cards(option):
        cards = []
        for i in range(1, 155):
            cards.append({
                'option': option,
                'url': f"/static/images/{option.upper()}/card{i}.jpeg",
                'blur': False,
                'count': 0
            })
        return cards

    cards = generate_cards(option)
    title_image = f"/static/images/MENU/T{option.upper()}.png" if option != 'don' else "/static/images/MENU/TDON.png"
    logout_option = {'url': '/logout', 'name': 'Cerrar sesión'}
    return render_template('index.html', cards=cards, option=option, title_image=title_image, logout_option=logout_option)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return redirect('/login')
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        user = User.query.filter_by(username=username).first()
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user)
            return jsonify({'message': 'Inicio de sesión exitoso'})
        return jsonify({'error': 'Usuario o contraseña incorrectos'}), 401
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/login')

@app.route('/guardar', methods=['POST'])
@login_required
def guardar():
    state = request.json
    for s in state:
        card = Card.query.filter_by(user_id=current_user.id, card_id=s['index']).first()
        if not card:
            card = Card(user_id=current_user.id, card_id=s['index'], is_owned=not s['blur'], repeat_count=s['count'])
        else:
            card.is_owned = not s['blur']
            card.repeat_count = s['count']
        db.session.add(card)
    db.session.commit()
    return jsonify({'message': 'Estado guardado correctamente'})

@app.route('/get_cards', methods=['GET'])
@login_required
def get_cards():
    cards = Card.query.filter_by(user_id=current_user.id).all()
    card_data = [{'card_id': c.card_id, 'is_owned': c.is_owned, 'repeat_count': c.repeat_count} for c in cards]
    return jsonify(card_data)

# Crear las tablas si no existen (temporalmente, para inicializar la base de datos)
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
