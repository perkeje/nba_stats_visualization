var slider = d3.select(".slider");
var sliderValue = d3.select(".slider-value");
var playButton = d3.select(".play-btn");
var pauseButton = d3.select(".pause-btn");
var tooltip = d3.select(".tooltip");
var criteriaRadioButtons = d3.selectAll("input[name='criteria']");
var eastZoom = d3.select(".east-zoom-btn");
var westZoom = d3.select(".west-zoom-btn");
var rstZoom = d3.select(".rst-zoom-btn");
var formatNumber = d3.format(",");
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

const loadPlayers = async () => {
    try {
        return await d3.csv("./datasets/mvps_cleaned.csv");
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

const linePlotMargin = { top: 50, right: 10, bottom: 50, left: 80 };
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
    .attr("x", linePlotWidth / 2 - 5)
    .attr("y", linePlotHeight + linePlotMargin.bottom - 10)
    .style("text-anchor", "middle")
    .text("Year")
    .style("fill", "#fefcfb");

let yAxisLabel = linePlotSvg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -linePlotHeight / 2)
    .attr("y", -linePlotMargin.left + 15)
    .style("text-anchor", "middle")
    .style("fill", "#fefcfb");

let plotTitle = linePlotSvg
    .append("text")
    .attr("class", "plot-title")
    .attr("x", linePlotWidth / 2)
    .attr("y", -15)
    .style("text-anchor", "middle")
    .style("fill", "#fefcfb");

let pieWidth = 450;
let pieHeight = 450;
let pieMargin = 40;

let radius = Math.min(pieWidth, pieHeight) / 2 - pieMargin;

let pieSvg = d3
    .select(".pie-chart")
    .append("svg")
    .attr("width", pieWidth)
    .attr("height", pieHeight)
    .attr("fill", "white")
    .append("g")
    .attr("transform", "translate(" + pieWidth / 2 + "," + pieHeight / 2 + ")");

pieSvg.append("circle").attr("r", radius).attr("fill", "white");

pieSvg
    .append("text")
    .attr("class", "default-text")
    .style("text-anchor", "middle")
    .text("Click on a team to display data")
    .style("fill", "#808080");

const barChartMargin = { top: 50, right: 10, bottom: 50, left: 80 };
const barChartWidth = 1200;
const barChartHeight = 400;

const barChartSvg = d3
    .select(".bar-chart")
    .append("svg")
    .attr("width", barChartWidth + barChartMargin.left + barChartMargin.right)
    .attr("height", barChartHeight + barChartMargin.top + barChartMargin.bottom)
    .append("g")
    .attr(
        "transform",
        `translate(${barChartMargin.left},${barChartMargin.top})`
    );

let xBarScale = d3.scaleBand().range([0, barChartWidth]).padding(0.1);
let yBarScale = d3.scaleLinear().range([barChartHeight, 0]);

let xAxisBar = d3.axisBottom(xBarScale);
let yAxisBar = d3.axisLeft(yBarScale);

barChartSvg
    .append("g")
    .attr("class", "x-axis-bar")
    .attr("transform", `translate(0, ${barChartHeight})`)
    .style("fill", "#1282a2");

barChartSvg.append("g").attr("class", "y-axis-bar").style("fill", "#1282a2");

barChartSvg
    .append("text")
    .attr("class", "axis-label")
    .attr("x", barChartWidth / 2)
    .attr("y", barChartHeight + barChartMargin.bottom - 10)
    .style("text-anchor", "middle")
    .text("Team")
    .style("fill", "#fefcfb");

let barchartLabelY = barChartSvg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -barChartHeight / 2)
    .attr("y", -barChartMargin.left + 15)
    .style("text-anchor", "middle")
    .style("fill", "#fefcfb");

const scatterPlotMargin = { top: 50, right: 50, bottom: 50, left: 80 };
const scatterPlotWidth = 600;
const scatterPlotHeight = 400;

const scatterPlotSvg = d3
    .select(".scatter-plot")
    .append("svg")
    .attr(
        "width",
        scatterPlotWidth + scatterPlotMargin.left + scatterPlotMargin.right
    )
    .attr(
        "height",
        scatterPlotHeight + scatterPlotMargin.top + scatterPlotMargin.bottom
    )
    .append("g")
    .attr(
        "transform",
        `translate(${scatterPlotMargin.left},${scatterPlotMargin.top})`
    );

scatterPlotSvg
    .append("rect")
    .attr("width", scatterPlotWidth)
    .attr("height", scatterPlotHeight)
    .style("fill", "white");

scatterPlotSvg
    .append("text")
    .attr("class", "axis-label")
    .attr("x", scatterPlotWidth / 2)
    .attr("y", scatterPlotHeight + scatterPlotMargin.bottom - 10)
    .style("text-anchor", "middle")
    .text("W/L%")
    .style("fill", "#fefcfb");

scatterPlotSvg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -scatterPlotHeight / 2)
    .attr("y", -scatterPlotMargin.left + 15)
    .style("text-anchor", "middle")
    .text("Payroll")
    .style("fill", "#fefcfb");

let xScatterScale = d3.scaleLinear().range([0, scatterPlotWidth]);
let yScatterScale = d3.scaleLinear().range([scatterPlotHeight, 0]);

let xAxisScatter = d3.axisBottom(xScatterScale);
let yAxisScatter = d3.axisLeft(yScatterScale);

scatterPlotSvg
    .append("g")
    .attr("class", "x-axis-scatter")
    .attr("transform", `translate(0, ${scatterPlotHeight})`)
    .style("fill", "#1282a2");

scatterPlotSvg
    .append("g")
    .attr("class", "y-axis-scatter")
    .style("fill", "#1282a2");

let scatterTitle = scatterPlotSvg
    .append("text")
    .attr("class", "scatter-title")
    .attr("x", scatterPlotWidth / 2)
    .attr("y", -30)
    .style("text-anchor", "middle")
    .style("fill", "#fefcfb")
    .text("Salary vs. Win-Loss Percentage");

const renderScatterPlot = (data) => {
    const minValueY = d3.min(data, (d) => +d.Payroll);
    const maxValueY = d3.max(data, (d) => +d.Payroll);
    const minValueX = d3.min(data, (d) => +d["W/L%"]);
    const maxValueX = d3.max(data, (d) => +d["W/L%"]);

    xScatterScale.domain([minValueX, maxValueX]).nice();
    yScatterScale.domain([minValueY, maxValueY]).nice();

    scatterPlotSvg
        .select(".x-axis-scatter")
        .transition()
        .duration(500)
        .call(xAxisScatter);
    scatterPlotSvg
        .select(".y-axis-scatter")
        .transition()
        .duration(500)
        .call(yAxisScatter);

    const circles = scatterPlotSvg
        .selectAll(".circle")
        .data(data, (d) => d.Team_id);

    circles.exit().transition().duration(500).attr("r", 0).remove();

    circles
        .enter()
        .append("circle")
        .attr("class", "circle")
        .attr("cx", (d) => xScatterScale(+d["W/L%"]))
        .attr("cy", (d) => yScatterScale(+d.Payroll))
        .attr("r", 0)
        .style("fill", (d) => d.Color)
        .style("stroke", "white")
        .style("stroke-width", 2)
        .style("cursor", "pointer")
        .merge(circles)
        .on("mouseover", (e, d) => {
            tooltip
                .html(
                    `Team: ${d.Name}<br>Payroll: $${formatNumber(
                        d.Payroll
                    )}<br>W/L%: ${d["W/L%"]}`
                )
                .style("opacity", 0.8)
                .style("left", `${d3.pointer(e)[0]}px`)
                .style("top", `${d3.pointer(e)[1]}px`);

            d3.select(e.target).style("fill", "yellow").attr("r", 8);
        })
        .on("mouseout", (e, d) => {
            tooltip.style("opacity", 0);
            d3.select(e.target)
                .style("fill", (d) => d.Color)
                .attr("r", 8);
        })
        .transition()
        .duration(500)
        .attr("cx", (d) => xScatterScale(+d["W/L%"]))
        .attr("cy", (d) => yScatterScale(+d.Payroll))
        .attr("r", 8);
};

const createScatterPlot = (year, teams) => {
    const data = teams.filter((d) => d.Year === year);
    renderScatterPlot(data);
};

const mvpBarChartTeam = d3
    .select(".mvp-bar-chart-team")
    .append("svg")
    .attr(
        "width",
        scatterPlotWidth + scatterPlotMargin.left + scatterPlotMargin.right
    )
    .attr(
        "height",
        scatterPlotHeight + scatterPlotMargin.top + scatterPlotMargin.bottom
    )
    .append("g")
    .attr(
        "transform",
        `translate(${scatterPlotMargin.left},${scatterPlotMargin.top})`
    );

const xBarScaleTeam = d3.scaleBand().range([0, scatterPlotWidth]).padding(0.1);
const yBarScaleTeam = d3.scaleLinear().range([scatterPlotHeight, 0]);

const xAxisBarTeam = mvpBarChartTeam
    .append("g")
    .attr("class", "x-axis-bar")
    .attr("transform", `translate(0, ${scatterPlotHeight})`);

const yAxisBarTeam = mvpBarChartTeam.append("g").attr("class", "y-axis-bar");

mvpBarChartTeam
    .append("text")
    .attr("class", "bar-title")
    .attr("x", scatterPlotWidth / 2)
    .attr("y", -30)
    .style("text-anchor", "middle")
    .text("Number of MVP titles by player")
    .style("fill", "#fefcfb");

mvpBarChartTeam
    .append("text")
    .attr("class", "axis-label")
    .attr("x", scatterPlotWidth / 2)
    .attr("y", scatterPlotHeight + scatterPlotMargin.bottom - 10)
    .style("text-anchor", "middle")
    .text("Teams")
    .style("fill", "#fefcfb");

mvpBarChartTeam
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -scatterPlotHeight / 2)
    .attr("y", -scatterPlotMargin.left + 30)
    .style("text-anchor", "middle")
    .text("MVP Count")
    .style("fill", "#fefcfb");

function renderMvpTeamsBarchart(selectedYear, mvpData, teams) {
    const filteredData = mvpData.filter((d) => d.Year <= selectedYear);

    const teamMvpCounts = d3.rollup(
        filteredData,
        (v) => v.length,
        (d) => d.Tm
    );

    xBarScaleTeam.domain(Array.from(teamMvpCounts.keys()));
    yBarScaleTeam.domain([0, d3.max(Array.from(teamMvpCounts.values()))]);

    const xAxisBarTeam = d3.axisBottom(xBarScaleTeam);
    mvpBarChartTeam
        .select(".x-axis-bar")
        .transition()
        .duration(500)
        .style("fill", "#1282a2")
        .call(xAxisBarTeam);

    const yAxisBarTeam = d3.axisLeft(yBarScaleTeam).ticks(5);
    mvpBarChartTeam
        .select(".y-axis-bar")
        .transition()
        .duration(500)
        .style("fill", "#1282a2")
        .call(yAxisBarTeam);

    const barsTeam = mvpBarChartTeam
        .selectAll(".bar")
        .data(Array.from(teamMvpCounts.entries()));

    barsTeam
        .exit()
        .transition()
        .duration(500)
        .attr("y", (d) => yBarScale(0))
        .attr("height", 0)
        .remove();

    barsTeam
        .enter()
        .append("rect")
        .attr("class", "bar")
        .style("fill", (d) => teams.find((team) => team.Team_id === d[0]).Color)
        .attr("x", (d) => xBarScaleTeam(d[0]))
        .attr("width", xBarScaleTeam.bandwidth())
        .attr("y", (d) => yBarScaleTeam(0))
        .attr("height", 0)
        .style("cursor", "pointer")
        .merge(barsTeam)
        .on("mouseover", (e, d) => {
            tooltip
                .html(
                    `Team: ${teams.find((team) => team.Team_id === d[0]).Name}`
                )
                .style("opacity", 0.8)
                .style("left", `${d3.pointer(e)[0]}px`)
                .style("top", `${d3.pointer(e)[1]}px`);

            d3.select(e.target).style("fill", "yellow");
        })
        .on("mouseout", (e, d) => {
            hoveredTeam = null;
            tooltip.style("opacity", 0);
            d3.select(e.target).style(
                "fill",
                (d) => teams.find((team) => team.Team_id === d[0]).Color
            );
        })
        .transition()
        .duration(500)
        .attr("x", (d) => xBarScaleTeam(d[0]))
        .attr("width", xBarScaleTeam.bandwidth())
        .attr("y", (d) => yBarScaleTeam(d[1]))
        .attr("height", (d) => scatterPlotHeight - yBarScaleTeam(d[1]));

    const barLabelsTeam = mvpBarChartTeam
        .selectAll(".bar-label")
        .data(Array.from(teamMvpCounts.entries()));

    barLabelsTeam
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .merge(barLabelsTeam)
        .transition()
        .duration(500)
        .attr("x", (d) => xBarScaleTeam(d[0]) + xBarScaleTeam.bandwidth() / 2)
        .attr("y", (d) => yBarScaleTeam(d[1]) - 5)
        .text((d) => d[1])
        .style("text-anchor", "middle")
        .style("fill", "white");

    barLabelsTeam.exit().remove();
}

const mvpBarChart = d3
    .select(".mvp-bar-chart")
    .append("svg")
    .attr("width", barChartWidth + barChartMargin.left + barChartMargin.right)
    .attr("height", barChartHeight + barChartMargin.top + barChartMargin.bottom)
    .append("g")
    .attr(
        "transform",
        `translate(${barChartMargin.left},${barChartMargin.top})`
    );

mvpBarChart
    .append("g")
    .attr("class", "x-axis-bar")
    .attr("transform", `translate(0, ${barChartHeight})`)
    .style("fill", "#1282a2");

mvpBarChart.append("g").attr("class", "y-axis-bar").style("fill", "#1282a2");

mvpBarChart
    .append("text")
    .attr("class", "bar-title")
    .attr("x", barChartWidth / 2)
    .attr("y", -30)
    .style("text-anchor", "middle")
    .text("Number of MVP titles by player")
    .style("fill", "#fefcfb");

mvpBarChart
    .append("text")
    .attr("class", "axis-label")
    .attr("x", barChartWidth / 2)
    .attr("y", barChartHeight + barChartMargin.bottom - 5)
    .style("text-anchor", "middle")
    .text("Player")
    .style("fill", "#fefcfb");

mvpBarChart
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -barChartHeight / 2)
    .attr("y", -barChartMargin.left + 15)
    .style("text-anchor", "middle")
    .text("MVP Count")
    .style("fill", "#fefcfb");

function renderMvpBarchart(selectedYear, mvpData) {
    let colorPalette = d3.schemeCategory10;
    const filteredData = mvpData.filter((d) => d.Year <= selectedYear);

    const playerMvpCounts = d3.rollup(
        filteredData,
        (v) => v.length,
        (d) => d.Player
    );
    xBarScale.domain(Array.from(playerMvpCounts.keys()));
    yBarScale.domain([0, d3.max(Array.from(playerMvpCounts.values()))]);

    const xAxisBar = d3.axisBottom(xBarScale);
    mvpBarChart
        .select(".x-axis-bar")
        .call(xAxisBar)
        .style("fill", "#1282a2")
        .selectAll(".tick text")
        .each(function (d) {
            const self = d3.select(this);
            const text = d.split(" ");
            self.text("");

            self.append("tspan").attr("x", 0).text(text[0]);

            self.append("tspan").attr("x", 0).attr("dy", "1em").text(text[1]);
        })
        .transition()
        .duration(500);

    const yAxisBar = d3.axisLeft(yBarScale).ticks(5);
    mvpBarChart
        .select(".y-axis-bar")
        .transition()
        .duration(500)
        .style("fill", "#1282a2")
        .call(yAxisBar);

    const colorScale = d3.scaleOrdinal().range(colorPalette);

    const bars = mvpBarChart
        .selectAll(".bar")
        .data(Array.from(playerMvpCounts.entries()));

    bars.exit()
        .transition()
        .duration(500)
        .attr("y", yBarScale(0))
        .attr("height", 0)
        .remove();

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => xBarScale(d[0]))
        .attr("width", xBarScale.bandwidth())
        .attr("y", yBarScale(0))
        .attr("height", 0)
        .merge(bars)
        .style("fill", (d, i) => colorScale(i))
        .transition()
        .duration(500)
        .attr("x", (d) => xBarScale(d[0]))
        .attr("width", xBarScale.bandwidth())
        .attr("y", (d) => yBarScale(d[1]))
        .attr("height", (d) => scatterPlotHeight - yBarScale(d[1]));

    const barLabels = mvpBarChart
        .selectAll(".bar-label")
        .data(Array.from(playerMvpCounts.entries()));

    barLabels
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .merge(barLabels)
        .transition()
        .duration(500)
        .attr("x", (d) => xBarScale(d[0]) + xBarScale.bandwidth() / 2)
        .attr("y", (d) => yBarScale(d[1]) - 5)
        .text((d) => d[1])
        .style("text-anchor", "middle")
        .style("fill", "white");

    barLabels.exit().remove();
}

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
        const players = await loadPlayers();
        const defaultYear = teams[0].Year;
        createPatterns(teams);
        createCircles(defaultYear, teams);
        createBarChart(defaultYear, teams);
        createScatterPlot(defaultYear, teams);
        renderMvpTeamsBarchart(defaultYear, players, teams);
        renderMvpBarchart(defaultYear, players);

        playButton.on("click", () => {
            if (slider.property("value") == 2021) {
                slider.property("value", 1991);
                sliderValue.text(1991);
                createCircles(slider.property("value"), teams);
                createBarChart(slider.property("value"), teams);
                createScatterPlot(slider.property("value"), teams);
                renderMvpBarchart(slider.property("value"), players);
                renderMvpTeamsBarchart(
                    slider.property("value"),
                    players,
                    teams
                );
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
                    createBarChart(value, teams);
                    createScatterPlot(value, teams);
                    renderMvpBarchart(value, players);
                    renderMvpTeamsBarchart(value, players, teams);
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
            createBarChart(year, teams);
            createScatterPlot(year, teams);
            renderMvpTeamsBarchart(year, players, teams);
            renderMvpBarchart(year, players);
        });

        criteriaRadioButtons.on("change", () => {
            setSelectedCriteria();
            let year = slider.property("value");
            createCircles(year, teams);
            createBarChart(year, teams);
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
            return d.Team_id;
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
        .attr("cx", (d) => projection([d.Lon, d.Lat])[0])
        .attr("cy", (d) => projection([d.Lon, d.Lat])[1])
        .attr("r", "0px")
        .style("fill", (d) => `url(#${d.Team_id})`)
        .style("stroke", (d) => d.Color)
        .style("stroke-width", "2px")
        .style("cursor", "pointer")
        .merge(circles)
        .on("mouseover", (e, d) => {
            hoveredTeam = d.Team_id;
            tooltip
                .html(
                    `Team: ${d.Name}<br>${criteria}: ${
                        criteria === "Payroll" ? "$" : ""
                    }${formatNumber(d[criteria])}`
                )
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
            selectedTeam = d.Team_id;
            const teamData = teams.filter(
                (team) => team.Team_id === selectedTeam && team.Year <= year
            );
            const teamChartData = teamData.map((data) => ({
                Year: data.Year,
                Value: +data[criteria],
            }));
            plotTitle.text(`Team: ${d.Name}`);
            renderLinePlot(teamChartData);
            const { W, L } = d;
            drawPieChart({ W, L });
        })
        .transition()
        .duration(500)
        .attr("r", (d) => `${radiusScale(d[criteria])}px`);

    if (selectedTeam) {
        const teamData = teams.filter(
            (team) => team.Team_id === selectedTeam && team.Year <= year
        );
        const teamChartData = teamData.map((data) => ({
            Year: data.Year,
            Value: +data[criteria],
        }));

        const currentYearData = teamData.find((data) => data.Year == year);
        const { W, L } = currentYearData || { W: 0, L: 0 };

        renderLinePlot(teamChartData);
        drawPieChart({ W, L });
    }

    if (hoveredTeam) {
        const teamData = teams.find(
            (team) => team.Team_id == hoveredTeam && team.Year == year
        );
        tooltip.html(
            `Team: ${teamData.Name}<br>${criteria}: ${
                criteria === "Payroll" ? "$" : ""
            }${formatNumber(teamData[criteria])}`
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
            .attr("id", team.Team_id)
            .attr("height", "100%")
            .attr("width", "100%")
            .attr("patternContentUnits", "objectBoundingBox")
            .append("image")
            .attr("height", 1)
            .attr("width", 1)
            .attr("preserveAspectRatio", "xMidYMid slice")
            .attr(
                "href",
                `https://raw.githubusercontent.com/sharry29/DataViz/master/misc/logos/${team.Team_id}.png`
            );
    });
};

const setSelectedCriteria = () => {
    criteria = d3.select("input[name='criteria']:checked").node().value;
    yAxisLabel.text(criteria);
    barchartLabelY.text(criteria);
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

    linePlotSvg
        .append("text")
        .attr("class", "default-text")
        .attr("x", linePlotWidth / 2)
        .attr("y", linePlotHeight / 2)
        .style("text-anchor", "middle")
        .text("Click on a team to display data")
        .style("fill", "#808080");
}

function renderLinePlot(data) {
    linePlotSvg.select(".default-text").style("display", "none");

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
                .html(
                    `Year: ${d.Year}<br>${criteria}: ${
                        criteria === "Payroll" ? "$" : ""
                    }${formatNumber(d.Value)}`
                )
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

function drawPieChart(data) {
    pieSvg.select(".default-text").style("display", "none");

    let dataArr = Object.entries(data);

    let color = d3
        .scaleOrdinal()
        .domain(dataArr.map((d) => d[0]))
        .range(d3.schemeSet2);

    let pie = d3
        .pie()
        .value(function (d) {
            return d[1];
        })
        .sortValues(null);

    let data_ready = pie(dataArr);

    let arc = d3.arc().innerRadius(0).outerRadius(radius);

    let path = pieSvg.selectAll("path").data(data_ready, (d) => d.data[0]);

    path.exit().remove();

    path.transition().duration(200).attrTween("d", arcTween);

    path.enter()
        .append("path")
        .attr("fill", function (d) {
            return color(d.data[0]);
        })
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .each(function (d) {
            this._current = d;
        })
        .transition()
        .duration(200)
        .attrTween("d", arcTween);

    let labels = pieSvg.selectAll(".label").data(data_ready, (d) => d.data[0]);

    labels.exit().remove();

    labels
        .attr("transform", getLabelPosition)
        .text((d) => `${d.data[0]}: ${d.data[1]}`)
        .transition()
        .duration(200)
        .tween("text", function (d) {
            const i = d3.interpolate(this._current, +d.data[1]);
            this._current = d.data[1];
            return function (t) {
                this.textContent = `${d.data[0]}: ${i(t).toFixed(0)}`;
            };
        });

    labels
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("transform", getLabelPosition)
        .style("text-anchor", "middle")
        .text((d) => `${d.data[0]}: ${d.data[1]}`)
        .each(function (d) {
            this._current = d.data[1];
        });

    function getLabelPosition(d) {
        let pos = arc.centroid(d);
        pos[0] *= 1.5;
        pos[1] *= 1.5;
        return "translate(" + pos + ")";
    }

    function arcTween(d) {
        let i = d3.interpolate(this._current, d);
        this._current = d;
        return function (t) {
            return arc(i(t));
        };
    }
}

const renderBarChart = (data) => {
    xBarScale.domain(data.map((d) => d.Team_id));
    yBarScale.domain([0, d3.max(data, (d) => +d[criteria])]);

    barChartSvg.select(".x-axis-bar").transition().duration(500).call(xAxisBar);

    barChartSvg.select(".y-axis-bar").transition().duration(500).call(yAxisBar);

    const bars = barChartSvg.selectAll(".bar").data(data, (d) => d.Team_id);

    bars.exit()
        .transition()
        .duration(500)
        .attr("y", (d) => yBarScale(0))
        .attr("height", 0)
        .remove();

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .style("fill", (d) => d.Color)
        .attr("x", (d) => xBarScale(d.Team_id))
        .attr("width", xBarScale.bandwidth())
        .attr("y", (d) => yBarScale(0))
        .attr("height", 0)
        .style("cursor", "pointer")
        .merge(bars)
        .on("mouseover", (e, d) => {
            hoveredTeam = d.Team_id;
            tooltip
                .html(
                    `Team: ${d.Name}<br>${criteria}: ${
                        criteria === "Payroll" ? "$" : ""
                    }${formatNumber(d[criteria])}`
                )
                .style("opacity", 0.8)
                .style("left", `${d3.pointer(e)[0]}px`)
                .style("top", `${d3.pointer(e)[1]}px`);

            d3.select(e.target).style("fill", "yellow");
        })
        .on("mouseout", (e, d) => {
            hoveredTeam = null;
            tooltip.style("opacity", 0);
            d3.select(e.target).style("fill", (d) => d.Color);
        })
        .transition()
        .duration(500)
        .attr("x", (d) => xBarScale(d.Team_id))
        .attr("width", xBarScale.bandwidth())
        .attr("y", (d) => yBarScale(+d[criteria]))
        .attr("height", (d) => barChartHeight - yBarScale(+d[criteria]));

    bars.transition()
        .duration(500)
        .attr("x", (d) => xBarScale(d.Team_id))
        .attr("width", xBarScale.bandwidth())
        .attr("y", (d) => yBarScale(+d[criteria]))
        .attr("height", (d) => barChartHeight - yBarScale(+d[criteria]));
};

const createBarChart = (year, teams) => {
    const data = teams
        .filter((d) => d.Year === year)
        .sort((a, b) => {
            return d3.ascending(a.Team_id, b.Team_id);
        });

    xBarScale.domain(data.map((d) => d.Team_id));
    renderBarChart(data);
};

setSelectedCriteria();
mapInteraction();
initializeLinePlot();
