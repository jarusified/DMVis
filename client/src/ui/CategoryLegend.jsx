import { useTheme } from "@mui/material/styles";
import * as d3 from "d3";
import { useEffect } from "react";

function drawCategories(id, props) {
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
		.append("rect")
		.attr("width", 18)
		.attr("height", 18)
		.attr("fill", (d) => d.value);

	legend
		.append("text")
		.attr("x", 24)
		.attr("y", 9)
		.attr("font-size", props.fontSize)
		.attr("dy", "0.35em")
		.text(function (d) {
			return d.key;
		});
}

export default function CategoryLegend(props) {
	const theme = useTheme();

	const categoryProps = {
		bottom: 20,
		height: 85,
		left: 50,
		right: 50,
		top: 0,
		width: 200,
		categories: props.colormap,
		fontSize: theme.text.fontSize
	};
	useEffect(() => {
		drawCategories("catLegend", categoryProps);
	}, [props]);

	return (
		<svg
			id="catLegend"
			width={categoryProps.width}
			height={categoryProps.height}
		></svg>
	);
}
