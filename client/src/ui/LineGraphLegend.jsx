import { useTheme } from "@mui/material/styles";
import * as d3 from "d3";
import { useEffect } from "react";

function drawLineGraphs(id, props) {
	let legend = d3
		.select("#" + id)
		.selectAll("g")
		.data(props.categories)
		.enter()
		.append("g")
		.attr("transform", function (d, i) {
			return (
				"translate(0," +
				(i + (props.categories.length - 1) / 8) * 20 +
				")"
			);
		});

	legend
		.append("line")
		.style("stroke", (d) => d[1])
		.style("stroke-width", 10)
		.attr("x1", 0)
		.attr("y1", 10)
		.attr("x2", 20)
		.attr("y2", 10);

	legend
		.append("text")
		.attr("x", 24)
		.attr("y", 9)
		.attr("font-size", props.fontSize)
		.attr("dy", "0.35em")
		.text((d) => {
			return d[0].toUpperCase();
		});
}

export default function CategoryLegend(props) {
	const theme = useTheme();

	const lineLegendProps = {
		bottom: 20,
		height: 85,
		left: 50,
		right: 50,
		top: 0,
		width: 200,
		categories: [
			["GPU Utilization", theme.palette.gpuUtilization],
			["CPU Utilization", theme.palette.cpuUtilization]
		],
		fontSize: theme.text.fontSize
	};
	useEffect(() => {
		if (props.range[0] != props.range[1]) {
			drawLineGraphs("lineLegend", lineLegendProps);
		}
	}, [props]);

	return (
		<svg
			id="lineLegend"
			width={lineLegendProps.width}
			height={lineLegendProps.height}
		></svg>
	);
}
