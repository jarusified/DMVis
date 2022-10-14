import * as d3 from "d3";
import { interpolateOranges } from "d3-scale-chromatic";
import { useEffect, useState } from "react";

function drawLinearScale(id, props) {
	const data = Array.from(Array(100).keys());

	d3.select("#" + id)
		.selectAll("*")
		.remove();

	const cScale = d3
		.scaleSequential()
		.interpolator(props.interpolator)
		.domain([0, 100]);

	const xScale = d3
		.scaleLinear()
		.domain([0, 100])
		.range([props.left, props.width - props.right - props.left]);

	d3.select("#" + id)
		.selectAll("rect")
		.data(data)
		.enter()
		.append("rect")
		.attr("x", (d) => Math.floor(xScale(d)))
		.attr("y", props.top)
		.attr("height", props.height - props.top - props.bottom)
		.attr("width", (d) => {
			if (d == 100) {
				return 6;
			}
			return Math.floor(xScale(d + 1)) - Math.floor(xScale(d)) + 1;
		})
		.attr("fill", (d) => cScale(d));

	d3.select("#" + id)
		.append("text")
		.attr("font-size", 14)
		.attr("x", 0)
		.attr("y", props.height - props.bottom)
		.text(props.captionLeft);

	d3.select("#" + id)
		.append("text")
		.attr("font-size", 14)
		.attr("x", xScale(100) + 10)
		.attr("y", props.height - props.bottom)
		.text(props.captionRight);

	d3.select("#" + id)
		.append("text")
		.attr("font-size", 12)
		.attr("x", props.width / 2 - props.left / 2)
		.attr("y", props.height - props.top - props.bottom)
		.text(props.caption.toUpperCase());
}

function drawCategories(data, id) {
	let legend = d3
		.select("")
		.selectAll("g")
		.data(zProp)
		.enter()
		.append("g")
		.attr("transform", function (d, i) {
			return "translate(-40," + (i - (zProp.length - 1) / 2) * 20 + ")";
		});

	legend.append("rect").attr("width", 18).attr("height", 18).attr("fill", z);

	legend
		.append("text")
		.attr("x", 24)
		.attr("y", 9)
		.attr("dy", "0.35em")
		.text(function (d) {
			return d;
		});
}

export default function Legend(props) {
	const runtimeProps = {
		bottom: 20,
		captionLeft: props.range[0],
		captionRight: props.range[1],
		caption: "Runtime",
		height: 60,
		interpolator: interpolateOranges,
		left: 50,
		right: 50,
		top: 25,
		width: 400
	};
	useEffect(() => {
		drawLinearScale("legend", runtimeProps);
		// drawCategories("legend", ["a"])
	}, [props]);

	return (
		<svg
			id="legend"
			width={runtimeProps.width}
			height={runtimeProps.height}
		></svg>
	);
}
