import * as d3 from "d3";

import { COLORS, formatTimestamp, formatDuration } from "../helpers/utils";


function D3RadialBarGraph(containerName, style, xProp, yProp, zProp, maxY, class_names, start_ts) {
    const containerID = "#" + containerName;
    d3.select(containerID).selectAll("*").remove();

    let svg = d3.select(containerID)
        .append("svg")
        .attr("width", style.width)
        .attr("height", style.height)
        .attr("viewBox", `${-style.width / 2} ${-style.height / 2} ${style.width} ${style.height}`)
        .style("font", "10px sans-serif");

    let innerRadius = 80,
        outerRadius = Math.min(style.width, style.height) / 2;

    let x = d3.scaleBand()
        .range([0, 2 * Math.PI])
        .align(0)
        .domain(xProp);

    let y = d3.scaleRadial()
        .range([innerRadius, outerRadius])
        .domain([0, maxY]);

    svg.append("g")
        .selectAll("g")
        .data(d3.stack().keys(zProp)(yProp))
        .join("g")
        .attr("fill", (d) => {
            const class_name = class_names[d.key];
            return COLORS[class_name];
        })
        .selectAll("path")
        .data(function (d) { return d; })
        .join("path")
        .attr("d", d3.arc()
            .innerRadius((d) => { return y(d[0]); })
            .outerRadius((d) => { return y(d[1]); })
            .startAngle((d) => { return x(d.data.ts); })
            .endAngle((d) => { return x(d.data.ts) + x.bandwidth(); })
            .padAngle(0.01)
            .padRadius(innerRadius));
            
    var label = svg.append("g")
        .selectAll("g")
        .data(xProp)
        .enter().append("g")
        .attr("text-anchor", "middle")
        .attr("transform", function (d) {
            return "rotate(" + ((x(d) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)";
        });

    label.append("line")
        .attr("x2", -5)
        .attr("stroke", "#000");

    label.append("text")
        .attr("transform", function (d) {
            return (x(d) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)";
        })
        .text(function (d) { return formatDuration(d, start_ts, false); });

    var yAxis = svg.append("g")
        .attr("text-anchor", "middle");

    var yTick = yAxis
        .selectAll("g")
        .data(y.ticks(3).slice(1))
        .enter().append("g");

    yTick.append("circle")
        .attr("fill", "none")
        .attr("stroke", "#F6F4F9")
        .attr("stroke-width", 0.5)
        .attr("r", y);

    yTick.append("text")
        .attr("y", function (d) { return - y(d); })
        .attr("dy", "0.35em")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 5)
        .text((d) => formatTimestamp(d));

    yTick.append("text")
        .attr("y", function (d) { return -y(d); })
        .attr("dy", "0.35em")
        .text((d) => formatTimestamp(d));

    yAxis.append("text")
        .attr("y", function (d) { return -y(y.ticks(5).pop()); })
        .attr("dy", "-1em")
        .text("runtime");

    // var legend = g.append("g")
    //     .selectAll("g")
    //     .data(zProp)
    //     .enter().append("g")
    //     .attr("transform", function (d, i) { return "translate(-40," + (i - (zProp.length - 1) / 2) * 20 + ")"; });

    // legend.append("rect")
    //     .attr("width", 18)
    //     .attr("height", 18)
    //     .attr("fill", z);

    // legend.append("text")
    //     .attr("x", 24)
    //     .attr("y", 9)
    //     .attr("dy", "0.35em")
    //     .text(function (d) { return d; });
}

export default D3RadialBarGraph;
