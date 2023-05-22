var slider = d3.select(".slider");
var sliderValue = d3.select(".slider-value");
var playButton = d3.select(".play-btn");
var pauseButton = d3.select(".pause-btn");
var intervalId;

sliderValue.text(slider.property("value"));

slider.on("input", function () {
    sliderValue.text(slider.property("value"));
});

playButton.on("click", function () {
    if (slider.property("value") == 2021) {
        slider.property("value", 1991);
        sliderValue.text(1991);
    }
    if (!intervalId) {
        intervalId = d3.interval(function () {
            slider.property("value", Number(slider.property("value")) + 1);
            sliderValue.text(slider.property("value"));

            if (slider.property("value") == 2021) {
                pause();
            }
        }, 1000);
    }
    playButton.classed("show", false);
    pauseButton.classed("show", true);
});

pauseButton.on("click", function () {
    pause();
});

function pause() {
    if (intervalId) intervalId.stop();
    intervalId = null;
    pauseButton.classed("show", false);
    playButton.classed("show", true);
}
