import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchCCT } from "../actions";
import D3HyperGraph from "../ui/d3-hyper-graph";

export default function CCTWrapper() {
	const dispatch = useDispatch();

	const selectedExperiment = useSelector((store) => store.selectedExperiment);
	const cct = useSelector((store) => store.cct);

	const [nodes, setNodes] = useState([]);
	const [links, setLinks] = useState([]);
	const [nodesDict, setNodesDict] = useState({});

	const containerID = useRef("cct-view");
	const style = {
		top: 30,
		right: 20,
		bottom: 10,
		left: 40,
		width: window.innerWidth / 3 - 30,
		height: window.innerHeight / 3 - 50
	};

	useEffect(() => {
		if (selectedExperiment !== "") {
			dispatch(fetchCCT());
		}
	}, [selectedExperiment]);

	// Collapse the node and all it's children
	function collapse(d) {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			d.children = null;
		}
	}

	function process(cct) {
		var treeData = {
			name: "cudaGetDeviceProperties",
			cat: "cuda",
			children: [
				{
					name: "fill_col_format",
					cat: "cpu_compute",
					children: [
						{
							name: "sgemm_v2",
							cat: "gpu_compute"
						}
					]
				},
				{
					name: "cudaMemcpy",
					cat: "data_mov",
					children: [
						{
							name: "Memcpy HtoD",
							cat: "data_mov",
							children: [
								{
									name: "Memcpy DtoH",
									cat: "data_mov"
								}
							]
						}
					]
				},
				{
					name: "cudaMalloc",
					cat: "data_mov",
					children: [
						{
							name: "cudaDeviceSynchronize",
							cat: "cuda",
							children: [
								{
									name: "cudaLaunchKernel",
									cat: "cuda",
									children: [
										{
											name: "cudaFree",
											cat: "cuda",
											children: [
												{
													name: "cudaFreeHost",
													cat: "cuda"
												}
											]
										}
									]
								}
							]
						}
					]
				}
			]
		};

		const treemap = d3.tree().size([style.height, style.width]);
		const root = d3.hierarchy(treeData);

		// Assigns the x and y position for the nodes
		var treeData = treemap(root);

		var _nodes = treeData.descendants(),
			_links = root.links();

		root.children.forEach(collapse);

		const _link_force = d3
			.forceLink(_links)
			.id((d) => d.name)
			.distance(0)
			.strength(1);
		d3.forceSimulation(_nodes)
			.force("link", _link_force)
			.force("charge", d3.forceManyBody().strength(-50))
			.force("x", d3.forceX())
			.force("y", d3.forceY());

		setNodes(_nodes);
		setLinks(_links);
	}

	useEffect(() => {
		if (nodes.length == 0) {
			process(cct);
		}
	}, [cct]);

	return (
		<Grid container>
			{nodes.length > 0 && links.length > 0 ? (
				<Card style={{ borderColor: "gray" }}>
					<D3HyperGraph
						containerName={containerID.current}
						style={style}
						nodes={nodes}
						links={links}
					/>
				</Card>
			) : (
				<CircularProgress />
			)}
		</Grid>
	);
}
