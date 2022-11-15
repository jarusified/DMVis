import * as d3 from "d3";
import { useEffect } from "react";

import { COLORS } from "../helpers/utils";

export default function D3HyperGraph(props) {
	// Collapse the node and all it's children
	function collapse(d) {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			d.children = null;
		}
	}

	useEffect(() => {
		const { data, containerName, style } = props;

		const treemap = d3.tree().size([style.height, style.width]);
		const root = d3.hierarchy(data);

		// Assigns the x and y position for the nodes
		var tree = treemap(root);

		const nodes = tree.descendants();
		const links = root.links();

		root.children.forEach(collapse);

		const _link_force = d3
			.forceLink(links)
			.id((d) => d.data.name)
			.distance(0)
			.strength(1);

		const simulation = d3
			.forceSimulation(nodes)
			.force("link", _link_force)
			.force("charge", d3.forceManyBody().strength(-300))
			.force("x", d3.forceX())
			.force("y", d3.forceY())
			.force(
				"collide",
				d3.forceCollide((d) => 65)
			);

		const mapping = {
			cpu_compute: "fg-1",
			gpu_compute: "fg-2",
			cuda: "fg-3",
			data_mov: "fg-4"
		};

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

		function get_node_radius() {
			return 8;
		}

		// Clean up existing elements
		const containerID = "#" + containerName;
		d3.select(containerID).selectAll("*").remove();

		let svg = d3
			.select(containerID)
			.append("svg")
			.attr("width", style.width)
			.attr("height", style.height)
			.attr(
				"viewBox",
				`${0} ${-style.top} ${style.width} ${style.height}`
			);

		function zoomed({transform}) {
			svg.attr("transform", transform);
		}

		svg.call(d3.zoom()
			.extent([[0, 0], [style.width, style.height]])
			.scaleExtent([1, 8])
			.on("zoom", zoomed));

		let links_g = svg.append("g").attr("id", "links_group");
		let nodes_g = svg.append("g").attr("id", "nodes_group");
		let vertices_g = svg.append("g").attr("id", "vertices_group");

		let colorScale = d3
			.scaleOrdinal()
			.domain([0, 3])
			.range(["#8dd3c7", "#D9241E", "#bebada", "#ffffb3"]);

		let pie = d3
			.pie()
			.value((d) => d.value)
			.sort(null);

		let arc = d3.arc().innerRadius(0);

		nodes.forEach((node) => {
			node.x0 = node.x;
			node.y0 = node.y;
		});

		let hg = nodes_g.selectAll("g").data(nodes);
		hg.exit().remove();
		hg = hg
			.enter()
			.append("g")
			.merge(hg)
			.attr(
				"id",
				(d) =>
					containerName +
					"-nodegroup-" +
					d.data.name.replace(/[|]/g, "")
			)
			.attr("class", "he-group");

		hg.append("circle")
			.attr("r", (d) => {
				return get_node_radius(d.id);
			})
			.attr("fill", (d) => colorScale(d))
			.attr("stroke", "#000")
			.attr(
				"id",
				(d) =>
					containerName + "-node-" + d.data.name.replace(/[|]/g, "")
			)
			.attr("cx", (d) => d.x)
			.attr("cy", (d) => d.y)
			.attr("class", "hyper_node")
			.on("mouseover", (d, e) => {
				console.log(e.data.name);
			});

		hg.append("text")
			.attr("dx", 12)
			.attr("dy", "0.35em")
			.attr("x", (d) => d.x)
			.attr("y", (d) => d.y)
			.attr("class", "node-label")
			.attr(
				"id",
				(d) =>
					containerName + "-text-" + d.data.name.replace(/[|]/g, "")
			)
			.text((d) => d.id);

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
			.attr("r", (d) => get_node_radius(d.data.name))
			.attr("fill", (d) => {
				return COLORS[mapping[d.data.cat]];
			})
			.attr(
				"id",
				(d) =>
					containerName + "-node-" + d.data.name.replace(/[|]/g, "")
			)
			.attr("cx", (d) => d.x)
			.attr("cy", (d) => d.y)
			.classed("vertex_node", true);

		vg.append("text")
			.attr("dx", 12)
			.attr("dy", "0.35em")
			.attr("x", (d) => d.x)
			.attr("y", (d) => d.y)
			.attr("class", "node-label")
			.attr(
				"id",
				(d) =>
					containerName + "-text-" + d.data.name.replace(/[|]/g, "")
			)
			.text((d) => d.data.name);

		let lg = links_g.selectAll("line").data(links);
		lg.exit().remove();
		lg = lg
			.enter()
			.append("line")
			.merge(lg)
			.attr("stroke-width", (d) => 3)
			.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y)
			.attr("class", "hyper_edge")
			.attr("stroke", "gray")
			.attr(
				"id",
				(d) =>
					containerName +
					"-edge-" +
					d.source.data.name.replace(/[|]/g, "") +
					"-" +
					d.target.data.name.replace(/[|]/g, "")
			);

		// draw convex hulls
		let links_new = [];
		links.forEach((l) => {
			links_new.push(l);
		});
		nodes.forEach((node) => {
			links_new.push({ source: node, target: node });
		});

		// let groups = d3.rollup(links_new,
		//     d => d.source.id)
		// d => d.map(node => [node.target.x, node.target.y]));

		// console.log(groups);

		svg.select("g#hull-group").remove();

		let hulls = svg
			.select("g")
			.insert("g", ":first-child")
			.attr("id", "hull-group");

		// hulls.selectAll("path").data(groups)
		//     .enter().append("path")
		//     .attr("fill", d => nodes_dict[d.key].color)
		//     .attr("stroke", d => nodes_dict[d.key].color)
		//     .attr("d", d => groupPath(d.value))
		//     .attr("id", d => svg_id+"-hull-"+d.key.replace(/[|]/g,""))
		//     .attr("class", "convex_hull")

		const linkArc = (d) =>
			`M${d.source.x},${d.source.y}A0,0 0 0,1 ${d.target.x},${d.target.y}`;

		// simulation.on("tick", () => {
		// 	links_g.attr("d", linkArc);
		// 	nodes_g.attr("transform", d => `translate(${d.x},${d.y})`);
		// });

		// invalidation.then(() => simulation.stop());
	}, [props]);

	return <div id="cct-view"></div>;
}
