import * as d3 from "d3";
import { interpolateOranges } from "d3-scale-chromatic";
import { useEffect, useState } from "react";

import { COLORS, formatDuration, setContrast } from "../helpers/utils";

export default function D3RadialBarGraph(props) {
	const {
		containerName,
		style,
		xProp,
		yProp,
		zProp,
		maxY,
		classNames,
		startTs,
		endTs,
		ensembleSummary
	} = props;

	const [hover, setHover] = useState(false);

	useEffect(() => {
		const containerID = "#" + containerName;
		d3.select(containerID).selectAll("*").remove();

		let svg = d3
			.select(containerID)
			.append("svg")
			.attr("width", style.width)
			.attr("height", style.height)
			.attr(
				"viewBox",
				`${-style.width / 2} ${-style.height / 2} ${style.width} ${
					style.height
				}`
			)
			.style("cursor", "pointer")
			.style("font", "10px sans-serif")
			.on("click", (d) => {
				setHover((hover) => !hover);
			});

		let innerRadius = 80,
			outerRadius = Math.min(style.width, style.height) / 2;

		let x = d3
			.scaleBand()
			.range([0, 2 * Math.PI])
			.align(0)
			.domain(xProp);

		let y = d3
			.scaleRadial()
			.range([innerRadius, outerRadius])
			.domain([0, maxY]);

		const arc = d3
			.arc()
			.innerRadius((d) => y(d[0]))
			.outerRadius((d) => y(d[1]))
			.startAngle((d) => x(d.data.ts))
			.endAngle((d) => x(d.data.ts) + x.bandwidth())
			.padAngle(0.01)
			.padRadius(innerRadius);

		svg.append("g")
			.selectAll("g")
			.data(d3.stack().keys(zProp)(yProp))
			.join("g")
			.attr("fill", (d) => {
				const class_name = classNames[d.key];
				return COLORS[class_name];
			})
			.selectAll("path")
			.data((d) => d)
			.join("path")
			.attr("d", arc);

		// Add labels
		let label = svg
			.append("g")
			.selectAll("g")
			.data(xProp)
			.enter()
			.append("g")
			.attr("text-anchor", "middle")
			.attr("transform", (d) => {
				return (
					"rotate(" +
					(((x(d) + x.bandwidth() / 2) * 180) / Math.PI - 90) +
					")translate(" +
					innerRadius +
					",0)"
				);
			});

		label.append("line").attr("x2", -5).attr("stroke", "#000");

		label
			.append("text")
			.attr("class", "hidden-text")
			.attr("opacity", 0)
			.attr("transform", (d) => {
				return (x(d) + x.bandwidth() / 2 + Math.PI / 2) %
					(2 * Math.PI) <
					Math.PI
					? "rotate(90)translate(0,16)"
					: "rotate(-90)translate(0,-9)";
			})
			.text((d) => formatDuration(d, startTs, false));

		// Add secondary encoding.
		const this_duration = endTs - startTs;
		const ensemble_duration = ensembleSummary["runtime_range"][1] - ensembleSummary["runtime_range"][0];
		const runtime_color = interpolateOranges(this_duration / ensemble_duration);
		const runtime_color_contrast = setContrast(runtime_color);
		svg.append("circle")
			.attr("cx", "50%")
			.attr("cy", "50%")
			.attr("r", 40)
			.style("fill", runtime_color)
			.attr("transform", () => {
				return (
					"translate(" +
					-style.width / 2 +
					"," +
					-style.height / 2 +
					")"
				);
			});

		svg.append("text")
			.attr("class", "hidden-text")
			.attr("fill", runtime_color_contrast)
			.attr("font-size", 12)
			.attr("transform", () => {
				return "translate(" + -20 + "," + 0 + ")";
			})
			.text(formatDuration(endTs, startTs, true));

		// Add y-axis ticks.
		// Commented out for now.
		let yAxis = svg.append("g").attr("text-anchor", "middle");

		// let yTick = yAxis
		// 	.selectAll("g")
		// 	.data(y.ticks(3).slice(1))
		// 	.enter()
		// 	.append("g");

		// yTick
		// 	.append("circle")
		// 	.attr("fill", "none")
		// 	.attr("stroke", "#F6F4F9")
		// 	.attr("stroke-width", 0.5)
		// 	.attr("r", y);

		// yTick
		// 	.append("text")
		// 	.attr("y", function (d) {
		// 		return -y(d);
		// 	})
		// 	.attr("dy", "0.35em")
		// 	.attr("fill", "none")
		// 	.attr("stroke", "#fff")
		// 	.attr("stroke-width", 5)
		// 	.text((d) => formatTimestamp(d));

		// yTick
		// 	.append("text")
		// 	.attr("y", function (d) {
		// 		return -y(d);
		// 	})
		// 	.attr("dy", "0.35em")
		// 	.text((d) => formatTimestamp(d));

		// yAxis
		// 	.append("text")
		// 	.attr("y", function (d) {
		// 		return -y(0);
		// 	})
		// 	.attr("dy", "10em")
		// 	.text("");
	}, [props]);

	useEffect(() => {
		if (hover) {
			d3.selectAll(".hidden-text").attr("opacity", 1);
		} else {
			d3.selectAll(".hidden-text").attr("opacity", 0);
		}
	}, [hover]);

	return <div id={containerName}></div>;
}
