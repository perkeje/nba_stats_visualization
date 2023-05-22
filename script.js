var svg = d3
    .select(".usa-map")
    .append("svg")
    .attr("width", 975)
    .attr("height", 610);

var projection = d3.geoAlbers().scale(1200).translate([480, 300]);
var path = d3.geoPath().projection(projection);
var defs = svg.append("defs");

d3.json(".\\maps\\usa-topojson.json")
    .then(function (us) {
        svg.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter()
            .append("path")
            .attr("d", path);

        svg.append("path")
            .attr("class", "state-boundaries")
            .datum(
                topojson.mesh(us, us.objects.states, function (a, b) {
                    return a !== b;
                })
            )
            .attr("d", path);
    })
    .catch(function (error) {
        throw error;
    });

d3.csv(".\\datasets\\teams_stats_cleaned.csv")
    .then(function (teams) {
        function createCircles(year) {
            svg.selectAll("circle").remove();

            svg.selectAll("circle")
                .data(
                    teams.filter(function (d) {
                        return d.Year === year;
                    })
                )
                .enter()
                .append("circle")
                .attr("r", function (d) {
                    let r = 50 * d["W/L%"];
                    return `${r}px`;
                })
                .attr("cx", function (d) {
                    return projection([d.lon, d.lat])[0];
                })
                .attr("cy", function (d) {
                    return projection([d.lon, d.lat])[1];
                })
                .style("fill", function (d) {
                    return `url(#${d.team_id})`;
                });
        }

        teams.forEach(function (team) {
            defs.append("pattern")
                .attr("id", team.team_id)
                .attr("height", "100%")
                .attr("width", "100%")
                .attr("patternContentUnits", "objectBoundingBox")
                .append("image")
                .attr("height", 1)
                .attr("width", 1)
                .attr("preserveAspectRatio", "meet")
                .attr(
                    "href",
                    `https://raw.githubusercontent.com/sharry29/DataViz/master/misc/logos/${team.team_id}.png`
                );
        });

        d3.select(".slider").on("change", function () {
            var year = this.value;
            createCircles(year);
        });

        var defaultYear = teams[0].Year;
        createCircles(defaultYear);
    })
    .catch(function (error) {
        throw error;
    });
