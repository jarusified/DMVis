import * as d3 from "d3";
import { useEffect } from "react";

function D3LineGraph(props) {
	const { containerName, xData, yData, style, xProp} = props;

	useEffect(() => {
		// Clean up existing elements
		const containerID = "#" + containerName;
		d3.select(containerID).selectAll("*").remove();

		const width = style.width - style.left - style.right;
		const height = style.height - style.bottom - style.top;

		let datum = xData.map((x, i) => {
			return [x, yData[i]];
		})

		let svg = d3
			.select(containerID)
			.append("svg")
			.attr("width", style.width)
			.attr("height", style.height)
			.append("g")
			.attr(
				"transform",
				"translate(" + 2 * style.left + "," + -style.bottom + ")"
			);

		let x = d3.scaleLinear()
			.domain([d3.min(xData), d3.max(xData)])
			.range([0, width]);

		let y = d3
			.scaleLinear()
			.domain([d3.max(yData), 0])
			.range([0, height]);

		let xAxis = d3
			.axisBottom()
			.scale(x)
			.ticks(10)
			.tickFormat((d) => "");

		let yAxis = d3
			.axisLeft()
			.scale(y)
			.ticks(3)
			.tickFormat((d) => d);

		const curve = d3
			.line()
			.x((d) => x(d[0]))
			.y((d) => y(d[1]));

		svg.append("path")
			.attr("class", "line")
			.datum(datum)
			.attr("d", curve)
			.attr("fill", "#83CDD2");

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.selectAll("text")
			.style("text-anchor", "end")
			.attr("dy", 3)
			.attr("dx", -3)
			.attr("transform", "rotate(90)")

		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 1)
			.attr("dy", "0.71em")
			.style("text-anchor", "end")
			.text("time");

		svg.append("text")
			.attr("class", "x label")
			.attr("text-anchor", "end")
			.attr("font-size", 12)
			.attr("x", - style.left / 2)
			.attr("y", 20)
			.text(xProp);
	}, [props]);

	return <div id={containerName}></div>

}
export default D3LineGraph;
