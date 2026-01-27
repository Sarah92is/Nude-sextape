// Configuration du carrousel d'images
const slides = document.querySelectorAll('.image-slide');
let currentSlide = 0;
const slideInterval = 4000; // Change d'image toutes les 4 secondes

// Images disponibles (charge automatiquement)
const imageFiles = [
    'images/11409669.webp',
    'images/OIP.webp',
    'images/télécharger (1).jpg',
    'images/télécharger (2).jpg',
    'images/télécharger.jpg'
];

// Assigne les images aux slides
imageFiles.forEach((img, index) => {
    if (slides[index]) {
        slides[index].style.backgroundImage = `url('${img}')`;
    }
});

// Fonction pour afficher la slide suivante
function nextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}

// Lance la rotation automatique des images
setInterval(nextSlide, slideInterval);

// Gestion de la musique
const bgMusic = document.getElementById('bgMusic');

// Assure que la musique joue
window.addEventListener('click', () => {
    if (bgMusic.paused) {
        bgMusic.play().catch(error => {
            console.log('La musique n\'a pas pu être lue:', error);
        });
    }
});

// Lance la musique au chargement
document.addEventListener('DOMContentLoaded', () => {
    bgMusic.play().catch(error => {
        console.log('La musique n\'a pas pu être lue automatiquement:', error);
    });
});
