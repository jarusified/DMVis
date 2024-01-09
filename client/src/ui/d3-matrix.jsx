import { useTheme } from "@mui/material/styles";
import * as d3 from "d3";
import { interpolateReds } from "d3-scale-chromatic";
import { useEffect } from "react";

function D3Matrix(props) {
	const { containerName, matrixData, style } = props;
	const theme = useTheme();

	useEffect(() => {
		if (matrixData != undefined) {
			// Clean up existing elements
			const containerID = "#" + containerName;
			d3.select(containerID).selectAll("*").remove();

			const data = [];
			for (let i = 0; i < matrixData.length; i += 1) {
				for (let j = 0; j < matrixData[i].length; j += 1) {
					if (matrixData[i][j] != undefined) {
						data.push({
							source: i,
							target: j,
							value: matrixData[i][j]
						});
					}
				}
			}

			let hashNode = (x, y) => x + " -> " + y;

			let nodeSet = new Set();
			data.forEach((elem) => {
				nodeSet.add(elem.source);
				nodeSet.add(elem.target);
			});

			let nodes = [];
			nodeSet.forEach((elem) => nodes.push(elem));
			nodes.sort((a, b) => a - b);

			let grids = new Map();
			for (let src of nodes) {
				for (let tgt of nodes) {
					if (src != undefined && tgt != undefined) {
						if (matrixData[src][tgt] != undefined) {
							grids.set(hashNode(src, tgt), {
								x: tgt,
								y: src,
								value: 0
							});
						}
					}
				}
			}

			data.forEach((elem) => {
				const from_hash = hashNode(elem.source, elem.target);
				const to_hash = hashNode(elem.target, elem.source);

				if (grids.has(from_hash))
					grids.get(hashNode(elem.source, elem.target)).value =
						elem.value;
				// if (grids.has(to_hash))
				// 	grids.get(hashNode(elem.target, elem.source)).value =
				// 		elem.value;
			});

			const width = style.width - style.left - style.right;
			const height = style.height - style.top - style.bottom;

			const rectWidth = 20;
			const rectHeight = 20;

			function reset() {
				svg.transition()
					.duration(750)
					.call(zoom.transform, d3.zoomIdentity);
			}

			// prevent scrolling then apply the default filter
			function filter(event) {
				event.preventDefault();
				return (
					(!event.ctrlKey || event.type === "wheel") && !event.button
				);
			}

			function zoomed({ transform }) {
				svg.attr("transform", transform);
				// gX.call(xScale.scale(transform.rescaleX(xScale)));
				// gY.call(yScale.scale(transform.rescaleY(yScale)));
			}

			const zoom = d3
				.zoom()
				.scaleExtent([1, 40])
				.translateExtent([
					[-100, -100],
					[width + 90, height + 100]
				])
				.filter(filter)
				.on("zoom", zoomed);

			let svg = d3
				.select(containerID)
				.append("svg")
				.attr("x", 0.5)
				.attr("y", 0.5)
				.attr("width", style.width - 1)
				.attr("height", style.height - 1)
				.append("g")
				.attr("viewBox", [0, 0, width, height])
				.call(zoom);

			// TODO: Remove this!!!
			let margin = { left: 130, right: 150, top: 100, bottom: 0 };

			let xScale = d3
				.scaleLinear()
				.range([
					style.left + margin.left,
					width -
						style.left -
						style.right -
						margin.left -
						margin.right
				])
				.domain([0, 3]);

			let yScale = d3
				.scaleLinear()
				.range([style.top, height - style.top - style.bottom])
				.domain([0, nodes.length]);

			const values = [];
			for (let d of data) {
				values.push(d.value);
			}

			const cScale = d3
				.scaleSequential()
				.interpolator(interpolateReds)
				.domain([0, d3.sum(data, (d) => d.value)]);

			let tooltip = d3
				.select(containerID)
				.append("div")
				.attr("class", "tooltip")
				.style("opacity", 0);

			svg.selectAll("g")
				.data(nodes)
				.enter()
				.append("text")
				.attr("text-anchor", "middle")
				.attr("x", xScale(6))
				.attr("y", (d) => yScale(d) + 15)
				.attr("font-size", theme.text.fontSize)
				.text((d) => {
					return "GPU-" + d;
				});

			svg.selectAll("g")
				.data([0, 1, 2, 3])
				.enter()
				.append("text")
				.attr("text-anchor", "middle")
				.attr("font-size", theme.text.fontSize)
				.attr("x", (d) => {
					return xScale(d * 2) + margin.left + rectWidth / 2 - 10;
				})
				.attr("y", 250)
				.text((d) => {
					return "";
					return "D - " + d;
				});
			// .attr("transform", "rotate(-90)");

			svg.selectAll("rect")
				.data(grids)
				.enter()
				.append("rect")
				.attr("x", (d) => {
					return xScale(d[1].x) + margin.left;
				})
				.attr("y", (d) => yScale(d[1].y))
				.attr("width", rectWidth)
				.attr("height", rectHeight)
				.attr("stroke", "black")
				.attr("stroke-width", 0.5)
				.attr("fill", (d) => cScale(d[1].value))
				.on("mouseover", function (event, d) {
					svg.selectAll("rect").attr("stroke-width", (g) =>
						g[1].x === d[1].x || g[1].y === d[1].y ? 2 : 0.5
					);
					tooltip.transition().duration(200).style("opacity", 0.9);
					tooltip
						.html("link: " + d[0])
						.style("left", event.pageX + 10 + "px")
						.style("top", event.pageY - 10 + "px");
				})
				.on("mouseout", function () {
					svg.selectAll("rect").attr("stroke-width", 0.5);
					tooltip.transition().duration(600).style("opacity", 0);
				});
		}
	}, [props]);

	return <div id={containerName}></div>;
}
export default D3Matrix;
