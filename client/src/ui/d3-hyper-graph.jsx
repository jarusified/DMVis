import * as d3 from "d3";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";

import { fetchWindow } from "../actions";
import { COLORS } from "../helpers/utils";

export default function D3HyperGraph(props) {
	const dispatch = useDispatch();
	const theme = useTheme();

	const MIN_NODE_RADIUS = 8;
	const MAX_NODE_RADIUS = 30;

	const window = useSelector((store) => store.window);
	const appState = useSelector((store) => store.appState);
	const windowStart = useSelector((store) => store.windowStart);
	const windowEnd = useSelector((store) => store.windowEnd);


	// Collapse the node and all it's children
	// TODO: Make use of this to collapse large CCTs into nodes of higher
	// significance only.
	function collapse(d) {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			d.children = null;
		}
	}

	// TODO: Use this to highlight the activated call paths.
	function groupPath(vertices) {
		// not draw convex hull if vertices.length <= 1
		if (vertices.length >= 2) {
			if (vertices.length == 2) {
				let fake_point1 = vertices[0];
				let fake_point2 = vertices[1];
				vertices.push(fake_point1, fake_point2);
			}
			return "M" + d3.polygonHull(vertices).join("L") + "Z";
		}
	}

	useEffect(() => {
		const { data, containerName, style } = props;

		const treemap = d3.tree().size([style.height - 40, style.width - 100]);
		const root = d3.hierarchy(data);

		// Assigns the x and y position for the nodes
		var tree = treemap(root);

		const nodes = tree.descendants();
		const links = root.links();

		root.children.forEach(collapse);

		const _link_force = d3
			.forceLink(links)
			.id((d) => d.data.name)
			.distance(10)
			.strength(10);

		const simulation = d3
			.forceSimulation(nodes)
			.force("link", _link_force)
			.force("charge", d3.forceManyBody().strength(100))
			.force("x", d3.forceX())
			.force("y", d3.forceY())
			.force(
				"collide",
				d3.forceCollide((d) => 50)
			);

		const mapping = {
			cpu_compute: "fg-1",
			gpu_compute: "fg-2",
			cuda: "fg-3",
			data_mov: "fg-4"
		};

		// Clean up existing elements
		const containerID = "#" + containerName;
		d3.select(containerID).selectAll("*").remove();

		function zoomed({ transform }) {
			svg.attr("transform", transform);
		}

		const zoom = d3.zoom().scaleExtent([0.5, 1]).on("zoom", zoomed);

		let svg = d3
			.select(containerID)
			.append("svg")
			.attr("width", style.width - 50)
			.attr("preserveAspectRatio", "xMinYMin meet")
			.attr("height", style.height)
			.call(zoom)
			.append("svg:g");

		let links_g = svg
			.append("g")
			.attr("id", "links_group")
			.attr("transform", "translate(30, 0)");
		let nodes_g = svg
			.append("g")
			.attr("id", "nodes_group")
			.attr("transform", "translate(30, 0)");
		let vertices_g = svg
			.append("g")
			.attr("id", "vertices_group")
			.attr("transform", "translate(30, 0)");

		let colorScale = d3
			.scaleOrdinal()
			.domain([0, 3])
			.range(["#8dd3c7", "#D9241E", "#bebada", "#ffffb3"]);

		nodes.forEach((node) => {
			node.x0 = node.x;
			node.y0 = node.y;
		});

		let vg = vertices_g.selectAll("g").data(nodes);

		vg.exit().remove();
		vg = vg
			.enter()
			.append("g")
			.merge(vg)
			.attr(
				"id",
				(d) =>
					containerName +
					"-nodegroup-" +
					d.data.name.replace(/[|]/g, "")
			)
			.attr("class", "v-group");

		vg.append("circle")
			.attr("r", (d) => MIN_NODE_RADIUS)
			.attr("fill", (d) => {
				return COLORS[mapping[d.data.cat]];
			})
			.attr(
				"id",
				(d) =>
					containerName + "-node-" + d.data.name.replace(/[|]/g, "")
			)
			.attr("cx", (d) => d.y)
			.attr("cy", (d) => d.x)
			.classed("vertex_node", true)

		// create a tooltip
		var tooltip = svg.append("div")
			.style("position", "absolute")
			.style("visibility", "hidden")
			.text("I'm a circle!");

		// d3.select("")
		// 	.on("mouseover", function () { return tooltip.style("visibility", "visible"); })
		// 	.on("mousemove", function () { return tooltip.style("top", (event.pageY - 800) + "px").style("left", (event.pageX - 800) + "px"); })
		// 	.on("mouseout", function () { return tooltip.style("visibility", "hidden"); });


		vg.append("circle")
			.attr("r", (d) => 0)
			.attr("fill", (d) => {
				return COLORS[mapping[d.data.cat]];
			})
			.attr("cx", (d) => d.y)
			.attr("cy", (d) => d.x)
			.classed("pulse", true)

		// Per-type markers, as they don't inherit styles.
		const markerBoxWidth = 20;
		const markerBoxHeight = 20;
		const refX = markerBoxWidth / 2;
		const refY = markerBoxHeight / 2;
		const markerWidth = markerBoxWidth / 2;
		const markerHeight = markerBoxHeight / 2;
		const arrowPoints = [
			[-40, 0],
			[0, 50],
			[10, 50]
		];

		svg.append("defs")
			.append("marker")
			.attr("id", "arrow")
			.attr("viewBox", [0, 0, markerBoxWidth, markerBoxHeight])
			.attr("refX", refX)
			.attr("refY", refY)
			.attr("markerWidth", markerBoxWidth)
			.attr("markerHeight", markerBoxHeight)
			.attr("orient", "auto-start-reverse")
			.append("path")
			.attr("d", d3.line()(arrowPoints))
			.attr("stroke", "black");

		const link = d3
			.linkVertical()
			.x((d) => d.y)
			.y((d) => d.x);

		let lg = links_g.selectAll("line").data(links);
		lg.exit().remove();
		lg = lg
			.enter()
			.append("line")
			.merge(lg)
			.attr("x1", (d) => d.source.y)
			.attr("y1", (d) => d.source.x)
			.attr("x2", (d) => d.target.y)
			.attr("y2", (d) => d.target.x)
			.attr("class", "hyper_edge")
			.attr("stroke", "#7e7e7e")
			.style("opacity", 1)
			.style("stroke-width", 1.5)
			.attr(
				"id",
				(d) =>
					containerName +
					"-edge-" +
					d.source.data.name.replace(/[|]/g, "") +
					"-" +
					d.target.data.name.replace(/[|]/g, "")
			)
			.attr("marker-end", "url(#arrow)");

	}, [props]);

	// Effect to pulsate the CCT node based on the timeline window.
	useEffect(() => {
		if (Object.keys(window).length > 0) {
			let mapper = {};
			for (let i = 0; i < window.length; i += 1) {
				console.debug(window[i].content, window[i].dur);
				if (!(window[i].name in mapper)) {
					mapper[window[i].name] = 0;
				}
				mapper[window[i].name] += window[i].dur;
			}

			const max_val = Math.max(...Object.values(mapper));
			const min_val = Math.min(...Object.values(mapper));

			console.debug("Range: ", "[", min_val, ", ", max_val, "]");

			const radiusScale = d3
				.scaleLinear()
				.domain([min_val, max_val])
				.range([MIN_NODE_RADIUS, MAX_NODE_RADIUS]);

			// Add pulsating effect to nodes in the timeline view.
			// if (!appState) {
			// 	d3.selectAll(".v-group")
			// 		.select("circle")
			// 		.classed("pulse", (d) => {
			// 			if (d.data.name in mapper) return true;
			// 			return false;
			// 		});
			// } else {
			// 	d3.selectAll(".v-group")
			// 		.select("circle").classed("pulse", (d) => {
			// 			return false;
			// 		});
			// }


			// Clear the previous text.
			d3.selectAll(".v-group").selectAll("text").remove();

			// // Add text labels to nodes with more than a threshold of radius.
			let tooltip = d3.selectAll(".v-group")
				.append("text")
				.attr("font-size", theme.text.fontSize)
				.attr("x", (d) => d.y0 + 10)
				.attr("y", (d) => d.x0 + 10)
				.attr("class", "node-label")
				.attr("visibility", "hidden")
				.text((d) => {
					// if(d.data.name in mapper) 
					return d.data.name.slice(0, 10) + "...";
					// else return "";
				});

			// Add radius encoding to map to amount of data movement on a
			// particular function call.
			d3.selectAll(".v-group")
				.select("circle")
				.on("mouseover", (d) => { return tooltip.style("visibility", "visible"); })
				.on("mousemove", (d) => { return tooltip.style("top", (event.pageY - 800) + "px").style("left", (event.pageX - 800) + "px"); })
				.on("mouseout", (d) => { return tooltip.style("visibility", "hidden"); })
				.transition()
				.duration(1000)
				.attr("r", (d) => {
					if (d.data.name in mapper) {
						console.debug(
							d.data.name,
							radiusScale(mapper[d.data.name])
						);
						return radiusScale(mapper[d.data.name]);
					} else return MIN_NODE_RADIUS;
				})
				.attr("stroke", "#000")

		}
	}, [window]);

	useEffect(() => {
		if (appState) {
			console.debug("[d3-hyper-graph] Fetching the window!");
			dispatch(fetchWindow(windowStart, windowEnd));
		}
	}, [appState]);

	return <div id="cct-view"></div>;
}
