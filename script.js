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
let selectedTeam = null;
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

const linePlotMargin = { top: 20, right: 20, bottom: 30, left: 40 };
const linePlotWidth = 600;
const linePlotHeight = 400;

const linePlotSvg = d3
    .select(".line-plot")
    .append("svg")
    .attr("width", linePlotWidth + linePlotMargin.left + linePlotMargin.right)
    .attr("height", linePlotHeight + linePlotMargin.top + linePlotMargin.bottom)
    .append("g")
    .attr(
        "transform",
        `translate(${linePlotMargin.left},${linePlotMargin.top})`
    );

let xAxisLabel = linePlotSvg
    .append("text")
    .attr("class", "axis-label")
    .attr("x", linePlotWidth / 2)
    .attr("y", linePlotHeight + linePlotMargin.bottom)
    .style("text-anchor", "middle")
    .text("Year")
    .style("fill", "#fefcfb");

let yAxisLabel = linePlotSvg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -linePlotHeight / 2)
    .attr("y", -linePlotMargin.left + 11)
    .style("text-anchor", "middle")
    .style("fill", "#fefcfb");

let plotTitle = linePlotSvg
    .append("text")
    .attr("class", "plot-title")
    .attr("x", linePlotWidth / 2)
    .attr("y", -5)
    .style("text-anchor", "middle")
    .style("fill", "#fefcfb");

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
    const teamChartData = [];
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
        .on("click", (e, d) => {
            selectedTeam = d.team_id;
            const teamData = teams.filter(
                (team) => team.team_id === selectedTeam && team.Year <= year
            );
            const teamChartData = teamData.map((data) => ({
                Year: data.Year,
                Value: +data[criteria],
            }));
            plotTitle.text(`Team: ${d.name}`);
            renderLinePlot(teamChartData);
        })
        .transition()
        .duration(500)
        .attr("r", (d) => `${radiusScale(d[criteria])}px`);

    if (selectedTeam) {
        const teamData = teams.filter(
            (team) => team.team_id === selectedTeam && team.Year <= year
        );
        const teamChartData = teamData.map((data) => ({
            Year: data.Year,
            Value: +data[criteria],
        }));

        renderLinePlot(teamChartData);
    }

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
    yAxisLabel.text(criteria);
};

d3.select(".teams-div").on("mousemove", function (e, d) {
    const currentMousePosition = d3.pointer(e);
    tooltip
        .style("left", currentMousePosition[0] + "px")
        .style("top", currentMousePosition[1] + "px");
});

function initializeLinePlot() {
    const xScale = d3.scaleBand().range([0, linePlotWidth]).padding(0.1);

    const yScale = d3.scaleLinear().range([linePlotHeight, 0]);

    const xAxis = d3
        .axisBottom(xScale)
        .tickValues(xScale.domain().filter((d, i) => i % 5 === 0));

    const yAxis = d3.axisLeft(yScale);

    linePlotSvg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${linePlotHeight})`)
        .style("fill", "#1282a2")
        .call(xAxis);

    linePlotSvg
        .append("g")
        .attr("class", "y-axis")
        .style("fill", "#1282a2")
        .call(yAxis);

    linePlotSvg
        .append("rect")
        .attr("width", linePlotWidth)
        .attr("height", linePlotHeight)
        .style("fill", "#fefcfb");
}

function renderLinePlot(data) {
    const xScale = d3
        .scaleBand()
        .domain(data.map((d) => d.Year))
        .range([0, linePlotWidth])
        .padding(0.1);

    const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.Value)])
        .range([linePlotHeight, 0]);

    const xAxis = d3
        .axisBottom(xScale)
        .tickValues(xScale.domain().filter((d, i) => i % 5 === 0));

    const yAxis = d3.axisLeft(yScale);

    linePlotSvg.select(".x-axis").transition().duration(500).call(xAxis);

    linePlotSvg.select(".y-axis").transition().duration(500).call(yAxis);

    const line = d3
        .line()
        .x((d) => xScale(d.Year))
        .y((d) => yScale(d.Value));

    const path = linePlotSvg.selectAll(".line").data([data]);

    path.enter()
        .append("path")
        .attr("class", "line")
        .style("stroke", "red")
        .style("fill", "none")
        .merge(path)
        .transition()
        .duration(500)
        .attr("d", line);

    path.exit().remove();

    const circles = linePlotSvg
        .selectAll(".circle-year")
        .data(data, (d) => d.Year);

    circles.exit().transition().duration(500).attr("r", 0).remove();

    const newCircles = circles
        .enter()
        .append("circle")
        .attr("class", "circle-year")
        .attr("cx", (d) => xScale(d.Year))
        .attr("cy", (d) => yScale(d.Value))
        .attr("r", 0)
        .style("fill", "red")
        .style("stroke", "white")
        .style("stroke-width", 2)
        .style("cursor", "pointer");

    circles
        .merge(newCircles)
        .on("mouseover", (e, d) => {
            tooltip
                .html(`Year: ${d.Year}<br>Value: ${d.Value}`)
                .style("opacity", 0.8)
                .style("left", `${d3.pointer(e)[0]}px`)
                .style("top", `${d3.pointer(e)[1]}px`);
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        })
        .transition()
        .duration(500)
        .attr("cx", (d) => xScale(d.Year))
        .attr("cy", (d) => yScale(d.Value))
        .attr("r", 4);
}

setSelectedCriteria();
mapInteraction();
initializeLinePlot();
