var svg = d3
    .select(".usa-map")
    .append("svg")
    .attr("width", 975)
    .attr("height", 610);

var projection = d3.geoAlbers().scale(1200).translate([480, 300]);

var path = d3.geoPath().projection(projection);

d3.csv(".\\assets\\nba_teams_loc.csv")
    .then(function (teams) {
        d3.json(".\\assets\\usa-topojson.json").then(function (us) {
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

            console.log(teams);
            svg.selectAll("circle")
                .data(teams)
                .enter()
                .append("circle")
                .attr("r", "8px")
                .attr("cx", function (d) {
                    return projection([+d.lon, +d.lat])[0];
                })
                .attr("cy", function (d) {
                    return projection([+d.lon, +d.lat])[1];
                })
                .attr("fill", function (d) {
                    return d.color;
                });

            svg.selectAll(".team-label")
                .data(teams)
                .enter()
                .append("text")
                .attr("class", "team-label")
                .attr("x", function (d) {
                    return projection([+d.lon, +d.lat])[0];
                })
                .attr("y", function (d) {
                    return projection([+d.lon, +d.lat])[1];
                })
                .text(function (d) {
                    return d.team_id;
                });
        });
    })
    .catch(function (error) {
        throw error;
    });
