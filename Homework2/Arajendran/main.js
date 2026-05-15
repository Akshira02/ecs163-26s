// HW2 Dashboard
// Question: which groups are more likely to say music helps?
// Views: stacked bar chart, bubble scatter plot, and radar/star plot.

var rows = [];
var chosenEffect = null;

var effectOrder = ["Improve", "No effect", "Worsen", "Unknown"];

var effectColor = {
    "Improve": "#457b9d",
    "No effect": "#8ab17d",
    "Worsen": "#e76f51",
    "Unknown": "#9e9e9e"
};

// Load the selected music and mental health dataset.
d3.csv("music_mental_health.csv").then(function(data) {

    data.forEach(function(d, i) {
        d.id = i;

        // Convert columns that should be numbers.
        d.Age = +d.Age;
        d.Hours = +d["Hours per day"];
        d.Anxiety = +d.Anxiety;
        d.Depression = +d.Depression;
        d.Insomnia = +d.Insomnia;
        d.OCD = +d.OCD;

        // Create one combined score to size the scatter plot circles.
        d.totalScore = d.Anxiety + d.Depression + d.Insomnia + d.OCD;

        // Clean missing music effect labels.
        if (!d["Music effects"] || d["Music effects"].trim() === "") {
            d["Music effects"] = "Unknown";
        }

        // Group ages into readable categories.
        if (d.Age < 18) {
            d.ageGroup = "Under 18";
        } else if (d.Age <= 24) {
            d.ageGroup = "18-24";
        } else if (d.Age <= 34) {
            d.ageGroup = "25-34";
        } else {
            d.ageGroup = "35+";
        }
    });

    // Keep rows that have all the values used by the charts.
    rows = data.filter(function(d) {
        return !isNaN(d.Age) &&
               !isNaN(d.Hours) &&
               !isNaN(d.Anxiety) &&
               !isNaN(d.Depression) &&
               !isNaN(d.Insomnia) &&
               !isNaN(d.OCD);
    });

    updateDashboard();

    // Clears the selected music effect filter.
    d3.select("#clear").on("click", function() {
        chosenEffect = null;
        updateDashboard();
    });
});

// Returns filtered data based on the clicked effect group.
function getFilteredRows() {
    if (chosenEffect === null) {
        return rows;
    }

    return rows.filter(function(d) {
        return d["Music effects"] === chosenEffect;
    });
}

// Redraw all charts when the user clicks a filter.
function updateDashboard() {
    d3.select("#clear").style("display", chosenEffect ? "block" : "none");
    drawScatter(getFilteredRows());
    drawStackedBars(rows);
    drawRadar(getFilteredRows());
}

// Draws the large focus scatter plot.
function drawScatter(data) {
    var svg = d3.select("#scatter");
    svg.selectAll("*").remove();

    var width = svg.node().clientWidth;
    var height = svg.node().clientHeight;
    var margin = { top: 22, right: 25, bottom: 45, left: 50 };
    var chartW = width - margin.left - margin.right;
    var chartH = height - margin.top - margin.bottom;

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // X axis shows age.
    var x = d3.scaleLinear()
        .domain(d3.extent(rows, function(d) { return d.Age; }))
        .range([0, chartW])
        .nice();

    // Y axis shows daily music listening time.
    var y = d3.scaleLinear()
        .domain([0, d3.min([16, d3.max(rows, function(d) { return d.Hours; })])])
        .range([chartH, 0])
        .nice();

    // Circle size shows total mental health score.
    var r = d3.scaleSqrt()
        .domain(d3.extent(rows, function(d) { return d.totalScore; }))
        .range([3, 12]);

    // Add horizontal gridlines.
    g.append("g")
        .call(d3.axisLeft(y).ticks(7).tickSize(-chartW).tickFormat(""))
        .selectAll("line")
        .attr("stroke", "#eeeeee");

    // Add x axis.
    g.append("g")
        .attr("transform", "translate(0," + chartH + ")")
        .call(d3.axisBottom(x).ticks(6))
        .selectAll("text")
        .attr("font-size", "10px");

    // Add y axis.
    g.append("g")
        .call(d3.axisLeft(y).ticks(7))
        .selectAll("text")
        .attr("font-size", "10px");

    g.selectAll(".domain").attr("stroke", "#cccccc");

    var tip = d3.select("#tooltip");

    // Draw one circle per person in the survey.
    g.selectAll(".person")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "person")
        .attr("cx", function(d) { return x(d.Age); })
        .attr("cy", function(d) { return y(Math.min(d.Hours, 16)); })
        .attr("r", function(d) { return r(d.totalScore); })
        .attr("fill", function(d) { return effectColor[d["Music effects"]] || effectColor.Unknown; })
        .attr("opacity", 0.55)
        .attr("stroke", "white")
        .attr("stroke-width", 0.6)
        .on("mousemove", function(d) {
            tip.style("display", "block")
                .style("left", (d3.event.clientX + 12) + "px")
                .style("top", (d3.event.clientY + 12) + "px")
                .html(
                    "<b>Age:</b> " + d.Age + "<br>" +
                    "<b>Hours/day:</b> " + d.Hours + "<br>" +
                    "<b>Effect:</b> " + d["Music effects"] + "<br>" +
                    "<b>Total score:</b> " + d.totalScore
                );
        })
        .on("mouseleave", function() {
            tip.style("display", "none");
        });

    // X-axis label.
    svg.append("text")
        .attr("x", margin.left + chartW / 2)
        .attr("y", height - 9)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("fill", "#555")
        .text("Age");

    // Y-axis label.
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -margin.top - chartH / 2)
        .attr("y", 14)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("fill", "#555")
        .text("Hours of music per day");
}

// Draws the stacked bar overview.
function drawStackedBars(data) {
    var svg = d3.select("#stacked");
    svg.selectAll("*").remove();

    var width = svg.node().clientWidth;
    var height = svg.node().clientHeight;
    var margin = { top: 14, right: 20, bottom: 36, left: 56 };
    var chartW = width - margin.left - margin.right;
    var chartH = height - margin.top - margin.bottom;

    var ageGroups = ["Under 18", "18-24", "25-34", "35+"];

    // Build counts for every age group and music effect.
    var countData = ageGroups.map(function(group) {
        var obj = { ageGroup: group };

        effectOrder.forEach(function(effect) {
            obj[effect] = data.filter(function(d) {
                return d.ageGroup === group && d["Music effects"] === effect;
            }).length;
        });

        return obj;
    });

    // Stack the effect columns so they become one bar per age group.
    var stack = d3.stack()
        .keys(effectOrder);

    var stackedData = stack(countData);

    var maxTotal = d3.max(countData, function(d) {
        return effectOrder.reduce(function(sum, key) {
            return sum + d[key];
        }, 0);
    });

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // X scale maps number of responses to bar width.
    var x = d3.scaleLinear()
        .domain([0, maxTotal])
        .range([0, chartW])
        .nice();

    // Y scale maps age groups to rows.
    var y = d3.scaleBand()
        .domain(ageGroups)
        .range([0, chartH])
        .padding(0.28);

    // Add x axis.
    g.append("g")
        .attr("transform", "translate(0," + chartH + ")")
        .call(d3.axisBottom(x).ticks(4))
        .selectAll("text")
        .attr("font-size", "9px");

    // Add y axis.
    g.append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .attr("font-size", "10px");

    g.selectAll(".domain").attr("stroke", "#ddd");

    // Draw each stacked effect segment.
    g.selectAll(".effect-layer")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("class", "effect-layer")
        .attr("fill", function(d) { return effectColor[d.key]; })
        .selectAll("rect")
        .data(function(d) {
            return d.map(function(item) {
                item.key = d.key;
                return item;
            });
        })
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d[0]); })
        .attr("y", function(d) { return y(d.data.ageGroup); })
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("height", y.bandwidth())
        .attr("opacity", function(d) {
            return chosenEffect === null || chosenEffect === d.key ? 1 : 0.25;
        })
        .style("cursor", "pointer")
        .on("click", function(d) {
            chosenEffect = chosenEffect === d.key ? null : d.key;
            updateDashboard();
        });

    // Label for x axis.
    svg.append("text")
        .attr("x", margin.left + chartW / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#666")
        .text("Number of responses");
}

// Draws the advanced radar/star plot.
// This view shows the average symptom scores for the selected group.
function drawRadar(data) {
    var svg = d3.select("#radar");
    svg.selectAll("*").remove();

    var width = svg.node().clientWidth;
    var height = svg.node().clientHeight;

    var symptoms = ["Anxiety", "Depression", "Insomnia", "OCD"];

    var cx = width / 2;
    var cy = height / 2 + 8;
    var radius = Math.min(width, height) * 0.28;

    var g = svg.append("g")
        .attr("transform", "translate(" + cx + "," + cy + ")");

    // Average score for each symptom.
    var averages = symptoms.map(function(symptom) {
        return {
            symptom: symptom,
            value: d3.mean(data, function(d) { return d[symptom]; }) || 0
        };
    });

    // Converts score values from 0-10 into distance from the center.
    var r = d3.scaleLinear()
        .domain([0, 10])
        .range([0, radius]);

    // Finds the angle for each symptom.
    function getAngle(i) {
        return (Math.PI * 2 / symptoms.length) * i - Math.PI / 2;
    }

    // Draw background diamond rings.
    [2, 4, 6, 8, 10].forEach(function(level) {
        var points = symptoms.map(function(symptom, i) {
            var a = getAngle(i);
            return [
                Math.cos(a) * r(level),
                Math.sin(a) * r(level)
            ];
        });

        g.append("polygon")
            .attr("points", points.map(function(p) {
                return p[0] + "," + p[1];
            }).join(" "))
            .attr("fill", "none")
            .attr("stroke", "#dddddd")
            .attr("stroke-width", 1);
    });

    // Draw axis lines and labels.
    symptoms.forEach(function(symptom, i) {
        var a = getAngle(i);
        var x2 = Math.cos(a) * radius;
        var y2 = Math.sin(a) * radius;

        // Axis line.
        g.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke", "#dddddd");

        // Label position.
        var labelX = Math.cos(a) * (radius + 28);
        var labelY = Math.sin(a) * (radius + 28);

        g.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "11px")
            .attr("fill", "#555")
            .text(symptom);
    });

    // Create the shape using the average scores.
    var radarPoints = averages.map(function(d, i) {
        var a = getAngle(i);
        return [
            Math.cos(a) * r(d.value),
            Math.sin(a) * r(d.value)
        ];
    });

    var mainColor = chosenEffect ? effectColor[chosenEffect] : "#546a7b";

    // Draw the filled radar shape.
    g.append("polygon")
        .attr("points", radarPoints.map(function(p) {
            return p[0] + "," + p[1];
        }).join(" "))
        .attr("fill", mainColor)
        .attr("fill-opacity", 0.28)
        .attr("stroke", mainColor)
        .attr("stroke-width", 2);

    // Draw a dot for each average score.
    g.selectAll(".radar-dot")
        .data(averages)
        .enter()
        .append("circle")
        .attr("class", "radar-dot")
        .attr("cx", function(d, i) {
            var a = getAngle(i);
            return Math.cos(a) * r(d.value);
        })
        .attr("cy", function(d, i) {
            var a = getAngle(i);
            return Math.sin(a) * r(d.value);
        })
        .attr("r", 4)
        .attr("fill", mainColor);

    // Add score labels next to the dots.
    g.selectAll(".score-label")
        .data(averages)
        .enter()
        .append("text")
        .attr("class", "score-label")
        .attr("x", function(d, i) {
            var a = getAngle(i);
            return Math.cos(a) * (r(d.value) + 12);
        })
        .attr("y", function(d, i) {
            var a = getAngle(i);
            return Math.sin(a) * (r(d.value) + 12);
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("fill", "#444")
        .text(function(d) {
            return d.value.toFixed(1);
        });

    // Title inside the chart.
    svg.append("text")
        .attr("x", cx)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-weight", "bold")
        .attr("fill", "#444")
        .text(chosenEffect ? "Filtered: " + chosenEffect : "All responses");

    // Count label.
    svg.append("text")
        .attr("x", cx)
        .attr("y", height - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#777")
        .text("n = " + data.length);
}
