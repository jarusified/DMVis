import { useTheme } from "@mui/material/styles";
import * as d3 from "d3";
import { useEffect } from "react";

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
		.attr("font-size", props.fontSize)
		.attr("x", props.left)
		.attr("y", props.height - props.bottom - props.top)
		.text(props.captionLeft);

	d3.select("#" + id)
		.append("text")
		.attr("font-size", props.fontSize)
		.attr("x", xScale(90))
		.attr("y", props.height - props.bottom - props.top)
		.text(props.captionRight);

	d3.select("#" + id)
		.append("text")
		.attr("font-size", props.fontSize)
		.attr("x", props.width / 2 - props.left - props.right)
		.attr("y", props.height - props.top - props.bottom)
		.text(props.caption.toUpperCase());
}

export default function LinearScaleLegend(props) {
	const theme = useTheme();

	const runtimeProps = {
		bottom: 20,
		captionLeft: props.range[0],
		captionRight: props.range[1],
		caption: props.caption,
		height: 60,
		interpolator: props.interpolator,
		left: 50,
		right: 50,
		top: 25,
		width: 400,
		fontSize: theme.text.fontSize
	};
	useEffect(() => {
		if (props.range[0] != props.range[1]) {
			drawLinearScale(props.containerID, runtimeProps);
		}
	}, [props]);

	return (
		<svg
			id={props.containerID}
			width={runtimeProps.width}
			height={runtimeProps.height}
		></svg>
	);
}
