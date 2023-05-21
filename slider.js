var slider = document.querySelector(".slider");
var sliderValue = document.querySelector(".slider-value");
var playButton = document.querySelector(".play-btn");
var pauseButton = document.querySelector(".pause-btn");
var intervalId;

sliderValue.textContent = slider.value;

slider.addEventListener("input", function () {
    sliderValue.textContent = slider.value;
});

playButton.addEventListener("click", function () {
    if (slider.value == 2021) {
        slider.value = 1991;
        sliderValue.textContent = 1991;
    }
    if (!intervalId) {
        intervalId = setInterval(function () {
            slider.value = Number(slider.value) + 1;
            sliderValue.textContent = slider.value;

            if (slider.value == 2021) {
                pause();
            }
            // createCircles(slider.value);
        }, 1000);
    }
    playButton.classList.toggle("show");
    pauseButton.classList.toggle("show");
});

pauseButton.addEventListener("click", function () {
    pause();
});

function pause() {
    clearInterval(intervalId);
    intervalId = null;
    pauseButton.classList.toggle("show");
    playButton.classList.toggle("show");
}
