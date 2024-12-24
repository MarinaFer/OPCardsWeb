// scriptGeneral.js actualizado

// Objeto para mantener el estado de cada carta por opción
var cardState = {
    'op01': {},
    'op02': {},
    'don': {}
};

// Variable para almacenar la referencia del contenedor de información de la carta
var cardInfoContainer = null;

// Función para manejar el clic en una carta para cambiar el efecto de desenfoque
function toggleBlur(image) {
    image.classList.toggle('blur');
    var index = image.getAttribute('data-index');
    var option = image.getAttribute('data-option');
    var newState = {
        index: index,
        blur: image.classList.contains('blur'),
        count: cardState[option][index] || 0,
        option: option
    };
    saveCardState(newState); // Guardar estado al cambiar borroso/no borroso
    updateCardCounter(image);
}

// Función para guardar el estado de una carta en el servidor y actualizar el localStorage
function saveCardState(newState) {
    fetch('/guardar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify([newState])
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al guardar estado');
            }
            return response.json();
        })
        .then(data => {
            console.log('Estado guardado correctamente:', data.message);
        })
        .catch(error => {
            console.error('Error:', error);
        });

    // Actualizar localStorage cuando se guarda el estado
    localStorage.setItem(`${newState.option}_card_${newState.index}_blur`, newState.blur ? '1' : '0');
    localStorage.setItem(`${newState.option}_card_${newState.index}_count`, newState.count);
}

// Función para cargar el estado de las cartas desde el servidor
function loadCardState() {
    fetch('/get_cards', { method: 'GET' })
        .then(response => response.json())
        .then(cards => {
            var images = document.querySelectorAll('.card-img');
            images.forEach(function (image) {
                var index = parseInt(image.getAttribute('data-index'));
                var option = image.getAttribute('data-option');
                var card = cards.find(c => c.card_id === index);
                if (card) {
                    image.classList.toggle('blur', !card.is_owned);
                    cardState[option][index] = card.repeat_count;
                    updateCardCounter(image);
                }
            });
        })
        .catch(error => console.error('Error al cargar las cartas:', error));
}

// Función para actualizar el contador de cartas repetidas
function updateCardCounter(image) {
    var index = image.getAttribute('data-index');
    var option = image.getAttribute('data-option');
    var container = image.closest('.card-container');

    // Aseguramos que el contenedor tenga posición relativa
    container.style.position = 'relative';

    var counterElement = container.querySelector('.card-counter');

    if (!counterElement) {
        counterElement = document.createElement('div');
        counterElement.classList.add('card-counter');
        counterElement.style.position = 'absolute';
        counterElement.style.top = '5px';
        counterElement.style.right = '5px';
        counterElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        counterElement.style.color = 'white';
        counterElement.style.padding = '4px 8px';
        counterElement.style.borderRadius = '4px';
        counterElement.style.fontSize = '14px';
        counterElement.style.pointerEvents = 'none';
        container.appendChild(counterElement);
    }

    var count = cardState[option][index] || 0;
    if (count > 0 && !image.classList.contains('blur')) {
        counterElement.textContent = '+' + count;
        counterElement.style.display = 'block';
    } else {
        counterElement.textContent = '';
        counterElement.style.display = 'none';
    }
}

// Evento que se dispara cuando el DOM ha sido completamente cargado
document.addEventListener('DOMContentLoaded', function () {
    loadCardState();

    document.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
            setTimeout(loadCardState, 100);
        });
    });
});
