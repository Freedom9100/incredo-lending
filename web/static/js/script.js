// Получение элементов DOM
const form = document.getElementById('creditForm');
const resultContainer = document.getElementById('resultContainer');
const resultText = document.getElementById('probabilityValue');
const probabilityFill = document.getElementById('probabilityFill');
const resultStatus = document.getElementById('resultStatus');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const submitButton = form.querySelector('button[type="submit"]');

lucide.createIcons();

// Функция для обновления статуса
function updateStatus(probability) {
    if (!resultStatus || !statusIcon || !statusText) return;

    // Удаляем все классы статуса
    resultStatus.classList.remove('success', 'warning', 'danger');

    if (probability >= 70) {
        // Высокая вероятность одобрения
        resultStatus.classList.add('success');
        statusIcon.setAttribute('data-lucide', 'check-circle-2');
        statusText.textContent = 'Высокая вероятность одобрения кредита';
    } else if (probability >= 40) {
        // Средняя вероятность одобрения
        resultStatus.classList.add('warning');
        statusIcon.setAttribute('data-lucide', 'alert-circle');
        statusText.textContent = 'Средняя вероятность одобрения кредита';
    } else {
        // Низкая вероятность одобрения
        resultStatus.classList.add('danger');
        statusIcon.setAttribute('data-lucide', 'x-circle');
        statusText.textContent = 'Низкая вероятность одобрения кредита';
    }

    lucide.createIcons();
}

// Ждем, пока вся HTML-страница полностью загрузится
document.addEventListener('DOMContentLoaded', () => {

    if (resultContainer) resultContainer.style.display = 'none';
    if (probabilityFill) probabilityFill.style.width = '0%';

    // Обработка формы калькулятора
    if (form && resultContainer && resultText && submitButton) {
        // Добавляем обработчик события "submit" (нажатие на кнопку отправки)
        form.addEventListener('submit', async (event) => {
            // 1. Предотвращаем стандартное поведение формы (которое перезагружает страницу)
            event.preventDefault();

            // 2. Даем пользователю обратную связь: блокируем кнопку и показываем "загрузку"
            submitButton.disabled = true;
            submitButton.textContent = 'Рассчитываем...';
            resultContainer.style.display = 'block'; // Показываем контейнер результата
            resultText.textContent = 'Идет обработка запроса...';

            // 3. Собираем все данные из формы
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                // Пробуем преобразовать значение в число. Если не получается, оставляем как строку.
                const numValue = Number(value);
                data[key] = isNaN(numValue) || value === '' ? value : numValue;
            });

            // 4. Отправляем данные на сервер (бэкенд)
            try {
                const response = await fetch('/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data) // Превращаем наш объект в JSON-строку
                });

                const result = await response.json(); // Читаем ответ от сервера

                if (!response.ok) {
                    // Если сервер вернул ошибку (например, 422 или 500)
                    throw new Error(result.detail || 'Произошла неизвестная ошибка сервера.');
                }

                // 5. Показываем успешный результат
                const probability = Math.round(result.probability * 100);
                resultText.textContent = `${probability}%`;
                updateStatus(probability);
                probabilityFill.style.width = `${probability}%`;
            } catch (error) {
                // 6. Показываем ошибку, если что-то пошло не так
                resultText.textContent = `Ошибка: ${error.message}`;
                console.error('Ошибка при выполнении запроса:', error);
            } finally {
                // 7. В любом случае (успех или ошибка) возвращаем кнопку в исходное состояние
                submitButton.disabled = false;
                submitButton.textContent = 'Рассчитать вероятность';
            }
        });
    }

    // Логика FAQ (Аккордеон)
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer'); // Получаем блок ответа
        
        if (question && answer) {
            question.addEventListener('click', (e) => {
                e.preventDefault();
                
                const isActive = item.classList.contains('active');
                
                // Закрываем все другие активные элементы
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                         otherItem.classList.remove('active');
                         const otherAnswer = otherItem.querySelector('.faq-answer');
                         if (otherAnswer) otherAnswer.style.maxHeight = null; // Сбрасываем высоту
                    }
                });

                // Переключаем текущий элемент
                if (isActive) {
                    item.classList.remove('active');
                    answer.style.maxHeight = null; // Скрываем
                } else {
                    item.classList.add('active');
                    answer.style.maxHeight = (answer.scrollHeight + 100) + "px"; 
                }
            });
        }
    });
    // --- ЛОГИКА СЛАЙДЕРА ОТЗЫВОВ ---
    const slider = document.getElementById('sliderTrack');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');

    if (slider && prevBtn && nextBtn) {
        const sliderItems = Array.from(slider.children);
        const arrows = [prevBtn, nextBtn];

        arrows.forEach(arrow => arrow.addEventListener('click', function (event) {
            event.preventDefault();

            let activeItem = slider.querySelector('.active');
            
            // Если вдруг активного класса нет, берем первый и делаем активным
            if (!activeItem) {
                activeItem = sliderItems[0];
                activeItem.classList.add('active');
            }

            const activeIndex = sliderItems.indexOf(activeItem);
            let nextIndex;

            // Логика определения следующего индекса
            if (arrow.id === 'prevSlide') {
                if (activeIndex === 0) { 
                    nextIndex = sliderItems.length - 1;
                } else {
                    nextIndex = activeIndex - 1;
                }
            } else {
                if (activeIndex === sliderItems.length - 1) { 
                    nextIndex = 0;
                } else {
                    nextIndex = activeIndex + 1;
                }
            }

            // Переключаем активный класс
            activeItem.classList.remove('active');
            sliderItems[nextIndex].classList.add('active');

            // Сдвигаем все элементы на нужную величину
            const newActiveIndex = sliderItems.indexOf(slider.querySelector('.active'));
            sliderItems.forEach(item => {
                 item.style.transition = 'transform 0.5s ease-in-out';
                 item.style.transform = `translateX(-${100 * newActiveIndex}%)`;
            });
        }));
    }

    // --- ЛОГИКА КНОПКИ "НАВЕРХ" ---
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const aboutUsSection = document.querySelector('.aboutus');

    if (scrollToTopBtn && aboutUsSection) {
        window.addEventListener('scroll', () => {
            // Вычисляем нижнюю границу секции aboutus
            const aboutUsBottom = aboutUsSection.offsetTop + aboutUsSection.offsetHeight;
            
            // Показываем кнопку, если мы прокрутили ниже секции aboutus
            if (window.scrollY > aboutUsBottom) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});

// Обработчик сброса формы
const creditForm = document.getElementById('creditForm'); // Explicit re-declaration for scope clarity
if (creditForm) {
    creditForm.addEventListener('reset', function() {
        // Скрываем результат при сбросе формы
        if (resultContainer) {
            resultContainer.style.display = 'none';
        }
    });
}

// Валидация полей в реальном времени
const formInputs = document.querySelectorAll('.credit-form input, .credit-form select');
formInputs.forEach(input => {
    input.addEventListener('blur', function() {
        validateField(this);
    });
    
    input.addEventListener('input', function() {
        // Убираем сообщение об ошибке при вводе
        if (this.classList.contains('error')) {
            this.classList.remove('error');
        }
    });
});

// Функция валидации поля
function validateField(field) {
    // TODO: Добавьте дополнительную валидацию если необходимо
    
    if (!field.checkValidity()) {
        field.classList.add('error');
        return false;
    } else {
        field.classList.remove('error');
        return true;
    }
}

// Стили для ошибок валидации (можно добавить в CSS)
const style = document.createElement('style');
style.textContent = `
    input.error,
    select.error {
        border-color: var(--danger-color) !important;
    }
`;
document.head.appendChild(style);