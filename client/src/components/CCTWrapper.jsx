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
		height: window.innerHeight / 3 - 20
	};

	// useEffect(() => {
	// 	if (selectedExperiment !== "") {
	// 		dispatch(fetchCCT());
	// 	}
	// }, [selectedExperiment]);

	const treeData = {
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
				cat: "cuda",
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
				cat: "cuda",
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

	return (
		<Grid container>
			{Object.keys(treeData).length > 0 ? (
				<Card style={{ borderColor: "gray" }}>
					<D3HyperGraph
						containerName={containerID.current}
						style={style}
						data={treeData}
					/>
				</Card>
			) : (
				<CircularProgress />
			)}
		</Grid>
	);
}
