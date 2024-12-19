from flask import Flask, render_template, request, redirect, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_migrate import Migrate

app = Flask(__name__)

# Configuración de la aplicación y base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///C:/Users/Marin/Desktop/onepiece_web_app/app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'tu_clave_secreta'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # Tiempo de sesión: 1 hora

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
migrate = Migrate(app, db)

# Redirigir al login si no está autenticado
login_manager.login_view = 'login'

# Middleware para evitar caché
@app.after_request
def add_no_cache_headers(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, public, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Modelos de la base de datos
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(150), nullable=False)

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    card_id = db.Column(db.Integer, nullable=False)
    option = db.Column(db.String(10), nullable=False)
    is_owned = db.Column(db.Boolean, default=False)
    repeat_count = db.Column(db.Integer, default=0)

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

@app.before_request
def make_session_permanent():
    session.permanent = True

@app.route('/')
@app.route('/<option>')
@login_required
def index(option='op01'):
    valid_options = ['op01', 'op02', 'op03', 'op04', 'op05', 'op06', 'op07', 'op08', 'don']
    if option not in valid_options:
        option = 'op01'

    def generate_cards(option):
        cards = []
        for i in range(1, 155):
            db_card = Card.query.filter_by(user_id=current_user.id, card_id=i, option=option).first()
            cards.append({
                'option': option,
                'url': f"/static/images/{option.upper()}/card{i}.jpeg",
                'blur': not db_card.is_owned if db_card else True,
                'count': db_card.repeat_count if db_card else 0
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
    session.clear()  # Limpiar la sesión
    return redirect('/login')

@app.route('/guardar', methods=['POST'])
@login_required
def guardar():
    state = request.json
    for s in state:
        card = Card.query.filter_by(user_id=current_user.id, card_id=s['index'], option=s['option']).first()
        if not card:
            card = Card(user_id=current_user.id, card_id=s['index'], option=s['option'], is_owned=not s['blur'], repeat_count=s['count'])
        else:
            card.is_owned = not s['blur']
            card.repeat_count = s['count']
        db.session.add(card)
    db.session.commit()
    return jsonify({'message': 'Estado guardado correctamente'})

@app.route('/get_cards', methods=['GET'])
@login_required
def get_cards():
    option = request.args.get('option', 'op01')
    cards = Card.query.filter_by(user_id=current_user.id, option=option).all()
    card_data = [{'card_id': c.card_id, 'is_owned': c.is_owned, 'repeat_count': c.repeat_count} for c in cards]
    return jsonify(card_data)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
