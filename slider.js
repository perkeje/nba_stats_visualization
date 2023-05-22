var slider = d3.select(".slider");
var sliderValue = d3.select(".slider-value");

sliderValue.text(slider.property("value"));

slider.on("input", function () {
    sliderValue.text(slider.property("value"));
});
