// javascript de las funcionalidades del menú contextual

$(document).ready(function () {
    var $cards = $(".cartaInformacion");
    var $style = $("<style class='hoverInformacion'></style>").appendTo("head");

    $cards.on("mousemove touchmove", function (e) {
        var $card = $(this);
        var offset = $card.offset();
        var l, t;

        if (e.type === "touchmove") {
            l = e.touches[0].clientX - offset.left;
            t = e.touches[0].clientY - offset.top;
        } else {
            l = e.pageX - offset.left;
            t = e.pageY - offset.top;
        }

        var h = $card.height();
        var w = $card.width();
        var px = Math.floor(100 * l / w);
        var py = Math.floor(100 * t / h);
        var grad_pos = `background-position: ${px}% ${py}%;`;

        var transform = `transform: rotateX(${(50 - py) / 2}deg) rotateY(${(50 - px) / 2}deg);`;

        $card.attr("style", transform);
        $style.html(`.cartaInformacioncss:hover::before { ${grad_pos} }`);
    });

    $cards.on("mouseout touchend touchcancel", function () {
        var $card = $(this);
        $card.removeAttr("style");
        $style.html("");
    });
});

// Función para mostrar el menú personalizado al hacer clic derecho en una carta
function showCustomMenu(event) {
    event.preventDefault();
    var image = event.target;
    if (image.classList.contains('blur')) {
        return;
    }
    var customMenu = document.getElementById('custom-menu');
    customMenu.style.display = 'block';
    customMenu.style.left = event.pageX + 'px';
    customMenu.style.top = event.pageY + 'px';
    customMenu.setAttribute('data-index', image.getAttribute('data-index'));
    customMenu.setAttribute('data-option', image.getAttribute('data-option'));

    var infoOption = document.getElementById("info-option");
    infoOption.onclick = function (e) {
        e.preventDefault();  // Evita que el enlace provoque el desplazamiento hacia arriba
        showLargeCard(image.src);
        hideContextMenu();
    };

    function hideContextMenu() {
        customMenu.style.display = 'none';
    }

    document.addEventListener("click", function () {
        hideContextMenu();
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

    // Actualizar localStorage cuando se cambia el contador
    localStorage.setItem(`${option}_card_${index}_count`, count);
}

// Evento que se dispara cuando el DOM ha sido completamente cargado
document.addEventListener('DOMContentLoaded', function () {
    var customMenu = document.getElementById('custom-menu');
    customMenu.style.display = 'none';

    // Cerrar el menú personalizado al hacer clic fuera de él
    document.addEventListener('click', function () {
        customMenu.style.display = 'none';
    });

    // Añadir carta repetida al hacer clic en "Añadir carta repetida" en el menú personalizado
    document.getElementById('add-repeated').addEventListener('click', function () {
        var index = customMenu.getAttribute('data-index');
        var option = customMenu.getAttribute('data-option');
        if (!cardState[option][index]) {
            cardState[option][index] = 1;
        } else {
            cardState[option][index]++;
        }
        customMenu.style.display = 'none';
        updateCardCounter(document.querySelector(`.card-img[data-index="${index}"]`));
        saveCardState({
            index: index,
            blur: document.querySelector(`.card-img[data-index="${index}"]`).classList.contains('blur'),
            count: cardState[option][index],
            option: option
        });
    });

    // Eliminar carta repetida al hacer clic en "Eliminar carta repetida" en el menú personalizado
    document.getElementById('remove-repeated').addEventListener('click', function () {
        var index = customMenu.getAttribute('data-index');
        var option = customMenu.getAttribute('data-option');
        if (cardState[option][index] && cardState[option][index] > 0) {
            cardState[option][index]--;
        }
        customMenu.style.display = 'none';
        updateCardCounter(document.querySelector(`.card-img[data-index="${index}"]`));
        saveCardState({
            index: index,
            blur: document.querySelector(`.card-img[data-index="${index}"]`).classList.contains('blur'),
            count: cardState[option][index],
            option: option
        });
    });

    // Inicializar el estado de las cartas desde localStorage
    loadCardState();

    // Recargar el estado de las cartas al cambiar de sección
    document.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
            setTimeout(loadCardState, 100); // Cargar el estado de las cartas después de un breve retraso
        });
    });
});

// Función para mostrar la carta en grande
function showLargeCard(imageSrc) {
    var largeCardOverlay = document.getElementById("large-card-overlay");
    var largeCardImg = document.getElementById("large-card-img");

    largeCardImg.src = imageSrc;

    largeCardOverlay.style.display = "flex";
}

// Función para cerrar la carta grande
function closeLargeCard() {
    var largeCardOverlay = document.getElementById("large-card-overlay");
    largeCardOverlay.style.display = "none";
    document.body.style.overflow = "auto";
}



// botón de arriba
window.onscroll = function () {
    var backToTopButton = document.getElementById("back-to-top");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopButton.style.display = "block";
    } else {
        backToTopButton.style.display = "none";
    }
};

// Volver arriba al hacer clic en el botón
document.getElementById("back-to-top").onclick = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};


// barra de progreso y contador de cartas
function updateProgressBar(notBlurredCount, totalCount) {
    var progressPercent = (notBlurredCount / totalCount) * 100;
    var progressWrap = document.getElementById('progress-wrap');
    var progressBar = document.getElementById('progress-bar');
    progressBar.style.width = progressPercent + '%';
}

document.addEventListener('DOMContentLoaded', function () {
    loadCardState();
    updateCardCounters();
});

document.addEventListener('click', function (event) {
    if (event.target.classList.contains('card-img')) {
        updateCardCounters();
    }
});

function updateCardCounters() {
    var notBlurredCount = 0;
    var totalCount = 0;
    var images = document.querySelectorAll('.card-img');
    images.forEach(function (image) {
        totalCount++;
        if (!image.classList.contains('blur')) {
            notBlurredCount++;
        }
    });
    var cardCountElement = document.querySelector('.card-counter');
    if (cardCountElement) {
        cardCountElement.textContent = notBlurredCount + ' / ' + totalCount;
    }
    updateProgressBar(notBlurredCount, totalCount);
}

$(document).ready(function () {
    var progressWrap = $('#progress-wrap');
    var progressInfo = $('#progress-info');
    function updateProgressInfo(notBlurredCount, total) {
        progressInfo.text(notBlurredCount + '/' + total);
    }
    progressWrap.hover(
        function () {
            var cards = $('.card-img');
            var total = cards.length;
            var notBlurredCount = cards.filter(':not(.blur)').length;
            updateProgressInfo(notBlurredCount, total);
        },
        function () {
        }
    );
});