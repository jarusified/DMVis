import * as d3 from "d3";
import { useEffect } from "react";

function D3LineGraph({ containerName, xData, yData, style, xProp }) {
	useEffect(() => {
		// Clean up existing elements
		const containerID = `#${containerName}`;
		d3.select(containerID).selectAll("*").remove();

		const { width, height, left, right, bottom, top, fontSize } = style;
		const innerWidth = width - left - right;
		const innerHeight = height - bottom - top;

		const datum = xData.map((x, i) => [x, yData[i]]);

		const svg = d3
			.select(containerID)
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", `translate(${2 * left},${0 * bottom})`);

		const x = d3.scaleLinear().domain([d3.min(xData), d3.max(xData)]).range([0, innerWidth]);

		const y = d3.scaleLinear().domain([d3.max(yData), 0]).range([0, innerHeight]);

		const xAxis = d3.axisBottom().scale(x).ticks(10).tickFormat(() => "");

		const yAxis = d3.axisLeft().scale(y).ticks(3).tickFormat(d => d);

		const curve = d3.line().x(d => x(d[0])).y(d => y(d[1]));

		// Append line
		svg.append("path").attr("class", "line").datum(datum).attr("fill", "none").attr("stroke", "#83CDD2").attr("width", 10).attr("d", curve);

		// Append x-axis
		svg.append("g").attr("class", "x axis").attr("transform", `translate(0,${innerHeight})`).call(xAxis).selectAll("text").style("text-anchor", "end").style("fill", "#4d4d4d").attr("dy", 3).attr("dx", -3).attr("transform", "rotate(90)");

		// Append y-axis
		svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 1).attr("dy", "0.71em").style("text-anchor", "end").style("fill", "#4d4d4d");

		// Tooltip
		const tooltip = d3.select(containerID).append("div").attr("class", "tooltip").style("opacity", 0);

		// Append x-axis label with tooltip
		svg.append("text").attr("class", "x label").attr("text-anchor", "end").attr("font-size", fontSize).attr("x", -left / 2).attr("y", height / 2).text(xProp.slice(0, 18).toUpperCase()).style("cursor", "pointer").style("fill", "#4d4d4d").on("mouseover", function (e) {
			tooltip.transition().duration(200).style("opacity", 0.9);
			tooltip.html(xProp.toUpperCase()).style("left", e.pageX + "px").style("top", e.pageY - 28 + "px");
		}).on("mouseout", function () {
			tooltip.transition().duration(500).style("opacity", 0);
		});
	}, [containerName, xData, yData, style, xProp]);

	return <div id={containerName}></div>;
}

export default D3LineGraph;
