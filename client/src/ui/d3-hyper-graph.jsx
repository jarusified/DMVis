import * as d3 from "d3";
import { useEffect } from "react";

export default function D3HyperGraph(props) {
	useEffect(() => {
		const { nodes, links, containerName, style, node_dict } = props;

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
				`${-style.width / 2} ${-style.height / 2} ${style.width} ${
					style.height
				}`
			);

		let links_g = svg.append("g").attr("id", "links_group");

		let nodes_g = svg.append("g").attr("id", "nodes_group");

		let vertices_g = svg.append("g").attr("id", "vertices_group");

		let color_g = svg.append("g").attr("id", "color_group");

		let colorScale = d3.scaleOrdinal(d3.schemeCategory10);
		let pie = d3
			.pie()
			.value((d) => d.value)
			.sort(null);

		let arc = d3.arc().innerRadius(0);

		nodes.forEach((node) => {
			node.x0 = node.x;
			node.y0 = node.y;
		});

		let hg = nodes_g
			.selectAll("g")
			.data(nodes.filter((d) => d.bipartite == 1));
		hg.exit().remove();
		hg = hg
			.enter()
			.append("g")
			.merge(hg)
			.attr(
				"id",
				(d) => containerName + "-nodegroup-" + d.id.replace(/[|]/g, "")
			)
			.attr("class", "he-group");

		hg.append("circle")
			.attr("r", (d) => get_node_radius(d.id))
			.attr("fill", (d) => d.color)
			.attr(
				"id",
				(d) => containerName + "-node-" + d.id.replace(/[|]/g, "")
			)
			.attr("cx", (d) => d.x)
			.attr("cy", (d) => d.y)
			.attr("class", "hyper_node");

		hg.append("text")
			.attr("dx", 12)
			.attr("dy", "0.35em")
			.attr("x", (d) => d.x)
			.attr("y", (d) => d.y)
			.attr("class", "node-label")
			.attr(
				"id",
				(d) => containerName + "-text-" + d.id.replace(/[|]/g, "")
			)
			.text((d) => d.label);

		let vg = vertices_g
			.selectAll("g")
			.data(nodes.filter((d) => d.bipartite == 0));

		console.log(nodes.filter((d) => d.bipartite == 0));

		vg.exit().remove();
		vg = vg
			.enter()
			.append("g")
			.merge(vg)
			.attr(
				"id",
				(d) => containerName + "-nodegroup-" + d.id.replace(/[|]/g, "")
			)
			.attr("class", "v-group");

		vg.append("circle")
			.attr("r", (d) => get_node_radius(d.id))
			.attr("fill", "")
			.attr(
				"id",
				(d) => containerName + "-node-" + d.id.replace(/[|]/g, "")
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
				(d) => containerName + "-text-" + d.id.replace(/[|]/g, "")
			)
			.text((d) => d.label);

		let lg = links_g.selectAll("line").data(links);
		lg.exit().remove();
		lg = lg.enter().append("line").merge(lg)
			.attr("stroke-width", d => Math.sqrt(d.value))
			.attr("x1", d => d.source.x)
			.attr("y1", d => d.source.y)
			.attr("x2", d => d.target.x)
			.attr("y2", d => d.target.y)
			.attr("class", "hyper_edge")
			.attr("stroke", "gray")
			.attr("id", d => containerID + "-edge-" + d.source.id.replace(/[|]/g,"") + "-" + d.target.id.replace(/[|]/g,""))

		// draw convex hulls
		let links_new = [];
		links.forEach((l) => {
			links_new.push(l);
		});
		nodes.forEach((node) => {
			links_new.push({ source: node, target: node });
		});

		// let groups = d3.nest()
		//     .key(d => d.source.id)
		//     .rollup(d => d.map(node => [node.target.x, node.target.y]))
		//     .entries(links_new);

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
	}, [props]);

	return <div id="cct-view"></div>;
}
