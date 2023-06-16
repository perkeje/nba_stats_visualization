const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

function extractRank1Players(data) {
    const playerInfo = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(data)
            .pipe(csv({ separator: ";" }))
            .on("data", (row) => {
                const rank = row["Rank"];

                if (rank === "1") {
                    const player = {
                        Year: row["Year"],
                        Player: row["Player"],
                        Tm: row["Tm"],
                    };

                    playerInfo.push(player);
                }
            })
            .on("end", () => {
                resolve(playerInfo);
            })
            .on("error", (error) => {
                console.error("Error during read operation:", error); // Debug output
                reject(error);
            });
    });
}

// Function to save player information into a CSV file
function savePlayerInfoToCSV(playerInfo, outputPath) {
    const csvWriter = createCsvWriter({
        path: outputPath,
        header: [
            { id: "Year", title: "Year" },
            { id: "Player", title: "Player" },
            { id: "Tm", title: "Tm" },
        ],
    });

    return csvWriter
        .writeRecords(playerInfo)
        .then(() => {
            console.log("Player information saved to CSV successfully!");
        })
        .catch((error) => {
            console.error("Error during write operation:", error); // Debug output
        });
}

// Sample usage
const dataFilePath = "datasets/mvps.csv";
const outputFilePath = "datasets/mvps_cleaned.csv";

extractRank1Players(dataFilePath)
    .then((playerInfo) => {
        return savePlayerInfoToCSV(playerInfo, outputFilePath);
    })
    .catch((error) => {
        console.error(error);
    });
