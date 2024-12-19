// Objeto para mantener el estado de cada carta por opción
var cardState = {};

// Variable para almacenar la referencia del contenedor de información de la carta
var cardInfoContainer = null;

// Función para manejar el clic en una carta para cambiar el efecto de desenfoque
function toggleBlur(image) {
    var index = image.getAttribute('data-index');
    var option = image.getAttribute('data-option');
    if (!cardState[option]) cardState[option] = {};

    image.classList.toggle('blur');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([newState])
    })
        .then(response => response.json())
        .then(data => console.log('Estado guardado correctamente:', data.message))
        .catch(error => console.error('Error:', error));

    localStorage.setItem(`${newState.option}_card_${newState.index}_blur`, newState.blur ? '1' : '0');
}

// Función para cargar el estado de las cartas desde localStorage
function loadCardState() {
    var images = document.querySelectorAll('.card-img');
    images.forEach(function (image) {
        var index = image.getAttribute('data-index');
        var option = image.getAttribute('data-option');
        var blur = localStorage.getItem(`${option}_card_${index}_blur`) === '1';
        if (blur) {
            image.classList.add('blur');
        }
    });
}

// Función para actualizar el contador de cartas repetidas
function updateCardCounter(image) {
    var index = image.getAttribute('data-index');
    var option = image.getAttribute('data-option');
    var counterElement = image.parentElement.querySelector('.card-counter');
    if (!counterElement) {
        counterElement = document.createElement('div');
        counterElement.classList.add('card-counter');
        image.parentElement.appendChild(counterElement);
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

// Inicializar el estado de las cartas desde localStorage
document.addEventListener('DOMContentLoaded', function () {
    loadCardState();
});
