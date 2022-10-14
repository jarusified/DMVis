import * as d3 from "d3";
import { interpolateOranges } from "d3-scale-chromatic";
import { useEffect, useState } from "react";

function drawCategories(id, props) {
    // console.log(props.colormap);
	let legend = d3
		.select("#" + id)
		.selectAll("g")
		.data(props.categories)
		.enter()
		.append("g")
		.attr("transform", function (d, i) {
            console.log( ( (props.categories.length - 1) / 8) * 20);
			return "translate(0," + ( i + (props.categories.length - 1) / 8) * 20 + ")";
		});

	legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", (d) => d.value);

	legend
		.append("text")
		.attr("x", 24)
		.attr("y", 9)
		.attr("dy", "0.35em")
		.text(function (d) {
			return d.key;
		});
}

export default function CategoryLegend(props) {
	const categoryProps = {
		bottom: 20,
		height: 70,
		left: 50,
		right: 50,
		top: 25,
		width: 400,
        categories: props.colormap
	};
	useEffect(() => {
		drawCategories("catLegend", categoryProps)
	}, [props]);

	return (
		<svg
			id="catLegend"
			width={categoryProps.width}
			height={categoryProps.height}
		></svg>
	);
}
