var slider = d3.select(".slider");
var sliderValue = d3.select(".slider-value");
var playButton = d3.select(".play-btn");
var pauseButton = d3.select(".pause-btn");
var tooltip = d3.select(".tooltip");
var criteriaRadioButtons = d3.selectAll("input[name='criteria']");
var eastZoom = d3.select(".east-zoom-btn");
var westZoom = d3.select(".west-zoom-btn");
var rstZoom = d3.select(".rst-zoom-btn");
var intervalId;
var hoveredTeam = null;
var criteria = null;
const baseScale = 1200;
const baseTranslateX = 480;
const baseTranslateY = 300;

const loadTeams = async () => {
    try {
        return await d3.csv("./datasets/teams_stats_cleaned.csv");
    } catch (err) {
        throw err;
    }
};

const loadMap = async () => {
    try {
        return await d3.json("./maps/usa-topojson.json");
    } catch (err) {
        throw err;
    }
};

var svg = d3
    .select(".usa-map")
    .append("svg")
    .attr("width", 975)
    .attr("height", 610);
//480,300, 1200
//WEST: 1300, 840, 320
//EAST: 1600, -150, 250
var projection = d3
    .geoAlbers()
    .scale(baseScale)
    .translate([baseTranslateX, baseTranslateY]);
var path = d3.geoPath().projection(projection);
var defs = svg.append("defs");

let mapInteraction = async () => {
    try {
        let us = await loadMap();
        svg.attr("class", "states")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter()
            .append("path")
            .attr("d", path)
            .lower();

        getSelectedCriteria();
        const teams = await loadTeams();
        const defaultYear = teams[0].Year;
        createPatterns(teams);
        createCircles(defaultYear, teams);

        playButton.on("click", () => {
            if (slider.property("value") == 2021) {
                slider.property("value", 1991);
                sliderValue.text(1991);
                createCircles(slider.property("value"), teams);
            }
            if (!intervalId) {
                intervalId = d3.interval(() => {
                    slider.property(
                        "value",
                        Number(slider.property("value")) + 1
                    );
                    let value = slider.property("value");
                    sliderValue.text(value);
                    createCircles(value, teams);
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

        slider.on("change", (e) => {
            var year = e.target.value;
            createCircles(year, teams);
        });

        criteriaRadioButtons.on("change", () => {
            getSelectedCriteria();
            console.log(criteria);
        });

        westZoom.on("click", () => {
            d3.select(".states")
                .transition()
                .duration(750)
                .attr("transform", "translate(350, 30) scale(1.1)");
        });
        eastZoom.on("click", () => {
            d3.select(".states")
                .transition()
                .duration(750)
                .attr("transform", "translate(-610, -65) scale(1.35)");
        });

        rstZoom.on("click", () => {
            d3.select(".states")
                .transition()
                .duration(750)
                .attr("transform", "translate(0, 0) scale(1)");
        });
    } catch (err) {
        console.log(err);
    }
};

const createCircles = (year, teams) => {
    let circles = svg.selectAll("circle").data(
        teams.filter((d) => {
            return d.Year === year;
        }),
        (d) => {
            return d.team_id;
        }
    );
    circles
        .exit()
        .on("mouseout", null)
        .transition()
        .duration(200)
        .attr("r", "0px")
        .remove()
        .on("end", () => {
            tooltip.style("opacity", 0);
        });

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
            hoveredTeam = d.team_id;
            tooltip
                .html(`Team: ${d.name}<br>W/L%: ${d["W/L%"]}`)
                .style("opacity", 0.8);

            d3.select(e.target)
                .raise()
                .attr("r", `${60 * d["W/L%"]}px`);
        })
        .on("mouseout", (e, d) => {
            hoveredTeam = null;
            tooltip.style("opacity", 0);
            d3.select(e.target).attr("r", `${50 * d["W/L%"]}px`);
        })
        .style("cursor", "pointer")
        .merge(circles)
        .transition()
        .duration(500)
        .attr("r", (d) => `${50 * d["W/L%"]}px`);

    if (hoveredTeam) {
        const teamData = teams.find(
            (team) => team.team_id == hoveredTeam && team.Year == year
        );
        tooltip.html(`Team: ${teamData.name}<br>W/L%: ${teamData["W/L%"]}`);
    }
};

const pause = () => {
    if (intervalId) intervalId.stop();
    intervalId = null;
    pauseButton.classed("show", false);
    playButton.classed("show", true);
};

const createPatterns = (teams) => {
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
};

const getSelectedCriteria = () => {
    criteria = d3.select("input[name='criteria']:checked").node().value;
};

d3.select(".teams-div").on("mousemove", function (e, d) {
    const currentMousePosition = d3.pointer(e);
    tooltip
        .style("left", currentMousePosition[0] + "px")
        .style("top", currentMousePosition[1] + "px");
});

mapInteraction();
