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

var g = svg.append("g");

var zoom = d3
    .zoom()
    .scaleExtent([1, 10])
    .on("zoom", (event) => {
        svg.attr("transform", event.transform);
    });

var projection = d3
    .geoAlbers()
    .scale(baseScale)
    .translate([baseTranslateX, baseTranslateY]);
var path = d3.geoPath().projection(projection);
var defs = g.append("defs");
var zoom = d3
    .zoom()
    .scaleExtent([1, 10])
    .translateExtent([
        [-500, 0],
        [975 + 450, 610],
    ])
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

let mapInteraction = async () => {
    try {
        let us = await loadMap();

        g.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter()
            .append("path")
            .attr("d", path)
            .lower();

        svg.call(zoom);
        setSelectedCriteria();
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
            setSelectedCriteria();
            let year = slider.property("value");
            createCircles(year, teams);
        });

        westZoom.on("click", () => {
            svg.transition()
                .duration(750)
                .call(
                    zoom.transform,
                    d3.zoomIdentity.translate(287, -5).scale(1.1)
                );
        });
        eastZoom.on("click", () => {
            svg.transition()
                .duration(750)
                .call(
                    zoom.transform,
                    d3.zoomIdentity.translate(-654, -101).scale(1.17)
                );
        });

        rstZoom.on("click", () => {
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        });
    } catch (err) {
        console.log(err);
    }
};

const createCircles = (year, teams) => {
    let circles = g.selectAll("circle").data(
        teams.filter((d) => {
            return d.Year === year;
        }),
        (d) => {
            return d.team_id;
        }
    );

    let minValue = d3.min(teams, (d) => +d[criteria]);
    let maxValue = d3.max(teams, (d) => +d[criteria]);

    let minRadius = 10;
    let maxRadius = 50;

    let radiusScale = d3
        .scaleLinear()
        .domain([minValue, maxValue])
        .range([minRadius, maxRadius]);
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
        .style("cursor", "pointer")
        .merge(circles)
        .on("mouseover", (e, d) => {
            hoveredTeam = d.team_id;
            tooltip
                .html(`Team: ${d.name}<br>${criteria}: ${d[criteria]}`)
                .style("opacity", 0.8);

            d3.select(e.target)
                .raise()
                .attr("r", (d) => `${radiusScale(d[criteria]) * 1.1}px`);
        })
        .on("mouseout", (e, d) => {
            hoveredTeam = null;
            tooltip.style("opacity", 0);
            d3.select(e.target).attr(
                "r",
                (d) => `${radiusScale(d[criteria])}px`
            );
        })
        .transition()
        .duration(500)
        .attr("r", (d) => `${radiusScale(d[criteria])}px`);

    if (hoveredTeam) {
        const teamData = teams.find(
            (team) => team.team_id == hoveredTeam && team.Year == year
        );
        tooltip.html(
            `Team: ${teamData.name}<br>${criteria}: ${teamData[criteria]}`
        );
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

const setSelectedCriteria = () => {
    criteria = d3.select("input[name='criteria']:checked").node().value;
};

d3.select(".teams-div").on("mousemove", function (e, d) {
    const currentMousePosition = d3.pointer(e);
    tooltip
        .style("left", currentMousePosition[0] + "px")
        .style("top", currentMousePosition[1] + "px");
});

mapInteraction();
