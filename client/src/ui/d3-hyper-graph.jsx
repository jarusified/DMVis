import * as d3 from "d3";
import { useEffect, useState } from "react";

export default function D3HyperGraph(props) {
	const { nodes, links, containerName, style } = props;

    function groupPath(vertices) {
        // not draw convex hull if vertices.length <= 1
        if(vertices.length >= 2){
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

	useEffect(() => {
		let node_dict = {};
		nodes.forEach((node) => {
			node.links_idx = { source: [], target: [] };
            console.log(node.id);
			node_dict[node.id] = node;
		});

        console.log(node_dict);

         for(let i=0; i<links.length; i++){
            let l = links[i];
            console.log(l, i);
            node_dict[l.source]["links_idx"].source.push(i);
            node_dict[l.target]["links_idx"].target.push(i);
        }

		// links.forEach((link, idx) => {
        //     console.log(link.source, idx, link.source, node_dict[link.source], node_dict[link.target]);
        //     if (node_dict[link.source].link_idx != undefined) {
		// 	    node_dict[link.source].links_idx.source.push(idx);
        //     }
        //     if (node_dict[link.target].link_idx != undefined)  {
		// 	    node_dict[link.target].links_idx.target.push(idx);
        //     }
		// });

		// let vertices2he = d3
		// 	.nest()
		// 	.key((d) => d.target)
		// 	.rollup((d) => d.map((node) => node.source))
		// 	.entries(links);
		// vertices2he = Object.assign(
		// 	{},
		// 	...vertices2he.map((s) => ({ [s.key]: s.value }))
		// );

		// let he2vertices = d3
		// 	.nest()
		// 	.key((d) => d.source)
		// 	.rollup((d) => d.map((node) => node.target))
		// 	.entries(links);
		// he2vertices = Object.assign(
		// 	{},
		// 	...he2vertices.map((s) => ({ [s.key]: s.value }))
		// );

        // Find the coordinates.
        let distance_scale = d3.scaleLinear()
            .domain([1,10])
            .range([30,120])

        links.forEach(l=>{
            let source_size = l.source.split(".").length;
            let target_size = l.target.split(".").length;
            l.distance = distance_scale(Math.min((source_size+target_size)/2, 10));
        })

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).distance(d => d.distance).id(d => d.id))
            .force("charge", d3.forceManyBody(-500))
            .force("center", d3.forceCenter(style.width, style.height))
            .force("x", d3.forceX().strength(0.02))
            .force("y", d3.forceY().strength(0.03))
            .stop();
        simulation.tick(300);

		const svg_width = parseFloat(
			d3.select("#" + containerName).style("width")
		);
		// const svg_height = window_height / 2 - 30;

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

        let links_g = svg.append('g')
            .attr("id", "links_group")
        
        let nodes_g = svg.append('g')
            .attr("id", "nodes_group")

        let vertices_g = svg.append('g')
            .attr("id", "vertices_group")

        let color_g = svg.append('g')
            .attr("id", "color_group")
        
        let colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        let pie = d3.pie()
            .value(d => d.value)
            .sort(null);

        let arc = d3.arc().innerRadius(0);

        nodes.forEach( node => {
            node.x0 = node.x;
            node.y0 = node.y;
        })

        let hg = nodes_g.selectAll("g").data(nodes.filter(d => d.bipartite == 1));
        console.log(nodes.filter(d => d.bipartite == 1));
        hg.exit().remove();
        hg = hg.enter().append("g").merge(hg)
            .attr("id", d => containerID + '-nodegroup-' + d.id.replace(/[|]/g,""))
            .attr("class", "he-group")

        hg.append("circle")
            .attr("r", d => get_node_radius(d.id))
            .attr("fill", d => d.color)
            .attr("id", d => containerID + '-node-' + d.id.replace(/[|]/g,""))
            .attr("cx", d=> d.x)
            .attr("cy", d=> d.y)
            .attr("class", "hyper_node")

        hg.append("text")
            .attr("dx", 12)
            .attr("dy", "0.35em")
            .attr("x", d=>d.x)
            .attr("y", d=>d.y)
            .attr("class", "node-label")
            .attr("id", d => containerID + '-text-' + d.id.replace(/[|]/g,""))
            .text(d => d.label);

        let vg = vertices_g.selectAll("g").data(nodes.filter(d => d.bipartite == 0))

        console.log(nodes.filter(d => d.bipartite == 0));

        vg.exit().remove();
        vg = vg.enter().append("g").merge(vg)
            .attr("id", d=> containerID + '-nodegroup-' + d.id.replace(/[|]/g,""))
            .attr("class", "v-group")

        vg.append("circle")
            .attr("r", d => get_node_radius(d.id))
            .attr("fill", "")
            .attr("id", d => containerID +'-node-'+ d.id.replace(/[|]/g,""))
            .attr("cx", d=>d.x)
            .attr("cy", d=>d.y)
            .classed("vertex_node", true);

        vg.append("text")
            .attr("dx", 12)
            .attr("dy", "0.35em")
            .attr("x", d=>d.x)
            .attr("y", d=>d.y)
            .attr("class", "node-label")
            .attr("id", d => containerID + '-text-' + d.id.replace(/[|]/g,""))
            .text(d => d.label);

        // let lg = links_g.selectAll("line").data(links);
        //     lg.exit().remove();
        //     lg = lg.enter().append("line").merge(lg)
        //         .attr("stroke-width", d => Math.sqrt(d.value))
        //         .attr("x1", d => d.source.x)
        //         .attr("y1", d => d.source.y)
        //         .attr("x2", d => d.target.x)
        //         .attr("y2", d => d.target.y)
        //         .attr("class", "hyper_edge")
        //         .attr("stroke", "gray")
        //         .attr("id", d => containerID + "-edge-" + d.source.id.replace(/[|]/g,"") + "-" + d.target.id.replace(/[|]/g,""))
    
         // draw convex hulls
        let links_new = [];
        links.forEach(l=>{
            links_new.push(l);
        })
        nodes.forEach(node=>{
            links_new.push({"source":node, "target":node});
        })
            
        console.log(links_new);
        
        // let groups = d3.nest()
        //     .key(d => d.source.id)
        //     .rollup(d => d.map(node => [node.target.x, node.target.y]))
        //     .entries(links_new);

        // console.log(groups);

        svg.select("g#hull-group").remove();

        let hulls = svg.select("g").insert("g", ":first-child")
            .attr("id", "hull-group")
            
        // hulls.selectAll("path").data(groups)
        //     .enter().append("path")
        //     .attr("fill", d => nodes_dict[d.key].color)
        //     .attr("stroke", d => nodes_dict[d.key].color)
        //     .attr("d", d => groupPath(d.value))
        //     .attr("id", d => svg_id+"-hull-"+d.key.replace(/[|]/g,""))
        //     .attr("class", "convex_hull")
  
	}, [props]);

	return <div id={containerName}></div>;
}
