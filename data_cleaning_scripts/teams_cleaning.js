const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const _ = require("lodash");

let oldNames = {
    "oklahoma city": "Seattle SuperSonics",
    brooklyn: "New Jersey Nets",
    memphis: "Vancouver Grizzlies",
    "la lakers": "Los Angeles Lakers",
    "la clippers": "Los Angeles Clippers",
};
let teamLocations = [];
let teamNames = [];
let teamStats = [];
let teamPayrolls = [];

fs.createReadStream("./datasets/nba_teams_loc.csv")
    .pipe(csv())
    .on("data", (data) => teamLocations.push(data))
    .on("end", () => {
        fs.createReadStream("./datasets/nicknames.csv")
            .pipe(csv({ separator: ";" }))
            .on("data", (data) => teamNames.push(data))
            .on("end", () => {
                fs.createReadStream("./datasets/teams.csv")
                    .pipe(csv({ separator: ";" }))
                    .on("data", (data) => teamStats.push(data))
                    .on("end", () => {
                        fs.createReadStream(
                            "./datasets/NBA Payroll(1990-2023).csv"
                        )
                            .pipe(csv())
                            .on("data", (data) => teamPayrolls.push(data))
                            .on("end", () => {
                                const mergedData = teamStats.map((teamStat) => {
                                    const teamName = teamNames.find(
                                        (name) =>
                                            teamStat.Team.replace(
                                                /\*/g,
                                                ""
                                            ).toLowerCase() ===
                                            name.Name.toLowerCase()
                                    );
                                    let teamLocation, teamPayroll;
                                    if (teamName) {
                                        teamLocation = teamLocations.find(
                                            (location) =>
                                                location.team_id ===
                                                teamName.Abbreviation
                                        );
                                        teamPayroll = teamPayrolls.find(
                                            (payroll) =>
                                                parseInt(teamStat.Year) ==
                                                    parseInt(
                                                        payroll.seasonStartYear
                                                    ) +
                                                        1 &&
                                                (teamName.Name.toLowerCase().startsWith(
                                                    payroll.team.toLowerCase()
                                                ) ||
                                                    teamName.Name.toLowerCase() ===
                                                        (oldNames[
                                                            payroll.team.toLowerCase()
                                                        ]
                                                            ? oldNames[
                                                                  payroll.team.toLowerCase()
                                                              ].toLowerCase()
                                                            : ""))
                                        );
                                    }

                                    return {
                                        ...teamStat,
                                        Lat: teamLocation
                                            ? teamLocation.lat
                                            : null,
                                        Lon: teamLocation
                                            ? teamLocation.lon
                                            : null,
                                        Color: teamLocation
                                            ? teamLocation.color
                                            : null,
                                        Name: teamName ? teamName.Name : null,
                                        Team_id: teamName
                                            ? teamName.Abbreviation
                                            : null,
                                        Payroll: teamPayroll
                                            ? teamPayroll.payroll.replace(
                                                  /[,$]/g,
                                                  ""
                                              )
                                            : null,
                                    };
                                });

                                const filteredData = mergedData.filter(
                                    (team) =>
                                        team.Team !== "Central Division" &&
                                        team.Team !== "Midwest Division" &&
                                        team.Lat !== null &&
                                        team.lon !== null &&
                                        team.color !== null &&
                                        team.name !== null &&
                                        team.team_id !== null &&
                                        team.payroll !== null
                                );

                                const csvWriter = createCsvWriter({
                                    path: "datasets/teams_stats_cleaned.csv",
                                    header: [
                                        { id: "W", title: "W" },
                                        { id: "L", title: "L" },
                                        { id: "W/L%", title: "W/L%" },
                                        { id: "PS/G", title: "PS/G" },
                                        { id: "PA/G", title: "PA/G" },
                                        { id: "PA/G", title: "PA/G" },
                                        { id: "Year", title: "Year" },
                                        { id: "Lat", title: "Lat" },
                                        { id: "Lon", title: "Lon" },
                                        { id: "Color", title: "Color" },
                                        { id: "Name", title: "Name" },
                                        { id: "Team_id", title: "Team_id" },
                                        { id: "Payroll", title: "Payroll" },
                                    ],
                                });

                                csvWriter
                                    .writeRecords(filteredData)
                                    .then(() =>
                                        console.log(
                                            "Merged CSV file was written successfully"
                                        )
                                    );
                            });
                    });
            });
    });
