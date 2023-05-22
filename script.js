var svg = d3
    .select(".usa-map")
    .append("svg")
    .attr("width", 975)
    .attr("height", 610);

var projection = d3.geoAlbers().scale(1200).translate([480, 300]);
var path = d3.geoPath().projection(projection);
var defs = svg.append("defs");

var slider = d3.select(".slider");
var sliderValue = d3.select(".slider-value");
var playButton = d3.select(".play-btn");
var pauseButton = d3.select(".pause-btn");
var intervalId;

d3.json("./maps/usa-topojson.json")
    .then((us) => {
        svg.attr("class", "states")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter()
            .append("path")
            .attr("d", path)
            .lower();
    })
    .catch((error) => {
        throw error;
    });

d3.csv("./datasets/teams_stats_cleaned.csv")
    .then((teams) => {
        const createCircles = (year) => {
            let circles = svg.selectAll("circle").data(
                teams.filter((d) => {
                    return d.Year === year;
                }),
                (d) => {
                    return d.team_id;
                }
            );

            circles.exit().transition().duration(500).attr("r", "0px").remove();

            circles
                .enter()
                .append("circle")
                .attr("cx", (d) => projection([d.lon, d.lat])[0])
                .attr("cy", (d) => projection([d.lon, d.lat])[1])
                .attr("r", "0px")
                .style("fill", (d) => `url(#${d.team_id})`)
                .style("stroke", (d) => d.color)
                .style("stroke-width", "2px")
                .on("mouseover", (e, d) => {
                    d3.select(e.target)
                        .raise()
                        .transition()
                        .duration(200)
                        .attr("r", `${60 * d["W/L%"]}px`);
                })
                .on("mouseout", (e, d) => {
                    d3.select(e.target)
                        .transition()
                        .duration(200)
                        .attr("r", `${50 * d["W/L%"]}px`);
                })
                .style("cursor", "pointer")
                .merge(circles)
                .transition()
                .duration(500)
                .attr("r", (d) => `${50 * d["W/L%"]}px`);
        };

        teams.forEach((team) => {
            defs.append("pattern")
                .attr("id", team.team_id)
                .attr("height", "100%")
                .attr("width", "100%")
                .attr("patternContentUnits", "objectBoundingBox")
                .append("image")
                .attr("height", 1)
                .attr("width", 1)
                .attr("preserveAspectRatio", "xMidYMid slice")
                .attr(
                    "href",
                    `https://raw.githubusercontent.com/sharry29/DataViz/master/misc/logos/${team.team_id}.png`
                );
        });

        playButton.on("click", () => {
            if (slider.property("value") == 2021) {
                slider.property("value", 1991);
                sliderValue.text(1991);
                createCircles(slider.property("value"));
            }
            if (!intervalId) {
                intervalId = d3.interval(() => {
                    slider.property(
                        "value",
                        Number(slider.property("value")) + 1
                    );
                    let value = slider.property("value");
                    sliderValue.text(value);
                    createCircles(value);
                    if (slider.property("value") == 2021) {
                        pause();
                    }
                }, 1000);
            }
            playButton.classed("show", false);
            pauseButton.classed("show", true);
        });

        pauseButton.on("click", () => {
            pause();
        });

        d3.select(".slider").on("change", (e) => {
            var year = e.target.value;
            createCircles(year);
        });

        var defaultYear = teams[0].Year;
        createCircles(defaultYear);
    })
    .catch(function (error) {
        throw error;
    });

const pause = () => {
    if (intervalId) intervalId.stop();
    intervalId = null;
    pauseButton.classed("show", false);
    playButton.classed("show", true);
};
