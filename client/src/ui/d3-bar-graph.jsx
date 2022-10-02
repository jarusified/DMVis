import * as d3 from "d3";

import { COLORS, formatTimestamp } from "../helpers/utils";

function D3BarGraph(containerName, style, data, xProp, yProp) {
	const width = style.width - style.left - style.right;
	const height = style.height - style.bottom - style.top;

	// Clean up existing elements
	const containerID = "#" + containerName;
	d3.select(containerID).selectAll("*").remove();

	const xData = data.map((d) => d[xProp]);
	const yData = data.map((d) => d[yProp]);

	let x = d3.scaleBand().domain(xData).range([0, width]).padding(0.2);

	let y = d3
		.scaleLinear()
		.domain([d3.min(yData), d3.max(yData)])
		.range([height, 0])
		.nice(5);

	let xAxis = d3
		.axisBottom()
		.scale(x)
		.ticks(10)
		.tickPadding(-x.bandwidth() / 2)
		.tickSizeOuter(2)
		.tickFormat((d) => d);

	let yAxis = d3
		.axisLeft()
		.scale(y)
		.ticks(5)
		.tickFormat((d) => formatTimestamp(d));

	let svg = d3
		.select(containerID)
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr(
			"transform",
			"translate(" + 2 * style.left + "," + -style.bottom + ")"
		);

	svg.selectAll("bars")
		.data(data)
		.enter()
		.append("rect")
		.attr("x", (d) => {
			return x(d.event);
		})
		.attr("y", (d) => {
			return y(d.dur);
		})
		.attr("class", (d) => {
			return d.class_name;
		})
		.attr("width", x.bandwidth())
		.attr("height", (d) => {
			return height - y(d.dur);
		})
		.attr("fill", (d) => {
			return COLORS[d.class_name];
		});

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.selectAll("text")
		.attr("dy", x.bandwidth() / 2)
		.attr("dx", -3)
		.style("text-anchor", "end")
		.attr("transform", "rotate(90)");

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 0)
		.attr("dy", "1em")
		.style("text-anchor", "end")
		.text("time (s))");
}
export default D3BarGraph;
