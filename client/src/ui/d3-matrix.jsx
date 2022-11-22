import * as d3 from "d3";
import { useEffect } from "react";

function D3Matrix(props) {
	const { containerName, matrixData, style } = props;

	useEffect(() => {
		if (matrixData != undefined) {
			// Clean up existing elements
			const containerID = "#" + containerName;
			d3.select(containerID).selectAll("*").remove();

			console.log(matrixData);

			const data = [];
			for (let i = 0; i < matrixData.length; i += 1) {
				for (let j = 0; j < matrixData[i].length; j += 1) {
					data.push({
						source: i,
						targee: j,
						value: matrixData[i][j]
					});
				}
			}

			const width = style.width;
			const height = style.height;

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

			const gpuCount = 2;
			const cpuCount = 12;

			let x = d3.scaleLinear().domain([0, gpuCount]).range([style.left, style.right + width]);
			let y = d3.scaleLinear().domain([0, cpuCount]).range([height + style.top, style.bottom]);

			let margin = { left: 36, right: 0, top: 36, bottom: 0 };

			let tooltip = d3
				.select(containerID)
				.append("div")
				.attr("class", "tooltip")
				.style("opacity", 0);

			let xScale = d3.scaleBand().range([0, width]).padding(0.05),
			    yScale = d3.scaleBand().range([height, 0]).padding(0.05)

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
					grids.set(hashNode(src, tgt), { x: tgt, y: src, value: 0 });
				}
			}
			data.forEach((elem) => {
				grids.get(hashNode(elem.source, elem.target)).value =
					elem.value;
				grids.get(hashNode(elem.target, elem.source)).value =
					elem.value;
			});

			xScale.domain(nodes);
			yScale.domain(nodes);

			console.log(nodes);
			svg.selectAll("g")
				.data(nodes)
				.enter()
				.append("text")
				.attr("text-anchor", "middle")
				.attr("x", margin.left / 2)
				.attr("y", (d) => yScale(d) + 4)
				.text((d) => d);

			svg.selectAll("g")
				.data(nodes)
				.enter()
				.append("text")
				.attr("text-anchor", "middle")
				.attr("x", (d) => xScale(d))
				.attr("y", margin.top / 2)
				.text((d) => d);

			svg.selectAll("rect")
				.data(grids)
				.enter()
				.append("rect")
				.attr("x", (d) => xScale(d[1].x) - xScale.bandwidth() / 2)
				.attr("y", (d) => yScale(d[1].y) - xScale.bandwidth() / 2)
				.attr("width", xScale.bandwidth())
				.attr("height", yScale.bandwidth())
				.attr("stroke", "gray")
				.attr("stroke-width", 0.5)
				.attr("fill", (d) => (d[1].value === 0 ? "#ffffff" : "#5bb5e6"))
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
	}, [matrixData]);

	return <div id={containerName}></div>;
}
export default D3Matrix;
